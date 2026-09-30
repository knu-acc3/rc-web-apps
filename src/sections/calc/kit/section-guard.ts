import { tr, type Locale } from "@/i18n/config";
import type { PageModel, SectionDef, ToolDef, VariantDef } from "@/registry/types";

/**
 * Work-around for a registry recursion: the related-link resolver builds full pages, and a full
 * tool page resolves its own related links, so two tools that reference each other recurse forever.
 * While a page of one of our sections is being resolved, nested resolves (made by the related-link
 * resolver) get a shallow page built straight from the ToolDef (path, h1, lead, description, icon) —
 * exactly the fields the resolver reads. Remove once the registry resolves related links shallowly.
 */
let depth = 0;

export function guardSection(section: SectionDef, tools: ToolDef[]): SectionDef {
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  const variantCache = new Map<string, VariantDef[]>();
  const variantsOf = (t: ToolDef) => {
    let v = variantCache.get(t.slug);
    if (!v) {
      v = t.variants?.list() ?? [];
      variantCache.set(t.slug, v);
    }
    return v;
  };

  function shallow(locale: Locale, segs: string[]): PageModel | null {
    const [a, b] = segs;
    const tool = bySlug.get(a);
    if (!tool || segs.length > 2) return section.resolve(locale, segs);
    const base = { sectionId: section.id, breadcrumbs: [], icon: tool.icon, hue: section.hue };
    if (!b) {
      return {
        ...base,
        path: [a],
        kind: "tool",
        title: tr(tool.title, locale),
        h1: tr(tool.h1 ?? tool.name, locale),
        description: tr(tool.description, locale),
        lead: tool.lead ? tr(tool.lead, locale) : undefined,
      };
    }
    const v = variantsOf(tool).find((x) => x.slug === b);
    if (!v) return null;
    return {
      ...base,
      path: [a, b],
      kind: "variant",
      title: tr(v.title, locale),
      h1: tr(v.h1 ?? v.title, locale),
      description: tr(v.description, locale),
      lead: v.lead ? tr(v.lead, locale) : undefined,
    };
  }

  return {
    ...section,
    resolve(locale, segs) {
      if (depth > 0) return shallow(locale, segs);
      depth++;
      try {
        return section.resolve(locale, segs);
      } finally {
        depth--;
      }
    },
  };
}
