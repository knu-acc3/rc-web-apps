import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import type { RangeError } from "../lib/ranges";

/** Strings shared by all PDF tools. Tool-specific strings live in each tool. */
export const S = {
  ru: {
    dropPdf: "Перетащите PDF сюда или нажмите, чтобы выбрать",
    dropPdfs: "Перетащите PDF-файлы сюда или нажмите, чтобы выбрать",
    dropHint: "Файлы обрабатываются в браузере и никуда не загружаются",
    addMore: "Добавить PDF",
    replace: "Другой файл",
    clearAll: "Очистить",
    close: "Убрать",
    engine: "Не удалось запустить просмотр PDF — проверьте интернет и попробуйте ещё раз",
    retry: "Повторить",
    previewFailed: "Не удалось показать страницу",
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
    gridTip: "Нажмите на страницы, чтобы выбрать, и перетащите, чтобы переставить",
    gridTipSelect: "Нажмите на страницы, чтобы выбрать их",
    gridTipDelete: "Нажмите на страницы, которые нужно удалить",
    gridHelp: "Стрелки — перейти, пробел — выбрать (Shift — диапазон), Alt+стрелка — переместить, R — повернуть, Delete — удалить.",
    gridHelpSelect: "Стрелки — перейти, пробел — выбрать (Shift — диапазон).",
    gridHelpMove: "Стрелки — перейти, пробел — выбрать, Alt+стрелка — переместить, Delete — убрать.",
    gridHelpDelete: "Стрелки — перейти, пробел или Delete — отметить для удаления (Shift — диапазон).",
    select: "Выбрать",
    selectAll: "Выбрать все",
    selectNone: "Снять выбор",
    selectedCount: (n: number) => `выбрано ${n}`,
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
      engine: "Не удалось запустить обработку PDF в браузере — обновите страницу и попробуйте ещё раз",
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
    addMore: "Add PDF",
    replace: "Another file",
    clearAll: "Clear",
    close: "Remove",
    engine: "Couldn't start the PDF viewer — check your connection and try again",
    retry: "Retry",
    previewFailed: "Couldn't show the page",
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
    gridTip: "Tap pages to select them, drag to reorder",
    gridTipSelect: "Tap the pages to select them",
    gridTipDelete: "Tap the pages to delete",
    gridHelp: "Arrows to move focus, Space to select (Shift for a range), Alt+arrow to move, R to rotate, Delete to remove.",
    gridHelpSelect: "Arrows to move focus, Space to select (Shift for a range).",
    gridHelpMove: "Arrows to move focus, Space to select, Alt+arrow to move, Delete to remove.",
    gridHelpDelete: "Arrows to move focus, Space or Delete to mark for removal (Shift for a range).",
    select: "Select",
    selectAll: "Select all",
    selectNone: "Clear selection",
    selectedCount: (n: number) => `${n} selected`,
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
      engine: "Couldn't start PDF processing in the browser — reload the page and try again",
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
  // PdfOpenError from pdf.js: a broken file or a viewer that didn't start.
  const kind = (e as { kind?: string })?.kind;
  if (kind === "engine") return t.engine;
  if (kind === "invalid") return t["invalid-pdf"];
  const msg = e instanceof Error ? e.message : "";
  if (/memory|allocation|Array buffer/i.test(msg)) return t.memory;
  return t.generic;
}

export const pagesCount = (locale: Locale, n: number) => count(locale, n, S[locale].pages);
export const filesCount = (locale: Locale, n: number) => count(locale, n, S[locale].files);
