/** State of the "picture size" controls (percent / pixels / long side) and its translation into a ResizeSpec. */
import { planResize, type FitMode, type ResizeSpec } from "./geometry";

export type ResizeUiMode = "percent" | "px" | "long";

export interface ResizeState {
  mode: ResizeUiMode;
  /** 1–100 (up to 400 with `up`). */
  percent: number;
  /** Pixels. With `locked` only one of w / h is set: the side the person typed; the other follows the photo. */
  w: number | null;
  h: number | null;
  locked: boolean;
  /** Both sides set and not locked: how to fit the photo into w×h. */
  fit: FitMode;
  long: number | null;
  /** Allow enlarging. */
  up: boolean;
}

export interface Size {
  w: number;
  h: number;
}

export const RESIZE_DEFAULT: ResizeState = { mode: "percent", percent: 100, w: null, h: null, locked: true, fit: "contain", long: null, up: false };

/** The resize to apply, or null when the picture keeps its size (100 %, empty fields). */
export function resizeSpecOf(s: ResizeState): ResizeSpec | null {
  const up = s.up;
  if (s.mode === "percent") {
    const p = Math.round(s.percent);
    if (!(p > 0) || p === 100) return null;
    return { mode: "percent", percent: p, allowUpscale: up };
  }
  if (s.mode === "long") return s.long && s.long > 0 ? { mode: "long", long: s.long, allowUpscale: up } : null;
  const w = s.w && s.w > 0 ? s.w : null;
  const h = s.h && s.h > 0 ? s.h : null;
  if (!s.locked && w && h) return { mode: "box", width: w, height: h, fit: s.fit, allowUpscale: up };
  if (w) return { mode: "box", width: w, allowUpscale: up };
  if (h) return { mode: "box", height: h, allowUpscale: up };
  return null;
}

/** Output size for a source of `src`, or null when unknown. */
export function plannedSize(s: ResizeState, src: Size | null | undefined): Size | null {
  if (!src || !src.w || !src.h) return null;
  const spec = resizeSpecOf(s);
  if (!spec) return { w: src.w, h: src.h };
  const p = planResize(src.w, src.h, spec);
  return { w: p.w, h: p.h };
}

/** What the width / height fields show: with the lock on, the side not typed follows the photo's proportions. */
export function shownSides(s: ResizeState, src: Size | null | undefined): { w: number | null; h: number | null } {
  if (!s.locked || !src || !src.w || !src.h) return { w: s.w, h: s.h };
  if (s.w) return { w: s.w, h: Math.max(1, Math.round((s.w * src.h) / src.w)) };
  if (s.h) return { w: Math.max(1, Math.round((s.h * src.w) / src.h)), h: s.h };
  return { w: null, h: null };
}

/** Lock on: keep the side typed first. Lock off: both fields keep the numbers they show. */
export function toggleLock(s: ResizeState, src: Size | null | undefined): ResizeState {
  if (s.locked) {
    const shown = shownSides(s, src);
    return { ...s, locked: false, w: shown.w, h: shown.h };
  }
  return s.w ? { ...s, locked: true, h: null } : { ...s, locked: true };
}

/** Type a side: with the lock on the other side is dropped (it follows the photo). */
export function setSide(s: ResizeState, side: "w" | "h", v: number | null): ResizeState {
  if (!s.locked) return { ...s, [side]: v };
  return side === "w" ? { ...s, w: v, h: null } : { ...s, h: v, w: null };
}

/** Switch the mode; empty pixel / long-side fields start from the size the photo has right now. */
export function switchMode(s: ResizeState, mode: ResizeUiMode, src: Size | null | undefined): ResizeState {
  const next = { ...s, mode };
  const now = plannedSize(s, src);
  if (mode === "px" && !s.w && !s.h && now) return { ...next, w: now.w, h: s.locked ? null : now.h };
  if (mode === "long" && !s.long && now) return { ...next, long: Math.max(now.w, now.h) };
  return next;
}
