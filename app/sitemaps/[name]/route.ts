import { NextResponse } from 'next/server';
import { siteConfig } from '@/src/config/site.config';
import { buildXmlUrlset, type SitemapUrl } from '@/src/lib/seo/sitemapBuilder';
import { tools, toolGroups } from '@/src/data/tools';
import locationsData from '@/src/data/time-now/locations.json';
import devicesData from '@/src/data/actual-size/devices.json';
import emojiCategoriesData from '@/src/data/emojis/categories.json';
import timerPresetsData from '@/src/data/timers/presets.json';
import timerEventsData from '@/src/data/timers/events.json';
import { AVAILABLE_CATALOG_IDS, getCatalogItems } from '@/src/lib/catalogs/loadCatalog';
import { DIAGNOSTIC_SLUGS } from '@/src/lib/diagnostics/metrics';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [
    { name: 'tools.xml' },
    { name: 'time-now.xml' },
    { name: 'actual-size.xml' },
    { name: 'emojis.xml' },
    { name: 'symbols.xml' },
    { name: 'timers.xml' },
    { name: 'catalogs.xml' },
    { name: 'core.xml' },
  ];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const shard = name.replace(/\.xml$/, '');
  const validShards = new Set([
    'tools',
    'time-now',
    'actual-size',
    'emojis',
    'symbols',
    'timers',
    'catalogs',
    'core',
  ]);
  if (!validShards.has(shard)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  const now = new Date().toISOString().split('T')[0];
  const baseUrl = siteConfig.baseUrl;

  let urls: SitemapUrl[] = [];

  const createLocalizedEntries = (
    pathWithoutLocale: string,
    changefreq: SitemapUrl['changefreq'] = 'weekly',
    priority: number = 0.8
  ): SitemapUrl[] => {
    const cleanPath = pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`;
    const ruUrl = `${baseUrl}/ru${cleanPath}`;
    const enUrl = `${baseUrl}/en${cleanPath}`;
    const alternates = [
      { lang: 'ru', href: ruUrl },
      { lang: 'en', href: enUrl },
      { lang: 'x-default', href: ruUrl },
    ];
    return [
      {
        loc: ruUrl,
        lastmod: now,
        changefreq,
        priority,
        alternates,
      },
      {
        loc: enUrl,
        lastmod: now,
        changefreq,
        priority,
        alternates,
      },
    ];
  };

  if (shard === 'tools') {
    const implementedTools = tools.filter((t) => t.implemented && !t.hidden);
    urls = implementedTools.flatMap((t) =>
      createLocalizedEntries(`/tools/${t.slug}`, 'weekly', 0.9)
    );
  } else if (shard === 'time-now') {
    urls.push(...createLocalizedEntries('/time-now', 'hourly', 0.9));
    for (const loc of locationsData) {
      urls.push(...createLocalizedEntries(`/time-now/${loc.slug}`, 'hourly', 0.8));
    }
  } else if (shard === 'actual-size') {
    urls.push(...createLocalizedEntries('/actual-size', 'monthly', 0.9));
    urls.push(...createLocalizedEntries('/actual-size/ruler', 'monthly', 0.8));
    urls.push(...createLocalizedEntries('/actual-size/credit-card', 'monthly', 0.8));
    for (const dev of devicesData) {
      urls.push(...createLocalizedEntries(`/actual-size/${dev.slug}`, 'monthly', 0.8));
    }
  } else if (shard === 'emojis') {
    urls.push(...createLocalizedEntries('/emojis', 'monthly', 0.8));
    for (const cat of emojiCategoriesData) {
      urls.push(...createLocalizedEntries(`/emojis/${cat.id}`, 'monthly', 0.7));
    }
  } else if (shard === 'symbols') {
    urls.push(...createLocalizedEntries('/symbols', 'monthly', 0.8));
    const symbolCategories = ['math', 'arrows', 'currency', 'stars', 'kaomoji'];
    for (const cat of symbolCategories) {
      urls.push(...createLocalizedEntries(`/symbols/${cat}`, 'monthly', 0.7));
    }
  } else if (shard === 'timers') {
    urls.push(...createLocalizedEntries('/timer', 'daily', 0.9));
    for (const evt of timerEventsData) {
      urls.push(...createLocalizedEntries(`/timer/${evt.slug}`, 'daily', 0.8));
    }
    for (const p of timerPresetsData) {
      const slug = p.id.replace(/^preset-/, '');
      urls.push(...createLocalizedEntries(`/timer/${slug}`, 'daily', 0.8));
    }
  } else if (shard === 'catalogs') {
    urls.push(...createLocalizedEntries('/catalog', 'weekly', 0.8));
    urls.push(...createLocalizedEntries('/what-is-my', 'weekly', 0.8));
    for (const slug of DIAGNOSTIC_SLUGS) {
      urls.push(...createLocalizedEntries(`/what-is-my/${slug}`, 'weekly', 0.7));
    }
    for (const catalogId of AVAILABLE_CATALOG_IDS) {
      urls.push(...createLocalizedEntries(`/catalog/${catalogId}`, 'weekly', 0.8));
      const items = getCatalogItems(catalogId);
      for (const item of items) {
        urls.push(...createLocalizedEntries(`/catalog/${catalogId}/${item.slug}`, 'weekly', 0.7));
      }
    }
  } else {
    // core shard
    urls.push(...createLocalizedEntries('', 'daily', 1.0));
    urls.push(...createLocalizedEntries('/privacy', 'monthly', 0.3));
    urls.push(...createLocalizedEntries('/terms', 'monthly', 0.3));
    urls.push(...createLocalizedEntries('/kz', 'weekly', 0.8));
    urls.push(...createLocalizedEntries('/favorites', 'weekly', 0.6));
    for (const group of toolGroups) {
      urls.push(...createLocalizedEntries(`/group/${group.slug}`, 'weekly', 0.8));
    }
  }

  const xml = buildXmlUrlset(urls);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
