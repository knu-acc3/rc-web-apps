/* robots.txt parsing and matching per RFC 9309 with Google's documented behaviour:
   - groups for the same user agent are merged;
   - the most specific matching user-agent group wins, then "*";
   - the longest matching path wins; on a tie Allow wins;
   - "*" matches any sequence, "$" anchors the end. */

export type RuleType = "allow" | "disallow";

export interface Rule {
  type: RuleType;
  path: string;
  line: number;
}

export interface Group {
  agents: string[];
  rules: Rule[];
  line: number;
}

export type LintCode =
  | "noAgent"
  | "unknown"
  | "badPath"
  | "crawlDelay"
  | "host"
  | "cleanParam"
  | "relativeSitemap"
  | "noColon"
  | "tooBig"
  | "emptyAgent"
  | "blockAll";

export interface Lint {
  line: number;
  code: LintCode;
  text: string;
}

export interface Robots {
  groups: Group[];
  sitemaps: string[];
  lint: Lint[];
}

const KNOWN = new Set(["user-agent", "allow", "disallow", "sitemap", "crawl-delay", "host", "clean-param"]);

export function parseRobots(src: string): Robots {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  const lint: Lint[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  const lines = src.replace(/^﻿/, "").split(/\r\n|\r|\n/);
  if (new TextEncoder().encode(src).length > 500 * 1024) lint.push({ line: 0, code: "tooBig", text: "" });

  lines.forEach((raw, i) => {
    const line = i + 1;
    const text = raw.replace(/#.*$/, "").trim();
    if (!text) return;
    const colon = text.indexOf(":");
    if (colon < 0) {
      lint.push({ line, code: "noColon", text });
      return;
    }
    const key = text.slice(0, colon).trim().toLowerCase();
    const value = text.slice(colon + 1).trim();
    if (!KNOWN.has(key)) {
      lint.push({ line, code: "unknown", text: key });
      return;
    }
    if (key === "user-agent") {
      if (!value) lint.push({ line, code: "emptyAgent", text });
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], line };
        groups.push(current);
      }
      if (value) current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;
    if (key === "sitemap") {
      if (!/^https?:\/\//i.test(value)) lint.push({ line, code: "relativeSitemap", text: value });
      sitemaps.push(value);
      return;
    }
    if (key === "crawl-delay") {
      lint.push({ line, code: "crawlDelay", text: value });
      return;
    }
    if (key === "host") {
      lint.push({ line, code: "host", text: value });
      return;
    }
    if (key === "clean-param") {
      lint.push({ line, code: "cleanParam", text: value });
      return;
    }
    // allow / disallow
    if (!current) {
      lint.push({ line, code: "noAgent", text });
      return;
    }
    if (value && !value.startsWith("/") && !value.startsWith("*")) lint.push({ line, code: "badPath", text: value });
    if (key === "disallow" && value === "/" && current.agents.includes("*")) lint.push({ line, code: "blockAll", text });
    // An empty Disallow means "allow everything" and matches nothing.
    if (value) current.rules.push({ type: key as RuleType, path: value, line });
  });
  return { groups, sitemaps, lint };
}

/** Percent-encode non-ASCII and normalise existing escapes, keeping robots wildcards intact. */
export function normalizePath(p: string): string {
  let out = "";
  for (const part of p.split(/(%[0-9a-fA-F]{2})/)) {
    if (/^%[0-9a-fA-F]{2}$/.test(part)) out += part.toUpperCase();
    else out += part.replace(/[^\x21-\x7e]/gu, (c) => encodeURIComponent(c));
  }
  return out;
}

/** Does a robots path pattern match the URL path (path + query)? */
export function patternMatches(pattern: string, path: string): boolean {
  const p = normalizePath(pattern);
  const anchored = p.endsWith("$");
  const body = anchored ? p.slice(0, -1) : p;
  const re = new RegExp(`^${body.split("*").map(escapeRe).join(".*")}${anchored ? "$" : ""}`);
  return re.test(normalizePath(path));
}

function escapeRe(s: string): string {
  return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

/** Pick the group that applies to a crawler (merged across duplicate groups). */
export function selectGroup(robots: Robots, userAgent: string): { agent: string; rules: Rule[] } | null {
  const ua = userAgent.trim().toLowerCase();
  let best: string | null = null;
  for (const g of robots.groups)
    for (const a of g.agents) {
      if (a === "*") continue;
      const hit = ua === a || ua.startsWith(`${a}-`) || ua.startsWith(`${a}/`);
      if (hit && (!best || a.length > best.length)) best = a;
    }
  const agent = best ?? (robots.groups.some((g) => g.agents.includes("*")) ? "*" : null);
  if (!agent) return null;
  const rules = robots.groups.filter((g) => g.agents.includes(agent)).flatMap((g) => g.rules);
  return { agent, rules };
}

export interface Verdict {
  allowed: boolean;
  agent: string | null;
  rule: Rule | null;
}

/** Extract "path?query" from a URL or path. */
export function urlPath(input: string): string {
  const s = input.trim();
  if (!s) return "/";
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://x.invalid${s.startsWith("/") ? "" : "/"}${s}`);
    return u.pathname + u.search;
  } catch {
    return s.startsWith("/") ? s : `/${s}`;
  }
}

export function isAllowed(robots: Robots, userAgent: string, url: string): Verdict {
  const path = urlPath(url);
  if (path === "/robots.txt") return { allowed: true, agent: null, rule: null };
  const g = selectGroup(robots, userAgent);
  if (!g) return { allowed: true, agent: null, rule: null };
  let best: Rule | null = null;
  let bestLen = -1;
  for (const r of g.rules) {
    if (!patternMatches(r.path, path)) continue;
    const len = normalizePath(r.path).length;
    if (len > bestLen || (len === bestLen && r.type === "allow" && best?.type === "disallow")) {
      best = r;
      bestLen = len;
    }
  }
  return { allowed: !best || best.type === "allow", agent: g.agent, rule: best };
}
