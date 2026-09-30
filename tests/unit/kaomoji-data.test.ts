import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_BY_SLUG, DISAPPROVAL, EXTRA_TAGS, LENNY, SHRUG, TABLE_BACK, TABLE_FLIP, TOTAL } from "@/sections/kaomoji/data";
import { searchKaomoji } from "@/sections/kaomoji/search";

/** Duplicate check ignores all whitespace: "( ^ ω ^ )" and "(^ω^)" are the same kaomoji. */
const norm = (s: string) => s.replace(/\s+/gu, "");
const cps = (s: string) => [...s].map((c) => c.codePointAt(0));

/** Famous categories are small by nature; every other category must have a real set. */
const SMALL = new Set(["shrug", "table-flip", "lenny-face", "disapproval"]);
const MIN_SMALL = 10;
const MIN = 15;

/**
 * Established kaomoji whose brackets are intentionally unbalanced: peeking from behind a wall,
 * lying in bed, hands over the face, two faces pressed together (hug/kiss).
 */
const UNBALANCED_OK = new Set([
  "|ω・)",
  "|д･)",
  "(¦3[▓▓]",
  "[▓▓]ε¦)",
  "ʕノ)ᴥ(ヾʔ",
  "♡ (˘▽˘>ԅ( ˘⌣˘)",
  "(ɔ˘ ³(ˆ◡ˆc)",
  "(っ˘з(˘⌣˘ ) ♡",
]);

const PAIRS: Record<string, string> = { "(": ")", "（": "）", "[": "]", "{": "}" };
const CLOSERS = new Set(Object.values(PAIRS));

function balanced(s: string): boolean {
  const stack: string[] = [];
  for (const ch of s) {
    if (PAIRS[ch]) stack.push(PAIRS[ch]);
    else if (CLOSERS.has(ch) && stack.pop() !== ch) return false;
  }
  return stack.length === 0;
}

const all = CATEGORIES.flatMap((c) => c.items.map((k) => ({ k, cat: c.slug })));

