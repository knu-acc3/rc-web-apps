/**
 * Aspect-ratio maths for "resize / crop to 9:16, 1:1, 16:9 …". Pure, unit-tested.
 */
import { even, type Crop } from "./spec";

export type AspectMode = "crop" | "fit";

export interface AspectPlan {
  /** Crop rectangle in display pixels (crop mode only). */
  crop?: Crop;
  width: number;
  height: number;
  fit?: "contain";
}

/** Parse "9:16" / "9-16" → [9, 16]. */
export function parseAspect(s: string): [number, number] | null {
  const m = /^(\d+(?:\.\d+)?)[:\-x×/](\d+(?:\.\d+)?)$/.exec(s.trim());
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a > 0 && b > 0 ? [a, b] : null;
}

/**
 * Plan a resize to aspect `aw:ah`.
 * - crop: cut the centre region with the target aspect, then scale so the long
 *   side is at most `maxLong` px (never upscaling).
 * - fit: keep the whole picture and add black bars (letterbox/pillarbox).
 * Output dimensions are even (required by H.264 4:2:0).
 */
export function aspectPlan(srcW: number, srcH: number, aw: number, ah: number, mode: AspectMode, maxLong: number): AspectPlan {
  const a = aw / ah;
  if (mode === "crop") {
    let cw = srcW;
    let ch = srcH;
    if (srcW / srcH > a) cw = srcH * a;
    else ch = srcW / a;
    cw = Math.min(srcW, even(cw));
    ch = Math.min(srcH, even(ch));
    const crop: Crop = { left: Math.floor((srcW - cw) / 2), top: Math.floor((srcH - ch) / 2), width: cw, height: ch };
    const scale = Math.min(1, maxLong / Math.max(cw, ch));
    return { crop, width: even(cw * scale), height: even(ch * scale) };
  }
  // fit: the box that contains the source at the target aspect
  let bw = srcW;
  let bh = srcH;
  if (srcW / srcH > a) bh = srcW / a;
  else bw = srcH * a;
  const scale = Math.min(1, maxLong / Math.max(bw, bh));
  return { width: even(bw * scale), height: even(bh * scale), fit: "contain" };
}

/** Largest output for a resolution preset: 1080 → long side 1920 for 16:9, 1080 for 1:1 etc. */
export function longSideFor(preset: number, aw: number, ah: number): number {
  // "1080p" means the short side is 1080.
  const long = Math.max(aw, ah) / Math.min(aw, ah);
  return Math.round(preset * long);
}
