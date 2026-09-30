/**
 * Pixel filters on RGBA buffers. No `ctx.filter` (missing in Safari) — every
 * effect is plain arithmetic, so the preview and the full-resolution export
 * look the same in every browser.
 */
import type { FilterId } from "../data/types";

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface FilterParams {
  /** Main value; meaning per filter (see FILTERS). */
  amount: number;
  /** Duotone shadow / highlight colours (#RRGGBB). */
  color1?: string;
  color2?: string;
  /** Black & white: Floyd–Steinberg dithering. */
  dither?: boolean;
  /** Vignette: size of the untouched centre, 0–100. */
  size?: number;
}

export interface FilterDef {
  id: FilterId;
  min: number;
  max: number;
  step: number;
  def: number;
  unit: "%" | "px" | "°" | "" | "lv";
  /** Value is a length in full-resolution pixels (scaled for previews). */
  px?: boolean;
}

export const FILTERS: Record<FilterId, FilterDef> = {
  grayscale: { id: "grayscale", min: 0, max: 100, step: 1, def: 100, unit: "%" },
  sepia: { id: "sepia", min: 0, max: 100, step: 1, def: 100, unit: "%" },
  invert: { id: "invert", min: 0, max: 100, step: 1, def: 100, unit: "%" },
  blur: { id: "blur", min: 1, max: 100, step: 1, def: 6, unit: "px", px: true },
  sharpen: { id: "sharpen", min: 0, max: 300, step: 5, def: 80, unit: "%" },
  brightness: { id: "brightness", min: 0, max: 300, step: 1, def: 125, unit: "%" },
  contrast: { id: "contrast", min: 0, max: 300, step: 1, def: 130, unit: "%" },
  saturation: { id: "saturation", min: 0, max: 300, step: 1, def: 160, unit: "%" },
  "hue-rotate": { id: "hue-rotate", min: -180, max: 180, step: 1, def: 90, unit: "°" },
  vintage: { id: "vintage", min: 0, max: 100, step: 1, def: 80, unit: "%" },
  pixelate: { id: "pixelate", min: 2, max: 100, step: 1, def: 12, unit: "px", px: true },
  posterize: { id: "posterize", min: 2, max: 16, step: 1, def: 4, unit: "lv" },
  "black-and-white": { id: "black-and-white", min: 0, max: 255, step: 1, def: 128, unit: "" },
  duotone: { id: "duotone", min: 0, max: 100, step: 1, def: 100, unit: "%" },
  vignette: { id: "vignette", min: 0, max: 100, step: 1, def: 60, unit: "%" },
  emboss: { id: "emboss", min: 0, max: 100, step: 1, def: 100, unit: "%" },
  sketch: { id: "sketch", min: 1, max: 60, step: 1, def: 10, unit: "px", px: true },
  noise: { id: "noise", min: 0, max: 100, step: 1, def: 30, unit: "" },
  warm: { id: "warm", min: 0, max: 100, step: 1, def: 50, unit: "" },
  cool: { id: "cool", min: 0, max: 100, step: 1, def: 50, unit: "" },
};

export const FILTER_IDS = Object.keys(FILTERS) as FilterId[];

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

type M3 = [number, number, number, number, number, number, number, number, number];

function applyMatrix(d: Uint8ClampedArray, m: M3, offset: [number, number, number] = [0, 0, 0]) {
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    d[i] = m[0] * r + m[1] * g + m[2] * b + offset[0];
    d[i + 1] = m[3] * r + m[4] * g + m[5] * b + offset[1];
    d[i + 2] = m[6] * r + m[7] * g + m[8] * b + offset[2];
  }
}

export function sepiaMatrix(a: number): M3 {
  const k = 1 - a;
  return [
    0.393 + 0.607 * k,
    0.769 - 0.769 * k,
    0.189 - 0.189 * k,
    0.349 - 0.349 * k,
    0.686 + 0.314 * k,
    0.168 - 0.168 * k,
    0.272 - 0.272 * k,
    0.534 - 0.534 * k,
    0.131 + 0.869 * k,
  ];
}

export function saturateMatrix(s: number): M3 {
  return [
    0.213 + 0.787 * s,
    0.715 - 0.715 * s,
    0.072 - 0.072 * s,
    0.213 - 0.213 * s,
    0.715 + 0.285 * s,
    0.072 - 0.072 * s,
    0.213 - 0.213 * s,
    0.715 - 0.715 * s,
    0.072 + 0.928 * s,
  ];
}

