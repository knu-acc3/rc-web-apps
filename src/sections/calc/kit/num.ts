import type { Locale } from "@/i18n/config";
import { formatNumber, formatSmart, parseNumber } from "@/i18n/format";

/**
 * Number input helpers shared by every calculator (calc, finance, health).
 * All parsing goes through `parseNumber` — this module only adds a locale-aware
 * pre-normalisation for English thousands separators ("250,000" in an English
 * UI means 250 000, while in Russian "250,000" is a decimal comma).
 */

export type NumErr = "nan" | "min" | "max" | "int" | "gt";

export interface NumOpts {
  /** Inclusive lower bound. */
  min?: number;
  /** Inclusive upper bound. */
  max?: number;
  /** Strict lower bound (value must be greater). */
  gt?: number;
  /** Require an integer. */
  int?: boolean;
}

export interface NumResult {
  /** Parsed value, or null when empty/invalid. */
  value: number | null;
  /** Error kind (null when empty or valid). */
  error: NumErr | null;
  empty: boolean;
}

const EN_THOUSANDS = /^[-+−]?\d{1,3}(,\d{3})+(\.\d*)?$/;

/** Locale-aware wrapper around `parseNumber`. */
export function parseLocaleNumber(locale: Locale, text: string): number | null {
  const s = text.trim();
  if (locale === "en" && EN_THOUSANDS.test(s.replace(/[\s  ]/g, ""))) return parseNumber(s.replace(/,/g, ""));
  return parseNumber(s);
}

/** Parse and validate a text field. Empty input is not an error (value = null). */
export function readNum(locale: Locale, text: string, o: NumOpts = {}): NumResult {
  if (text.trim() === "") return { value: null, error: null, empty: true };
  const n = parseLocaleNumber(locale, text);
  if (n === null) return { value: null, error: "nan", empty: false };
  if (o.int && !Number.isInteger(n)) return { value: null, error: "int", empty: false };
  if (o.gt !== undefined && !(n > o.gt)) return { value: null, error: "gt", empty: false };
  if (o.min !== undefined && n < o.min) return { value: null, error: "min", empty: false };
  if (o.max !== undefined && n > o.max) return { value: null, error: "max", empty: false };
  return { value: n, error: null, empty: false };
}

/** Human-readable message for a validation error. */
export function numErrText(locale: Locale, err: NumErr | null, o: NumOpts = {}): string | undefined {
  if (!err) return undefined;
  const f = (n: number | undefined) => (n === undefined ? "" : formatSmart(locale, n));
  if (locale === "ru") {
    switch (err) {
      case "nan":
        return "Введите число";
      case "int":
        return "Нужно целое число";
      case "min":
        return `Не меньше ${f(o.min)}`;
      case "max":
        return `Не больше ${f(o.max)}`;
      case "gt":
        return `Должно быть больше ${f(o.gt)}`;
    }
  }
  switch (err) {
    case "nan":
      return "Enter a number";
    case "int":
      return "Enter a whole number";
    case "min":
      return `Must be at least ${f(o.min)}`;
    case "max":
      return `Must be at most ${f(o.max)}`;
    case "gt":
      return `Must be greater than ${f(o.gt)}`;
  }
}

/** Parse + message in one call: `const a = field(locale, text, { min: 0 })`. */
export function field(locale: Locale, text: string, o: NumOpts = {}): NumResult & { message?: string } {
  const r = readNum(locale, text, o);
  return { ...r, message: numErrText(locale, r.error, o) };
}

/**
 * Format a number for an input's initial value: grouped with plain spaces in
 * Russian ("1 000 000,5"), with commas in English ("1,000,000.5").
 * Both forms round-trip through `parseLocaleNumber`.
 */
export function toInput(locale: Locale, n: number, maxFraction = 10): string {
  if (!Number.isFinite(n)) return "";
  return formatNumber(locale, n, { maximumFractionDigits: maxFraction }).replace(/[  ]/g, " ").replace(/−/g, "-");
}
