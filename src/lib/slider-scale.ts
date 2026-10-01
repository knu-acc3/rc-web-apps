/* Slider ↔ value mapping for SliderField (src/ui/slider-field.tsx), unit-tested. */

/** Slider positions run 0…STEPS. */
export const STEPS = 1000;

/**
 * "linear" — equal steps; "log" — fine control near the start, big strides at the end (money: 0 … 10 000 000 —
 * the middle of the track is ~1 250 000, not 5 000 000).
 */
export type Scale = "linear" | "log";

const K = 3;

export function toPos(value: number, min: number, max: number, scale: Scale = "linear"): number {
  if (!(max > min)) return 0;
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return Math.round((scale === "log" ? t ** (1 / K) : t) * STEPS);
}

export function fromPos(pos: number, min: number, max: number, scale: Scale = "linear"): number {
  const t = Math.min(1, Math.max(0, pos / STEPS));
  return min + (max - min) * (scale === "log" ? t ** K : t);
}

/** Round a dragged value to something a person would type: to `step`, or for "log" to two significant digits. */
export function niceValue(v: number, step: number | undefined, scale: Scale): number {
  if (step && step > 0) {
    const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
    return Number((Math.round(v / step) * step).toFixed(decimals));
  }
  if (scale === "log" && Math.abs(v) >= 100) {
    const mag = 10 ** (Math.floor(Math.log10(Math.abs(v))) - 1);
    return Math.round(v / mag) * mag;
  }
  return Math.round(v);
}
