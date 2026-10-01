import type { Locale } from "@/i18n/config";
import { parseLocaleNumber } from "../../shared/num";

/**
 * Descriptive statistics. Input is split by whitespace, new lines, tabs and semicolons —
 * NEVER by commas, because "1,5" is a Russian decimal number.
 */
export function parseData(locale: Locale, text: string): { values: number[]; invalid: string[] } {
  const values: number[] = [];
  const invalid: string[] = [];
  for (const tok of text.split(/[\s;]+/).filter(Boolean)) {
    const v = parseLocaleNumber(locale, tok);
    if (v === null) invalid.push(tok);
    else values.push(v);
  }
  return { values, invalid };
}

/** Quantile by linear interpolation between order statistics (R type 7, Excel QUARTILE.INC / PERCENTILE.INC). */
export function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

export interface Stats {
  n: number;
  sum: number;
  min: number;
  max: number;
  range: number;
  mean: number;
  median: number;
  /** All values sharing the highest frequency; empty when every value occurs once. */
  modes: number[];
  modeCount: number;
  varPop: number;
  varSample: number | null;
  sdPop: number;
  sdSample: number | null;
  q1: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  outliers: number[];
  /** Coefficient of variation (sample SD / mean), percent. */
  cv: number | null;
  /** Standard error of the mean (sample SD / √n). */
  se: number | null;
  geoMean: number | null;
  sorted: number[];
}

/** Kahan-compensated sum for accuracy with many values. */
function ksum(xs: number[]): number {
  let s = 0;
  let c = 0;
  for (const x of xs) {
    const y = x - c;
    const t = s + y;
    c = t - s - y;
    s = t;
  }
  return s;
}

export function describe(values: number[]): Stats | null {
  const n = values.length;
  if (n === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = ksum(sorted);
  const mean = sum / n;
  const ss = ksum(sorted.map((x) => (x - mean) ** 2));
  const varPop = ss / n;
  const varSample = n > 1 ? ss / (n - 1) : null;
  const freq = new Map<number, number>();
  for (const x of sorted) freq.set(x, (freq.get(x) ?? 0) + 1);
  const top = Math.max(...freq.values());
  const modes = top > 1 ? [...freq.entries()].filter(([, c]) => c === top).map(([x]) => x) : [];
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const sdSample = varSample === null ? null : Math.sqrt(varSample);
  return {
    n,
    sum,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    mean,
    median: quantile(sorted, 0.5),
    modes,
    modeCount: top,
    varPop,
    varSample,
    sdPop: Math.sqrt(varPop),
    sdSample,
    q1,
    q3,
    iqr,
    lowerFence,
    upperFence,
    outliers: sorted.filter((x) => x < lowerFence || x > upperFence),
    cv: sdSample !== null && mean !== 0 ? (sdSample / Math.abs(mean)) * 100 : null,
    se: sdSample !== null ? sdSample / Math.sqrt(n) : null,
    geoMean: sorted[0] > 0 ? Math.exp(ksum(sorted.map(Math.log)) / n) : null,
    sorted,
  };
}

/** Histogram bins (Sturges' rule). */
export function histogram(sorted: number[]): { from: number; to: number; count: number }[] {
  const n = sorted.length;
  if (n === 0) return [];
  const k = Math.max(1, Math.min(20, Math.ceil(Math.log2(n) + 1)));
  const lo = sorted[0];
  const hi = sorted[n - 1];
  if (hi === lo) return [{ from: lo, to: hi, count: n }];
  const w = (hi - lo) / k;
  const bins = Array.from({ length: k }, (_, i) => ({ from: lo + i * w, to: lo + (i + 1) * w, count: 0 }));
  for (const x of sorted) bins[Math.min(k - 1, Math.floor((x - lo) / w))].count++;
  return bins;
}
