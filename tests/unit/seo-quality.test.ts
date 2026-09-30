import { describe, expect, it } from "vitest";
import { BRAND } from "@/config/brand";
import { LOCALES, type Locale } from "@/i18n/config";
import { allPaths, resolvePage } from "@/registry";
import type { Block, PageModel } from "@/registry/types";

/**
 * SEO quality of every page, on top of the registry invariants (resolvable, unique titles/descriptions,
 * no broken links): the title is "<exact query> | <second way to search for it>", the H1 is the query itself
 * and unique, the description is a real sentence of the right length, every variant page carries data of its
 * own, and pages of one family are not copies of each other with one number swapped.
 * SECTION=<id> limits the run to one section's paths.
 */
const only = process.env.SECTION;
const paths = allPaths().filter((p) => !only || resolvePage("ru", p)?.sectionId === only);

const BANNED = /бесплатн\S* (?:онлайн|инструмент)|онлайн бесплатно|скачать бесплатно|free online tools|free tools|online for free/i;
const words = (s: string) => s.toLowerCase().replace(/ё/g, "е").match(/[\p{L}\p{N}]+/gu) ?? [];

function blockText(b: Block): string {
  switch (b.type) {
    case "text":
      return b.paragraphs.join(" ");
    case "list":
      return b.items.join(" ");
    case "facts":
      return b.rows.flat().join(" ");
    case "table":
      return b.rows.flat().join(" ");
    case "links":
      return "";
    case "glyphs":
      return b.items.map((i) => i.label).join(" ");
  }
}

/** Visible text that is specific to the page (chips and related links excluded). */
function pageText(p: PageModel): string {
  return [p.title, p.h1, p.description, p.lead ?? "", ...(p.blocks ?? []).map(blockText), ...(p.faq ?? []).flatMap((q) => [q.q, q.a])].join(" ");
}

function shingles(text: string): Set<string> {
  const w = words(text);
  const out = new Set<string>();
  for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

describe.each(LOCALES)("SEO quality (%s)", (locale: Locale) => {
  const pages = paths.map((p) => resolvePage(locale, p)!).filter((p) => p && p.kind !== "static");

  it("titles: '<query> | <alternative>', specific, not boilerplate", () => {
    const bad: string[] = [];
    for (const p of pages) {
      const parts = p.title.split(" | ");
      // A title that is already long may stay one phrase; everything shorter gets its second half.
      if (parts.length > 2 || parts.some((x) => x.trim().length < 3) || (parts.length === 1 && p.title.length < 45)) bad.push(`${p.path.join("/")}: "${p.title}" is not "A | B"`);
      if (BANNED.test(p.title) || p.title.includes(BRAND.name)) bad.push(`${p.path.join("/")}: boilerplate "${p.title}"`);
      if (p.title.length > 90) bad.push(`${p.path.join("/")}: title too long (${p.title.length})`);
      // The first half is the H1 query (word forms may differ: "курсив" / "курсивный").
      const stem = (w: string) => w.slice(0, w.length <= 5 ? 4 : 5);
      const STOP = new Set(["онлайн", "online", "на", "в", "и", "с", "по", "для", "из", "the", "a", "an", "of", "to", "in", "for", "and", "with"]);
      const h1 = new Set(words(p.h1).filter((w) => !STOP.has(w) && w.length > 1).map(stem));
      const head = words(parts[0] ?? "").map(stem);
      if (h1.size && head.filter((w) => h1.has(w)).length < 1) bad.push(`${p.path.join("/")}: title "${p.title}" doesn't start with the h1 query "${p.h1}"`);
    }
    expect(bad.slice(0, 40), `${bad.length} problems\n${bad.slice(0, 40).join("\n")}`).toEqual([]);
  }, 300_000);

  it("h1 is unique across the site", () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const p of pages) {
      const k = p.h1.toLowerCase();
      if (seen.has(k)) dup.push(`${p.path.join("/")} = ${seen.get(k)}: "${p.h1}"`);
      else seen.set(k, p.path.join("/"));
    }
    expect(dup.slice(0, 40), `${dup.length} duplicates\n${dup.slice(0, 40).join("\n")}`).toEqual([]);
  }, 300_000);

  it("descriptions are 90–200 characters (shown clamped to 160) and every tool/variant page has a lead", () => {
    const bad: string[] = [];
    for (const p of pages) {
      const n = p.description.replace(/\s+/g, " ").trim().length;
      if (n < 90 || n > 200) bad.push(`${p.path.join("/")}: description ${n} chars`);
      if (p.kind !== "hub" && !p.lead) bad.push(`${p.path.join("/")}: no lead`);
    }
    expect(bad.slice(0, 40), `${bad.length} problems\n${bad.slice(0, 40).join("\n")}`).toEqual([]);
  }, 300_000);

  it("variant and entity pages carry data of their own", () => {
    const bad = pages
      .filter((p) => p.kind === "variant" || p.kind === "entity")
      .filter((p) => !(p.blocks ?? []).some((b) => b.type === "facts" || b.type === "table" || b.type === "glyphs" || (b.type === "text" && b.paragraphs.join("").length > 120) || (b.type === "list" && b.items.length > 2)))
      .map((p) => p.path.join("/"));
    expect(bad.slice(0, 40), `${bad.length} pages without own data\n${bad.slice(0, 40).join("\n")}`).toEqual([]);
  }, 300_000);

  it("pages of a family are not near-copies of each other", () => {
    const families = new Map<string, PageModel[]>();
    for (const p of pages) {
      if (p.kind !== "variant" && p.kind !== "entity") continue;
      const key = p.path.slice(0, -1).join("/") || p.sectionId;
      (families.get(key) ?? families.set(key, []).get(key)!).push(p);
    }
    const bad: string[] = [];
    for (const list of families.values()) {
      const sh = list.map((p) => shingles(pageText(p)));
      for (let i = 1; i < list.length; i++) {
        const sim = jaccard(sh[i - 1], sh[i]);
        if (sim > 0.8) bad.push(`${list[i].path.join("/")} ≈ ${list[i - 1].path.join("/")} (${sim.toFixed(2)})`);
      }
    }
    expect(bad.slice(0, 40), `${bad.length} near-duplicates\n${bad.slice(0, 40).join("\n")}`).toEqual([]);
  }, 300_000);
});