describe("kaomoji data", () => {
  it("has at least 800 unique kaomoji", () => {
    expect(TOTAL).toBe(all.length);
    expect(new Set(all.map((x) => norm(x.k))).size).toBeGreaterThanOrEqual(800);
  });

  it("has no duplicates, even across categories and ignoring whitespace", () => {
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const { k, cat } of all) {
      const key = norm(k);
      if (seen.has(key)) dups.push(`${k} (${cat}) = ${seen.get(key)}`);
      else seen.set(key, `${k} (${cat})`);
    }
    expect(dups).toEqual([]);
  });

  it("has 35–40 categories with unique kebab-case slugs and enough entries", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(35);
    expect(CATEGORIES.length).toBeLessThanOrEqual(40);
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of CATEGORIES) {
      expect(c.slug, c.slug).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(c.items.length, c.slug).toBeGreaterThanOrEqual(SMALL.has(c.slug) ? MIN_SMALL : MIN);
      expect(c.name.ru && c.name.en, c.slug).toBeTruthy();
      expect(c.items, `${c.slug} sample`).toContain(c.sample);
    }
  });

  it("entries are well-formed: trimmed, balanced brackets, no broken characters", () => {
    const bad: string[] = [];
    for (const { k, cat } of all) {
      if (k !== k.trim() || !k) bad.push(`${cat}: untrimmed "${k}"`);
      if (/\s{2,}/u.test(k)) bad.push(`${cat}: double space "${k}"`);
      if (/[^\S ]/u.test(k)) bad.push(`${cat}: non-ASCII whitespace "${k}"`);
      if (k.includes("�")) bad.push(`${cat}: replacement character "${k}"`);
      if (!k.isWellFormed()) bad.push(`${cat}: lone surrogate "${k}"`);
      if (/[​-‏⁠﻿]/u.test(k)) bad.push(`${cat}: invisible character "${k}"`);
      if (/^\p{M}/u.test(k)) bad.push(`${cat}: starts with a combining mark "${k}"`);
      // Colour emoji (emoji presentation by default or forced with VS16) are not kaomoji.
      if (/\p{Emoji_Presentation}|️/u.test(k)) bad.push(`${cat}: emoji "${k}"`);
      if (!UNBALANCED_OK.has(k) && !balanced(k)) bad.push(`${cat}: unbalanced "${k}"`);
    }
    expect(bad).toEqual([]);
  });

  it("the exceptions list only contains real entries", () => {
    const set = new Set(all.map((x) => x.k));
    for (const k of UNBALANCED_OK) expect(set.has(k), k).toBe(true);
  });

  it("famous kaomoji have the exact code points and sit in their categories", () => {
    // ¯ \ _ ( ツ ) _ / ¯ — exactly one backslash
    expect(cps(SHRUG)).toEqual([0xaf, 0x5c, 0x5f, 0x28, 0x30c4, 0x29, 0x5f, 0x2f, 0xaf]);
    expect(SHRUG.split("\\").length - 1).toBe(1);
    // ( space U+0361 ° space U+035C ʖ space U+0361 ° )
    expect(cps(LENNY)).toEqual([0x28, 0x20, 0x361, 0xb0, 0x20, 0x35c, 0x296, 0x20, 0x361, 0xb0, 0x29]);
    expect(cps(TABLE_FLIP)).toEqual([0x28, 0x256f, 0xb0, 0x25a1, 0xb0, 0x29, 0x256f, 0xfe35, 0x20, 0x253b, 0x2501, 0x253b]);
    expect(cps(TABLE_BACK)).toEqual([0x252c, 0x2500, 0x252c, 0x30ce, 0x28, 0x20, 0xba, 0x20, 0x5f, 0x20, 0xba, 0x30ce, 0x29]);
    expect(cps(DISAPPROVAL)).toEqual([0xca0, 0x5f, 0xca0]);

    expect(CATEGORY_BY_SLUG.get("shrug")!.items[0]).toBe(SHRUG);
    expect(CATEGORY_BY_SLUG.get("lenny-face")!.items[0]).toBe(LENNY);
    expect(CATEGORY_BY_SLUG.get("table-flip")!.items).toContain(TABLE_FLIP);
    expect(CATEGORY_BY_SLUG.get("table-flip")!.items).toContain(TABLE_BACK);
    expect(CATEGORY_BY_SLUG.get("disapproval")!.items[0]).toBe(DISAPPROVAL);
    expect(CATEGORY_BY_SLUG.get("bear")!.items).toContain("ʕ•ᴥ•ʔ");
    expect(CATEGORY_BY_SLUG.get("cat")!.items).toContain("(=^･ω･^=)");
    expect(CATEGORY_BY_SLUG.get("sad")!.items).toContain("orz");
  });

  it("every backslash in the data is a single, intentional character", () => {
    const withBackslash = all.filter((x) => x.k.includes("\\"));
    for (const { k } of withBackslash) expect(k, k).not.toMatch(/\\\\/);
    expect(withBackslash.length).toBeGreaterThan(0);
  });

  it("extra tags point to existing kaomoji and other categories", () => {
    const home = new Map(all.map((x) => [x.k, x.cat]));
    for (const [k, tags] of Object.entries(EXTRA_TAGS)) {
      expect(home.has(k), k).toBe(true);
      for (const t of tags) {
        expect(CATEGORY_BY_SLUG.has(t), `${k} → ${t}`).toBe(true);
        expect(t, k).not.toBe(home.get(k));
      }
    }
  });
});

describe("kaomoji search", () => {
  const cats = (q: string) => new Set(searchKaomoji(q).map((h) => h.cat));

  it("finds categories by Russian and English names regardless of locale", () => {
    expect(cats("котик").has("cat")).toBe(true);
    expect(cats("Cat").has("cat")).toBe(true);
    expect(cats("грусть")).toEqual(new Set(["sad"]));
    expect(cats("медведь").has("bear")).toBe(true);
    expect(cats("ёлки")).toEqual(new Set());
  });

  it("treats ё as е and ignores case", () => {
    expect(cats("СЛЕЗЫ").has("crying")).toBe(true);
  });

  it("includes tagged kaomoji from other categories", () => {
    expect(searchKaomoji("обнимашки").map((h) => h.k)).toContain("ʕっ•ᴥ•ʔっ");
  });

  it("matches symbols inside kaomoji", () => {
    expect(searchKaomoji("ツ").map((h) => h.k)).toContain(SHRUG);
    expect(searchKaomoji("ʖ").length).toBeGreaterThanOrEqual(10);
    expect(searchKaomoji("o_O").map((h) => h.k)).toContain("(o_O)");
  });

  it("returns every kaomoji at most once and nothing for an empty query", () => {
    const hits = searchKaomoji("love").map((h) => h.k);
    expect(new Set(hits).size).toBe(hits.length);
    expect(searchKaomoji("   ")).toEqual([]);
  });
});
