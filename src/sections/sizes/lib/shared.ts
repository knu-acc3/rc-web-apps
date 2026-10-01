import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";

export type Txt = Record<Locale, string>;

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

const INCH_RU = ["дюйм", "дюйма", "дюймов", "дюйма"];
/** "8,27 дюйма" / "11 дюймов" / "1 inch" */
export function inchWord(locale: Locale, n: number): string {
  return locale === "ru" ? plural("ru", n, INCH_RU) : Math.abs(n) === 1 ? "inch" : "inches";
}

export const tt = (locale: Locale, ru: string, en: string) => (locale === "ru" ? ru : en);
