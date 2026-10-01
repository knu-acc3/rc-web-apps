import { percentile } from "./stats";

/** Lowest level shown by the meters. */
const METER_FLOOR_DB = -60;
/** dBFS value used for digital silence. */
const SILENCE_DB = -100;

/** RMS and absolute peak of a block of samples in [-1, 1]. */
export function rmsPeak(samples: ArrayLike<number>): { rms: number; peak: number } {
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    sum += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  return { rms: samples.length ? Math.sqrt(sum / samples.length) : 0, peak };
}

/** Amplitude (1 = full scale) → dBFS, clamped at SILENCE_DB. */
export function toDbfs(amplitude: number): number {
  if (!(amplitude > 0)) return SILENCE_DB;
  return Math.max(SILENCE_DB, 20 * Math.log10(amplitude));
}

/** Position of a dBFS value on a meter from `floor` to 0 dBFS, in [0, 1]. */
export function meterFraction(db: number, floor = METER_FLOOR_DB): number {
  if (db <= floor) return 0;
  if (db >= 0) return 1;
  return (db - floor) / -floor;
}

/** Noise floor = 10th percentile of recent RMS levels (quiet moments between words). */
export function noiseFloor(rmsDbHistory: readonly number[]): number | null {
  if (rmsDbHistory.length < 30) return null;
  return percentile(rmsDbHistory, 10);
}

export type NoiseRating = "excellent" | "good" | "fair" | "noisy";

export function noiseRating(db: number): NoiseRating {
  if (db < -60) return "excellent";
  if (db < -50) return "good";
  if (db < -40) return "fair";
  return "noisy";
}

/** Peak at (or within 0.1 dB of) full scale — the signal is clipping. */
export function isClipping(peak: number): boolean {
  return peak >= 0.989;
}
