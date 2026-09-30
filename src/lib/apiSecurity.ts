import { NextRequest } from 'next/server';
import { lookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import { Agent, fetch as undiciFetch } from 'undici';
import { BlockList, isIP, type LookupFunction } from 'node:net';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const MAX_URL_LENGTH = 2048;
const RATE_LIMIT_CLEANUP_INTERVAL = 128;

export class ApiRouteError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiRouteError';
  }
}

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, RateLimitEntry>();
  let checks = 0;

  return function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    checks += 1;
    if (checks % RATE_LIMIT_CLEANUP_INTERVAL === 0) {
      for (const [key, entry] of buckets) {
        if (now > entry.resetAt) buckets.delete(key);
      }
    }

    const entry = buckets.get(ip);
    if (!entry || now > entry.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }

    entry.count += 1;
    return entry.count > limit;
  };
}

function isTrustedProxyRequest(): boolean {
  return process.env.TRUST_PROXY === 'true'
    || Boolean(process.env.VERCEL)
    || Boolean(process.env.CF_PAGES)
    || process.env.NETLIFY === 'true';
}

export function getClientIp(request: Request): string {
  const directIp = request.headers.get('x-real-ip')?.trim();
  if (!isTrustedProxyRequest()) return directIp || 'unknown';

  return (
    request.headers.get('cf-connecting-ip')?.trim()
    || request.headers.get('x-nf-client-connection-ip')?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || directIp
    || 'unknown'
  );
}

export async function readJsonBody<T = unknown>(request: NextRequest, maxBytes: number): Promise<T> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType && !contentType.includes('application/json')) {
    throw new ApiRouteError('Content-Type must be application/json', 415);
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new ApiRouteError('Request body too large', 413);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new ApiRouteError('Request body too large', 413);
  }

  try {
    return JSON.parse(raw || '{}') as T;
  } catch {
    throw new ApiRouteError('Invalid JSON body', 400);
  }
}

const BLOCKED_IPV4_NETWORKS = new BlockList();
const BLOCKED_IPV6_NETWORKS = new BlockList();

for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  BLOCKED_IPV4_NETWORKS.addSubnet(network, prefix, 'ipv4');
}

for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['::', 96],
  ['::ffff:0:0', 96],
  ['64:ff9b::', 96],
  ['100::', 64],
  ['2001:2::', 48],
  ['2001:10::', 28],
  ['2001:20::', 28],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
] as const) {
  BLOCKED_IPV6_NETWORKS.addSubnet(network, prefix, 'ipv6');
}

function normalizeHostname(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .replace(/\.$/, '');
}

export function isBlockedPublicFetchHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === 'metadata.google.internal') return true;
  if (!host.includes('.') && !host.includes(':')) return true;

  const ipVersion = isIP(host);
  if (ipVersion === 4) return BLOCKED_IPV4_NETWORKS.check(host, 'ipv4');
  if (ipVersion === 6) return BLOCKED_IPV6_NETWORKS.check(host, 'ipv6');
  if (host.includes(':')) return true;

  return false;
}

type NormalizeUrlOptions = {
  base?: string;
  stripHash?: boolean;
  stripSearch?: boolean;
};

export function normalizePublicHttpUrl(rawUrl: string, options: NormalizeUrlOptions = {}): URL {
  const candidate = rawUrl.trim();
  if (!candidate || candidate.length > MAX_URL_LENGTH || /[\u0000-\u001f\u007f]/.test(candidate)) {
    throw new ApiRouteError('Invalid URL', 400);
  }
  const prepared = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  const url = options.base ? new URL(candidate, options.base) : new URL(prepared);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ApiRouteError('Only HTTP/HTTPS URLs are allowed', 400);
  }
  if (url.username || url.password) {
    throw new ApiRouteError('URLs with credentials are not allowed', 400);
  }
  if (isBlockedPublicFetchHost(url.hostname)) {
    throw new ApiRouteError('Private or local addresses are not allowed', 400);
  }

  if (options.stripHash !== false) url.hash = '';
  if (options.stripSearch) url.search = '';
  return url;
}

