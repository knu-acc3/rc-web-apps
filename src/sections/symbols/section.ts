import { tr, type Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Block, Crumb, LinkItem, PageModel, QA, SearchEntry, SectionDef } from "@/registry/types";
import type { BoardItem } from "../emoji/shared/GlyphBoard";
import { cssEscape, hex, htmlDec, htmlHex, jsEscape, pyEscape, uPlus, urlEncode, utf16, utf8 } from "../emoji/shared/codes";
import { COLLECTION_META, CURATED, GC_NAMES, HUB_GROUPS, LOOKALIKES, POPULAR_SYMBOLS } from "./content";
import { COLLECTIONS, collectionById, collectionsOf, pageByKey, pageOf, PAGES, sym, SYMS, type Collection, type Sym, type SymPage } from "./data";

/*
 * URL scheme (absolute section: it owns two top-level segments):
 *   /symbols                         hub: popular symbols, search, all collections
 *   /symbols/{collection}            ~55 collections (grid + table)
 *   /symbols/{collection}/{slug}     ~600 single-symbol pages (slug = Unicode name in kebab-case)
 *   /unicode-table                   Unicode character lookup tool
 */

const ID = "symbols";
const TABLE = "unicode-table";
const HUE = 265;
const NAME = { ru: "Символы", en: "Symbols" };
const DESC = {
  ru: "Специальные символы Unicode: стрелки, звёзды, сердечки, валюты, математика, невидимые символы и таблица Юникода",
  en: "Unicode special characters: arrows, stars, hearts, currency, math, invisible characters and the Unicode table",
};
const PREBUILD_PAGES = 200;

/* ───────────── text helpers ───────────── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SMALL = new Set(["of", "with", "and", "for", "to", "the", "in", "on", "a", "over", "from"]);
/** "DEGREE SIGN" → "Degree Sign" */
function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|-)(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase())))
    .join(" ");
}
const n = (locale: Locale, x: number) => formatNumber(locale, x);
const SYM_FORMS = { ru: ["символ", "символа", "символов"], en: ["character", "characters"] };
const cnt = (locale: Locale, x: number) => `${n(locale, x)} ${plural(locale, x, SYM_FORMS[locale])}`;
const u = (s: Sym) => `U+${s.hex}`;
/** Visible text for a character: invisible ones are shown by their label. */
const shown = (s: Sym) => (s.ext.d ? s.ext.d : s.ch);
const ruOf = (s: Sym) => s.ru || s.name.toLowerCase();
const nameOf = (s: Sym, locale: Locale) => (locale === "ru" ? cap(ruOf(s)) : titleCase(s.name));
const blockName = (s: Sym, locale: Locale) => (locale === "ru" && s.block[3] ? s.block[3] : s.block[2]);
const blockRange = (s: Sym) => `U+${hex(s.block[0])}–U+${hex(s.block[1])}`;
const entity = (s: Sym) => s.ext.e?.[0];
/** Alt code usable on Windows: [code, layouts] */
function altCode(s: Sym, locale: Locale): string | null {
  const { w, r } = s.ext;
  if (w === undefined && r === undefined) return null;
  const ru = locale === "ru";
  if (w !== undefined && w === r) return ru ? `Alt+0${w} (в русской и английской раскладке)` : `Alt+0${w} (English and Russian layouts)`;
  const out: string[] = [];
  if (w !== undefined) out.push(ru ? `Alt+0${w} в английской раскладке` : `Alt+0${w} with an English layout`);
  if (r !== undefined) out.push(ru ? `Alt+0${r} в русской раскладке` : `Alt+0${r} with a Russian layout`);
  return out.join("; ");
}
const altShort = (s: Sym) => (s.ext.w ?? s.ext.r) !== undefined ? `Alt+0${s.ext.w ?? s.ext.r}` : null;

/** Join sentences while the text fits a meta description; array parts = first alternative that fits. */
function fit(parts: (string | string[])[], max = 160): string {
  let out = String(parts[0]);
  for (const p of parts.slice(1)) {
    const alt = (Array.isArray(p) ? p : [p]).find((x) => `${out} ${x}`.length <= max);
    if (alt) out = `${out} ${alt}`;
  }
  return out;
}

/* ───────────── page naming ───────────── */

const LETTER_COLLECTIONS = new Set(["cyrillic", "kazakh"]);
/** Russian / English name of a symbol page (letter pages cover both cases). */
function pageName(p: SymPage, locale: Locale): string {
  if (!p.pair) return nameOf(p.sym, locale);
  if (locale === "en") return titleCase(p.sym.name.replace(" SMALL ", " "));
  if (LETTER_COLLECTIONS.has(p.col)) return cap(ruOf(p.pair).replace(/^заглавная /, ""));
  return cap(ruOf(p.sym).replace(/строчная /, ""));
}
/** Glyphs shown for a page: "Ё ё" for letters, the label for invisible characters. */
const pageGlyph = (p: SymPage) => (p.pair ? `${p.pair.ch} ${p.sym.ch}` : shown(p.sym));
const pagePath = (p: SymPage) => [ID, p.col, p.slug];
const pageLink = (p: SymPage, locale: Locale): LinkItem => ({ path: pagePath(p), label: pageName(p, locale), glyph: p.sym.ext.d ? undefined : p.pair ? p.pair.ch : p.sym.ch });
const colMeta = (id: string) => COLLECTION_META[id];
function colLink(c: Collection, locale: Locale): LinkItem {
  return { path: [ID, c.id], label: tr(colMeta(c.id).name, locale), hint: `${cnt(locale, c.chars.length)}: ${sampleOf(c, 6)}`, glyph: firstVisible(c) };
}
const firstVisible = (c: Collection) => c.chars.find((s) => !s.ext.d)?.ch;
const sampleOf = (c: Collection, k: number) =>
  c.chars
    .filter((s) => !s.ext.d)
    .slice(0, k)
    .map((s) => s.ch)
    .join(" ");
