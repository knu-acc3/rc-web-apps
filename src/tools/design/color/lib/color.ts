/**
 * Color engine shared by the color and css sections.
 *
 * - `Color` is gamma-encoded sRGB with channels in 0…1 (values may fall outside
 *   0…1 for wide-gamut inputs such as oklch()/lab()/display-p3 until they are
 *   mapped with `toGamut`) plus alpha 0…1.
 * - Parsing accepts every CSS Color 4 syntax that describes a concrete color:
 *   hex (3/4/6/8 digits), rgb()/rgba(), hsl()/hsla(), hwb(), lab(), lch(),
 *   oklab(), oklch(), color(srgb|srgb-linear|display-p3|xyz|xyz-d50|xyz-d65),
 *   the 148 named colors and `transparent`; legacy comma and modern space/slash
 *   syntax, `none`, percentages and angle units. Non-CSS convenience inputs:
 *   hsv()/hsb() and cmyk()/device-cmyk().
 * - Everything is pure and SSR-safe.
 */
import { NAMED_COLORS, NAMED_MAP } from "./named";

export interface Color {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

export type ColorFormat = "hex" | "rgb" | "hsl" | "hwb" | "hsv" | "cmyk" | "lab" | "lch" | "oklab" | "oklch" | "p3";

export const COLOR_FORMATS: readonly ColorFormat[] = ["hex", "rgb", "hsl", "hwb", "hsv", "cmyk", "lab", "lch", "oklab", "oklch", "p3"];

type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

export const WHITE: Color = { r: 1, g: 1, b: 1, alpha: 1 };
export const BLACK: Color = { r: 0, g: 0, b: 0, alpha: 1 };

/* ───────────── small math helpers ───────────── */

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const mul = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];
/** Normalize a hue to [0, 360). */
const normHue = (h: number) => {
  if (!Number.isFinite(h)) return 0;
  const x = h % 360;
  return x < 0 ? x + 360 : x === 360 ? 0 : x;
};

/** Round for CSS output: no locale, no exponent, no "-0", trailing zeros trimmed. */
export function num(v: number, digits: number): string {
  const p = 10 ** digits;
  let r = Math.round(v * p) / p;
  if (r === 0) r = 0; // turns -0 into 0
  return String(r);
}

/* ───────────── transfer functions & matrices (CSS Color 4) ───────────── */

/** sRGB gamma → linear (sign-preserving for out-of-gamut values). */
export function toLinear(v: number): number {
  const a = Math.abs(v);
  return a <= 0.04045 ? v / 12.92 : Math.sign(v) * ((a + 0.055) / 1.055) ** 2.4;
}
/** Linear → sRGB gamma (sign-preserving). */
export function fromLinear(v: number): number {
  const a = Math.abs(v);
  return a <= 0.0031308 ? v * 12.92 : Math.sign(v) * (1.055 * a ** (1 / 2.4) - 0.055);
}