export type PublicHostResolver = (hostname: string) => Promise<LookupAddress[]>;

const resolveHostWithDns: PublicHostResolver = async (hostname) =>
  lookup(hostname, { all: true, verbatim: true }) as Promise<LookupAddress[]>;

export async function resolvePublicHost(
  url: URL,
  resolver: PublicHostResolver = resolveHostWithDns,
): Promise<LookupAddress[]> {
  if (isBlockedPublicFetchHost(url.hostname)) {
    throw new ApiRouteError('Private or local addresses are not allowed', 400);
  }

  const normalizedHost = normalizeHostname(url.hostname);
  const ipVersion = isIP(normalizedHost);
  if (ipVersion) {
    return [{ address: normalizedHost, family: ipVersion }];
  }

  let records: LookupAddress[];
  try {
    records = await resolver(url.hostname);
  } catch {
    throw new ApiRouteError('Host could not be resolved', 400);
  }

  if (
    records.length === 0
    || records.some(
      (record) =>
        (record.family !== 4 && record.family !== 6)
        || isBlockedPublicFetchHost(record.address),
    )
  ) {
    throw new ApiRouteError('Private or local addresses are not allowed', 400);
  }
  return records;
}

type SafeFetchTextOptions = {
  accept: string;
  userAgent: string;
  timeoutMs: number;
  maxBytes: number;
  allowedContentTypes: RegExp;
  maxRedirects?: number;
  resolver?: PublicHostResolver;
};

function createPinnedAgent(address: LookupAddress): Agent {
  const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [address]);
      return;
    }
    callback(null, address.address, address.family);
  };

  return new Agent({ connect: { lookup: pinnedLookup } });
}

export async function safeFetchText(rawUrl: string, options: SafeFetchTextOptions): Promise<{ text: string; contentType: string; status: number }> {
  let currentUrl = normalizePublicHttpUrl(rawUrl).toString();
  const maxRedirects = options.maxRedirects ?? 5;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const resolvedAddresses = await resolvePublicHost(
      new URL(currentUrl),
      options.resolver,
    );
    const dispatcher = createPinnedAgent(resolvedAddresses[0]);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      // The dispatcher connects to the address that was validated above while
      // preserving the original hostname for TLS SNI and the Host header. DNS
      // therefore cannot change between validation and the actual connection.
      const response = await undiciFetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': options.userAgent,
          Accept: options.accept,
        },
        redirect: 'manual',
        signal: controller.signal,
        dispatcher,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new ApiRouteError(`HTTP ${response.status}`, 502);
        await response.body?.cancel().catch(() => {});
        currentUrl = normalizePublicHttpUrl(location, { base: currentUrl }).toString();
        continue;
      }

      if (!response.ok) {
        throw new ApiRouteError(`HTTP ${response.status}`, 502);
      }

      const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
      if (!options.allowedContentTypes.test(contentType)) {
        throw new ApiRouteError('Response content type is not allowed', 422);
      }

      const contentLength = Number(response.headers.get('content-length') || 0);
      if (Number.isFinite(contentLength) && contentLength > options.maxBytes) {
        throw new ApiRouteError('Response too large', 413);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new ApiRouteError('No response body', 502);

      const chunks: Uint8Array[] = [];
      let total = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > options.maxBytes) {
          await reader.cancel().catch(() => {});
          throw new ApiRouteError('Response too large', 413);
        }
        chunks.push(value);
      }

      const buffer = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.byteLength;
      }

      return {
        text: new TextDecoder('utf-8', { fatal: false }).decode(buffer),
        contentType,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof ApiRouteError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiRouteError('Request timed out', 504);
      }
      throw new ApiRouteError('Fetch failed', 502);
    } finally {
      clearTimeout(timeout);
      await dispatcher.close().catch(() => {});
    }
  }

  throw new ApiRouteError('Too many redirects', 508);
}
