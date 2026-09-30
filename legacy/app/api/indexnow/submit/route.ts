import { NextRequest, NextResponse } from 'next/server';
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  chunkUrls,
  getAllIndexableUrls,
  getIndexNowHost,
  getIndexNowKeyLocation,
} from '@/src/seo/indexNow';
import {
  ApiRouteError,
  createRateLimiter,
  getClientIp,
  readJsonBody,
} from '@/src/lib/apiSecurity';

const DEFAULT_BATCH_SIZE = 10000;
const MAX_REQUESTED_URLS = 10000;
const MAX_URL_LENGTH = 2048;
const MAX_REQUEST_BODY = 512 * 1024;
const SUBMIT_TIMEOUT_MS = 10_000;
const isRateLimited = createRateLimiter(3, 60_000);

type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

function hasSubmitAccess(request: NextRequest): boolean {
  const token = process.env.INDEXNOW_SUBMIT_TOKEN;
  if (!token) return process.env.NODE_ENV !== 'production';

  const headerToken = request.headers.get('x-indexnow-token');
  const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return headerToken === token || bearerToken === token;
}

export function normalizeSubmitUrl(
  value: unknown,
  host: string,
  allowedUrls: ReadonlySet<string>,
): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw || raw.length > MAX_URL_LENGTH) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (url.host !== host) return null;
    url.hash = '';
    if (url.search) return null;
    const normalized = url.toString();
    return allowedUrls.has(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

async function submitBatch(payload: IndexNowPayload): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
  try {
    return await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSubmitAccess(request)) {
      return NextResponse.json(
        { error: 'IndexNow submit token is required in production' },
        { status: 401 }
      );
    }

    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await readJsonBody<{ urlList?: unknown }>(request, MAX_REQUEST_BODY);
    const host = getIndexNowHost();
    if (!Array.isArray(body?.urlList) || body.urlList.length === 0) {
      return NextResponse.json(
        { error: 'A non-empty changed canonical URL list is required.' },
        { status: 400 },
      );
    }
    if (body.urlList.length > MAX_REQUESTED_URLS) {
      return NextResponse.json(
        { error: `At most ${MAX_REQUESTED_URLS} URLs can be submitted.` },
        { status: 400 },
      );
    }

    const allowedUrls = new Set(getAllIndexableUrls());
    const requestedUrls = body.urlList.map((url: unknown) =>
      normalizeSubmitUrl(url, host, allowedUrls),
    );
    if (requestedUrls.some((url) => !url)) {
      return NextResponse.json(
        { error: 'Every URL must be an HTTPS canonical URL from the public inventory.' },
        { status: 400 },
      );
    }
    const sameHostUrls = Array.from(new Set(requestedUrls as string[]));

    if (sameHostUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs to submit for configured host.' },
        { status: 400 }
      );
    }

    const batches = chunkUrls(sameHostUrls, DEFAULT_BATCH_SIZE);
    const keyLocation = getIndexNowKeyLocation();
    const statuses: Array<{ batch: number; submitted: number; status: number; ok: boolean }> = [];

    for (let i = 0; i < batches.length; i += 1) {
      const payload: IndexNowPayload = {
        host,
        key: INDEXNOW_KEY,
        keyLocation,
        urlList: batches[i],
      };

      const response = await submitBatch(payload);

      statuses.push({
        batch: i + 1,
        submitted: batches[i].length,
        status: response.status,
        ok: response.ok,
      });
    }

    const ok = statuses.every((item) => item.ok);
    return NextResponse.json(
      {
        ok,
        host,
        keyLocation,
        totalSubmitted: sameHostUrls.length,
        batches: statuses.length,
        statuses,
      },
      { status: ok ? 200 : 502 }
    );
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'IndexNow submit failed' },
      { status: 500 }
    );
  }
}
