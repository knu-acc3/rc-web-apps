/** Small numeric helpers shared by the engines (pure). */

/** Remove binary floating-point noise: 0.1 + 0.2 → 0.3, 1.1 × 7 / 100 → 0.077. */
export function tidy(n: number, significant = 12): number {
  if (!Number.isFinite(n) || n === 0) return n;
  return Number(n.toPrecision(significant));
}

/** Round half away from zero to `digits` decimals, robust to binary noise (1.005 → 1.01). */
export function roundTo(n: number, digits = 2): number {
  if (!Number.isFinite(n)) return n;
  const f = 10 ** digits;
  const x = Math.abs(n) * f;
  const r = Math.round(Number(x.toPrecision(15)));
  return (Math.sign(n) * r) / f || 0;
}

/** Round to whole minor units (kopecks/tiyn/cents): 12.345 → 1235 (half away from zero). */
export function toMinor(n: number): number {
  return Math.sign(n) * Math.round(Number((Math.abs(n) * 100).toPrecision(15))) || 0;
}

