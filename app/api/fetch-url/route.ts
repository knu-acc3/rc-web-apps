import { NextRequest, NextResponse } from 'next/server';
import {
  ApiRouteError,
  createRateLimiter,
  getClientIp,
  readJsonBody,
  safeFetchText,
} from '@/src/lib/apiSecurity';
import { siteConfig } from '@/src/config/site.config';

const MAX_REQUEST_BODY = 4 * 1024;
const MAX_RESPONSE_BODY = 2 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const isRateLimited = createRateLimiter(10, 60_000);

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await readJsonBody<{ url?: unknown }>(request, MAX_REQUEST_BODY);
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result = await safeFetchText(url, {
      accept: 'text/html,application/xhtml+xml,text/plain,text/xml,application/xml,*/*',
      userAgent: `${siteConfig.brandName}/1.0 (${siteConfig.baseUrl})`,
      timeoutMs: TIMEOUT_MS,
      maxBytes: MAX_RESPONSE_BODY,
      allowedContentTypes: /(?:text\/|html|xml)/i,
    });

    return NextResponse.json({ html: result.text, status: result.status });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
