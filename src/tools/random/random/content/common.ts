import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";

/** "8,3 %" (ru) / "8.3%" (en); p is a probability 0…1. */
export function pct(locale: Locale, p: number, digits?: number): string {
  const v = p * 100;
  const d = digits ?? (v >= 10 ? 1 : v >= 1 ? 2 : v >= 0.01 ? 3 : 6);
  const s = formatNumber(locale, v, { maximumFractionDigits: d });
  return locale === "ru" ? `${s} %` : `${s}%`;
}

export const num = (locale: Locale, n: number | bigint) => formatNumber(locale, Number(n));

/** "1 из 8 145 060" / "1 in 8,145,060" */
export const oneIn = (locale: Locale, n: number | bigint) => `${locale === "ru" ? "1 из" : "1 in"} ${num(locale, n)}`;

export const L = <T>(locale: Locale, ru: T, en: T): T => (locale === "ru" ? ru : en);
