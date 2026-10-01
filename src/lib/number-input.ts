/* Pure helpers of NumberInput (src/ui/number-input.tsx), unit-tested. */

/** "1 234,5" / "1234.5" / "−3" → number; empty or junk → null. */
export function parseNum(text: string): number | null {
  const t = text.replace(/[\s  ]/g, "").replace(/[−–]/g, "-").replace(",", ".");
  if (t === "" || t === "-" || t === "." || t === "-.") return null;
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Keep `n` inside [min, max] and round it to `decimals` places. */
export function clampNum(n: number, min: number, max: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.min(max, Math.max(min, Math.round(n * f) / f));
}

/** One press of − / +: moves to the next multiple of `step` (so 7 + 5 → 10, not 12), then clamps. */
export function stepValue(value: number | null, dir: 1 | -1, step: number, min: number, max: number, decimals = 0): number {
  const base = value ?? (dir > 0 ? Math.max(min, 0) - step : Math.min(max, 0) + step);
  const k = base / step;
  const snapped = Math.abs(k - Math.round(k)) < 1e-9 ? Math.round(k) + dir : dir > 0 ? Math.ceil(k) : Math.floor(k);
  return clampNum(snapped * step, min, max, decimals);
}

/** Text shown for a value: no trailing zeros, comma decimals for Russian. */
export function formatNum(n: number | null, decimals: number, locale: "ru" | "en" = "en"): string {
  if (n === null) return "";
  const s = String(Number(n.toFixed(decimals)));
  return locale === "ru" ? s.replace(".", ",") : s;
}
