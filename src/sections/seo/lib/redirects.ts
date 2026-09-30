/* Redirect rules for Apache (.htaccess), nginx and Next.js from "old new" pairs. */

export type Server = "htaccess" | "nginx" | "nextjs";
export type Code = 301 | 302 | 307 | 308;

export interface Pair {
  from: string;
  to: string;
  line: number;
}

export interface Parsed {
  pairs: Pair[];
  bad: number[];
}

/** Lines of "old new" separated by whitespace, tab, comma, semicolon, → or =>. */
export function parsePairs(text: string): Parsed {
  const pairs: Pair[] = [];
  const bad: number[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const s = raw.trim();
    if (!s || s.startsWith("#")) return;
    const parts = s.split(/\s*(?:→|=>|->|\t|;|,(?=\s*(?:\/|https?:))|\s)\s*/).filter(Boolean);
    if (parts.length !== 2) {
      bad.push(i + 1);
      return;
    }
    pairs.push({ from: parts[0], to: parts[1], line: i + 1 });
  });
  return { pairs, bad };
}

/** Split an old URL into decoded path and raw query (host is dropped). */
export function source(from: string): { path: string; query: string } {
  let s = from.trim();
  const m = s.match(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]+(.*)$/i);
  if (m) s = m[1] || "/";
  s = s.split("#")[0];
  if (!s.startsWith("/")) s = `/${s}`;
  const q = s.indexOf("?");
  return { path: q >= 0 ? s.slice(0, q) : s, query: q >= 0 ? s.slice(q + 1) : "" };
}

function decodePath(p: string): string {
  try {
    return decodeURI(p);
  } catch {
    return p;
  }
}

function encodePath(p: string): string {
  return encodeURI(decodePath(p));
}

const reEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function target(to: string): string {
  const t = to.trim();
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : t.startsWith("/") ? t : `/${t}`;
}

export function htaccess(pairs: Pair[], code: Code): string {
  const lines = ["RewriteEngine On", ""];
  for (const p of pairs) {
    const { path, query } = source(p.from);
    const rel = decodePath(path).replace(/^\//, "").replace(/\/$/, "");
    const pattern = rel ? `^${reEscape(rel)}/?$` : "^$";
    const to = target(p.to);
    // A trailing "?" drops the old query string unless the target has its own.
    const dropQuery = to.includes("?") ? "" : "?";
    if (query) lines.push(`RewriteCond %{QUERY_STRING} ^${reEscape(query)}$`);
    lines.push(`RewriteRule ${pattern} ${to.replace(/ /g, "%20")}${query ? dropQuery : ""} [R=${code},L]`);
  }
  return lines.join("\n");
}

export function nginx(pairs: Pair[], code: Code): string {
  const q = (s: string) => `"${s.replace(/["\\]/g, "\\$&")}"`;
  const rows = pairs.map((p) => {
    const { path, query } = source(p.from);
    return `    ${q(encodePath(path) + (query ? `?${query}` : ""))} ${q(target(p.to))};`;
  });
  return [
    "# http { … }",
    "map $request_uri $redirect_target {",
    "    default \"\";",
    ...rows,
    "}",
    "",
    "# server { … }",
    `if ($redirect_target) {`,
    `    return ${code} $redirect_target;`,
    "}",
  ].join("\n");
}

/** Characters with special meaning in Next.js (path-to-regexp) sources. */
const nextEscape = (s: string) => s.replace(/[():*+?{}]/g, "\\$&");

export function nextjs(pairs: Pair[], code: Code): string {
  const items = pairs.map((p) => {
    const { path, query } = source(p.from);
    const has = query
      ? `,\n        has: [${query
          .split("&")
          .filter(Boolean)
          .map((kv) => {
            const [k, ...v] = kv.split("=");
            return `{ type: "query", key: ${JSON.stringify(k)}, value: ${JSON.stringify(v.join("="))} }`;
          })
          .join(", ")}]`
      : "";
    return `      {\n        source: ${JSON.stringify(nextEscape(encodePath(path)))},\n        destination: ${JSON.stringify(target(p.to))},\n        statusCode: ${code}${has},\n      }`;
  });
  return ["// next.config.js", "module.exports = {", "  async redirects() {", "    return [", `${items.join(",\n")}${items.length ? "," : ""}`, "    ];", "  },", "};"].join("\n");
}

export interface RedirectIssue {
  kind: "chain" | "loop" | "duplicate" | "self";
  line: number;
}

/** Chains (A→B, B→C), loops (A→B, B→A), duplicate sources and self-redirects. */
export function redirectIssues(pairs: Pair[]): RedirectIssue[] {
  const key = (u: string) => {
    const s = source(u);
    return encodePath(s.path).replace(/\/+$/, "") + (s.query ? `?${s.query}` : "");
  };
  const map = new Map<string, Pair>();
  const out: RedirectIssue[] = [];
  for (const p of pairs) {
    const k = key(p.from);
    if (map.has(k)) out.push({ kind: "duplicate", line: p.line });
    else map.set(k, p);
    if (k === key(p.to) && (!/^https?:/i.test(p.to) || !/^https?:/i.test(p.from) || new URL(p.to).host === new URL(p.from).host)) out.push({ kind: "self", line: p.line });
  }
  for (const p of pairs) {
    if (/^https?:/i.test(p.to) && /^https?:/i.test(p.from)) {
      if (new URL(p.to).host !== new URL(p.from).host) continue;
    } else if (/^https?:/i.test(p.to) && !/^https?:/i.test(p.from)) continue;
    const next = map.get(key(p.to));
    if (!next || next === p) continue;
    let q: Pair | undefined = next;
    const seen = new Set<Pair>([p]);
    let loop = false;
    while (q) {
      if (seen.has(q)) {
        loop = true;
        break;
      }
      seen.add(q);
      q = map.get(key(q.to));
    }
    out.push({ kind: loop ? "loop" : "chain", line: p.line });
  }
  return out;
}
