import { tr, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, LinkItem, PageModel, SearchEntry, SectionDef, ToolDef } from "@/registry/types";
import { DESIGN_TOOLS } from "./content/design-tools";
import { formatColor, hex } from "./lib/color";
import { NAMED_ALIASES, NAMED_COLORS } from "./lib/named";
import { CONVERTER_TOOLS } from "./content/converters";
import { CONTRAST_TOOL, NAME_TOOL, PICKER_TOOL } from "./content/core-tools";
import { NAMED_SLUGS, namedPage, namedSearch } from "./content/named";
import { CSS1_COLORS } from "./data/named-info";

const ID = "color";
const HUE = 330;

const toolPath = (t: ToolDef) => [t.slug];
const toolCard = (t: ToolDef, locale: Locale): LinkItem => ({
  path: toolPath(t),
  label: tr(t.name, locale),
  hint: tr(t.lead ?? t.description, locale),
  icon: t.icon,
  hue: HUE,
});

const MAIN_TOOLS: ToolDef[] = [PICKER_TOOL, CONTRAST_TOOL, NAME_TOOL, ...DESIGN_TOOLS];
const ALL_TOOLS: ToolDef[] = [...MAIN_TOOLS, ...CONVERTER_TOOLS];

const base = defineToolSection({
  id: ID,
  name: { ru: "Цвета", en: "Colors" },
  description: {
    ru: "Палитра и конвертер цветов, контраст WCAG, палитры и оттенки, градиенты, Tailwind и 148 цветов CSS",
    en: "Color picker and converter, WCAG contrast, palettes and shades, gradients, Tailwind and 148 CSS colors",
  },
  icon: "Palette",
  hue: HUE,
  category: "design",
  order: 1,
  tools: ALL_TOOLS,
});

const toolSlugs = new Set(ALL_TOOLS.map((t) => t.slug));
if (toolSlugs.has(ID)) throw new Error(`"${ID}" is reserved for the CSS color names catalog`);
const namedSet = new Set(NAMED_SLUGS);
const UNIQUE_COLORS = new Set(NAMED_COLORS.map(([, h]) => h)).size;

/**
 * Cross-section links are built directly instead of via `related` keys: the shared resolver
 * renders the target page including its own related keys, so keys pointing back and forth
 * between sections would recurse.
 */
function crossLinks(locale: Locale): LinkItem[] {
  const ru = locale === "ru";
  return [
    {
      path: ["css"],
      label: ru ? "CSS-генераторы" : "CSS generators",
      hint: ru ? "Тени, анимации, flexbox, grid и другие генераторы кода" : "Shadows, animations, flexbox, grid and more code generators",
      icon: "Paintbrush",
      hue: 270,
    },
  ];
}

const CATALOG_LINK = (locale: Locale): LinkItem => ({
  path: [ID],
  label: locale === "ru" ? "Названия цветов CSS" : "CSS color names",
  hint: locale === "ru" ? `Все ${NAMED_COLORS.length} именованных цвета с кодами` : `All ${NAMED_COLORS.length} named colors with codes`,
  icon: "SwatchBook",
  hue: HUE,
});

