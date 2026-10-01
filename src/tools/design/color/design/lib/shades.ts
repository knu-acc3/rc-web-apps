import { formatColor, fromOklch, toGamut, toHex, toOklch, type Color } from "../../lib/color";

export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

type Curve = readonly [hue: number, lightness: readonly number[], chroma: readonly number[]];

/**
 * OKLCH lightness per step and chroma relative to the family maximum for the 17 chromatic
 * families of the Tailwind CSS v4 default palette (tailwindcss 4.3.3), sorted by the hue of 500.
 * Typical lightness depends on hue (yellows are lighter than blues), so curves are interpolated by hue.
 */
const CURVES: readonly Curve[] = [
  [16.4, [0.969, 0.941, 0.892, 0.81, 0.712, 0.645, 0.586, 0.514, 0.455, 0.41, 0.271], [0.059, 0.119, 0.229, 0.462, 0.767, 0.972, 1, 0.877, 0.743, 0.628, 0.415]], // rose
  [25.3, [0.971, 0.936, 0.885, 0.808, 0.704, 0.637, 0.577, 0.505, 0.444, 0.396, 0.258], [0.053, 0.131, 0.253, 0.465, 0.78, 0.967, 1, 0.869, 0.722, 0.576, 0.376]], // red
  [47.6, [0.98, 0.954, 0.901, 0.837, 0.75, 0.705, 0.646, 0.553, 0.47, 0.408, 0.266], [0.072, 0.171, 0.342, 0.577, 0.824, 0.959, 1, 0.878, 0.707, 0.554, 0.356]], // orange
  [70.1, [0.987, 0.962, 0.924, 0.879, 0.828, 0.769, 0.666, 0.555, 0.473, 0.414, 0.279], [0.116, 0.312, 0.635, 0.894, 1, 0.995, 0.947, 0.862, 0.725, 0.593, 0.407]], // amber
  [86.0, [0.987, 0.973, 0.945, 0.905, 0.852, 0.795, 0.681, 0.554, 0.476, 0.421, 0.286], [0.131, 0.357, 0.648, 0.915, 1, 0.925, 0.814, 0.678, 0.573, 0.477, 0.332]], // yellow
  [130.8, [0.986, 0.967, 0.938, 0.897, 0.841, 0.768, 0.648, 0.532, 0.453, 0.405, 0.274], [0.13, 0.282, 0.534, 0.824, 1, 0.979, 0.84, 0.66, 0.521, 0.424, 0.303]], // lime
  [149.6, [0.982, 0.962, 0.925, 0.871, 0.792, 0.723, 0.627, 0.527, 0.448, 0.393, 0.266], [0.082, 0.201, 0.384, 0.685, 0.954, 1, 0.886, 0.703, 0.543, 0.434, 0.297]], // green
  [162.5, [0.979, 0.95, 0.905, 0.845, 0.765, 0.696, 0.596, 0.508, 0.432, 0.378, 0.262], [0.119, 0.294, 0.525, 0.808, 1, 0.96, 0.819, 0.667, 0.537, 0.435, 0.288]], // emerald
  [182.5, [0.984, 0.953, 0.91, 0.855, 0.777, 0.704, 0.6, 0.511, 0.437, 0.386, 0.277], [0.092, 0.336, 0.632, 0.908, 1, 0.921, 0.776, 0.632, 0.513, 0.414, 0.303]], // teal
  [215.2, [0.984, 0.956, 0.917, 0.865, 0.789, 0.715, 0.609, 0.52, 0.45, 0.398, 0.302], [0.123, 0.292, 0.519, 0.825, 1, 0.929, 0.818, 0.682, 0.552, 0.455, 0.364]], // cyan
  [237.3, [0.977, 0.951, 0.901, 0.828, 0.746, 0.685, 0.588, 0.5, 0.443, 0.391, 0.293], [0.077, 0.154, 0.343, 0.657, 0.947, 1, 0.935, 0.793, 0.651, 0.533, 0.391]], // sky
  [259.8, [0.97, 0.932, 0.882, 0.809, 0.707, 0.623, 0.546, 0.488, 0.424, 0.379, 0.282], [0.057, 0.131, 0.241, 0.429, 0.673, 0.873, 1, 0.992, 0.812, 0.596, 0.371]], // blue
  [277.1, [0.962, 0.93, 0.87, 0.785, 0.673, 0.585, 0.511, 0.457, 0.398, 0.359, 0.257], [0.069, 0.13, 0.248, 0.439, 0.695, 0.889, 1, 0.916, 0.744, 0.55, 0.344]], // indigo
  [292.7, [0.969, 0.943, 0.894, 0.811, 0.702, 0.606, 0.541, 0.491, 0.432, 0.38, 0.283], [0.057, 0.103, 0.203, 0.395, 0.651, 0.89, 1, 0.961, 0.826, 0.673, 0.502]], // violet
  [303.9, [0.977, 0.946, 0.902, 0.827, 0.714, 0.627, 0.558, 0.496, 0.438, 0.381, 0.291], [0.049, 0.115, 0.219, 0.413, 0.705, 0.92, 1, 0.92, 0.757, 0.611, 0.517]], // purple
  [322.1, [0.977, 0.952, 0.903, 0.833, 0.74, 0.667, 0.591, 0.518, 0.452, 0.401, 0.293], [0.058, 0.125, 0.258, 0.492, 0.807, 1, 0.993, 0.858, 0.715, 0.576, 0.461]], // fuchsia
  [354.3, [0.971, 0.948, 0.899, 0.823, 0.718, 0.656, 0.592, 0.525, 0.459, 0.408, 0.284], [0.056, 0.112, 0.245, 0.482, 0.811, 0.968, 1, 0.896, 0.751, 0.614, 0.438]], // pink
];
/** Tailwind v4 `neutral` lightness and `slate` relative chroma, used for grays. */
const NEUTRAL_L = [0.985, 0.97, 0.922, 0.87, 0.708, 0.556, 0.439, 0.371, 0.269, 0.205, 0.145];
const NEUTRAL_C = [0.065, 0.152, 0.283, 0.478, 0.87, 1, 0.935, 0.957, 0.891, 0.913, 0.913];

