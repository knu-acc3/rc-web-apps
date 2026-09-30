import type { L10n, Locale } from "@/i18n/config";
import { count, formatNumber, plural } from "@/i18n/format";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, QA, VariantDef } from "@/registry/types";
import { ANATOMY, CONTENT, GLOSSARY } from "./content";
import { CATEGORIES, LENNY, SHRUG, TABLE_FLIP, DISAPPROVAL, TOTAL, taggedFor, type KaomojiCategory } from "./data";

const SMILEYS_RU = ["японский смайлик", "японских смайлика", "японских смайликов"];
const VARIANTS: Record<Locale, string[]> = { ru: ["вариант", "варианта", "вариантов"], en: ["variant", "variants"] };
const N_CATS = CATEGORIES.length;
const FAMOUS_LINE = `${SHRUG} · ${LENNY} · ${TABLE_FLIP} · ${DISAPPROVAL}`;

/* ───────────── helpers ───────────── */

/** Characters that carry no meaning on their own (outline, punctuation, combining marks). */
const SKIP = /[\s()（）[\]{}.,:!?'"‘’“”\p{M}]/u;

/** Most frequent meaningful characters of a set (by number of kaomoji containing them). */
export function topChars(items: readonly string[], n = 8): string[] {
  const freq = new Map<string, number>();
  const first = new Map<string, number>();
  items.forEach((k, i) => {
    for (const ch of new Set(Array.from(k))) {
      if (SKIP.test(ch)) continue;
      freq.set(ch, (freq.get(ch) ?? 0) + 1);
      if (!first.has(ch)) first.set(ch, i);
    }
  });
  return [...freq]
    .sort((a, b) => b[1] - a[1] || first.get(a[0])! - first.get(b[0])!)
    .slice(0, n)
    .map(([c]) => c);
}

/** Up to three short examples, the signature one first. */
function examples(c: KaomojiCategory): string[] {
  return [c.sample, ...c.items.filter((k) => k !== c.sample && Array.from(k).length <= 9)].slice(0, 3);
}

function smileys(locale: Locale, n: number): string {
  return locale === "ru" ? count("ru", n, SMILEYS_RU) : `${formatNumber("en", n)} kaomoji`;
}

/** "ω — греческая омега, «кошачий» рот" for up to four characters we can explain (one per meaning). */
function explain(chars: string[], locale: Locale): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of chars) {
    const text = GLOSSARY[ch]?.[locale];
    if (!text) continue;
    const meaning = text.split(" — ").pop()!;
    if (seen.has(meaning)) continue;
    seen.add(meaning);
    out.push(`${ch} — ${text.replace(" — ", ", ")}`);
    if (out.length === 4) break;
  }
  return out;
}

