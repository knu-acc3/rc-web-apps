/**
 * Sizing and scheduling rules for page previews. Pure functions (no pdf.js): the
 * numbers that keep previews fast on phones live here and are unit-tested.
 */

/** Main page preview: at most ~2.5 MP (an A4 page 1100 × 1560 px) — sharp enough, fast on a phone. */
export const PREVIEW_MAX_PIXELS = 2_500_000;
/** Thumbnails: small JPEGs. */
export const THUMB_MAX_PIXELS = 160_000;
/** Longest canvas side Android and old iPhones handle reliably. */
export const MAX_CANVAS_SIDE = 4096;

/** Device pixel ratio for previews: never above 2 — pixels (memory and render time) grow with its square. */
export function previewDpr(dpr: number | undefined): number {
  return Math.min(2, Math.max(1, dpr || 1));
}

/**
 * Render scale (1 = 72 DPI) for a page of `pageW × pageH` points (as displayed) shown
 * `cssWidth` CSS pixels wide, capped by a pixel budget and the longest side.
 */
export function fitScale(pageW: number, pageH: number, cssWidth: number, dpr: number | undefined, maxPixels = PREVIEW_MAX_PIXELS, maxSide = MAX_CANVAS_SIDE): number {
  if (!(pageW > 0) || !(pageH > 0) || !(cssWidth > 0)) return 1;
  let s = (cssWidth * previewDpr(dpr)) / pageW;
  const area = pageW * pageH * s * s;
  if (area > maxPixels) s *= Math.sqrt(maxPixels / area);
  const side = Math.max(pageW, pageH) * s;
  if (side > maxSide) s *= maxSide / side;
  return s;
}

/** CSS width of a page fitted into a `boxW × boxH` box (height may be Infinity). */
export function fitWidth(pageW: number, pageH: number, boxW: number, boxH = Infinity): number {
  if (!(pageW > 0) || !(pageH > 0)) return boxW;
  return Math.max(1, Math.min(boxW, (boxH * pageW) / pageH));
}

/** A queued render request: `visible` ones (on screen now) go before those only near the screen. */
export interface RenderRequest {
  index: number;
  visible: boolean;
  /** Request batch: the latest batch (what the user scrolled to last) goes first. */
  batch: number;
}

/**
 * Position in `queue` of the request to render next: on screen first, then the
 * latest batch, then the lowest page number — so the first visible page is drawn
 * first and pages scrolled to most recently come before ones scrolled past.
 */
export function nextRequest(queue: readonly RenderRequest[]): number {
  let best = -1;
  for (let i = 0; i < queue.length; i++) {
    const q = queue[i];
    const b = best < 0 ? null : queue[best];
    if (!b || (q.visible && !b.visible) || (q.visible === b.visible && (q.batch > b.batch || (q.batch === b.batch && q.index < b.index)))) best = i;
  }
  return best;
}
