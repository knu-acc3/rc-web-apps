import { intervals, mean, median, stdDev } from "./stats";

/** Refresh rates seen on real displays, ascending. */
export const COMMON_RATES = [24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 160, 165, 170, 175, 180, 200, 240, 280, 300, 360, 480, 500] as const;

export interface FrameStats {
  frames: number;
  meanMs: number;
  medianMs: number;
  stdDevMs: number;
  minMs: number;
  maxMs: number;
  /** 1000 / mean interval. */
  meanHz: number;
  /** 1000 / median interval — robust to occasional hitches. */
  medianHz: number;
  /** Frames the browser failed to draw on time (estimated from long intervals). */
  dropped: number;
}

/** Statistics over a list of frame intervals in milliseconds. */
export function frameStats(intervalsMs: readonly number[]): FrameStats | null {
  const xs = intervalsMs.filter((x) => x > 0 && Number.isFinite(x));
  if (xs.length < 2) return null;
  const med = median(xs);
  const avg = mean(xs);
  let dropped = 0;
  for (const x of xs) if (x > med * 1.5) dropped += Math.max(1, Math.round(x / med) - 1);
  return {
    frames: xs.length,
    meanMs: avg,
    medianMs: med,
    stdDevMs: stdDev(xs),
    minMs: Math.min(...xs),
    maxMs: Math.max(...xs),
    meanHz: 1000 / avg,
    medianHz: 1000 / med,
    dropped,
  };
}

/** Statistics from raw requestAnimationFrame timestamps. */
export function statsFromTimestamps(ts: readonly number[]): FrameStats | null {
  return frameStats(intervals(ts));
}

export interface Snap {
  /** Nearest common refresh rate. */
  rate: number;
  /** Relative distance from that rate (0.01 = 1 %). */
  delta: number;
  /** Measured value is within `tolerance` of the common rate. */
  close: boolean;
}

/** Snap a measured frequency to the nearest common display refresh rate. */
export function snapRate(hz: number, tolerance = 0.04): Snap | null {
  if (!(hz > 0) || !Number.isFinite(hz)) return null;
  let best: number = COMMON_RATES[0];
  for (const r of COMMON_RATES) if (Math.abs(r - hz) < Math.abs(best - hz)) best = r;
  const delta = Math.abs(hz - best) / best;
  return { rate: best, delta, close: delta <= tolerance };
}

export type Stability = "stable" | "ok" | "unstable";

/** Qualitative stability from jitter relative to the frame period. */
export function stability(s: FrameStats): Stability {
  const rel = s.stdDevMs / s.medianMs;
  const dropShare = s.dropped / s.frames;
  if (rel < 0.08 && dropShare < 0.01) return "stable";
  if (rel < 0.25 && dropShare < 0.05) return "ok";
  return "unstable";
}
