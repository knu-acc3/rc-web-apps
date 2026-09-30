import { tr, type Locale } from "@/i18n/config";
import { SECTIONS } from "@/sections";
import { CATEGORIES } from "./categories";
import { setRelatedResolver } from "./tool-section";
import type { LinkItem, PageModel, SearchEntry, SectionDef } from "./types";

const byId = new Map<string, SectionDef>(SECTIONS.map((s) => [s.id, s]));

/** First URL segment → owning section. */
const owners = new Map<string, SectionDef>();
for (const s of SECTIONS) {
  for (const m of s.absolute ? (s.mounts?.() ?? []) : [s.id]) {
    const prev = owners.get(m);
    if (prev && prev !== s) throw new Error(`URL segment "/${m}" is claimed by both "${prev.id}" and "${s.id}"`);
    owners.set(m, s);
  }
}

export function getSection(id: string): SectionDef | undefined {
  return byId.get(id);
}

export function allSections(): SectionDef[] {
  return SECTIONS;
}

/** Full paths (without locale) of one section. */
export function sectionPaths(s: SectionDef, prebuildOnly = false): string[][] {
  const rel = prebuildOnly && s.prebuild ? s.prebuild() : s.paths();
  return s.absolute ? rel : rel.map((p) => [s.id, ...p]);
}

/** Sections that publish at least one page. */
export function liveSections(): SectionDef[] {
  return SECTIONS.filter((s) => s.paths().length > 0);
}

export function resolvePage(locale: Locale, segments: string[]): PageModel | null {
  if (segments.length === 0) return null;
  // Canonical URLs are lowercase; reject anything else so duplicates can't be indexed.
  if (segments.some((s) => s !== s.toLowerCase())) return null;
  const section = owners.get(segments[0]);
  if (!section) return null;
  return section.absolute ? section.resolve(locale, segments) : section.resolve(locale, segments.slice(1));
}

/** Every path of the site (without locale). */
export function allPaths(): string[][] {
  return SECTIONS.flatMap((s) => sectionPaths(s));
}

/** Paths that are prerendered at build time. */
export function prebuildPaths(): string[][] {
  return SECTIONS.flatMap((s) => sectionPaths(s, true));
}

export function searchEntries(locale: Locale): SearchEntry[] {
  return SECTIONS.flatMap((s) => s.search(locale));
}

export function sectionsByCategory(locale: Locale) {
  return CATEGORIES.map((c) => ({
    ...c,
    label: tr(c.name, locale),
    sections: SECTIONS.filter((s) => s.category === c.id && !s.hidden).sort((a, b) => (a.order ?? 50) - (b.order ?? 50)),
  })).filter((c) => c.sections.length > 0);
}

/** Landing page of a section: its hub, or null for navigation-only groups. */
export function sectionHub(s: SectionDef): string[] | null {
  return s.hubPath === undefined ? [s.id] : s.hubPath;
}

export function sectionTools(s: SectionDef, locale: Locale): LinkItem[] {
  return withSectionLook(s, s.tools ? s.tools(locale) : s.featured(locale));
}

function withSectionLook(s: SectionDef, items: LinkItem[]): LinkItem[] {
  return items.map((l) => ({ ...l, icon: l.icon ?? s.icon, hue: l.hue ?? s.hue }));
}

/**
 * Menu/footer navigation: per category, up to `limit` tools taken round-robin from the
 * featured tools of its sections, so every section is represented.
 */
export function navigation(locale: Locale, limit: number) {
  return sectionsByCategory(locale).map((g) => {
    const lists = g.sections.map((s) => withSectionLook(s, s.featured(locale)));
    const items: LinkItem[] = [];
    for (let i = 0; items.length < limit && lists.some((l) => l.length > i); i++) {
      for (const l of lists) if (l[i] && items.length < limit) items.push(l[i]);
    }
    const total = g.sections.reduce((n, s) => n + sectionTools(s, locale).length, 0);
    return { id: g.id, label: g.label, items, total };
  });
}

/* Related keys are page paths without locale ("merge-pdf", "timer/5-minutes").
   Legacy "section/tool" keys are accepted too and fall back to the tool's own top-level path. */
setRelatedResolver((key, locale) => {
  const segs = key.split("/").filter(Boolean);
  let page = resolvePage(locale, segs);
  if (!page && segs.length > 1 && byId.has(segs[0])) page = resolvePage(locale, segs.slice(1));
  if (!page) return null;
  const s = byId.get(page.sectionId);
  return { path: page.path, label: page.h1, hint: page.lead ?? page.description, icon: page.icon ?? s?.icon, hue: s?.hue };
});