interface Shade {
  step: (typeof SHADE_STEPS)[number];
  color: Color;
  hex: string;
  oklch: string;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Lightness and relative chroma curves for a hue/chroma, interpolated between Tailwind families. */
function curvesFor(hue: number, chroma: number): { L: number[]; C: number[] } {
  const h = ((hue % 360) + 360) % 360;
  let i = CURVES.findIndex((c) => c[0] > h) - 1;
  if (i < 0) i = CURVES.length - 1; // wraps around 360°
  const a = CURVES[i];
  const b = CURVES[(i + 1) % CURVES.length];
  const span = (b[0] - a[0] + 360) % 360 || 360;
  const t = ((h - a[0] + 360) % 360) / span;
  const L = a[1].map((x, k) => lerp(x, b[1][k], t));
  const C = a[2].map((x, k) => lerp(x, b[2][k], t));
  // Low-chroma colors (grays, slate-like tints) follow the neutral curve.
  const w = Math.min(1, Math.max(0, (chroma - 0.02) / 0.06));
  return { L: L.map((x, k) => lerp(NEUTRAL_L[k], x, w)), C: C.map((x, k) => lerp(NEUTRAL_C[k], x, w)) };
}

/** Index of the step whose typical lightness (for this hue) is closest to the color. */
export function anchorStep(c: Color): number {
  const { l, c: ch, h } = toOklch(toGamut({ ...c, alpha: 1 }));
  const { L } = curvesFor(h, ch);
  let best = 0;
  for (let i = 1; i < L.length; i++) if (Math.abs(L[i] - l) < Math.abs(L[best] - l)) best = i;
  return best;
}

/**
 * A 50–950 scale in the style of Tailwind v4: the hue is kept, lightness follows the Tailwind
 * curve for that hue re-anchored so the input sits exactly on its nearest step, chroma follows the
 * Tailwind chroma profile scaled to the input, and every step is gamut-mapped into sRGB.
 */
export function generateShades(input: Color): Shade[] {
  const c = toGamut({ ...input, alpha: 1 });
  const { l: L0, c: C0, h: H } = toOklch(c);
  const { L: TL, C: TC } = curvesFor(H, C0);
  const k = anchorStep(c);
  const hi = Math.max(TL[0], L0);
  const lo = Math.min(TL[TL.length - 1], L0);
  const lightness = TL.map((lt, i) => {
    if (i === k) return L0;
    if (i < k) return hi + (lt - hi) * ((L0 - hi) / (TL[k] - hi || 1));
    return lo + (lt - lo) * ((L0 - lo) / (TL[k] - lo || 1));
  });
  const peak = C0 / TC[k];
  return SHADE_STEPS.map((step, i) => {
    const color = i === k ? c : toGamut(fromOklch(lightness[i], Math.min(0.37, peak * TC[i]), H));
    return { step, color, hex: toHex(color), oklch: formatColor(color, "oklch") };
  });
}

/** Tailwind-style OKLCH string with 1-decimal lightness and 3-decimal chroma/hue. */
export function twOklch(c: Color): string {
  const { l, c: ch, h } = toOklch(c);
  const r = (v: number, d: number) => String(Math.round(v * 10 ** d) / 10 ** d);
  const C = r(ch, 3);
  return `oklch(${r(l * 100, 1)}% ${C} ${C === "0" ? 0 : r(h, 3)})`;
}

export function shadesCss(name: string, shades: Shade[]): string {
  return `:root {\n${shades.map((s) => `  --color-${name}-${s.step}: ${twOklch(s.color)};`).join("\n")}\n}`;
}

export function shadesTailwind4(name: string, shades: Shade[]): string {
  return `@theme {\n${shades.map((s) => `  --color-${name}-${s.step}: ${twOklch(s.color)};`).join("\n")}\n}`;
}

export function shadesTailwind3(name: string, shades: Shade[]): string {
  return `// tailwind.config.js → theme.extend.colors\n${JSON.stringify({ [name]: Object.fromEntries(shades.map((s) => [s.step, s.hex])) }, null, 2)}`;
}
