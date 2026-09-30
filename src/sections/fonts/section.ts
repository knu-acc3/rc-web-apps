import type { L10n, Locale } from "@/i18n/config";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { GENERATOR_HOWTO, GENERATOR_TEXT, INVISIBLE_TEXT, PLATFORM_TEXT } from "./content-pages";
import { STYLE_TEXT } from "./content-styles";
import { charFacts, INVISIBLE, type UnicodeClass } from "./invisible";
import { PLATFORM_IDS, PLATFORMS, STYLE_NAMES, TOOL_SLUG, type PlatformId } from "./names";
import { MATH, STYLE_IDS, STYLES, stylize, ZALGO_AMOUNT, ZALGO_LEVELS, type CyrSupport, type MathStyleId, type StyleId } from "./styles";

const L = (ru: string, en: string): L10n => ({ ru, en });
const both = <T>(ru: T, en: T): Record<Locale, T> => ({ ru, en });
const hex = (cp: number) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
const hexRange = (a: number, b: number) => `${hex(a)}–${hex(b)}`;
const codes = (s: string) => Array.from(s, (ch) => hex(ch.codePointAt(0) ?? 0)).join(" ");

const UPPER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(0x41 + i));
const CYR_UPPER = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const CYR_LOWER = CYR_UPPER.toLowerCase();

/* ───────────── shared labels ───────────── */

const CYR_LABEL: Record<CyrSupport, L10n> = {
  full: L("да — работает с любым алфавитом, включая казахский", "yes — works with any alphabet"),
  partial: L("частично — подробности в вопросах ниже", "partly — see the questions below"),
  none: L("нет — русские буквы остаются обычными", "no — Cyrillic letters stay unchanged"),
};
const CYR_SHORT: Record<CyrSupport, L10n> = { full: L("да", "yes"), partial: L("частично", "partly"), none: L("нет", "no") };
const DIGITS_SHORT: Record<"all" | "partial" | "none", L10n> = { all: L("да", "yes"), partial: L("частично", "partly"), none: L("нет", "no") };

const MARK_NAMES: Record<number, string> = {
  0x0336: "COMBINING LONG STROKE OVERLAY",
  0x0338: "COMBINING LONG SOLIDUS OVERLAY",
  0x0332: "COMBINING LOW LINE",
  0x0333: "COMBINING DOUBLE LOW LINE",
  0x0305: "COMBINING OVERLINE",
  0x20dd: "COMBINING ENCLOSING CIRCLE",
};

/** Code point info for styles that aren't a plain Mathematical Alphanumeric range. */
const CODE_INFO: Partial<Record<StyleId, L10n>> = {
  "small-caps": L("фонетические блоки: U+1D00–U+1D22, U+0262–U+029F, U+A730–U+A731 и ǫ U+01EB", "phonetic blocks: U+1D00–U+1D22, U+0262–U+029F, U+A730–U+A731 and ǫ U+01EB"),
  superscript: L(
    "U+2070–U+207F, ¹ ² ³ (U+00B9, U+00B2, U+00B3), буквы-модификаторы U+02B0–U+02E3 и U+1D2C–U+1DBB, ⱽ U+2C7D",
    "U+2070–U+207F, ¹ ² ³ (U+00B9, U+00B2, U+00B3), modifier letters U+02B0–U+02E3 and U+1D2C–U+1DBB, ⱽ U+2C7D",
  ),
  subscript: L("U+2080–U+209C, U+1D62–U+1D65 и ⱼ U+2C7C", "U+2080–U+209C, U+1D62–U+1D65 and ⱼ U+2C7C"),
  circled: L("буквы U+24B6–U+24E9, цифры ⓪ U+24EA и U+2460–U+2468", "letters U+24B6–U+24E9, digits ⓪ U+24EA and U+2460–U+2468"),
  "circled-negative": L("буквы U+1F150–U+1F169, цифры ⓿ U+24FF и U+2776–U+277E", "letters U+1F150–U+1F169, digits ⓿ U+24FF and U+2776–U+277E"),
  squared: L("U+1F130–U+1F149, только заглавные", "U+1F130–U+1F149, capitals only"),
  "squared-negative": L("U+1F170–U+1F189, только заглавные", "U+1F170–U+1F189, capitals only"),
  parenthesized: L("строчные U+249C–U+24B5, заглавные U+1F110–U+1F129, цифры U+2474–U+247C", "small U+249C–U+24B5, capitals U+1F110–U+1F129, digits U+2474–U+247C"),
  fullwidth: L("U+FF01–U+FF5E, пробел U+3000", "U+FF01–U+FF5E, space U+3000"),
  "upside-down": L("похожие символы из разных блоков: МФА, математические знаки, кириллица, лису", "look-alikes from several blocks: IPA, math symbols, Cyrillic, Lisu"),
  mirror: L("похожие символы из разных блоков: МФА, кириллица, расширенная латиница", "look-alikes from several blocks: IPA, Cyrillic, Latin Extended"),
  zalgo: L("случайные знаки из U+0300–U+036F", "random marks from U+0300–U+036F"),
  glitch: L("U+0334–U+0338, U+20D2, U+20D3, U+20D8, U+20E5 и отдельные знаки из U+0300–U+036F", "U+0334–U+0338, U+20D2, U+20D3, U+20D8, U+20E5 plus a few marks from U+0300–U+036F"),
};

