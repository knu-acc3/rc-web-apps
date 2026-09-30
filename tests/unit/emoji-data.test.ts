import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import raw from "@/sections/emoji/data/emoji.json";
import { EMOJI, bySlug, bySub, findGlyph, graphemes, topicEmoji, GROUP_KEYS, SUBGROUP_KEYS, popular } from "@/sections/emoji/data";
import { GROUPS, SUBGROUPS, VERSIONS } from "@/sections/emoji/labels";
import { ALIASES, TOPICS } from "@/sections/emoji/topics";
import { POPULAR } from "@/sections/emoji/popular";
import { emojiSection } from "@/sections/emoji/section";
import { cssEscape, htmlDec, htmlHex, jsEscape, pyEscape, uPlus, utf16, utf8 } from "@/sections/emoji/shared/codes";

describe("gen-emoji output", () => {
  it("has the expected shape", () => {
    const d = raw as unknown as { groups: string[]; subgroups: [string, number][]; tones: { ru: string[]; en: string[] }; emoji: unknown[][] };
    expect(d.groups).toHaveLength(9);
    expect(d.subgroups.length).toBeGreaterThan(90);
    expect(d.tones.ru).toHaveLength(5);
    expect(d.emoji.length).toBeGreaterThan(1850);
    expect(d.emoji.length).toBeLessThan(1950);
    for (const r of d.emoji) {
      expect(typeof r[0]).toBe("string");
      expect(typeof r[1]).toBe("string");
      expect(typeof r[2]).toBe("number");
      expect(typeof r[3]).toBe("number");
      expect(r.length === 8 || r.length === 9).toBe(true);
    }
  });

  it("slugs are unique, kebab-case and never reserved", () => {
    const slugs = EMOJI.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const r of ["group", "subgroup", "topic"]) expect(bySlug.has(r)).toBe(false);
  });

  it("uses CLDR names", () => {
    const heart = findGlyph("❤️")!;
    expect(heart.slug).toBe("red-heart");
    expect(heart.ru).toBe("красное сердце");
    expect(heart.ext.ruAlt).toBe("алое сердце");
    expect(findGlyph("😀")!.ru).toBe("широко улыбается");
    expect(findGlyph("👍")!.slug).toBe("thumbs-up");
    expect(findGlyph("👍")!.ru).toBe("большой палец вверх");
    const kz = findGlyph("🇰🇿")!;
    expect(kz.slug).toBe("flag-kazakhstan");
    expect(kz.ru).toBe("флаг: Казахстан");
    expect(kz.ext.rg).toBe("asia");
    expect(findGlyph("🇷🇺")!.ext.rg).toBe("europe");
    expect(findGlyph("#️⃣")!.slug).toBe("keycap-number-sign");
    expect(findGlyph("🪅")!.slug).toBe("pinata");
  });

  it("has correct groups, versions and fully-qualified glyphs", () => {
    expect(findGlyph("🍦")!.sub).toBe("food-sweet");
    expect(findGlyph("⌚")!.sub).toBe("time");
    expect(findGlyph("🏴󠁧󠁢󠁳󠁣󠁴󠁿")!.sub).toBe("subdivision-flag");
    expect(findGlyph("👍")!.glyph).toBe("\u{1F44D}");
    expect(findGlyph("❤️")!.glyph).toBe("❤️");
    for (const e of EMOJI) {
      expect(e.version).toBeLessThanOrEqual(16);
      expect(VERSIONS[String(e.version)], `${e.glyph} ${e.version}`).toBeDefined();
      expect(e.ru.length).toBeGreaterThan(1);
    }
  });

  it("keeps skin tones and hair styles on the base emoji", () => {
    const thumbs = findGlyph("👍")!;
    expect(thumbs.ext.sk?.map((s) => s[0])).toEqual(["👍🏻", "👍🏼", "👍🏽", "👍🏾", "👍🏿"]);
    expect(findGlyph("👍🏻")).toBeUndefined();
    const man = findGlyph("👨")!;
    expect(man.ext.hair?.map((h) => h[1])).toEqual(["red", "curly", "white", "bald"]);
    expect(findGlyph("👨‍🦰")).toBeUndefined();
    expect(findGlyph("🧑‍🤝‍🧑")!.ext.sk).toHaveLength(25);
  });

  it("writes compact client search indexes", () => {
    for (const locale of LOCALES) {
      const file = readFileSync(`public/vendor/emoji/index-${locale}.json`, "utf8");
      const idx = JSON.parse(file) as { g: string[]; e: [string, string, string, string, number][] };
      expect(idx.e).toHaveLength(EMOJI.length);
      expect(file.length).toBeLessThan(400_000);
      const heart = idx.e.find((r) => r[1] === "red-heart")!;
      expect(heart[2]).toBe(locale === "ru" ? "красное сердце" : "red heart");
      expect(heart[3]).toContain(":heart:");
    }
  });
});

