import { tr, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import type { Block, LinkItem, PageModel, QA } from "@/registry/types";
import {
  BLACK,
  WHITE,
  contrastRatio,
  formatColor,
  formatRatio,
  harmony,
  hex as parseHex,
  nearestNamed,
  toOklch,
  wcagChecks,
  type Color,
} from "../lib/color";
import { NAMED_ALIASES, NAMED_COLORS, NAMED_MAP } from "../lib/named";
import { VARIATION_STEPS, shades, tints } from "../lib/variations";
import { GROUP_LABEL, NAMED_INFO, origin } from "../data/named-info";

const SECTION = "color";
const HUE = 330;

export const NAMED_SLUGS: string[] = NAMED_COLORS.map(([n]) => n);

/** All spellings of the same color (e.g. gray ↔ grey), excluding the name itself. */
export function aliasesOf(name: string): string[] {
  const main = NAMED_ALIASES[name] ?? name;
  return [main, ...Object.keys(NAMED_ALIASES).filter((a) => NAMED_ALIASES[a] === main)].filter((n) => n !== name);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const HEXU = (name: string) => NAMED_MAP.get(name)!.toUpperCase();

function namedLink(name: string, locale: Locale): LinkItem {
  const info = NAMED_INFO[name];
  return { path: [SECTION, name], label: info.camel, hint: locale === "ru" ? `${cap(info.ru)} · ${HEXU(name)}` : HEXU(name) };
}

function describe(c: Color, locale: Locale): string {
  const { l, c: ch } = toOklch(c);
  const ru = locale === "ru";
  const light =
    l < 0.35 ? (ru ? "очень тёмный" : "very dark") : l < 0.5 ? (ru ? "тёмный" : "dark") : l < 0.7 ? (ru ? "средний по светлоте" : "mid-lightness") : l < 0.88 ? (ru ? "светлый" : "light") : ru ? "очень светлый" : "very light";
  const chroma =
    ch < 0.015 ? (ru ? "нейтральный" : "neutral") : ch < 0.06 ? (ru ? "приглушённый" : "muted") : ch < 0.14 ? (ru ? "умеренно насыщенный" : "moderately saturated") : ru ? "насыщенный" : "vivid";
  return `${light} ${chroma}`;
}

const pct = (x: number) => `${Math.round(x * 1000) / 10}`;

function contrastRows(c: Color, locale: Locale): string[][] {
  const ru = locale === "ru";
  const yes = ru ? "да" : "yes";
  const no = ru ? "нет" : "no";
  return [
    [ru ? "Белый текст" : "White text", WHITE] as const,
    [ru ? "Чёрный текст" : "Black text", BLACK] as const,
  ].map(([label, fg]) => {
    const r = contrastRatio(fg, c);
    const k = wcagChecks(r);
    return [label, `${formatRatio(r)}:1`, k.aaNormal ? yes : no, k.aaLarge ? yes : no, k.aaaNormal ? yes : no, k.aaaLarge ? yes : no];
  });
}

export function namedPage(name: string, locale: Locale): PageModel | null {
  const info = NAMED_INFO[name];
  const hexStr = NAMED_MAP.get(name);
  if (!info || !hexStr) return null;
  const ru = locale === "ru";
  const t = ui(locale);
  const H = hexStr.toUpperCase();
  const c = parseHex(hexStr);
  const rgb = formatColor(c, "rgb");
  const hsl = formatColor(c, "hsl");
  const oklch = formatColor(c, "oklch");
  const { l, c: chroma, h } = toOklch(c);
  const onWhite = contrastRatio(WHITE, c);
  const onBlack = contrastRatio(BLACK, c);
  const better = onBlack >= onWhite ? (ru ? "чёрный" : "black") : ru ? "белый" : "white";
  const bestRatio = Math.max(onWhite, onBlack);
  const aliases = aliasesOf(name);
  const same = new Set([name, ...aliases]);
  const near = nearestNamed(c, 12)
    .filter((n) => !same.has(n.name))
    .slice(0, 8);
  const group = GROUP_LABEL[info.group][locale];
  const Camel = info.camel;
  const ruName = info.ru;

  const titleBase = ru ? `Цвет ${Camel} (${ruName}) — ${H}` : `${Camel} color — ${H} hex code`;
  const title = titleBase.length + 10 <= 60 ? `${titleBase}, RGB, HSL` : titleBase;
  const rgbNums = rgb.slice(4, -1);

  const notes: string[] = [];
  if (aliases.length)
    notes.push(
      ru
        ? `${Camel} и ${aliases.map((a) => NAMED_INFO[a].camel).join(", ")} — разные написания одного и того же цвета ${H}: браузер не различает их, выбирайте любое.`
        : `${Camel} and ${aliases.map((a) => NAMED_INFO[a].camel).join(", ")} are spellings of the same color ${H}; browsers treat them identically.`,
    );
  if (name === "darkgray" || name === "darkgrey")
    notes.push(
      ru
        ? "Любопытно, что darkgray (#A9A9A9) светлее, чем gray (#808080): в список X11, откуда пришли названия, gray был светлее, а CSS сохранил HTML-значение gray = #808080."
        : "Curiously, darkgray (#A9A9A9) is lighter than gray (#808080): in the X11 list the names come from, gray was lighter, while CSS kept the HTML value gray = #808080.",
    );
  if (name === "rebeccapurple")
    notes.push(
      ru
        ? "Цвет добавлен в CSS в 2014 году в память о Ребекке Мейер, дочери Эрика Мейера — одного из авторов CSS. Это единственное название в списке, у которого есть история."
        : "The color was added to CSS in 2014 in memory of Rebecca Meyer, daughter of CSS author Eric Meyer — the only name in the list with a personal story.",
    );

  const about = ru
    ? `${Camel} — ${describe(c, locale)} цвет из группы «${group.toLowerCase()}». В OKLCH: светлота ${pct(l)} %, хрома ${Math.round(chroma * 1000) / 1000}, тон ${Math.round(h)}°. Белый текст на нём даёт контраст ${formatRatio(onWhite)}:1, чёрный — ${formatRatio(onBlack)}:1, поэтому для подписей лучше ${better} текст${wcagChecks(bestRatio).aaNormal ? " — он проходит AA для обычного текста" : ", хотя и он не проходит AA для обычного текста (подходит только для крупного)"}.`
    : `${Camel} is a ${describe(c, locale)} color from the ${group.toLowerCase()} group. In OKLCH: lightness ${pct(l)}%, chroma ${Math.round(chroma * 1000) / 1000}, hue ${Math.round(h)}°. White text on it gives ${formatRatio(onWhite)}:1 contrast and black ${formatRatio(onBlack)}:1, so ${better} text works better${wcagChecks(bestRatio).aaNormal ? " — it passes AA for normal text" : ", though even that fails AA for normal text (large text only)"}.`;

  const blocks: Block[] = [
    {
      type: "facts",
      title: ru ? `Коды цвета ${Camel}` : `${Camel} color codes`,
      rows: [
        ["HEX", H],
        ["RGB", rgb],
        ["HSL", hsl],
        ["HWB", formatColor(c, "hwb")],
        ["HSV", formatColor(c, "hsv")],
        ["CMYK", formatColor(c, "cmyk")],
        ["Lab", formatColor(c, "lab")],
        ["LCH", formatColor(c, "lch")],
        ["OKLCH", oklch],
        [ru ? "Название в CSS" : "CSS keyword", name],
        [ru ? "Появился в" : "Introduced in", origin(name)[locale]],
        [ru ? "Группа" : "Group", group],
      ],
    },
    { type: "text", title: ru ? `О цвете ${Camel}` : `About ${Camel}`, paragraphs: [about, ...notes] },
    {
      type: "table",
      title: ru ? `Оттенки ${Camel}: светлее и темнее` : `${Camel} tints and shades`,
      caption: ru ? "Смешение с белым и чёрным в OKLab" : "Mixed with white and black in OKLab",
      head: [ru ? "Доля белого / чёрного" : "White / black share", ru ? "Светлее" : "Tint", ru ? "Темнее" : "Shade"],
      rows: (() => {
        const ti = tints(c);
        const sh = shades(c);
        return VARIATION_STEPS.map((p, i) => [ru ? `${p} %` : `${p}%`, formatColor(ti[i], "hex"), formatColor(sh[i], "hex")]);
      })(),
      mono: true,
    },
    {
      type: "table",
      title: ru ? `Цветовые гармонии для ${Camel}` : `${Camel} color harmonies`,
      head: [ru ? "Схема" : "Scheme", ru ? "Цвета (OKLCH, поворот тона)" : "Colors (OKLCH hue rotation)"],
      rows: (
        [
          ["complementary", ru ? "Комплементарная (+180°)" : "Complementary (+180°)"],
          ["analogous", ru ? "Аналоговая (±30°)" : "Analogous (±30°)"],
          ["triadic", ru ? "Триада (+120°, +240°)" : "Triadic (+120°, +240°)"],
          ["split-complementary", ru ? "Раздельно-комплементарная (+150°, +210°)" : "Split-complementary (+150°, +210°)"],
          ["tetradic", ru ? "Тетрада (+60°, +180°, +240°)" : "Tetradic (+60°, +180°, +240°)"],
        ] as const
      ).map(([k, label]) => [label, harmony(c, k).map((x) => formatColor(x, "hex")).join(", ")]),
    },
    {
      type: "table",
      title: ru ? `Контраст текста на фоне ${Camel} (WCAG 2)` : `Text contrast on ${Camel} (WCAG 2)`,
      head: [ru ? "Текст" : "Text", ru ? "Контраст" : "Ratio", "AA", ru ? "AA крупный" : "AA large", "AAA", ru ? "AAA крупный" : "AAA large"],
      rows: contrastRows(c, locale),
    },
    {
      type: "table",
      title: ru ? `${Camel} в CSS` : `${Camel} in CSS`,
      head: [ru ? "Запись" : "Syntax", ru ? "Код" : "Code"],
      rows: [
        [ru ? "Ключевое слово" : "Keyword", `color: ${name};`],
        ["HEX", `background-color: ${H};`],
        ["RGB", `border: 1px solid ${rgb};`],
        [ru ? "С прозрачностью 50 %" : "50% opacity", `background: ${formatColor({ ...c, alpha: 0.5 }, "rgb", { legacy: false })};`],
        ["OKLCH", `color: ${oklch};`],
        ["Tailwind CSS", `bg-[${H}] text-[${H}]`],
      ],
      mono: true,
    },
    { type: "links", title: ru ? `Похожие на ${Camel} цвета` : `Colors similar to ${Camel}`, style: "chips", items: near.map((n) => namedLink(n.name, locale)) },
  ];

  const nearest = near[0];
  const faq: QA[] = ru
    ? [
        { q: `Какой код у цвета ${Camel}?`, a: `HEX ${H}, RGB ${rgb}, HSL ${hsl}, OKLCH ${oklch}. В CSS можно писать и просто ${name}.` },
        { q: `Какой текст лучше читается на фоне ${Camel}?`, a: `${cap(better)}: контраст ${formatRatio(bestRatio)}:1 против ${formatRatio(Math.min(onWhite, onBlack))}:1. ${wcagChecks(bestRatio).aaaNormal ? "Это уровень AAA." : wcagChecks(bestRatio).aaNormal ? "Это уровень AA для обычного текста." : "Для обычного текста этого мало — используйте цвет только для крупного текста или фона без надписей."}` },
        { q: `На какой именованный цвет похож ${Camel}?`, a: `Ближе всего ${NAMED_INFO[nearest.name].camel} (${nearest.hex}) — разница ΔE OK ${nearest.distance.toFixed(3)}. Дальше идут ${near.slice(1, 3).map((n) => NAMED_INFO[n.name].camel).join(" и ")}.` },
        ...(aliases.length ? [{ q: `Чем ${Camel} отличается от ${NAMED_INFO[aliases[0]].camel}?`, a: `Ничем: оба названия дают ${H}. Варианты написания существуют ради совместимости со списком цветов X11 и SVG.` }] : []),
      ]
    : [
        { q: `What is the ${Camel} color code?`, a: `HEX ${H}, RGB ${rgb}, HSL ${hsl}, OKLCH ${oklch}. In CSS you can also just write ${name}.` },
        { q: `Which text color is more readable on ${Camel}?`, a: `${cap(better)}: ${formatRatio(bestRatio)}:1 contrast versus ${formatRatio(Math.min(onWhite, onBlack))}:1. ${wcagChecks(bestRatio).aaaNormal ? "That meets AAA." : wcagChecks(bestRatio).aaNormal ? "That meets AA for normal text." : "That is too low for normal text — use it only for large text or for backgrounds without text."}` },
        { q: `Which named color is closest to ${Camel}?`, a: `${NAMED_INFO[nearest.name].camel} (${nearest.hex}) is the closest, ΔE OK ${nearest.distance.toFixed(3)}, followed by ${near.slice(1, 3).map((n) => NAMED_INFO[n.name].camel).join(" and ")}.` },
        ...(aliases.length ? [{ q: `How is ${Camel} different from ${NAMED_INFO[aliases[0]].camel}?`, a: `It isn't: both names produce ${H}. The alternative spellings exist for compatibility with the X11 and SVG color lists.` }] : []),
      ];

  const groupSiblings = NAMED_SLUGS.filter((n) => NAMED_INFO[n].group === info.group && n !== name);
  const chipNames = [...aliases, ...groupSiblings.filter((n) => !aliases.includes(n))];
  for (const n of near) if (!chipNames.includes(n.name)) chipNames.push(n.name);
  for (const [n] of NAMED_COLORS) {
    if (chipNames.length >= 24) break;
    if (n !== name && !chipNames.includes(n) && NAMED_INFO[n].group !== "gray") chipNames.push(n);
  }

  const descBase = ru
    ? `Цвет ${Camel} (${ruName}): HEX ${H}, RGB ${rgbNums}, HSL и OKLCH. Оттенки, гармонии, контраст с белым ${formatRatio(onWhite)}:1 и CSS-код.`
    : `${Camel} color: HEX ${H}, RGB ${rgbNums}, HSL and OKLCH codes. Tints and shades, harmonies, contrast with white ${formatRatio(onWhite)}:1 and CSS snippets.`;

  return {
    path: [SECTION, name],
    sectionId: SECTION,
    kind: "entity",
    title,
    h1: ru ? `Цвет ${Camel}` : `${Camel} color`,
    description: descBase,
    lead: ru ? `${Camel} (${ruName}) — это ${H}, ${rgb}, ${hsl}.` : `${Camel} is ${H}, ${rgb}, ${hsl}.`,
    breadcrumbs: [
      { name: t.home, path: [] },
      { name: ru ? "Названия цветов CSS" : "CSS color names", path: [SECTION] },
    ],
    tool: { id: "color/named", props: { hex: H, name } },
    topBlocks: [{ type: "links", title: ru ? `${group}: другие цвета CSS` : `${group}: more CSS colors`, style: "chips", items: chipNames.slice(0, 40).map((n) => namedLink(n, locale)) }],
    blocks,
    faq,
    related: [],
    schemaType: "DefinedTerm",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        name,
        alternateName: [Camel, H],
        description: descBase,
        inDefinedTermSet: { "@type": "DefinedTermSet", name: ru ? "Именованные цвета CSS" : "CSS named colors" },
      },
    ],
    icon: "Palette",
    hue: HUE,
  };
}

export function namedSearch(locale: Locale) {
  return NAMED_SLUGS.map((n) => ({
    path: [SECTION, n],
    title: locale === "ru" ? `Цвет ${NAMED_INFO[n].camel} (${NAMED_INFO[n].ru})` : `${NAMED_INFO[n].camel} color`,
    hint: HEXU(n),
    keywords: `${n} ${NAMED_INFO[n].ru} ${HEXU(n)} ${tr({ ru: "цвет", en: "color" }, locale)}`,
    weight: 1,
  }));
}
