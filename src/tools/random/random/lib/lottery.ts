import { sampleIndices } from "./rng";

/** One drum: pick `pick` distinct numbers from 1…`of`. */
export interface LotteryField {
  pick: number;
  of: number;
}

/** Exact binomial coefficient C(n, k). */
export function binomial(n: number, k: number): bigint {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || n < 0 || k > n) return 0n;
  const kk = Math.min(k, n - k);
  let r = 1n;
  for (let i = 1; i <= kk; i++) r = (r * BigInt(n - kk + i)) / BigInt(i);
  return r;
}

/** Number of different tickets = odds of matching every number on every field: 1 in N. */
export function jackpotCombinations(fields: readonly LotteryField[]): bigint {
  return fields.reduce((acc, f) => acc * binomial(f.of, f.pick), 1n);
}

/**
 * Hypergeometric counts for one field: how many tickets match exactly m of the
 * drawn numbers, for m = 0…pick. Probabilities are counts / C(of, pick).
 */
export function matchCounts(f: LotteryField): bigint[] {
  const out: bigint[] = [];
  for (let m = 0; m <= f.pick; m++) out.push(binomial(f.pick, m) * binomial(f.of - f.pick, f.pick - m));
  return out;
}

/** Draw one ticket: for every field, `pick` distinct numbers from 1…of, sorted ascending. */
export function drawTicket(fields: readonly LotteryField[]): number[][] {
  return fields.map((f) => sampleIndices(f.of, f.pick).map((i) => i + 1).sort((a, b) => a - b));
}

export function validField(f: LotteryField): boolean {
  return Number.isInteger(f.pick) && Number.isInteger(f.of) && f.pick >= 1 && f.pick <= 100 && f.of >= 2 && f.of <= 1000 && f.pick < f.of;
}
