import type { Locale } from "@/i18n/config";
import { hex } from "../emoji/shared/codes";

/* Pure logic of the Unicode lookup (client and tests). Index files: src/sections/symbols/data/client/unicode*.json. */

export interface RawIndex {
  b: [number, number, string][];
  /** Lines "delta(base36) NAME", code points ascending. */
  n: string;
  /** base36 code point → "collection/slug" */
  p: Record<string, string>;
  /** base36 code point → emoji slug */
  em: Record<string, string>;
  /** base36 code point → HTML entity name */
  e: Record<string, string>;
}
export interface RawRu {
  n: Record<string, string>;
  b: Record<string, string>;
}

export interface Index {
  cps: number[];
  names: string[];
  byCp: Map<number, number>;
  blocks: [number, number, string][];
  pages: Record<string, string>;
  emoji: Record<string, string>;
  ents: Record<string, string>;
  entCp: Map<string, number>;
  ru: Record<string, string>;
  ruBlocks: Record<string, string>;
}

export const k36 = (cp: number) => cp.toString(36);

export function parseIndex(raw: RawIndex, ru: RawRu = { n: {}, b: {} }): Index {
  const cps: number[] = [];
  const names: string[] = [];
  let cp = -1;
  for (const line of raw.n.split("\n")) {
    const sp = line.indexOf(" ");
    cp += parseInt(line.slice(0, sp), 36);
    cps.push(cp);
    names.push(line.slice(sp + 1));
  }
  const entCp = new Map<string, number>();
  for (const [k, v] of Object.entries(raw.e)) entCp.set(v.toLowerCase(), parseInt(k, 36));
  return { cps, names, byCp: new Map(cps.map((c, i) => [c, i])), blocks: raw.b, pages: raw.p, emoji: raw.em, ents: raw.e, entCp, ru: ru.n, ruBlocks: ru.b };
}

const MARK = /^\p{M}$/u;
const INVISIBLE = /^[\p{Z}\p{Cf}\p{Cc}]$/u;
/** What to draw in a cell: combining marks on a dotted circle, invisible characters as hex. */
export function face(cp: number): { text: string; label?: string } {
  const ch = String.fromCodePoint(cp);
  if (MARK.test(ch)) return { text: `◌${ch}` };
  if (INVISIBLE.test(ch)) return { text: ch, label: hex(cp) };
  return { text: ch };
}

export function nameOf(idx: Index, cp: number, locale: Locale): string {
  const ru = locale === "ru" ? idx.ru[k36(cp)] : undefined;
  if (ru) return ru.charAt(0).toUpperCase() + ru.slice(1);
  const i = idx.byCp.get(cp);
  return i === undefined ? `U+${hex(cp)}` : idx.names[i];
}

export function blockOf(idx: Index, cp: number): [number, number, string] | undefined {
  let lo = 0;
  let hi = idx.blocks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const b = idx.blocks[mid];
    if (cp < b[0]) hi = mid - 1;
    else if (cp > b[1]) lo = mid + 1;
    else return b;
  }
  return undefined;
}

const MAX = 2000;

/** Characters matching a query: codes (U+00B0, 0xB0, &#176;, &#xB0;), entities (&deg;), pasted characters and names. */
export function search(idx: Index, query: string, locale: Locale): number[] {
  const q = query.trim();
  if (!q) return [];
  const out: number[] = [];
  const add = (cp: number | undefined) => {
    if (cp !== undefined && idx.byCp.has(cp) && !out.includes(cp)) out.push(cp);
  };
  let m = /^(?:u\+|0x|\\u\{?|&#x)([0-9a-f]{1,6})\}?;?$/i.exec(q);
  if (m) add(parseInt(m[1], 16));
  if ((m = /^&#(\d{1,7});?$/.exec(q))) add(Number(m[1]));
  if ((m = /^&([a-z][a-z0-9]*);?$/i.exec(q))) add(idx.entCp.get(m[1].toLowerCase()));
  if (/^[0-9a-f]{4,6}$/i.test(q)) add(parseInt(q, 16));
  const chars = Array.from(q);
  if (chars.length <= 3 && !/^[a-z0-9 ]+$/i.test(q)) for (const c of chars) add(c.codePointAt(0));
  const up = q.toUpperCase();
  const tokens = up.split(/\s+/).filter(Boolean);
  const ruQuery = locale === "ru" ? q.toLowerCase().replace(/ё/g, "е") : "";
  const ruTokens = ruQuery.split(/\s+/).filter(Boolean);
  const scored: [number, number][] = [];
  for (let i = 0; i < idx.names.length; i++) {
    const name = idx.names[i];
    let s = 0;
    if (tokens.every((t) => name.includes(t))) s = name === up ? 100 : name.startsWith(up) ? 60 : 20;
    if (!s && ruTokens.length) {
      const ru = idx.ru[k36(idx.cps[i])];
      if (ru) {
        const r = ru.toLowerCase().replace(/ё/g, "е");
        if (ruTokens.every((t) => r.includes(t))) s = r === ruQuery ? 100 : r.startsWith(ruTokens[0]) ? 60 : 30;
      }
    }
    if (s) scored.push([s, idx.cps[i]]);
  }
  scored.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, cp] of scored) {
    if (out.length >= MAX) break;
    add(cp);
  }
  return out;
}
