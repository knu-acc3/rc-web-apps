import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getSection, resolvePage, sectionPaths } from "@/registry";

/** SEO quality bar for the sizes pages (lengths, chips, FAQ) — stricter than the site-wide registry test. */
const section = getSection("sizes")!;
const paths = sectionPaths(section);

describe("sizes SEO", () => {
  it("publishes every tool and variant family", () => {
    const tops = new Set(paths.map((p) => p[0]));
    expect([...tops].sort()).toEqual(
      ["aspect-ratio-calculator", "bra-size-calculator", "clothing-size-chart", "paper-sizes", "ppi-calculator", "ring-size-chart", "screen-resolutions", "shoe-size-chart", "tv-size-calculator"].sort(),
    );
    expect(paths.length).toBeGreaterThan(200);
  });

  for (const locale of LOCALES) {
    it(`titles, descriptions, chips and FAQ are within bounds (${locale})`, () => {
      const problems: string[] = [];
      for (const p of paths) {
        const key = p.join("/");
        const page = resolvePage(locale, p)!;
        if (page.title.length > 75) problems.push(`${key}: title ${page.title.length} "${page.title}"`);
        if (page.description.length < 100 || page.description.length > 175) problems.push(`${key}: description ${page.description.length} "${page.description}"`);
        if (!page.lead) problems.push(`${key}: no lead`);
        if (page.kind === "variant") {
          const chips = (page.topBlocks ?? []).reduce((n, b) => n + (b.type === "links" ? b.items.length : 0), 0);
          if (chips < 20 || chips > 60) problems.push(`${key}: ${chips} chips`);
          if ((page.faq?.length ?? 0) < 2) problems.push(`${key}: ${page.faq?.length ?? 0} FAQ`);
          if (!(page.blocks ?? []).some((b) => b.type === "facts" || b.type === "table")) problems.push(`${key}: no facts/table`);
        }
        if (page.kind === "tool" && (page.faq?.length ?? 0) < 3) problems.push(`${key}: tool FAQ`);
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});