describe("emoji catalog", () => {
  it("labels every group and subgroup", () => {
    for (const g of GROUP_KEYS) expect(GROUPS[g], g).toBeDefined();
    for (const s of SUBGROUP_KEYS) expect(SUBGROUPS[s], s).toBeDefined();
  });

  it("topics reference existing emoji and are big enough", () => {
    for (const t of TOPICS) {
      for (const g of graphemes(`${t.add ?? ""}${t.exclude ?? ""}`)) expect(findGlyph(g), `${t.slug}: ${g}`).toBeDefined();
      for (const s of t.sub ?? []) expect(bySub.has(s), `${t.slug}: ${s}`).toBe(true);
      const n = topicEmoji(t).length;
      expect(n, t.slug).toBeGreaterThanOrEqual(8);
      expect(n, t.slug).toBeLessThanOrEqual(400);
    }
    const slugs = [...TOPICS, ...ALIASES].map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(TOPICS.length).toBeGreaterThanOrEqual(45);
  });

  it("popular list is valid", () => {
    for (const g of graphemes(POPULAR)) expect(findGlyph(g), g).toBeDefined();
    expect(new Set(popular(300)).size).toBe(300);
  });
});

describe("emoji pages", () => {
  const paths = emojiSection.paths();

  it("publishes every emoji, group, subgroup and topic", () => {
    const subPages = SUBGROUP_KEYS.filter((s) => (bySub.get(s)?.length ?? 0) >= 5);
    expect(subPages.length).toBeGreaterThan(80);
    expect(paths.length).toBe(1 + EMOJI.length + GROUP_KEYS.length + subPages.length + TOPICS.length);
    expect(emojiSection.resolve("ru", ["subgroup", "animal-amphibian"])).toBeNull();
    const pre = emojiSection.prebuild!();
    expect(pre.length).toBeLessThan(paths.length);
    const all = new Set(paths.map((p) => p.join("/")));
    for (const p of pre) expect(all.has(p.join("/"))).toBe(true);
  });

  for (const locale of LOCALES) {
    it(`renders lean pages with unique titles (${locale})`, () => {
      const titles = new Set<string>();
      for (const p of paths) {
        const page = emojiSection.resolve(locale, p)!;
        expect(page, p.join("/")).toBeTruthy();
        expect(titles.has(page.title), page.title).toBe(false);
        titles.add(page.title);
        const props = JSON.stringify(page.tool?.props ?? {});
        const items = (page.tool?.props as { items?: unknown[] } | undefined)?.items?.length ?? 0;
        expect(items).toBeLessThanOrEqual(2500);
        expect(props.length, p.join("/")).toBeLessThan(60_000);
        expect(page.description.length, p.join("/")).toBeGreaterThanOrEqual(90);
      }
    });
  }

  it("builds a rich emoji page", () => {
    const page = emojiSection.resolve("ru", ["red-heart"])!;
    expect(page.title).toBe("❤️ Красное сердце — эмодзи: значение, копировать");
    expect(page.h1).toBe("Эмодзи «Красное сердце» ❤️");
    const chips = page.topBlocks![0];
    expect(chips.type === "links" && chips.items.length).toBeGreaterThanOrEqual(30);
    expect(chips.type === "links" && chips.items.length).toBeLessThanOrEqual(50);
    const codes = page.blocks!.find((b) => b.type === "table" && b.mono);
    expect(codes && codes.type === "table" && codes.rows.map((r) => r[1])).toContain("&#x2764;&#xFE0F;");
    const en = emojiSection.resolve("en", ["flag-kazakhstan"])!;
    expect(en.title).toBe("🇰🇿 Flag of Kazakhstan Emoji — Meaning & Copy");
  });

  it("rejects unknown and nested paths", () => {
    expect(emojiSection.resolve("ru", ["no-such-emoji"])).toBeNull();
    expect(emojiSection.resolve("ru", ["group"])).toBeNull();
    expect(emojiSection.resolve("ru", ["red-heart", "x"])).toBeNull();
    expect(emojiSection.resolve("ru", ["group", "smileys-emotion", "x"])).toBeNull();
    expect(emojiSection.resolve("ru", ["topic", "hearts"])).toBeNull();
  });
});

describe("character codes", () => {
  it("formats code points", () => {
    expect(uPlus("❤️")).toBe("U+2764 U+FE0F");
    expect(htmlHex("😀")).toBe("&#x1F600;");
    expect(htmlDec("❤️")).toBe("&#10084;&#65039;");
    expect(cssEscape("😀")).toBe("\\1F600");
    expect(jsEscape("😀")).toBe("\\u{1F600}");
    expect(jsEscape("°")).toBe("\\u00B0");
    expect(pyEscape("😀")).toBe("\\U0001f600");
    expect(utf16("😀")).toBe("D83D DE00");
    expect(utf8("°")).toBe("C2 B0");
    expect(utf8("😀")).toBe("F0 9F 98 80");
  });
});
