import { intervals, median } from "./stats";

/* ───────────── Mouse ───────────── */

/** Two presses of the same button closer than this are not humanly possible → switch chatter. */
export const CHATTER_MS = 60;

export function isChatter(intervalMs: number): boolean {
  return intervalMs >= 0 && intervalMs < CHATTER_MS;
}

export const MOUSE_POLLING_RATES = [125, 250, 500, 1000, 2000, 4000, 8000] as const;

/**
 * Estimate the input report rate (Hz) from pointer event timestamps (ms).
 * Uses the median interval so a few merged or late events don't skew it.
 * Returns null with too few samples.
 */
export function estimatePollingRate(timestamps: readonly number[], minSamples = 20): number | null {
  const xs = intervals(timestamps).filter((x) => x > 0);
  if (xs.length < minSamples) return null;
  const m = median(xs);
  return m > 0 ? 1000 / m : null;
}

/** Nearest standard mouse polling rate for a measured value. */
export function nearestPollingRate(hz: number): number {
  let best: number = MOUSE_POLLING_RATES[0];
  for (const r of MOUSE_POLLING_RATES) if (Math.abs(Math.log(r / hz)) < Math.abs(Math.log(best / hz))) best = r;
  return best;
}

/* ───────────── Gamepad ───────────── */

export function stickMagnitude(x: number, y: number): number {
  return Math.min(1, Math.hypot(x, y));
}

export type DriftVerdict = "none" | "minor" | "drift";

/** Verdict on the largest resting deflection of a stick. */
export function driftVerdict(maxMagnitude: number): DriftVerdict {
  if (maxMagnitude < 0.05) return "none";
  if (maxMagnitude < 0.15) return "minor";
  return "drift";
}

/** Standard-mapping button labels: [Xbox, PlayStation]. */
export const STANDARD_BUTTONS: readonly [string, string][] = [
  ["A", "✕"],
  ["B", "○"],
  ["X", "□"],
  ["Y", "△"],
  ["LB", "L1"],
  ["RB", "R1"],
  ["LT", "L2"],
  ["RT", "R2"],
  ["View", "Share"],
  ["Menu", "Options"],
  ["LS", "L3"],
  ["RS", "R3"],
  ["↑", "↑"],
  ["↓", "↓"],
  ["←", "←"],
  ["→", "→"],
  ["Xbox", "PS"],
  ["Share", "Touchpad"],
];