const LIN_SRGB_TO_XYZ: Mat3 = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
];
const XYZ_TO_LIN_SRGB: Mat3 = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];
const LIN_P3_TO_XYZ: Mat3 = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0.0, 0.04511338185890264, 1.043944368900976],
];
const XYZ_TO_LIN_P3: Mat3 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
];
const D65_TO_D50: Mat3 = [
  [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
  [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
  [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371],
];
const D50_TO_D65: Mat3 = [
  [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
  [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
  [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
];
const D50_WHITE: Vec3 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];

/* ───────────── space conversions ───────────── */

const rgbVec = (c: Color): Vec3 => [c.r, c.g, c.b];
const fromVec = (v: Vec3, alpha = 1): Color => ({ r: v[0], g: v[1], b: v[2], alpha });

function toLinearRgb(c: Color): Vec3 {
  return [toLinear(c.r), toLinear(c.g), toLinear(c.b)];
}
function fromLinearRgb(v: Vec3, alpha = 1): Color {
  return fromVec([fromLinear(v[0]), fromLinear(v[1]), fromLinear(v[2])], alpha);
}

/** CIE XYZ (D65) */
function toXyz(c: Color): Vec3 {
  return mul(LIN_SRGB_TO_XYZ, toLinearRgb(c));
}
function fromXyz(xyz: Vec3, alpha = 1): Color {
  return fromLinearRgb(mul(XYZ_TO_LIN_SRGB, xyz), alpha);
}

/* HSL / HSV / HWB — h in degrees [0,360), other channels 0…1 */

function hueOf(r: number, g: number, b: number, max: number, d: number): number {
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return normHue(h * 60);
}

export function toHsl(c: Color): { h: number; s: number; l: number } {
  const { r, g, b } = c;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 || l <= 0 || l >= 1 ? 0 : (max - l) / Math.min(l, 1 - l);
  return { h: hueOf(r, g, b, max, d), s, l };
}
function fromHsl(h: number, s: number, l: number, alpha = 1): Color {
  h = normHue(h);
  s = clamp(s);
  l = clamp(l);
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0), g: f(8), b: f(4), alpha };
}

export function toHsv(c: Color): { h: number; s: number; v: number } {
  const { r, g, b } = c;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  return { h: hueOf(r, g, b, max, d), s: max <= 0 ? 0 : d / max, v: max };
}
export function fromHsv(h: number, s: number, v: number, alpha = 1): Color {
  h = normHue(h);
  s = clamp(s);
  v = clamp(v);
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: f(5), g: f(3), b: f(1), alpha };
}

function toHwb(c: Color): { h: number; w: number; b: number } {
  const hsv = toHsv(c);
  return { h: hsv.h, w: Math.min(c.r, c.g, c.b), b: 1 - Math.max(c.r, c.g, c.b) };
}
function fromHwb(h: number, w: number, bl: number, alpha = 1): Color {
  w = clamp(w);
  bl = clamp(bl);
  if (w + bl >= 1) {
    const gray = w / (w + bl);
    return { r: gray, g: gray, b: gray, alpha };
  }
  const base = fromHsl(h, 1, 0.5);
  const f = (v: number) => v * (1 - w - bl) + w;
  return { r: f(base.r), g: f(base.g), b: f(base.b), alpha };
}

/** Naive (device-independent, no ICC profile) CMYK, channels 0…1. */
function toCmyk(c: Color): { c: number; m: number; y: number; k: number } {
  const r = clamp(c.r);
  const g = clamp(c.g);
  const b = clamp(c.b);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 1 };
  return { c: (1 - r - k) / (1 - k), m: (1 - g - k) / (1 - k), y: (1 - b - k) / (1 - k), k };
}
function fromCmyk(cy: number, m: number, y: number, k: number, alpha = 1): Color {
  cy = clamp(cy);
  m = clamp(m);
  y = clamp(y);
  k = clamp(k);
  return { r: (1 - cy) * (1 - k), g: (1 - m) * (1 - k), b: (1 - y) * (1 - k), alpha };
}

/* CIE Lab / LCH (D50, as in CSS) */

const LAB_E = 216 / 24389;
const LAB_K = 24389 / 27;

export function toLab(c: Color): { l: number; a: number; b: number } {
  const xyz = mul(D65_TO_D50, toXyz(c));
  const f = xyz.map((v, i) => {
    const x = v / D50_WHITE[i];
    return x > LAB_E ? Math.cbrt(x) : (LAB_K * x + 16) / 116;
  });
  return { l: 116 * f[1] - 16, a: 500 * (f[0] - f[1]), b: 200 * (f[1] - f[2]) };
}
function fromLab(l: number, a: number, b: number, alpha = 1): Color {
  const f1 = (l + 16) / 116;
  const f0 = a / 500 + f1;
  const f2 = f1 - b / 200;
  const x = f0 ** 3 > LAB_E ? f0 ** 3 : (116 * f0 - 16) / LAB_K;
  const y = l > LAB_K * LAB_E ? ((l + 16) / 116) ** 3 : l / LAB_K;
  const z = f2 ** 3 > LAB_E ? f2 ** 3 : (116 * f2 - 16) / LAB_K;
  const xyz50: Vec3 = [x * D50_WHITE[0], y * D50_WHITE[1], z * D50_WHITE[2]];
  return fromXyz(mul(D50_TO_D65, xyz50), alpha);
}
function toLch(c: Color): { l: number; c: number; h: number } {
  const { l, a, b } = toLab(c);
  return { l, c: Math.hypot(a, b), h: normHue((Math.atan2(b, a) * 180) / Math.PI) };
}
function fromLch(l: number, ch: number, h: number, alpha = 1): Color {
  const r = (normHue(h) * Math.PI) / 180;
  return fromLab(l, Math.max(0, ch) * Math.cos(r), Math.max(0, ch) * Math.sin(r), alpha);
}

/* OKLab / OKLCH (Björn Ottosson) — L 0…1 */

function toOklab(c: Color): { l: number; a: number; b: number } {
  const [r, g, b] = toLinearRgb(c);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}
