import type { Locale } from "@/i18n/config";

/** UI strings shared by the code-section components. */
export const CODE_T = {
  ru: {
    input: "Исходный код",
    result: "Результат",
    indent: "Отступ",
    spaces: (n: string) => `${n} пробела`,
    tab: "табуляция",
    minified: "в одну строку",
    width: "Ширина строки",
    quotes: "Кавычки",
    double: "двойные",
    single: "одинарные",
    semi: "Точка с запятой",
    dialect: "Диалект",
    keywords: "Ключевые слова",
    upper: "ЗАГЛАВНЫЕ",
    lower: "строчные",
    preserve: "как есть",
    sortKeys: "Сортировать ключи",
    ascii: "Экранировать не-ASCII",
    text: "Текст",
    tree: "Дерево",
    keepComments: "Сохранять комментарии",
    keepLicense: "Сохранять /*! лицензии */",
    working: "Обработка…",
    timeout: "Обработка заняла слишком много времени и была остановлена.",
    showInEditor: "Показать в редакторе",
    valid: (lang: string) => `${lang} корректен`,
    invalid: (lang: string) => `Ошибка в ${lang}`,
    empty: "Вставьте текст или откройте файл — проверка начнётся сразу.",
    jsoncHint: "С комментариями или лишними запятыми текст разбирается как JSONC (JSON с комментариями), но строгий JSON их не допускает.",
    saved: "Экономия",
    before: "Было",
    after: "Стало",
    gzip: "gzip",
    nodes: ["узел", "узла", "узлов"],
    depth: "глубина",
    elements: ["элемент", "элемента", "элементов"],
    docs: ["документ", "документа", "документов"],
    root: "корень",
    more: (n: string) => `… ещё ${n}`,
    kinds: { object: "объект", array: "массив", string: "строка", number: "число", boolean: "логическое", null: "null" } as Record<string, string>,
    errors: {
      syntax: "Синтаксическая ошибка",
      "sql-parse": "Не удалось разобрать SQL",
      "json-empty": "Пустой ввод",
      "json-unexpected-token": "Неожиданный символ",
      "json-unexpected-end": "JSON обрывается раньше времени",
      "json-bad-escape": "Неверная escape-последовательность",
      "json-bad-number": "Неверная запись числа",
      "json-control-char": "Управляющий символ внутри строки — его нужно экранировать",
      "json-trailing-data": "Лишние данные после JSON",
      "json-expected-colon": "Пропущено двоеточие после ключа",
      "json-expected-comma": "Пропущена запятая",
      "json-expected-key": "Ожидалось имя поля в двойных кавычках",
      "json-too-deep": "Слишком глубокая вложенность",
      "js-unterminated-string": "Незакрытая строка",
      "js-unterminated-template": "Незакрытый шаблон `…`",
      "js-unterminated-comment": "Незакрытый комментарий /* … */",
      "js-unterminated-regex": "Незакрытое регулярное выражение",
      "yaml-syntax": "Ошибка YAML",
      "xml-mismatched-tag": "Закрывающий тег не совпадает с открывающим",
      "xml-unclosed-element": "Элемент не закрыт",
      "xml-multiple-roots": "Больше одного корневого элемента",
      "xml-text-outside-root": "Текст вне корневого элемента",
      "xml-no-root": "Нет корневого элемента",
      "xml-bad-tag": "Неверный тег",
      "xml-bad-close-tag": "Неверный закрывающий тег",
      "xml-bad-attribute": "Неверный атрибут",
      "xml-duplicate-attribute": "Повторяющийся атрибут",
      "xml-unclosed-tag": "Тег не закрыт символом >",
      "xml-unclosed-comment": "Комментарий не закрыт",
      "xml-unclosed-cdata": "CDATA не закрыт",
      "xml-unclosed-pi": "Инструкция <? … ?> не закрыта",
      "xml-unclosed-doctype": "DOCTYPE не закрыт",
      "xml-unexpected-close": "Закрывающий тег без открывающего",
    } as Record<string, string>,
    warns: {
      "dup-key": "Повторяющийся ключ",
      comment: "Комментарий пропущен",
      "trailing-comma": "Лишняя запятая пропущена",
      "single-quote": "Строка в одинарных кавычках принята",
      bom: "BOM в начале пропущен",
      "json-dup-key": "Повторяющийся ключ — большинство парсеров возьмут последнее значение",
      "json-big-number": "Целые больше 2⁵³ — JavaScript (JSON.parse) округлит их",
      "yaml-warning": "Предупреждение YAML",
      "yaml-legacy-bool": "YAML 1.1 (PyYAML, старые инструменты) прочитает это как true/false — возьмите в кавычки",
      "xml-entities": "Неизвестные сущности",
      "xml-fragment": "Фрагмент без единого корня — отформатирован как есть",
    } as Record<string, string>,
  },
  en: {
    input: "Source code",
    result: "Result",
    indent: "Indent",
    spaces: (n: string) => `${n} spaces`,
    tab: "tab",
    minified: "single line",
    width: "Line width",
    quotes: "Quotes",
    double: "double",
    single: "single",
    semi: "Semicolons",
    dialect: "Dialect",
    keywords: "Keywords",
    upper: "UPPER",
    lower: "lower",
    preserve: "as is",
    sortKeys: "Sort keys",
    ascii: "Escape non-ASCII",
    text: "Text",
    tree: "Tree",
    keepComments: "Keep comments",
    keepLicense: "Keep /*! licenses */",
    working: "Processing…",
    timeout: "Processing took too long and was stopped.",
    showInEditor: "Show in editor",
    valid: (lang: string) => `Valid ${lang}`,
    invalid: (lang: string) => `Invalid ${lang}`,
    empty: "Paste text or open a file — checking starts immediately.",
    jsoncHint: "With comments or trailing commas the text parses as JSONC (JSON with comments), but strict JSON doesn't allow them.",
    saved: "Saved",
    before: "Before",
    after: "After",
    gzip: "gzip",
    nodes: ["node", "nodes"],
    depth: "depth",
    elements: ["element", "elements"],
    docs: ["document", "documents"],
    root: "root",
    more: (n: string) => `… ${n} more`,
    kinds: { object: "object", array: "array", string: "string", number: "number", boolean: "boolean", null: "null" } as Record<string, string>,
    errors: {
      syntax: "Syntax error",
      "sql-parse": "Couldn't parse the SQL",
      "json-empty": "Empty input",
      "json-unexpected-token": "Unexpected character",
      "json-unexpected-end": "The JSON ends too early",
      "json-bad-escape": "Invalid escape sequence",
      "json-bad-number": "Invalid number",
      "json-control-char": "Control character inside a string — it must be escaped",
      "json-trailing-data": "Extra data after the JSON value",
      "json-expected-colon": "Missing colon after a key",
      "json-expected-comma": "Missing comma",
      "json-expected-key": "Expected a field name in double quotes",
      "json-too-deep": "Nesting is too deep",
      "js-unterminated-string": "Unterminated string",
      "js-unterminated-template": "Unterminated template literal",
      "js-unterminated-comment": "Unterminated /* … */ comment",
      "js-unterminated-regex": "Unterminated regular expression",
      "yaml-syntax": "YAML error",
      "xml-mismatched-tag": "Closing tag doesn't match the opening tag",
      "xml-unclosed-element": "Unclosed element",
      "xml-multiple-roots": "More than one root element",
      "xml-text-outside-root": "Text outside the root element",
      "xml-no-root": "No root element",
      "xml-bad-tag": "Invalid tag",
      "xml-bad-close-tag": "Invalid closing tag",
      "xml-bad-attribute": "Invalid attribute",
      "xml-duplicate-attribute": "Duplicate attribute",
      "xml-unclosed-tag": "Tag not closed with >",
      "xml-unclosed-comment": "Unclosed comment",
      "xml-unclosed-cdata": "Unclosed CDATA section",
      "xml-unclosed-pi": "Unclosed <? … ?> instruction",
      "xml-unclosed-doctype": "Unclosed DOCTYPE",
      "xml-unexpected-close": "Closing tag without an opening tag",
    } as Record<string, string>,
    warns: {
      "dup-key": "Duplicate key",
      comment: "Comment skipped",
      "trailing-comma": "Trailing comma skipped",
      "single-quote": "Single-quoted string accepted",
      bom: "Leading BOM skipped",
      "json-dup-key": "Duplicate key — most parsers keep the last value",
      "json-big-number": "Integers above 2⁵³ — JavaScript (JSON.parse) will round them",
      "yaml-warning": "YAML warning",
      "yaml-legacy-bool": "YAML 1.1 readers (PyYAML, older tools) read this as true/false — quote it",
      "xml-entities": "Unknown entities",
      "xml-fragment": "A fragment without a single root — formatted as is",
    } as Record<string, string>,
  },
} as const;

