import { NextResponse } from 'next/server';
import { siteConfig } from '@/src/config/site.config';
import { buildXmlSitemapIndex } from '@/src/lib/seo/sitemapBuilder';

export const dynamic = 'force-static';

export const SITEMAP_SHARDS = [
  'tools',
  'time-now',
  'actual-size',
  'emojis',
  'symbols',
  'timers',
  'catalogs',
  'core',
] as const;

export function GET() {
  const now = new Date().toISOString().split('T')[0];
  const sitemaps = SITEMAP_SHARDS.map((shard) => ({
    loc: `${siteConfig.baseUrl}/sitemaps/${shard}.xml`,
    lastmod: now,
  }));

  const body = buildXmlSitemapIndex(sitemaps);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