const tableLink = (locale: Locale): LinkItem => ({
  path: [TABLE],
  label: locale === "ru" ? "Таблица символов Юникода" : "Unicode character table",
  hint: locale === "ru" ? "Поиск любого символа по названию и коду" : "Find any character by name or code",
  icon: "Search",
  hue: HUE,
});
const hubLink = (locale: Locale): LinkItem => ({
  path: [ID],
  label: locale === "ru" ? "Специальные символы" : "Special symbols",
  hint: locale === "ru" ? "Все наборы символов для копирования" : "All symbol collections to copy",
  icon: "Asterisk",
  hue: HUE,
});
const emojiHubLink = (locale: Locale): LinkItem => ({
  path: ["emoji"],
  label: locale === "ru" ? "Эмодзи" : "Emoji",
  hint: locale === "ru" ? "Все эмодзи с названиями и кодами" : "Every emoji with names and codes",
  icon: "Smile",
  hue: 45,
});
function crumbs(locale: Locale, ...extra: Crumb[]): Crumb[] {
  return [{ name: ui(locale).home, path: [] }, { name: tr(NAME, locale), path: [ID] }, ...extra];
}

/** Grid item of a character: its symbol page, its emoji page, or nothing. */
function boardItem(s: Sym, locale: Locale): BoardItem {
  const p = pageOf.get(s.ch);
  const path = p ? `${p.col}/${p.slug}` : s.ext.em ? `/${locale}/emoji/${s.ext.em}` : "";
  const item: BoardItem = [s.ch, path, `${nameOf(s, locale)} — ${u(s)}`];
  if (s.ext.d) item.push(s.ext.d);
  return item;
}
const boardBase = (locale: Locale) => `/${locale}/${ID}/`;

/* ───────────── symbol page ───────────── */

function typingRows(s: Sym, locale: Locale): string[][] {
  const ru = locale === "ru";
  const rows: string[][] = [];
  const alt = altCode(s, locale);
  if (alt) rows.push([ru ? "Windows, Alt-код" : "Windows, Alt code", ru ? `${alt}: удерживая Alt, наберите цифры на цифровом блоке (NumLock включён)` : `${alt}: hold Alt and type the digits on the numeric keypad (Num Lock on)`]);
  rows.push(["Microsoft Word", ru ? `${s.hex}, затем Alt+X` : `${s.hex}, then Alt+X`]);
  rows.push([
    "macOS",
    s.ext.m
      ? ru
        ? `${s.ext.m} (Option) в раскладке «U.S.» или «ABC»`
        : `${s.ext.m} (Option) in the U.S. or ABC layout`
      : ru
        ? `Control+Command+Пробел → «Эмодзи и символы», поиск по названию «${s.name.toLowerCase()}»`
        : `Control+Command+Space → Emoji & Symbols, search for “${s.name.toLowerCase()}”`,
  ]);
  rows.push(["Linux (GTK, IBus)", ru ? `Ctrl+Shift+U, ${s.hex.toLowerCase()}, затем Пробел или Enter` : `Ctrl+Shift+U, ${s.hex.toLowerCase()}, then Space or Enter`]);
  rows.push(["HTML", [entity(s), htmlDec(s.ch), htmlHex(s.ch)].filter(Boolean).join(ru ? " или " : " or ")]);
  if (s.ext.t) rows.push(["LaTeX", s.ext.t]);
  return rows;
}

function codeRows(s: Sym): string[][] {
  return [
    ["Unicode", u(s)],
    ["HTML", [entity(s), htmlHex(s.ch), htmlDec(s.ch)].filter(Boolean).join("  ")],
    ["CSS", cssEscape(s.ch)],
    ["JavaScript", jsEscape(s.ch)],
    ["Python", pyEscape(s.ch)],
    ["UTF-8", utf8(s.ch)],
    ["UTF-16", utf16(s.ch)],
    ["URL", urlEncode(s.ch)],
  ];
}

