import { cubic, quadratic, type Complex } from "./poly";
import { add, div, isZero, mul, neg, ONE, sub, toNumber, toText, ZERO, type Q } from "./rational";

/** Exact matrix algebra on rationals. A matrix is Q[rows][cols]. */
export type M = Q[][];

const dims = (a: M) => [a.length, a[0]?.length ?? 0] as const;
const clone = (a: M): M => a.map((r) => r.slice());
const identity = (n: number): M => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)));

export function madd(a: M, b: M, minus = false): M | null {
  const [r, c] = dims(a);
  const [r2, c2] = dims(b);
  if (r !== r2 || c !== c2) return null;
  return a.map((row, i) => row.map((x, j) => (minus ? sub(x, b[i][j]) : add(x, b[i][j]))));
}

export function mmul(a: M, b: M): M | null {
  const [r, c] = dims(a);
  const [r2, c2] = dims(b);
  if (c !== r2) return null;
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c2 }, (_, j) => {
      let s = ZERO;
      for (let k = 0; k < c; k++) s = add(s, mul(a[i][k], b[k][j]));
      return s;
    }),
  );
}

export const scale = (a: M, k: Q): M => a.map((r) => r.map((x) => mul(x, k)));
export const transpose = (a: M): M => (a[0] ?? []).map((_, j) => a.map((r) => r[j]));

/** Determinant by exact Gaussian elimination. */
export function det(a: M): Q | null {
  const [n, c] = dims(a);
  if (n !== c || n === 0) return null;
  const m = clone(a);
  let d = ONE;
  for (let col = 0; col < n; col++) {
    let piv = col;
    while (piv < n && isZero(m[piv][col])) piv++;
    if (piv === n) return ZERO;
    if (piv !== col) {
      [m[piv], m[col]] = [m[col], m[piv]];
      d = neg(d);
    }
    d = mul(d, m[col][col]);
    for (let r = col + 1; r < n; r++) {
      if (isZero(m[r][col])) continue;
      const f = div(m[r][col], m[col][col]);
      for (let k = col; k < n; k++) m[r][k] = sub(m[r][k], mul(f, m[col][k]));
    }
  }
  return d;
}

interface RrefResult {
  R: M;
  rank: number;
  pivots: number[];
  /** Row operations, e.g. "R2 − 3·R1 → R2", "R1 ↔ R2", "R1 / 2 → R1". */
  ops: string[];
}

/** Reduced row echelon form with the list of elementary row operations. */
export function rref(a: M, maxOps = 200): RrefResult {
  const m = clone(a);
  const [rows, cols] = dims(m);
  const ops: string[] = [];
  const pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c++) {
    let piv = r;
    while (piv < rows && isZero(m[piv][c])) piv++;
    if (piv === rows) continue;
    if (piv !== r) {
      [m[piv], m[r]] = [m[r], m[piv]];
      if (ops.length < maxOps) ops.push(`R${r + 1} ↔ R${piv + 1}`);
    }
    const pv = m[r][c];
    if (!(pv.n === 1n && pv.d === 1n)) {
      m[r] = m[r].map((x) => div(x, pv));
      if (ops.length < maxOps) ops.push(`R${r + 1} ÷ ${fmtQ(pv)} → R${r + 1}`);
    }
    for (let i = 0; i < rows; i++) {
      if (i === r || isZero(m[i][c])) continue;
      const f = m[i][c];
      m[i] = m[i].map((x, k) => sub(x, mul(f, m[r][k])));
      if (ops.length < maxOps) ops.push(`R${i + 1} ${f.n < 0n ? "+" : "−"} ${fmtQ(f.n < 0n ? neg(f) : f)}·R${r + 1} → R${i + 1}`);
    }
    pivots.push(c);
    r++;
  }
  return { R: m, rank: r, pivots, ops };
}

const fmtQ = (x: Q) => (x.d === 1n ? toText(x) : `(${toText(x)})`);

export function rank(a: M): number {
  return rref(a).rank;
}

/** Inverse by Gauss–Jordan on [A | I]; null when singular or not square. */
export function inverse(a: M): M | null {
  const [n, c] = dims(a);
  if (n !== c || n === 0) return null;
  const aug = a.map((row, i) => [...row, ...identity(n)[i]]);
  const { R, rank: rk } = rref(aug);
  // the left block must be the identity
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!(i === j ? R[i][j].n === 1n && R[i][j].d === 1n : isZero(R[i][j]))) return null;
  if (rk < n) return null;
  return R.map((row) => row.slice(n));
}

/** Eigenvalues of a 2×2 or 3×3 matrix (numeric, complex allowed) via the characteristic polynomial. */
export function eigenvalues(a: M): { roots: Complex[]; charPoly: number[] } | null {
  const [n, c] = dims(a);
  if (n !== c || (n !== 2 && n !== 3)) return null;
  const x = a.map((r) => r.map(toNumber));
  if (n === 2) {
    const tr = x[0][0] + x[1][1];
    const dt = x[0][0] * x[1][1] - x[0][1] * x[1][0];
    const r = quadratic("en", 1, -tr, dt);
    return { roots: r.roots, charPoly: [1, -tr, dt] };
  }
  const tr = x[0][0] + x[1][1] + x[2][2];
  const minors = x[0][0] * x[1][1] - x[0][1] * x[1][0] + (x[0][0] * x[2][2] - x[0][2] * x[2][0]) + (x[1][1] * x[2][2] - x[1][2] * x[2][1]);
  const dt = toNumber(det(a)!);
  const r = cubic(1, -tr, minors, -dt);
  return { roots: r.roots, charPoly: [1, -tr, minors, -dt] };
}

/** Parse a matrix cell ("3", "−1/2", "0,25", empty = 0). */
