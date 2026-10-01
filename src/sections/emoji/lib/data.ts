import raw from "../data/emoji.json";
import { POPULAR } from "./popular";
import { TOPICS, type TopicDef } from "./topics";

/* Server-side emoji catalog built from scripts/data/gen-emoji.mjs output. Never import from client components. */

type Ext = {
  /** Shortcodes: [GitHub, Slack] */
  sc?: [string[], string[]];
  /** Skin tone variants: [glyph, tone ("1".."5" or "1-5" for two people)] */
  sk?: [string, string][];
  /** Hair style variants: [glyph, kind, en, ru, skin variants] */
  hair?: [string, string, string, string, string[]][];
  emo?: string[];
  /** Text (monochrome) presentation by default. */
  t?: 1;
  ruAlt?: string;
  /** ISO 3166-1 code and continent of a country flag. */
  cc?: string;
  rg?: string;
};
type Row = [string, string, number, number, string, string, string, string, Ext?];

export interface Emoji {
  i: number;
  glyph: string;
  slug: string;
  group: string;
  sub: string;
  version: number;
  en: string;
  ru: string;
  kwEn: string[];
  kwRu: string[];
  ext: Ext;
}

const data = raw as unknown as {
  source: string;
  groups: string[];
  subgroups: [string, number][];
  tones: { ru: string[]; en: string[] };
  emoji: Row[];
};

export const SOURCE = data.source;
export const TONES = data.tones;
export const GROUP_KEYS = data.groups;
export const SUBGROUP_KEYS = data.subgroups.map((s) => s[0]);
export const subgroupGroup = new Map(data.subgroups.map(([s, g]) => [s, data.groups[g]]));

export const EMOJI: Emoji[] = data.emoji.map((r, i) => ({
  i,
  glyph: r[0],
  slug: r[1],
  sub: data.subgroups[r[2]][0],
  group: data.groups[data.subgroups[r[2]][1]],
  version: r[3],
  en: r[4],
  ru: r[5],
  kwEn: r[6] ? r[6].split("|") : [],
  kwRu: r[7] ? r[7].split("|") : [],
  ext: r[8] ?? {},
}));

export const bySlug = new Map(EMOJI.map((e) => [e.slug, e]));
const strip = (s: string) => s.replace(/\u{FE0F}/gu, "");
const byGlyph = new Map(EMOJI.map((e) => [strip(e.glyph), e]));
export const findGlyph = (g: string) => byGlyph.get(strip(g));

export const bySub = new Map<string, Emoji[]>();
export const byGroup = new Map<string, Emoji[]>();
for (const e of EMOJI) {
  (bySub.get(e.sub) ?? bySub.set(e.sub, []).get(e.sub)!).push(e);
  (byGroup.get(e.group) ?? byGroup.set(e.group, []).get(e.group)!).push(e);
}
export const subgroupsOf = (group: string) => SUBGROUP_KEYS.filter((s) => subgroupGroup.get(s) === group);

/** Split a string of emoji into graphemes. */
export function graphemes(s: string): string[] {
  return Array.from(new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s), (x) => x.segment);
}

/** Emoji of a glyph list that exist in the catalog (unknown glyphs are reported by unit tests). */
function listOf(s: string): Emoji[] {
  const out: Emoji[] = [];
  for (const g of graphemes(s)) {
    const e = findGlyph(g);
    if (e && !out.includes(e)) out.push(e);
  }
  return out;
}

/* ── topics ── */
const topicCache = new Map<string, Emoji[]>();
export function topicEmoji(t: TopicDef): Emoji[] {
  let list = topicCache.get(t.slug);
  if (list) return list;
  const set = new Set<Emoji>();
  for (const s of t.sub ?? []) for (const e of bySub.get(s) ?? []) set.add(e);
  if (t.tags?.length) {
    for (const e of EMOJI) {
      if (t.tagGroups && !t.tagGroups.includes(e.group)) continue;
      if (e.kwEn.some((k) => t.tags!.includes(k.toLowerCase()))) set.add(e);
    }
  }
  if (t.region) for (const e of bySub.get("country-flag") ?? []) if (e.ext.rg === t.region) set.add(e);
  for (const e of listOf(t.add ?? "")) set.add(e);
  const ex = new Set(listOf(t.exclude ?? ""));
  list = [...set].filter((e) => !ex.has(e)).sort((a, b) => a.i - b.i);
  topicCache.set(t.slug, list);
  return list;
}
export const topicBySlug = new Map(TOPICS.map((t) => [t.slug, t]));

let topicsOfCache: Map<Emoji, TopicDef[]> | null = null;
export function topicsOf(e: Emoji): TopicDef[] {
  if (!topicsOfCache) {
    topicsOfCache = new Map();
    for (const t of TOPICS) for (const x of topicEmoji(t)) (topicsOfCache.get(x) ?? topicsOfCache.set(x, []).get(x)!).push(t);
  }
  return topicsOfCache.get(e) ?? [];
}

/* ── popularity ── */
let popularCache: Emoji[] | null = null;
/** Popular emoji first, then the rest in catalog order. */
export function popular(n: number): Emoji[] {
  if (!popularCache) {
    const head = listOf(POPULAR);
    const seen = new Set(head);
    const fill = ["smileys-emotion", "people-body", "animals-nature", "food-drink", "symbols", "activities", "travel-places", "objects", "flags"].flatMap((g) =>
      (byGroup.get(g) ?? []).filter((e) => !seen.has(e) && !e.slug.includes("-facing-right")),
    );
    popularCache = [...head, ...fill];
  }
  return popularCache.slice(0, n);
}
