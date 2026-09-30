import { tr, type Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Block, Crumb, LinkItem, PageModel, QA, SearchEntry, SectionDef } from "@/registry/types";
import {
  byGroup,
  bySlug,
  bySub,
  EMOJI,
  GROUP_KEYS,
  popular,
  SOURCE,
  SUBGROUP_KEYS,
  subgroupGroup,
  subgroupsOf,
  TONES,
  topicBySlug,
  topicEmoji,
  topicsOf,
  type Emoji,
} from "./data";
import { CONTINENTS, GROUPS, HAIR_NAMES, SUBGROUPS, VERSIONS } from "./labels";
import type { BoardItem, BoardSection } from "./shared/GlyphBoard";
import { codePoints, cssEscape, htmlDec, htmlHex, jsEscape, pyEscape, uPlus, urlEncode, utf16, utf8 } from "./shared/codes";
import { ALIASES, TOPICS, type TopicDef } from "./topics";

/*
 * URL scheme (the router allows /section/slug/variant):
 *   /emoji                      hub with search
 *   /emoji/{emoji-slug}         one page per emoji (English CLDR name in kebab-case)
 *   /emoji/group/{group}        the 9 Unicode emoji groups
 *   /emoji/subgroup/{subgroup}  the 98 subgroups (names are unique across groups)
 *   /emoji/topic/{topic}        curated collections
 * "group", "subgroup" and "topic" are reserved and never used as emoji slugs (see gen-emoji.mjs).
 */

const ID = "emoji";
const HUE = 45;
const NAME = { ru: "Эмодзи", en: "Emoji" };
const DESC = {
  ru: "Все эмодзи Unicode 16 с русскими названиями, значениями и кодами: поиск, категории, подборки и копирование в один клик.",
  en: "Every Unicode 16 emoji with names, meanings and codes: search, categories, curated collections and one-click copy.",
};
const PREBUILD_EMOJI = 300;

/* ───────────── text helpers ───────────── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SMALL = new Set(["a", "an", "the", "of", "with", "in", "on", "and", "or", "for", "to", "at", "by", "from"]);
function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}
/** "Red Heart", "Flag of Kazakhstan" / «Красное сердце» */
function nameOf(e: Emoji, locale: Locale): string {
  if (locale === "ru") return cap(e.ru);
  const m = /^flag: (.+)$/.exec(e.en);
  return m ? `Flag of ${m[1]}` : titleCase(e.en);
}
const lower = (e: Emoji, locale: Locale) => (locale === "ru" ? e.ru : e.en);
const fmtVer = (v: number) => (Number.isInteger(v) ? `${v}.0` : String(v));
const n = (locale: Locale, x: number) => formatNumber(locale, x);
const EMOJI_FORMS = { ru: ["эмодзи", "эмодзи", "эмодзи"], en: ["emoji", "emoji"] };
const cnt = (locale: Locale, x: number) => `${n(locale, x)} ${plural(locale, x, EMOJI_FORMS[locale])}`;
const sample = (list: Emoji[], k = 4) => list.slice(0, k).map((e) => e.glyph).join(" ");

function version(e: Emoji) {
  const [uni, year] = VERSIONS[String(e.version)] ?? ["", 0];
  return { ver: fmtVer(e.version), uni, year, retro: e.version < 1 };
}

const groupName = (g: string, locale: Locale) => tr(GROUPS[g].name, locale);
const subName = (s: string, locale: Locale) => tr(SUBGROUPS[s] ?? { ru: s, en: s }, locale);

/* ───────────── links ───────────── */

const emojiPath = (e: Emoji) => [ID, e.slug];
const groupPath = (g: string) => [ID, "group", g];
const subPath = (s: string) => [ID, "subgroup", s];
const topicPath = (t: string) => [ID, "topic", t];

const emojiLink = (e: Emoji, locale: Locale): LinkItem => ({ path: emojiPath(e), label: nameOf(e, locale), glyph: e.glyph });
function groupLink(g: string, locale: Locale): LinkItem {
  const list = byGroup.get(g) ?? [];
  return { path: groupPath(g), label: groupName(g, locale), hint: `${cnt(locale, list.length)}: ${sample(list, 6)}`, glyph: GROUPS[g].glyph };
}
function subLink(s: string, locale: Locale): LinkItem {
  const list = bySub.get(s) ?? [];
  return { path: subPath(s), label: subName(s, locale), hint: cnt(locale, list.length), glyph: list[0]?.glyph };
}
function topicLink(t: TopicDef, locale: Locale): LinkItem {
  const list = topicEmoji(t);
  return { path: topicPath(t.slug), label: tr(t.name, locale), hint: cnt(locale, list.length), glyph: list[0]?.glyph };
}
function allTopicChips(locale: Locale, exclude?: string): LinkItem[] {
  const out: LinkItem[] = TOPICS.filter((t) => t.slug !== exclude).map((t) => topicLink(t, locale));
  for (const a of ALIASES) {
    const [kind, key] = a.to;
    const list = kind === "group" ? byGroup.get(key) : bySub.get(key);
    out.push({ path: kind === "group" ? groupPath(key) : subPath(key), label: tr(a.name, locale), hint: cnt(locale, list?.length ?? 0), glyph: list?.[0]?.glyph });
  }
  return out;
}
const sectionLinks = (locale: Locale): LinkItem[] => [
  {
    path: ["symbols"],
    label: locale === "ru" ? "Специальные символы" : "Special symbols",
    hint: locale === "ru" ? "Стрелки, звёзды, сердечки, валюты и математические знаки" : "Arrows, stars, hearts, currency and math signs",
    icon: "Asterisk",
    hue: 265,
  },
  {
    path: ["kaomoji"],
    label: locale === "ru" ? "Каомодзи" : "Kaomoji",
    hint: locale === "ru" ? "Японские текстовые смайлики вроде (＾▽＾)" : "Japanese text faces like (＾▽＾)",
    icon: "Smile",
    hue: 330,
  },
];

