import { NextRequest, NextResponse } from "next/server";
import {
  ApiRouteError,
  createRateLimiter,
  getClientIp,
  normalizePublicHttpUrl,
  readJsonBody,
  safeFetchText,
} from "@/src/lib/apiSecurity";

const DEFAULT_MAX_PAGES = 500;
const HARD_MAX_PAGES = 2000;
const MAX_QUEUE_SIZE = 5000;
const MAX_SITEMAP_FILES = 25;
const MAX_SITEMAP_LOCS = 5000;
const MAX_LINKS_PER_PAGE = 500;
const MAX_REQUEST_BODY = 8 * 1024;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_FETCH_REDIRECTS = 2;
const CRAWL_DEADLINE_MS = 25_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const isRateLimited = createRateLimiter(10, 60_000);

function normalizeUrl(rawUrl: string, base?: string): string | null {
  try {
    const url = normalizePublicHttpUrl(rawUrl, { base, stripSearch: true });
    url.hash = "";
    url.search = "";
    let normalized = url.toString();
    if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    return normalized;
  } catch {
    return null;
  }
}

function hasOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function shouldSkipUrl(url: string): boolean {
  return /\.(?:jpg|jpeg|png|gif|webp|svg|ico|pdf|zip|rar|7z|gz|mp3|mp4|avi|mov|woff2?|ttf|eot)$/i.test(
    url,
  );
}

function extractLinks(html: string): string[] {
  const links: string[] = [];
  const hrefRegex = /<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  return links;
}

async function fetchHtml(
  url: string,
  timeoutMs: number,
): Promise<string | null> {
  const result = await fetchText(
    url,
    "text/html,application/xhtml+xml",
    /text\/html/i,
    timeoutMs,
  );
  if (!result) return null;
  return result.text;
}

async function fetchText(
  url: string,
  acceptHeader: string,
  allowedContentTypes: RegExp = /(?:text\/|xml)/i,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<{ text: string; contentType: string } | null> {
  try {
    const perAttemptTimeout = Math.max(
      1,
      Math.floor(timeoutMs / (MAX_FETCH_REDIRECTS + 1)),
    );
    const response = await safeFetchText(url, {
      accept: acceptHeader,
      userAgent: "UltimateToolsSitemapBot/1.0 (+https://ulti-tools.com)",
      timeoutMs: perAttemptTimeout,
      maxBytes: MAX_RESPONSE_BYTES,
      allowedContentTypes,
      maxRedirects: MAX_FETCH_REDIRECTS,
    });
    return { text: response.text, contentType: response.contentType };
  } catch {
    return null;
  }
}

function remainingRequestTime(deadline: number): number {
  return Math.max(1, Math.min(REQUEST_TIMEOUT_MS, deadline - Date.now()));
}

function decodeXmlCodePoint(entity: string, code: string, radix: number) {
  const value = Number.parseInt(code, radix);
  return Number.isInteger(value) && value >= 0 && value <= 0x10ffff
    ? String.fromCodePoint(value)
    : entity;
}

function extractSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const locRegex = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xml)) !== null) {
    locs.push(
      match[1]
        .trim()
        .replace(/&#x([0-9a-f]+);/gi, (entity: string, code: string) =>
          decodeXmlCodePoint(entity, code, 16),
        )
        .replace(/&#([0-9]+);/g, (entity: string, code: string) =>
          decodeXmlCodePoint(entity, code, 10),
        )
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&amp;/gi, "&"),
    );
  }
  return locs;
}

