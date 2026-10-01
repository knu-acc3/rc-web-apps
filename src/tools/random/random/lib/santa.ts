import { randomInt } from "./rng";

/**
 * Secret Santa draw: every participant gives exactly one gift and receives exactly
 * one, nobody draws themselves, and excluded pairs never draw each other (in
 * either direction).
 *
 * The draw is a uniformly random permutation conditioned on those rules
 * (rejection sampling), so every valid assignment is equally likely.
 */

export type SantaError = "few" | "impossible" | "noRecipient" | "noGiver" | "tooConstrained";

type SantaResult =
  | { ok: true; assignment: number[] }
  | { ok: false; error: SantaError; person?: number };

export const SANTA_MIN = 3;
export const SANTA_MAX = 200;

/** allowed[g][r]: may giver g draw receiver r? */
export function allowedMatrix(n: number, exclusions: readonly (readonly [number, number])[]): boolean[][] {
  const m = Array.from({ length: n }, (_, g) => Array.from({ length: n }, (_, r) => g !== r));
  for (const [a, b] of exclusions) {
    if (a < 0 || b < 0 || a >= n || b >= n) continue;
    m[a][b] = false;
    m[b][a] = false;
  }
  return m;
}

/** Does at least one valid assignment exist? (bipartite perfect matching, Kuhn's algorithm) */
export function hasValidAssignment(allowed: readonly (readonly boolean[])[]): boolean {
  const n = allowed.length;
  const matchR = new Array<number>(n).fill(-1);
  const tryKuhn = (g: number, seen: boolean[]): boolean => {
    for (let r = 0; r < n; r++) {
      if (!allowed[g][r] || seen[r]) continue;
      seen[r] = true;
      if (matchR[r] < 0 || tryKuhn(matchR[r], seen)) {
        matchR[r] = g;
        return true;
      }
    }
    return false;
  };
  for (let g = 0; g < n; g++) if (!tryKuhn(g, new Array<boolean>(n).fill(false))) return false;
  return true;
}

export function isValidAssignment(assignment: readonly number[], allowed: readonly (readonly boolean[])[]): boolean {
  const n = allowed.length;
  if (assignment.length !== n) return false;
  const seen = new Set<number>();
  for (let g = 0; g < n; g++) {
    const r = assignment[g];
    if (!allowed[g][r] || seen.has(r)) return false;
    seen.add(r);
  }
  return true;
}

/**
 * Draw an assignment (giver index → receiver index). Diagnoses impossible
 * constraint sets before sampling so the user gets a clear reason.
 */
export function drawSecretSanta(n: number, exclusions: readonly (readonly [number, number])[] = [], maxAttempts = 50000): SantaResult {
  if (n < SANTA_MIN) return { ok: false, error: "few" };
  const allowed = allowedMatrix(n, exclusions);
  for (let g = 0; g < n; g++) if (!allowed[g].some(Boolean)) return { ok: false, error: "noRecipient", person: g };
  for (let r = 0; r < n; r++) if (!allowed.some((row) => row[r])) return { ok: false, error: "noGiver", person: r };
  if (!hasValidAssignment(allowed)) return { ok: false, error: "impossible" };

  const perm = new Array<number>(n);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (let i = 0; i < n; i++) perm[i] = i;
    // Fisher–Yates from the end; position i is final after its step, so a
    // forbidden value lets us abandon the attempt early (still exact rejection).
    let ok = true;
    for (let i = n - 1; i >= 0; i--) {
      const j = randomInt(i + 1);
      const t = perm[i];
      perm[i] = perm[j];
      perm[j] = t;
      if (!allowed[i][perm[i]]) {
        ok = false;
        break;
      }
    }
    if (ok) return { ok: true, assignment: perm.slice() };
  }
  return { ok: false, error: "tooConstrained" };
}