/** /color — the catalog of the 148 CSS named colors (a real query: "названия цветов css", "html color names"). */
function catalogPage(locale: Locale): PageModel {
  const ru = locale === "ru";
  const blocks: Block[] = [
    { type: "links", title: ru ? "Инструменты для работы с цветом" : "Color tools", style: "cards", items: MAIN_TOOLS.map((t) => toolCard(t, locale)) },
    {
      type: "links",
      title: ru ? "Конвертеры цветовых форматов" : "Color format converters",
      style: "chips",
      items: CONVERTER_TOOLS.map((t) => ({ path: toolPath(t), label: tr(t.name, locale), hint: tr(t.lead ?? t.description, locale) })),
    },
    {
      type: "table",
      title: ru ? "16 базовых цветов HTML" : "The 16 basic HTML colors",
      head: [ru ? "Название" : "Name", "HEX", "RGB"],
      rows: NAMED_COLORS.filter(([n]) => CSS1_COLORS.has(n)).map(([n, h]) => [n, h.toUpperCase(), formatColor(hex(h), "rgb")]),
      mono: true,
    },
    {
      type: "text",
      title: ru ? "Откуда взялись названия" : "Where the names come from",
      paragraphs: ru
        ? [
            "Первые 16 названий пришли из HTML 4 и CSS 1 — это цвета VGA-палитры. Остальные взяты из списка X11, который перешёл в SVG 1.0 и CSS Color 3; в CSS 2.1 добавили orange, а в 2014 году — rebeccapurple в память о дочери Эрика Мейера.",
            `Всего ${NAMED_COLORS.length} названий, но различных цветов ${UNIQUE_COLORS}: aqua и cyan, fuchsia и magenta — синонимы, а у семи серых есть написание через grey. Регистр не важен: Tomato, TOMATO и tomato — одно и то же.`,
            "Из-за наследия X11 встречаются странности: darkgray (#A9A9A9) светлее, чем gray (#808080), а green (#008000) заметно темнее lime (#00FF00).",
          ]
        : [
            "The first 16 names come from HTML 4 and CSS 1 — the VGA palette. The rest were taken from the X11 color list via SVG 1.0 and CSS Color 3; CSS 2.1 added orange, and rebeccapurple arrived in 2014 in memory of Eric Meyer's daughter.",
            `There are ${NAMED_COLORS.length} names but only ${UNIQUE_COLORS} distinct colors: aqua and cyan, fuchsia and magenta are synonyms, and seven grays also have a “grey” spelling. Case doesn't matter: Tomato, TOMATO and tomato are the same.`,
            "The X11 heritage explains a few oddities: darkgray (#A9A9A9) is lighter than gray (#808080), and green (#008000) is much darker than lime (#00FF00).",
          ],
    },
  ];
  const faq = ru
    ? [
        { q: "Сколько именованных цветов в CSS?", a: `${NAMED_COLORS.length} ключевых слов, из них ${UNIQUE_COLORS} различных цветов: у ${Object.keys(NAMED_ALIASES).length} есть синонимы. Кроме них есть специальные слова transparent (полностью прозрачный) и currentcolor (текущий цвет текста).` },
        { q: "Можно ли использовать названия цветов в продакшене?", a: "Да, их понимают все браузеры. Но набор ограничен и случаен, поэтому для дизайн-систем удобнее HEX, RGB или OKLCH, а названия — для прототипов, примеров и учебных задач." },
        { q: "Есть ли русские названия цветов в CSS?", a: "Нет, ключевые слова только английские. Русские подписи на этом сайте — перевод для удобства; в коде пишите английское название: color: tomato;." },
      ]
    : [
        { q: "How many named colors does CSS have?", a: `${NAMED_COLORS.length} keywords covering ${UNIQUE_COLORS} distinct colors, since ${Object.keys(NAMED_ALIASES).length} are synonyms. There are also the special keywords transparent (fully transparent) and currentcolor (the current text color).` },
        { q: "Is it OK to use color names in production?", a: "Yes, every browser supports them. The set is small and arbitrary, though, so design systems usually use HEX, RGB or OKLCH, and names are handy for prototypes, examples and teaching." },
        { q: "Are color names case-sensitive?", a: "No. Tomato, TOMATO and tomato all mean #FF6347." },
      ];
  return {
    path: [ID],
    sectionId: ID,
    kind: "hub",
    title: ru ? `Названия цветов CSS и HTML — все ${NAMED_COLORS.length} с кодами` : `CSS color names — all ${NAMED_COLORS.length} HTML colors with codes`,
    h1: ru ? "Названия цветов CSS" : "CSS color names",
    description: ru
      ? `Все ${NAMED_COLORS.length} именованных цветов CSS и HTML с HEX-кодами — от aliceblue до yellowgreen, по группам оттенков. У каждого цвета — RGB, HSL, контраст и гармонии.`
      : `All ${NAMED_COLORS.length} CSS and HTML named colors with HEX codes, from aliceblue to yellowgreen, grouped by hue. Each color has RGB, HSL, contrast and harmonies.`,
    lead: ru ? "Ключевые слова, которые понимает любой браузер: color: tomato вместо #FF6347." : "Keywords every browser understands: color: tomato instead of #FF6347.",
    breadcrumbs: [{ name: ui(locale).home, path: [] }],
    tool: { id: "color/named-grid" },
    blocks,
    faq,
    related: [],
    schemaType: "CollectionPage",
    icon: "Palette",
    hue: HUE,
    wide: true,
  };
}

const RELATED_TOOLS: ToolDef[] = [PICKER_TOOL, CONTRAST_TOOL, NAME_TOOL, ...DESIGN_TOOLS.filter((t) => ["color-palette-generator", "color-shades-generator", "color-mixer"].includes(t.slug))];

export const colorSection: SectionDef = {
  ...base,
  hubPath: [ID],
  mounts() {
    return [...(base.mounts?.() ?? []), ID];
  },
  paths() {
    return [...base.paths(), [ID], ...NAMED_SLUGS.map((n) => [ID, n])];
  },
  resolve(locale, segs) {
    if (segs[0] === ID) {
      if (segs.length === 1) return catalogPage(locale);
      if (segs.length !== 2 || !namedSet.has(segs[1])) return null;
      const page = namedPage(segs[1], locale);
      if (page) page.related = [...RELATED_TOOLS.map((t) => toolCard(t, locale)), ...crossLinks(locale)];
      return page;
    }
    const page = base.resolve(locale, segs);
    if (page) page.related = [...(page.related ?? []).slice(0, 6), CATALOG_LINK(locale), ...crossLinks(locale)];
    return page;
  },
  search(locale) {
    const catalog: SearchEntry = {
      path: [ID],
      title: locale === "ru" ? "Названия цветов CSS" : "CSS color names",
      hint: tr(base.name, locale),
      keywords: locale === "ru" ? "названия цветов css html именованные цвета список" : "css color names html colors named list",
      weight: 3,
    };
    return [...base.search(locale), catalog, ...namedSearch(locale)];
  },
  featured(locale) {
    return ["color-picker", "contrast-checker", "color-palette-generator", "css-gradient-generator", "hex-to-rgb", "tailwind-colors"]
      .map((slug) => ALL_TOOLS.find((t) => t.slug === slug))
      .filter((t): t is ToolDef => !!t)
      .map((t) => toolCard(t, locale));
  },
  tools(locale) {
    return [...MAIN_TOOLS.map((t) => toolCard(t, locale)), ...CONVERTER_TOOLS.slice(0, 4).map((t) => toolCard(t, locale)), CATALOG_LINK(locale)];
  },
};

