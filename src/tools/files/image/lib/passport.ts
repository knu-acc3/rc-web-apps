/* Document photo sizes and print-sheet layout. Pure, unit-tested. */

export interface PhotoFormat {
  id: string;
  /** Photo size in millimetres. */
  w: number;
  h: number;
  ru: string;
  en: string;
  /** Head height from chin to crown, mm (min–max), and the gap above the crown, mm — when the rules give them. */
  head?: [number, number];
  top?: number;
}

export const PHOTO_FORMATS: PhotoFormat[] = [
  { id: "35x45", w: 35, h: 45, ru: "35×45 мм — паспорт, загранпаспорт, виза, удостоверение", en: "35×45 mm — passport, visa, ID card", head: [32, 36], top: 4 },
  { id: "30x40", w: 30, h: 40, ru: "3×4 см — медкнижка, пропуск, студенческий", en: "30×40 mm — student and staff IDs" },
  { id: "us", w: 50.8, h: 50.8, ru: "2×2 дюйма (51×51 мм) — виза и паспорт США", en: "2×2 in (51×51 mm) — US passport and visa", head: [25, 35], top: 6 },
  { id: "33x48", w: 33, h: 48, ru: "33×48 мм — виза в Китай", en: "33×48 mm — China visa", head: [28, 33], top: 4 },
  { id: "40x60", w: 40, h: 60, ru: "4×6 см — личное дело, удостоверения", en: "40×60 mm — personnel files, certificates" },
  { id: "90x120", w: 90, h: 120, ru: "9×12 см — личное дело, военкомат", en: "90×120 mm — large document photo" },
];

const MM_PER_INCH = 25.4;
export const mmToPx = (mm: number, dpi: number) => Math.round((mm / MM_PER_INCH) * dpi);

export type SheetId = "single" | "10x15" | "a4";
/** Sheet sizes (portrait), mm. 10×15 cm is the standard photo-lab print (4×6 in). */
export const SHEETS: Record<Exclude<SheetId, "single">, { w: number; h: number }> = { "10x15": { w: 102, h: 152 }, a4: { w: 210, h: 297 } };

/** How many photos fit on a sheet and where: a centred grid with `gap` mm between photos and `margin` mm at the edges. */
export function sheetLayout(sheet: { w: number; h: number }, photo: { w: number; h: number }, gap = 2, margin = 4): { cols: number; rows: number; cells: { x: number; y: number }[] } {
  const fit = (len: number, size: number) => Math.max(0, Math.floor((len - 2 * margin + gap) / (size + gap)));
  const cols = fit(sheet.w, photo.w);
  const rows = fit(sheet.h, photo.h);
  const usedW = cols * photo.w + Math.max(0, cols - 1) * gap;
  const usedH = rows * photo.h + Math.max(0, rows - 1) * gap;
  const x0 = (sheet.w - usedW) / 2;
  const y0 = (sheet.h - usedH) / 2;
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: x0 + c * (photo.w + gap), y: y0 + r * (photo.h + gap) });
  return { cols, rows, cells };
}
