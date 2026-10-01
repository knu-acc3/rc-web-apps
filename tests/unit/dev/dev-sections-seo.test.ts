import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { allSections, resolvePage, sectionPaths } from "@/registry";
import { missingRelated } from "@/tools/dev/shared/related";

/** SEO quality bar for the developer sections (stricter than the site-wide registry test). */
const MINE = ["code", "data", "regex", "cron", "encode", "hash", "uuid", "dev"];

describe("developer sections SEO", () => {
  const sections = allSections().filter((s) => MINE.includes(s.id));
  const paths = sections.flatMap((s) => sectionPaths(s));

  for (const locale of LOCALES) {
    it(`titles, descriptions, leads, FAQ (${locale})`, () => {
      const problems: string[] = [];
      for (const p of paths) {
        const page = resolvePage(locale, p);
        const k = p.join("/");
        if (!page) {
          problems.push(`${k}: unresolved`);
          continue;
        }
        if (page.title.length > 72) problems.push(`${k}: title ${page.title.length} "${page.title}"`);
        if (page.description.length < 100 || page.description.length > 165) problems.push(`${k}: description ${page.description.length} "${page.description}"`);
        if (!/[.!?)»”"]$/.test(page.description.trim())) problems.push(`${k}: description doesn't end a sentence "${page.description}"`);
        if (!page.lead) problems.push(`${k}: no lead`);
        if (page.kind === "tool" && (page.faq?.length ?? 0) < 3) problems.push(`${k}: < 3 FAQ`);
        if (page.kind === "tool" && (page.howTo?.length ?? 0) < 3) problems.push(`${k}: < 3 howTo`);
        if (locale === "en" && /[а-яё]{4,}/i.test(`${page.title} ${page.h1}`) && !/рф|қаз|Анна|Борис|Василий/.test(page.title)) problems.push(`${k}: cyrillic in en title/h1`);
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }

  it("cycle-safe related keys all resolve", () => {
    for (const locale of LOCALES) for (const p of paths) resolvePage(locale, p);
    expect(missingRelated()).toEqual([]);
  });
});