function usageText(p: SymPage, locale: Locale): string[] {
  const ru = locale === "ru";
  const s = p.sym;
  const out: string[] = [];
  const cur = CURATED[s.ch];
  if (cur) out.push(tr(cur.usage, locale));
  const cols = (collectionsOf.get(s.ch) ?? []).map((c) => `«${tr(colMeta(c.id).name, locale)}»`);
  out.push(
    ru
      ? `Символ входит в блок Unicode «${blockName(s, "ru")}» (${blockRange(s)}) и относится к категории «${tr(GC_NAMES[s.gc], "ru")}». На этом сайте он есть в ${cols.length > 1 ? "наборах" : "наборе"} ${cols.join(", ")}.`
      : `It belongs to the Unicode block “${blockName(s, "en")}” (${blockRange(s)}), general category “${tr(GC_NAMES[s.gc], "en")}”. On this site it is part of ${cols.join(", ")}.`,
  );
  if (s.kwRu.length || s.kwEn.length) {
    const kw = ru ? s.kwRu : s.kwEn;
    if (kw.length) out.push(ru ? `Ключевые слова Unicode CLDR: ${kw.join(", ")}.` : `Unicode CLDR keywords: ${kw.join(", ")}.`);
  }
  if (s.ext.em)
    out.push(
      ru
        ? "У символа есть эмодзи-вариант: на телефонах он может отображаться цветной картинкой. Чтобы гарантированно получить текстовый вид, после него ставят невидимый селектор U+FE0E."
        : "The character also has an emoji form and may render as a color picture on phones. The invisible selector U+FE0E after it requests the text form.",
    );
  if (p.pair)
    out.push(
      ru
        ? `Заглавная форма ${p.pair.ch} имеет код ${u(p.pair)}, строчная ${s.ch} — ${u(s)}.`
        : `The uppercase form ${p.pair.ch} is ${u(p.pair)}, the lowercase ${s.ch} is ${u(s)}.`,
    );
  return out;
}

function lookalikeBlock(s: Sym, locale: Locale): Block | null {
  const g = LOOKALIKES.find((x) => Array.from(x.chars).includes(s.ch));
  if (!g) return null;
  const ru = locale === "ru";
  return {
    type: "table",
    title: ru ? `Похожие символы: чем отличается ${shown(s)}` : `Look-alikes: how ${shown(s)} differs`,
    head: ru ? ["Символ", "Код", "Для чего"] : ["Character", "Code", "Used for"],
    rows: Array.from(g.chars).map((ch) => {
      const x = SYMS.get(ch);
      const code = `U+${hex(ch.codePointAt(0)!)}`;
      return [x?.ext.d ?? (ch === " " ? "SP" : ch), code, tr(g.note[ch], locale)];
    }),
  };
}

