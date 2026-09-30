import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getSection, resolvePage, sectionPaths } from "@/registry";

/** SEO length targets for the device-test pages (title ≤ 60, description 120–160). */
describe("device tests SEO", () => {
  const section = getSection("test")!;
  const paths = sectionPaths(section);

  it("publishes 12 tools and 8 variants, no group landing page", () => {
    expect(paths.filter((p) => p.length === 1)).toHaveLength(12);
    expect(paths.filter((p) => p.length === 2)).toHaveLength(8);
    expect(paths.some((p) => p[0] === "test")).toBe(false);
  });

  for (const locale of LOCALES) {
    it(`titles and descriptions fit (${locale})`, () => {
      const problems: string[] = [];
      for (const p of paths) {
        const page = resolvePage(locale, p)!;
        const key = p.join("/");
        if (page.title.length > 60) problems.push(`${key}: title ${page.title.length} "${page.title}"`);
        if (page.description.length < 120 || page.description.length > 160) problems.push(`${key}: description ${page.description.length}`);
        if (!page.lead) problems.push(`${key}: no lead`);
        if (page.kind === "tool") {
          const about = page.blocks?.find((b) => b.type === "text");
          if (!about || about.type !== "text" || about.paragraphs.length < 2) problems.push(`${key}: about < 2 paragraphs`);
          if ((page.howTo?.length ?? 0) > 5 || (page.faq?.length ?? 0) > 5) problems.push(`${key}: too many howTo/FAQ`);
        }
        if (page.kind === "variant") {
          if (!page.blocks?.some((b) => b.type === "facts")) problems.push(`${key}: no facts block`);
          if ((page.faq?.length ?? 0) < 2) problems.push(`${key}: fewer than 2 FAQ`);
        }
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});
