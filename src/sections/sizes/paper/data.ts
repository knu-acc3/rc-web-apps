/** Paper formats. ISO 216 (A, B), ISO 269 (C envelopes), North American, SRA, JIS B. */

const MM_PER_INCH = 25.4;

export type PaperSeries = "a" | "b" | "c" | "us" | "sra" | "env" | "jis";

export interface PaperFormat {
  slug: string;
  /** Display name, e.g. "A4", "Letter". */
  name: string;
  series: PaperSeries;
  /** Portrait width and height in millimetres (w ≤ h). */
  w: number;
  h: number;
  /** Exact inch dimensions for formats that are defined in inches. */
  inch?: [number, number];
}

const iso = (series: "a" | "b" | "c", prefix: string, dims: [number, number][]): PaperFormat[] =>
  dims.map(([w, h], i) => ({ slug: `${prefix.toLowerCase()}${i}`, name: `${prefix}${i}`, series, w, h }));

/** ISO 216 A series (A0 = 1 m²). */
const A: [number, number][] = [
  [841, 1189], [594, 841], [420, 594], [297, 420], [210, 297], [148, 210], [105, 148], [74, 105], [52, 74], [37, 52], [26, 37],
];
/** ISO 216 B series (B0 = 1000 × 1414 mm). */
const B: [number, number][] = [
  [1000, 1414], [707, 1000], [500, 707], [353, 500], [250, 353], [176, 250], [125, 176], [88, 125], [62, 88], [44, 62], [31, 44],
];
/** ISO 269 C series (envelopes; geometric mean of A and B). */
const C: [number, number][] = [
  [917, 1297], [648, 917], [458, 648], [324, 458], [229, 324], [162, 229], [114, 162], [81, 114], [57, 81], [40, 57], [28, 40],
];

const inch = (slug: string, name: string, wi: number, hi: number): PaperFormat => ({
  slug,
  name,
  series: "us",
  w: Number((wi * MM_PER_INCH).toFixed(2)),
  h: Number((hi * MM_PER_INCH).toFixed(2)),
  inch: [wi, hi],
});

export const PAPER: PaperFormat[] = [
  ...iso("a", "A", A),
  ...iso("b", "B", B),
  ...iso("c", "C", C),
  inch("letter", "Letter", 8.5, 11),
  inch("legal", "Legal", 8.5, 14),
  inch("tabloid", "Tabloid", 11, 17),
  inch("executive", "Executive", 7.25, 10.5),
  inch("half-letter", "Half Letter", 5.5, 8.5),
  { slug: "sra3", name: "SRA3", series: "sra", w: 320, h: 450 },
  { slug: "sra4", name: "SRA4", series: "sra", w: 225, h: 320 },
  { slug: "dl", name: "DL", series: "env", w: 110, h: 220 },
  { slug: "jis-b4", name: "JIS B4", series: "jis", w: 257, h: 364 },
  { slug: "jis-b5", name: "JIS B5", series: "jis", w: 182, h: 257 },
  { slug: "jis-b6", name: "JIS B6", series: "jis", w: 128, h: 182 },
];

export const PAPER_BY_SLUG = new Map(PAPER.map((p) => [p.slug, p]));

export const COMMON_DPI = [72, 96, 150, 200, 300, 600] as const;

/** Pixels for a length in mm at a given DPI: round(mm / 25.4 × dpi). */
export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/** Typographic points (1 pt = 1/72 inch), unrounded. */
export function mmToPt(mm: number): number {
  return (mm / MM_PER_INCH) * 72;
}

function mmToIn(mm: number): number {
  return mm / MM_PER_INCH;
}

/** Inch dimensions: exact for inch-defined formats, converted otherwise. */
export function inchesOf(p: PaperFormat): [number, number] {
  return p.inch ?? [mmToIn(p.w), mmToIn(p.h)];
}

/** Sheet pixel size at a DPI (portrait). */
export function paperPx(p: PaperFormat, dpi: number): [number, number] {
  const [wi, hi] = inchesOf(p);
  return [Math.round(wi * dpi), Math.round(hi * dpi)];
}

/** Area in square metres. */
export function areaM2(p: PaperFormat): number {
  return (p.w * p.h) / 1e6;
}

/** Index inside an ISO series (A4 → 4), or null. */
export function isoIndex(p: PaperFormat): number | null {
  if (p.series !== "a" && p.series !== "b" && p.series !== "c") return null;
  return Number(p.slug.slice(1));
}
