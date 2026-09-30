import { tr, type L10n, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import type { Block, CategoryId, Crumb, LinkItem, PageModel, SearchEntry, SectionDef, ToolDef, VariantDef } from "./types";

interface ToolSectionInput {
  id: string;
  /** Group name used in navigation ("PDF", "Тесты устройств"). */
  name: L10n;
  description: L10n;
  /**
   * Title of the group landing page `/{id}`. The page is published only when this is set and no
   * tool has slug "" — give it only when the group name itself is a real search query
   * ("PDF онлайн", "Эмодзи"); otherwise the group exists in navigation only.
   */
  title?: L10n;
  h1?: L10n;
  /** Meta description of the landing page (defaults to `description`). */
  hubDescription?: L10n;
  icon: string;
  hue: number;
  category: CategoryId;
  order?: number;
  hidden?: boolean;
  tools: ToolDef[];
  /** Extra blocks for the landing page. */
  hubBlocks?: (locale: Locale) => Block[];
}

const VARIANT_CHIP_LIMIT = 48;
/** Longest title we build automatically (search engines show about 60–65 characters). */
const TITLE_MAX = 60;

/**
 * Build a group of tools. Every tool is a top-level page:
 *   /{locale}/{tool slug}             → tool
 *   /{locale}/{tool slug}/{variant}   → tool variant
 *   /{locale}/{section id}            → tool with slug "" or the group landing page (opt-in)
 */
export function defineToolSection(input: ToolSectionInput): SectionDef {
  const bySlug = new Map(input.tools.map((t) => [t.slug, t]));
  const rootTool = bySlug.get("");
  const variantCache = new Map<string, VariantDef[]>();
  const variantsOf = (t: ToolDef): VariantDef[] => {
    if (!t.variants) return [];
    let v = variantCache.get(t.slug);
    if (!v) {
      v = t.variants.list();
      variantCache.set(t.slug, v);
    }
    return v;
  };
  const toolPath = (t: ToolDef) => [t.slug || input.id];
  // A section without tools is not published at all: no pages, no nav entry, no search entries.
  const empty = input.tools.length === 0;
  const hasHub = !empty && !rootTool && !!input.title;
  const hubPath = rootTool ? [input.id] : hasHub ? [input.id] : null;

  const section: SectionDef = {
    id: input.id,
    name: input.name,
    description: input.description,
    icon: input.icon,
    hue: input.hue,
    category: input.category,
    order: input.order,
    hidden: input.hidden || empty,
    absolute: true,
    hubPath: empty ? null : hubPath,

    mounts() {
      if (empty) return [];
      return [...(hubPath ? [input.id] : []), ...input.tools.filter((t) => t.slug).map((t) => t.slug)];
    },

    paths() {
      if (empty) return [];
      const out: string[][] = [];
      if (hasHub) out.push([input.id]);
      for (const t of input.tools) {
        const base = toolPath(t);
        out.push(base);
        for (const v of variantsOf(t)) out.push([...base, v.slug]);
      }
      return out;
    },

    search(locale) {
      if (empty) return [];
      const entries: SearchEntry[] = [];
      const secName = tr(input.name, locale);
      for (const t of input.tools) {
        entries.push({
          path: toolPath(t),
          title: tr(t.name, locale),
          hint: secName,
          keywords: [...(t.keywords?.[locale] ?? []), tr(t.title, locale)].join(" "),
          weight: t.popular ? 3 : 2,
        });
        for (const v of variantsOf(t)) {
          if (v.searchable === false) continue;
          entries.push({
            path: [...toolPath(t), v.slug],
            title: tr(v.h1 ?? v.title, locale),
            hint: tr(t.name, locale),
            keywords: (v.keywords?.[locale] ?? []).join(" "),
            glyph: v.glyph,
            weight: 1,
          });
        }
      }
      if (hasHub) entries.push({ path: [input.id], title: tr(input.h1 ?? input.name, locale), hint: ui(locale).allTools, weight: 2 });
      return entries;
    },

    featured(locale) {
      const tools = input.tools.filter((t) => t.popular);
      return (tools.length ? tools : input.tools).map((t) => toolLink(t, locale));
    },

    tools(locale) {
      return input.tools.map((t) => toolLink(t, locale));
    },

    resolve(locale, segs) {
      if (empty || segs.length === 0 || segs.length > 2) return null;
      const home: Crumb = { name: ui(locale).home, path: [] };
      const groupCrumbs: Crumb[] = hasHub ? [home, { name: tr(input.h1 ?? input.name, locale), path: [input.id] }] : [home];
      const [first, second] = segs;

      if (first === input.id && !bySlug.has(first)) {
        if (rootTool) {
          if (!second) return toolPage(rootTool, locale, [home]);
          const v = variantsOf(rootTool).find((x) => x.slug === second);
          return v ? variantPage(rootTool, v, locale, [home, { name: tr(rootTool.name, locale), path: [input.id] }]) : null;
        }
        return hasHub && !second ? hubPage(locale, [home]) : null;
      }

      const tool = first ? bySlug.get(first) : undefined;
      if (!tool || !tool.slug) return null;
      if (!second) return toolPage(tool, locale, groupCrumbs);
      const v = variantsOf(tool).find((x) => x.slug === second);
      return v ? variantPage(tool, v, locale, [...groupCrumbs, { name: tr(tool.name, locale), path: toolPath(tool) }]) : null;
    },
  };

  /**
   * "<title> | <alternative query>" — titles written without a second half get the first of the tool's
   * `seoAlt` phrases that keeps the whole title within TITLE_MAX; a title that is already long stays as it is.
   */
  function seoTitleOf(title: string, tool: ToolDef, locale: Locale): string {
    if (/ \| | — |: /.test(title)) return title;
    // Preferred phrases, then the tool's search synonyms (real queries), then its name.
    const alts = [...(tool.seoAlt ? ([] as string[]).concat(tool.seoAlt[locale]) : []), ...(tool.keywords?.[locale] ?? []), tr(tool.name, locale)];
    for (const alt of alts) {
      const cand = /^[A-ZА-ЯЁ]{2}/.test(alt) ? alt : alt.charAt(0).toLowerCase() + alt.slice(1);
      if (title.toLowerCase().includes(cand.toLowerCase())) continue;
      if (title.length + 3 + cand.length <= TITLE_MAX) return `${title} | ${cand}`;
    }
    return title;
  }

  function toolLink(tool: ToolDef, locale: Locale): LinkItem {
    return {
      path: toolPath(tool),
      label: tr(tool.name, locale),
      hint: tr(tool.lead ?? tool.description, locale),
      icon: tool.icon,
      hue: input.hue,
    };
  }

  function variantLinks(tool: ToolDef, locale: Locale, exclude?: string): LinkItem[] {
    return variantsOf(tool)
      .filter((v) => v.slug !== exclude)
      .map((v) => ({ path: [...toolPath(tool), v.slug], label: tr(v.name, locale), glyph: v.glyph }));
  }

  function siblingTools(tool: ToolDef, locale: Locale): LinkItem[] {
    return input.tools.filter((x) => x !== tool).map((x) => toolLink(x, locale));
  }

  function hubPage(locale: Locale, crumbs: Crumb[]): PageModel {
    const blocks: Block[] = [{ type: "links", title: ui(locale).allTools, style: "cards", items: input.tools.map((x) => toolLink(x, locale)) }];
    for (const tool of input.tools) {
      const vs = variantLinks(tool, locale);
      if (vs.length) blocks.push({ type: "links", title: tr(tool.variants!.title, locale), style: "chips", items: vs.slice(0, tool.variants!.limit ?? VARIANT_CHIP_LIMIT) });
    }
    return {
      path: [input.id],
      sectionId: input.id,
      kind: "hub",
      title: tr(input.title!, locale),
      h1: tr(input.h1 ?? input.name, locale),
      description: tr(input.hubDescription ?? input.description, locale),
      lead: tr(input.description, locale),
      breadcrumbs: crumbs,
      topBlocks: blocks,
      blocks: input.hubBlocks?.(locale),
      schemaType: "CollectionPage",
      icon: input.icon,
      hue: input.hue,
      wide: true,
    };
  }

  function toolPage(tool: ToolDef, locale: Locale, crumbs: Crumb[]): PageModel {
    const vs = variantLinks(tool, locale);
    const limit = tool.variants?.limit ?? VARIANT_CHIP_LIMIT;
    const topBlocks: Block[] = [];
    if (vs.length) topBlocks.push({ type: "links", title: tr(tool.variants!.title, locale), style: "chips", items: vs.slice(0, limit) });
    const blocks: Block[] = [...(tool.blocks?.(locale) ?? [])];
    if (tool.about?.[locale]?.length) blocks.push({ type: "text", title: ui(locale).about, paragraphs: tool.about[locale], fold: true });
    return {
      path: toolPath(tool),
      sectionId: input.id,
      kind: "tool",
      title: seoTitleOf(tr(tool.title, locale), tool, locale),
      h1: tr(tool.h1 ?? tool.name, locale),
      description: tr(tool.description, locale),
      lead: tool.lead ? tr(tool.lead, locale) : undefined,
      breadcrumbs: crumbs,
      tool: { id: tool.component, props: tool.props },
      topBlocks,
      blocks,
      howTo: tool.howTo?.[locale],
      faq: tool.faq?.[locale],
      related: dedupe([...relatedLinks(tool, locale), ...siblingTools(tool, locale)]).slice(0, 8),
      schemaType: "WebApplication",
      icon: tool.icon,
      hue: input.hue,
      wide: tool.wide,
    };
  }

  function variantPage(tool: ToolDef, v: VariantDef, locale: Locale, crumbs: Crumb[]): PageModel {
    const siblings = variantLinks(tool, locale, v.slug);
    const limit = tool.variants?.limit ?? VARIANT_CHIP_LIMIT;
    return {
      path: [...toolPath(tool), v.slug],
      sectionId: input.id,
      kind: "variant",
      title: seoTitleOf(tr(v.title, locale), tool, locale),
      h1: tr(v.h1 ?? v.title, locale),
      description: tr(v.description, locale),
      lead: v.lead ? tr(v.lead, locale) : undefined,
      breadcrumbs: crumbs,
      tool: { id: tool.component, props: { ...tool.props, ...v.props } },
      topBlocks: siblings.length ? [{ type: "links", title: tr(tool.variants!.title, locale), style: "chips", items: siblings.slice(0, Math.max(limit, 24)) }] : [],
      blocks: v.blocks?.(locale) ?? [],
      howTo: tool.howTo?.[locale],
      faq: v.faq?.[locale] ?? tool.faq?.[locale],
      related: dedupe([toolLink(tool, locale), ...relatedLinks(tool, locale)]).slice(0, 8),
      schemaType: "WebApplication",
      icon: tool.icon,
      hue: input.hue,
      wide: tool.wide,
    };
  }

  function relatedLinks(tool: ToolDef, locale: Locale): LinkItem[] {
    // Resolving a related page builds that page; its own related list is not needed (and two
    // tools that reference each other would otherwise recurse forever).
    if (relatedDepth > 0) return [];
    relatedDepth++;
    try {
      const out: LinkItem[] = [];
      for (const key of tool.related ?? []) {
        const link = relatedResolver(key, locale);
        if (link) out.push(link);
        else unresolved.add(`${tool.slug || input.id} → ${key}`);
      }
      return out;
    } finally {
      relatedDepth--;
    }
  }

  return section;
}

let relatedDepth = 0;
const unresolved = new Set<string>();

/** Resolve a related key to a link. Shallow: the target page's own related list is not built. */
export function resolveRelatedKey(key: string, locale: Locale): LinkItem | null {
  relatedDepth++;
  try {
    return relatedResolver(key, locale);
  } finally {
    relatedDepth--;
  }
}

/** True while a page is being built only to produce a related link. */
export function isResolvingRelated(): boolean {
  return relatedDepth > 0;
}
/** Related keys that did not resolve to a page (checked by the registry test). */
export function unresolvedRelated(): string[] {
  return [...unresolved];
}

function dedupe(items: LinkItem[]): LinkItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.path.join("/");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* Cross-section related links are resolved lazily through a late-bound resolver
   to avoid import cycles between section modules. */
type RelatedResolver = (key: string, locale: Locale) => LinkItem | null;
let relatedResolver: RelatedResolver = () => null;
export function setRelatedResolver(fn: RelatedResolver) {
  relatedResolver = fn;
}