const board = (list: Emoji[], locale: Locale): BoardItem[] => list.map((e) => [e.glyph, e.slug, nameOf(e, locale)]);

function crumbs(locale: Locale, ...extra: Crumb[]): Crumb[] {
  return [{ name: ui(locale).home, path: [] }, { name: tr(NAME, locale), path: [ID] }, ...extra];
}

/* ───────────── emoji page ───────────── */

const toneShort = (locale: Locale, i: number) => TONES[locale][i].replace(locale === "ru" ? / тон кожи$/ : / skin tone$/, "");
function toneLabel(tone: string, locale: Locale): string {
  const parts = tone.split("-").map((x) => Number(x) - 1);
  return parts.length === 1 ? TONES[locale][parts[0]] : parts.map((i) => toneShort(locale, i)).join(" + ");
}

function structureText(e: Emoji, locale: Locale): string[] {
  const ru = locale === "ru";
  const out: string[] = [];
  const cps = codePoints(e.glyph);
  if (e.ext.cc) {
    const letters = [...e.ext.cc].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join(" ");
    out.push(
      ru
        ? `Флаг состоит из двух региональных индикаторов — ${letters}, то есть букв кода страны ${e.ext.cc} по стандарту ISO 3166-1. В Windows такие флаги по умолчанию показываются буквами ${e.ext.cc}, а не рисунком.`
        : `The flag is made of two regional indicator symbols — ${letters}, the letters of the ISO 3166-1 country code ${e.ext.cc}. Windows shows such flags as the letters ${e.ext.cc} by default instead of a picture.`,
    );
  } else if (cps.some((c) => c >= 0xe0020 && c <= 0xe007f)) {
    const tag = cps.filter((c) => c >= 0xe0061 && c <= 0xe007a).map((c) => String.fromCharCode(c - 0xe0000)).join("");
    out.push(
      ru
        ? `Флаг закодирован чёрным флагом 🏴 и невидимыми тегами Unicode с кодом региона «${tag}» (ISO 3166-2). Такие флаги поддерживают не все платформы.`
        : `The flag is encoded as a black flag 🏴 followed by invisible Unicode tag characters spelling the region code “${tag}” (ISO 3166-2). Not every platform supports such flags.`,
    );
  } else if (cps.includes(0x200d)) {
    const parts = e.glyph.split("‍").filter((p) => p && p !== "️");
    out.push(
      ru
        ? `Это ZWJ-последовательность: эмодзи ${parts.join(" + ")} соединены невидимым символом U+200D (соединитель нулевой ширины). Если система не знает такого сочетания, она покажет составные части по отдельности.`
        : `This is a ZWJ sequence: ${parts.join(" + ")} joined by the invisible U+200D zero width joiner. Systems that don’t know the combination show the parts separately.`,
    );
  } else if (cps.includes(0x20e3)) {
    const base = String.fromCodePoint(cps[0]);
    out.push(
      ru
        ? `Эмодзи-клавиша собирается из обычного символа «${base}», селектора варианта U+FE0F и комбинируемого знака клавиши U+20E3.`
        : `The keycap is built from the plain character “${base}”, the variation selector U+FE0F and the combining enclosing keycap U+20E3.`,
    );
  } else if (e.ext.t && cps.includes(0xfe0f)) {
    const base = String.fromCodePoint(cps[0]);
    out.push(
      ru
        ? `Сам по себе символ ${base} (${uPlus(base)}) часто отображается как чёрно-белый значок. Цветным эмодзи его делает невидимый селектор варианта U+FE0F — при копировании с этой страницы он уже добавлен.`
        : `On its own, ${base} (${uPlus(base)}) often renders as a black-and-white symbol. The invisible variation selector U+FE0F turns it into a color emoji — it is included when you copy from this page.`,
    );
  }
  const sk = e.ext.sk;
  if (sk?.length) {
    const pairs = sk.some((s) => s[1].includes("-"));
    out.push(
      ru
        ? pairs
          ? `Поддерживает ${sk.length} ${plural("ru", sk.length, ["комбинацию", "комбинации", "комбинаций"])} оттенков кожи для двух людей (модификаторы U+1F3FB–U+1F3FF).`
          : `Поддерживает ${sk.length} ${plural("ru", sk.length, ["оттенок", "оттенка", "оттенков"])} кожи (модификаторы U+1F3FB–U+1F3FF): ${sk.map((s) => s[0]).join(" ")}.`
        : pairs
          ? `Supports ${sk.length} skin tone combinations for the two people (modifiers U+1F3FB–U+1F3FF).`
          : `Supports ${sk.length} skin tones (modifiers U+1F3FB–U+1F3FF): ${sk.map((s) => s[0]).join(" ")}.`,
    );
  }
  if (e.ext.hair?.length) {
    out.push(
      ru
        ? `Есть варианты с причёской: ${e.ext.hair.map((h) => `${h[0]} ${tr(HAIR_NAMES[h[1]], "ru")}`).join(", ")} — они показаны на этой странице.`
        : `Hair style variants: ${e.ext.hair.map((h) => `${h[0]} ${tr(HAIR_NAMES[h[1]], "en")}`).join(", ")} — all shown on this page.`,
    );
  }
  if (e.ext.emo?.length) {
    out.push(ru ? `Соответствующий текстовый смайлик (эмотикон): ${e.ext.emo.join("  ")}.` : `Matching text emoticon: ${e.ext.emo.join("  ")}.`);
  }
  return out;
}

