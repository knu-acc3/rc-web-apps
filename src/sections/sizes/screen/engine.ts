/** Screen geometry: aspect ratios, pixel density, physical size, resolution names. */

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) [x, y] = [y, x % y];
  return x;
}

/** Reduce W:H by the greatest common divisor (1920×1080 → [16, 9]). */
export function reduceRatio(w: number, h: number): [number, number] {
  const g = gcd(w, h) || 1;
  return [Math.round(w) / g, Math.round(h) / g];
}

export interface NamedRatio {
  label: string;
  w: number;
  h: number;
  /** Relative tolerance for "≈" matching. */
  tol: number;
}

/** Ratios people actually use. "21:9" is a marketing label for 64:27, 43:18 and 12:5 panels. */
export const COMMON_RATIOS: NamedRatio[] = [
  { label: "1:1", w: 1, h: 1, tol: 0.005 },
  { label: "5:4", w: 5, h: 4, tol: 0.005 },
  { label: "4:3", w: 4, h: 3, tol: 0.005 },
  { label: "3:2", w: 3, h: 2, tol: 0.005 },
  { label: "16:10", w: 16, h: 10, tol: 0.005 },
  { label: "5:3", w: 5, h: 3, tol: 0.005 },
  { label: "16:9", w: 16, h: 9, tol: 0.005 },
  { label: "2:1", w: 2, h: 1, tol: 0.005 },
  { label: "19.5:9", w: 19.5, h: 9, tol: 0.005 },
  { label: "20:9", w: 20, h: 9, tol: 0.005 },
  { label: "21:9", w: 21, h: 9, tol: 0.035 },
  { label: "32:9", w: 32, h: 9, tol: 0.005 },
];

export interface RatioMatch {
  /** Label in landscape form ("16:9"). */
  label: string;
  /** Label oriented like the input ("9:16" for portrait). */
  oriented: string;
  exact: boolean;
  /** Relative difference from the named ratio. */
  error: number;
}

/** Closest common ratio within its tolerance, or null. */
export function nearestCommonRatio(w: number, h: number): RatioMatch | null {
  if (!(w > 0 && h > 0)) return null;
  const portrait = h > w;
  const r = portrait ? h / w : w / h;
  let best: RatioMatch | null = null;
  for (const c of COMMON_RATIOS) {
    const v = c.w / c.h;
    const err = Math.abs(r - v) / v;
    if (err <= c.tol && (!best || err < best.error)) {
      const [a, b] = c.label.split(":");
      best = { label: c.label, oriented: portrait ? `${b}:${a}` : c.label, exact: err < 1e-9, error: err };
    }
  }
  return best;
}

export const megapixels = (w: number, h: number) => (w * h) / 1e6;

/**
 * Physical resolution from what the browser reports: CSS pixels × devicePixelRatio.
 * A 4K monitor at 150% scaling reports 2560 × 1440 CSS px — naming that "QHD" would be wrong.
 */
export function physicalPixels(cssW: number, cssH: number, dpr: number): [number, number] {
  return [Math.round(cssW * dpr), Math.round(cssH * dpr)];
}

/** Pixels per inch for a diagonal in inches. */
export const ppi = (w: number, h: number, diagIn: number) => Math.hypot(w, h) / diagIn;

/** Dot (pixel) pitch in millimetres. */
export const dotPitchMm = (p: number) => 25.4 / p;

/** Physical width/height in inches for a diagonal. */
export function physicalSize(w: number, h: number, diagIn: number): [number, number] {
  const d = Math.hypot(w, h);
  return [(diagIn * w) / d, (diagIn * h) / d];
}

/** Distance (inches) beyond which single pixels are not resolved by 20/20 vision (1 arcminute). */
export const retinaDistanceIn = (p: number) => 1 / (p * Math.tan(Math.PI / 180 / 60));

/** Solve the missing side for a ratio. */
export const heightFor = (rw: number, rh: number, w: number) => (w * rh) / rw;
export const widthFor = (rw: number, rh: number, h: number) => (h * rw) / rh;

/** Round to the nearest even integer (video encoders need even dimensions). */
export const roundEven = (n: number) => 2 * Math.round(n / 2);

/** Standard names of resolutions (landscape key "WxH"). */
export const RESOLUTION_NAMES: Record<string, string> = {
  "640x480": "VGA",
  "800x600": "SVGA",
  "1024x768": "XGA",
  "1280x720": "HD (720p)",
  "1280x800": "WXGA",
  "1280x1024": "SXGA",
  "1366x768": "WXGA (HD)",
  "1440x900": "WXGA+",
  "1600x900": "HD+",
  "1600x1200": "UXGA",
  "1680x1050": "WSXGA+",
  "1920x1080": "Full HD (1080p)",
  "1920x1200": "WUXGA",
  "2048x1080": "DCI 2K",
  "2048x1536": "QXGA",
  "2400x1080": "FHD+",
  "2560x1080": "UW-FHD",
  "2560x1440": "QHD / WQHD (1440p)",
  "2560x1600": "WQXGA",
  "3200x1440": "QHD+ (WQHD+)",
  "3440x1440": "UWQHD",
  "3840x2160": "4K UHD (2160p)",
  "4096x2160": "DCI 4K",
  "5120x1440": "DQHD (32:9)",
  "5120x2880": "5K",
  "7680x4320": "8K UHD",
};

export function resolutionName(w: number, h: number): string | null {
  const key = w >= h ? `${w}x${h}` : `${h}x${w}`;
  return RESOLUTION_NAMES[key] ?? null;
}

/** Ratio label with a locale decimal separator ("19,5:9"). */
export const ratioText = (label: string, locale: "ru" | "en") => (locale === "ru" ? label.replace(".", ",") : label);
