import { round } from "./tokens";

export type Bezier = [number, number, number, number];

/** y(x) for cubic-bezier(x1, y1, x2, y2) with fixed ends (0,0) and (1,1). */
export function bezierAt(b: Bezier, x: number): number {
  const [x1, y1, x2, y2] = b;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  // Newton–Raphson, then bisection as a fallback.
  let t = x;
  for (let i = 0; i < 8; i++) {
    const err = sx(t) - x;
    if (Math.abs(err) < 1e-7) return sy(t);
    const d = dx(t);
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  let lo = 0;
  let hi = 1;
  t = x;
  for (let i = 0; i < 60; i++) {
    const v = sx(t);
    if (Math.abs(v - x) < 1e-7) break;
    if (v < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return sy(t);
}

export function bezierCss(b: Bezier): string {
  return `cubic-bezier(${b.map((v) => round(v, 3)).join(", ")})`;
}

/** Parse "cubic-bezier(a, b, c, d)" or a keyword; x values must be within 0…1. */
export function parseBezier(s: string): Bezier | null {
  const k = s.trim().toLowerCase();
  const kw = BEZIER_KEYWORDS[k];
  if (kw) return kw;
  const m = /^cubic-bezier\(\s*([^)]*)\)$/.exec(k);
  if (!m) return null;
  const v = m[1].split(",").map((x) => Number(x.trim()));
  if (v.length !== 4 || v.some((x) => !Number.isFinite(x))) return null;
  if (v[0] < 0 || v[0] > 1 || v[2] < 0 || v[2] > 1) return null;
  return v as Bezier;
}

export const BEZIER_KEYWORDS: Record<string, Bezier> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

export interface BezierPreset {
  name: string;
  value: Bezier;
}

export const BEZIER_PRESETS: BezierPreset[] = [
  { name: "ease", value: [0.25, 0.1, 0.25, 1] },
  { name: "ease-in", value: [0.42, 0, 1, 1] },
  { name: "ease-out", value: [0, 0, 0.58, 1] },
  { name: "ease-in-out", value: [0.42, 0, 0.58, 1] },
  { name: "linear", value: [0, 0, 1, 1] },
  { name: "Tailwind ease-in", value: [0.4, 0, 1, 1] },
  { name: "Tailwind ease-out", value: [0, 0, 0.2, 1] },
  { name: "Tailwind ease-in-out", value: [0.4, 0, 0.2, 1] },
  { name: "easeOutCubic", value: [0.33, 1, 0.68, 1] },
  { name: "easeInOutCubic", value: [0.65, 0, 0.35, 1] },
  { name: "easeOutQuart", value: [0.25, 1, 0.5, 1] },
  { name: "easeOutExpo", value: [0.16, 1, 0.3, 1] },
  { name: "easeInOutExpo", value: [0.87, 0, 0.13, 1] },
  { name: "easeOutBack", value: [0.34, 1.56, 0.64, 1] },
  { name: "easeInBack", value: [0.36, 0, 0.66, -0.56] },
  { name: "easeInOutBack", value: [0.68, -0.6, 0.32, 1.6] },
];
