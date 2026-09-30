import type { Locale } from "@/i18n/config";

const cache = new Map<Locale, Intl.NumberFormat>();

/** Group a BigInt by thousands ("2 598 960" / "2,598,960"); very long numbers are left ungrouped. */
export function fmtBig(locale: Locale, n: bigint): string {
  const s = n.toString();
  if (s.length > 60) return s.replace("-", "−");
  let nf = cache.get(locale);
  if (!nf) {
    nf = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US");
    cache.set(locale, nf);
  }
  return nf.format(n).replace("-", "−");
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
export const sup = (n: number | bigint) => String(n).split("").map((c) => SUP[c] ?? c).join("");

/** "2³ · 3² · 5" */
export function factorText(f: [bigint, number][]): string {
  return f.map(([p, e]) => (e > 1 ? `${p}${sup(e)}` : String(p))).join(" · ");
}
