import type { Locale } from "@/i18n/config";

/**
 * Build a CSV that opens correctly in Excel/LibreOffice for the user's locale:
 * ru → ";" separator and decimal comma; en → "," and decimal point.
 * Numbers are written without thousands grouping. A UTF-8 BOM is prepended.
 */
export function toCsv(locale: Locale, rows: (string | number | null | undefined)[][], decimals = 2): string {
  const sep = locale === "ru" ? ";" : ",";
  const cell = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") {
      if (!Number.isFinite(v)) return "";
      const s = Number.isInteger(v) ? String(v) : v.toFixed(decimals);
      return locale === "ru" ? s.replace(".", ",") : s;
    }
    return /[",;\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(sep)).join("\r\n") + "\r\n";
}
