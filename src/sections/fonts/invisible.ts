import type { L10n } from "@/i18n/config";

interface InvisibleChar {
  cp: number;
  /** Official Unicode name. */
  name: string;
  label: L10n;
  /** What it is typically used for (no platform guarantees). */
  use: L10n;
}

/** Blank and invisible characters, most useful first. */
export const INVISIBLE: InvisibleChar[] = [
  {
    cp: 0x3164,
    name: "HANGUL FILLER",
    label: { ru: "Хангыль-заполнитель", en: "Hangul Filler" },
    use: {
      ru: "Самый популярный «пустой» символ для ников и названий: по Unicode это буква, поэтому проверка «поле не может быть пустым» его часто пропускает.",
      en: "The most popular blank for nicknames and names: Unicode classifies it as a letter, so “field can’t be empty” checks often let it through.",
    },
  },
  {
    cp: 0x115f,
    name: "HANGUL CHOSEONG FILLER",
    label: { ru: "Заполнитель начальной согласной хангыля", en: "Hangul Choseong Filler" },
    use: { ru: "Запасной вариант, если U+3164 уже блокируют. Тоже буква по Unicode.", en: "A fallback when U+3164 is blocked. Also a letter in Unicode." },
  },
  {
    cp: 0x1160,
    name: "HANGUL JUNGSEONG FILLER",
    label: { ru: "Заполнитель гласной хангыля", en: "Hangul Jungseong Filler" },
    use: { ru: "Ещё одна альтернатива U+3164; ширина сильно зависит от шрифта.", en: "Another alternative to U+3164; its width depends heavily on the font." },
  },
  {
    cp: 0xffa0,
    name: "HALFWIDTH HANGUL FILLER",
    label: { ru: "Полуширинный хангыль-заполнитель", en: "Halfwidth Hangul Filler" },
    use: { ru: "Узкий вариант заполнителя, тоже буква по Unicode.", en: "A narrow version of the filler, also a letter in Unicode." },
  },
  {
    cp: 0x2800,
    name: "BRAILLE PATTERN BLANK",
    label: { ru: "Пустой символ Брайля", en: "Braille Pattern Blank" },
    use: {
      ru: "Для пустых сообщений и пустых строк в описаниях профиля: это не пробел, поэтому приложения обычно его не обрезают.",
      en: "For empty messages and blank lines in profile bios: it isn’t a space, so apps usually don’t trim it.",
    },
  },
  {
    cp: 0x200b,
    name: "ZERO WIDTH SPACE",
    label: { ru: "Пробел нулевой ширины", en: "Zero Width Space" },
    use: {
      ru: "Не виден и не занимает места. Разбивает слово или ссылку, чтобы она не стала кликабельной; многие сайты удаляют его при сохранении.",
      en: "Invisible and takes no room. Splits a word or a link so it doesn’t turn clickable; many sites strip it on save.",
    },
  },
  {
    cp: 0x200c,
    name: "ZERO WIDTH NON-JOINER",
    label: { ru: "Разъединитель нулевой ширины", en: "Zero Width Non-Joiner" },
    use: { ru: "Запрещает соединение букв и лигатуры (нужен, например, в персидском письме).", en: "Prevents letter joining and ligatures (used, for example, in Persian)." },
  },
  {
    cp: 0x200d,
    name: "ZERO WIDTH JOINER",
    label: { ru: "Соединитель нулевой ширины", en: "Zero Width Joiner" },
    use: {
      ru: "Склеивает эмодзи в одну картинку: семья 👨\u{200D}👩\u{200D}👧 — это три эмодзи и два таких символа.",
      en: "Glues emoji into one picture: the family 👨\u{200D}👩\u{200D}👧 is three emoji joined by two of these.",
    },
  },
  {
    cp: 0x2060,
    name: "WORD JOINER",
    label: { ru: "Соединитель слов", en: "Word Joiner" },
    use: { ru: "Невидимый символ, который запрещает перенос строки в этом месте.", en: "Invisible; forbids a line break at its position." },
  },
  {
    cp: 0xfeff,
    name: "ZERO WIDTH NO-BREAK SPACE",
    label: { ru: "Неразрывный пробел нулевой ширины (BOM)", en: "Zero Width No-Break Space (BOM)" },
    use: {
      ru: "В начале файла служит меткой порядка байтов, в тексте невидим. Функция trim() в JavaScript его удаляет.",
      en: "Marks byte order at the start of a file and is invisible inside text. JavaScript’s trim() removes it.",
    },
  },
  {
    cp: 0x00a0,
    name: "NO-BREAK SPACE",
    label: { ru: "Неразрывный пробел", en: "No-Break Space" },
    use: {
      ru: "Выглядит как пробел, но не даёт разорвать строку: «10 000 ₸». Для проверок это пробел, поэтому по краям обычно обрезается.",
      en: "Looks like a space but prevents a line break: “10 000 ₸”. Checks treat it as whitespace, so it is usually trimmed at the edges.",
    },
  },
  {
    cp: 0x2003,
    name: "EM SPACE",
    label: { ru: "Круглая шпация", en: "Em Space" },
    use: { ru: "Широкий пробел для отступов в начале строки.", en: "A wide space for indents at the start of a line." },
  },
  {
    cp: 0x200a,
    name: "HAIR SPACE",
    label: { ru: "Волосяная шпация", en: "Hair Space" },
    use: { ru: "Самый узкий видимый пробел — например, между числом и знаком %.", en: "The narrowest visible space, e.g. between a number and %." },
  },
  {
    cp: 0x3000,
    name: "IDEOGRAPHIC SPACE",
    label: { ru: "Идеографический пробел", en: "Ideographic Space" },
    use: { ru: "Пробел шириной с иероглиф, как в японском и китайском тексте.", en: "A space as wide as a CJK character, as in Japanese and Chinese text." },
  },
  {
    cp: 0x00ad,
    name: "SOFT HYPHEN",
    label: { ru: "Мягкий перенос", en: "Soft Hyphen" },
    use: {
      ru: "Невидим, пока слово не переносится на новую строку, — тогда в этом месте появляется дефис.",
      en: "Invisible until the word wraps to a new line; then a hyphen appears at that spot.",
    },
  },
];

export type UnicodeClass = "letter" | "symbol" | "format" | "space" | "mark";

/** Facts computed from the Unicode character database built into the JS engine. */
export function charFacts(cp: number): { cls: UnicodeClass; whitespace: boolean; ignorable: boolean } {
  const ch = String.fromCodePoint(cp);
  const cls: UnicodeClass = /\p{L}/u.test(ch) ? "letter" : /\p{S}/u.test(ch) ? "symbol" : /\p{Zs}/u.test(ch) ? "space" : /\p{M}/u.test(ch) ? "mark" : "format";
  return { cls, whitespace: /\p{White_Space}/u.test(ch), ignorable: /\p{Default_Ignorable_Code_Point}/u.test(ch) };
}
