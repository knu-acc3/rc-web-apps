/** Pure geometry: resize planning, crop rectangles, rotation bounds. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ───────────── resize ───────────── */

export type ResizeMode = "percent" | "long" | "box";
export type FitMode = "contain" | "cover" | "stretch" | "pad";

export interface ResizeSpec {
  mode: ResizeMode;
  /** box: target width (optional when height is set) */
  width?: number;
  /** box: target height (optional when width is set) */
  height?: number;
  /** box with both sides: how to fit */
  fit?: FitMode;
  percent?: number;
  /** long side in px */
  long?: number;
  /** Allow output larger than the source (off by default). */
  allowUpscale?: boolean;
}

interface ResizePlan {
  /** Output canvas size */
  w: number;
  h: number;
  /** Source rectangle */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Destination rectangle on the output canvas */
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  /** The requested size was reduced because upscaling is not allowed. */
  limited: boolean;
  /** Output differs from the source size. */
  changed: boolean;
}

const r = (n: number) => Math.max(1, Math.round(n));

function plan(srcW: number, srcH: number, w: number, h: number, limited: boolean, src?: Rect, dst?: Rect): ResizePlan {
  const s = src ?? { x: 0, y: 0, w: srcW, h: srcH };
  const d = dst ?? { x: 0, y: 0, w, h };
  return { w, h, sx: s.x, sy: s.y, sw: s.w, sh: s.h, dx: d.x, dy: d.y, dw: d.w, dh: d.h, limited, changed: w !== srcW || h !== srcH || !!src };
}

/** Uniform scale of the whole image, capped at 1 unless upscaling is allowed. */
function scaleWhole(srcW: number, srcH: number, k: number, allowUp: boolean): ResizePlan {
  const limited = !allowUp && k > 1;
  const kk = limited ? 1 : k;
  return plan(srcW, srcH, r(srcW * kk), r(srcH * kk), limited);
}

/**
 * Compute the output size and draw rectangles for a resize.
 * Never enlarges the image unless `allowUpscale` is true.
 */
export function planResize(srcW: number, srcH: number, spec: ResizeSpec): ResizePlan {
  const up = !!spec.allowUpscale;
  if (spec.mode === "percent") return scaleWhole(srcW, srcH, Math.max(0.01, (spec.percent ?? 100) / 100), up);
  if (spec.mode === "long") return scaleWhole(srcW, srcH, Math.max(1, spec.long ?? Math.max(srcW, srcH)) / Math.max(srcW, srcH), up);

  const W = spec.width && spec.width > 0 ? spec.width : 0;
  const H = spec.height && spec.height > 0 ? spec.height : 0;
  if (!W && !H) return plan(srcW, srcH, srcW, srcH, false);
  if (W && !H) return scaleWhole(srcW, srcH, W / srcW, up);
  if (H && !W) return scaleWhole(srcW, srcH, H / srcH, up);

  const fit = spec.fit ?? "contain";
  if (fit === "contain") return scaleWhole(srcW, srcH, Math.min(W / srcW, H / srcH), up);

  if (fit === "stretch") {
    const w = up ? W : Math.min(W, srcW);
    const h = up ? H : Math.min(H, srcH);
    return plan(srcW, srcH, w, h, w !== W || h !== H);
  }

  if (fit === "cover") {
    const k = Math.max(W / srcW, H / srcH);
    // Without upscaling, keep the target aspect but shrink the target to what the source can fill.
    const limited = !up && k > 1;
    const w = limited ? r(W / k) : W;
    const h = limited ? r(H / k) : H;
    const kk = limited ? 1 : k;
    const sw = Math.min(srcW, w / kk);
    const sh = Math.min(srcH, h / kk);
    return plan(srcW, srcH, w, h, limited, { x: (srcW - sw) / 2, y: (srcH - sh) / 2, w: sw, h: sh });
  }

  // pad: exact canvas, whole image centred inside
  const k = Math.min(W / srcW, H / srcH);
  const limited = !up && k > 1;
  const kk = limited ? 1 : k;
  const dw = r(srcW * kk);
  const dh = r(srcH * kk);
  return { ...plan(srcW, srcH, W, H, limited, undefined, { x: Math.round((W - dw) / 2), y: Math.round((H - dh) / 2), w: dw, h: dh }), changed: true };
}

/** Millimetres → pixels at a DPI. */
export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

/** Greatest common divisor, for aspect labels. */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/* ───────────── crop ───────────── */

/** Largest rectangle of the given aspect (w/h) centred in the image. */
export function centeredAspectRect(imgW: number, imgH: number, aspect: number | null, cover = 1): Rect {
  if (!aspect) {
    const w = imgW * cover;
    const h = imgH * cover;
    return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h };
  }
  let w = imgW * cover;
  let h = w / aspect;
  if (h > imgH * cover) {
    h = imgH * cover;
    w = h * aspect;
  }
  return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h };
}

/** Clamp a rect inside the image, keeping its size when possible. */
export function clampRect(rc: Rect, imgW: number, imgH: number, min = 1): Rect {
  const w = Math.min(Math.max(min, rc.w), imgW);
  const h = Math.min(Math.max(min, rc.h), imgH);
  const x = Math.min(Math.max(0, rc.x), imgW - w);
  const y = Math.min(Math.max(0, rc.y), imgH - h);
  return { x, y, w, h };
}

