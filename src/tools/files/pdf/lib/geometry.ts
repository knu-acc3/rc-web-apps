/**
 * Pure geometry for PDF pages: units, paper sizes, affine matrices,
 * /Rotate + CropBox handling, n-up layout and image → page placement.
 * No pdf-lib imports — everything here is unit-tested in Node.
 *
 * Matrix convention is the PDF one: [a b c d e f] maps (x, y) to
 * (a·x + c·y + e, b·x + d·y + f).
 */

export type Matrix = [number, number, number, number, number, number];

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Rotation = 0 | 90 | 180 | 270;

/** Points per millimetre. */
const PT_PER_MM = 72 / 25.4;
export const mmToPt = (mm: number) => mm * PT_PER_MM;
export const ptToMm = (pt: number) => pt / PT_PER_MM;

/** Largest page side allowed by PDF viewers (200 inches at UserUnit 1). */
const MAX_PAGE_PT = 14400;

/** Portrait paper sizes in points. */
export const PAPER = {
  a3: [841.89, 1190.55],
  a4: [595.28, 841.89],
  a5: [419.53, 595.28],
  letter: [612, 792],
  legal: [612, 1008],
} as const satisfies Record<string, readonly [number, number]>;
export type PaperId = keyof typeof PAPER;

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

export function normRotation(deg: number): Rotation {
  const r = (((Math.round(deg / 90) * 90) % 360) + 360) % 360;
  return r as Rotation;
}

/** Matrix of p ↦ second(first(p)). */
export function compose(first: Matrix, second: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = first;
  const [a2, b2, c2, d2, e2, f2] = second;
  return [
    a2 * a1 + c2 * b1,
    b2 * a1 + d2 * b1,
    a2 * c1 + c2 * d1,
    b2 * c1 + d2 * d1,
    a2 * e1 + c2 * f1 + e2,
    b2 * e1 + d2 * f1 + f2,
  ];
}

export function invert(m: Matrix): Matrix {
  const [a, b, c, d, e, f] = m;
  const det = a * d - b * c;
  if (!det) throw new Error("Singular matrix");
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
}

export function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export const translate = (x: number, y: number): Matrix => [1, 0, 0, 1, x, y];
export const scaleM = (sx: number, sy = sx): Matrix => [sx, 0, 0, sy, 0, 0];

/**
 * Maps content of a w×h box (origin at its lower-left) to the box as it is
 * displayed after a clockwise rotation (PDF /Rotate semantics). The result
 * again has its lower-left corner at the origin.
 */
function rotationMatrix(w: number, h: number, rotate: number): Matrix {
  switch (normRotation(rotate)) {
    case 90:
      return [0, -1, 1, 0, 0, w];
    case 180:
      return [-1, 0, 0, -1, w, h];
    case 270:
      return [0, 1, -1, 0, h, 0];
    default:
      return IDENTITY;
  }
}

/** Width/height of a box as the user sees it after /Rotate. */
export function visualSize(box: { width: number; height: number }, rotate: number): { width: number; height: number } {
  const r = normRotation(rotate);
  return r === 90 || r === 270 ? { width: box.height, height: box.width } : { width: box.width, height: box.height };
}

/**
 * Matrix that maps "visual" coordinates — origin at the bottom-left of the
 * page as displayed (CropBox, after /Rotate), x to the right, y up — to the
 * page's user space. Prefix drawing operators with `cm` of this matrix to
 * place stamps where the user sees them.
 */
export function visualToPage(crop: Box, rotate: number): Matrix {
  const pageToVisual = compose(translate(-crop.x, -crop.y), rotationMatrix(crop.width, crop.height, rotate));
  return invert(pageToVisual);
}

/** Round tiny floating-point noise so content streams stay clean. */
export function clean(m: Matrix): Matrix {
  return m.map((v) => {
    const r = Math.round(v * 1e6) / 1e6;
    return Object.is(r, -0) ? 0 : r;
  }) as Matrix;
}

/* ───────────── n-up ───────────── */

interface NupGrid {
  cols: number;
  rows: number;
  sheetWidth: number;
  sheetHeight: number;
  /** Scale that fits the reference page into one cell. */
  scale: number;
}