function fromOklab(L: number, a: number, b: number, alpha = 1): Color {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return fromLinearRgb(
    [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ],
    alpha,
  );
}
export function toOklch(c: Color): { l: number; c: number; h: number } {
  const { l, a, b } = toOklab(c);
  const ch = Math.hypot(a, b);
  return { l, c: ch, h: ch < 1e-7 ? 0 : normHue((Math.atan2(b, a) * 180) / Math.PI) };
}
export function fromOklch(l: number, ch: number, h: number, alpha = 1): Color {
  const r = (normHue(h) * Math.PI) / 180;
  const c = Math.max(0, ch);
  return fromOklab(l, c * Math.cos(r), c * Math.sin(r), alpha);
}

/* Display P3 */
function toP3(c: Color): Vec3 {
  const lin = mul(XYZ_TO_LIN_P3, toXyz(c));
  return [fromLinear(lin[0]), fromLinear(lin[1]), fromLinear(lin[2])];
}
function fromP3(r: number, g: number, b: number, alpha = 1): Color {
  return fromXyz(mul(LIN_P3_TO_XYZ, [toLinear(r), toLinear(g), toLinear(b)]), alpha);
}

/* ───────────── gamut ───────────── */

export function inGamut(c: Color, eps = 1e-5): boolean {
  return c.r >= -eps && c.r <= 1 + eps && c.g >= -eps && c.g <= 1 + eps && c.b >= -eps && c.b <= 1 + eps;
}
function clip(c: Color): Color {
  return { r: clamp(c.r), g: clamp(c.g), b: clamp(c.b), alpha: clamp(c.alpha) };
}
/** Euclidean distance in OKLab (ΔEOK). ~0.02 is a just-noticeable difference. */
export function deltaEOK(x: Color, y: Color): number {
  const a = toOklab(x);
  const b = toOklab(y);
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

/**
 * Map a color into the sRGB gamut with the CSS Color 4 algorithm:
 * reduce OKLCH chroma (binary search) until clipping is visually lossless.
 */
export function toGamut(c: Color): Color {
  if (inGamut(c)) return clip(c);
  const { l: L, c: C, h: H } = toOklch(c);
  if (L >= 1) return { ...WHITE, alpha: clamp(c.alpha) };
  if (L <= 0) return { ...BLACK, alpha: clamp(c.alpha) };
  const JND = 0.02;
  const EPS = 0.0001;
  let current = fromOklch(L, C, H, c.alpha);
  let clipped = clip(current);
  if (deltaEOK(clipped, current) < JND) return clipped;
  let min = 0;
  let max = C;
  let minInGamut = true;
  while (max - min > EPS) {
    const chroma = (min + max) / 2;
    current = fromOklch(L, chroma, H, c.alpha);
    if (minInGamut && inGamut(current, 0)) {
      min = chroma;
      continue;
    }
    clipped = clip(current);
    const E = deltaEOK(clipped, current);
    if (E < JND) {
      if (JND - E < EPS) return clipped;
      minInGamut = false;
      min = chroma;
    } else {
      max = chroma;
    }
  }
  return clipped;
}

/* ───────────── parsing ───────────── */

interface Tok {
  v: number;
  unit: "" | "%" | "deg" | "rad" | "grad" | "turn";
  none?: boolean;
}

function tok(s: string): Tok | null {
  if (s === "none") return { v: 0, unit: "", none: true };
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/.exec(s);
  if (!m) return null;
  return { v: parseFloat(m[1]), unit: (m[2] ?? "") as Tok["unit"] };
}
/** number or percentage; `pct` = value that 100% maps to. */
function nump(t: Tok | null, pct: number): number | null {
  if (!t) return null;
  if (t.unit === "%") return (t.v / 100) * pct;
  if (t.unit !== "") return null;
  return t.v;
}
function angle(t: Tok | null): number | null {
  if (!t) return null;
  switch (t.unit) {
    case "":
    case "deg":
      return t.v;
    case "rad":
      return (t.v * 180) / Math.PI;
    case "grad":
      return t.v * 0.9;
    case "turn":
      return t.v * 360;
    default:
      return null;
  }
}
function alphaOf(s: string | null): number | null {
  if (s === null) return 1;
  const v = nump(tok(s), 1);
  return v === null ? null : clamp(v);
}

function splitArgs(body: string, count: number): { parts: string[]; alpha: string | null } | null {
  if (body.includes(",")) {
    if (body.includes("/")) return null;
    const parts = body.split(",").map((s) => s.trim());
    if (parts.some((p) => !p || /\s/.test(p))) return null;
    if (parts.length === count) return { parts, alpha: null };
    if (parts.length === count + 1) return { parts: parts.slice(0, count), alpha: parts[count] };
    return null;
  }
  const slash = body.split("/");
  if (slash.length > 2) return null;
  const parts = slash[0].trim().split(/\s+/).filter(Boolean);
  const alpha = slash.length === 2 ? slash[1].trim() : null;
  if (alpha !== null && (!alpha || /\s/.test(alpha))) return null;
  if (parts.length !== count) return null;
  return { parts, alpha };
}

function parseHex(s: string): Color | null {
  const m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (!m) return null;
  let h = m[1];
  if (h.length <= 4) h = [...h].map((x) => x + x).join("");
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), alpha: h.length === 8 ? n(6) : 1 };
}

