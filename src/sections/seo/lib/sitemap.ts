/* sitemap.xml generation per sitemaps.org: XML escaping, 50,000 URLs / 50 MB per file,
   sitemap index for larger sets. */

export const MAX_URLS = 50_000;
export const MAX_BYTES = 50 * 1024 * 1024;

export type ChangeFreq = "" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SitemapOptions {
  lastmod?: string;
  changefreq?: ChangeFreq;
  /** "" = omit, "auto" = by path depth, or a fixed "0.0"–"1.0". */
  priority?: string;
}

export function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

export interface UrlCheck {
  urls: string[];
  invalid: string[];
  duplicates: number;
  hosts: string[];
}

/** Normalise a list of URLs: absolute http(s) only, percent-encoded, punycode host, deduplicated. */
export function collectUrls(lines: string[], base?: string): UrlCheck {
  const seen = new Set<string>();
  const urls: string[] = [];
  const invalid: string[] = [];
  const hosts = new Set<string>();
  let duplicates = 0;
  for (const raw of lines) {
    const s = raw.trim();
    if (!s || s.startsWith("#")) continue;
    let u: URL;
    try {
      u = base && s.startsWith("/") ? new URL(s, base) : new URL(s);
    } catch {
      invalid.push(s);
      continue;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      invalid.push(s);
      continue;
    }
    u.hash = "";
    const href = u.href;
    if (seen.has(href)) {
      duplicates++;
      continue;
    }
    seen.add(href);
    hosts.add(u.host);
    urls.push(href);
  }
  return { urls, invalid, duplicates, hosts: [...hosts] };
}

function autoPriority(url: string): string {
  const depth = new URL(url).pathname.split("/").filter(Boolean).length;
  return ["1.0", "0.8", "0.6", "0.5"][Math.min(depth, 3)];
}

export function urlEntry(url: string, o: SitemapOptions): string {
  let s = `  <url>\n    <loc>${xmlEscape(url)}</loc>\n`;
  if (o.lastmod) s += `    <lastmod>${xmlEscape(o.lastmod)}</lastmod>\n`;
  if (o.changefreq) s += `    <changefreq>${o.changefreq}</changefreq>\n`;
  if (o.priority) s += `    <priority>${o.priority === "auto" ? autoPriority(url) : o.priority}</priority>\n`;
  return `${s}  </url>\n`;
}

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
const TAIL = "</urlset>\n";

export interface SitemapFile {
  name: string;
  xml: string;
  count: number;
}

/** Build one or more sitemap files plus an index when the limits are exceeded. */
export function buildSitemaps(urls: string[], o: SitemapOptions, indexBase = "", maxUrls = MAX_URLS, maxBytes = MAX_BYTES): { files: SitemapFile[]; index: string | null } {
  const enc = new TextEncoder();
  const files: SitemapFile[] = [];
  let body = "";
  let bytes = enc.encode(HEAD + TAIL).length;
  let count = 0;
  const flush = () => {
    files.push({ name: "", xml: HEAD + body + TAIL, count });
    body = "";
    bytes = enc.encode(HEAD + TAIL).length;
    count = 0;
  };
  for (const u of urls) {
    const e = urlEntry(u, o);
    const b = enc.encode(e).length;
    if (count > 0 && (count >= maxUrls || bytes + b > maxBytes)) flush();
    body += e;
    bytes += b;
    count++;
  }
  if (count > 0 || files.length === 0) flush();
  if (files.length === 1) {
    files[0].name = "sitemap.xml";
    return { files, index: null };
  }
  files.forEach((f, i) => (f.name = `sitemap-${i + 1}.xml`));
  const base = indexBase.replace(/\/+$/, "");
  const lastmod = o.lastmod ? `    <lastmod>${xmlEscape(o.lastmod)}</lastmod>\n` : "";
  const index =
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    files.map((f) => `  <sitemap>\n    <loc>${xmlEscape(`${base}/${f.name}`)}</loc>\n${lastmod}  </sitemap>\n`).join("") +
    "</sitemapindex>\n";
  return { files, index };
}
