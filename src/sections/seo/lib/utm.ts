/* UTM link builder: keeps existing query parameters and the #fragment, replaces old utm_* values,
   and leaves ad-platform macros like {keyword} or {campaignid} unencoded. */

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

/** encodeURIComponent that keeps {macro} and {{macro}} placeholders readable for ad platforms. */
export function encodeValue(v: string): string {
  return v
    .split(/(\{\{?[A-Za-z0-9_:.-]+\}?\})/)
    .map((part, i) => (i % 2 ? part : encodeURIComponent(part)))
    .join("");
}

export function buildUtm(url: string, params: UtmParams): string {
  const raw = url.trim();
  if (!raw) return "";
  const hashAt = raw.indexOf("#");
  const hash = hashAt >= 0 ? raw.slice(hashAt) : "";
  const noHash = hashAt >= 0 ? raw.slice(0, hashAt) : raw;
  const qAt = noHash.indexOf("?");
  const base = qAt >= 0 ? noHash.slice(0, qAt) : noHash;
  const query = qAt >= 0 ? noHash.slice(qAt + 1) : "";
  const keep = query
    .split("&")
    .filter((p) => p && !UTM_KEYS.includes(p.split("=")[0].toLowerCase() as UtmKey));
  const add = UTM_KEYS.filter((k) => params[k]?.trim()).map((k) => `${k}=${encodeValue(params[k]!.trim())}`);
  const q = [...keep, ...add].join("&");
  return `${base}${q ? `?${q}` : ""}${hash}`;
}

/** Read utm_* values from an existing link. */
export function parseUtm(url: string): UtmParams {
  const out: UtmParams = {};
  const q = url.split("#")[0].split("?")[1] ?? "";
  for (const p of q.split("&")) {
    const [k, ...rest] = p.split("=");
    const key = k?.toLowerCase() as UtmKey;
    if (UTM_KEYS.includes(key)) {
      try {
        out[key] = decodeURIComponent(rest.join("=").replace(/\+/g, " "));
      } catch {
        out[key] = rest.join("=");
      }
    }
  }
  return out;
}

export type UtmWarning = "upper" | "spaces" | "noScheme" | "gclid";

export function utmWarnings(url: string, p: UtmParams): UtmWarning[] {
  const w: UtmWarning[] = [];
  const values = Object.values(p).filter(Boolean) as string[];
  if (values.some((v) => v.replace(/\{\{?[^}]+\}?\}/g, "") !== v.replace(/\{\{?[^}]+\}?\}/g, "").toLowerCase())) w.push("upper");
  if (values.some((v) => /\s/.test(v.trim()))) w.push("spaces");
  if (url.trim() && !/^https?:\/\//i.test(url.trim())) w.push("noScheme");
  if (/[?&](gclid|yclid|fbclid)=/i.test(url)) w.push("gclid");
  return w;
}
