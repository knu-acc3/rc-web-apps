import { median } from "./stats";
import { randomInt, type RandomFill } from "./secure-random";

export const REACTION_ATTEMPTS = 5;
export const MIN_DELAY_MS = 1500;
export const MAX_DELAY_MS = 4000;

/** Unpredictable wait before the "go" signal, uniform in [1500, 4000] ms. */
export function randomDelayMs(fill?: RandomFill): number {
  return randomInt(MIN_DELAY_MS, MAX_DELAY_MS, fill);
}

export interface ReactionStats {
  count: number;
  average: number;
  median: number;
  best: number;
  worst: number;
}

export function reactionStats(times: readonly number[]): ReactionStats | null {
  const xs = times.filter((x) => Number.isFinite(x) && x > 0);
  if (xs.length === 0) return null;
  const sum = xs.reduce((a, b) => a + b, 0);
  return {
    count: xs.length,
    average: sum / xs.length,
    median: median(xs),
    best: Math.min(...xs),
    worst: Math.max(...xs),
  };
}

export type ReactionRating = "excellent" | "good" | "average" | "below" | "slow";

/** Rating of an average visual reaction time measured in a browser (includes device latency). */
export function reactionRating(ms: number): ReactionRating {
  if (ms < 200) return "excellent";
  if (ms < 250) return "good";
  if (ms < 300) return "average";
  if (ms < 400) return "below";
  return "slow";
}