interface NupInput {
  /** Pages per sheet. */
  n: number;
  /** Sheet size in points, any orientation (the best one is chosen when `orientation` is "auto"). */
  sheet: readonly [number, number];
  orientation?: "auto" | "portrait" | "landscape";
  /** Visual size of a representative source page. */
  page: { width: number; height: number };
  margin?: number;
  gap?: number;
}

/** Factor pairs [cols, rows] with cols·rows = n. */
function gridCandidates(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let c = 1; c <= n; c++) if (n % c === 0) out.push([c, n / c]);
  return out;
}

/** Pick the grid and sheet orientation that make source pages as large as possible. */
export function nupGrid({ n, sheet, orientation = "auto", page, margin = 0, gap = 0 }: NupInput): NupGrid {
  const short = Math.min(sheet[0], sheet[1]);
  const long = Math.max(sheet[0], sheet[1]);
  const sheets: [number, number][] =
    orientation === "portrait" ? [[short, long]] : orientation === "landscape" ? [[long, short]] : [[short, long], [long, short]];
  let best: NupGrid | null = null;
  for (const [sw, sh] of sheets) {
    for (const [cols, rows] of gridCandidates(n)) {
      const cw = (sw - 2 * margin - (cols - 1) * gap) / cols;
      const ch = (sh - 2 * margin - (rows - 1) * gap) / rows;
      if (cw <= 0 || ch <= 0) continue;
      const scale = Math.min(cw / page.width, ch / page.height);
      // Strictly better only — ties keep the earlier (portrait, fewer columns) candidate.
      if (!best || scale > best.scale + 1e-9) best = { cols, rows, sheetWidth: sw, sheetHeight: sh, scale };
    }
  }
  if (!best) throw new Error("Margins leave no room for pages");
  return best;
}

/** Cell boxes in reading order. "rows": left→right then down (Z); "columns": top→bottom then right (N). */
export function nupCells(grid: NupGrid, margin = 0, gap = 0, order: "rows" | "columns" = "rows"): Box[] {
  const { cols, rows, sheetWidth, sheetHeight } = grid;
  const cw = (sheetWidth - 2 * margin - (cols - 1) * gap) / cols;
  const ch = (sheetHeight - 2 * margin - (rows - 1) * gap) / rows;
  const cells: Box[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = order === "rows" ? i % cols : Math.floor(i / rows);
    const row = order === "rows" ? Math.floor(i / cols) : i % rows;
    cells.push({
      x: margin + col * (cw + gap),
      y: sheetHeight - margin - (row + 1) * ch - row * gap,
      width: cw,
      height: ch,
    });
  }
  return cells;
}

/** Center content of the given size inside a cell, scaled to fit (never distorted). */
export function fitInto(cell: Box, width: number, height: number, allowUpscale = true): { x: number; y: number; scale: number } {
  let scale = Math.min(cell.width / width, cell.height / height);
  if (!allowUpscale) scale = Math.min(scale, 1);
  return {
    x: cell.x + (cell.width - width * scale) / 2,
    y: cell.y + (cell.height - height * scale) / 2,
    scale,
  };
}

/**
 * Matrix that draws a page form XObject (normalized to a w×h box at the origin,
 * as pdf-lib's embedPage produces) with its /Rotate applied, scaled and placed
 * at (x, y) — (x, y) is the lower-left corner of the rotated, scaled result.
 */
export function placePageMatrix(w: number, h: number, rotate: number, x: number, y: number, scale: number): Matrix {
  return compose(compose(rotationMatrix(w, h, rotate), scaleM(scale)), translate(x, y));
}

/* ───────────── images → pages ───────────── */

const DEFAULT_DPI = 96;

/** Sane DPI or the default (96). */
function effectiveDpi(dpi: number | undefined | null): number {
  return dpi && Number.isFinite(dpi) && dpi >= 10 && dpi <= 10000 ? dpi : DEFAULT_DPI;
}

export const pxToPt = (px: number, dpi: number) => (px * 72) / effectiveDpi(dpi);

/** EXIF orientations 5–8 swap width and height. */
const orientationSwaps = (orientation: number) => orientation >= 5 && orientation <= 8;