export type CodeT = (typeof CODE_T)[Locale];

/** The source line of an error and a caret under the column (for error excerpts). */
export function excerpt(text: string, line: number, col?: number): { src: string; caret: string } | null {
  const lines = text.split("\n");
  const src = lines[line - 1];
  if (src === undefined) return null;
  const clean = src.replace(/\t/g, " ").replace(/\r$/, "");
  const start = col && col > 60 ? col - 40 : 0;
  const shown = clean.slice(start, start + 100);
  return { src: (start ? "…" : "") + shown, caret: col ? `${" ".repeat(Math.max(0, col - 1 - start + (start ? 1 : 0)))}^` : "" };
}

/** Select a line/column in a textarea by element id (used by "Show in editor"). */
export function revealInEditor(id: string, text: string, line: number, col = 1): void {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLTextAreaElement)) return;
  let offset = 0;
  for (let l = 1; l < line; l++) {
    const nl = text.indexOf("\n", offset);
    if (nl < 0) break;
    offset = nl + 1;
  }
  // columns are counted in code points
  let pos = offset;
  for (let c = 1; c < col && pos < text.length && text[pos] !== "\n"; c++) pos += (text.codePointAt(pos) ?? 0) > 0xffff ? 2 : 1;
  el.focus();
  el.setSelectionRange(pos, Math.min(pos + 1, text.length));
  const lh = parseFloat(getComputedStyle(el).lineHeight) || 20;
  el.scrollTop = Math.max(0, (line - 3) * lh);
}
