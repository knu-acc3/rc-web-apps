/** Minimal unit shape needed for conversion (shared by server and client). */
export interface ConvUnit {
  kind?: "linear" | "affine" | "reciprocal";
  factor: number;
  offset?: number;
}

function toBase(u: ConvUnit, v: number): number {
  if (u.kind === "reciprocal") return v === 0 ? Infinity : u.factor / v;
  return v * u.factor + (u.offset ?? 0);
}

function fromBase(u: ConvUnit, b: number): number {
  if (u.kind === "reciprocal") return b === 0 ? Infinity : u.factor / b;
  return (b - (u.offset ?? 0)) / u.factor;
}

export function convert(v: number, from: ConvUnit, to: ConvUnit): number {
  return fromBase(to, toBase(from, v));
}

/** Round away floating-point noise (0.30000000000000004 → 0.3) keeping 12 significant digits. */
export function clean(n: number): number {
  if (!Number.isFinite(n) || n === 0) return n;
  return Number(n.toPrecision(12));
}

/**
 * Describe the conversion B = A × m + c (linear/affine) or B = k / A (reciprocal).
 */
export function relation(from: ConvUnit, to: ConvUnit): { type: "mul"; m: number; c: number } | { type: "div"; k: number } {
  const fr = from.kind === "reciprocal";
  const tr = to.kind === "reciprocal";
  if (fr !== tr) {
    // one side reciprocal: B = k / A
    return { type: "div", k: clean(convert(1, from, to)) };
  }
  if (fr && tr) return { type: "mul", m: clean(from.factor === 0 ? 0 : to.factor / from.factor), c: 0 };
  const m = from.factor / to.factor;
  const c = ((from.offset ?? 0) - (to.offset ?? 0)) / to.factor;
  return { type: "mul", m: clean(m), c: clean(c) };
}
