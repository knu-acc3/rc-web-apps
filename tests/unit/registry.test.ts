import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { BRAND } from "@/config/brand";
import { allPaths, allSections, resolvePage, searchEntries, sectionPaths } from "@/registry";
import { unresolvedRelated } from "@/registry/tool-section";
import { COMPONENTS } from "@/sections/components";
import type { Block, PageModel } from "@/registry/types";

/**
 * Site-wide invariants for every page of every section:
 * resolvable, unique SEO fields, existing tool components, no broken internal links.
 * Pass SECTION=<id> to check a single section quickly.
 */
const only = process.env.SECTION;
const paths = only ? allSections().filter((s) => s.id === only).flatMap((s) => sectionPaths(s)) : allPaths();
const onlyPaths = new Set(paths.map((p) => p.join("/")));
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

describe("registry", () => {
  it("section ids are unique", () => {
    const ids = allSections().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("paths are unique and lowercase kebab-case", () => {
    const keys = paths.map((p) => p.join("/"));
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k, k).toMatch(/^[a-z0-9]+(?:[-.+][a-z0-9]+)*(?:\/[a-z0-9]+(?:[-.+][a-z0-9]+)*)*$/);
  });

  for (const locale of LOCALES) {
    it(`every page resolves with valid SEO fields (${locale})`, () => {
      const titles = new Map<string, string>();
      const descs = new Map<string, string>();
      const problems: string[] = [];
      for (const p of paths) {
        const key = p.join("/");
        const page = resolvePage(locale, p);
        if (!page) {
          problems.push(`${key}: does not resolve`);
          continue;
        }
        if (page.path.join("/") !== key) problems.push(`${key}: page.path mismatch (${page.path.join("/")})`);
        if (!page.h1.trim()) problems.push(`${key}: empty h1`);
        if (page.title.length < 10) problems.push(`${key}: title too short "${page.title}"`);
        if (page.description.length < 50) problems.push(`${key}: description too short (${page.description.length})`);
        if (page.kind !== "static" && titles.has(page.title)) problems.push(`${key}: duplicate title with ${titles.get(page.title)}`);
        if (page.kind !== "static" && descs.has(page.description)) problems.push(`${key}: duplicate description with ${descs.get(page.description)}`);
        titles.set(page.title, key);
        descs.set(page.description, key);
        if (page.tool && !COMPONENTS[page.tool.id]) problems.push(`${key}: unknown tool component ${page.tool.id}`);
        for (const l of linksOf(page)) {
          const lk = l.join("/");
          if (lk && !known.has(lk)) problems.push(`${key}: broken link /${lk}`);
        }
        if (/бесплатные инструменты|free tools/i.test(page.title) || (page.kind !== "static" && page.title.includes(BRAND.name))) problems.push(`${key}: boilerplate title "${page.title}"`);
        if (locale === "ru" && /\b(the|and|with|for|your)\b/i.test(`${page.h1} ${page.lead ?? ""}`)) problems.push(`${key}: english words in ru h1/lead`);
      }
      expect(problems.slice(0, 50), problems.join("\n")).toEqual([]);
    });

    it(`related links resolve (${locale})`, () => {
      for (const p of paths) resolvePage(locale, p);
      expect(unresolvedRelated()).toEqual([]);
    });

    it(`search index entries point to existing pages (${locale})`, () => {
      const bad = searchEntries(locale)
        .filter((e) => !only || onlyPaths.has(e.path.join("/")))
        .filter((e) => !known.has(e.path.join("/")))
        .map((e) => e.path.join("/"));
      expect(bad).toEqual([]);
    });
  }
});
