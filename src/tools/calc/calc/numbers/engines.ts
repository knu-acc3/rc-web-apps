import { babs, bgcd, blcm, div, mul, q, sub, type Q } from "../algebra/rational";

/* ───────────── Proportion (rule of three) ───────────── */

/** x1 ↔ y1, x2 ↔ ?  Direct: y2 = y1·x2/x1. Inverse: y2 = y1·x1/x2. */
export function ruleOfThree(x1: number, y1: number, x2: number, inverse = false): number | null {
  if (inverse) return x2 === 0 ? null : (y1 * x1) / x2;
  return x1 === 0 ? null : (y1 * x2) / x1;
}

/** Map scale 1 : S. Map distance in cm → ground distance in metres. */
export const mapToGround = (cm: number, scale: number) => (cm * scale) / 100;
/** Ground distance in metres → map distance in cm. */
export const groundToMap = (m: number, scale: number) => (m * 100) / scale;

/* ───────────── Averages ───────────── */

export const arithmeticMean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const geometricMean = (xs: number[]) => (xs.length && xs.every((x) => x > 0) ? Math.exp(xs.reduce((a, b) => a + Math.log(b), 0) / xs.length) : NaN);
export const harmonicMean = (xs: number[]) => (xs.length && xs.every((x) => x !== 0) ? xs.length / xs.reduce((a, b) => a + 1 / b, 0) : NaN);
export function weightedMean(pairs: [number, number][]): number {
  const w = pairs.reduce((a, [, b]) => a + b, 0);
  return w === 0 ? NaN : pairs.reduce((a, [x, k]) => a + x * k, 0) / w;
}
export function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* ───────────── Exact decimal rounding ───────────── */

export type RoundMode = "half-up" | "half-even" | "half-down" | "floor" | "ceil" | "trunc";
export const ROUND_MODES: readonly RoundMode[] = ["half-up", "half-even", "half-down", "floor", "ceil", "trunc"];

/** Parse a typed decimal exactly: "−1 234,5678" → 12345678/10000. */
export function parseDecimal(text: string): Q | null {
  const s = text.trim().replace(/[\s  ']/g, "").replace(/[−–]/g, "-").replace(",", ".");
  const m = /^([-+]?)(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (!m[2] && !m[3])) return null;
  const f = m[3] ?? "";
  const v = q(BigInt((m[2] || "0") + f), 10n ** BigInt(f.length));
  return m[1] === "-" ? q(-v.n, v.d) : v;
}

/** Round x to a multiple of `step` (> 0) with the given mode, exactly. */
export function roundTo(x: Q, step: Q, mode: RoundMode): Q {
  const k = div(x, step); // k = n/d
  const n = k.n;
  const d = k.d;
  const fl = n >= 0n ? n / d : -((-n + d - 1n) / d); // floor
  const frac = sub(k, q(fl)); // 0 ≤ frac < 1
  let r: bigint;
  if (frac.n === 0n) r = fl;
  else if (mode === "floor") r = fl;
  else if (mode === "ceil") r = fl + 1n;
  else if (mode === "trunc") r = n >= 0n ? fl : fl + 1n;
  else {
    const twice = frac.n * 2n; // compare frac with 1/2: twice vs d
    const cmp = twice === frac.d ? 0 : twice > frac.d ? 1 : -1;
    if (cmp > 0) r = fl + 1n;
    else if (cmp < 0) r = fl;
    else if (mode === "half-even") r = fl % 2n === 0n ? fl : fl + 1n;
    else if (mode === "half-down") r = n >= 0n ? fl : fl + 1n; // towards zero
    else r = n >= 0n ? fl + 1n : fl; // half-up = away from zero
  }
  return mul(q(r), step);
}

const pow10 = (e: number): Q => (e >= 0 ? q(10n ** BigInt(e)) : q(1n, 10n ** BigInt(-e)));

export const roundDecimals = (x: Q, digits: number, mode: RoundMode) => roundTo(x, pow10(-digits), mode);

/** floor(log10 |x|) for x ≠ 0, exactly. */
export function magnitude(x: Q): number {
  const n = babs(x.n);
  let e = n.toString().length - x.d.toString().length;
  const ge = (k: number) => (k >= 0 ? n >= x.d * 10n ** BigInt(k) : n * 10n ** BigInt(-k) >= x.d);
  while (!ge(e)) e--;
  while (ge(e + 1)) e++;
  return e;
}

export function roundSignificant(x: Q, sig: number, mode: RoundMode): Q {
  if (x.n === 0n) return x;
  return roundTo(x, pow10(magnitude(x) - sig + 1), mode);
}

/** Exact decimal text of a terminating rational: 12345/100 → "123.45". */
export function decimalText(x: Q, sep = "."): string {
  let k = x.d;
  let twos = 0;
  let fives = 0;
  while (k % 2n === 0n) {
    k /= 2n;
    twos++;
  }
  while (k % 5n === 0n) {
    k /= 5n;
    fives++;
  }
  if (k !== 1n) return String(Number(x.n) / Number(x.d)).replace(".", sep); // not a terminating decimal
  const scale = Math.max(twos, fives);
  const n = (babs(x.n) * 10n ** BigInt(scale)) / x.d;
  const s = n.toString().padStart(scale + 1, "0");
  const int = s.slice(0, s.length - scale);
  const frac = s.slice(s.length - scale);
  return `${x.n < 0n ? "-" : ""}${int}${scale ? sep + frac : ""}`;
}

/* ───────────── Ratios ───────────── */

/** Simplify a ratio of exact decimals to the smallest whole numbers: 1.5 : 2.25 → 2 : 3. */
export function simplifyRatio(parts: Q[]): bigint[] | null {
  if (!parts.length || parts.every((p) => p.n === 0n)) return null;
  const L = parts.reduce((l, p) => blcm(l, p.d), 1n);
  const ints = parts.map((p) => (p.n * L) / p.d);
  const g = ints.reduce((a, b) => bgcd(a, b), 0n) || 1n;
  return ints.map((x) => x / g);
}

/**
 * Split `total` (in minor units) in the given ratio so the parts add up exactly
 * (largest-remainder method).
 */
export function splitInRatio(total: bigint, ratio: bigint[]): bigint[] {
  const sum = ratio.reduce((a, b) => a + b, 0n);
  if (sum === 0n) return ratio.map(() => 0n);
  const base = ratio.map((r) => (total * r) / sum);
  const rems = ratio.map((r, i) => ({ i, rem: total * r - base[i] * sum }));
  let left = total - base.reduce((a, b) => a + b, 0n);
  rems.sort((a, b) => (b.rem > a.rem ? 1 : b.rem < a.rem ? -1 : a.i - b.i));
  for (const { i } of rems) {
    if (left <= 0n) break;
    base[i] += 1n;
    left -= 1n;
  }
  return base;
}