const hex = (ch: string) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`;
/** Combining marks are shown on a dotted circle so they are visible in a table cell. */
const showChar = (ch: string) => (/\p{M}/u.test(ch) ? `◌${ch}` : ch);

/* ───────────── category pages ───────────── */

function variantTitle(c: KaomojiCategory, x: (typeof CONTENT)[string], locale: Locale): string {
  if (x.title) return x.title[locale];
  return locale === "ru" ? `${x.h1.ru} ${c.sample} — японские смайлики` : `${x.h1.en} ${c.sample} — copy and paste`;
}

function variantDescription(c: KaomojiCategory, x: (typeof CONTENT)[string], locale: Locale): string {
  const n = c.items.length;
  if (x.description) return x.description[locale].replace("{n}", count(locale, n - 1, VARIANTS[locale]));
  const ex = examples(c).join(" ");
  return locale === "ru"
    ? `${x.h1.ru}: ${smileys("ru", n)} ${x.topic.ru}, например ${ex}. Нажмите на любой — он скопируется в буфер обмена.`
    : `${n} ${x.topic.en} kaomoji (Japanese emoticons) such as ${ex}. Click any one to copy it and paste it into a chat, comment or post.`;
}

function variantLead(c: KaomojiCategory, x: (typeof CONTENT)[string], locale: Locale): string {
  if (x.lead) return x.lead[locale];
  return locale === "ru"
    ? `${smileys("ru", c.items.length)} ${x.topic.ru} — нажмите на любой, чтобы скопировать.`
    : `${c.items.length} ${x.topic.en} kaomoji — click any one to copy it.`;
}

function variantBlocks(c: KaomojiCategory, locale: Locale): Block[] {
  const ru = locale === "ru";
  const chars = topChars(c.items);
  const tagged = taggedFor(c.slug).length;
  const rows: [string, string][] = [
    [ru ? "Каомодзи в подборке" : "Kaomoji in this set", formatNumber(locale, c.items.length)],
    [ru ? "Самый узнаваемый" : "Signature kaomoji", c.sample],
    [ru ? "Частые символы" : "Common characters", chars.join(" ")],
  ];
  if (tagged) rows.push([ru ? "Ещё подходят из других подборок" : "Also fitting from other sets", formatNumber(locale, tagged)]);
  const blocks: Block[] = [{ type: "facts", title: ru ? "Коротко" : "Quick facts", rows }];

  for (const part of ANATOMY[c.slug] ?? []) {
    blocks.push({
      type: "table",
      title: ru ? `Из чего состоит ${part.of}` : `What ${part.of} is made of`,
      caption: ru ? `Символы ${part.of} с кодами Юникода` : `Characters of ${part.of} with Unicode code points`,
      head: ru ? ["Символ", "Код", "Название в Юникоде", "Что изображает"] : ["Character", "Code point", "Unicode name", "Role"],
      rows: part.rows.map(([ch, name, roleRu, roleEn]) => [showChar(ch), hex(ch), name, ru ? roleRu : roleEn]),
    });
  }
  return blocks;
}

function variantFaq(c: KaomojiCategory, x: (typeof CONTENT)[string], locale: Locale): QA[] {
  const chars = topChars(c.items);
  const expl = explain(chars, locale);
  const charsQa: QA =
    locale === "ru"
      ? {
          q: `Какие символы чаще всего встречаются в каомодзи «${c.name.ru}»?`,
          a: `Чаще всего: ${chars.join(" ")}.${expl.length ? ` ${expl.join("; ")}.` : ""} Всего в подборке ${smileys("ru", c.items.length)}.`,
        }
      : {
          q: `Which characters are most common in ${c.name.en.toLowerCase()} kaomoji?`,
          a: `Most often: ${chars.join(" ")}.${expl.length ? ` ${expl.join("; ")}.` : ""} The set has ${c.items.length} kaomoji in total.`,
        };
  return [...x.qa[locale], charsQa];
}

function variantFor(c: KaomojiCategory): VariantDef {
  const x = CONTENT[c.slug];
  if (!x) throw new Error(`kaomoji: no content for ${c.slug}`);
  const both = <T>(fn: (l: Locale) => T): Record<Locale, T> => ({ ru: fn("ru"), en: fn("en") });
  return {
    slug: c.slug,
    name: c.name,
    title: both((l) => variantTitle(c, x, l)),
    h1: x.h1,
    description: both((l) => variantDescription(c, x, l)),
    lead: both((l) => variantLead(c, x, l)),
    props: { category: c.slug },
    keywords: { ru: [...c.keywords.ru, x.h1.ru], en: [...c.keywords.en, x.h1.en] },
    blocks: (l) => variantBlocks(c, l),
    faq: both((l) => variantFaq(c, x, l)),
  };
}

/* ───────────── main page ───────────── */

const biggest = [...CATEGORIES].sort((a, b) => b.items.length - a.items.length).slice(0, 3);

function hubBlocks(locale: Locale): Block[] {
  const ru = locale === "ru";
  return [
    {
      type: "facts",
      title: ru ? "Коротко" : "Quick facts",
      rows: [
        [ru ? "Каомодзи в коллекции" : "Kaomoji in the collection", formatNumber(locale, TOTAL)],
        [ru ? "Категорий" : "Categories", formatNumber(locale, N_CATS)],
        [ru ? "Самые большие подборки" : "Largest sets", biggest.map((c) => `${c.name[locale]} (${c.items.length})`).join(", ")],
        [ru ? "Знаменитые" : "Famous ones", FAMOUS_LINE],
      ],
    },
  ];
}

const inCats = (n: number) => `${n} ${plural("ru", n, ["категории", "категориях", "категориях"])}`;

const TITLE: L10n = { ru: "Каомодзи — японские смайлики из символов", en: "Kaomoji — Japanese emoticons to copy and paste" };

export const kaomojiSection = defineToolSection({
  id: "kaomoji",
  name: { ru: "Каомодзи", en: "Kaomoji" },
  description: {
    ru: "Японские текстовые смайлики из символов по эмоциям: радость, грусть, любовь и другие",
    en: "Japanese text emoticons grouped by emotion: happy, sad, love, angry and more",
  },
  icon: "Laugh",
  hue: 10,
  category: "symbols",
  order: 3,
  tools: [
    {
      slug: "",
      component: "kaomoji/picker",
      icon: "Laugh",
      name: { ru: "Каомодзи", en: "Kaomoji" },
      title: TITLE,
      h1: { ru: "Каомодзи — японские смайлики", en: "Kaomoji — Japanese emoticons" },
      description: {
        ru: `${smileys("ru", TOTAL)} из символов в ${inCats(N_CATS)}: радость, любовь, грусть, котики, ${SHRUG} и ${LENNY}. Нажмите — и каомодзи скопирован.`,
        en: `${TOTAL} kaomoji — Japanese emoticons made of text — in ${N_CATS} categories: happy, love, sad, cats, ${SHRUG} and ${LENNY}. Click one to copy it.`,
      },
      lead: {
        ru: "Японские смайлики из текстовых символов — нажмите на любой, и он скопируется.",
        en: "Japanese emoticons made of text characters — click any one to copy it.",
      },
      keywords: {
        ru: ["каомодзи", "японские смайлики", "смайлики из символов", "текстовые смайлики", "kaomoji"],
        en: ["kaomoji", "japanese emoticons", "text faces", "emoticons copy paste"],
      },
      popular: true,
      wide: true,
      howTo: {
        ru: [
          "Найдите настроение: введите слово в поиск — «кот», «грусть», «спасибо» — или выберите категорию.",
          "Нажмите на каомодзи — он сразу скопируется в буфер обмена. С клавиатуры: Tab до нужного смайлика, затем Enter или пробел.",
          "Вставьте смайлик в сообщение: Ctrl+V на компьютере или долгое нажатие и «Вставить» на телефоне.",
          "Скопированные смайлики появляются в строке «Недавние» — так их легко отправить снова.",
        ],
        en: [
          "Find a mood: type a word in the search box — \"cat\", \"sad\", \"thanks\" — or pick a category.",
          "Click a kaomoji and it is copied to the clipboard. With a keyboard: Tab to the kaomoji, then Enter or Space.",
          "Paste it into your message: Ctrl+V (Cmd+V on a Mac) on a computer, or long-press and Paste on a phone.",
          "Copied kaomoji appear in the Recent row, so you can send them again in one click.",
        ],
      },
      faq: {
        ru: [
          { q: "Что такое каомодзи?", a: "Каомодзи (яп. 顔文字 — «лицо из символов») — смайлики из обычных текстовых символов: скобок, японской каны, греческих и других букв. В отличие от западных :-) их читают без поворота головы: (^_^)." },
          { q: "Чем каомодзи отличаются от эмодзи?", a: "Эмодзи — отдельные цветные картинки со своим кодом Юникода, и на разных платформах они нарисованы по-разному. Каомодзи — это обычный текст из нескольких символов: его можно составить самому, изменить и вставить туда, где эмодзи не поддерживаются, например в ник или подпись." },
          { q: "Как набрать каомодзи на телефоне или компьютере?", a: "Проще всего скопировать готовый: нажмите на смайлик на этой странице и вставьте его в чат. В Windows 10 и 11 сочетание Win + . открывает панель эмодзи с вкладкой каомодзи, а в японской раскладке на iPhone есть кнопка ^_^ со списком смайликов." },
          { q: "Почему вместо некоторых символов видны квадратики?", a: "В системе нет шрифта с этим символом — обычно это редкие письменности вроде канадского слогового письма (ᕦ ᕤ) или каннада (ಠ). Обновите систему или браузер; у собеседника на другом устройстве смайлик может отображаться нормально. Мы выбирали символы, которые есть в большинстве современных шрифтов." },
          { q: "Куда сохраняются недавние смайлики?", a: "Только в ваш браузер (localStorage) — на сервер ничего не отправляется. Список можно очистить кнопкой рядом с ним." },
        ],
        en: [
          { q: "What are kaomoji?", a: "Kaomoji (Japanese 顔文字, \"face characters\") are emoticons built from ordinary text characters: brackets, Japanese kana, Greek and other letters. Unlike Western :-) you read them upright, without tilting your head: (^_^)." },
          { q: "How are kaomoji different from emoji?", a: "Emoji are single colour pictures with their own Unicode code point, drawn differently on every platform. Kaomoji are plain text made of several characters, so you can build or tweak your own and paste them where emoji aren't supported, such as usernames or signatures." },
          { q: "How do I type kaomoji on a phone or computer?", a: "The easiest way is to copy one: click a kaomoji on this page and paste it into your chat. On Windows 10 and 11, Win + . opens the emoji panel with a kaomoji tab, and the Japanese keyboard on iPhone has a ^_^ key with a list of emoticons." },
          { q: "Why do some characters show up as squares?", a: "Your system lacks a font with that character — usually a rarer script such as Canadian syllabics (ᕦ ᕤ) or Kannada (ಠ). Updating the OS or browser helps, and the person you send it to may see it fine on their device. We picked characters that most modern fonts include." },
          { q: "Where are my recent kaomoji stored?", a: "Only in your browser (localStorage) — nothing is sent to a server. You can clear the list with the button next to it." },
        ],
      },
      about: {
        ru: [
          "Каомодзи появились в японских компьютерных сетях в 1980-х годах. Их рисуют обычными символами Юникода, поэтому они работают везде, где можно вставить текст: в мессенджерах, комментариях, никах и играх.",
          `В коллекции ${smileys("ru", TOTAL)} в ${inCats(N_CATS)} — от эмоций до животных и маленьких сценок. Мы проверили каждый: скобки и «руки» на месте, дубликатов нет. Знаменитые ${SHRUG}, ${LENNY}, ${TABLE_FLIP} и ${DISAPPROVAL} разобраны по символам на отдельных страницах.`,
          "Поиск понимает русские и английские слова. Всё работает в браузере, а список недавних хранится только на вашем устройстве.",
        ],
        en: [
          "Kaomoji first appeared on Japanese computer networks in the 1980s. They are made of ordinary Unicode characters, so they work anywhere you can paste text: messengers, comments, usernames and games.",
          `The collection has ${TOTAL} kaomoji in ${N_CATS} categories, from emotions to animals and tiny scenes. Each one was checked — brackets and arms in place, no duplicates. The famous ${SHRUG}, ${LENNY}, ${TABLE_FLIP} and ${DISAPPROVAL} are broken down character by character on their own pages.`,
          "Search understands both English and Russian words. Everything runs in your browser, and the recent list is stored only on your device.",
        ],
      },
      variants: {
        title: { ru: "Категории каомодзи", en: "Kaomoji categories" },
        list: () => CATEGORIES.map(variantFor),
        limit: 48,
      },
      blocks: hubBlocks,
    },
  ],
});
