/** Pure helpers for the function plotter: view window, sampling with discontinuity breaks. */

export interface View {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export const DEFAULT_VIEW: View = { x0: -10, x1: 10, y0: -6, y1: 6 };

export function parseView(s: string): View | null {
  const p = s.split("_").map(Number);
  if (p.length !== 4 || p.some((x) => !Number.isFinite(x))) return null;
  const [x0, x1, y0, y1] = p;
  if (!(x1 > x0) || !(y1 > y0)) return null;
  return { x0, x1, y0, y1 };
}

export const serializeView = (v: View) => [v.x0, v.x1, v.y0, v.y1].map((n) => Number(n.toPrecision(6))).join("_");

/** Zoom by `factor` (< 1 zooms in) around the point (cx, cy) in world coordinates. */
export function zoomAt(v: View, factor: number, cx: number, cy: number): View {
  const f = Math.min(1e6, Math.max(1e-6, factor));
  const nv = { x0: cx - (cx - v.x0) * f, x1: cx + (v.x1 - cx) * f, y0: cy - (cy - v.y0) * f, y1: cy + (v.y1 - cy) * f };
  // keep the window within sane bounds
  if (nv.x1 - nv.x0 < 1e-6 || nv.x1 - nv.x0 > 1e7) return v;
  return nv;
}

export function pan(v: View, dx: number, dy: number): View {
  return { x0: v.x0 + dx, x1: v.x1 + dx, y0: v.y0 + dy, y1: v.y1 + dy };
}

/**
 * Sample f on [x0, x1] with n steps and split into drawable segments.
 * A segment breaks on non-finite values and on jumps larger than `jump` (asymptotes such as tan x or 1/x),
 * where a jump is only treated as a break when the sign also flips or the value leaves the view far away.
 */
export function sample(f: (x: number) => number, v: View, n: number): [number, number][][] {
  const segs: [number, number][][] = [];
  let cur: [number, number][] = [];
  const h = v.y1 - v.y0;
  let prev: number | null = null;
  for (let i = 0; i <= n; i++) {
    const x = v.x0 + ((v.x1 - v.x0) * i) / n;
    let y: number;
    try {
      y = f(x);
    } catch {
      y = NaN;
    }
    if (!Number.isFinite(y)) {
      if (cur.length) segs.push(cur);
      cur = [];
      prev = null;
      continue;
    }
    if (prev !== null && Math.abs(y - prev) > h * 2 && (Math.sign(y) !== Math.sign(prev) || Math.abs(y) > h * 50 || Math.abs(prev) > h * 50)) {
      if (cur.length) segs.push(cur);
      cur = [];
    }
    cur.push([x, y]);
    prev = y;
  }
  if (cur.length) segs.push(cur);
  return segs;
}

/** Nice grid step for a range spanning `pixels` pixels with a target spacing of ~80 px. */
export function gridStep(range: number, pixels: number, target = 80): number {
  const raw = (range * target) / Math.max(1, pixels);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}
