import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";

/**
 * Append optional sentence parts while the text stays within `max` characters (meta descriptions).
 * An array item is a list of alternatives: the first one that fits is used.
 */
export function fit(base: string, extras: (string | string[])[], max = 160): string {
  let s = base;
  for (const e of extras) {
    const pick = (Array.isArray(e) ? e : [e]).find((o) => o && (s + o).length <= max);
    if (pick) s += pick;
  }
  return s;
}

/** Numbers below 10 000 are written without a group separator (years, "1000 прописью"). */
export function num(n: number, locale: Locale): string {
  return Math.abs(n) < 10_000 ? String(n) : formatNumber(locale, n);
}
