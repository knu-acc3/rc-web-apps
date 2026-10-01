import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import raw from "@/tools/symbols/symbols/data/symbols.json";
import { COLLECTION_META, CURATED, HUB_GROUPS, LOOKALIKES, POPULAR_SYMBOLS } from "@/tools/symbols/symbols/content/content";
import { COLLECTIONS, PAGES, pageOf, sym, SYMS } from "@/tools/symbols/symbols/lib/data";
import { parseIndex, search, type RawIndex, type RawRu } from "@/tools/symbols/symbols/lib/lookup";
import { symbolsSection } from "@/tools/symbols/symbols/section";

describe("gen-symbols output", () => {
  it("has the expected shape", () => {
    const d = raw as unknown as { blocks: unknown[][]; collections: { id: string; chars: string; pages: string[][] }[]; chars: Record<string, unknown[]> };
    expect(d.collections.length).toBeGreaterThanOrEqual(50);
    expect(Object.keys(d.chars).length).toBeGreaterThan(2500);
    expect(PAGES.length).toBeGreaterThan(450);
    expect(PAGES.length).toBeLessThan(700);
    for (const b of d.blocks) expect(b).toHaveLength(4);
    for (const r of Object.values(d.chars)) {
      expect(typeof r[0]).toBe("string");
      expect(r.length === 7 || r.length === 8).toBe(true);
    }
  });

  it("gives every character a Russian name", () => {
    for (const s of SYMS.values()) {
      expect(s.ru, `${s.ch} ${s.name}`).toBeTruthy();
      expect(s.ru).not.toMatch(/\b(SIGN|LETTER|WITH|ARROW)\b/);
    }
  });

  it("uses correct names from CLDR, rules and the curated dictionary", () => {
    expect(sym("°")!.ru).toBe("знак градуса");
    expect(sym("°")!.name).toBe("DEGREE SIGN");
    expect(sym("₸")!.ru).toBe("тенге");
    expect(sym("₸")!.name).toBe("TENGE SIGN");
    expect(sym("∞")!.ru).toBe("знак бесконечности");
    expect(sym("→")!.ru).toBe("стрелка вправо");
    expect(sym("Ё")!.ru).toBe("заглавная буква Ё");
    expect(sym("α")!.ru).toBe("греческая строчная буква альфа");
    expect(sym("é")!.ru).toBe("латинская строчная буква e с акутом");
    expect(sym("⑫")!.ru).toBe("число 12 в кружке");
    expect(sym("⠃")!.ru).toBe("шрифт Брайля, точки 1-2");
    expect(sym("Ⅳ")!.ru).toBe("римская цифра 4");
    expect(sym("🂡")!.ru).toBe("игральная карта: туз пик");
    expect(sym("⟶")!.ru).toBe("длинная стрелка вправо");
  });

  it("stores entities, Alt codes and blocks", () => {
    expect(sym("°")!.ext.e?.[0]).toBe("&deg;");
    expect(sym("→")!.ext.e?.[0]).toBe("&rarr;");
    expect(sym("♥")!.ext.e?.[0]).toBe("&hearts;");
    expect(sym("°")!.ext.w).toBe(176);
    expect(sym("°")!.ext.r).toBe(176);
    expect(sym("€")!.ext.w).toBe(128);
    expect(sym("€")!.ext.r).toBe(136);
    expect(sym("№")!.ext.r).toBe(185);
    expect(sym("№")!.ext.w).toBeUndefined();
    expect(sym("₸")!.ext.w).toBeUndefined();
    expect(sym("°")!.ext.m).toBe("⌥⇧8");
    expect(sym("∞")!.ext.t).toBe("\\infty");
    expect(sym("°")!.block[2]).toBe("Latin-1 Supplement");
    expect(sym("°")!.block[3]).toBe("Дополнение к латинице-1");
    expect(sym("→")!.block.slice(0, 2)).toEqual([0x2190, 0x21ff]);
  });

  it("keeps look-alike characters apart", () => {
    expect(sym("\u{212A}")!.name).toBe("KELVIN SIGN");
    expect(sym("\u{B5}")!.name).toBe("MICRO SIGN");
    expect(sym("\u{2126}")!.name).toBe("OHM SIGN");
    expect(sym("\u{A0}")!.name).toBe("NO-BREAK SPACE");
    expect(sym("\u{A0}")!.ext.d).toBe("NBSP");
  });

  it("gives each character at most one page and never pages emoji", () => {
    const seen = new Set<string>();
    for (const p of PAGES) {
      expect(seen.has(p.sym.ch), p.sym.ch).toBe(false);
      seen.add(p.sym.ch);
      expect(p.sym.ext.ep, p.sym.ch).toBeUndefined();
      expect(p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
    expect(pageOf.get("♈")).toBeUndefined();
    expect(sym("♈")!.ext.em).toBe("aries");
    expect(pageOf.get("°")!.slug).toBe("degree-sign");
    expect(pageOf.get("₸")!.slug).toBe("tenge-sign");
    expect(pageOf.get("∞")!.slug).toBe("infinity");
    expect(pageOf.get("♥")!.slug).toBe("black-heart-suit");
    expect(pageOf.get("Ә")!.slug).toBe("schwa");
    expect(pageOf.get("\u{A0}")!.slug).toBe("non-breaking-space");
  });
});

describe("symbol content", () => {
  it("describes every collection exactly once", () => {
    expect(Object.keys(COLLECTION_META).sort()).toEqual(COLLECTIONS.map((c) => c.id).sort());
    const grouped = HUB_GROUPS.flatMap((g) => g.ids);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(grouped.sort()).toEqual(COLLECTIONS.map((c) => c.id).sort());
  });

  it("curated texts and popular symbols point to pages", () => {
    for (const ch of Object.keys(CURATED)) expect(pageOf.get(ch), ch).toBeDefined();
    for (const ch of Array.from(POPULAR_SYMBOLS)) expect(pageOf.get(ch), ch).toBeDefined();
    for (const g of LOOKALIKES) for (const ch of Array.from(g.chars)) expect(g.note[ch], `${g.chars}: ${ch}`).toBeDefined();
  });
});

describe("symbol pages", () => {
  const paths = symbolsSection.paths();

  it("publishes hub, lookup tool, collections and symbol pages", () => {
    expect(paths.length).toBe(2 + COLLECTIONS.length + PAGES.length);
    expect(symbolsSection.mounts!()).toEqual(["symbols", "unicode-table"]);
    const pre = symbolsSection.prebuild!();
    expect(pre.length).toBeLessThan(paths.length);
    expect(pre.map((p) => p.join("/"))).toContain("symbols/units/degree-sign");
  });

  for (const locale of LOCALES) {
    it(`renders lean pages with unique titles (${locale})`, () => {
      const titles = new Set<string>();
      for (const p of paths) {
        const page = symbolsSection.resolve(locale, p)!;
        expect(page, p.join("/")).toBeTruthy();
        expect(titles.has(page.title), page.title).toBe(false);
        titles.add(page.title);
        const items = (page.tool?.props as { items?: unknown[] } | undefined)?.items?.length ?? 0;
        expect(items).toBeLessThanOrEqual(2500);
        expect(JSON.stringify(page.tool?.props ?? {}).length, p.join("/")).toBeLessThan(60_000);
        expect(page.description.length, p.join("/")).toBeGreaterThanOrEqual(90);
        if (page.kind === "entity") {
          const chips = page.topBlocks?.[0];
          expect(chips?.type === "links" && chips.items.length, p.join("/")).toBeGreaterThanOrEqual(30);
        }
      }
    });
  }

  it("builds a rich symbol page", () => {
    const page = symbolsSection.resolve("ru", ["symbols", "units", "degree-sign"])!;
    expect(page.h1).toBe("Знак градуса °");
    expect(page.title).toBe("° Знак градуса — скопировать символ, код");
    const typing = page.blocks!.find((b) => b.type === "table" && !!b.title?.startsWith("Как набрать"));
    expect(typing && typing.type === "table" && typing.rows.map((r) => r[1]).join(" ")).toContain("Alt+0176");
    const tenge = symbolsSection.resolve("ru", ["symbols", "currency", "tenge-sign"])!;
    expect(tenge.h1).toBe("Знак тенге ₸");
    const en = symbolsSection.resolve("en", ["symbols", "math", "infinity"])!;
    expect(en.title).toBe("∞ Infinity Symbol — Copy, Unicode");
  });

  it("rejects unknown paths", () => {
    expect(symbolsSection.resolve("ru", ["symbols", "nope"])).toBeNull();
    expect(symbolsSection.resolve("ru", ["symbols", "units", "nope"])).toBeNull();
    expect(symbolsSection.resolve("ru", ["symbols", "math", "degree-sign"])).toBeNull();
    expect(symbolsSection.resolve("ru", ["unicode-table", "x"])).toBeNull();
    expect(symbolsSection.resolve("ru", ["symbols", "units", "degree-sign", "x"])).toBeNull();
  });
});

describe("unicode lookup index", () => {
  const rawIdx = JSON.parse(readFileSync("src/tools/symbols/symbols/data/client/unicode.json", "utf8")) as RawIndex;
  const rawRu = JSON.parse(readFileSync("src/tools/symbols/symbols/data/client/unicode-ru.json", "utf8")) as RawRu;
  const idx = parseIndex(rawIdx, rawRu);

  it("is compact and complete enough", () => {
    expect(idx.cps.length).toBeGreaterThan(15_000);
    expect(readFileSync("src/tools/symbols/symbols/data/client/unicode.json").length).toBeLessThan(800_000);
    expect(idx.names[idx.byCp.get(0xb0)!]).toBe("DEGREE SIGN");
    expect(idx.ru[(0xb0).toString(36)]).toBe("знак градуса");
    expect(idx.pages[(0xb0).toString(36)]).toBe("units/degree-sign");
    expect(idx.emoji[(0x1f600).toString(36)]).toBe("grinning-face");
  });

  it("finds characters by code, entity, glyph and name", () => {
    expect(search(idx, "U+00B0", "en")[0]).toBe(0xb0);
    expect(search(idx, "0xB0", "en")[0]).toBe(0xb0);
    expect(search(idx, "&#176;", "en")[0]).toBe(0xb0);
    expect(search(idx, "&#xB0;", "en")[0]).toBe(0xb0);
    expect(search(idx, "&deg;", "en")[0]).toBe(0xb0);
    expect(search(idx, "°", "en")[0]).toBe(0xb0);
    expect(search(idx, "degree sign", "en")[0]).toBe(0xb0);
    expect(search(idx, "rightwards arrow", "en")).toContain(0x2192);
    expect(search(idx, "знак градуса", "ru")[0]).toBe(0xb0);
    expect(search(idx, "тенге", "ru")).toContain(0x20b8);
    expect(search(idx, "", "ru")).toEqual([]);
  });
});
