import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import type { RangeError } from "../lib/ranges";

/** Strings shared by all PDF tools. Tool-specific strings live in each tool. */
export const S = {
  ru: {
    dropPdf: "Перетащите PDF сюда или нажмите, чтобы выбрать",
    dropPdfs: "Перетащите PDF-файлы сюда или нажмите, чтобы выбрать",
    dropHint: "Файлы обрабатываются в браузере и никуда не загружаются",
    addMore: "Добавить ещё файлы",
    replace: "Другой файл",
    remove: "Убрать файл",
    moveUp: "Выше",
    moveDown: "Ниже",
    loading: "Чтение файла…",
    passwordNeeded: "Файл защищён паролем",
    passwordWrong: "Неверный пароль, попробуйте ещё раз",
    passwordLabel: "Пароль",
    unlock: "Открыть",
    invalid: "Не удалось прочитать файл: он повреждён или это не PDF",
    processing: "Обработка…",
    cancel: "Отменить",
    download: "Скачать",
    downloadZip: "Скачать всё одним ZIP",
    zipping: "Упаковка в ZIP…",
    startOver: "Начать заново",
    before: "Было",
    after: "Стало",
    result: "Готово",
    files: ["файл", "файла", "файлов"],
    pages: ["страница", "страницы", "страниц"],
    pagesGen: ["страницы", "страниц", "страниц"],
    andMore: (n: number) => `и ещё ${n}`,
    pagesLabel: "Страницы",
    rangeHint: "Например: 1-3, 5, 8- (8- = с 8-й до конца)",
    page: "Стр.",
    rotateLeft: "Повернуть влево",
    rotateRight: "Повернуть вправо",
    deletePage: "Удалить страницу",
    restorePage: "Вернуть страницу",
    duplicatePage: "Дублировать страницу",
    moveLeft: "Переместить назад",
    moveRight: "Переместить вперёд",
    gridHelp: "Нажмите на страницу, чтобы выбрать её (Shift — диапазон), и перетаскивайте мышью. С клавиатуры: стрелки, пробел — выбрать, Alt+стрелка — переместить, R — повернуть, Delete — удалить.",
    gridHelpSelect: "Нажмите на страницы, чтобы выбрать их (Shift — диапазон). С клавиатуры: стрелки и пробел.",
    gridHelpMove: "Перетаскивайте мышью, чтобы изменить порядок. С клавиатуры: стрелки, пробел — выбрать, Alt+стрелка — переместить, Delete — убрать.",
    gridHelpDelete: "Нажмите на страницы, которые нужно удалить (Shift — диапазон). С клавиатуры: стрелки, пробел или Delete.",
    select: "Выбрать",
    selectAll: "Выбрать все",
    selectNone: "Снять выбор",
    invert: "Инвертировать",
    errors: {
      "password-required": "Нужен пароль к файлу",
      "password-incorrect": "Неверный пароль",
      "encryption-unsupported": "Этот вид защиты не поддерживается (например, шифрование сертификатом)",
      "invalid-pdf": "Не удалось разобрать PDF: файл повреждён или нестандартный",
      "font-required": "Не удалось загрузить шрифт для этого текста",
      "no-pages": "Не выбрано ни одной страницы",
      "no-form": "В файле нет полей формы",
      "not-encrypted": "Этот файл не защищён паролем — снимать нечего",
      generic: "Не удалось обработать файл",
      memory: "Не хватает памяти браузера: уменьшите DPI или выберите меньше страниц",
    },
    range: {
      empty: "Укажите страницы",
      syntax: (t: string) => `Не понимаю «${t}» — используйте номера и диапазоны: 1-3, 5, 8-`,
      zero: "Нумерация страниц начинается с 1",
      "out-of-range": (t: string, max: number) => `«${t}» — в файле всего ${count("ru", max, ["страница", "страницы", "страниц"])}`,
    },
  },
  en: {
    dropPdf: "Drop a PDF here or click to choose",
    dropPdfs: "Drop PDF files here or click to choose",
    dropHint: "Files are processed in your browser and never uploaded",
    addMore: "Add more files",
    replace: "Another file",
    remove: "Remove file",
    moveUp: "Up",
    moveDown: "Down",
    loading: "Reading file…",
    passwordNeeded: "This file is password-protected",
    passwordWrong: "Wrong password, try again",
    passwordLabel: "Password",
    unlock: "Open",
    invalid: "Couldn't read the file: it is damaged or not a PDF",
    processing: "Processing…",
    cancel: "Cancel",
    download: "Download",
    downloadZip: "Download all as ZIP",
    zipping: "Packing ZIP…",
    startOver: "Start over",
    before: "Before",
    after: "After",
    result: "Done",
    files: ["file", "files"],
    pages: ["page", "pages"],
    pagesGen: ["page", "pages"],
    andMore: (n: number) => `and ${n} more`,
    pagesLabel: "Pages",
    rangeHint: "For example: 1-3, 5, 8- (8- = page 8 to the end)",
    page: "p.",
    rotateLeft: "Rotate left",
    rotateRight: "Rotate right",
    deletePage: "Delete page",
    restorePage: "Restore page",
    duplicatePage: "Duplicate page",
    moveLeft: "Move back",
    moveRight: "Move forward",
    gridHelp: "Click a page to select it (Shift for a range) and drag to reorder. Keyboard: arrows, Space to select, Alt+arrow to move, R to rotate, Delete to remove.",
    gridHelpSelect: "Click pages to select them (Shift for a range). Keyboard: arrows and Space.",
    gridHelpMove: "Drag to change the order. Keyboard: arrows, Space to select, Alt+arrow to move, Delete to remove.",
    gridHelpDelete: "Click the pages to delete (Shift for a range). Keyboard: arrows, Space or Delete.",
    select: "Select",
    selectAll: "Select all",
    selectNone: "Clear selection",
    invert: "Invert",
    errors: {
      "password-required": "The file needs a password",
      "password-incorrect": "Wrong password",
      "encryption-unsupported": "This kind of protection is not supported (e.g. certificate encryption)",
      "invalid-pdf": "Couldn't parse the PDF: the file is damaged or non-standard",
      "font-required": "Couldn't load a font for this text",
      "no-pages": "No pages selected",
      "no-form": "The file has no form fields",
      "not-encrypted": "This file is not password-protected — there is nothing to remove",
      generic: "Couldn't process the file",
      memory: "The browser ran out of memory: lower the DPI or choose fewer pages",
    },
    range: {
      empty: "Enter pages",
      syntax: (t: string) => `Can't read “${t}” — use numbers and ranges: 1-3, 5, 8-`,
      zero: "Page numbers start at 1",
      "out-of-range": (t: string, max: number) => `“${t}” — the file has only ${count("en", max, ["page", "pages"])}`,
    },
  },
} as const;

