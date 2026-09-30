import { NextRequest, NextResponse } from 'next/server';
import { SITEMAP_SEGMENTS, type SitemapSegmentId } from '@/src/seo/sitemapEntries';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return SITEMAP_SEGMENTS.map((segment) => ({ path: [`${segment.id}.xml`] }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const fileName = path.at(-1) || '';
  const id = fileName.replace(/\.xml$/, '') as SitemapSegmentId;
  const segment = SITEMAP_SEGMENTS.find((item) => item.id === id);

  if (!segment || fileName !== `${segment.id}.xml`) {
    return new NextResponse('Sitemap segment not found', { status: 404 });
  }

  const urls = segment.build();
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls.map((entry) => {
      const alternates = entry.alternates?.languages
        ? Object.entries(entry.alternates.languages)
            .filter((item): item is [string, string] => typeof item[1] === 'string')
            .map(([lang, href]) =>
              `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`
            )
        : [];

      return [
        '  <url>',
        `    <loc>${escapeXml(entry.url)}</loc>`,
        ...alternates,
        entry.lastModified ? `    <lastmod>${escapeXml(new Date(entry.lastModified).toISOString())}</lastmod>` : '',
        entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : '',
        typeof entry.priority === 'number' ? `    <priority>${entry.priority}</priority>` : '',
        '  </url>',
      ].filter(Boolean).join('\n');
    }),
    '</urlset>',
  ].join('\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
