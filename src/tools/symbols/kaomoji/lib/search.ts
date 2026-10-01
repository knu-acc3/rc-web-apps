import { CATEGORIES, EXTRA_TAGS, type KaomojiCategory } from "../data";

interface Hit {
  k: string;
  /** Main category of the kaomoji. */
  cat: string;
}

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е").trim();

/** Search words of a category in both languages, normalised. */
const WORDS = new Map<string, string[]>(
  CATEGORIES.map((c) => [c.slug, [c.slug.replace(/-/g, " "), c.name.ru, c.name.en, ...c.keywords.ru, ...c.keywords.en].map(normalize)]),
);

function categoryMatches(c: KaomojiCategory, q: string): boolean {
  return WORDS.get(c.slug)!.some((w) => w.includes(q));
}

/** Queries made only of letters/digits (e.g. "кот", "cat") are words; anything else is a symbol search. */
const isWordQuery = (q: string) => /^[\p{L}\p{N}\s-]+$/u.test(q) && /[a-zа-я]/u.test(q);

/**
 * Kaomoji matching `query`: every kaomoji of the categories whose names/keywords (ru or en)
 * contain the query, kaomoji tagged with those categories, and — for symbol queries such as
 * "ツ" or "ω" — kaomoji that contain the query literally. Category order, no duplicates.
 */
export function searchKaomoji(query: string): Hit[] {
  const q = normalize(query);
  if (!q) return [];
  const matched = new Set(CATEGORIES.filter((c) => categoryMatches(c, q)).map((c) => c.slug));
  const literal = !isWordQuery(q);
  const out: Hit[] = [];
  const seen = new Set<string>();
  for (const c of CATEGORIES) {
    for (const k of c.items) {
      if (seen.has(k)) continue;
      const tags = EXTRA_TAGS[k];
      const hit = matched.has(c.slug) || (tags?.some((t) => matched.has(t)) ?? false) || (literal && k.toLowerCase().includes(q));
      if (hit) {
        seen.add(k);
        out.push({ k, cat: c.slug });
      }
    }
  }
  return out;
}
