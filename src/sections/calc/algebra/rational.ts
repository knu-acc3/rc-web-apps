/** Exact rational numbers on BigInt. Always normalised: denominator > 0, gcd(num, den) = 1. */

export interface Q {
  n: bigint;
  d: bigint;
}

export const babs = (a: bigint) => (a < 0n ? -a : a);

export function bgcd(a: bigint, b: bigint): bigint {
  a = babs(a);
  b = babs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export const blcm = (a: bigint, b: bigint) => (a === 0n || b === 0n ? 0n : babs(a / bgcd(a, b) * b));

export function q(n: bigint | number, d: bigint | number = 1n): Q {
  let N = BigInt(n);
  let D = BigInt(d);
  if (D === 0n) throw new RangeError("division by zero");
  if (D < 0n) {
    N = -N;
    D = -D;
  }
  const g = bgcd(N, D) || 1n;
  return { n: N / g, d: D / g };
}

export const ZERO = q(0);
export const ONE = q(1);
export const add = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
export const div = (a: Q, b: Q) => {
  if (b.n === 0n) throw new RangeError("division by zero");
  return q(a.n * b.d, a.d * b.n);
};
export const neg = (a: Q): Q => ({ n: -a.n, d: a.d });
export const isZero = (a: Q) => a.n === 0n;
export const eq = (a: Q, b: Q) => a.n === b.n && a.d === b.d;
export const cmp = (a: Q, b: Q) => {
  const x = a.n * b.d - b.n * a.d;
  return x < 0n ? -1 : x > 0n ? 1 : 0;
};
export const isInt = (a: Q) => a.d === 1n;

/** Accurate conversion to a float even for huge numerators/denominators. */
export function toNumber(a: Q): number {
  const n = Number(a.n);
  const d = Number(a.d);
  if (Number.isFinite(n) && Number.isFinite(d)) return n / d;
  // scale down big values
  const shift = BigInt(Math.max(a.n.toString().length, a.d.toString().length) - 300);
  const s = 10n ** (shift > 0n ? shift : 0n);
  return Number(a.n / s) / Number(a.d / s);
}

/** "3/4", "-5", "7/2". */
export function toText(a: Q, minus = "−"): string {
  const s = a.n < 0n ? minus : "";
  return a.d === 1n ? `${s}${babs(a.n)}` : `${s}${babs(a.n)}/${a.d}`;
}

export interface Mixed {
  negative: boolean;
  whole: bigint;
  num: bigint;
  den: bigint;
}

export function toMixed(a: Q): Mixed {
  const negative = a.n < 0n;
  const n = babs(a.n);
  return { negative, whole: n / a.d, num: n % a.d, den: a.d };
}

/**
 * Parse user input into an exact rational:
 * integers "−12", fractions "3/4", mixed numbers "1 2/3" (or "1_2/3"), decimals "0,125" / "0.125",
 * repeating decimals "0,(3)" or "1.2(34)". Thousands spaces are not allowed here (a space means "mixed").
 */
export function parseQ(text: string): Q | null {
  const s = text.trim().replace(/[−–]/g, "-").replace(/\s+/g, " ");
  if (!s) return null;
  let m = /^([-+]?)(\d+)[ _](\d+)\/(\d+)$/.exec(s);
  if (m) {
    const den = BigInt(m[4]);
    if (den === 0n) return null;
    const v = q(BigInt(m[2]) * den + BigInt(m[3]), den);
    return m[1] === "-" ? neg(v) : v;
  }
  m = /^([-+]?)(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/.exec(s);
  if (m) {
    const a = decimalQ(m[2]);
    const b = decimalQ(m[3]);
    if (!a || !b || isZero(b)) return null;
    const v = div(a, b);
    return m[1] === "-" ? neg(v) : v;
  }
  m = /^([-+]?)(\d*)(?:[.,](\d*)(?:\((\d+)\))?)?$/.exec(s);
  if (m && (m[2] || m[3] || m[4])) {
    const intPart = m[2] || "0";
    const fixed = m[3] ?? "";
    const rep = m[4] ?? "";
    let v: Q;
    if (rep) {
      // x = int.fixed(rep): (int fixed rep − int fixed) / (10^|fixed| × (10^|rep| − 1))
      const all = BigInt(intPart + fixed + rep);
      const head = BigInt(intPart + fixed);
      v = q(all - head, 10n ** BigInt(fixed.length) * (10n ** BigInt(rep.length) - 1n));
    } else v = q(BigInt(intPart + fixed), 10n ** BigInt(fixed.length));
    return m[1] === "-" ? neg(v) : v;
  }
  return null;
}

function decimalQ(s: string): Q | null {
  const m = /^(\d+)(?:[.,](\d+))?$/.exec(s);
  if (!m) return null;
  const f = m[2] ?? "";
  return q(BigInt(m[1] + f), 10n ** BigInt(f.length));
}

/**
 * Decimal expansion with the repeating part detected by long division:
 * 1/3 → { int: "0", fixed: "", repeat: "3" }, 1/8 → { fixed: "125" }, 7/12 → { fixed: "58", repeat: "3" }.
 * Stops after `limit` digits (repeat = null, truncated = true).
 */
export function decimalExpansion(a: Q, limit = 200): { negative: boolean; int: string; fixed: string; repeat: string | null; truncated: boolean } {
  const negative = a.n < 0n;
  const n = babs(a.n);
  const int = (n / a.d).toString();
  let r = n % a.d;
  const seen = new Map<bigint, number>();
  let digits = "";
  while (r !== 0n && digits.length < limit) {
    if (seen.has(r)) {
      const at = seen.get(r)!;
      return { negative, int, fixed: digits.slice(0, at), repeat: digits.slice(at), truncated: false };
    }
    seen.set(r, digits.length);
    r *= 10n;
    digits += (r / a.d).toString();
    r %= a.d;
  }
  return { negative, int, fixed: digits, repeat: null, truncated: r !== 0n };
}

/** Best rational approximation with denominator ≤ maxDen (continued fractions). */
export function approximate(x: number, maxDen = 1_000_000): Q {
  if (!Number.isFinite(x)) throw new RangeError("not finite");
  const sign = x < 0 ? -1n : 1n;
  let v = Math.abs(x);
  let h0 = 0n, h1 = 1n, k0 = 1n, k1 = 0n;
  for (let i = 0; i < 64; i++) {
    const a = BigInt(Math.floor(v));
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > BigInt(maxDen)) break;
    [h0, h1, k0, k1] = [h1, h2, k1, k2];
    const frac = v - Math.floor(v);
    if (frac < 1e-12) break;
    v = 1 / frac;
  }
  return q(sign * h1, k1 || 1n);
}