function symbolPage(p: SymPage, locale: Locale): PageModel {
  const ru = locale === "ru";
  const s = p.sym;
  const name = pageName(p, locale);
  const glyph = pageGlyph(p);
  const cur = CURATED[s.ch];
  const ent = entity(s);
  const alt = altShort(s);
  const col = collectionById.get(p.col)!;
  const meta = colMeta(p.col);
  const invisible = !!s.ext.d;
  const h1 = cur?.h1 ? tr(cur.h1, locale) : invisible ? `${name} (${glyph})` : `${name} ${glyph}`;
  const codeText = p.pair ? `${u(p.pair)} / ${u(s)}` : u(s);

  const facts: [string, string][] = [
    [ru ? "Символ" : "Character", glyph],
    [ru ? "Название" : "Name", name],
    [ru ? "Название в Unicode" : "Unicode name", p.pair ? `${p.pair.name} / ${s.name}` : s.name],
    [ru ? "Код" : "Code point", codeText],
    [ru ? "Десятичный код" : "Decimal", p.pair ? `${p.pair.cp} / ${s.cp}` : String(s.cp)],
    [ru ? "Блок Unicode" : "Unicode block", `${blockName(s, locale)} (${blockRange(s)})`],
    [ru ? "Категория" : "Category", tr(GC_NAMES[s.gc], locale)],
    ["HTML", [ent, htmlDec(s.ch), htmlHex(s.ch)].filter(Boolean).join("  ")],
  ];
  if (alt) facts.push([ru ? "Alt-код" : "Alt code", alt]);
  if (s.ext.m) facts.push(["macOS", s.ext.m]);

  const blocks: Block[] = [
    { type: "facts", title: ru ? "Коротко" : "Quick facts", rows: facts },
    { type: "table", title: ru ? `Как набрать ${glyph} на клавиатуре` : `How to type ${glyph}`, head: ru ? ["Где", "Как"] : ["Where", "How"], rows: typingRows(s, locale) },
    { type: "text", title: ru ? "Где используется" : "Usage", paragraphs: usageText(p, locale) },
  ];
  const look = lookalikeBlock(s, locale);
  if (look) blocks.push(look);
  blocks.push({ type: "table", title: ru ? "Коды для программистов" : "Codes for developers", head: ru ? ["Формат", "Код"] : ["Format", "Code"], rows: codeRows(s), mono: true });
  const cols = (collectionsOf.get(s.ch) ?? []).map((c) => colLink(c, locale));
  if (s.ext.em) cols.unshift({ path: ["emoji", s.ext.em], label: ru ? `Эмодзи ${s.ch}\u{FE0F}` : `${s.ch}\u{FE0F} emoji`, glyph: `${s.ch}\u{FE0F}` });
  blocks.push({ type: "links", title: ru ? "Где ещё найти этот символ" : "Also in", style: "chips", items: cols });

  // 30–50 siblings: pages of the same collection, then pages of collections in the same hub group.
  const group = HUB_GROUPS.find((g) => g.ids.includes(p.col))?.ids ?? [];
  const siblings = [
    ...col.pages.filter((x) => x !== p),
    ...group.filter((id) => id !== p.col).flatMap((id) => collectionById.get(id)?.pages ?? []),
    ...PAGES.filter((x) => x.col !== p.col && !group.includes(x.col)),
  ].slice(0, 40);

  const faq: QA[] = [];
  const altText = altCode(s, locale);
  faq.push(
    ru
      ? {
          q: `Как набрать ${glyph} на клавиатуре?`,
          a: `${altText ? `В Windows: ${altText} на цифровом блоке. ` : "Alt-кода для этого символа в стандартных кодировках Windows нет. "}В Word наберите ${s.hex} и нажмите Alt+X. ${s.ext.m ? `На Mac — ${s.ext.m}.` : "На Mac откройте панель символов сочетанием Control+Command+Пробел."} В Linux — Ctrl+Shift+U, ${s.hex.toLowerCase()} и Пробел. Проще всего — нажать «Копировать» на этой странице.`,
        }
      : {
          q: `How do I type ${glyph} on a keyboard?`,
          a: `${altText ? `On Windows: ${altText} on the numeric keypad. ` : "There is no Windows Alt code for it in the standard code pages. "}In Word type ${s.hex} and press Alt+X. ${s.ext.m ? `On a Mac press ${s.ext.m}.` : "On a Mac open the Character Viewer with Control+Command+Space."} On Linux press Ctrl+Shift+U, type ${s.hex.toLowerCase()} and Space. Or just press Copy on this page.`,
        },
  );
  faq.push(
    ru
      ? { q: `Какой код у символа ${glyph}?`, a: `${codeText} (десятичный ${s.cp}). В HTML — ${[ent, htmlDec(s.ch)].filter(Boolean).join(" или ")}, в CSS — ${cssEscape(s.ch)}, в JavaScript — "${jsEscape(s.ch)}".` }
      : { q: `What is the code of ${glyph}?`, a: `${codeText} (decimal ${s.cp}). In HTML ${[ent, htmlDec(s.ch)].filter(Boolean).join(" or ")}, in CSS ${cssEscape(s.ch)}, in JavaScript "${jsEscape(s.ch)}".` },
  );
  const g = LOOKALIKES.find((x) => Array.from(x.chars).includes(s.ch));
  if (g) {
    const other = Array.from(g.chars).find((ch) => ch !== s.ch)!;
    const otherShown = SYMS.get(other)?.ext.d ?? other;
    faq.push(
      ru
        ? { q: `Чем ${glyph} отличается от ${otherShown}?`, a: `${glyph} — ${tr(g.note[s.ch], "ru")}, а ${otherShown} — ${tr(g.note[other], "ru")}. Внешне они похожи, но это разные символы Unicode с разными кодами, поэтому поиск и программы их различают.` }
        : { q: `What is the difference between ${glyph} and ${otherShown}?`, a: `${glyph} is the ${tr(g.note[s.ch], "en")}, while ${otherShown} is the ${tr(g.note[other], "en")}. They look alike but are different Unicode characters with different codes, so search and software treat them differently.` },
    );
  }

  return {
    path: pagePath(p),
    sectionId: ID,
    kind: "entity",
    title: ru ? `${invisible ? "" : `${glyph} `}${name}${invisible ? ` (${glyph})` : ""} — скопировать символ, код` : `${invisible ? "" : `${glyph} `}${name}${invisible ? ` (${glyph})` : ""} Symbol — Copy, Unicode${alt ? " & Alt Code" : ""}`,
    h1,
    description: ru
      ? fit([
          `${invisible ? name : `${glyph} — ${ruOf(p.pair ?? s)}`}: код ${codeText}${ent ? `, HTML ${ent}` : ""}${alt ? `, ${alt}` : ""}.`,
          ["Скопируйте символ в один клик и узнайте, как набрать его на Windows, Mac и Linux.", "Скопируйте символ в один клик.", "Копирование в один клик."],
        ])
      : fit([
          `${invisible ? name : `${glyph} ${name}`}: code ${codeText}${ent ? `, HTML ${ent}` : ""}${alt ? `, ${alt}` : ""}.`,
          ["Copy it in one click and see how to type it on Windows, Mac and Linux.", "Copy it in one click.", "One-click copy."],
        ]),
    lead: ru
      ? // Entities that are English words (&and;) stay out of the Russian lead.
        `${invisible ? name : `${glyph} — ${ruOf(p.pair ?? s)}`}, код ${codeText}${ent && !/^&(the|and|with|for|your);$/.test(ent) ? `, в HTML — ${ent}` : ""}. Нажмите «Копировать», чтобы вставить символ.`
      : `${invisible ? name : `${glyph} is the ${name}`}, code ${codeText}${ent ? `, HTML ${ent}` : ""}. Press Copy to paste it anywhere.`,
    breadcrumbs: crumbs(locale, { name: tr(meta.name, locale), path: [ID, p.col] }),
    tool: {
      id: "symbols/card",
      props: {
        glyph: p.pair ? p.pair.ch : s.ch,
        name,
        kind: "symbol",
        display: s.ext.d,
        codes: [[ent ? ent : "HTML", ent ?? htmlHex(s.ch)], [u(s), u(s)]],
        variants: p.pair
          ? [{ title: ru ? "Регистр" : "Case", items: [[p.pair.ch, ru ? "заглавная" : "uppercase"], [s.ch, ru ? "строчная" : "lowercase"]] }]
          : undefined,
      },
    },
    topBlocks: [{ type: "links", title: ru ? `Другие символы: ${tr(meta.name, "ru").toLowerCase()} и не только` : `More symbols: ${tr(meta.name, "en").toLowerCase()} and beyond`, style: "chips", items: siblings.map((x) => pageLink(x, locale)) }],
    blocks,
    faq,
    related: [colLink(col, locale), tableLink(locale), hubLink(locale)],
    schemaType: "DefinedTerm",
    jsonLd: [{ "@context": "https://schema.org", "@type": "DefinedTerm", name: `${name} ${invisible ? "" : glyph}`.trim(), alternateName: s.name, termCode: codeText, inDefinedTermSet: "Unicode" }],
    icon: "Asterisk",
    hue: HUE,
  };
}

