import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { resolvePage } from "@/registry";
import { CAT_IDS, OBJECTS } from "@/sections/actual-size/data/objects";
import { dimsText, objectVariants } from "@/sections/actual-size/content/pages";
import { ROUND_SHAPES } from "@/sections/actual-size/lib/types";

const get = (slug: string) => {
  const o = OBJECTS.find((x) => x.slug === slug);
  if (!o) throw new Error(`missing ${slug}`);
  return o;
};

describe("actual-size object data", () => {
  it("has enough objects and every category is filled", () => {
    expect(OBJECTS.length).toBeGreaterThanOrEqual(120);
    for (const c of CAT_IDS) expect(OBJECTS.some((o) => o.cat === c), c).toBe(true);
  });

  it("slugs are unique kebab-case", () => {
    const slugs = OBJECTS.map((o) => o.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("dimensions are positive and plausible", () => {
    for (const o of OBJECTS) {
      for (const v of [o.w, o.h, ...(o.d === undefined ? [] : [o.d])]) {
        expect(Number.isFinite(v) && v > 0, o.slug).toBe(true);
        expect(v, o.slug).toBeLessThan(500);
      }
      if (ROUND_SHAPES.has(o.shape)) expect(o.w, o.slug).toBe(o.h);
    }
  });

  it("every object has ru and en names", () => {
    for (const o of OBJECTS) {
      expect(o.name.ru.trim(), o.slug).not.toBe("");
      expect(o.name.en.trim(), o.slug).not.toBe("");
      if (o.note) expect(o.note.ru && o.note.en, o.slug).toBeTruthy();
    }
  });

  it("years and screen diagonals are only set where known and in range", () => {
    for (const o of OBJECTS) {
      if (o.year !== undefined) {
        expect(["iphone", "android", "gadgets"], o.slug).toContain(o.cat);
        expect(o.year).toBeGreaterThanOrEqual(2017);
        expect(o.year).toBeLessThanOrEqual(2026);
      }
      if (o.diag !== undefined) {
        expect(o.diag).toBeGreaterThan(4);
        expect(o.diag).toBeLessThan(14);
      }
    }
  });

  it("matches reference specifications", () => {
    expect([get("bank-card").w, get("bank-card").h, get("bank-card").r]).toEqual([85.6, 53.98, 3.18]);
    expect([get("nano-sim").w, get("nano-sim").h]).toEqual([12.3, 8.8]);
    expect([get("micro-sim").w, get("micro-sim").h]).toEqual([15, 12]);
    expect([get("mini-sim").w, get("mini-sim").h]).toEqual([25, 15]);
    expect([get("a4").w, get("a4").h]).toEqual([210, 297]);
    expect([get("aa").w, get("aa").h]).toEqual([14.5, 50.5]);
    expect([get("aaa").w, get("aaa").h]).toEqual([10.5, 44.5]);
    expect([get("cr2032").w, get("cr2032").d]).toEqual([20, 3.2]);
    expect([get("lego-brick-2x4").w, get("lego-brick-2x4").h, get("lego-brick-2x4").d]).toEqual([31.8, 15.8, 9.6]);
    expect([get("usb-c").w, get("usb-c").h]).toEqual([8.25, 2.4]);
    const euro: Record<string, number> = {
      "1-euro-cent": 16.25,
      "2-euro-cents": 18.75,
      "5-euro-cents": 21.25,
      "10-euro-cents": 19.75,
      "20-euro-cents": 22.25,
      "50-euro-cents": 24.25,
      "1-euro": 23.25,
      "2-euro": 25.75,
    };
    for (const [s, d] of Object.entries(euro)) expect(get(s).w, s).toBe(d);
    const us: Record<string, number> = { "us-penny": 19.05, "us-nickel": 21.21, "us-dime": 17.91, "us-quarter": 24.26 };
    for (const [s, d] of Object.entries(us)) expect(get(s).w, s).toBe(d);
    // National Bank of Kazakhstan catalogue
    const kzt: Record<string, number> = { "1-tenge": 15, "2-tenge": 16, "5-tenge": 17.27, "10-tenge": 19.56, "20-tenge": 18.27, "50-tenge": 23, "100-tenge": 24.5, "200-tenge": 26 };
    for (const [s, d] of Object.entries(kzt)) expect(get(s).w, s).toBe(d);
    const rub: Record<string, number> = { "1-ruble": 20.5, "2-rubles": 23, "5-rubles": 25, "10-rubles": 22 };
    for (const [s, d] of Object.entries(rub)) expect(get(s).w, s).toBe(d);
  });

  it("formats sizes with correct units and Russian plurals", () => {
    expect(dimsText(get("bank-card"), "ru")).toBe("85,6 × 53,98 мм");
    expect(dimsText(get("bank-card"), "en", "cm")).toBe("8.56 × 5.4 cm");
    expect(dimsText(get("1-euro"), "en")).toBe("⌀ 23.25 mm");
    expect(dimsText(get("letter"), "ru", "in")).toBe("8,5 × 11 дюймов");
    expect(dimsText(get("photo-2x2-inch"), "ru", "in")).toBe("2 × 2 дюйма");
    expect(dimsText(get("bank-card"), "ru", "in")).toBe("3,37 × 2,13 дюйма");
    // devices: height × width × depth, like spec sheets
    expect(dimsText(get("iphone-15"), "en", "mm", true)).toBe("147.6 × 71.6 × 7.8 mm");
  });
});

describe("actual-size object pages", () => {
  const variants = objectVariants();

  it("one page per object with unique titles and descriptions", () => {
    expect(variants.length).toBe(OBJECTS.length);
    for (const l of LOCALES) {
      const titles = variants.map((v) => v.title[l]);
      const descs = variants.map((v) => v.description[l]);
      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(descs).size).toBe(descs.length);
    }
  });

  it("titles and descriptions have SEO-friendly lengths", () => {
    const bad: string[] = [];
    for (const v of variants)
      for (const l of LOCALES) {
        if (v.title[l].length > 62) bad.push(`${v.slug} ${l} title ${v.title[l].length}: ${v.title[l]}`);
        const d = v.description[l].length;
        if (d < 110 || d > 160) bad.push(`${v.slug} ${l} desc ${d}: ${v.description[l]}`);
      }
    expect(bad).toEqual([]);
  });

  it("variant pages show 20–50 chips, facts and FAQ", () => {
    for (const l of LOCALES)
      for (const o of OBJECTS) {
        const page = resolvePage(l, ["actual-size", o.slug]);
        expect(page, o.slug).not.toBeNull();
        const chips = (page!.topBlocks ?? []).reduce((n, b) => n + (b.type === "links" ? b.items.length : 0), 0);
        expect(chips, o.slug).toBeGreaterThanOrEqual(20);
        expect(chips, o.slug).toBeLessThanOrEqual(50);
        expect(page!.blocks?.some((b) => b.type === "facts"), o.slug).toBe(true);
        expect(page!.faq?.length ?? 0, o.slug).toBeGreaterThanOrEqual(2);
      }
  });

  it("tool pages are top-level", () => {
    for (const p of [["actual-size"], ["screen-calibration"], ["online-ruler"], ["inch-ruler"], ["protractor"]]) {
      const page = resolvePage("ru", p);
      expect(page?.path, p.join("/")).toEqual(p);
      expect(page?.kind).toBe("tool");
    }
  });
});
