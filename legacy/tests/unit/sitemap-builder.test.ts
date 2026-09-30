import { describe, it, expect } from 'vitest';
import { buildXmlUrlset, buildXmlSitemapIndex } from '@/src/lib/seo/sitemapBuilder';

describe('XML Построитель карт сайта', () => {
  it('должен генерировать валидный индексный файл sitemapindex', () => {
    const sitemaps = [
      { loc: 'https://rcwebapp.com/sitemaps/tools.xml', lastmod: '2026-03-20' },
      { loc: 'https://rcwebapp.com/sitemaps/time-now.xml', lastmod: '2026-03-20' },
    ];
    const xml = buildXmlSitemapIndex(sitemaps);

    expect(xml).toContain('<sitemapindex');
    expect(xml).toContain('<loc>https://rcwebapp.com/sitemaps/tools.xml</loc>');
    expect(xml.endsWith('</sitemapindex>')).toBe(true);
  });

  it('должен генерировать валидный urlset с hreflang альтернативами', () => {
    const urls = [
      {
        loc: 'https://rcwebapp.com/ru/tools/pdf-studio',
        lastmod: '2026-03-20',
        priority: 0.9,
        alternates: [
          { lang: 'ru', href: 'https://rcwebapp.com/ru/tools/pdf-studio' },
          { lang: 'en', href: 'https://rcwebapp.com/en/tools/pdf-studio' },
        ],
      },
    ];
    const xml = buildXmlUrlset(urls);

    expect(xml).toContain('<urlset');
    expect(xml).toContain('xhtml:link rel="alternate" hreflang="en"');
  });
});
