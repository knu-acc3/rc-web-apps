import { fromLinear, toLinear, type Color } from "../../lib/color";

export type CvdType = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";
export const CVD_TYPES: readonly CvdType[] = ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"];

type M3 = readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]];

/**
 * Machado, Oliveira & Fernandes (2009), "A Physiologically-based Model for Simulation of
 * Color Vision Deficiency", matrices for severity 1.0, applied to LINEAR sRGB.
 */
export const MACHADO: Record<Exclude<CvdType, "achromatopsia">, M3> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const ID: M3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
const ACHRO: M3 = [
  [0.2126, 0.7152, 0.0722],
  [0.2126, 0.7152, 0.0722],
  [0.2126, 0.7152, 0.0722],
];

/**
 * Matrix for a deficiency at a severity 0…1. Partial severities (anomalous trichromacy) are a
 * linear blend between normal vision and the full dichromacy matrix — an approximation.
 */
export function cvdMatrix(type: CvdType, severity = 1): number[] {
  const full = type === "achromatopsia" ? ACHRO : MACHADO[type];
  const s = Math.min(1, Math.max(0, severity));
  const out: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(ID[r][c] * (1 - s) + full[r][c] * s);
  return out;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function simulate(c: Color, type: CvdType, severity = 1): Color {
  const m = cvdMatrix(type, severity);
  const r = toLinear(clamp01(c.r));
  const g = toLinear(clamp01(c.g));
  const b = toLinear(clamp01(c.b));
  return {
    r: fromLinear(clamp01(m[0] * r + m[1] * g + m[2] * b)),
    g: fromLinear(clamp01(m[3] * r + m[4] * g + m[5] * b)),
    b: fromLinear(clamp01(m[6] * r + m[7] * g + m[8] * b)),
    alpha: c.alpha,
  };
}

/** 8-bit sRGB → linear lookup table for image processing. */
export function linearTable(): Float32Array {
  const t = new Float32Array(256);
  for (let i = 0; i < 256; i++) t[i] = toLinear(i / 255);
  return t;
}

/** Apply a matrix to RGBA pixels in place (used by the worker). */
export function simulatePixels(data: Uint8ClampedArray, m: readonly number[], lut: Float32Array): void {
  // Linear → 8-bit via a 4096-entry table for speed.
  const N = 4096;
  const enc = new Uint8ClampedArray(N + 1);
  for (let i = 0; i <= N; i++) enc[i] = Math.round(fromLinear(i / N) * 255);
  for (let i = 0; i < data.length; i += 4) {
    const r = lut[data[i]];
    const g = lut[data[i + 1]];
    const b = lut[data[i + 2]];
    data[i] = enc[Math.round(clamp01(m[0] * r + m[1] * g + m[2] * b) * N)];
    data[i + 1] = enc[Math.round(clamp01(m[3] * r + m[4] * g + m[5] * b) * N)];
    data[i + 2] = enc[Math.round(clamp01(m[6] * r + m[7] * g + m[8] * b) * N)];
  }
}
