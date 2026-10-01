import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { resolvePage, sectionPaths } from "@/registry";
import { notesSection } from "@/tools/text/notes/section";
import { textSection } from "@/tools/text/text/section";

/** SEO bar for the text and notes sections: lengths, FAQ/howTo presence, variant data. */
const sections = [textSection, notesSection];

describe("text & notes SEO", () => {
  for (const locale of LOCALES) {
    it(`titles, descriptions, FAQ (${locale})`, () => {
      const problems: string[] = [];
      for (const s of sections) {
        for (const p of sectionPaths(s)) {
          const key = p.join("/");
          const page = resolvePage(locale, p);
          if (!page) {
            problems.push(`${key}: missing`);
            continue;
          }
          if (page.title.length > 66) problems.push(`${key}: title ${page.title.length} "${page.title}"`);
          if (page.description.length < 115 || page.description.length > 165) problems.push(`${key}: description ${page.description.length}`);
          if (!page.lead) problems.push(`${key}: no lead`);
          if (!page.faq || page.faq.length < (page.kind === "tool" ? 3 : 1)) problems.push(`${key}: faq ${page.faq?.length ?? 0}`);
          if (page.kind === "tool" && (!page.howTo || page.howTo.length < 3)) problems.push(`${key}: howTo`);
          if (page.kind === "variant" && !(page.blocks ?? []).some((b) => b.type === "facts" || b.type === "table" || b.type === "list"))
            problems.push(`${key}: variant without data block`);
        }
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});
