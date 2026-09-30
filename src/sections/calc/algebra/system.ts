import { det, rref, type M } from "./matrix";
import { div, isZero, type Q } from "./rational";

/** Linear systems 2×2 and 3×3 by Cramer's rule (exact), with a rank check for singular systems. */

export type SystemResult =
  | { kind: "one"; x: Q[]; D: Q; Di: Q[] }
  | { kind: "none"; D: Q }
  | { kind: "infinite"; D: Q; rank: number };

export function solveSystem(A: M, b: Q[]): SystemResult {
  const n = A.length;
  const D = det(A)!;
  if (!isZero(D)) {
    const Di = Array.from({ length: n }, (_, k) => det(A.map((row, i) => row.map((v, j) => (j === k ? b[i] : v))))!);
    return { kind: "one", x: Di.map((d) => div(d, D)), D, Di };
  }
  const rA = rref(A).rank;
  const rAug = rref(A.map((row, i) => [...row, b[i]])).rank;
  return rAug > rA ? { kind: "none", D } : { kind: "infinite", D, rank: rA };
}
