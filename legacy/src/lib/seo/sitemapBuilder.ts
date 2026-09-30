export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: { lang: string; href: string }[];
}

export function buildXmlUrlset(urls: SitemapUrl[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const item of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
    if (item.lastmod) xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
    if (item.changefreq) xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    if (item.priority !== undefined) xml += `    <priority>${item.priority.toFixed(1)}</priority>\n`;

    if (item.alternates && item.alternates.length > 0) {
      for (const alt of item.alternates) {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${escapeXml(alt.href)}"/>\n`;
      }
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

export function buildXmlSitemapIndex(sitemapUrls: { loc: string; lastmod?: string }[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const sm of sitemapUrls) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${escapeXml(sm.loc)}</loc>\n`;
    if (sm.lastmod) xml += `    <lastmod>${sm.lastmod}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }

  xml += '</sitemapindex>';
  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
