import { describe, it, expect } from 'vitest';
import { buildXmlSitemapIndex } from '@/src/lib/seo/sitemapBuilder';
import { siteConfig } from '@/src/config/site.config';

describe('Sitemap Index Architecture', () => {
  it('должен генерировать 8 специализированных шардов карт сайта', () => {
    const shards = [
      'tools',
      'time-now',
      'actual-size',
      'emojis',
      'symbols',
      'timers',
      'catalogs',
      'core',
    ];

    const sitemaps = shards.map(s => ({
      loc: `${siteConfig.baseUrl}/sitemaps/${s}.xml`,
      lastmod: '2026-03-20',
    }));

    const xml = buildXmlSitemapIndex(sitemaps);
    expect(xml).toContain('<sitemapindex');
    expect(xml).toContain(`${siteConfig.baseUrl}/sitemaps/tools.xml`);
    expect(xml).toContain(`${siteConfig.baseUrl}/sitemaps/time-now.xml`);
    expect(xml).toContain(`${siteConfig.baseUrl}/sitemaps/actual-size.xml`);
    expect(xml).toContain(`${siteConfig.baseUrl}/sitemaps/emojis.xml`);
    expect(xml).toContain(`${siteConfig.baseUrl}/sitemaps/symbols.xml`);
    expect(xml).toContain(`${siteConfig.baseUrl}/sitemaps/timers.xml`);
    expect(xml).toContain(`${siteConfig.baseUrl}/sitemaps/catalogs.xml`);
    expect(xml).toContain(`${siteConfig.baseUrl}/sitemaps/core.xml`);
  });
});