export interface ImageLayoutInput {
  /** Stored pixel size (before EXIF orientation). */
  pxWidth: number;
  pxHeight: number;
  dpiX?: number | null;
  dpiY?: number | null;
  /** EXIF orientation 1–8 (1 = as stored). */
  orientation?: number;
  /** "fit-image" = page takes the image's physical size (+ margins). */
  page: PaperId | "fit-image";
  pageOrientation?: "auto" | "portrait" | "landscape";
  /** Margin on every side, in points. */
  margin?: number;
  /** "fit" scales the image to fill the printable area; "original" keeps the physical size and only shrinks if needed. */
  scaleMode?: "fit" | "original";
}

interface ImageLayout {
  pageWidth: number;
  pageHeight: number;
  /** Displayed image rectangle on the page (points). */
  x: number;
  y: number;
  width: number;
  height: number;
}

export function imageLayout(input: ImageLayoutInput): ImageLayout {
  const swap = orientationSwaps(input.orientation ?? 1);
  const pxW = swap ? input.pxHeight : input.pxWidth;
  const pxH = swap ? input.pxWidth : input.pxHeight;
  const dpiW = swap ? input.dpiY : input.dpiX;
  const dpiH = swap ? input.dpiX : input.dpiY;
  // Physical size of the displayed image.
  const natW = pxToPt(pxW, effectiveDpi(dpiW ?? dpiH));
  const natH = pxToPt(pxH, effectiveDpi(dpiH ?? dpiW));
  let margin = Math.max(0, input.margin ?? 0);

  if (input.page === "fit-image") {
    margin = Math.min(margin, MAX_PAGE_PT / 4);
    const k = Math.min(1, (MAX_PAGE_PT - 2 * margin) / natW, (MAX_PAGE_PT - 2 * margin) / natH);
    const width = natW * k;
    const height = natH * k;
    return { pageWidth: width + 2 * margin, pageHeight: height + 2 * margin, x: margin, y: margin, width, height };
  }

  const [pw, ph] = PAPER[input.page];
  const orient = input.pageOrientation ?? "auto";
  const landscape = orient === "landscape" || (orient === "auto" && natW > natH);
  const pageWidth = landscape ? ph : pw;
  const pageHeight = landscape ? pw : ph;
  // Never let margins eat the whole page.
  margin = Math.min(margin, pageWidth / 2 - 10, pageHeight / 2 - 10);
  const box: Box = { x: margin, y: margin, width: pageWidth - 2 * margin, height: pageHeight - 2 * margin };
  const fit = fitInto(box, natW, natH, input.scaleMode !== "original");
  return { pageWidth, pageHeight, x: fit.x, y: fit.y, width: natW * fit.scale, height: natH * fit.scale };
}

/**
 * Matrix that draws an image XObject (unit square, first stored row on top)
 * into the displayed rectangle, applying the EXIF orientation.
 */
export function imageMatrix(orientation: number, x: number, y: number, width: number, height: number): Matrix {
  const o: Record<number, Matrix> = {
    1: [1, 0, 0, 1, 0, 0],
    2: [-1, 0, 0, 1, 1, 0],
    3: [-1, 0, 0, -1, 1, 1],
    4: [1, 0, 0, -1, 0, 1],
    5: [0, -1, -1, 0, 1, 1],
    6: [0, -1, 1, 0, 0, 1],
    7: [0, 1, 1, 0, 0, 0],
    8: [0, 1, -1, 0, 1, 0],
  };
  return compose(o[orientation] ?? o[1], [width, 0, 0, height, x, y]);
}

/* ───────────── stamps (watermarks, page numbers) ───────────── */

export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/**
 * Lower-left corner for an item of size w×h anchored inside a page of size
 * W×H with the given margin (all in visual coordinates).
 */
export function anchorPosition(anchor: Anchor, W: number, H: number, w: number, h: number, margin: number): { x: number; y: number } {
  const [v, hz] = anchor === "center" ? ["middle", "center"] : anchor.split("-");
  const x = hz === "left" ? margin : hz === "right" ? W - margin - w : (W - w) / 2;
  const y = v === "top" ? H - margin - h : v === "bottom" ? margin : (H - h) / 2;
  return { x, y };
}
