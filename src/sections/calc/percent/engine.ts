import { tidy } from "../kit/math";

export const PERCENT_MODES = [
  "x-percent-of-y",
  "what-percent",
  "percent-change",
  "add-percent",
  "subtract-percent",
  "reverse-percent",
  "percentage-points",
] as const;
export type PercentMode = (typeof PERCENT_MODES)[number];

export function isPercentMode(v: string): v is PercentMode {
  return (PERCENT_MODES as readonly string[]).includes(v);
}

/** Default inputs per mode (a, b) — also used for SSR of the variant pages. */
export const PERCENT_DEFAULTS: Record<PercentMode, [number, number]> = {
  "x-percent-of-y": [15, 200],
  "what-percent": [30, 200],
  "percent-change": [80, 100],
  "add-percent": [1000, 16],
  "subtract-percent": [1000, 20],
  "reverse-percent": [30, 15],
  "percentage-points": [12, 16],
};

export type PercentResult =
  | { ok: true; value: number; unit: "num" | "pct" | "pp"; relative?: number; delta?: number }
  | { ok: false; error: "div0" };

/**
 * a, b meaning per mode:
 * - x-percent-of-y:    a % of b                  → b × a / 100
 * - what-percent:      a is what % of b          → a / b × 100
 * - percent-change:    from a to b               → (b − a) / |a| × 100
 * - add-percent:       a + b %                   → a × (1 + b / 100)
 * - subtract-percent:  a − b %                   → a × (1 − b / 100)
 * - reverse-percent:   a is b % of what          → a × 100 / b
 * - percentage-points: from a % to b %           → b − a (p.p.), relative (b − a) / a × 100
 */
export function computePercent(mode: PercentMode, a: number, b: number): PercentResult {
  switch (mode) {
    case "x-percent-of-y":
      return { ok: true, value: tidy((b * a) / 100), unit: "num" };
    case "what-percent":
      if (b === 0) return { ok: false, error: "div0" };
      return { ok: true, value: tidy((a / b) * 100), unit: "pct" };
    case "percent-change":
      if (a === 0) return { ok: false, error: "div0" };
      return { ok: true, value: tidy(((b - a) / Math.abs(a)) * 100), unit: "pct", delta: tidy(b - a) };
    case "add-percent":
      return { ok: true, value: tidy(a * (1 + b / 100)), unit: "num", delta: tidy((a * b) / 100) };
    case "subtract-percent":
      return { ok: true, value: tidy(a * (1 - b / 100)), unit: "num", delta: tidy((a * b) / 100) };
    case "reverse-percent":
      if (b === 0) return { ok: false, error: "div0" };
      return { ok: true, value: tidy((a * 100) / b), unit: "num" };
    case "percentage-points":
      return { ok: true, value: tidy(b - a), unit: "pp", relative: a === 0 ? undefined : tidy(((b - a) / Math.abs(a)) * 100) };
  }
}