export function hueMatrix(deg: number): M3 {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [
    0.213 + c * 0.787 - s * 0.213,
    0.715 - c * 0.715 - s * 0.715,
    0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143,
    0.715 + c * 0.285 + s * 0.14,
    0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787,
    0.715 - c * 0.715 + s * 0.715,
    0.072 + c * 0.928 + s * 0.072,
  ];
}

function perChannel(d: Uint8ClampedArray, f: (v: number) => number) {
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = f(v);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]];
    d[i + 1] = lut[d[i + 1]];
    d[i + 2] = lut[d[i + 2]];
  }
}

/* ───────────── blur ───────────── */

function boxesForGauss(sigma: number, n = 3): number[] {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
  const m = Math.round(mIdeal);
  return Array.from({ length: n }, (_, i) => ((i < m ? wl : wu) - 1) / 2);
}

function boxH(d: Uint8ClampedArray | Float32Array, w: number, h: number, r: number, tmp: Float32Array) {
  if (r < 1) return;
  const span = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let c = 0; c < 4; c++) {
      let acc = 0;
      // extend edges
      const first = d[row + c];
      const last = d[row + (w - 1) * 4 + c];
      acc = first * r;
      for (let x = 0; x < r; x++) acc += d[row + Math.min(w - 1, x) * 4 + c];
      for (let x = 0; x < w; x++) {
        const add = x + r < w ? d[row + (x + r) * 4 + c] : last;
        acc += add;
        tmp[x] = acc / span;
        const sub = x - r >= 0 ? d[row + (x - r) * 4 + c] : first;
        acc -= sub;
      }
      for (let x = 0; x < w; x++) d[row + x * 4 + c] = tmp[x];
    }
  }
}

function boxV(d: Uint8ClampedArray | Float32Array, w: number, h: number, r: number, tmp: Float32Array) {
  if (r < 1) return;
  const span = r * 2 + 1;
  const stride = w * 4;
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 4; c++) {
      const col = x * 4 + c;
      const first = d[col];
      const last = d[(h - 1) * stride + col];
      let acc = first * r;
      for (let y = 0; y < r; y++) acc += d[Math.min(h - 1, y) * stride + col];
      for (let y = 0; y < h; y++) {
        acc += y + r < h ? d[(y + r) * stride + col] : last;
        tmp[y] = acc / span;
        acc -= y - r >= 0 ? d[(y - r) * stride + col] : first;
      }
      for (let y = 0; y < h; y++) d[y * stride + col] = tmp[y];
    }
  }
}

function hasAlpha(d: Uint8ClampedArray): boolean {
  for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
  return false;
}

/** Gaussian blur (3 box passes), alpha-correct (premultiplied while blurring). */
export function gaussianBlur(p: Pixels, sigma: number) {
  if (sigma < 0.3) return;
  const { data: d, width: w, height: h } = p;
  const tmp = new Float32Array(Math.max(w, h));
  const radii = boxesForGauss(sigma).map((r) => Math.round(r));
  if (!hasAlpha(d)) {
    for (const rr of radii) {
      boxH(d, w, h, Math.min(rr, w - 1), tmp);
      boxV(d, w, h, Math.min(rr, h - 1), tmp);
    }
    return;
  }
  // Premultiply to avoid dark halos around transparent areas. Float buffer
  // keeps precision for low alpha (8-bit fallback on very large images).
  const f: Float32Array | Uint8ClampedArray = d.length <= 64_000_000 ? new Float32Array(d) : d;
  for (let i = 0; i < f.length; i += 4) {
    const a = f[i + 3] / 255;
    f[i] *= a;
    f[i + 1] *= a;
    f[i + 2] *= a;
  }
  for (const rr of radii) {
    boxH(f, w, h, Math.min(rr, w - 1), tmp);
    boxV(f, w, h, Math.min(rr, h - 1), tmp);
  }
  for (let i = 0; i < f.length; i += 4) {
    const a = f[i + 3];
    const k = a > 0 ? 255 / a : 0;
    d[i] = f[i] * k;
    d[i + 1] = f[i + 1] * k;
    d[i + 2] = f[i + 2] * k;
    d[i + 3] = a;
  }
}

/* ───────────── other spatial filters ───────────── */