function emojiPage(e: Emoji, locale: Locale): PageModel {
  const ru = locale === "ru";
  const title = nameOf(e, locale);
  const g = e.group;
  const s = e.sub;
  const { ver, uni, year, retro } = version(e);
  const code = uPlus(e.glyph);
  const [gh, slack] = e.ext.sc ?? [[], []];
  const shortcode = gh[0] ?? slack[0];
  const kw = ru ? e.kwRu : e.kwEn;
  const topics = topicsOf(e);

  const meaning: string[] = [
    ru
      ? `«${title}» ${e.glyph} — эмодзи из категории «${groupName(g, "ru")}», раздел «${subName(s, "ru")}». Английское название по Unicode CLDR — «${e.en}»${e.ext.ruAlt ? `, русское название в CLDR — «${e.ext.ruAlt}»` : ""}.`
      : `${e.glyph} ${title} is an emoji from the “${groupName(g, "en")}” category, “${subName(s, "en")}” subgroup. Its Russian CLDR name is «${e.ru}».`,
  ];
  if (kw.length)
    meaning.push(
      ru
        ? `Ключевые слова Unicode CLDR, по которым его находят в поиске эмодзи на клавиатурах: ${kw.join(", ")}.`
        : `Unicode CLDR keywords used to find it in emoji keyboards: ${kw.join(", ")}.`,
    );
  meaning.push(
    ru
      ? `Входит в стандарт с ${year} года (Emoji ${ver}${retro ? `, Unicode ${uni}` : ""}).${e.version >= 15 ? " Это одно из новых эмодзи: на устройствах со старыми версиями iOS, Android или Windows вместо него может отображаться пустой квадрат." : ""}`
      : `Part of the standard since ${year} (Emoji ${ver}${retro ? `, Unicode ${uni}` : ""}).${e.version >= 15 ? " It is one of the newer emoji: devices with older iOS, Android or Windows versions may show an empty box instead." : ""}`,
  );
  meaning.push(...structureText(e, locale));

  const facts: [string, string][] = [
    [ru ? "Эмодзи" : "Emoji", e.glyph],
    [ru ? "Название" : "Name", ru ? cap(e.ru) : e.en],
  ];
  if (ru && e.ext.ruAlt) facts.push(["Название в CLDR", e.ext.ruAlt]);
  facts.push([ru ? "Английское название" : "Russian name", ru ? e.en : e.ru]);
  facts.push([ru ? "Категория" : "Category", `${groupName(g, locale)} → ${subName(s, locale)}`]);
  facts.push([ru ? "Код Unicode" : "Unicode", code]);
  facts.push([ru ? "Версия" : "Version", `Emoji ${ver} (${year})`]);
  if (gh.length || slack.length) {
    const sc = [gh.length ? `GitHub ${gh.map((x) => `:${x}:`).join(" ")}` : "", slack.length ? `Slack ${slack.map((x) => `:${x}:`).join(" ")}` : ""].filter(Boolean);
    facts.push([ru ? "Шорткоды" : "Shortcodes", sc.join(" · ")]);
  }
  if (e.ext.emo?.length) facts.push([ru ? "Эмотикон" : "Emoticon", e.ext.emo.join("  ")]);
  if (e.ext.sk?.length) facts.push([ru ? "Оттенки кожи" : "Skin tones", ru ? `есть, ${e.ext.sk.length}` : `yes, ${e.ext.sk.length}`]);

  const codes: string[][] = [
    ["Unicode", code],
    ["HTML", htmlHex(e.glyph)],
    [ru ? "HTML (десятичный)" : "HTML (decimal)", htmlDec(e.glyph)],
    ["CSS", cssEscape(e.glyph)],
    ["JavaScript", jsEscape(e.glyph)],
    ["Python", pyEscape(e.glyph)],
    ["UTF-8", utf8(e.glyph)],
    ["UTF-16", utf16(e.glyph)],
    ["URL", urlEncode(e.glyph)],
  ];

  const blocks: Block[] = [
    { type: "text", title: ru ? `Что означает эмодзи ${e.glyph}` : `What ${e.glyph} means`, paragraphs: meaning },
    { type: "facts", title: ru ? "Коротко" : "Quick facts", rows: facts },
    { type: "table", title: ru ? `Коды ${e.glyph} для HTML, CSS и программ` : `${e.glyph} codes for HTML, CSS and code`, head: ru ? ["Формат", "Код"] : ["Format", "Code"], rows: codes, mono: true },
  ];
  if (e.ext.sk?.length)
    blocks.push({
      type: "table",
      title: ru ? `${e.glyph} с разными оттенками кожи` : `${e.glyph} in all skin tones`,
      head: ru ? ["Эмодзи", "Оттенок кожи", "Код"] : ["Emoji", "Skin tone", "Code"],
      rows: e.ext.sk.map(([gl, tone]) => [gl, toneLabel(tone, locale), uPlus(gl)]),
    });
  if (e.ext.hair?.length)
    blocks.push({
      type: "table",
      title: ru ? "Варианты с причёской" : "Hair style variants",
      head: ru ? ["Эмодзи", "Название", "Код"] : ["Emoji", "Name", "Code"],
      rows: e.ext.hair.map((h) => [h[0], ru ? cap(h[3]) : h[2], uPlus(h[0])]),
    });
  if (topics.length) blocks.push({ type: "links", title: ru ? `Подборки с ${e.glyph}` : `Collections with ${e.glyph}`, style: "chips", items: topics.map((t) => topicLink(t, locale)) });

  // 30–50 related emoji: the same subgroup first, then neighbours from the same group.
  const sameSub = (bySub.get(s) ?? []).filter((x) => x !== e);
  const groupList = byGroup.get(g) ?? [];
  const at = groupList.indexOf(e);
  const near = groupList
    .map((x, i) => ({ x, d: Math.abs(i - at) }))
    .filter(({ x }) => x !== e && x.sub !== s)
    .sort((a, b) => a.d - b.d)
    .map(({ x }) => x);
  const related = [...sameSub, ...near].slice(0, Math.max(30, Math.min(50, sameSub.length)));

  const variants: { title: string; items: [string, string][] }[] = [];
  if (e.ext.sk?.length)
    variants.push({
      title: ru ? "Оттенок кожи" : "Skin tone",
      items: [[e.glyph, ru ? "стандартный жёлтый" : "default yellow"], ...e.ext.sk.map(([gl, tone]) => [gl, toneLabel(tone, locale)] as [string, string])],
    });
  if (e.ext.hair?.length) {
    variants.push({ title: ru ? "Причёска" : "Hair", items: e.ext.hair.map((h) => [h[0], tr(HAIR_NAMES[h[1]], locale)] as [string, string]) });
    const withSkin = e.ext.hair.flatMap((h) => h[4].map((gl, i) => [gl, `${tr(HAIR_NAMES[h[1]], locale)}, ${toneShort(locale, i)}`] as [string, string]));
    if (withSkin.length) variants.push({ title: ru ? "Причёска и оттенок кожи" : "Hair and skin tone", items: withSkin });
  }

  const faq: QA[] = ru
    ? [
        {
          q: `Что означает эмодзи ${e.glyph}?`,
          a: `${e.glyph} — «${e.ru}», эмодзи из раздела «${subName(s, "ru")}» категории «${groupName(g, "ru")}».${kw.length ? ` В Unicode CLDR с ним связаны слова: ${kw.slice(0, 6).join(", ")}.` : ""}`,
        },
        {
          q: `Как скопировать ${e.glyph}?`,
          a: "Нажмите кнопку «Копировать» — символ окажется в буфере обмена. Затем вставьте его в сообщение: Ctrl+V на компьютере, ⌘V на Mac или долгое нажатие и «Вставить» на телефоне.",
        },
        { q: `Какой код у эмодзи ${e.glyph}?`, a: `${code}. В HTML его записывают как ${htmlHex(e.glyph)}, в CSS — ${cssEscape(e.glyph)}, в JavaScript — "${jsEscape(e.glyph)}".` },
        {
          q: `В какой версии Unicode появился ${e.glyph}?`,
          a: `${e.glyph} входит в набор Emoji ${ver}, выпущенный в ${year} году${retro ? ` вместе с Unicode ${uni}` : ""}.`,
        },
      ]
    : [
        {
          q: `What does the ${e.glyph} emoji mean?`,
          a: `${e.glyph} is “${e.en}”, an emoji from the “${subName(s, "en")}” subgroup of “${groupName(g, "en")}”.${kw.length ? ` Its Unicode CLDR keywords are: ${kw.slice(0, 6).join(", ")}.` : ""}`,
        },
        { q: `How do I copy ${e.glyph}?`, a: "Press the Copy button — the emoji goes to your clipboard. Then paste it with Ctrl+V on a computer, ⌘V on a Mac, or long-press and Paste on a phone." },
        { q: `What is the code of ${e.glyph}?`, a: `${code}. In HTML write ${htmlHex(e.glyph)}, in CSS ${cssEscape(e.glyph)}, in JavaScript "${jsEscape(e.glyph)}".` },
        { q: `When was ${e.glyph} added to Unicode?`, a: `${e.glyph} is part of Emoji ${ver}, released in ${year}${retro ? ` together with Unicode ${uni}` : ""}.` },
      ];
  if (e.ext.sk?.length)
    faq.push(
      ru
        ? { q: `Как изменить цвет кожи у ${e.glyph}?`, a: `Выберите оттенок в карточке эмодзи и нажмите «Копировать» — скопируется вариант с модификатором оттенка кожи. Всего вариантов: ${e.ext.sk.length}.` }
        : { q: `How do I change the skin tone of ${e.glyph}?`, a: `Pick a tone in the emoji card and press Copy — the variant with the skin tone modifier is copied. There are ${e.ext.sk.length} variants.` },
    );

  const shortTitle = ru ? `${e.glyph} ${title} — эмодзи: значение, копировать` : `${e.glyph} ${title} Emoji — Meaning & Copy`;
  return {
    path: emojiPath(e),
    sectionId: ID,
    kind: "entity",
    title: shortTitle,
    h1: ru ? `Эмодзи ${e.glyph} «${title}»` : `${e.glyph} ${title} emoji`,
    description: ru
      ? `Эмодзи ${e.glyph} «${e.ru}»: значение, код ${code}${shortcode ? `, шорткод :${shortcode}:` : ""}. В стандарте с ${year} года (Emoji ${ver}). Скопируйте ${e.glyph} в один клик.`
      : `${e.glyph} ${title} emoji: meaning, Unicode ${code}${shortcode ? `, shortcode :${shortcode}:` : ""}, part of Emoji ${ver} (${year}). Copy and paste ${e.glyph} in one click, get HTML and CSS codes.`,
    lead: ru
      ? `${e.glyph} — эмодзи «${e.ru}» из раздела «${subName(s, "ru")}». Нажмите «Копировать», чтобы вставить его в сообщение.`
      : `${e.glyph} is the “${lower(e, locale)}” emoji from “${subName(s, "en")}”. Press Copy to paste it into a message.`,
    breadcrumbs: crumbs(locale, { name: groupName(g, locale), path: groupPath(g) }, { name: subName(s, locale), path: subPath(s) }),
    tool: { id: "emoji/card", props: { glyph: e.glyph, name: title, variants: variants.length ? variants : undefined } },
    topBlocks: [{ type: "links", title: ru ? `Похожие эмодзи: ${subName(s, "ru").toLowerCase()}` : `More emoji: ${subName(s, "en").toLowerCase()}`, style: "chips", items: related.map((x) => emojiLink(x, locale)) }],
    blocks,
    faq,
    related: [subLink(s, locale), groupLink(g, locale), ...topics.slice(0, 2).map((t) => topicLink(t, locale)), ...sectionLinks(locale)].slice(0, 6),
    schemaType: "DefinedTerm",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        name: `${e.glyph} ${ru ? cap(e.ru) : e.en}`,
        alternateName: ru ? e.en : e.ru,
        termCode: code,
        inDefinedTermSet: "Unicode Emoji",
      },
    ],
    icon: "Smile",
    hue: HUE,
  };
}

