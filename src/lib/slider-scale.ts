/* Slider ↔ value mapping for SliderField (src/ui/slider-field.tsx), unit-tested. */

/** Slider positions run 0…STEPS. */
export const STEPS = 1000;

/**
 * "linear" — equal steps; "log" — fine control near the start, big strides at the end (money: 0 … 10 000 000 —
 * the middle of the track is ~1 250 000, not 5 000 000; zero allowed); "exp" — a true logarithmic scale for ranges
 * that start above zero (sound: 20 Hz … 20 kHz, every octave the same length).
 */
export type Scale = "linear" | "log" | "exp";

const K = 3;

export function toPos(value: number, min: number, max: number, scale: Scale = "linear"): number {
  if (!(max > min)) return 0;
  if (scale === "exp" && min > 0) {
    const v = Math.min(max, Math.max(min, value));
    return Math.round((Math.log(v / min) / Math.log(max / min)) * STEPS);
  }
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return Math.round((scale === "log" ? t ** (1 / K) : t) * STEPS);
}

export function fromPos(pos: number, min: number, max: number, scale: Scale = "linear"): number {
  const t = Math.min(1, Math.max(0, pos / STEPS));
  if (scale === "exp" && min > 0) return min * (max / min) ** t;
  return min + (max - min) * (scale === "log" ? t ** K : t);
}

/** Round a dragged value to something a person would type: to `step`, or for "log" to two significant digits. */
export function niceValue(v: number, step: number | undefined, scale: Scale): number {
  if (step && step > 0) {
    const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
    return Number((Math.round(v / step) * step).toFixed(decimals));
  }
  if ((scale === "log" || scale === "exp") && Math.abs(v) >= 100) {
    const mag = 10 ** (Math.floor(Math.log10(Math.abs(v))) - 1);
    return Math.round(v / mag) * mag;
  }
  return Math.round(v);
}