export type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/**
 * Resize a crop rectangle by dragging a handle by (dx, dy) image pixels.
 * With an aspect ratio the rectangle keeps it exactly, also when it hits the
 * image edges (the constrained side is derived from the clamped one).
 */
export function dragHandle(rc: Rect, handle: Handle, dx: number, dy: number, imgW: number, imgH: number, aspect: number | null, min = 8): Rect {
  const west = handle.includes("w");
  const east = handle.includes("e");
  const north = handle.includes("n");
  const south = handle.includes("s");
  // anchor = the opposite side/corner stays fixed
  const ax = west ? rc.x + rc.w : rc.x;
  const ay = north ? rc.y + rc.h : rc.y;
  // max size allowed from the anchor towards the dragged direction
  const maxW = west ? ax : imgW - ax;
  const maxH = north ? ay : imgH - ay;

  let w = rc.w + (east ? dx : west ? -dx : 0);
  let h = rc.h + (south ? dy : north ? -dy : 0);

  if (aspect) {
    const horizontal = east || west;
    const vertical = north || south;
    const cx = rc.x + rc.w / 2;
    const cy = rc.y + rc.h / 2;
    let limW: number;
    if (horizontal && vertical) {
      // corner: follow the larger relative change, anchor = opposite corner
      if (Math.abs(w / rc.w - 1) < Math.abs(h / rc.h - 1)) w = h * aspect;
      limW = Math.min(maxW, maxH * aspect);
    } else if (horizontal) {
      // side handle: the other axis grows around the centre
      limW = Math.min(maxW, 2 * Math.min(cy, imgH - cy) * aspect);
    } else {
      w = h * aspect;
      limW = Math.min(2 * Math.min(cx, imgW - cx), maxH * aspect);
    }
    const minW = Math.max(min, min * aspect);
    w = Math.max(Math.min(minW, limW), Math.min(w, limW));
    h = w / aspect;
    const x = west ? ax - w : east ? ax : cx - w / 2;
    const y = north ? ay - h : south ? ay : cy - h / 2;
    return { x, y, w, h };
  }

  w = Math.max(min, Math.min(w, maxW));
  h = Math.max(min, Math.min(h, maxH));
  if (!(east || west)) w = rc.w;
  if (!(north || south)) h = rc.h;
  const x = west ? ax - w : rc.x;
  const y = north ? ay - h : rc.y;
  return { x, y, w, h };
}

/** Re-fit an existing rect to a new aspect ratio around its centre, inside the image. */
export function applyAspect(rc: Rect, aspect: number | null, imgW: number, imgH: number): Rect {
  if (!aspect) return clampRect(rc, imgW, imgH);
  const cx = rc.x + rc.w / 2;
  const cy = rc.y + rc.h / 2;
  const area = rc.w * rc.h;
  let w = Math.sqrt(area * aspect);
  let h = w / aspect;
  const k = Math.min(1, imgW / w, imgH / h);
  w *= k;
  h *= k;
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h }, imgW, imgH);
}

/** Round a rect to whole pixels inside the image. */
export function roundRect(rc: Rect, imgW: number, imgH: number): Rect {
  const x = Math.max(0, Math.min(imgW - 1, Math.round(rc.x)));
  const y = Math.max(0, Math.min(imgH - 1, Math.round(rc.y)));
  const w = Math.max(1, Math.min(imgW - x, Math.round(rc.w)));
  const h = Math.max(1, Math.min(imgH - y, Math.round(rc.h)));
  return { x, y, w, h };
}

/* ───────────── rotation ───────────── */

/** Bounding box of a w×h rectangle rotated by `deg` degrees. */
export function rotatedBounds(w: number, h: number, deg: number): { w: number; h: number } {
  const a = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  return { w: w * c + h * s, h: w * s + h * c };
}

/**
 * Largest axis-aligned rectangle that fits inside a w×h rectangle rotated by
 * `deg` degrees (used for "auto-crop" after free rotation — no empty corners).
 */
export function largestInscribed(w: number, h: number, deg: number): { w: number; h: number } {
  if (w <= 0 || h <= 0) return { w: 0, h: 0 };
  const a = (deg * Math.PI) / 180;
  const sinA = Math.abs(Math.sin(a));
  const cosA = Math.abs(Math.cos(a));
  const wideIsW = w >= h;
  const long = wideIsW ? w : h;
  const short = wideIsW ? h : w;
  if (short <= 2 * sinA * cosA * long || Math.abs(sinA - cosA) < 1e-10) {
    // half-constrained: two corners touch the longer side
    const x = 0.5 * short;
    const [wr, hr] = wideIsW ? [x / sinA, x / cosA] : [x / cosA, x / sinA];
    if (!Number.isFinite(wr) || !Number.isFinite(hr)) return { w, h };
    return { w: wr, h: hr };
  }
  const cos2a = cosA * cosA - sinA * sinA;
  return { w: (w * cosA - h * sinA) / cos2a, h: (h * cosA - w * sinA) / cos2a };
}