/* ───────────── collection pages ───────────── */

function listTable(list: Emoji[], locale: Locale): Block {
  const ru = locale === "ru";
  return {
    type: "table",
    title: ru ? "Названия и коды" : "Names and codes",
    head: ru ? ["Эмодзи", "Название", "Код"] : ["Emoji", "Name", "Code"],
    rows: list.map((e) => [e.glyph, ru ? cap(e.ru) : e.en, uPlus(e.glyph)]),
  };
}

function copyFaq(locale: Locale): QA {
  return locale === "ru"
    ? {
        q: "Как скопировать сразу несколько эмодзи?",
        a: "Нажимайте на эмодзи по очереди: каждый копируется в буфер обмена и добавляется в строку над сеткой. Когда набор готов, нажмите «Копировать всё». Чтобы открывать страницы эмодзи вместо копирования, переключите режим на «Открывать страницу».",
      }
    : {
        q: "How do I copy several emoji at once?",
        a: "Click emoji one after another: each one is copied and appended to the line above the grid. When you are done, press “Copy all”. Switch the mode to “Open page” to open emoji pages instead of copying.",
      };
}

function groupPage(g: string, locale: Locale): PageModel {
  const ru = locale === "ru";
  const list = byGroup.get(g)!;
  const subs = subgroupsOf(g);
  const name = groupName(g, locale);
  const sections: BoardSection[] = subs.map((s) => [subName(s, locale), bySub.get(s)!.length, `/${locale}/${subPath(s).join("/")}`]);
  const items = subs.flatMap((s) => board(bySub.get(s)!, locale));
  const subList = subs.map((s) => subName(s, locale).toLowerCase());
  const overlap = TOPICS.map((t) => ({ t, k: topicEmoji(t).filter((e) => e.group === g).length }))
    .filter((x) => x.k >= 5)
    .sort((a, b) => b.k - a.k)
    .slice(0, 4)
    .map((x) => topicLink(x.t, locale));
  return {
    path: groupPath(g),
    sectionId: ID,
    kind: "variant",
    title: ru ? `${name}: эмодзи ${sample(list, 3)} — копировать` : `${name} Emoji ${sample(list, 3)} — Copy & Paste`,
    h1: ru ? `Эмодзи: ${name.toLowerCase()}` : `${name} emoji`,
    description: ru
      ? `Все эмодзи категории «${name}»: ${cnt("ru", list.length)} в ${n("ru", subs.length)} ${plural("ru", subs.length, ["подкатегории", "подкатегориях", "подкатегориях"])} — ${subList.slice(0, 3).join(", ")} и другие. Нажмите, чтобы скопировать.`
      : `All ${name} emoji: ${list.length} emoji in ${subs.length} subgroups — ${subList.slice(0, 3).join(", ")} and more. Click any emoji to copy it, open it for meaning and codes.`,
    lead: ru
      ? `${cnt("ru", list.length)} в ${n("ru", subs.length)} ${plural("ru", subs.length, ["подкатегории", "подкатегориях", "подкатегориях"])}: нажмите на эмодзи, чтобы скопировать его.`
      : `${cnt("en", list.length)} in ${subs.length} subgroups: click an emoji to copy it.`,
    breadcrumbs: crumbs(locale),
    tool: { id: "emoji/grid", props: { base: `/${locale}/${ID}/`, items, sections } },
    topBlocks: [
      { type: "links", title: ru ? "Подкатегории" : "Subgroups", style: "chips", items: subs.map((s) => subLink(s, locale)) },
      { type: "links", title: ru ? "Другие категории эмодзи" : "Other emoji categories", style: "chips", items: GROUP_KEYS.filter((x) => x !== g).map((x) => groupLink(x, locale)) },
    ],
    blocks: [
      {
        type: "text",
        title: ru ? "О категории" : "About this category",
        paragraphs: ru
          ? [
              `В категории «${name}» ${cnt("ru", list.length)}, они разделены на ${n("ru", subs.length)} ${plural("ru", subs.length, ["подкатегорию", "подкатегории", "подкатегорий"])}: ${subList.join(", ")}.`,
              `Состав и порядок — как в стандарте Unicode Emoji 16.0, названия — из Unicode CLDR. Варианты с оттенками кожи и причёсками показаны на странице основного эмодзи.`,
            ]
          : [
              `The “${name}” category has ${list.length} emoji in ${subs.length} subgroups: ${subList.join(", ")}.`,
              `Contents and order follow Unicode Emoji 16.0, names come from Unicode CLDR. Skin tone and hair style variants are listed on the page of the base emoji.`,
            ],
      },
    ],
    faq: [
      ru
        ? { q: `Сколько эмодзи в категории «${name}»?`, a: `${cap(cnt("ru", list.length))} без учёта вариантов с оттенками кожи; подкатегорий — ${n("ru", subs.length)}.` }
        : { q: `How many ${name} emoji are there?`, a: `${list.length} emoji, not counting skin tone variants, in ${subs.length} subgroups.` },
      copyFaq(locale),
    ],
    related: [...overlap, ...sectionLinks(locale)].slice(0, 6),
    schemaType: "CollectionPage",
    icon: "Smile",
    hue: HUE,
    wide: true,
  };
}