function codeInfo(id: StyleId, locale: Locale): string {
  const ru = locale === "ru";
  if (id in MATH) {
    const m = MATH[id as MathStyleId];
    let s = `${ru ? "буквы" : "letters"} ${hexRange(m.upper, m.upper + 51)}`;
    if (m.digits !== undefined) s += `, ${ru ? "цифры" : "digits"} ${hexRange(m.digits, m.digits + 9)}`;
    return s;
  }
  const mark = STYLES[id].mark;
  if (mark !== undefined) return `${hex(mark)} ${MARK_NAMES[mark]}${ru ? " после каждого символа" : " after every character"}`;
  return CODE_INFO[id]![locale];
}

function digitsText(id: StyleId, locale: Locale): string {
  const ru = locale === "ru";
  const d = STYLES[id].digits;
  if (d === "none") return ru ? "нет — остаются обычными" : "no — they stay plain";
  if (id === "mirror") return ru ? "только 3 → Ɛ" : "only 3 → Ɛ";
  return `${d === "all" ? (ru ? "да" : "yes") : ru ? "частично" : "partly"}: ${stylize(id, "0123456789")}`;
}

/* ───────────── style pages ───────────── */

function styleFacts(id: StyleId, locale: Locale): [string, string][] {
  const ru = locale === "ru";
  const info = STYLES[id];
  const rows: [string, string][] = [
    [ru ? "Пример" : "Example", `Hello 123 → ${stylize(id, "Hello 123")}`],
    [ru ? "Русский текст" : "Cyrillic text", `Привет → ${stylize(id, "Привет")}`],
    [ru ? "Кириллица" : "Cyrillic", CYR_LABEL[info.cyr][locale]],
    [ru ? "Цифры" : "Digits", digitsText(id, locale)],
    [ru ? "Символы Unicode" : "Unicode characters", codeInfo(id, locale)],
  ];
  const holes = id in MATH ? MATH[id as MathStyleId].holes : undefined;
  if (holes) {
    rows.push([
      ru ? "Буквы из блока «Буквоподобные символы»" : "Letters from Letterlike Symbols",
      Object.entries(holes)
        .map(([c, cp]) => `${c} → ${String.fromCodePoint(cp)} ${hex(cp)}`)
        .join(", "),
    ]);
  }
  if (info.cyr === "partial") {
    const src = id === "mirror" ? CYR_UPPER : CYR_LOWER;
    rows.push([ru ? "Весь русский алфавит" : "The whole Cyrillic alphabet", `${src} → ${stylize(id, src)}`]);
  }
  if (id === "zalgo") {
    const total = (lvl: (typeof ZALGO_LEVELS)[number]) => {
      const r = ZALGO_AMOUNT[lvl];
      return `${r.reduce((n, [a]) => n + a, 0)}–${r.reduce((n, [, b]) => n + b, 0)}`;
    };
    rows.push([
      ru ? "Знаков на одну букву" : "Marks per letter",
      ru ? `слабо ${total("light")}, средне ${total("medium")}, сильно ${total("heavy")}` : `light ${total("light")}, medium ${total("medium")}, heavy ${total("heavy")}`,
    ]);
  }
  return rows;
}

function letterTable(id: StyleId, locale: Locale): Block | null {
  const kind = STYLES[id].kind;
  if (kind === "combining" || kind === "random") return null;
  const ru = locale === "ru";
  const cell = (c: string): [string, string] => {
    const o = stylize(id, c);
    return [o, o === c ? "—" : codes(o)];
  };
  return {
    type: "table",
    title: ru ? "Латинский алфавит в этом стиле" : "The Latin alphabet in this style",
    head: ru ? ["Буква", "Заглавная", "Код", "Строчная", "Код"] : ["Letter", "Capital", "Code", "Small", "Code"],
    rows: UPPER.map((u) => {
      const l = u.toLowerCase();
      return [`${u} ${l}`, ...cell(u), ...cell(l)];
    }),
  };
}

