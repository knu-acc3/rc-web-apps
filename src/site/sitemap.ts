import { execFileSync } from "node:child_process";
import { SITE_URL } from "@/config/brand";
import { href, LOCALES, X_DEFAULT_LOCALE } from "@/i18n/config";

/** Build date: the fallback lastmod when git history is not available. */
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const lastmods = new Map<string, string>();
/**
 * Honest lastmod for a section: the date of the last commit that touched its folder (src/sections/{id}), so a
 * deploy does not mark 16 000 untouched pages as changed. Falls back to the build date without git history.
 */
export function sectionLastmod(id: string): string {
  let d = lastmods.get(id);
  if (d) return d;
  try {
    d = execFileSync("git", ["log", "-1", "--format=%cs", "--", `src/sections/${id}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).trim();
  } catch {
    d = "";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) d = BUILD_DATE;
  lastmods.set(id, d);
  return d;
}

/** The newest of the given sections' dates (home and catalog change whenever any section does). */
export const newestLastmod = (ids: string[]): string => ids.map(sectionLastmod).sort().at(-1) ?? BUILD_DATE;

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

export function sitemapIndexXml(files: { name: string; lastmod: string }[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...files.map((f) => `<sitemap><loc>${SITE_URL}/sitemaps/${f.name}.xml</loc><lastmod>${f.lastmod}</lastmod></sitemap>`),
    "</sitemapindex>",
  ].join("\n");
}

export const XML_HEADERS = { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" };