function subPage(s: string, locale: Locale): PageModel {
  const ru = locale === "ru";
  const list = bySub.get(s)!;
  const g = subgroupGroup.get(s)!;
  const name = subName(s, locale);
  const siblings = subgroupsOf(g).filter((x) => x !== s);
  const others = SUBGROUP_KEYS.filter((x) => subgroupGroup.get(x) !== g && (bySub.get(x)?.length ?? 0) > 0);
  const chips = [...siblings, ...others].slice(0, 40).map((x) => subLink(x, locale));
  const names = list.slice(0, 8).map((e) => lower(e, locale));
  return {
    path: subPath(s),
    sectionId: ID,
    kind: "variant",
    title: ru ? `${name} — эмодзи ${sample(list, 4)}, копировать` : `${name} Emoji ${sample(list, 4)} — Copy & Paste`,
    h1: ru ? `Эмодзи: ${name.toLowerCase()}` : `${name} emoji`,
    description: ru
      ? `${name}: ${cnt("ru", list.length)} из категории «${groupName(g, "ru")}» — ${names.slice(0, 4).join(", ")} и другие. Названия, коды Unicode и копирование в один клик.`
      : `${name}: ${list.length} emoji from “${groupName(g, "en")}” — ${names.slice(0, 4).join(", ")} and more. Names, Unicode codes and one-click copy.`,
    lead: ru
      ? `${cnt("ru", list.length)} в разделе «${name}»: нажмите на эмодзи, чтобы скопировать его.`
      : `${cnt("en", list.length)} in “${name}”: click an emoji to copy it.`,
    breadcrumbs: crumbs(locale, { name: groupName(g, locale), path: groupPath(g) }),
    tool: { id: "emoji/grid", props: { base: `/${locale}/${ID}/`, items: board(list, locale) } },
    topBlocks: [{ type: "links", title: ru ? "Другие подкатегории" : "Other subgroups", style: "chips", items: chips }],
    blocks: [
      {
        type: "text",
        title: ru ? "О разделе" : "About this subgroup",
        paragraphs: ru
          ? [
              `Раздел «${name}» входит в категорию «${groupName(g, "ru")}» и содержит ${cnt("ru", list.length)}: ${names.join(", ")}${list.length > names.length ? " и другие" : ""}.`,
              "Нажмите на эмодзи, чтобы скопировать его, или переключите режим и откройте страницу со значением, кодами и шорткодами.",
            ]
          : [
              `The “${name}” subgroup belongs to “${groupName(g, "en")}” and contains ${cnt("en", list.length)}: ${names.join(", ")}${list.length > names.length ? " and more" : ""}.`,
              "Click an emoji to copy it, or switch the mode to open its page with the meaning, codes and shortcodes.",
            ],
      },
      listTable(list, locale),
    ],
    faq: [
      ru
        ? { q: `Сколько эмодзи в разделе «${name}»?`, a: `${cap(cnt("ru", list.length))}: ${list.map((e) => e.glyph).join(" ")}.` }
        : { q: `How many ${name.toLowerCase()} emoji are there?`, a: `${list.length}: ${list.map((e) => e.glyph).join(" ")}.` },
      copyFaq(locale),
    ],
    related: [groupLink(g, locale), ...sectionLinks(locale)],
    schemaType: "CollectionPage",
    icon: "Smile",
    hue: HUE,
    wide: true,
  };
}

