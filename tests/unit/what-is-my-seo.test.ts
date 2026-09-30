import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getSection, resolvePage, sectionPaths } from "@/registry";

/** SEO bar for the what-is-my pages (the site-wide invariants live in the registry tests). */
const section = getSection("what-is-my");
const paths = section ? sectionPaths(section) : [];

describe("what-is-my SEO", () => {
  it("publishes one top-level page per tool and no landing page", () => {
    expect(paths.length).toBe(18);
    for (const p of paths) expect(p).toHaveLength(1);
    expect(paths.map((p) => p[0])).not.toContain("what-is-my");
    expect(section?.hubPath ?? null).toBeNull();
  });

  for (const locale of LOCALES) {
    it(`titles, descriptions and content blocks (${locale})`, () => {
      const problems: string[] = [];
      for (const p of paths) {
        const page = resolvePage(locale, p);
        const key = p.join("/");
        if (!page) {
          problems.push(`${key}: missing`);
          continue;
        }
        if (page.title.length > 60) problems.push(`${key}: title ${page.title.length} chars`);
        if (page.description.length < 115 || page.description.length > 160) problems.push(`${key}: description ${page.description.length} chars`);
        if (!page.lead) problems.push(`${key}: no lead`);
        const faq = page.faq?.length ?? 0;
        const howTo = page.howTo?.length ?? 0;
        if (faq < 3 || faq > 5) problems.push(`${key}: ${faq} FAQ`);
        if (howTo < 3 || howTo > 5) problems.push(`${key}: ${howTo} howTo`);
        const about = page.blocks?.find((b) => b.type === "text");
        const paras = about?.type === "text" ? about.paragraphs.length : 0;
        if (paras < 2 || paras > 3) problems.push(`${key}: ${paras} about paragraphs`);
        if (!page.tool?.id.startsWith("what-is-my/")) problems.push(`${key}: tool id ${page.tool?.id}`);
        if (locale === "ru" && /[a-z]{3,}/i.test(page.h1.replace(/User-Agent|JavaScript|DPI|Do Not Track|Global Privacy Control|cookie/g, ""))) problems.push(`${key}: latin in ru h1 "${page.h1}"`);
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});