/* ───────────── collection page ───────────── */

function collectionPage(c: Collection, locale: Locale): PageModel {
  const ru = locale === "ru";
  const meta = colMeta(c.id);
  const h1 = tr(meta.h1, locale);
  const hasGlyphs = /[^\p{L}\p{N}\s:,()—–-]/u.test(h1);
  const sample = sampleOf(c, 5);
  const blocksUsed = [...new Map(c.chars.map((s) => [s.block[2], s])).values()].map((s) => `«${blockName(s, locale)}»`);
  const rows = c.chars.map((s) => [s.ext.d ?? s.ch, nameOf(s, locale), u(s), entity(s) ?? htmlDec(s.ch)]);
  const group = HUB_GROUPS.find((g) => g.ids.includes(c.id))?.ids ?? [];
  const topBlocks: Block[] = [];
  if (c.pages.length) topBlocks.push({ type: "links", title: ru ? "Подробно о символах" : "Symbol pages", style: "chips", items: c.pages.map((p) => pageLink(p, locale)) });
  topBlocks.push({ type: "links", title: ru ? "Другие наборы символов" : "Other symbol collections", style: "chips", items: COLLECTIONS.filter((x) => x !== c).map((x) => ({ ...colLink(x, locale), hint: undefined })) });
  return {
    path: [ID, c.id],
    sectionId: ID,
    kind: "variant",
    title: ru ? `${h1}${hasGlyphs ? "" : ` ${sample}`} — скопировать` : `${h1}${hasGlyphs ? "" : ` ${sample}`} — Copy & Paste`,
    h1,
    description: ru
      ? fit([`${h1}: ${cnt("ru", c.chars.length)}${hasGlyphs ? "" : ` — ${sample} и другие`}.`, [tr(meta.intro, "ru"), "Нажмите на символ, чтобы скопировать его, или откройте страницу с кодами и способами ввода.", "Копирование в один клик."]])
      : fit([`${h1}: ${cnt("en", c.chars.length)}${hasGlyphs ? "" : ` — ${sample} and more`}.`, [tr(meta.intro, "en"), "Click a symbol to copy it, or open its page for codes and typing methods.", "One-click copy."]]),
    lead: ru ? `${tr(meta.intro, "ru")} Нажмите на символ, чтобы скопировать.` : `${tr(meta.intro, "en")} Click a symbol to copy it.`,
    breadcrumbs: crumbs(locale),
    tool: { id: "symbols/grid", props: { base: boardBase(locale), items: c.chars.map((s) => boardItem(s, locale)), kind: "symbol" } },
    topBlocks,
    blocks: [
      {
        type: "text",
        title: ru ? "О наборе" : "About this collection",
        paragraphs: ru
          ? [
              `В наборе ${cnt("ru", c.chars.length)} из ${blocksUsed.length > 1 ? "блоков" : "блока"} Unicode ${blocksUsed.slice(0, 6).join(", ")}${blocksUsed.length > 6 ? " и других" : ""}. Русские названия взяты из Unicode CLDR, а для символов, которых там нет, переведены с официальных названий Unicode.`,
              `Нажимайте на символы: каждый копируется в буфер обмена и добавляется в строку над сеткой. ${c.pages.length ? `У ${c.pages.length} самых востребованных символов есть отдельные страницы с Alt-кодами, HTML-кодами и способами ввода.` : "Коды всех символов собраны в таблице ниже."}`,
            ]
          : [
              `The collection has ${cnt("en", c.chars.length)} from the Unicode ${blocksUsed.length > 1 ? "blocks" : "block"} ${blocksUsed.slice(0, 6).join(", ")}${blocksUsed.length > 6 ? " and more" : ""}. Names are the official Unicode character names.`,
              `Click symbols: each one is copied and appended to the line above the grid. ${c.pages.length ? `The ${c.pages.length} most searched ones have their own pages with Alt codes, HTML codes and typing methods.` : "All codes are listed in the table below."}`,
            ],
      },
      { type: "table", title: ru ? "Таблица символов с кодами" : "Characters and codes", head: ru ? ["Символ", "Название", "Код", "HTML"] : ["Symbol", "Name", "Code", "HTML"], rows },
    ],
    faq: ru
      ? [
          { q: "Как скопировать символ?", a: "Нажмите на символ в сетке — он сразу окажется в буфере обмена и добавится в строку набора. Можно собрать несколько символов и нажать «Копировать всё». Вставляйте сочетанием Ctrl+V (⌘V на Mac)." },
          { q: "Как набрать эти символы на клавиатуре?", a: "В Windows у некоторых символов есть Alt-коды (Alt+0 и три цифры на цифровом блоке). В Word любой символ вводится кодом и сочетанием Alt+X, на Mac — через панель Control+Command+Пробел, в Linux — через Ctrl+Shift+U и код. Способы для каждого символа указаны на его странице." },
          { q: "Почему некоторые символы показываются квадратиками?", a: "В шрифтах вашей системы нет изображения этого символа. На другом устройстве или в другом браузере он может отображаться нормально; при копировании сам символ не теряется." },
        ]
      : [
          { q: "How do I copy a symbol?", a: "Click it in the grid: it goes to the clipboard and into the collected line. You can collect several symbols and press “Copy all”. Paste with Ctrl+V (⌘V on a Mac)." },
          { q: "How do I type these symbols?", a: "Some have Windows Alt codes (Alt+0 plus three digits on the keypad). In Word any character can be entered as a code followed by Alt+X, on a Mac via Control+Command+Space, on Linux via Ctrl+Shift+U and the code. Each symbol page lists the methods." },
          { q: "Why do some symbols show as boxes?", a: "Your system fonts don’t have a picture for that character. It may display fine on another device; copying still keeps the character itself." },
        ],
    related: [...group.filter((id) => id !== c.id).slice(0, 3).map((id) => colLink(collectionById.get(id)!, locale)), tableLink(locale), emojiHubLink(locale)],
    schemaType: "CollectionPage",
    icon: "Asterisk",
    hue: HUE,
    wide: true,
  };
}

