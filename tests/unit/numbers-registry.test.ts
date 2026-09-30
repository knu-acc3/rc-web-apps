import { describe, expect, it } from "vitest";
import { BRAND } from "@/config/brand";
import { LOCALES } from "@/i18n/config";
import { allPaths, getSection, resolvePage, searchEntries, sectionPaths } from "@/registry";
import { unresolvedRelated } from "@/registry/tool-section";
import { COMPONENTS } from "@/sections/components";
import type { Block, PageModel } from "@/registry/types";

/**
 * Registry invariants scoped to the sections built in this branch.
 * (tests/unit/registry.test.ts filters by `p[0] === SECTION`, which no longer matches
 * once tools are top-level pages, so that filter checks nothing for these sections.)
 * Run one section: npx vitest run tests/unit/numbers-registry.test.ts -t "sizes"
 */
const SECTIONS = ["numbers", "sizes", "actual-size", "test", "what-is-my"];
const known = new Set(allPaths().map((p) => p.join("/")));

function linksOf(page: PageModel): string[][] {
  const out: string[][] = [];
  const blocks: Block[] = [...(page.topBlocks ?? []), ...(page.blocks ?? [])];
  for (const b of blocks) {
    if (b.type === "links") out.push(...b.items.map((i) => i.path), ...(b.more ? [b.more.path] : []));
    if (b.type === "glyphs") for (const i of b.items) if (i.path) out.push(i.path);
  }
  for (const r of page.related ?? []) out.push(r.path);
  for (const c of page.breadcrumbs) out.push(c.path);
  return out;
}

// Titles/descriptions must be unique across the whole site, so index every page first.
const siteTitles = new Map<string, string>();
const siteDescs = new Map<string, string>();
for (const locale of LOCALES)
  for (const p of allPaths()) {
    const page = resolvePage(locale, p);
    if (!page || page.kind === "static") continue;
    const key = `${locale}:${p.join("/")}`;
    const tk = `${locale}:${page.title}`;
    const dk = `${locale}:${page.description}`;
    siteTitles.set(tk, siteTitles.has(tk) ? `${siteTitles.get(tk)} + ${key}` : key);
    siteDescs.set(dk, siteDescs.has(dk) ? `${siteDescs.get(dk)} + ${key}` : key);
  }

describe.each(SECTIONS)("section %s", (id) => {
  const section = getSection(id);
  const paths = section ? sectionPaths(section) : [];

  it("publishes pages", () => {
    expect(section).toBeDefined();
    expect(paths.length).toBeGreaterThan(0);
  });

  for (const locale of LOCALES) {
    it(`every page is valid (${locale})`, () => {
      const problems: string[] = [];
      for (const p of paths) {
        const key = p.join("/");
        const page = resolvePage(locale, p);
        if (!page) {
          problems.push(`${key}: does not resolve`);
          continue;
        }
        if (page.path.join("/") !== key) problems.push(`${key}: page.path mismatch (${page.path.join("/")})`);
        if (!/^[a-z0-9]+(?:[-.+][a-z0-9]+)*(?:\/[a-z0-9]+(?:[-.+][a-z0-9]+)*)*$/.test(key)) problems.push(`${key}: not kebab-case`);
        if (!page.h1.trim()) problems.push(`${key}: empty h1`);
        if (page.title.length < 10) problems.push(`${key}: title too short "${page.title}"`);
        if (page.description.length < 50) problems.push(`${key}: description too short (${page.description.length})`);
        const dupT = siteTitles.get(`${locale}:${page.title}`) ?? "";
        const dupD = siteDescs.get(`${locale}:${page.description}`) ?? "";
        if (dupT.includes(" + ")) problems.push(`${key}: duplicate title (${dupT})`);
        if (dupD.includes(" + ")) problems.push(`${key}: duplicate description (${dupD})`);
        if (page.tool && !COMPONENTS[page.tool.id]) problems.push(`${key}: unknown tool component ${page.tool.id}`);
        for (const l of linksOf(page)) {
          const lk = l.join("/");
          if (lk && !known.has(lk)) problems.push(`${key}: broken link /${lk}`);
        }
        if (/бесплатные инструменты|free tools/i.test(page.title) || page.title.includes(BRAND.name)) problems.push(`${key}: boilerplate title "${page.title}"`);
        if (locale === "ru" && /\b(the|and|with|for|your)\b/i.test(`${page.h1} ${page.lead ?? ""}`)) problems.push(`${key}: english words in ru h1/lead`);
        if (page.kind === "tool") {
          if ((page.howTo?.length ?? 0) < 3) problems.push(`${key}: fewer than 3 howTo steps`);
          if ((page.faq?.length ?? 0) < 3) problems.push(`${key}: fewer than 3 FAQ`);
        }
        if (page.kind === "variant") {
          const chips = (page.topBlocks ?? []).filter((b) => b.type === "links").reduce((n, b) => n + (b.type === "links" ? b.items.length : 0), 0);
          if (chips > 60) problems.push(`${key}: ${chips} sibling chips (max ~50)`);
        }
      }
      expect(problems.slice(0, 50), problems.join("\n")).toEqual([]);
    });

    it(`related links resolve and search entries exist (${locale})`, () => {
      const mine = new Set(paths.map((p) => p.join("/")));
      const bad = searchEntries(locale)
        .map((e) => e.path.join("/"))
        .filter((k) => mine.has(k.split("/")[0]) || mine.has(k))
        .filter((k) => !known.has(k));
      expect(bad).toEqual([]);
      const tops = new Set(paths.map((p) => p[0]));
      expect(unresolvedRelated().filter((r) => tops.has(r.split(" → ")[0]))).toEqual([]);
    });
  }
});
