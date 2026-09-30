import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";

export type Txt = Record<Locale, string>;

/** Round to the nearest multiple of `step` (e.g. 0.5 for half sizes). */
export function roundTo(n: number, step: number): number {
  const r = Math.round(n / step + 1e-9) * step;
  return Number(r.toFixed(6));
}

/** Locale number with up to `digits` fraction digits. */
export function nf(locale: Locale, n: number, digits = 2): string {
  return formatNumber(locale, n, { maximumFractionDigits: digits });
}

/** Same as nf, but always shows exactly `digits` fraction digits. */
export function nfix(locale: Locale, n: number, digits: number): string {
  return formatNumber(locale, n, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Integer with grouping (1 920 / 1,920). */
export function nint(locale: Locale, n: number): string {
  return formatNumber(locale, Math.round(n), { maximumFractionDigits: 0 });
}

/** Integer without grouping — for resolutions like 1920 × 1080. */
export function plain(n: number): string {
  return String(Math.round(n));
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const INCH_RU = ["дюйм", "дюйма", "дюймов", "дюйма"];
/** "8,27 дюйма" / "11 дюймов" / "1 inch" */
export function inchWord(locale: Locale, n: number): string {
  return locale === "ru" ? plural("ru", n, INCH_RU) : Math.abs(n) === 1 ? "inch" : "inches";
}

/** "N × M" with the locale's number format and a thin multiplication sign. */
export function dims(locale: Locale, a: number, b: number, digits = 2): string {
  return `${nf(locale, a, digits)} × ${nf(locale, b, digits)}`;
}

export const tt = (locale: Locale, ru: string, en: string) => (locale === "ru" ? ru : en);
