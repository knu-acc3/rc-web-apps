import type { L10n, L10nList, Locale } from "@/i18n/config";
import type { Block, QA } from "@/registry/types";

export const L = (ru: string, en: string): L10n => ({ ru, en });
export const LL = (ru: string[], en: string[]): L10nList => ({ ru, en });
export const FAQ = (ru: [string, string][], en: [string, string][]): Record<Locale, QA[]> => ({
  ru: ru.map(([q, a]) => ({ q, a })),
  en: en.map(([q, a]) => ({ q, a })),
});

/** Facts block with localized rows. */
export function facts(locale: Locale, title: L10n, rows: [L10n | string, L10n | string][]): Block {
  const s = (x: L10n | string) => (typeof x === "string" ? x : x[locale]);
  return { type: "facts", title: title[locale], rows: rows.map(([k, v]) => [s(k), s(v)]) };
}

/** Top text tools — linked from variant pages of small families. */
const CORE_TOOLS: { slug: string; name: L10n }[] = [
  { slug: "word-counter", name: L("Счётчик символов", "Word counter") },
  { slug: "case-converter", name: L("Регистр текста", "Case converter") },
  { slug: "remove-duplicate-lines", name: L("Удалить дубликаты строк", "Remove duplicate lines") },
  { slug: "sort-lines", name: L("Сортировка строк", "Sort lines") },
  { slug: "reverse-text", name: L("Текст задом наперёд", "Reverse text") },
  { slug: "find-and-replace", name: L("Найти и заменить", "Find and replace") },
  { slug: "text-cleaner", name: L("Очистка текста", "Text cleaner") },
  { slug: "remove-line-breaks", name: L("Удалить переносы строк", "Remove line breaks") },
  { slug: "remove-extra-spaces", name: L("Удалить лишние пробелы", "Remove extra spaces") },
  { slug: "remove-empty-lines", name: L("Удалить пустые строки", "Remove empty lines") },
  { slug: "typograph", name: L("Типограф", "Typographer") },
  { slug: "keyboard-layout-converter", name: L("Перевод раскладки", "Keyboard layout converter") },
  { slug: "transliteration", name: L("Транслитерация", "Transliteration") },
  { slug: "text-compare", name: L("Сравнить тексты", "Text compare") },
  { slug: "lorem-ipsum", name: L("Lorem ipsum", "Lorem ipsum") },
  { slug: "word-frequency", name: L("Частотность слов", "Word frequency") },
  { slug: "add-line-numbers", name: L("Нумерация строк", "Number lines") },
  { slug: "join-lines", name: L("Объединить строки", "Join lines") },
  { slug: "markdown-editor", name: L("Markdown-редактор", "Markdown editor") },
  { slug: "text-to-speech", name: L("Озвучка текста", "Text to speech") },
  { slug: "email-extractor", name: L("Извлечь email", "Email extractor") },
  { slug: "repeat-text", name: L("Повторить текст", "Repeat text") },
];

/** Chips to other text tools (for variant pages whose family has few siblings). */
export function moreTools(locale: Locale, exclude: string): Block {
  return {
    type: "links",
    title: locale === "ru" ? "Другие инструменты для текста" : "More text tools",
    style: "chips",
    items: CORE_TOOLS.filter((t) => t.slug !== exclude).map((t) => ({ path: [t.slug], label: t.name[locale] })),
  };
}
