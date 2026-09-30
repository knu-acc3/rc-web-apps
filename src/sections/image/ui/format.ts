import type { SniffedFormat } from "../engine/detect";
import type { OutFormat } from "../engine/types";

/** Default quality per output format (AVIF's scale is much steeper). */
export const DEFAULT_QUALITY: Record<OutFormat, number> = { jpg: 82, webp: 80, avif: 55, png: 100, gif: 100, ico: 100 };

export const OUT_LABEL: Record<OutFormat, string> = { jpg: "JPG", png: "PNG", webp: "WebP", avif: "AVIF", gif: "GIF", ico: "ICO" };

export const LOSSY = new Set<OutFormat>(["jpg", "webp", "avif"]);

/**
 * "Same as source" output: keep web formats, turn photos in other formats into
 * JPG and graphics that may be transparent into PNG.
 */
export function sameFormat(src: SniffedFormat): OutFormat {
  if (src === "jpg" || src === "png" || src === "webp" || src === "avif") return src;
  if (src === "heic" || src === "tiff") return "jpg";
  if (src === "bmp") return "jpg";
  return "png"; // gif, svg, ico, cur
}

export type OutChoice = OutFormat | "same";

export function resolveOut(choice: OutChoice, src: SniffedFormat): OutFormat {
  return choice === "same" ? sameFormat(src) : choice;
}