const FN_ARGS: Record<string, number> = {
  rgb: 3,
  rgba: 3,
  hsl: 3,
  hsla: 3,
  hwb: 3,
  lab: 3,
  lch: 3,
  oklab: 3,
  oklch: 3,
  hsv: 3,
  hsb: 3,
  cmyk: 4,
  "device-cmyk": 4,
};

function parseFunction(name: string, body: string): Color | null {
  if (name === "color") {
    const m = /^([a-z0-9-]+)\s+(.*)$/.exec(body.trim());
    if (!m) return null;
    const args = splitArgs(m[2], 3);
    if (!args || body.includes(",")) return null;
    const v = args.parts.map((p) => nump(tok(p), 1));
    const alpha = alphaOf(args.alpha);
    if (v.some((x) => x === null) || alpha === null) return null;
    const [a, b, c] = v as number[];
    switch (m[1]) {
      case "srgb":
        return { r: a, g: b, b: c, alpha };
      case "srgb-linear":
        return fromLinearRgb([a, b, c], alpha);
      case "display-p3":
        return fromP3(a, b, c, alpha);
      case "xyz":
      case "xyz-d65":
        return fromXyz([a, b, c], alpha);
      case "xyz-d50":
        return fromXyz(mul(D50_TO_D65, [a, b, c]), alpha);
      default:
        return null;
    }
  }
  const count = FN_ARGS[name];
  if (!count) return null;
  const args = splitArgs(body, count);
  if (!args) return null;
  const t = args.parts.map(tok);
  if (t.some((x) => x === null)) return null;
  const alpha = alphaOf(args.alpha);
  if (alpha === null) return null;
  switch (name) {
    case "rgb":
    case "rgba": {
      const v = t.map((x) => nump(x, 255));
      if (v.some((x) => x === null)) return null;
      const [r, g, b] = (v as number[]).map((x) => clamp(x / 255));
      return { r, g, b, alpha };
    }
    case "hsl":
    case "hsla":
    case "hsv":
    case "hsb":
    case "hwb": {
      const h = angle(t[0]);
      const x = nump(t[1], 100);
      const y = nump(t[2], 100);
      if (h === null || x === null || y === null) return null;
      if (name === "hwb") return fromHwb(h, x / 100, y / 100, alpha);
      if (name === "hsv" || name === "hsb") return fromHsv(h, x / 100, y / 100, alpha);
      return fromHsl(h, x / 100, y / 100, alpha);
    }
    case "lab":
    case "oklab": {
      const ok = name === "oklab";
      const l = nump(t[0], ok ? 1 : 100);
      const a = nump(t[1], ok ? 0.4 : 125);
      const b = nump(t[2], ok ? 0.4 : 125);
      if (l === null || a === null || b === null) return null;
      return ok ? fromOklab(clamp(l, 0, 1), a, b, alpha) : fromLab(clamp(l, 0, 100), a, b, alpha);
    }
    case "lch":
    case "oklch": {
      const ok = name === "oklch";
      const l = nump(t[0], ok ? 1 : 100);
      const c = nump(t[1], ok ? 0.4 : 150);
      const h = angle(t[2]);
      if (l === null || c === null || h === null) return null;
      return ok ? fromOklch(clamp(l, 0, 1), c, h, alpha) : fromLch(clamp(l, 0, 100), c, h, alpha);
    }
    case "cmyk":
    case "device-cmyk": {
      if (t.some((x) => x!.unit !== "" && x!.unit !== "%")) return null;
      // Bare numbers: 0…1 per CSS device-cmyk(); if any bare number > 1, read them as percentages.
      const scale = t.some((x) => x!.unit === "" && x!.v > 1) ? 100 : 1;
      const v = t.map((x) => (x!.unit === "%" ? x!.v / 100 : x!.v / scale));
      return fromCmyk(v[0], v[1], v[2], v[3], alpha);
    }
  }
  return null;
}

