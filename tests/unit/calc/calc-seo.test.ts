import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { resolvePage, sectionPaths } from "@/registry";
import { calcSection } from "@/tools/calc/calc/section";
import { financeSection } from "@/tools/calc/finance/section";
import { healthSection } from "@/tools/calc/health/section";

/** SEO bar for the calc, finance and health sections (titles, descriptions, leads, FAQ). */
const sections = [calcSection, financeSection, healthSection];

describe("calc/finance/health SEO bar", () => {
  for (const locale of LOCALES) {
    it(`titles ≤ 70 chars, descriptions 110–170 chars, lead present (${locale})`, () => {
      const problems: string[] = [];
      for (const s of sections) {
        for (const p of sectionPaths(s)) {
          const page = resolvePage(locale, p);
          const key = p.join("/");
          if (!page) {
            problems.push(`${key}: does not resolve`);
            continue;
          }
          if (page.title.length > 70) problems.push(`${key}: title ${page.title.length} "${page.title}"`);
          if (page.kind !== "hub" && (page.description.length < 110 || page.description.length > 170)) problems.push(`${key}: description ${page.description.length} "${page.description}"`);
          if (page.kind !== "hub" && !page.lead) problems.push(`${key}: no lead`);
          if (page.kind === "tool" && ((page.faq?.length ?? 0) < 3 || (page.howTo?.length ?? 0) < 3)) problems.push(`${key}: needs 3+ FAQ and howTo`);
          const data = (page.blocks ?? []).filter((b) => b.type !== "text");
          if (/NaN|undefined|Infinity/.test(`${page.title} ${page.description} ${page.lead ?? ""} ${JSON.stringify(data)}`) || /NaN|Infinity/.test(JSON.stringify(page.faq ?? []))) problems.push(`${key}: NaN/undefined in text`);
        }
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});
