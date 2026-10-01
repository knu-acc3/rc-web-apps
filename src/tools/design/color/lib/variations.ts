import { BLACK, WHITE, mix, toGamut, type Color } from "./color";

/** Mixing percentages used for tints (toward white) and shades (toward black). */
export const VARIATION_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90] as const;

/** Tints: the color mixed with white in OKLab, like color-mix(in oklab, c, white p%). */
export function tints(c: Color): Color[] {
  return VARIATION_STEPS.map((p) => toGamut(mix({ ...c, alpha: 1 }, WHITE, p / 100, "oklab")));
}

/** Shades: the color mixed with black in OKLab, like color-mix(in oklab, c, black p%). */
export function shades(c: Color): Color[] {
  return VARIATION_STEPS.map((p) => toGamut(mix({ ...c, alpha: 1 }, BLACK, p / 100, "oklab")));
}