/**
 * Parse any CSS color string. `bare` tells how to read a plain list of numbers
 * without a function name (e.g. "255, 99, 71" with bare = "rgb").
 * Returns null for invalid input and for `currentcolor`.
 */
export function parseColor(input: string, bare?: ColorFormat): Color | null {
  const s = input.trim().toLowerCase().replace(/;+$/, "").trim();
  if (!s) return null;
  if (s === "transparent") return { r: 0, g: 0, b: 0, alpha: 0 };
  const named = NAMED_MAP.get(s);
  if (named) return parseHex(named);
  if (s.startsWith("#")) return parseHex(s);
  const fn = /^([a-z-]+)\(\s*(.*?)\s*\)$/.exec(s);
  if (fn) return parseFunction(fn[1], fn[2]);
  // Bare hex without "#": 6/8 digits always, 3/4 digits unless a number list is expected.
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(s)) return parseHex(s);
  if (/^[0-9a-f]{3,4}$/.test(s) && (!bare || bare === "hex")) return parseHex(s);
  if (bare && bare !== "hex" && /^(?:[\d.+-]|none)/.test(s)) {
    return bare === "p3" ? parseFunction("color", `display-p3 ${s}`) : parseFunction(bare, s);
  }
  return null;
}

/* ───────────── formatting ───────────── */

interface FormatOptions {
  /** rgb()/hsl(): comma syntax (default true). */
  legacy?: boolean;
  /** hex: uppercase (default true). */
  upper?: boolean;
  /** hex: add alpha digits — "auto" (default) only when alpha < 1. */
  alpha?: boolean | "auto";
}

/** 0…255 integers after gamut mapping. */
export function toRgb255(c: Color): [number, number, number] {
  const g = toGamut(c);
  return [Math.round(g.r * 255), Math.round(g.g * 255), Math.round(g.b * 255)];
}

export function toHex(c: Color, opts: FormatOptions = {}): string {
  const [r, g, b] = toRgb255(c);
  const a = Math.round(clamp(c.alpha) * 255);
  const withAlpha = opts.alpha === true || ((opts.alpha ?? "auto") === "auto" && a < 255);
  const hex = "#" + [r, g, b, ...(withAlpha ? [a] : [])].map((x) => x.toString(16).padStart(2, "0")).join("");
  return opts.upper === false ? hex : hex.toUpperCase();
}

const alphaNum = (a: number) => num(clamp(a), 3);

export function formatColor(c: Color, format: ColorFormat, opts: FormatOptions = {}): string {
  const legacy = opts.legacy ?? true;
  const hasAlpha = clamp(c.alpha) < 1;
  const A = alphaNum(c.alpha);
  const modernAlpha = hasAlpha ? ` / ${A}` : "";
  switch (format) {
    case "hex":
      return toHex(c, opts);
    case "rgb": {
      const [r, g, b] = toRgb255(c);
      if (legacy) return hasAlpha ? `rgba(${r}, ${g}, ${b}, ${A})` : `rgb(${r}, ${g}, ${b})`;
      return `rgb(${r} ${g} ${b}${modernAlpha})`;
    }
    case "hsl": {
      const { h, s, l } = toHsl(toGamut(c));
      const H = num(s === 0 ? 0 : h, 1);
      const S = num(s * 100, 1);
      const L = num(l * 100, 1);
      if (legacy) return hasAlpha ? `hsla(${H}, ${S}%, ${L}%, ${A})` : `hsl(${H}, ${S}%, ${L}%)`;
      return `hsl(${H} ${S}% ${L}%${modernAlpha})`;
    }
    case "hwb": {
      const { h, w, b } = toHwb(toGamut(c));
      return `hwb(${num(w + b >= 0.99999 ? 0 : h, 1)} ${num(w * 100, 1)}% ${num(b * 100, 1)}%${modernAlpha})`;
    }
    case "hsv": {
      const { h, s, v } = toHsv(toGamut(c));
      const H = num(s === 0 ? 0 : h, 1);
      return hasAlpha ? `hsva(${H}, ${num(s * 100, 1)}%, ${num(v * 100, 1)}%, ${A})` : `hsv(${H}, ${num(s * 100, 1)}%, ${num(v * 100, 1)}%)`;
    }
    case "cmyk": {
      const k = toCmyk(toGamut(c));
      return `cmyk(${num(k.c * 100, 1)}%, ${num(k.m * 100, 1)}%, ${num(k.y * 100, 1)}%, ${num(k.k * 100, 1)}%)`;
    }
    case "lab": {
      const { l, a, b } = toLab(c);
      return `lab(${num(l, 2)} ${num(a, 2)} ${num(b, 2)}${modernAlpha})`;
    }
    case "lch": {
      const { l, c: ch, h } = toLch(c);
      const C = num(ch, 2);
      return `lch(${num(l, 2)} ${C} ${C === "0" ? 0 : num(h, 2)}${modernAlpha})`;
    }
    case "oklab": {
      const { l, a, b } = toOklab(c);
      return `oklab(${num(l * 100, 3)}% ${num(a, 5)} ${num(b, 5)}${modernAlpha})`;
    }
    case "oklch": {
      const { l, c: ch, h } = toOklch(c);
      const C = num(ch, 5);
      return `oklch(${num(l * 100, 3)}% ${C} ${C === "0" ? 0 : num(h, 3)}${modernAlpha})`;
    }
    case "p3": {
      const [r, g, b] = toP3(c);
      return `color(display-p3 ${num(r, 4)} ${num(g, 4)} ${num(b, 4)}${modernAlpha})`;
    }
  }
}

