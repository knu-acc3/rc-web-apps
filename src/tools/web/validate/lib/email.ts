/* Practical e-mail address syntax check (RFC 5321/5322, RFC 6531 for internationalised addresses). No DNS lookups. */

export type EmailIssue =
  | "empty"
  | "no-at"
  | "local-empty"
  | "local-long"
  | "local-dot"
  | "local-chars"
  | "local-quoted"
  | "local-unicode"
  | "domain-empty"
  | "domain-long"
  | "domain-no-dot"
  | "domain-label"
  | "domain-label-long"
  | "domain-hyphen"
  | "tld-numeric"
  | "tld-short"
  | "ip-literal"
  | "ip-bad"
  | "idn"
  | "total-long"
  | "spaces";

export const ERRORS: ReadonlySet<EmailIssue> = new Set<EmailIssue>([
  "empty",
  "no-at",
  "local-empty",
  "local-long",
  "local-dot",
  "local-chars",
  "domain-empty",
  "domain-long",
  "domain-no-dot",
  "domain-label",
  "domain-label-long",
  "domain-hyphen",
  "tld-numeric",
  "tld-short",
  "ip-bad",
  "total-long",
  "spaces",
]);

interface EmailResult {
  valid: boolean;
  issues: EmailIssue[];
  local: string;
  domain: string;
  /** Punycode form of an internationalised domain. */
  asciiDomain?: string;
  /** Likely intended domain for common typos. */
  suggestion?: string;
}

const ATEXT = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+$/;
const QUOTED = /^"(?:[\x20\x21\x23-\x5b\x5d-\x7e]|\\[\x20-\x7e])*"$/;
const LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/** Convert a domain to ASCII (punycode) with the WHATWG URL parser; null if it can't be a host name. */
function toAsciiDomain(domain: string): string | null {
  try {
    return new URL(`http://${domain}`).hostname;
  } catch {
    return null;
  }
}

const POPULAR = ["gmail.com", "yandex.ru", "yandex.kz", "ya.ru", "mail.ru", "inbox.ru", "list.ru", "bk.ru", "rambler.ru", "icloud.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "proton.me", "protonmail.com", "mail.kz"];

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

function suggestDomain(domain: string): string | undefined {
  const d = domain.toLowerCase();
  if (POPULAR.includes(d)) return undefined;
  let best: string | undefined;
  let bestD = 3;
  for (const p of POPULAR) {
    const dist = distance(d, p);
    if (dist < bestD && dist <= (p.length > 6 ? 2 : 1)) {
      best = p;
      bestD = dist;
    }
  }
  return best;
}

function checkIpLiteral(lit: string): boolean {
  const inner = lit.slice(1, -1);
  if (/^IPv6:/i.test(inner)) return /^[0-9a-f:.]+$/i.test(inner.slice(5)) && inner.includes(":");
  const parts = inner.split(".");
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255 && !(p.length > 1 && p[0] === "0"));
}

export function checkEmail(input: string): EmailResult {
  const s = input.trim();
  const issues: EmailIssue[] = [];
  const res = (local = "", domain = "", extra: Partial<EmailResult> = {}): EmailResult => ({ valid: !issues.some((i) => ERRORS.has(i)), issues, local, domain, ...extra });
  if (!s) {
    issues.push("empty");
    return res();
  }
  // split at the last @ that is not inside a quoted local part
  let at = -1;
  if (s.startsWith('"')) {
    const close = s.indexOf('"', 1);
    let i = 1;
    while (i < s.length) {
      if (s[i] === "\\") i += 2;
      else if (s[i] === '"') break;
      else i++;
    }
    at = s.indexOf("@", Math.max(close, i));
  } else at = s.lastIndexOf("@");
  if (at < 0) {
    issues.push("no-at");
    return res(s);
  }
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);

  if (/\s/.test(s) && !local.startsWith('"')) issues.push("spaces");
  if ([...s].length > 254) issues.push("total-long");

  // local part
  if (!local) issues.push("local-empty");
  else if (new TextEncoder().encode(local).length > 64) issues.push("local-long");
  if (local.startsWith('"')) {
    if (QUOTED.test(local)) issues.push("local-quoted");
    else issues.push("local-chars");
  } else if (local) {
    if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) issues.push("local-dot");
    const nonAscii = /[^\x00-\x7f]/.test(local);
    const parts = local.split(".").filter(Boolean);
    const bad = parts.some((p) => !ATEXT.test(nonAscii ? p.replace(/[^\x00-\x7f]/g, "a") : p));
    if (bad) issues.push("local-chars");
    if (nonAscii) issues.push("local-unicode");
  }

  // domain
  let asciiDomain: string | undefined;
  if (!domain) issues.push("domain-empty");
  else if (domain.startsWith("[") && domain.endsWith("]")) {
    issues.push(checkIpLiteral(domain) ? "ip-literal" : "ip-bad");
  } else {
    const ascii = toAsciiDomain(domain);
    if (ascii === null || /[\s@\[\]]/.test(domain)) issues.push("domain-label");
    else {
      if (ascii !== domain.toLowerCase()) {
        asciiDomain = ascii;
        issues.push("idn");
      }
      const d = ascii.replace(/\.$/, "");
      if (d.length > 253) issues.push("domain-long");
      const labels = d.split(".");
      if (labels.length < 2) issues.push("domain-no-dot");
      for (const l of labels) {
        if (l.length > 63) issues.push("domain-label-long");
        else if (!LABEL.test(l)) issues.push(l.startsWith("-") || l.endsWith("-") ? "domain-hyphen" : "domain-label");
      }
      const tld = labels[labels.length - 1];
      if (labels.length >= 2) {
        if (/^\d+$/.test(tld)) issues.push("tld-numeric");
        else if (tld.length < 2) issues.push("tld-short");
      }
    }
  }
  const uniq = [...new Set(issues)];
  issues.length = 0;
  issues.push(...uniq);
  const suggestion = domain && !domain.startsWith("[") ? suggestDomain(domain) : undefined;
  return res(local, domain, { asciiDomain, suggestion });
}
