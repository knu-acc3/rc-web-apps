import { tr, type L10n, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import type { Block, CategoryId, LinkItem, PageModel, SearchEntry, SectionDef, ToolDef, VariantDef } from "./types";

interface ToolSectionInput {
  id: string;
  name: L10n;
  description: L10n;
  /** <title> of the hub page (defaults to name). */
  title?: L10n;
  h1?: L10n;
  icon: string;
  hue: number;
  category: CategoryId;
  order?: number;
  hidden?: boolean;
  tools: ToolDef[];
  /** Extra blocks for the hub page. */
  hubBlocks?: (locale: Locale) => Block[];
}

const VARIANT_CHIP_LIMIT = 48;

/**
 * Build a section from declarative tool definitions.
 * URL scheme: /{locale}/{section}            → hub (or the tool with slug "")
 *             /{locale}/{section}/{tool}     → tool
 *             /{locale}/{section}/{tool}/{v} → tool variant
 */
export function defineToolSection(input: ToolSectionInput): SectionDef {
  const bySlug = new Map(input.tools.map((t) => [t.slug, t]));
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
  const toolPath = (t: ToolDef) => (t.slug ? [input.id, t.slug] : [input.id]);

  const section: SectionDef = {
    id: input.id,
    name: input.name,
    description: input.description,
    icon: input.icon,
    hue: input.hue,
    category: input.category,
    order: input.order,
    hidden: input.hidden,

    paths() {
      const out: string[][] = [];
      if (!bySlug.has("")) out.push([]);
      for (const t of input.tools) {
        out.push(t.slug ? [t.slug] : []);
        for (const v of variantsOf(t)) out.push(t.slug ? [t.slug, v.slug] : [v.slug]);
      }
      return out;
    },

    search(locale) {
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
      if (!bySlug.has("")) entries.push({ path: [input.id], title: secName, hint: ui(locale).allTools, weight: 2 });
      return entries;
    },

    featured(locale) {
      const tools = input.tools.filter((t) => t.popular);
      return (tools.length ? tools : input.tools).map((t) => toolLink(t, locale));
    },

    resolve(locale, rest) {
      const t = ui(locale);
      const secCrumb = { name: tr(input.name, locale), path: [input.id] };
      const home = { name: t.home, path: [] as string[] };

      // Section root
      if (rest.length === 0) {
        const rootTool = bySlug.get("");
        if (rootTool) return toolPage(rootTool, locale, [home]);
        return hubPage(locale, [home]);
      }

      // Variant of the root tool: /section/{variant}
      const rootTool = bySlug.get("");
      if (rest.length === 1 && rootTool && !bySlug.has(rest[0])) {
        const v = variantsOf(rootTool).find((x) => x.slug === rest[0]);
        return v ? variantPage(rootTool, v, locale, [home, secCrumb]) : null;
      }

      const tool = bySlug.get(rest[0]);
      if (!tool || !tool.slug) return null;
      const toolCrumb = { name: tr(tool.name, locale), path: toolPath(tool) };
      if (rest.length === 1) return toolPage(tool, locale, [home, secCrumb]);
      if (rest.length === 2) {
        const v = variantsOf(tool).find((x) => x.slug === rest[1]);
        return v ? variantPage(tool, v, locale, [home, secCrumb, toolCrumb]) : null;
      }
      return null;
    },
  };

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

  function hubPage(locale: Locale, crumbs: PageModel["breadcrumbs"]): PageModel {
    const blocks: Block[] = [
      { type: "links", title: ui(locale).allTools, style: "cards", items: input.tools.map((x) => toolLink(x, locale)) },
    ];
    for (const tool of input.tools) {
      const vs = variantLinks(tool, locale);
      if (vs.length) blocks.push({ type: "links", title: `${tr(tool.name, locale)}: ${tr(tool.variants!.title, locale).toLowerCase()}`, style: "chips", items: vs });
    }
    return {
      path: [input.id],
      sectionId: input.id,
      kind: "hub",
      title: input.title ? tr(input.title, locale) : locale === "ru" ? `${tr(input.name, locale)} онлайн — бесплатные инструменты` : `${tr(input.name, locale)} online — free tools`,
      h1: tr(input.h1 ?? input.name, locale),
      description: tr(input.description, locale),
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

  function toolPage(tool: ToolDef, locale: Locale, crumbs: PageModel["breadcrumbs"]): PageModel {
    const vs = variantLinks(tool, locale);
    const limit = tool.variants?.limit ?? VARIANT_CHIP_LIMIT;
    const topBlocks: Block[] = [];
    if (vs.length) topBlocks.push({ type: "links", title: tr(tool.variants!.title, locale), style: "chips", items: vs.slice(0, limit) });
    const blocks: Block[] = [...(tool.blocks?.(locale) ?? [])];
    if (tool.about?.[locale]?.length) blocks.push({ type: "text", title: ui(locale).about, paragraphs: tool.about[locale] });
    return {
      path: toolPath(tool),
      sectionId: input.id,
      kind: "tool",
      title: tr(tool.title, locale),
      h1: tr(tool.h1 ?? tool.name, locale),
      description: tr(tool.description, locale),
      lead: tool.lead ? tr(tool.lead, locale) : undefined,
      breadcrumbs: crumbs,
      tool: { id: tool.component, props: tool.props },
      topBlocks,
      blocks,
      howTo: tool.howTo?.[locale],
      faq: tool.faq?.[locale],
      related: [...relatedLinks(tool, locale), ...siblingTools(tool, locale)].slice(0, 8),
      schemaType: "WebApplication",
      icon: tool.icon,
      hue: input.hue,
      wide: tool.wide,
    };
  }

  function variantPage(tool: ToolDef, v: VariantDef, locale: Locale, crumbs: PageModel["breadcrumbs"]): PageModel {
    const siblings = variantLinks(tool, locale, v.slug);
    return {
      path: [...toolPath(tool), v.slug],
      sectionId: input.id,
      kind: "variant",
      title: tr(v.title, locale),
      h1: tr(v.h1 ?? v.title, locale),
      description: tr(v.description, locale),
      lead: v.lead ? tr(v.lead, locale) : undefined,
      breadcrumbs: crumbs,
      tool: { id: tool.component, props: { ...tool.props, ...v.props } },
      topBlocks: siblings.length ? [{ type: "links", title: tr(tool.variants!.title, locale), style: "chips", items: siblings }] : [],
      blocks: v.blocks?.(locale) ?? [],
      howTo: tool.howTo?.[locale],
      faq: v.faq?.[locale] ?? tool.faq?.[locale],
      related: [toolLink(tool, locale), ...relatedLinks(tool, locale)].slice(0, 8),
      schemaType: "WebApplication",
      icon: tool.icon,
      hue: input.hue,
      wide: tool.wide,
    };
  }

  function relatedLinks(tool: ToolDef, locale: Locale): LinkItem[] {
    return (tool.related ?? []).map((key) => relatedResolver(key, locale)).filter((x): x is LinkItem => !!x);
  }

  return section;
}

/* Cross-section related links are resolved lazily through a late-bound resolver
   to avoid import cycles between section modules. */
type RelatedResolver = (key: string, locale: Locale) => LinkItem | null;
let relatedResolver: RelatedResolver = () => null;
export function setRelatedResolver(fn: RelatedResolver) {
  relatedResolver = fn;
}