function topicPage(t: TopicDef, locale: Locale): PageModel {
  const ru = locale === "ru";
  const list = topicEmoji(t);
  const h1 = tr(t.h1, locale);
  const region = t.region ? CONTINENTS[t.region] : null;
  return {
    path: topicPath(t.slug),
    sectionId: ID,
    kind: "variant",
    title: ru ? `${h1} — скопировать ${sample(list, 4)}` : `${h1.charAt(0).toUpperCase() + h1.slice(1)} — Copy & Paste ${sample(list, 4)}`,
    h1,
    description: ru
      ? `${h1}: ${cnt("ru", list.length)} — ${sample(list, 8)} и другие. ${t.intro.ru}`
      : `${h1.charAt(0).toUpperCase() + h1.slice(1)}: ${list.length} emoji — ${sample(list, 8)} and more. ${t.intro.en}`,
    lead: ru ? `${t.intro.ru} Нажмите на эмодзи, чтобы скопировать.` : `${t.intro.en} Click an emoji to copy it.`,
    breadcrumbs: crumbs(locale),
    tool: { id: "emoji/grid", props: { base: `/${locale}/${ID}/`, items: board(list, locale) } },
    topBlocks: [{ type: "links", title: ru ? "Другие подборки эмодзи" : "More emoji collections", style: "chips", items: allTopicChips(locale, t.slug) }],
    blocks: [
      {
        type: "text",
        title: ru ? "О подборке" : "About this collection",
        paragraphs: ru
          ? [
              `В подборке ${cnt("ru", list.length)}. ${region ? `Флаги отобраны по классификации регионов ООН (M49) из данных Unicode CLDR: регион «${region.ru}».` : "Подборка составлена вручную по ключевым словам Unicode CLDR и разделам стандарта Emoji 16.0."}`,
              "Нажимайте на эмодзи — они копируются в буфер обмена и собираются в строку над сеткой. Страница каждого эмодзи с названием, кодами и вариантами открывается в режиме «Открывать страницу».",
            ]
          : [
              `The collection has ${cnt("en", list.length)}. ${region ? `Flags are grouped by the UN M49 regions from Unicode CLDR data: ${region.en}.` : "It is curated by hand from Unicode CLDR keywords and Emoji 16.0 subgroups."}`,
              "Click emoji to copy them and collect them in the line above the grid. Switch to “Open page” to open an emoji’s page with its name, codes and variants.",
            ],
      },
      listTable(list, locale),
    ],
    faq: [
      ru
        ? { q: `Какие эмодзи входят в подборку «${tr(t.name, "ru")}»?`, a: `${cap(cnt("ru", list.length))}: ${list.map((e) => e.glyph).join(" ")}.` }
        : { q: `Which emoji are in “${tr(t.name, "en")}”?`, a: `${list.length} emoji: ${list.map((e) => e.glyph).join(" ")}.` },
      copyFaq(locale),
    ],
    related: [...new Set(list.map((e) => e.sub))]
      .slice(0, 4)
      .map((s) => subLink(s, locale))
      .concat(sectionLinks(locale))
      .slice(0, 6),
    schemaType: "CollectionPage",
    icon: "Smile",
    hue: HUE,
    wide: true,
  };
}

