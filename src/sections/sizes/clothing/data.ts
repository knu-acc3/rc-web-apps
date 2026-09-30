/**
 * Clothing size charts. Rows are defined by body measurements (cm):
 *  - RU size = bust/chest girth ÷ 2 (Russian standard), even numbers;
 *  - women: DE/EU = RU − 6 (DE size ≈ bust ÷ 2 − 6), FR = DE + 2, IT = DE + 4, UK = DE − 28, US = UK − 4;
 *  - men: EU/DE/IT/FR = RU (chest ÷ 2), UK/US chest in inches = RU − 10;
 *  - jeans W = waist girth in inches (rounded).
 * Letter (INT) sizes are not standardised — they follow the common Russian retail mapping.
 */

export type ClothingChart = "women-tops" | "women-bottoms" | "men-tops" | "men-bottoms" | "men-shirts";
export const CLOTHING_CHARTS: ClothingChart[] = ["women-tops", "women-bottoms", "men-tops", "men-bottoms", "men-shirts"];

export interface WomenRow {
  ru: number;
  int: string;
  de: number;
  fr: number;
  it: number;
  uk: number;
  us: number;
  bust: number;
  waist: number;
  hips: number;
  /** Jeans waist size W (inches). */
  w: number;
}

export interface MenRow {
  ru: number;
  int: string;
  eu: number;
  it: number;
  /** UK/US jacket size = chest girth in inches. */
  chestIn: number;
  chest: number;
  waist: number;
  hips: number;
  w: number;
}

export interface ShirtRow {
  collar: number;
  collarIn: number;
  int: string;
}

const WOMEN_INT = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const MEN_INT = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

export const WOMEN: WomenRow[] = WOMEN_INT.map((int, i) => {
  const ru = 40 + i * 2;
  const de = ru - 6;
  const waist = 2 * ru - 18;
  return { ru, int, de, fr: de + 2, it: de + 4, uk: de - 28, us: de - 32, bust: 2 * ru, waist, hips: 2 * ru + 8, w: Math.round(waist / 2.54) };
});

export const MEN: MenRow[] = MEN_INT.map((int, i) => {
  const ru = 44 + i * 2;
  const waist = 2 * ru - 14;
  return { ru, int, eu: ru, it: ru, chestIn: ru - 10, chest: 2 * ru, waist, hips: 2 * ru + 4, w: Math.round(waist / 2.54) };
});

/** Shirt collar sizes: EU/RU (cm) ↔ US/UK (inches) ↔ letter size. */
export const SHIRTS: ShirtRow[] = [
  { collar: 37, collarIn: 14.5, int: "S" },
  { collar: 38, collarIn: 15, int: "S" },
  { collar: 39, collarIn: 15.5, int: "M" },
  { collar: 40, collarIn: 15.75, int: "M" },
  { collar: 41, collarIn: 16, int: "L" },
  { collar: 42, collarIn: 16.5, int: "L" },
  { collar: 43, collarIn: 17, int: "XL" },
  { collar: 44, collarIn: 17.5, int: "XL" },
  { collar: 45, collarIn: 17.75, int: "XXL" },
  { collar: 46, collarIn: 18, int: "XXL" },
];

/** Inseam length L (jeans) ↔ inseam cm ↔ approximate height. */
export const JEANS_LENGTH: { l: number; inseam: number; height: [number, number] }[] = [
  { l: 30, inseam: 76, height: [165, 173] },
  { l: 32, inseam: 81, height: [173, 182] },
  { l: 34, inseam: 86, height: [182, 190] },
  { l: 36, inseam: 91, height: [190, 198] },
];

/** Measurement interval of a row: RU sizes step by 4 cm of girth, so ±2 cm around the nominal value. */
export const span = (v: number): [number, number] => [v - 2, v + 2];

/** Women's size by measurements: bust (+ waist) for tops, hips (+ waist) for bottoms; the largest wins. */
export function womenByMeasure(kind: "tops" | "bottoms", m: { bust?: number; waist?: number; hips?: number }): WomenRow | null {
  const c: number[] = [];
  if (kind === "tops" && m.bust) c.push(m.bust / 2);
  if (kind === "bottoms" && m.hips) c.push((m.hips - 8) / 2);
  if (m.waist) c.push((m.waist + 18) / 2);
  return c.length ? nearestEven(WOMEN, Math.max(...c)) : null;
}

/** Men's size by measurements: chest (+ waist) for tops, waist (+ hips) for bottoms; the largest wins. */
export function menByMeasure(kind: "tops" | "bottoms", m: { chest?: number; waist?: number; hips?: number }): MenRow | null {
  const c: number[] = [];
  if (kind === "tops" && m.chest) c.push(m.chest / 2);
  if (kind === "bottoms" && m.hips) c.push((m.hips - 4) / 2);
  if (m.waist) c.push((m.waist + 14) / 2);
  return c.length ? nearestEven(MEN, Math.max(...c)) : null;
}

function nearestEven<T extends { ru: number }>(rows: T[], ruRaw: number): T | null {
  const ru = Math.round(ruRaw / 2 + 1e-9) * 2;
  if (ru < rows[0].ru - 2 || ru > rows[rows.length - 1].ru + 2) return null;
  const clamped = Math.min(rows[rows.length - 1].ru, Math.max(rows[0].ru, ru));
  return rows.find((r) => r.ru === clamped) ?? null;
}

export function shirtByNeck(neckCm: number): ShirtRow | null {
  const c = Math.round(neckCm);
  if (c < SHIRTS[0].collar - 1 || c > SHIRTS[SHIRTS.length - 1].collar + 1) return null;
  const clamped = Math.min(SHIRTS[SHIRTS.length - 1].collar, Math.max(SHIRTS[0].collar, c));
  return SHIRTS.find((r) => r.collar === clamped) ?? null;
}