/* ───────────── hub and lookup tool ───────────── */

function hubPage(locale: Locale): PageModel {
  const ru = locale === "ru";
  const total = SYMS.size;
  const popular = Array.from(POPULAR_SYMBOLS, (ch) => sym(ch)!).map((s) => boardItem(s, locale));
  return {
    path: [ID],
    sectionId: ID,
    kind: "hub",
    title: ru ? "Специальные символы — скопировать ★ ♥ ✓ → © ° ₽" : "Special Symbols — Copy and Paste ★ ♥ ✓ → © °",
    h1: ru ? "Специальные символы: копировать и вставить" : "Special symbols: copy and paste",
    description: ru
      ? `${cnt("ru", total)} Unicode в ${COLLECTIONS.length} наборах: стрелки, звёзды, сердечки, валюты, математика, невидимые символы. Копирование в один клик и коды.`
      : `${cnt("en", total)} in ${COLLECTIONS.length} collections: arrows, stars, hearts, currency, math and invisible characters. One-click copy with codes.`,
    lead: ru
      ? `${cnt("ru", total)} в ${COLLECTIONS.length} наборах: найдите нужный и скопируйте одним нажатием.`
      : `${cnt("en", total)} in ${COLLECTIONS.length} collections: find one and copy it with a click.`,
    breadcrumbs: [{ name: ui(locale).home, path: [] }],
    tool: { id: "symbols/unicode", props: { mode: "hub", popular } },
    topBlocks: HUB_GROUPS.map((g) => ({
      type: "links" as const,
      title: tr(g.title, locale),
      style: "cards" as const,
      items: g.ids.map((id) => colLink(collectionById.get(id)!, locale)),
    })),
    blocks: [
      {
        type: "text",
        title: ui(locale).about,
        paragraphs: ru
          ? [
              "Здесь собраны специальные символы Unicode, которых нет на клавиатуре: стрелки, звёзды, галочки, знаки валют и единиц измерения, математические и типографские знаки, буквы других алфавитов и невидимые символы.",
              `У ${PAGES.length} самых востребованных символов есть страницы с названием, кодом Unicode, HTML-сущностью, Alt-кодом для Windows, сочетаниями для Mac и Linux и похожими символами.`,
              "Поиск работает по русским и английским названиям, по коду (например, U+00B0 или 00B0) и по самому символу. Любой символ Unicode можно найти в таблице символов Юникода.",
            ]
          : [
              "Unicode special characters you won’t find on the keyboard: arrows, stars, check marks, currency and unit signs, math and typographic marks, letters of other alphabets and invisible characters.",
              `The ${PAGES.length} most searched symbols have pages with the name, Unicode code point, HTML entity, Windows Alt code, Mac and Linux shortcuts and look-alike characters.`,
              "Search works by name, by code (e.g. U+00B0 or 00B0) and by the character itself. Any Unicode character can be found in the Unicode character table.",
            ],
      },
    ],
    howTo: ru
      ? ["Найдите символ поиском или выберите набор ниже.", "Нажмите на символ — он скопируется в буфер обмена.", "Вставьте его сочетанием Ctrl+V (⌘V на Mac) в сообщение, документ или ник."]
      : ["Search for a symbol or open a collection below.", "Click the symbol — it is copied to the clipboard.", "Paste it with Ctrl+V (⌘V on a Mac) into a message, document or nickname."],
    faq: ru
      ? [
          { q: "Как вставить специальный символ без копирования?", a: "В Windows — Alt-кодом (Alt+0 и три цифры на цифровом блоке) или через «Таблицу символов» (charmap). В Word — кодом и Alt+X. На Mac — панелью Control+Command+Пробел. В Linux — Ctrl+Shift+U и шестнадцатеричный код." },
          { q: "Чем символы отличаются от эмодзи?", a: "Символы вроде ★ ♥ → отображаются обычным шрифтом одного цвета с текстом, а эмодзи — цветными картинками. Некоторые символы (♥ ☀ ✔) существуют в обоих вариантах, и устройство может показать их как эмодзи." },
          { q: "Будут ли символы видны у получателя?", a: "Да, если в его системе есть шрифт с этим символом. Популярные символы (стрелки, звёзды, валюты, математика) поддерживаются всеми современными системами; редкие могут отображаться квадратиками." },
        ]
      : [
          { q: "How do I insert a special character without copying?", a: "On Windows use an Alt code (Alt+0 plus three digits on the keypad) or Character Map. In Word type the code and press Alt+X. On a Mac use Control+Command+Space, on Linux Ctrl+Shift+U and the hex code." },
          { q: "How are symbols different from emoji?", a: "Symbols like ★ ♥ → render in the text font and color, while emoji are color pictures. Some characters (♥ ☀ ✔) exist in both forms and a device may show them as emoji." },
          { q: "Will the recipient see the symbol?", a: "Yes, if their system has a font with that character. Common symbols (arrows, stars, currency, math) are supported everywhere; rare ones may show as boxes." },
        ],
    related: [tableLink(locale), emojiHubLink(locale)],
    schemaType: "CollectionPage",
    icon: "Asterisk",
    hue: HUE,
    wide: true,
  };
}

