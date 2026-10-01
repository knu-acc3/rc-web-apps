import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { allPaths, resolvePage } from "@/registry";
import { CATEGORIES } from "@/tools/symbols/kaomoji/data";
import { topChars } from "@/tools/symbols/kaomoji/section";

const paths = allPaths().filter((p) => p[0] === "kaomoji");

describe("kaomoji pages", () => {
  it("has the main page plus one page per category", () => {
    expect(paths.length).toBe(1 + CATEGORIES.length);
    for (const c of CATEGORIES) expect(paths.map((p) => p.join("/"))).toContain(`kaomoji/${c.slug}`);
  });

  for (const locale of LOCALES) {
    it(`titles ≤ 60 chars, descriptions 120–160 chars, 2–4 FAQ (${locale})`, () => {
      const problems: string[] = [];
      for (const p of paths) {
        const page = resolvePage(locale, p)!;
        const key = p.join("/");
        const tl = [...page.title].length;
        const dl = [...page.description].length;
        if (tl > 60) problems.push(`${key}: title ${tl} "${page.title}"`);
        if (dl < 120 || dl > 160) problems.push(`${key}: description ${dl} "${page.description}"`);
        if (!page.lead) problems.push(`${key}: no lead`);
        const faq = page.faq?.length ?? 0;
        if (page.kind === "variant" ? faq < 2 || faq > 4 : faq < 3 || faq > 5) problems.push(`${key}: ${faq} FAQ`);
        if (page.tool?.id !== "kaomoji/picker") problems.push(`${key}: tool ${page.tool?.id}`);
      }
      expect(problems).toEqual([]);
    });
  }

  it("variant pages pass their category to the picker and show sibling chips", () => {
    const page = resolvePage("ru", ["kaomoji", "cat"])!;
    expect(page.tool?.props).toEqual({ category: "cat" });
    const chips = page.topBlocks?.find((b) => b.type === "links");
    expect(chips && chips.type === "links" && chips.items.length).toBe(CATEGORIES.length - 1);
  });

  it("famous pages carry a code point table", () => {
    const page = resolvePage("en", ["kaomoji", "lenny-face"])!;
    const table = page.blocks?.find((b) => b.type === "table");
    expect(table && table.type === "table" && table.rows.map((r) => r[1])).toEqual(["U+0361", "U+00B0", "U+035C", "U+0296"]);
    const shrug = resolvePage("ru", ["kaomoji", "shrug"])!.blocks?.find((b) => b.type === "table");
    expect(shrug && shrug.type === "table" && shrug.rows.map((r) => r[1])).toEqual(["U+00AF", "U+005C", "U+005F", "U+0028", "U+30C4", "U+0029", "U+002F"]);
  });

  it("uses correct Russian plurals in counts", () => {
    const joy = resolvePage("ru", ["kaomoji", "joy"])!;
    expect(joy.lead).toMatch(/^\d+ японских смайликов /);
    const shrug = resolvePage("ru", ["kaomoji", "shrug"])!;
    expect(shrug.description).toMatch(/и ещё 17 вариантов:/);
  });

  it("topChars ranks characters by how many kaomoji contain them", () => {
    expect(topChars(["(^_^)", "(^o^)", "(T_T)"], 3)).toEqual(["^", "_", "o"]);
  });
});