export function rangeErrorText(locale: Locale, e: RangeError, max: number): string {
  const r = S[locale].range;
  switch (e.code) {
    case "empty":
      return r.empty;
    case "syntax":
      return r.syntax(e.token);
    case "zero":
      return r.zero;
    case "out-of-range":
      return r["out-of-range"](e.token, max);
  }
}

/** An error whose message is already written for the user (shown as is). */
export class UserFacingError extends Error {}

export function errorText(locale: Locale, e: unknown): string {
  if (e instanceof UserFacingError) return e.message;
  const t = S[locale].errors;
  const code = (e as { code?: string })?.code;
  if (code === "bad-image") {
    const name = e instanceof Error ? e.message : "";
    return locale === "ru" ? `Не удалось прочитать картинку «${name}» — файл повреждён или формат не поддерживается` : `Couldn't read the image “${name}” — it is damaged or the format is not supported`;
  }
  if (code && code in t) return t[code as keyof typeof t];
  const msg = e instanceof Error ? e.message : "";
  if (/memory|allocation|Array buffer/i.test(msg)) return t.memory;
  return t.generic;
}

export const pagesCount = (locale: Locale, n: number) => count(locale, n, S[locale].pages);
export const filesCount = (locale: Locale, n: number) => count(locale, n, S[locale].files);
