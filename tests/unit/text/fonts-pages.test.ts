import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import type { PageModel } from "@/registry/types";
import { fontsSection } from "@/tools/text/fonts/section";

/** SEO bar for every fonts page (the registry test checks site-wide invariants). */
const len = (s: string) => Array.from(s).length;
const paths = fontsSection.paths();

describe("fonts pages", () => {
  it("publishes the generator and its variants at /font-generator", () => {
    expect(paths[0]).toEqual(["font-generator"]);
    expect(paths.every((p) => p[0] === "font-generator")).toBe(true);
    expect(paths.length).toBeGreaterThanOrEqual(40);
  });

  for (const locale of LOCALES) {
    it(`meets the SEO bar (${locale})`, () => {
      const problems: string[] = [];
      const titles = new Set<string>();
      const descs = new Set<string>();
      for (const p of paths) {
        const key = p.join("/");
        const page = fontsSection.resolve(locale, p) as PageModel;
        if (!page) {
          problems.push(`${key}: does not resolve`);
          continue;
        }
        if (len(page.title) > 60) problems.push(`${key}: title ${len(page.title)} > 60 "${page.title}"`);
        const d = len(page.description);
        if (d < 120 || d > 160) problems.push(`${key}: description ${d} "${page.description}"`);
        if (!page.lead) problems.push(`${key}: no lead`);
        if (titles.has(page.title)) problems.push(`${key}: duplicate title`);
        if (descs.has(page.description)) problems.push(`${key}: duplicate description`);
        titles.add(page.title);
        descs.add(page.description);
        const faq = page.faq?.length ?? 0;
        const howTo = page.howTo?.length ?? 0;
        if (howTo < 3 || howTo > 5) problems.push(`${key}: howTo ${howTo}`);
        if (page.kind === "tool" && (faq < 3 || faq > 5)) problems.push(`${key}: faq ${faq}`);
        if (page.kind === "variant") {
          if (faq < 2 || faq > 4) problems.push(`${key}: faq ${faq}`);
          const chips = page.topBlocks?.find((b) => b.type === "links");
          if (!chips || chips.type !== "links" || chips.items.length < 20) problems.push(`${key}: fewer than 20 sibling chips`);
          if (!page.blocks?.some((b) => b.type === "facts" || b.type === "table")) problems.push(`${key}: no facts/table`);
        }
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});
