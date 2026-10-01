import { factorize } from "../bigint/nt";

/** n-th root, allowing odd roots of negative numbers. */
export function nthRoot(x: number, n: number): number {
  if (n === 0) return NaN;
  if (x < 0) return Number.isInteger(n) && Math.abs(n) % 2 === 1 ? -Math.pow(-x, 1 / n) : NaN;
  const r = Math.pow(x, 1 / n);
  const rr = Math.round(r);
  return Math.abs(rr ** n - x) < 1e-9 * Math.max(1, Math.abs(x)) ? rr : r;
}

/** Simplify ⁿ√x for a positive integer x: √72 = 6√2 → { outside: 6, inside: 2 }. */
export function simplifyRadical(x: number, n: number): { outside: bigint; inside: bigint } | null {
  if (!Number.isInteger(x) || x < 1 || x > 1e15 || !Number.isInteger(n) || n < 2 || n > 10) return null;
  let outside = 1n;
  let inside = 1n;
  for (const [p, e] of factorize(BigInt(x))) {
    outside *= p ** BigInt(Math.floor(e / n));
    inside *= p ** BigInt(e % n);
  }
  return { outside, inside };
}

/** Exact integer power when feasible (|result| up to ~20 000 digits), else null. */
export function exactPower(a: number, b: number): bigint | null {
  if (!Number.isInteger(a) || !Number.isInteger(b) || b < 0) return null;
  if (a === 0 || Math.abs(a) === 1) return BigInt(a) ** BigInt(b);
  if (b * Math.log10(Math.abs(a)) > 20000) return null;
  return BigInt(a) ** BigInt(b);
}

export function logBase(x: number, base: number): number {
  if (x <= 0 || base <= 0 || base === 1) return NaN;
  const r = Math.log(x) / Math.log(base);
  const rr = Math.round(r);
  return Math.abs(r - rr) < 1e-12 ? rr : r;
}