function hubPage(locale: Locale): PageModel {
  const ru = locale === "ru";
  const pop = popular(96);
  return {
    path: [ID],
    sectionId: ID,
    kind: "hub",
    title: ru ? "Эмодзи — все смайлики с названиями и кодами, копировать" : "Emoji List — Copy & Paste Every Emoji with Meanings",
    h1: ru ? "Эмодзи: скопировать и вставить" : "Emoji: copy and paste",
    description: ru
      ? `Все ${n("ru", EMOJI.length)} эмодзи Unicode 16 с русскими названиями, значениями и кодами: поиск, ${GROUP_KEYS.length} категорий, подборки и копирование в один клик.`
      : `All ${n("en", EMOJI.length)} Unicode 16 emoji with names, meanings and codes: search, ${GROUP_KEYS.length} categories, curated collections and one-click copy.`,
    lead: ru
      ? `${cnt("ru", EMOJI.length)} с названиями из Unicode CLDR — найдите нужный и скопируйте одним нажатием.`
      : `${cnt("en", EMOJI.length)} with official Unicode CLDR names — find one and copy it with a single click.`,
    breadcrumbs: [{ name: ui(locale).home, path: [] }],
    tool: {
      id: "emoji/search",
      props: { popular: board(pop, locale), groups: GROUP_KEYS.map((g) => [g, groupName(g, locale)]) },
    },
    topBlocks: [
      { type: "links", title: ru ? "Категории эмодзи" : "Emoji categories", style: "cards", items: GROUP_KEYS.map((g) => groupLink(g, locale)) },
      { type: "links", title: ru ? "Подборки" : "Collections", style: "chips", items: allTopicChips(locale) },
    ],
    blocks: [
      {
        type: "text",
        title: ui(locale).about,
        paragraphs: ru
          ? [
              `Здесь собраны все эмодзи стандарта Unicode Emoji 16.0 — ${cnt("ru", EMOJI.length)} без учёта вариантов с оттенками кожи. Русские и английские названия и ключевые слова взяты из Unicode CLDR — тех же данных, что используют клавиатуры iOS и Android.`,
              "На странице каждого эмодзи — значение, коды для HTML, CSS, JavaScript и Python, шорткоды GitHub и Slack, версия стандарта и все варианты оттенков кожи.",
              "Поиск работает по русским и английским названиям, ключевым словам и шорткодам вроде :heart:. Список загружается один раз и дальше работает без обращения к серверу.",
            ]
          : [
              `This is every emoji in Unicode Emoji 16.0 — ${cnt("en", EMOJI.length)}, not counting skin tone variants. Names and keywords come from Unicode CLDR, the same data iOS and Android keyboards use.`,
              "Each emoji page lists the meaning, HTML, CSS, JavaScript and Python codes, GitHub and Slack shortcodes, the Unicode version and all skin tone variants.",
              "Search works on names, keywords and shortcodes like :heart:. The list is downloaded once and then searched right in your browser.",
            ],
      },
    ],
    howTo: ru
      ? ["Введите слово в поиск — например, «сердце» или «кот» — или выберите категорию.", "Нажмите на эмодзи: он скопируется и добавится в строку набора.", "Нажмите «Копировать всё» и вставьте набор в сообщение или пост."]
      : ["Type a word such as “heart” or “cat”, or pick a category.", "Click an emoji: it is copied and added to the collected line.", "Press “Copy all” and paste the set into a message or post."],
    faq: ru
      ? [
          { q: "Сколько всего эмодзи?", a: `В стандарте Unicode Emoji 16.0 — ${cnt("ru", EMOJI.length)}, если не считать варианты с оттенками кожи и причёсками. С ними получается больше 3700 последовательностей.` },
          { q: "Почему некоторые эмодзи отображаются квадратиками?", a: "Так выглядят эмодзи, которых ещё нет в шрифте вашей системы. Новые эмодзи (Emoji 15–16) появляются в обновлениях iOS, Android и Windows с задержкой; на других устройствах они уже могут отображаться нормально." },
          { q: "Эмодзи и смайлик — это одно и то же?", a: "Смайликами обычно называют текстовые рожицы вроде :) и эмодзи-лица. Эмодзи — это более широкий набор: в него входят лица, люди, животные, еда, предметы, символы и флаги." },
          { q: "Откуда взяты русские названия?", a: `Из Unicode CLDR (${SOURCE.split(", ")[1]}) — официальной базы переводов, которую используют Apple, Google и Microsoft.` },
        ]
      : [
          { q: "How many emoji are there?", a: `Unicode Emoji 16.0 has ${cnt("en", EMOJI.length)} not counting skin tone and hair variants; with them there are over 3,700 sequences.` },
          { q: "Why do some emoji show up as boxes?", a: "Those are emoji your system font doesn’t have yet. New emoji (Emoji 15–16) arrive with iOS, Android and Windows updates; they may display fine on other devices." },
          { q: "Where do the names come from?", a: `From Unicode CLDR (${SOURCE.split(", ")[1]}), the official localization database used by Apple, Google and Microsoft.` },
        ],
    related: sectionLinks(locale),
    schemaType: "CollectionPage",
    icon: "Smile",
    hue: HUE,
    wide: true,
  };
}

