import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { resolvePage, sectionPaths } from "@/registry";
import { pdfSection } from "@/tools/files/pdf/section";

/** SEO bar of the PDF section: every page has a focused title, a factual description and real content. */
describe("pdf section SEO", () => {
  const paths = sectionPaths(pdfSection);

  it("publishes the hub, 33 tools and their variants", () => {
    expect(paths.length).toBeGreaterThanOrEqual(50);
    expect(paths.some((p) => p.join("/") === "pdf")).toBe(true);
  });

  for (const locale of LOCALES) {
    it(`titles, descriptions and content are within bounds (${locale})`, () => {
      const problems: string[] = [];
      for (const p of paths) {
        const page = resolvePage(locale, p)!;
        const key = p.join("/");
        if (page.title.length > 65) problems.push(`${key}: title ${page.title.length} chars "${page.title}"`);
        if (page.description.length < 110 || page.description.length > 165) problems.push(`${key}: description ${page.description.length} chars`);
        if (!page.lead) problems.push(`${key}: no lead`);
        if (page.kind === "tool") {
          if ((page.howTo?.length ?? 0) < 3 || (page.howTo?.length ?? 0) > 5) problems.push(`${key}: howTo ${page.howTo?.length}`);
          if ((page.faq?.length ?? 0) < 3) problems.push(`${key}: faq ${page.faq?.length}`);
          if (!page.blocks?.some((b) => b.type === "text")) problems.push(`${key}: no about text`);
        }
        if (page.kind === "variant") {
          if (!page.blocks?.length) problems.push(`${key}: variant without specific data`);
          if ((page.faq?.length ?? 0) < 1) problems.push(`${key}: variant without FAQ`);
        }
        if (locale === "ru" && /[a-z]{4,}/.test(page.h1.replace(/PDF|JPG|PNG|HEIC|WebP|DOCX|Word|Markdown|ГОСТ|APA|MLA/g, ""))) problems.push(`${key}: latin word in ru h1 "${page.h1}"`);
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});
