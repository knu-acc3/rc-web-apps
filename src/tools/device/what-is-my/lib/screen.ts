/**
 * Pure screen / display helpers (no DOM access) — safe on the server and in unit tests.
 */

interface NamedResolution {
  /** Landscape width in physical pixels. */
  w: number;
  h: number;
  name: string;
  /** Short alternative name ("1080p"). */
  alias?: string;
}

/** Well-known display resolutions, landscape orientation, sorted by pixel count. */
export const RESOLUTIONS: readonly NamedResolution[] = [
  { w: 800, h: 600, name: "SVGA" },
  { w: 1024, h: 600, name: "WSVGA" },
  { w: 1024, h: 768, name: "XGA" },
  { w: 1280, h: 720, name: "HD", alias: "720p" },
  { w: 1280, h: 800, name: "WXGA" },
  { w: 1366, h: 768, name: "HD", alias: "WXGA" },
  { w: 1280, h: 1024, name: "SXGA" },
  { w: 1440, h: 900, name: "WXGA+" },
  { w: 1600, h: 900, name: "HD+" },
  { w: 1680, h: 1050, name: "WSXGA+" },
  { w: 1920, h: 1080, name: "Full HD", alias: "1080p" },
  { w: 1920, h: 1200, name: "WUXGA" },
  { w: 2048, h: 1080, name: "DCI 2K" },
  { w: 2560, h: 1080, name: "UW-FHD", alias: "21:9" },
  { w: 2560, h: 1440, name: "QHD", alias: "1440p" },
  { w: 2560, h: 1600, name: "WQXGA" },
  { w: 3440, h: 1440, name: "UWQHD", alias: "21:9" },
  { w: 3840, h: 2160, name: "4K UHD", alias: "2160p" },
  { w: 4096, h: 2160, name: "DCI 4K" },
  { w: 5120, h: 1440, name: "DQHD", alias: "32:9" },
  { w: 5120, h: 2160, name: "5K2K", alias: "21:9" },
  { w: 5120, h: 2880, name: "5K" },
  { w: 6016, h: 3384, name: "6K" },
  { w: 7680, h: 4320, name: "8K UHD", alias: "4320p" },
];

const isInt = (x: number) => Math.abs(x - Math.round(x)) < 1e-6;

interface PhysicalSize {
  w: number;
  h: number;
  /** True when the value had to be rounded or snapped (fractional scaling). */
  approx: boolean;
}

/**
 * Physical pixels = CSS pixels × devicePixelRatio. Browsers report `screen.width`
 * as an integer, so with fractional scaling (125 %, 175 %) the product can be off
 * by a pixel; values within ±ceil(dpr) px of a well-known resolution snap to it.
 */
export function physicalSize(cssW: number, cssH: number, dpr: number): PhysicalSize {
  const ratio = dpr > 0 && Number.isFinite(dpr) ? dpr : 1;
  const rw = cssW * ratio;
  const rh = cssH * ratio;
  const exact = isInt(rw) && isInt(rh);
  const tol = Math.max(1, Math.ceil(ratio));
  if (!exact) {
    for (const r of RESOLUTIONS) {
      for (const [a, b] of [
        [r.w, r.h],
        [r.h, r.w],
      ]) {
        if (Math.abs(a - rw) <= tol && Math.abs(b - rh) <= tol) return { w: a, h: b, approx: true };
      }
    }
  }
  return { w: Math.round(rw), h: Math.round(rh), approx: !exact };
}

interface ResolutionName {
  name: string;
  alias?: string;
  /** True for an exact well-known resolution, false for a size class estimate. */
  exact: boolean;
}

const CLASSES = [
  { name: "HD", short: 720, pixels: 1280 * 720 },
  { name: "Full HD", short: 1080, pixels: 1920 * 1080 },
  { name: "QHD", short: 1440, pixels: 2560 * 1440 },
] as const;