async function discoverSitemapUrls(
  origin: string,
  deadline: number,
): Promise<{ urls: string[]; limited: boolean; timedOut: boolean }> {
  const discovered = new Set<string>();
  const queue: string[] = [];
  const seenSitemapFiles = new Set<string>();
  let limited = false;

  const defaultSitemap = `${origin}/sitemap.xml`;
  queue.push(defaultSitemap);
  seenSitemapFiles.add(defaultSitemap);

  const robots =
    Date.now() < deadline
      ? await fetchText(
          `${origin}/robots.txt`,
          "text/plain,text/*",
          /(?:text\/|xml)/i,
          remainingRequestTime(deadline),
        )
      : null;
  if (robots) {
    const lines = robots.text.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*sitemap:\s*(.+)\s*$/i);
      if (!match) continue;
      const normalized = normalizeUrl(match[1]);
      if (
        !normalized ||
        !hasOrigin(normalized, origin) ||
        seenSitemapFiles.has(normalized)
      )
        continue;
      if (seenSitemapFiles.size >= MAX_SITEMAP_FILES) {
        limited = true;
        break;
      }
      seenSitemapFiles.add(normalized);
      queue.push(normalized);
    }
  }

  while (queue.length > 0 && Date.now() < deadline) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl) continue;
    const response = await fetchText(
      sitemapUrl,
      "application/xml,text/xml,text/plain,*/*",
      /(?:text\/|xml)/i,
      remainingRequestTime(deadline),
    );
    if (!response) continue;

    const locs = extractSitemapLocs(response.text);
    for (const loc of locs) {
      if (Date.now() >= deadline) break;
      const normalized = normalizeUrl(loc);
      if (!normalized || !hasOrigin(normalized, origin)) continue;
      if (normalized.endsWith(".xml")) {
        if (seenSitemapFiles.size >= MAX_SITEMAP_FILES) {
          limited = true;
          continue;
        }
        if (seenSitemapFiles.has(normalized)) continue;
        seenSitemapFiles.add(normalized);
        queue.push(normalized);
        continue;
      }
      if (shouldSkipUrl(normalized)) continue;
      if (discovered.size >= MAX_SITEMAP_LOCS) {
        limited = true;
        break;
      }
      discovered.add(normalized);
    }
  }

  return {
    urls: Array.from(discovered),
    limited,
    timedOut: queue.length > 0 && Date.now() >= deadline,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }
    const body = await readJsonBody<{ url?: unknown; maxPages?: unknown }>(
      request,
      MAX_REQUEST_BODY,
    );
    const startUrlRaw = String(body?.url ?? "").trim();
    const requestedMaxPages = Number(body?.maxPages ?? DEFAULT_MAX_PAGES);
    const requestedUnlimited = requestedMaxPages === 0;
    const maxPages = requestedUnlimited
      ? HARD_MAX_PAGES
      : Math.max(1, Math.min(HARD_MAX_PAGES, Math.floor(requestedMaxPages)));

    const startUrl = normalizeUrl(startUrlRaw);
    if (!startUrl) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const origin = new URL(startUrl).origin;
    const visited = new Set<string>();
    const queue: string[] = [startUrl];
    const queued = new Set<string>(queue);
    const discovered: string[] = [];
    const deadline = Date.now() + CRAWL_DEADLINE_MS;
    let queueLimited = false;

    const sitemapDiscoveryDeadline = Math.min(deadline, Date.now() + 8000);
    const sitemapDiscovery = await discoverSitemapUrls(
      origin,
      sitemapDiscoveryDeadline,
    );
    queueLimited = sitemapDiscovery.limited;
    for (const sitemapUrl of sitemapDiscovery.urls) {
      if (queued.size >= MAX_QUEUE_SIZE) {
        queueLimited = true;
        break;
      }
      if (!queued.has(sitemapUrl)) {
        queue.push(sitemapUrl);
        queued.add(sitemapUrl);
      }
    }

    while (
      queue.length > 0 &&
      visited.size < maxPages &&
      Date.now() < deadline
    ) {
      const current = queue.shift();
      if (current) queued.delete(current);
      if (!current || visited.has(current)) continue;
      visited.add(current);
      discovered.push(current);

      const html = await fetchHtml(current, remainingRequestTime(deadline));
      if (!html) continue;

      const links = extractLinks(html).slice(0, MAX_LINKS_PER_PAGE);
      for (const rawLink of links) {
        const normalized = normalizeUrl(rawLink, current);
        if (!normalized) continue;
        if (!hasOrigin(normalized, origin)) continue;
        if (shouldSkipUrl(normalized)) continue;
        if (visited.has(normalized) || queued.has(normalized)) continue;
        if (queued.size >= MAX_QUEUE_SIZE) {
          queueLimited = true;
          break;
        }
        queue.push(normalized);
        queued.add(normalized);
      }
    }
    const timedOut =
      sitemapDiscovery.timedOut || (queue.length > 0 && Date.now() >= deadline);

    return NextResponse.json({
      urls: discovered,
      scanned: visited.size,
      limited: requestedUnlimited
        ? visited.size >= HARD_MAX_PAGES
        : visited.size >= maxPages,
      timedOut,
      queueLimited,
      maxPages,
      hardMaxPages: HARD_MAX_PAGES,
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Failed to crawl site" },
      { status: 500 },
    );
  }
}
