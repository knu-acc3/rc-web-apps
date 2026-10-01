import { SITE_URL } from "@/config/brand";
import { href, LOCALES, X_DEFAULT_LOCALE } from "@/i18n/config";

/** Build date used as lastmod (stable for the whole deployment). */
const BUILD_DATE = new Date().toISOString().slice(0, 10);

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function urlsetXml(paths: string[][], lastmod = BUILD_DATE): string {
  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const path of paths) {
    const alts = LOCALES.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(SITE_URL + href(l, path))}"/>`).join("");
    const xdef = `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE_URL + href(X_DEFAULT_LOCALE, path))}"/>`;
    for (const l of LOCALES) {
      parts.push(`<url><loc>${esc(SITE_URL + href(l, path))}</loc><lastmod>${lastmod}</lastmod>${alts}${xdef}</url>`);
    }
  }
  parts.push("</urlset>");
  return parts.join("\n");
}

export function sitemapIndexXml(names: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...names.map((n) => `<sitemap><loc>${SITE_URL}/sitemaps/${n}.xml</loc><lastmod>${BUILD_DATE}</lastmod></sitemap>`),
    "</sitemapindex>",
  ].join("\n");
}

export const XML_HEADERS = { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" };