function cyrQA(id: StyleId, locale: Locale): QA | null {
  const tx = STYLE_TEXT[id][locale];
  const info = STYLES[id];
  const ru = locale === "ru";
  if (tx.noCyrFaq) return null;
  const q = ru ? "Работает ли стиль с русскими буквами?" : "Does it work with Cyrillic?";
  if (tx.cyrNote) return { q, a: tx.cyrNote };
  if (info.cyr === "full") {
    const how =
      info.mark === undefined
        ? ru
          ? "Знаки добавляются к каждой букве"
          : "Marks are added to every letter"
        : id === "bubble"
          ? ru
            ? `Знак ${hex(info.mark)} добавляется после каждой буквы и цифры`
            : `The mark ${hex(info.mark)} is added after every letter and digit`
          : ru
            ? `Знак ${hex(info.mark)} добавляется после каждого символа`
            : `The mark ${hex(info.mark)} is added after every character`;
    return {
      q,
      a: ru
        ? `Да. ${how}, поэтому стиль работает с русскими, казахскими и любыми другими буквами, а эмодзи остаются целыми.`
        : `Yes. ${how}, so the style works with Cyrillic, Greek or any other alphabet, and emoji stay intact.`,
    };
  }
  const digits = info.digits !== "none";
  return {
    q,
    a: ru
      ? `Нет. Кириллических ${tx.what} в Unicode нет, поэтому русские буквы останутся обычными — генератор меняет только латиницу${digits ? " и цифры" : ""}. Для русского текста подойдут зачёркнутый, подчёркнутый, залго или кружки для любых букв.`
      : `No. Unicode has no Cyrillic ${tx.what}, so Cyrillic letters stay plain — the generator changes only Latin letters${digits ? " and digits" : ""}. For Cyrillic text use strikethrough, underline, zalgo or bubble, which work with any alphabet.`,
  };
}

function styleVariant(id: StyleId): VariantDef {
  const tx = STYLE_TEXT[id];
  const faq = (locale: Locale) => {
    const extra = cyrQA(id, locale);
    return extra ? [...tx[locale].faq, extra] : tx[locale].faq;
  };
  const sample = id === "mirror" ? "R" : id === "glitch" ? "G" : id === "zalgo" ? "Z" : "A";
  return {
    slug: id,
    name: STYLE_NAMES[id],
    title: L(tx.ru.title, tx.en.title),
    h1: L(tx.ru.h1, tx.en.h1),
    description: L(tx.ru.description, tx.en.description),
    lead: L(tx.ru.lead, tx.en.lead),
    props: { style: id },
    glyph: stylize(id, sample, { zalgo: "light" }),
    keywords: both([STYLE_NAMES[id].en, id.replace(/-/g, " ")], [STYLE_NAMES[id].ru, id.replace(/-/g, " ")]),
    blocks: (locale) => {
      const ru = locale === "ru";
      const table = letterTable(id, locale);
      return [
        { type: "facts", title: ru ? "Коротко о стиле" : "Style at a glance", rows: styleFacts(id, locale) },
        ...(table ? [table] : []),
        { type: "text", title: ru ? "Как устроен стиль" : "How the style works", paragraphs: tx[locale].about },
      ];
    },
    faq: both(faq("ru"), faq("en")),
  };
}

/* ───────────── platform pages ───────────── */

function platformVariant(p: PlatformId): VariantDef {
  const tx = PLATFORM_TEXT[p];
  const pf = PLATFORMS[p];
  return {
    slug: p,
    name: L(`Для ${pf.forName.ru}`, `For ${pf.forName.en}`),
    title: L(tx.ru.title, tx.en.title),
    h1: L(tx.ru.h1, tx.en.h1),
    description: L(tx.ru.description, tx.en.description),
    lead: L(tx.ru.lead, tx.en.lead),
    props: { platform: p },
    keywords: both([pf.name.ru, pf.name.en, "шрифты", "ник"], [pf.name.en, "fonts", "nickname"]),
    blocks: (locale) => {
      const ru = locale === "ru";
      return [
        { type: "facts", title: ru ? `${pf.name.ru}: что важно знать` : `${pf.name.en}: what to know`, rows: tx[locale].facts },
        {
          type: "table",
          title: ru ? "Стили, которые стоит попробовать" : "Styles worth trying",
          head: ru ? ["Стиль", "Пример", "Кириллица"] : ["Style", "Example", "Cyrillic"],
          rows: pf.styles.map((s) => [STYLE_NAMES[s][locale], stylize(s, ru ? "Привет Hello" : "Hello"), CYR_SHORT[STYLES[s].cyr][locale]]),
        },
        { type: "text", title: ru ? `Советы для ${pf.forName.ru}` : `Tips for ${pf.forName.en}`, paragraphs: tx[locale].about },
      ];
    },
    faq: both(tx.ru.faq, tx.en.faq),
  };
}

/* ───────────── invisible character ───────────── */

