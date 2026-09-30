import { tr, type Locale } from "@/i18n/config";
import { SECTIONS } from "@/sections";
import { CATEGORIES } from "./categories";
import { setRelatedResolver } from "./tool-section";
import type { LinkItem, PageModel, SearchEntry, SectionDef } from "./types";

const byId = new Map<string, SectionDef>(SECTIONS.map((s) => [s.id, s]));

export function getSection(id: string): SectionDef | undefined {
  return byId.get(id);
}

export function allSections(): SectionDef[] {
  return SECTIONS;
}

export function resolvePage(locale: Locale, segments: string[]): PageModel | null {
  const [sectionId, ...rest] = segments;
  const section = byId.get(sectionId);
  if (!section) return null;
  // Canonical URLs are lowercase; reject anything else so duplicates can't be indexed.
  if (segments.some((s) => s !== s.toLowerCase())) return null;
  return section.resolve(locale, rest);
}

/** Every path of the site (without locale). */
export function allPaths(): string[][] {
  const out: string[][] = [];
  for (const s of SECTIONS) for (const p of s.paths()) out.push([s.id, ...p]);
  return out;
}

/** Paths that are prerendered at build time. */
export function prebuildPaths(): string[][] {
  const out: string[][] = [];
  for (const s of SECTIONS) for (const p of s.prebuild ? s.prebuild() : s.paths()) out.push([s.id, ...p]);
  return out;
}

export function searchEntries(locale: Locale): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const s of SECTIONS) out.push(...s.search(locale));
  return out;
}

export function sectionsByCategory(locale: Locale) {
  return CATEGORIES.map((c) => ({
    ...c,
    label: tr(c.name, locale),
    sections: SECTIONS.filter((s) => s.category === c.id && !s.hidden).sort((a, b) => (a.order ?? 50) - (b.order ?? 50)),
  })).filter((c) => c.sections.length > 0);
}

export function sectionLink(s: SectionDef, locale: Locale): LinkItem {
  return { path: [s.id], label: tr(s.name, locale), hint: tr(s.description, locale), icon: s.icon, hue: s.hue };
}

/* Related-tool keys: "section" or "section/slug" (or "section/slug/variant"). */
setRelatedResolver((key, locale) => {
  const segs = key.split("/");
  const page = resolvePage(locale, segs);
  if (!page) return null;
  const s = byId.get(segs[0]);
  return { path: page.path, label: page.h1, hint: page.lead ?? page.description, icon: page.icon ?? s?.icon, hue: s?.hue };
});