/* ───────────── section ───────────── */

export const emojiSection: SectionDef = {
  id: ID,
  name: NAME,
  description: DESC,
  icon: "Smile",
  hue: HUE,
  category: "symbols",
  order: 1,
  paths() {
    return [
      [],
      ...EMOJI.map((e) => [e.slug]),
      ...GROUP_KEYS.map((g) => ["group", g]),
      ...SUBGROUP_KEYS.map((s) => ["subgroup", s]),
      ...TOPICS.map((t) => ["topic", t.slug]),
    ];
  },
  prebuild() {
    return [
      [],
      ...GROUP_KEYS.map((g) => ["group", g]),
      ...SUBGROUP_KEYS.map((s) => ["subgroup", s]),
      ...TOPICS.map((t) => ["topic", t.slug]),
      ...popular(PREBUILD_EMOJI).map((e) => [e.slug]),
    ];
  },
  resolve(locale, rest) {
    if (rest.length === 0) return hubPage(locale);
    if (rest.length === 1) {
      const e = bySlug.get(rest[0]);
      return e ? emojiPage(e, locale) : null;
    }
    if (rest.length !== 2) return null;
    const [kind, key] = rest;
    if (kind === "group") return GROUPS[key] && byGroup.has(key) ? groupPage(key, locale) : null;
    if (kind === "subgroup") return bySub.has(key) ? subPage(key, locale) : null;
    if (kind === "topic") {
      const t = topicBySlug.get(key);
      return t ? topicPage(t, locale) : null;
    }
    return null;
  },
  search(locale) {
    const hint = tr(NAME, locale);
    const out: SearchEntry[] = [
      { path: [ID], title: locale === "ru" ? "Эмодзи — копировать" : "Emoji — copy and paste", hint: ui(locale).allTools, keywords: "эмодзи смайлики смайлы emoji emojis копировать", weight: 3 },
    ];
    for (const g of GROUP_KEYS) out.push({ path: groupPath(g), title: groupLink(g, locale).label, hint, keywords: `${tr(GROUPS[g].name, "en")} ${tr(GROUPS[g].name, "ru")} эмодзи emoji`, glyph: GROUPS[g].glyph, weight: 2 });
    for (const s of SUBGROUP_KEYS)
      out.push({ path: subPath(s), title: `${subName(s, locale)} — ${locale === "ru" ? "эмодзи" : "emoji"}`, hint, keywords: `${tr(SUBGROUPS[s], "en")} ${tr(SUBGROUPS[s], "ru")}`, glyph: bySub.get(s)?.[0]?.glyph, weight: 1 });
    for (const t of TOPICS) out.push({ path: topicPath(t.slug), title: tr(t.h1, locale), hint, keywords: `${t.name.ru} ${t.name.en} ${t.h1.en}`, glyph: topicEmoji(t)[0]?.glyph, weight: 2 });
    for (const e of popular(PREBUILD_EMOJI))
      out.push({ path: emojiPath(e), title: nameOf(e, locale), hint, keywords: locale === "ru" ? e.en : e.ru, glyph: e.glyph, weight: 1 });
    return out;
  },
  featured(locale) {
    return [
      topicLink(topicBySlug.get("hearts")!, locale),
      groupLink("smileys-emotion", locale),
      topicLink(topicBySlug.get("hands")!, locale),
      topicLink(topicBySlug.get("animals")!, locale),
      groupLink("flags", locale),
      topicLink(topicBySlug.get("new-year")!, locale),
    ];
  },
};
