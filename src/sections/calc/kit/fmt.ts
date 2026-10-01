import type { Locale } from "@/i18n/config";
import { formatNumber, formatSmart } from "@/i18n/format";

/** Output formatting shared by every calculator. Never use toFixed + regex trimming. */

export type Currency = "KZT" | "RUB" | "USD" | "EUR";
export const CURRENCIES: readonly Currency[] = ["KZT", "RUB", "USD", "EUR"];
export const CURRENCY_SYMBOL: Record<Currency, string> = { KZT: "₸", RUB: "₽", USD: "$", EUR: "€" };
/** Name of the minor unit, for texts like «округление до тиынов». */
export const MINOR_UNIT: Record<Locale, Record<Currency, string>> = {
  ru: { KZT: "тиын", RUB: "копейка", USD: "цент", EUR: "цент" },
  en: { KZT: "tiyn", RUB: "kopeck", USD: "cent", EUR: "cent" },
};

export function isCurrency(v: string): v is Currency {
  return (CURRENCIES as readonly string[]).includes(v);
}

/** Smart number: up to `maxFraction` decimals, grouping, no exponent for everyday values. */
export function fmtN(locale: Locale, n: number, maxFraction = 6): string {
  return formatSmart(locale, n, maxFraction);
}

/** Fixed decimals: fmtFixed("ru", 1234.5, 2) → "1 234,50". */
export function fmtFixed(locale: Locale, n: number, digits: number): string {
  if (!Number.isFinite(n)) return "—";
  return formatNumber(locale, n, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Up to `digits` decimals, trailing zeros dropped by Intl (never strips integer zeros). */
export function fmtRound(locale: Locale, n: number, digits: number): string {
  if (!Number.isFinite(n)) return "—";
  return formatNumber(locale, n, { maximumFractionDigits: digits });
}

/**
 * Money: "1 234,50 ₸" (ru) / "₸1,234.50" (en).
 * `digits` = 2 by default; pass 0 for whole units (e.g. KZ salary in tenge).
 */
export function fmtMoney(locale: Locale, n: number, cur: Currency = "KZT", digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const s = formatNumber(locale, Math.abs(n), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const sign = n < 0 && Math.abs(n) >= 0.5 * 10 ** -digits ? "−" : "";
  const sym = CURRENCY_SYMBOL[cur];
  return locale === "ru" ? `${sign}${s} ${sym}` : `${sign}${sym}${s}`;
}

/** Money without trailing ",00" for whole amounts: "1 000 ₸", "1 000,50 ₸". */
export function fmtMoneyShort(locale: Locale, n: number, cur: Currency = "KZT"): string {
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return fmtMoney(locale, n, cur, whole ? 0 : 2);
}

/** Percent: "12,5 %" (ru) / "12.5%" (en). */
export function fmtPct(locale: Locale, n: number, maxFraction = 2): string {
  if (!Number.isFinite(n)) return "—";
  const s = formatNumber(locale, n, { maximumFractionDigits: maxFraction });
  return locale === "ru" ? `${s} %` : `${s}%`;
}

/** Compact axis labels: 1 200 000 → "1,2 млн" / "1.2M". */
export function fmtCompact(locale: Locale, n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const units = locale === "ru" ? ["", "тыс.", "млн", "млрд", "трлн"] : ["", "K", "M", "B", "T"];
  let i = 0;
  let v = abs;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  const num = formatNumber(locale, v, { maximumFractionDigits: v < 10 && i > 0 ? 1 : 0 });
  const sign = n < 0 ? "−" : "";
  if (!units[i]) return sign + num;
  return locale === "ru" ? `${sign}${num} ${units[i]}` : `${sign}${num}${units[i]}`;
}