export function pixelate(p: Pixels, block: number) {
  const { data: d, width: w, height: h } = p;
  const s = Math.max(1, Math.round(block));
  if (s <= 1) return;
  for (let by = 0; by < h; by += s) {
    for (let bx = 0; bx < w; bx += s) {
      const ex = Math.min(w, bx + s);
      const ey = Math.min(h, by + s);
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        n = 0;
      for (let y = by; y < ey; y++)
        for (let x = bx; x < ex; x++) {
          const o = (y * w + x) * 4;
          const al = d[o + 3];
          r += d[o] * al;
          g += d[o + 1] * al;
          b += d[o + 2] * al;
          a += al;
          n++;
        }
      const ar = a / n;
      const rr = a ? r / a : 0,
        gg = a ? g / a : 0,
        bb = a ? b / a : 0;
      for (let y = by; y < ey; y++)
        for (let x = bx; x < ex; x++) {
          const o = (y * w + x) * 4;
          d[o] = rr;
          d[o + 1] = gg;
          d[o + 2] = bb;
          d[o + 3] = ar;
        }
    }
  }
}

function convolve3(p: Pixels, k: number[]) {
  const { data: d, width: w, height: h } = p;
  const src = d.slice();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const yy = Math.min(h - 1, Math.max(0, y + ky));
        for (let kx = -1; kx <= 1; kx++) {
          const xx = Math.min(w - 1, Math.max(0, x + kx));
          const o = (yy * w + xx) * 4;
          const kv = k[(ky + 1) * 3 + (kx + 1)];
          r += src[o] * kv;
          g += src[o + 1] * kv;
          b += src[o + 2] * kv;
        }
      }
      const o = (y * w + x) * 4;
      d[o] = r;
      d[o + 1] = g;
      d[o + 2] = b;
    }
  }
}

function blend(d: Uint8ClampedArray, orig: Uint8ClampedArray, a: number) {
  if (a >= 1) return;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = orig[i] + (d[i] - orig[i]) * a;
    d[i + 1] = orig[i + 1] + (d[i + 1] - orig[i + 1]) * a;
    d[i + 2] = orig[i + 2] + (d[i + 2] - orig[i + 2]) * a;
  }
}

function vignette(p: Pixels, strength: number, size: number) {
  const { data: d, width: w, height: h } = p;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const maxD = Math.sqrt(cx * cx + cy * cy) || 1;
  const inner = Math.min(0.95, Math.max(0, size));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxD;
      let t = (dist - inner) / (1 - inner);
      if (t <= 0) continue;
      if (t > 1) t = 1;
      const m = 1 - strength * t * t * (3 - 2 * t);
      const o = (y * w + x) * 4;
      d[o] *= m;
      d[o + 1] *= m;
      d[o + 2] *= m;
    }
  }
}

function floydSteinberg(p: Pixels, threshold: number) {
  const { data: d, width: w, height: h } = p;
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = lum(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = g[i];
      const nv = old < threshold ? 0 : 255;
      const err = old - nv;
      g[i] = nv;
      if (x + 1 < w) g[i + 1] += (err * 7) / 16;
      if (y + 1 < h) {
        if (x > 0) g[i + w - 1] += (err * 3) / 16;
        g[i + w] += (err * 5) / 16;
        if (x + 1 < w) g[i + w + 1] += err / 16;
      }
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = nv;
    }
  }
}

/** Deterministic PRNG (mulberry32) — same grain on every export. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexRgb(hex: string | undefined, fallback: [number, number, number]): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return fallback;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/**
 * Apply a filter in place. `scale` = preview size / full size, so px-based
 * parameters look the same on a downscaled preview.
 */
