/* hreflang annotations: validation of language/region codes and output in three formats. */

export interface HreflangRow {
  code: string;
  url: string;
}

export type HreflangIssue = "format" | "language" | "region" | "uk" | "eu" | "url" | "duplicate" | "noDefault";

let langNames: Intl.DisplayNames | null = null;
let regionNames: Intl.DisplayNames | null = null;

function validLanguage(l: string): boolean {
  if (!/^[a-z]{2,3}$/.test(l)) return false;
  try {
    langNames ??= new Intl.DisplayNames(["en"], { type: "language", fallback: "none" });
    return !!langNames.of(l);
  } catch {
    return true;
  }
}

function validRegion(r: string): boolean {
  if (!/^[A-Z]{2}$/.test(r)) return false;
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
    return !!regionNames.of(r);
  } catch {
    return true;
  }
}

/** Check one hreflang value: "x-default", "ru", "en-GB", "zh-Hant", "zh-Hant-TW". */
export function checkCode(code: string): HreflangIssue | null {
  const c = code.trim();
  if (c.toLowerCase() === "x-default") return null;
  if (/_/.test(c)) return "format";
  const parts = c.split("-");
  const lang = parts[0].toLowerCase();
  if (!validLanguage(lang)) return "language";
  let rest = parts.slice(1);
  if (rest[0] && /^[A-Za-z]{4}$/.test(rest[0])) rest = rest.slice(1); // script subtag, e.g. Hant
  if (rest.length > 1) return "format";
  if (rest[0]) {
    const r = rest[0].toUpperCase();
    if (r === "UK") return "uk";
    if (r === "EU") return "eu";
    if (!validRegion(r)) return "region";
  }
  return null;
}

/** Canonical casing: language lower-case, script title-case, region upper-case. */
export function normalizeCode(code: string): string {
  const c = code.trim();
  if (c.toLowerCase() === "x-default") return "x-default";
  return c
    .split("-")
    .map((p, i) => (i === 0 ? p.toLowerCase() : p.length === 4 ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p.toUpperCase()))
    .join("-");
}

export function hreflangIssues(rows: HreflangRow[]): { row: number; issue: HreflangIssue }[] {
  const out: { row: number; issue: HreflangIssue }[] = [];
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    if (!r.code.trim() && !r.url.trim()) return;
    const c = checkCode(r.code);
    if (c) out.push({ row: i, issue: c });
    if (!/^https?:\/\/[^\s/]+/i.test(r.url.trim())) out.push({ row: i, issue: "url" });
    const k = normalizeCode(r.code).toLowerCase();
    if (seen.has(k)) out.push({ row: i, issue: "duplicate" });
    seen.add(k);
  });
  const filled = rows.filter((r) => r.code.trim() && r.url.trim());
  if (filled.length > 1 && !filled.some((r) => r.code.trim().toLowerCase() === "x-default")) out.push({ row: -1, issue: "noDefault" });
  return out;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function hreflangHtml(rows: HreflangRow[]): string {
  return rows
    .filter((r) => r.code.trim() && r.url.trim())
    .map((r) => `<link rel="alternate" hreflang="${normalizeCode(r.code)}" href="${esc(r.url.trim())}" />`)
    .join("\n");
}

export function hreflangHeader(rows: HreflangRow[]): string {
  const items = rows.filter((r) => r.code.trim() && r.url.trim()).map((r) => `<${r.url.trim()}>; rel="alternate"; hreflang="${normalizeCode(r.code)}"`);
  return items.length ? `Link: ${items.join(",\n      ")}` : "";
}

/** sitemap.xml with xhtml:link alternates: every URL of the set lists all alternates, itself included. */
export function hreflangSitemap(rows: HreflangRow[]): string {
  const set = rows.filter((r) => r.code.trim() && r.url.trim());
  if (!set.length) return "";
  const links = set.map((r) => `    <xhtml:link rel="alternate" hreflang="${normalizeCode(r.code)}" href="${esc(r.url.trim())}" />`).join("\n");
  const urls = [...new Set(set.filter((r) => r.code.trim().toLowerCase() !== "x-default").map((r) => r.url.trim()))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map((u) => `  <url>\n    <loc>${esc(u)}</loc>\n${links}\n  </url>`).join("\n")}\n</urlset>\n`;
}
