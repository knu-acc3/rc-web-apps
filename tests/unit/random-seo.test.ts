import { describe, expect, it } from "vitest";
import { BRAND } from "@/config/brand";
import { LOCALES } from "@/i18n/config";
import { allPaths, resolvePage } from "@/registry";
import { unresolvedRelated } from "@/registry/tool-section";
import type { Block, PageModel } from "@/registry/types";
import { randomSection } from "@/sections/random/section";
import { WHEEL_PRESETS } from "@/sections/random/data/wheel-presets";
import { COMPONENTS } from "@/sections/components";

/** SEO bar for every page of the random section (both locales). */
const paths = randomSection.paths();
const known = new Set(allPaths().map((p) => p.join("/")));

function linksOf(page: PageModel): string[][] {
  const out: string[][] = [];
  const blocks: Block[] = [...(page.topBlocks ?? []), ...(page.blocks ?? [])];
  for (const b of blocks) if (b.type === "links") out.push(...b.items.map((i) => i.path));
  for (const r of page.related ?? []) out.push(r.path);
  for (const c of page.breadcrumbs) out.push(c.path);
  return out;
}

describe("random section: SEO bar", () => {
  it("publishes the landing page, 14 tools and their variants", () => {
    const tools = paths.filter((p) => p.length === 1 && p[0] !== "random");
    expect(paths.some((p) => p.join("/") === "random")).toBe(true);
    expect(tools).toHaveLength(14);
    expect(paths.filter((p) => p[0] === "spin-the-wheel" && p.length === 2)).toHaveLength(WHEEL_PRESETS.length);
    expect(WHEEL_PRESETS.length).toBeGreaterThanOrEqual(25);
  });

  for (const locale of LOCALES) {
    it(`titles, descriptions and content blocks (${locale})`, () => {
      const problems: string[] = [];
      const seen = new Map<string, string>();
      for (const p of paths) {
        const key = p.join("/");
        const page = resolvePage(locale, p);
        if (!page) {
          problems.push(`${key}: does not resolve`);
          continue;
        }
        if (page.title.length > 66) problems.push(`${key}: title too long (${page.title.length}) "${page.title}"`);
        if (page.description.length < 120 || page.description.length > 160) problems.push(`${key}: description ${page.description.length} chars "${page.description}"`);
        for (const [what, v] of [
          ["title", page.title],
          ["description", page.description],
        ] as const) {
          if (seen.has(v)) problems.push(`${key}: duplicate ${what} with ${seen.get(v)}`);
          seen.set(v, key);
        }
        if (page.tool && !COMPONENTS[page.tool.id]) problems.push(`${key}: unknown component ${page.tool.id}`);
        if (page.path.join("/") !== key) problems.push(`${key}: path mismatch`);
        for (const l of linksOf(page)) if (l.length && !known.has(l.join("/"))) problems.push(`${key}: broken link /${l.join("/")}`);
        if (/бесплатные инструменты|free tools/i.test(page.title) || page.title.includes(BRAND.name)) problems.push(`${key}: boilerplate title`);
        if (locale === "ru" && /\b(the|and|with|for|your)\b/i.test(`${page.h1} ${page.lead ?? ""}`)) problems.push(`${key}: english words in ru h1/lead`);
        if (locale === "en" && /[а-яё]/i.test(`${page.title} ${page.h1}`)) problems.push(`${key}: Cyrillic in en title/h1`);
        if (page.kind === "tool") {
          if (!page.lead) problems.push(`${key}: no lead`);
          if (!page.howTo || page.howTo.length < 3 || page.howTo.length > 5) problems.push(`${key}: howTo ${page.howTo?.length}`);
          if (!page.faq || page.faq.length < 3 || page.faq.length > 5) problems.push(`${key}: faq ${page.faq?.length}`);
          const about = page.blocks?.find((b) => b.type === "text");
          if (!about || about.type !== "text" || about.paragraphs.length < 2 || about.paragraphs.length > 3) problems.push(`${key}: about paragraphs`);
          if (!page.related || page.related.length < 3) problems.push(`${key}: related`);
        }
        if (page.kind === "variant") {
          if (!page.lead) problems.push(`${key}: no lead`);
          if (!page.faq || page.faq.length < 2 || page.faq.length > 4) problems.push(`${key}: faq ${page.faq?.length}`);
          if (!page.blocks?.some((b) => b.type === "facts" || b.type === "table")) problems.push(`${key}: no facts/table`);
          if (!page.topBlocks?.length) problems.push(`${key}: no sibling chips`);
        }
      }
      expect(problems, problems.join("\n")).toEqual([]);
      expect(unresolvedRelated().filter((k) => paths.some((p) => k.startsWith(`${p[0]} →`)))).toEqual([]);
    });
  }

  it("wheel presets have sane entries in both languages", () => {
    for (const p of WHEEL_PRESETS) {
      for (const l of LOCALES) {
        const e = p.entries[l];
        expect(e.length, `${p.slug}/${l}`).toBeGreaterThanOrEqual(2);
        expect(e.length, `${p.slug}/${l}`).toBeLessThanOrEqual(100);
        expect(new Set(e).size, `${p.slug}/${l} duplicates`).toBe(e.length);
      }
      if (p.colors) expect(p.colors.length).toBe(p.entries.ru.length);
    }
    const eu = WHEEL_PRESETS.find((p) => p.slug === "countries-europe")!;
    expect(eu.entries.ru).toHaveLength(44);
    expect(eu.entries.en).toHaveLength(44);
    expect(WHEEL_PRESETS.find((p) => p.slug === "alphabet")!.entries.ru).toHaveLength(30);
  });
});