export function applyFilter(p: Pixels, id: FilterId, params: FilterParams, scale = 1): void {
  const d = p.data;
  const v = params.amount;
  switch (id) {
    case "grayscale": {
      const a = v / 100;
      for (let i = 0; i < d.length; i += 4) {
        const y = lum(d[i], d[i + 1], d[i + 2]);
        d[i] += (y - d[i]) * a;
        d[i + 1] += (y - d[i + 1]) * a;
        d[i + 2] += (y - d[i + 2]) * a;
      }
      return;
    }
    case "sepia":
      return applyMatrix(d, sepiaMatrix(v / 100));
    case "invert": {
      const a = v / 100;
      for (let i = 0; i < d.length; i += 4) {
        d[i] += (255 - 2 * d[i]) * a;
        d[i + 1] += (255 - 2 * d[i + 1]) * a;
        d[i + 2] += (255 - 2 * d[i + 2]) * a;
      }
      return;
    }
    case "blur":
      return gaussianBlur(p, v * scale);
    case "sharpen": {
      const blurred: Pixels = { data: d.slice(), width: p.width, height: p.height };
      gaussianBlur(blurred, Math.max(0.6, 1.2 * scale));
      const a = v / 100;
      const b = blurred.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = d[i] + (d[i] - b[i]) * a;
        d[i + 1] = d[i + 1] + (d[i + 1] - b[i + 1]) * a;
        d[i + 2] = d[i + 2] + (d[i + 2] - b[i + 2]) * a;
      }
      return;
    }
    case "brightness": {
      const f = v / 100;
      return perChannel(d, (x) => x * f);
    }
    case "contrast": {
      const f = v / 100;
      return perChannel(d, (x) => (x - 127.5) * f + 127.5);
    }
    case "saturation":
      return applyMatrix(d, saturateMatrix(v / 100));
    case "hue-rotate":
      return applyMatrix(d, hueMatrix(v));
    case "vintage": {
      const a = v / 100;
      applyMatrix(d, sepiaMatrix(0.35 * a));
      const c = 1 - 0.15 * a;
      const lift = 22 * a;
      perChannel(d, (x) => ((x - 127.5) * c + 127.5) * (1 - lift / 255) + lift);
      for (let i = 0; i < d.length; i += 4) {
        d[i] += 12 * a;
        d[i + 2] -= 12 * a;
      }
      vignette(p, 0.35 * a, 0.45);
      return;
    }
    case "pixelate":
      return pixelate(p, Math.max(1, v * scale));
    case "posterize": {
      const n = Math.max(2, Math.round(v));
      const step = 255 / (n - 1);
      return perChannel(d, (x) => Math.round(x / step) * step);
    }
    case "black-and-white": {
      if (params.dither) return floydSteinberg(p, v);
      for (let i = 0; i < d.length; i += 4) {
        const y = lum(d[i], d[i + 1], d[i + 2]) < v ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = y;
      }
      return;
    }
    case "duotone": {
      const c1 = hexRgb(params.color1, [30, 26, 80]);
      const c2 = hexRgb(params.color2, [255, 196, 90]);
      const a = v / 100;
      for (let i = 0; i < d.length; i += 4) {
        const t = lum(d[i], d[i + 1], d[i + 2]) / 255;
        d[i] += (c1[0] + (c2[0] - c1[0]) * t - d[i]) * a;
        d[i + 1] += (c1[1] + (c2[1] - c1[1]) * t - d[i + 1]) * a;
        d[i + 2] += (c1[2] + (c2[2] - c1[2]) * t - d[i + 2]) * a;
      }
      return;
    }
    case "vignette":
      return vignette(p, v / 100, (params.size ?? 40) / 100);
    case "emboss": {
      const orig = d.slice();
      convolve3(p, [-2, -1, 0, -1, 1, 1, 0, 1, 2]);
      return blend(d, orig, v / 100);
    }
    case "sketch": {
      const gray = new Uint8ClampedArray(d.length);
      for (let i = 0; i < d.length; i += 4) {
        const y = lum(d[i], d[i + 1], d[i + 2]);
        gray[i] = gray[i + 1] = gray[i + 2] = 255 - y;
        gray[i + 3] = 255;
      }
      gaussianBlur({ data: gray, width: p.width, height: p.height }, Math.max(0.5, v * scale));
      for (let i = 0; i < d.length; i += 4) {
        const base = lum(d[i], d[i + 1], d[i + 2]);
        const top = gray[i];
        const out = top >= 255 ? 255 : Math.min(255, (base * 255) / (255 - top));
        d[i] = d[i + 1] = d[i + 2] = out;
      }
      return;
    }
    case "noise": {
      const rnd = mulberry32(0x9e3779b9);
      const amp = v * 1.2;
      for (let i = 0; i < d.length; i += 4) {
        // approx. normal distribution (sum of 3 uniforms)
        const n = (rnd() + rnd() + rnd() - 1.5) * amp;
        d[i] += n;
        d[i + 1] += n;
        d[i + 2] += n;
      }
      return;
    }
    case "warm":
    case "cool": {
      const a = (v / 100) * (id === "warm" ? 1 : -1);
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] + 28 * a);
        d[i + 1] = clamp(d[i + 1] + 6 * a);
        d[i + 2] = clamp(d[i + 2] - 28 * a);
      }
      return;
    }
  }
}

/** Default params for a filter. */
export function defaultParams(id: FilterId): FilterParams {
  const p: FilterParams = { amount: FILTERS[id].def };
  if (id === "duotone") {
    p.color1 = "#1E1A50";
    p.color2 = "#FFC45A";
  }
  if (id === "vignette") p.size = 40;
  return p;
}
