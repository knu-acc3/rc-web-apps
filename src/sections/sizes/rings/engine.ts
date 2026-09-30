/**
 * Ring sizes. Everything is derived from the inner diameter d (mm):
 *  - RU (Russia, CIS): the inner diameter in mm, half-size steps (17, 17.5 …);
 *  - EU / ISO 8653: the inner circumference in mm (π · d);
 *  - US / Canada: d = 11.63 + 0.8128 · US (whole sizes differ by 0.032″ ≈ 0.81 mm of diameter);
 *  - UK / Australia (BS 6820): letters, C = 40 mm circumference, 1.25 mm per letter (A = 37.5 mm);
 *  - Japan (JIS): size 1 = 13 mm diameter, +1/3 mm per size → d = 13 + (n − 1)/3.
 */

export type RingSystem = "d" | "c" | "ru" | "us" | "uk" | "eu" | "jp";
export const RING_SYSTEMS: RingSystem[] = ["ru", "us", "uk", "eu", "jp", "d", "c"];

export const DIAMETER_RANGE: [number, number] = [12, 25];

export const circumference = (d: number) => Math.PI * d;
export const diameterFromCirc = (c: number) => c / Math.PI;

export const usToDiameter = (us: number) => 11.63 + 0.8128 * us;
export const diameterToUs = (d: number) => (d - 11.63) / 0.8128;

export const jpToDiameter = (n: number) => 13 + (n - 1) / 3;
export const diameterToJp = (d: number) => 3 * d - 38;

const UK_A = 37.5;
const UK_STEP = 1.25;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** UK index: A = 0, A½ = 0.5 … Z = 25, Z+1 = 26 … */
export const ukIndexFromCirc = (c: number) => (c - UK_A) / UK_STEP;
export const circFromUkIndex = (i: number) => UK_A + i * UK_STEP;

export function ukLabel(index: number): string {
  const i = Math.round(index * 2) / 2;
  const whole = Math.floor(i);
  const halfMark = i - whole >= 0.5 ? "½" : "";
  if (whole < 0) return "—";
  if (whole < 26) return `${LETTERS[whole]}${halfMark}`;
  return `Z+${whole - 25}${halfMark}`;
}

/** All UK sizes (index, label) within the diameter range. */
export function ukOptions(): { index: number; label: string }[] {
  const lo = Math.ceil(ukIndexFromCirc(circumference(DIAMETER_RANGE[0])) * 2) / 2;
  const hi = Math.floor(ukIndexFromCirc(circumference(DIAMETER_RANGE[1])) * 2) / 2;
  const out: { index: number; label: string }[] = [];
  for (let i = Math.max(0, lo); i <= hi; i += 0.5) out.push({ index: i, label: ukLabel(i) });
  return out;
}

/** Diameter (mm) from a value in any system (UK value = index, see ukIndexFromCirc). */
export function diameterFrom(system: RingSystem, v: number): number {
  switch (system) {
    case "d":
    case "ru":
      return v;
    case "c":
    case "eu":
      return diameterFromCirc(v);
    case "us":
      return usToDiameter(v);
    case "uk":
      return diameterFromCirc(circFromUkIndex(v));
    case "jp":
      return jpToDiameter(v);
  }
}

export interface RingSizes {
  d: number;
  c: number;
  /** RU size: diameter rounded to 0.5 mm. */
  ru: number;
  /** US size rounded to a quarter. */
  us: number;
  usExact: number;
  uk: string;
  /** EU/ISO: circumference rounded to whole mm. */
  eu: number;
  jp: number;
}

const q = (n: number, step: number) => Number((Math.round(n / step + 1e-9) * step).toFixed(2));

export function ringSizes(d: number): RingSizes {
  const c = circumference(d);
  const usExact = diameterToUs(d);
  return {
    d,
    c,
    ru: q(d, 0.5),
    us: q(usExact, 0.25),
    usExact,
    uk: ukLabel(ukIndexFromCirc(c)),
    eu: Math.round(c),
    jp: Math.round(diameterToJp(d)),
  };
}