const CLASS_NAMES: Record<UnicodeClass, L10n> = {
  letter: L("буква", "letter"),
  symbol: L("символ", "symbol"),
  format: L("служебный", "format"),
  space: L("пробел", "space"),
  mark: L("знак", "mark"),
};

const invisibleVariant: VariantDef = {
  slug: "invisible-character",
  name: L("Невидимый символ", "Invisible character"),
  title: L(INVISIBLE_TEXT.ru.title, INVISIBLE_TEXT.en.title),
  h1: L(INVISIBLE_TEXT.ru.h1, INVISIBLE_TEXT.en.h1),
  description: L(INVISIBLE_TEXT.ru.description, INVISIBLE_TEXT.en.description),
  lead: L(INVISIBLE_TEXT.ru.lead, INVISIBLE_TEXT.en.lead),
  props: { invisible: true },
  keywords: both(["пустой символ", "пустой ник", "невидимый ник", "hangul filler", "U+3164"], ["blank character", "empty name", "invisible text", "hangul filler", "U+3164"]),
  blocks: (locale) => {
    const ru = locale === "ru";
    const tx = INVISIBLE_TEXT[locale];
    return [
      {
        type: "table",
        title: ru ? "Невидимые символы: что есть что" : "Invisible characters compared",
        head: ru ? ["Символ", "Код", "Тип по Unicode", "Считается пробелом", "Для чего"] : ["Character", "Code", "Unicode type", "Whitespace", "Used for"],
        rows: INVISIBLE.map((c) => {
          const fx = charFacts(c.cp);
          const type = `${CLASS_NAMES[fx.cls][locale]}${fx.ignorable ? (ru ? ", по стандарту может не отображаться" : ", default-ignorable") : ""}`;
          return [c.label[locale], hex(c.cp), type, fx.whitespace ? (ru ? "да" : "yes") : ru ? "нет" : "no", c.use[locale]];
        }),
      },
      { type: "list", title: ru ? "Что попробовать первым" : "What to try first", items: tx.tips },
      { type: "text", title: ru ? "Почему гарантий нет" : "Why there are no guarantees", paragraphs: tx.about },
    ];
  },
  faq: both(INVISIBLE_TEXT.ru.faq, INVISIBLE_TEXT.en.faq),
};

/* ───────────── the generator ───────────── */

const generator: ToolDef = {
  slug: TOOL_SLUG,
  component: "fonts/generator",
  icon: "ALargeSmall",
  name: L("Генератор шрифтов", "Font generator"),
  title: L(GENERATOR_TEXT.ru.title, GENERATOR_TEXT.en.title),
  h1: L(GENERATOR_TEXT.ru.h1, GENERATOR_TEXT.en.h1),
  description: L(GENERATOR_TEXT.ru.description, GENERATOR_TEXT.en.description),
  lead: L(GENERATOR_TEXT.ru.lead, GENERATOR_TEXT.en.lead),
  keywords: both(
    ["красивые шрифты", "красивый текст", "шрифты для ника", "стильный текст", "fancy text"],
    ["fancy text", "fancy fonts", "font changer", "cool text", "unicode fonts"],
  ),
  howTo: GENERATOR_HOWTO,
  about: both(GENERATOR_TEXT.ru.about, GENERATOR_TEXT.en.about),
  faq: both(GENERATOR_TEXT.ru.faq, GENERATOR_TEXT.en.faq),
  related: ["symbols", "emoji", "kaomoji", "case-converter", "word-counter/instagram", "remove-invisible-characters"],
  popular: true,
  variants: {
    title: L("Стили и шрифты для соцсетей", "Styles and platform fonts"),
    list: () => [...STYLE_IDS.map(styleVariant), invisibleVariant, ...PLATFORM_IDS.map(platformVariant)],
  },
  blocks: (locale) => {
    const ru = locale === "ru";
    return [
      {
        type: "table",
        title: ru ? "Какие стили работают с русскими буквами" : "Which styles work with Cyrillic",
        head: ru ? ["Стиль", "Пример", "Кириллица", "Цифры"] : ["Style", "Example", "Cyrillic", "Digits"],
        rows: STYLE_IDS.map((s) => [STYLE_NAMES[s][locale], stylize(s, "Мир Hi 12"), CYR_SHORT[STYLES[s].cyr][locale], DIGITS_SHORT[STYLES[s].digits][locale]]),
      },
    ];
  },
};

export const fontsSection = defineToolSection({
  id: "fonts",
  name: L("Красивые шрифты", "Fancy fonts"),
  description: L(
    "Генератор красивого текста: жирный, курсив, зачёркнутый, готический и ещё 28 стилей Unicode для ников и соцсетей",
    "Fancy text generator: bold, italic, strikethrough, gothic and 28 more Unicode styles for nicknames and social media",
  ),
  icon: "ALargeSmall",
  hue: 175,
  category: "text",
  order: 2,
  tools: [generator],
});
