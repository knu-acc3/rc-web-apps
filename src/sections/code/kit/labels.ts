import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";

/** Shared strings for the developer sections (code, data, regex, cron, encode, hash, uuid, dev). */
export const KIT_T = {
  ru: {
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    clear: "Очистить",
    sample: "Пример",
    openFile: "Открыть файл",
    input: "Ввод",
    output: "Результат",
    processing: "Обработка…",
    cancel: "Отменить",
    lines: ["строка", "строки", "строк"],
    chars: ["символ", "символа", "символов"],
    bytes: ["байт", "байта", "байт"],
    line: "строка",
    col: "столбец",
    fileTooBig: "Файл слишком большой для этого инструмента",
  },
  en: {
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    clear: "Clear",
    sample: "Sample",
    openFile: "Open file",
    input: "Input",
    output: "Result",
    processing: "Processing…",
    cancel: "Cancel",
    lines: ["line", "lines"],
    chars: ["character", "characters"],
    bytes: ["byte", "bytes"],
    line: "line",
    col: "column",
    fileTooBig: "The file is too large for this tool",
  },
} as const;

/** Labels object accepted by CodeOutput from @/ui/code-output. */
export function outputLabels(locale: Locale) {
  const t = KIT_T[locale];
  return { copy: t.copy, copied: t.copied, download: t.download };
}

/** "12 строк · 340 символов" */
export function countsLabel(locale: Locale, lines: number, chars: number): string {
  const t = KIT_T[locale];
  return `${formatNumber(locale, lines)} ${plural(locale, lines, t.lines)} · ${formatNumber(locale, chars)} ${plural(locale, chars, t.chars)}`;
}

/** "строка 3, столбец 7" / "line 3, column 7" */
export function positionLabel(locale: Locale, line: number, col?: number): string {
  const t = KIT_T[locale];
  return col === undefined ? `${t.line} ${line}` : `${t.line} ${line}, ${t.col} ${col}`;
}

/** Count lines and Unicode code points in one pass (no allocations). */
export function textStats(s: string): { lines: number; chars: number } {
  if (!s) return { lines: 0, chars: 0 };
  let lines = 1;
  let chars = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 10) lines++;
    // count a surrogate pair once
    if (c >= 0xdc00 && c <= 0xdfff && i > 0) {
      const p = s.charCodeAt(i - 1);
      if (p >= 0xd800 && p <= 0xdbff) continue;
    }
    chars++;
  }
  return { lines, chars };
}
