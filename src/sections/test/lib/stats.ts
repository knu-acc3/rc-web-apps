/** Small, dependency-free statistics helpers shared by the device tests. */

export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return NaN;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Median (average of the two middle values for even-length input). */
export function median(xs: readonly number[]): number {
  if (xs.length === 0) return NaN;
  const a = [...xs].sort((p, q) => p - q);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Population standard deviation. */
export function stdDev(xs: readonly number[]): number {
  if (xs.length === 0) return NaN;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return Math.sqrt(s / xs.length);
}

/** Percentile with linear interpolation, p in [0, 100]. */
export function percentile(xs: readonly number[], p: number): number {
  if (xs.length === 0) return NaN;
  const a = [...xs].sort((u, v) => u - v);
  const rank = (Math.min(100, Math.max(0, p)) / 100) * (a.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return a[lo] + (a[hi] - a[lo]) * (rank - lo);
}

/** Differences between consecutive timestamps. */
export function intervals(timestamps: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < timestamps.length; i++) out.push(timestamps[i] - timestamps[i - 1]);
  return out;
}