function tablePage(locale: Locale): PageModel {
  const ru = locale === "ru";
  const popular = Array.from(POPULAR_SYMBOLS, (ch) => sym(ch)!).map((s) => boardItem(s, locale));
  return {
    path: [TABLE],
    sectionId: ID,
    kind: "tool",
    title: ru ? "Таблица символов Юникода — поиск по названию и коду" : "Unicode Character Table — Search by Name or Code",
    h1: ru ? "Таблица символов Юникода" : "Unicode character table",
    description: ru
      ? "Поиск символов Unicode по названию, коду U+ или самому символу: около 20 000 символов, блоки Юникода, HTML-коды, UTF-8 и копирование в один клик."
      : "Find Unicode characters by name, U+ code or the character itself: about 20,000 characters, Unicode blocks, HTML codes, UTF-8 and one-click copy.",
    lead: ru
      ? "Введите название, код вроде U+2192 или вставьте символ — таблица покажет его код, HTML-сущность и блок."
      : "Type a name, a code like U+2192 or paste a character — the table shows its code, HTML entity and block.",
    breadcrumbs: crumbs(locale),
    tool: { id: "symbols/unicode", props: { mode: "table", popular } },
    blocks: [
      {
        type: "text",
        title: ui(locale).about,
        paragraphs: ru
          ? [
              "В таблице около 20 000 символов Unicode 16.0: все блоки базовой многоязычной плоскости, кроме иероглифов и корейских слогов, плюс математические, музыкальные и другие символы дополнительной плоскости. Названия — официальные английские имена Unicode, для нескольких тысяч символов есть русские названия.",
              "Поиск понимает коды в любом виде: U+00B0, 0xB0, 00B0, &#176;, &#xB0; и HTML-сущности вроде &deg;. Можно выбрать блок Unicode и просмотреть все его символы.",
              "Список символов загружается один раз при открытии страницы, дальше поиск работает прямо в браузере.",
            ]
          : [
              "The table holds about 20,000 Unicode 16.0 characters: every block of the Basic Multilingual Plane except CJK ideographs and Hangul syllables, plus math, music and other supplementary-plane symbols. Names are the official Unicode character names.",
              "Search understands codes in any form: U+00B0, 0xB0, 00B0, &#176;, &#xB0; and HTML entities like &deg;. You can also pick a Unicode block and browse all of its characters.",
              "The character list is downloaded once when the page opens; after that search runs right in your browser.",
            ],
      },
    ],
    howTo: ru
      ? ["Введите название на русском или английском, код U+ или вставьте символ.", "Нажмите на символ в результатах, чтобы открыть его карточку.", "Скопируйте символ, его HTML-код или код Unicode кнопками в карточке."]
      : ["Type a name, a U+ code or paste a character.", "Click a character in the results to open its card.", "Copy the character, its HTML code or code point with the card buttons."],
    faq: ru
      ? [
          { q: "Что такое кодовая точка Unicode?", a: "Это номер символа в стандарте Unicode, записанный в шестнадцатеричном виде с префиксом U+. Например, знак градуса — U+00B0, стрелка вправо — U+2192, эмодзи 😀 — U+1F600." },
          { q: "Как найти символ, если я не знаю его названия?", a: "Вставьте сам символ в поле поиска — таблица определит его код и название. Можно также выбрать подходящий блок Unicode, например «Стрелки» или «Геометрические фигуры», и просмотреть его целиком." },
          { q: "Чем код HTML отличается от кода Unicode?", a: "Это один и тот же номер в разной записи: U+00B0 в HTML пишут как &#176; (десятичный) или &#xB0; (шестнадцатеричный); у части символов есть и именованная сущность, например &deg;." },
          { q: "Какая версия Unicode используется?", a: "Unicode 16.0 (2024) — названия символов и блоки взяты из официальной базы Unicode Character Database." },
        ]
      : [
          { q: "What is a Unicode code point?", a: "The number of a character in the Unicode standard, written in hex with the U+ prefix. The degree sign is U+00B0, the right arrow U+2192 and 😀 U+1F600." },
          { q: "How do I find a character if I don’t know its name?", a: "Paste the character into the search box — the table identifies its code and name. You can also pick a Unicode block such as Arrows or Geometric Shapes and browse it." },
          { q: "What is the difference between HTML and Unicode codes?", a: "They are the same number in different notation: U+00B0 is &#176; (decimal) or &#xB0; (hex) in HTML; some characters also have a named entity such as &deg;." },
          { q: "Which Unicode version is used?", a: "Unicode 16.0 (2024); names and blocks come from the official Unicode Character Database." },
        ],
    related: [hubLink(locale), ...["arrows", "math", "currency"].map((id) => colLink(collectionById.get(id)!, locale)), emojiHubLink(locale)],
    schemaType: "WebApplication",
    icon: "Search",
    hue: HUE,
    wide: true,
  };
}

