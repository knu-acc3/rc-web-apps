import type { L10n, Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { ALPHABETS, consonants, type AlphabetId } from "../lib/letters";
import { L, num, pct } from "./common";

interface LetterPreset {
  slug: string;
  alphabet: AlphabetId;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  note: L10n;
  faq: Record<Locale, QA>;
}

const PRESETS: LetterPreset[] = [
  {
    slug: "russian",
    alphabet: "ru",
    name: { ru: "Русский алфавит", en: "Russian alphabet" },
    title: { ru: "Случайная буква русского алфавита — генератор", en: "Random Russian Letter — Cyrillic letter generator" },
    h1: { ru: "Случайная буква русского алфавита", en: "Random Russian letter" },
    description: {
      ru: "Случайная буква русского алфавита: 33 буквы, из них 10 гласных и 21 согласная, шанс каждой 1/33 ≈ 3 %. Можно исключить Ъ, Ы и Ь для игр в слова.",
      en: "Random letter of the Russian alphabet: 33 letters — 10 vowels, 21 consonants and the two signs — each with a 1/33 ≈ 3% chance. Handy for learning Cyrillic.",
    },
    lead: { ru: "Одна из 33 букв — или только гласные, или только согласные.", en: "One of 33 Cyrillic letters — or vowels or consonants only." },
    note: {
      ru: "Для игр «Слова на букву», «Города» и «Поле чудес» включите «Без букв, с которых не начинаются слова»: Ъ, Ы и Ь выпадать не будут, останется 30 букв.",
      en: "The Russian alphabet has 33 letters: 10 vowels, 21 consonants, and the hard and soft signs (Ъ, Ь), which have no sound of their own.",
    },
    faq: {
      ru: { q: "Сколько гласных и согласных в русском алфавите?", a: "Гласных букв 10 (А, Е, Ё, И, О, У, Ы, Э, Ю, Я), согласных 21, и ещё два знака — Ъ и Ь, которые не обозначают звуков." },
      en: { q: "How many vowels does the Russian alphabet have?", a: "10 vowel letters (А, Е, Ё, И, О, У, Ы, Э, Ю, Я), 21 consonants and two signs, Ъ and Ь, which have no sound of their own." },
    },
  },
  {
    slug: "english",
    alphabet: "en",
    name: { ru: "Английский алфавит", en: "English alphabet" },
    title: { ru: "Случайная буква английского алфавита", en: "Random Letter Generator — pick a letter A to Z" },
    h1: { ru: "Случайная английская буква", en: "Random letter from A to Z" },
    description: {
      ru: "Случайная буква английского алфавита: 26 букв от A до Z, 5 гласных и 21 согласная, шанс каждой ≈ 3,8 %. Для уроков английского, игр и кроссвордов.",
      en: "Random letter from A to Z: 26 letters — 5 vowels and 21 consonants — each with a 1/26 ≈ 3.8% chance. For word games, Scattergories, spelling and the classroom.",
    },
    lead: { ru: "Одна из 26 букв от A до Z — с повторами или без.", en: "One of the 26 letters A–Z — with or without repeats." },
    note: {
      ru: "Гласными здесь считаются A, E, I, O, U. Буква Y иногда читается как гласная (my, happy), но по традиции её относят к согласным.",
      en: "Vowels here are A, E, I, O and U. Y sometimes acts as a vowel (my, happy) but is traditionally counted with the consonants.",
    },
    faq: {
      ru: { q: "Как получить несколько разных букв?", a: "Укажите количество до 10 и включите «Без повторов» — буквы не будут совпадать." },
      en: { q: "How do I get several different letters?", a: "Set the count up to 10 and turn on “No repeats” — no letter will appear twice." },
    },
  },
  {
    slug: "kazakh",
    alphabet: "kk",
    name: { ru: "Казахский алфавит", en: "Kazakh alphabet" },
    title: { ru: "Случайная буква казахского алфавита", en: "Random Kazakh Letter — Kazakh Cyrillic alphabet" },
    h1: { ru: "Случайная буква казахского алфавита", en: "Random Kazakh letter" },
    description: {
      ru: "Случайная буква казахского алфавита на кириллице: 42 буквы, включая Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ и І, шанс каждой 1/42 ≈ 2,4 %. Для уроков казахского и игр.",
      en: "Random letter of the Kazakh Cyrillic alphabet: 42 letters including Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ and І, each with a 1/42 ≈ 2.4% chance. For Kazakh lessons and games.",
    },
    lead: { ru: "Одна из 42 букв казахского алфавита.", en: "One of the 42 letters of the Kazakh alphabet." },
    note: {
      ru: "Казахский кириллический алфавит — это 33 буквы русского плюс девять своих: Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І. Генератор помогает тренировать именно их — включите фильтр гласных или согласных.",
      en: "The Kazakh Cyrillic alphabet is the 33 Russian letters plus nine of its own: Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І. Use the vowel or consonant filter to practise them.",
    },
    faq: {
      ru: { q: "Какие буквы есть только в казахском алфавите?", a: "Девять: Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ и І. Остальные 33 буквы совпадают с русским алфавитом." },
      en: { q: "Which letters are unique to Kazakh?", a: "Nine: Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ and І. The other 33 letters are the same as in Russian." },
    },
  },
];

function letterBlocks(p: LetterPreset, locale: Locale): Block[] {
  const a = ALPHABETS[p.alphabet];
  const n = a.letters.length;
  const rows: [string, string][] = [
    [L(locale, "Всего букв", "Letters"), num(locale, n)],
    [L(locale, "Гласные", "Vowels"), `${a.vowels.length}: ${a.vowels.join(" ")}`],
    [L(locale, "Согласные", "Consonants"), `${consonants(a).length}: ${consonants(a).join(" ")}`],
  ];
  if (a.signs.length) rows.push([L(locale, "Знаки без звука", "Signs with no sound"), a.signs.join(" ")]);
  rows.push([L(locale, "Шанс каждой буквы", "Chance of each letter"), `1/${n} ≈ ${pct(locale, 1 / n)}`]);
  return [
    { type: "facts", title: L(locale, "Алфавит", "The alphabet"), rows },
    { type: "text", paragraphs: [p.note[locale]] },
  ];
}

const FAIR: Record<Locale, QA> = {
  ru: { q: "Все буквы выпадают одинаково часто?", a: "Да. В отличие от частоты букв в текстах (где О встречается гораздо чаще Ф), генератор даёт каждой букве в выбранном наборе равный шанс." },
  en: { q: "Is every letter equally likely?", a: "Yes. Unlike letter frequency in real text (where E is far more common than Z), the generator gives every letter in the chosen set an equal chance." },
};

function letterVariant(p: LetterPreset): VariantDef {
  return {
    slug: p.slug,
    name: p.name,
    title: p.title,
    h1: p.h1,
    description: p.description,
    lead: p.lead,
    props: { alphabet: p.alphabet },
    keywords: { ru: ["случайная буква", p.name.ru.toLowerCase()], en: ["random letter", p.name.en.toLowerCase()] },
    blocks: (locale) => letterBlocks(p, locale),
    faq: { ru: [p.faq.ru, FAIR.ru], en: [p.faq.en, FAIR.en] },
  };
}

export const letterTool: ToolDef = {
  slug: "random-letter-generator",
  component: "random/letter",
  icon: "CaseSensitive",
  name: { ru: "Случайная буква", en: "Random letter generator" },
  title: { ru: "Случайная буква онлайн — генератор букв алфавита", en: "Random Letter Generator — letters A to Z" },
  h1: { ru: "Случайная буква", en: "Random letter generator" },
  description: {
    ru: "Генератор случайных букв: русский, английский и казахский алфавиты, только гласные или согласные, до 10 букв за раз без повторов. Для игр в слова и уроков.",
    en: "Random letter generator for the English, Russian and Kazakh alphabets: vowels or consonants only, up to 10 letters without repeats. For games and lessons.",
  },
  lead: {
    ru: "Выберите алфавит и нажмите кнопку — выпадет случайная буква.",
    en: "Choose an alphabet and press the button to get a random letter.",
  },
  keywords: {
    ru: ["буква на удачу", "рандомная буква", "генератор букв", "игра в слова"],
    en: ["letter picker", "random alphabet letter", "letter generator", "scattergories letter"],
  },
  howTo: {
    ru: [
      "Выберите алфавит: русский, английский или казахский.",
      "При необходимости оставьте только гласные или только согласные.",
      "Укажите, сколько букв нужно, и включите «Без повторов» для разных букв.",
      "Нажмите кнопку — буквы появятся крупно, а прошлые останутся в истории.",
    ],
    en: [
      "Choose the alphabet: English, Russian or Kazakh.",
      "Optionally keep only vowels or only consonants.",
      "Set how many letters you need and turn on “No repeats” for distinct letters.",
      "Press the button — the letters appear in large type, earlier ones stay in the history.",
    ],
  },
  faq: {
    ru: [
      FAIR.ru,
      { q: "Зачем исключать Ъ, Ы и Ь?", a: "С этих букв не начинается ни одно обычное слово, поэтому в играх «Слова на букву» или «Города» они только мешают." },
      { q: "Можно получить несколько букв сразу?", a: "Да, до 10. С опцией «Без повторов» буквы будут разными — удобно для игры «Составь слово»." },
    ],
    en: [
      FAIR.en,
      { q: "Can I get several letters at once?", a: "Yes, up to 10. With “No repeats” they're all different — handy for make-a-word games." },
      { q: "Which letters count as vowels?", a: "In English: A, E, I, O, U. In Russian: А, Е, Ё, И, О, У, Ы, Э, Ю, Я. The full list for each alphabet is shown under the generator." },
    ],
  },
  about: {
    ru: [
      "Случайная буква нужна для игр в слова, «Поля чудес», «Крокодила» и уроков: назовите слово, город или животное на выпавшую букву. Под кнопкой видно, какие буквы участвуют в розыгрыше.",
      "Поддерживаются три алфавита: русский (33 буквы), английский (26) и казахский кириллический (42). Каждая буква выбранного набора выпадает с одинаковой вероятностью.",
    ],
    en: [
      "A random letter is all you need for word games, Scattergories-style rounds and spelling practice: name a word, city or animal starting with it. The letters in play are listed under the button.",
      "Three alphabets are supported: English (26 letters), Russian (33) and Kazakh Cyrillic (42). Every letter in the chosen set is equally likely.",
    ],
  },
  variants: {
    title: { ru: "Алфавиты", en: "Alphabets" },
    list: () => PRESETS.map(letterVariant),
  },
};