/* ───────────── compositing & contrast ───────────── */

/** Source-over compositing of `top` onto `bottom` in gamma-encoded sRGB (what browsers do). */
function composite(top: Color, bottom: Color): Color {
  const t = clip(top);
  const b = clip(bottom);
  const a = t.alpha + b.alpha * (1 - t.alpha);
  if (a <= 0) return { r: 0, g: 0, b: 0, alpha: 0 };
  const f = (x: number, y: number) => (x * t.alpha + y * b.alpha * (1 - t.alpha)) / a;
  return { r: f(t.r, b.r), g: f(t.g, b.g), b: f(t.b, b.b), alpha: a };
}

/** WCAG 2.x relative luminance of the (clipped, opaque) color. */
function luminance(c: Color): number {
  const [r, g, b] = toLinearRgb(clip(c));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Resolve what is actually seen: bg over the backdrop, then fg over that. */
export function flatten(fg: Color, bg: Color, backdrop: Color = WHITE): { fg: Color; bg: Color } {
  const base = composite(bg, { ...backdrop, alpha: 1 });
  const opaqueBg = { ...base, alpha: 1 };
  return { fg: { ...composite(fg, opaqueBg), alpha: 1 }, bg: opaqueBg };
}

/** WCAG 2 contrast ratio 1…21 (alpha composited: bg over `backdrop`, fg over bg). */
export function contrastRatio(fg: Color, bg: Color, backdrop: Color = WHITE): number {
  const f = flatten(fg, bg, backdrop);
  const l1 = luminance(f.fg);
  const l2 = luminance(f.bg);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Display value for a ratio, floored (never rounded up) to 2 decimals so that
 * the shown number can never pass a threshold the real ratio fails: 4.4955 → "4.49".
 */
export function formatRatio(ratio: number, digits = 2): string {
  const p = 10 ** digits;
  return (Math.floor(ratio * p) / p).toFixed(digits);
}

export const WCAG_THRESHOLDS = { aaNormal: 4.5, aaLarge: 3, aaaNormal: 7, aaaLarge: 4.5, ui: 3 } as const;
export type WcagCheck = keyof typeof WCAG_THRESHOLDS;

export function wcagChecks(ratio: number): Record<WcagCheck, boolean> {
  return {
    aaNormal: ratio >= WCAG_THRESHOLDS.aaNormal,
    aaLarge: ratio >= WCAG_THRESHOLDS.aaLarge,
    aaaNormal: ratio >= WCAG_THRESHOLDS.aaaNormal,
    aaaLarge: ratio >= WCAG_THRESHOLDS.aaaLarge,
    ui: ratio >= WCAG_THRESHOLDS.ui,
  };
}

/* APCA-W3 0.0.98G-4g (the "SA98G" constants) */
const APCA = {
  mainTRC: 2.4,
  sRco: 0.2126729,
  sGco: 0.7151522,
  sBco: 0.072175,
  normBG: 0.56,
  normTXT: 0.57,
  revTXT: 0.62,
  revBG: 0.65,
  blkThrs: 0.022,
  blkClmp: 1.414,
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  loBoWoffset: 0.027,
  loWoBoffset: 0.027,
  deltaYmin: 0.0005,
  loClip: 0.1,
} as const;

/** APCA screen luminance Y of a clipped opaque sRGB color. */
function apcaY(c: Color): number {
  const x = clip(c);
  return APCA.sRco * x.r ** APCA.mainTRC + APCA.sGco * x.g ** APCA.mainTRC + APCA.sBco * x.b ** APCA.mainTRC;
}

/**
 * APCA lightness contrast Lc (signed: positive = dark text on light bg,
 * negative = light text on dark bg). Alpha is composited like contrastRatio.
 */
export function apcaContrast(text: Color, bg: Color, backdrop: Color = WHITE): number {
  const f = flatten(text, bg, backdrop);
  let txtY = apcaY(f.fg);
  let bgY = apcaY(f.bg);
  if (Number.isNaN(txtY) || Number.isNaN(bgY)) return 0;
  const soft = (y: number) => (y > APCA.blkThrs ? y : y + (APCA.blkThrs - y) ** APCA.blkClmp);
  txtY = soft(txtY);
  bgY = soft(bgY);
  if (Math.abs(bgY - txtY) < APCA.deltaYmin) return 0;
  let out: number;
  if (bgY > txtY) {
    const sapc = (bgY ** APCA.normBG - txtY ** APCA.normTXT) * APCA.scaleBoW;
    out = sapc < APCA.loClip ? 0 : sapc - APCA.loBoWoffset;
  } else {
    const sapc = (bgY ** APCA.revBG - txtY ** APCA.revTXT) * APCA.scaleWoB;
    out = sapc > -APCA.loClip ? 0 : sapc + APCA.loWoBoffset;
  }
  return out * 100;
}

/** Black or white — whichever gives the higher WCAG contrast on `bg`. */
export function readableTextColor(bg: Color): "#000000" | "#FFFFFF" {
  const opaque = flatten(BLACK, bg).bg;
  return contrastRatio(BLACK, opaque) >= contrastRatio(WHITE, opaque) ? "#000000" : "#FFFFFF";
}

/**
 * Nearest color to `c` (changing only OKLCH lightness, keeping hue and chroma
 * as far as the gamut allows) that reaches `target` contrast against `other`.
 * `role` says whether `c` is the text ("fg") or the background ("bg").
 * Returns null if even black/white cannot reach the target.
 */
export function adjustToContrast(c: Color, other: Color, target: number, role: "fg" | "bg" = "fg"): Color | null {
  const ratio = (x: Color) => (role === "fg" ? contrastRatio(x, other) : contrastRatio(other, x));
  const base = toOklch({ ...c, alpha: 1 });
  if (ratio({ ...c, alpha: 1 }) >= target) return { ...c, alpha: 1 };
  const at = (L: number) => toGamut(fromOklch(L, base.c, base.h));
  const candidates: Color[] = [];
  for (const end of [0, 1]) {
    if (ratio(at(end)) < target) continue;
    // Binary search the smallest lightness change that reaches the target.
    let lo = base.l;
    let hi = end;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (ratio(at(mid)) >= target) hi = mid;
      else lo = mid;
    }
    // Snap to 8-bit and make sure rounding did not drop below the target.
    let best = parseHex(toHex(at(hi), { upper: false, alpha: false }).slice(1))!;
    let step = 0;
    while (ratio(best) < target && step++ < 20) {
      hi = end === 0 ? Math.max(0, hi - 0.002) : Math.min(1, hi + 0.002);
      best = parseHex(toHex(at(hi), { upper: false, alpha: false }).slice(1))!;
    }
    if (ratio(best) >= target) candidates.push(best);
  }
  if (!candidates.length) return null;
  candidates.sort((x, y) => deltaEOK(x, c) - deltaEOK(y, c));
  return candidates[0];
}

/* ───────────── harmonies, mixing, names ───────────── */

export type Harmony = "complementary" | "analogous" | "triadic" | "split-complementary" | "tetradic" | "square" | "monochromatic";

export const HARMONY_OFFSETS: Record<Exclude<Harmony, "monochromatic">, number[]> = {
  complementary: [0, 180],
  analogous: [0, -30, 30],
  triadic: [0, 120, 240],
  "split-complementary": [0, 150, 210],
  tetradic: [0, 60, 180, 240],
  square: [0, 90, 180, 270],
};

/**
 * Harmony built by rotating the hue in OKLCH (lightness and chroma kept,
 * then mapped into sRGB). The first element is always the input color itself.
 */
export function harmony(c: Color, kind: Harmony): Color[] {
  const base = toOklch(c);
  if (kind === "monochromatic") {
    const steps = [-0.3, -0.15, 0.15, 0.3];
    return [c, ...steps.map((d) => toGamut(fromOklch(clamp(base.l + d, 0.08, 0.97), base.c, base.h, c.alpha)))];
  }
  return HARMONY_OFFSETS[kind].map((d, i) => (i === 0 ? c : toGamut(fromOklch(base.l, base.c, base.h + d, c.alpha))));
}

export type MixSpace = "srgb" | "srgb-linear" | "oklab" | "oklch";

/**
 * Interpolate from a (t = 0) to b (t = 1) in the given space with premultiplied
 * alpha. In oklch, an achromatic endpoint takes the other endpoint's hue (CSS
 * "powerless hue"), so gray → blue stays on the blue hue instead of sweeping
 * through other hues.
 */
export function mix(a: Color, b: Color, t: number, space: MixSpace = "oklab"): Color {
  const alpha = a.alpha + (b.alpha - a.alpha) * t;
  const lerp = (x: number, y: number) => x + (y - x) * t;
  const pre = (v: Vec3, al: number): Vec3 => [v[0] * al, v[1] * al, v[2] * al];
  const un = (v: Vec3): Vec3 => (alpha > 0 ? [v[0] / alpha, v[1] / alpha, v[2] / alpha] : v);
  const lerp3 = (x: Vec3, y: Vec3): Vec3 => [lerp(x[0], y[0]), lerp(x[1], y[1]), lerp(x[2], y[2])];
  switch (space) {
    case "srgb":
      return fromVec(un(lerp3(pre(rgbVec(a), a.alpha), pre(rgbVec(b), b.alpha))), alpha);
    case "srgb-linear":
      return fromLinearRgb(un(lerp3(pre(toLinearRgb(a), a.alpha), pre(toLinearRgb(b), b.alpha))), alpha);
    case "oklab": {
      const x = toOklab(a);
      const y = toOklab(b);
      const v = un(lerp3(pre([x.l, x.a, x.b], a.alpha), pre([y.l, y.a, y.b], b.alpha)));
      return fromOklab(v[0], v[1], v[2], alpha);
    }
    case "oklch": {
      const x = toOklch(a);
      const y = toOklch(b);
      const achroma = 0.0004;
      let h1 = x.h;
      let h2 = y.h;
      if (x.c < achroma) h1 = h2;
      if (y.c < achroma) h2 = h1;
      let d = h2 - h1;
      if (d > 180) d -= 360;
      else if (d < -180) d += 360;
      const l = un([lerp(x.l * a.alpha, y.l * b.alpha), lerp(x.c * a.alpha, y.c * b.alpha), 0]);
      return fromOklch(l[0], l[1], h1 + d * t, alpha);
    }
  }
}

const NAMED_PARSED: { name: string; hex: string; color: Color; lab: { l: number; a: number; b: number } }[] = (() => {
  const seen = new Set<string>();
  const out: { name: string; hex: string; color: Color; lab: { l: number; a: number; b: number } }[] = [];
  for (const [name, hex] of NAMED_COLORS) {
    if (seen.has(hex)) continue; // aliases (grey, cyan, magenta…) resolve to the first spelling
    seen.add(hex);
    const color = parseHex(hex)!;
    out.push({ name, hex: hex.toUpperCase(), color, lab: toOklab(color) });
  }
  return out;
})();

/** Closest CSS named colors by ΔEOK (aliases excluded, sorted by distance). */
export function nearestNamed(c: Color, count = 1, exclude?: string): { name: string; hex: string; distance: number }[] {
  const p = toOklab(toGamut({ ...c, alpha: 1 }));
  return NAMED_PARSED.filter((n) => n.name !== exclude)
    .map((n) => ({ name: n.name, hex: n.hex, distance: Math.hypot(p.l - n.lab.l, p.a - n.lab.a, p.b - n.lab.b) }))
    .sort((x, y) => x.distance - y.distance)
    .slice(0, count);
}

/** Convenience: parse a hex string (with or without #) — throws on invalid input. */
export function hex(s: string): Color {
  const c = parseHex(s.trim().toLowerCase());
  if (!c) throw new Error(`Invalid hex color: ${s}`);
  return c;
}

