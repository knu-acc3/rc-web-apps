import { fromHsv, toGamut, toHsv, type Color } from "./color";

/** Picker state: hue 0…360, saturation/value/alpha 0…1. */
export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * HSV state for a color. Hue is undefined for grays and saturation is
 * undefined for black, so they are taken from the previous state: dragging to
 * the gray edge or typing "#808080" keeps the hue the user was on.
 */
export function hsvaFromColor(c: Color, prev?: Hsva): Hsva {
  const { h, s, v } = toHsv(toGamut(c));
  const noHue = s < 1e-9 || v < 1e-9;
  return {
    h: noHue && prev ? prev.h : h,
    s: v < 1e-9 && prev ? prev.s : s,
    v,
    a: clamp01(c.alpha),
  };
}

export function colorFromHsva(x: Hsva): Color {
  return fromHsv(x.h, x.s, x.v, x.a);
}

/** Move the saturation/value point, clamped to the square. */
export function nudgeSV(x: Hsva, ds: number, dv: number): Hsva {
  return { ...x, s: clamp01(x.s + ds), v: clamp01(x.v + dv) };
}

export function withHue(x: Hsva, h: number): Hsva {
  return { ...x, h: Math.min(360, Math.max(0, h)) };
}

export function withAlpha(x: Hsva, a: number): Hsva {
  return { ...x, a: clamp01(a) };
}
