/**
 * HTML character references: every WHATWG HTML5 named reference (2 231 incl. legacy
 * semicolon-less forms), decimal and hex numeric references, spec error handling.
 */
import DATA from "../data/entities.json";
import { ok, type Codec } from "./types";

const NAMED = new Map<string, string>();
const LEGACY: string[] = [];
const BY_CHAR = new Map<string, string>();
let maxLen = 0;
for (const [name, chars, legacy] of DATA.names as [string, string, number][]) {
  NAMED.set(name, chars);
  if (legacy) LEGACY.push(name);
  maxLen = Math.max(maxLen, name.length);
  const prev = BY_CHAR.get(chars);
  // prefer the shortest, then the lowercase name ("amp" over "AMP")
  if (!prev || name.length < prev.length || (name.length === prev.length && name > prev)) BY_CHAR.set(chars, name);
}
LEGACY.sort((a, b) => b.length - a.length);

export const ENTITY_COUNT = DATA.names.length + LEGACY.length;

/** [name, chars] rows for the reference table. */
export function entityRows(): [string, string][] {
  return (DATA.names as [string, string, number][]).map(([n, c]) => [n, c]);
}

/** Windows-1252 remapping of numeric references 0x80–0x9F (HTML spec). */
const C1: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030,
  0x8a: 0x0160, 0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022,
  0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
};

function numeric(cp: number): string {
  if (cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return "�";
  return String.fromCodePoint(C1[cp] ?? cp);
}

export function decodeEntities(s: string): string {
  let out = "";
  let i = 0;
  while (i < s.length) {
    const amp = s.indexOf("&", i);
    if (amp < 0) {
      out += s.slice(i);
      break;
    }
    out += s.slice(i, amp);
    i = amp + 1;
    if (s[i] === "#") {
      const hex = s[i + 1] === "x" || s[i + 1] === "X";
      const m = (hex ? /^[0-9a-fA-F]+/ : /^[0-9]+/).exec(s.slice(i + (hex ? 2 : 1)));
      if (!m) {
        out += "&";
        continue;
      }
      i += (hex ? 2 : 1) + m[0].length;
      if (s[i] === ";") i++;
      const cp = m[0].length > 8 ? 0x110000 : parseInt(m[0], hex ? 16 : 10);
      out += numeric(cp);
      continue;
    }
    const run = /^[A-Za-z0-9]+/.exec(s.slice(i, i + maxLen + 1))?.[0] ?? "";
    if (run && s[i + run.length] === ";" && NAMED.has(run)) {
      out += NAMED.get(run);
      i += run.length + 1;
      continue;
    }
    const legacy = run ? LEGACY.find((n) => run.startsWith(n)) : undefined;
    if (legacy) {
      out += NAMED.get(legacy);
      i += legacy.length;
      continue;
    }
    out += "&";
  }
  return out;
}

type HtmlMode = "basic" | "named" | "decimal" | "hex";

const BASIC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function encodeEntities(s: string, mode: HtmlMode = "basic"): string {
  let out = "";
  for (const ch of s) {
    const b = BASIC[ch];
    if (b) {
      out += b;
      continue;
    }
    const cp = ch.codePointAt(0)!;
    if (cp < 0x80 || mode === "basic") out += ch;
    else if (mode === "named") {
      const name = BY_CHAR.get(ch);
      out += name ? `&${name};` : `&#x${cp.toString(16).toUpperCase()};`;
    } else if (mode === "hex") out += `&#x${cp.toString(16).toUpperCase()};`;
    else out += `&#${cp};`;
  }
  return out;
}

export const html: Codec = {
  encode: (input, o) => ok(encodeEntities(input, (o.mode as HtmlMode) || "basic")),
  decode: (input) => ok(decodeEntities(input)),
};