/* ───────────── section ───────────── */

/** Pages prerendered at build time: popular symbols first, then pages in collection order. */
function prebuildPages(): SymPage[] {
  const first = Array.from(POPULAR_SYMBOLS, (ch) => pageOf.get(ch)!).filter(Boolean);
  const rest = PAGES.filter((p) => !first.includes(p));
  return [...first, ...rest].slice(0, PREBUILD_PAGES);
}

export const symbolsSection: SectionDef = {
  id: ID,
  name: NAME,
  description: DESC,
  icon: "Asterisk",
  hue: HUE,
  category: "symbols",
  order: 2,
  absolute: true,
  mounts: () => [ID, TABLE],
  hubPath: [ID],
  paths() {
    return [[ID], [TABLE], ...COLLECTIONS.map((c) => [ID, c.id]), ...PAGES.map(pagePath)];
  },
  prebuild() {
    return [[ID], [TABLE], ...COLLECTIONS.map((c) => [ID, c.id]), ...prebuildPages().map(pagePath)];
  },
  resolve(locale, segs) {
    if (segs[0] === TABLE) return segs.length === 1 ? tablePage(locale) : null;
    if (segs[0] !== ID) return null;
    if (segs.length === 1) return hubPage(locale);
    const c = collectionById.get(segs[1]);
    if (!c) return null;
    if (segs.length === 2) return collectionPage(c, locale);
    if (segs.length === 3) {
      const p = pageByKey.get(`${segs[1]}/${segs[2]}`);
      return p ? symbolPage(p, locale) : null;
    }
    return null;
  },
  search(locale) {
    const hint = tr(NAME, locale);
    const out: SearchEntry[] = [
      { path: [ID], title: locale === "ru" ? "Специальные символы — копировать" : "Special symbols — copy and paste", hint: ui(locale).allTools, keywords: "символы спецсимволы значки знаки symbols characters", weight: 3 },
      { path: [TABLE], title: tableLink(locale).label, hint, keywords: "unicode юникод таблица символов character map charmap", weight: 3 },
    ];
    for (const c of COLLECTIONS) out.push({ path: [ID, c.id], title: tr(colMeta(c.id).h1, locale), hint, keywords: `${colMeta(c.id).name.ru} ${colMeta(c.id).name.en}`, glyph: firstVisible(c), weight: 2 });
    for (const p of prebuildPages()) out.push({ path: pagePath(p), title: pageName(p, locale), hint, keywords: `${p.sym.name.toLowerCase()} ${locale === "ru" ? "" : p.sym.ru}`.trim(), glyph: p.sym.ext.d ? undefined : p.sym.ch, weight: 1 });
    return out;
  },
  tools(locale) {
    return [hubLink(locale), tableLink(locale)];
  },
  featured(locale) {
    return [hubLink(locale), tableLink(locale), ...["arrows", "hearts", "currency", "math"].map((id) => colLink(collectionById.get(id)!, locale))];
  },
};
