import { randomInt, sampleIndices } from "./rng";

export const MAX_COUNT = 10000;
export const MAX_DECIMALS = 6;

interface NumberSpec {
  min: number;
  max: number;
  /** 0 = integers; otherwise numbers on a grid with this many decimal places. */
  decimals: number;
}

/**
 * The set of possible values as integers lo…hi scaled by 10^decimals.
 * Returns null for an empty or too large range.
 */
export function numberGrid({ min, max, decimals }: NumberSpec): { lo: number; hi: number; scale: number; size: number } | null {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) return null;
  const scale = 10 ** decimals;
  // Snap values that are integers on the grid up to rounding noise (0.1 × 10 = 1.0000000000000002).
  const snap = (x: number) => (Math.abs(x - Math.round(x)) < 1e-7 ? Math.round(x) : x);
  const lo = Math.ceil(snap(min * scale));
  const hi = Math.floor(snap(max * scale));
  if (!Number.isSafeInteger(lo) || !Number.isSafeInteger(hi) || hi < lo) return null;
  const size = hi - lo + 1;
  if (!Number.isSafeInteger(size)) return null;
  return { lo, hi, scale, size };
}

export type NumberError = "range" | "count" | "unique";

export function generateNumbers(spec: NumberSpec, count: number, unique: boolean, sorted: boolean): { ok: true; values: number[] } | { ok: false; error: NumberError } {
  const g = numberGrid(spec);
  if (!g) return { ok: false, error: "range" };
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) return { ok: false, error: "count" };
  if (unique && count > g.size) return { ok: false, error: "unique" };
  const idx = unique ? sampleIndices(g.size, count) : Array.from({ length: count }, () => randomInt(g.size));
  const values = idx.map((i) => (g.lo + i) / g.scale);
  if (sorted) values.sort((a, b) => a - b);
  return { ok: true, values };
}