/** Name a resolution given in PHYSICAL pixels (orientation-agnostic). */
export function resolutionName(w: number, h: number): ResolutionName {
  const L = Math.max(w, h);
  const S = Math.min(w, h);
  const known = RESOLUTIONS.find((r) => r.w === L && r.h === S);
  if (known) return { name: known.name, alias: known.alias, exact: true };
  if (S <= 0) return { name: "—", exact: false };
  const ratio = L / S;
  // Wide high-density panels are commonly called by thousands of horizontal pixels (3K, 4.5K…).
  if (L >= 2800 && ratio <= 2) {
    const k = Math.round(L / 500) / 2;
    return { name: `${String(k)}K`, exact: false };
  }
  // Otherwise: the largest class the panel reaches both by short side and by pixel count.
  let cls: string | null = null;
  for (const c of CLASSES) if (S >= c.short * 0.97 && S * L >= c.pixels * 0.97) cls = c.name;
  if (!cls) return { name: "SD", exact: false };
  return { name: ratio > 1.8 ? `${cls}+` : cls, exact: false };
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

const COMMON_RATIOS: readonly [string, number][] = [
  ["1:1", 1],
  ["5:4", 5 / 4],
  ["4:3", 4 / 3],
  ["3:2", 3 / 2],
  ["16:10", 16 / 10],
  ["5:3", 5 / 3],
  ["16:9", 16 / 9],
  ["18:9", 2],
  ["19.5:9", 19.5 / 9],
  ["20:9", 20 / 9],
  ["21:9", 21 / 9],
  ["32:9", 32 / 9],
];

interface AspectRatio {
  /** Reduced fraction, e.g. "683:384". */
  exact: string;
  /** Nearest marketing ratio within 2.5 %, e.g. "16:9" (orientation preserved). */
  common: string | null;
}

export function aspectRatio(w: number, h: number): AspectRatio {
  if (w <= 0 || h <= 0) return { exact: "—", common: null };
  const g = gcd(w, h);
  const exact = `${Math.round(w / g)}:${Math.round(h / g)}`;
  const portrait = h > w;
  const r = portrait ? h / w : w / h;
  let best: [string, number] | null = null;
  let bestDiff = Infinity;
  for (const c of COMMON_RATIOS) {
    const d = Math.abs(r / c[1] - 1);
    if (d < bestDiff) {
      bestDiff = d;
      best = c;
    }
  }
  if (!best || bestDiff > 0.025) return { exact, common: null };
  const label = portrait ? best[0].split(":").reverse().join(":") : best[0];
  return { exact, common: label };
}

type BreakpointSystem = "tailwind" | "bootstrap";

const BREAKPOINTS: Record<BreakpointSystem, readonly [string, number][]> = {
  tailwind: [
    ["2xl", 1536],
    ["xl", 1280],
    ["lg", 1024],
    ["md", 768],
    ["sm", 640],
  ],
  bootstrap: [
    ["xxl", 1400],
    ["xl", 1200],
    ["lg", 992],
    ["md", 768],
    ["sm", 576],
  ],
};

export function breakpointTable(system: BreakpointSystem): readonly [string, number][] {
  return BREAKPOINTS[system];
}

/** Active breakpoint for a viewport width in CSS px (below the smallest one: "base" / "xs"). */
export function breakpoint(width: number, system: BreakpointSystem): string {
  for (const [name, min] of BREAKPOINTS[system]) if (width >= min) return name;
  return system === "bootstrap" ? "xs" : "base";
}

/* ───────────── DPI / PPI ───────────── */

/** CSS reference resolution: 1 CSS inch = 96 CSS px. */
const CSS_DPI = 96;
const MM_PER_INCH = 25.4;

/** "Logical" DPI the OS uses for scaling (NOT the physical pixel density). */
export function logicalDpi(dpr: number): number {
  return CSS_DPI * dpr;
}

/** Physical pixels per inch from a calibration (CSS px per mm) and devicePixelRatio. */
export function ppiFromCalibration(pxPerMm: number, dpr: number): number {
  return pxPerMm * MM_PER_INCH * dpr;
}

/** Pixel density from a physical resolution and a diagonal in inches. */
export function ppiFromDiagonal(w: number, h: number, diagonalInches: number): number {
  if (!(diagonalInches > 0)) return NaN;
  return Math.hypot(w, h) / diagonalInches;
}

/** Physical screen dimensions (inches) from a physical resolution and PPI. */
export function sizeFromPpi(w: number, h: number, ppi: number): { width: number; height: number; diagonal: number } {
  return { width: w / ppi, height: h / ppi, diagonal: Math.hypot(w, h) / ppi };
}

/** Distance between pixel centres in millimetres. */
export function dotPitchMm(ppi: number): number {
  return MM_PER_INCH / ppi;
}

export const CALIBRATION_KEY = "actual-size:calibration";
/** devicePixelRatio at calibration time: {"at": <same as calibration.at>, "dpr": number}. */
export const CALIBRATION_DPR_KEY = "actual-size:calibration-dpr";

interface Calibration {
  v: 1;
  /** CSS pixels per physical millimetre. */
  pxPerMm: number;
  method: "card" | "diagonal";
  /** Epoch ms of the calibration. */
  at: number;
}

/** Validate the JSON stored by the actual-size calibration page. */
export function parseCalibration(raw: string | null | undefined): Calibration | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<Calibration>;
    if (o?.v !== 1) return null;
    if (typeof o.pxPerMm !== "number" || !Number.isFinite(o.pxPerMm) || o.pxPerMm < 1.5 || o.pxPerMm > 15) return null;
    if (o.method !== "card" && o.method !== "diagonal") return null;
    const at = typeof o.at === "number" && Number.isFinite(o.at) ? o.at : 0;
    return { v: 1, pxPerMm: o.pxPerMm, method: o.method, at };
  } catch {
    return null;
  }
}

/** DPR stored next to a calibration; only valid when it belongs to the same calibration (`at`). */
export function parseCalibrationDpr(raw: string | null | undefined, at: number): number | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { at?: unknown; dpr?: unknown };
    return o?.at === at && typeof o.dpr === "number" && Number.isFinite(o.dpr) && o.dpr > 0 ? o.dpr : null;
  } catch {
    return null;
  }
}
