/** Body metrics: BMI, ideal weight, energy, macros, body fat, waist-to-height, water, heart rate, BAC. Pure. */

export type Sex = "male" | "female";

export const CM_PER_IN = 2.54;
export const KG_PER_LB = 0.45359237;
export const ML_PER_FLOZ = 29.5735295625;

export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * CM_PER_IN;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const cmToFtIn = (cm: number) => {
  const total = cm / CM_PER_IN;
  let ft = Math.floor(total / 12);
  let inch = Math.round((total - ft * 12) * 10) / 10;
  if (inch >= 12) {
    ft += 1;
    inch -= 12;
  }
  return { ft, inch };
};

/* ───────────── BMI ───────────── */

export type BmiClass = "severe-thin" | "moderate-thin" | "mild-thin" | "normal" | "pre-obese" | "obese-1" | "obese-2" | "obese-3";
export const BMI_CLASSES: readonly BmiClass[] = ["severe-thin", "moderate-thin", "mild-thin", "normal", "pre-obese", "obese-1", "obese-2", "obese-3"];

export function bmi(kg: number, cm: number): number {
  const m = cm / 100;
  return kg / (m * m);
}

/** Upper bounds (exclusive) of each class. WHO adult classes; "asian" uses the WHO 2004 public-health action points 23 / 27.5 / 32.5 / 37.5. */
export function bmiBounds(asian = false): number[] {
  return asian ? [16, 17, 18.5, 23, 27.5, 32.5, 37.5] : [16, 17, 18.5, 25, 30, 35, 40];
}

/** Classify on the BMI rounded to one decimal, as it is displayed (24.96 → 25.0 → pre-obese). */
export function bmiClass(value: number, asian = false): BmiClass {
  const v = Math.round(value * 10) / 10;
  const b = bmiBounds(asian);
  const i = b.findIndex((x) => v < x);
  return BMI_CLASSES[i === -1 ? BMI_CLASSES.length - 1 : i];
}

/** Weight range for a "normal" BMI at this height, kg. */
export function healthyRange(cm: number, asian = false): [number, number] {
  const m2 = (cm / 100) ** 2;
  return [18.5 * m2, (asian ? 22.9 : 24.9) * m2];
}

export const weightForBmi = (b: number, cm: number) => b * (cm / 100) ** 2;

/* ───────────── Ideal weight formulas ───────────── */

export type IdealFormula = "devine" | "robinson" | "miller" | "hamwi";
export const IDEAL_FORMULAS: readonly IdealFormula[] = ["devine", "robinson", "miller", "hamwi"];
const IDEAL: Record<IdealFormula, Record<Sex, [number, number]>> = {
  devine: { male: [50, 2.3], female: [45.5, 2.3] },
  robinson: { male: [52, 1.9], female: [49, 1.7] },
  miller: { male: [56.2, 1.41], female: [53.1, 1.36] },
  hamwi: { male: [48, 2.7], female: [45.5, 2.2] },
};

/** Inches over 5 ft (negative below 152.4 cm — the formulas are extrapolated there). */
export const inchesOver5ft = (cm: number) => cm / CM_PER_IN - 60;

export function idealWeight(formula: IdealFormula, sex: Sex, cm: number): number {
  const [base, per] = IDEAL[formula][sex];
  return base + per * inchesOver5ft(cm);
}

/* ───────────── Energy ───────────── */

export function mifflin(sex: Sex, kg: number, cm: number, age: number): number {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === "male" ? 5 : -161);
}

/** Harris–Benedict equation revised by Roza & Shizgal (1984). */
export function harrisBenedict(sex: Sex, kg: number, cm: number, age: number): number {
  return sex === "male" ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age : 447.593 + 9.247 * kg + 3.098 * cm - 4.33 * age;
}

export type Activity = "sedentary" | "light" | "moderate" | "active" | "very";
export const ACTIVITIES: readonly Activity[] = ["sedentary", "light", "moderate", "active", "very"];
export const ACTIVITY_FACTOR: Record<Activity, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very: 1.9 };

/** Approximate energy in 1 kg of body fat, kcal. */
export const KCAL_PER_KG_FAT = 7700;
/** Weekly weight change (kg) for a daily calorie surplus (+) or deficit (−). */
export const weeklyChange = (dailyDelta: number) => (dailyDelta * 7) / KCAL_PER_KG_FAT;

/* ───────────── Macros ───────────── */

export interface MacroSplit {
  protein: number;
  fat: number;
  carbs: number;
}
export type MacroPreset = "balanced" | "lowcarb" | "highprotein";
export const MACRO_PRESETS: Record<MacroPreset, MacroSplit> = {
  balanced: { protein: 25, fat: 30, carbs: 45 },
  lowcarb: { protein: 30, fat: 45, carbs: 25 },
  highprotein: { protein: 35, fat: 30, carbs: 35 },
};
export const KCAL_PER_G = { protein: 4, fat: 9, carbs: 4 } as const;

export function macroGrams(kcal: number, split: MacroSplit): MacroSplit {
  return {
    protein: (kcal * split.protein) / 100 / KCAL_PER_G.protein,
    fat: (kcal * split.fat) / 100 / KCAL_PER_G.fat,
    carbs: (kcal * split.carbs) / 100 / KCAL_PER_G.carbs,
  };
}

/* ───────────── Body fat ───────────── */

/** US Navy method (metric form, all in cm). Returns null for impossible measurements. */
export function navyBodyFat(sex: Sex, cm: number, waist: number, neck: number, hip = 0): number | null {
  if (sex === "male") {
    if (waist - neck <= 0) return null;
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(cm)) - 450;
  }
  if (waist + hip - neck <= 0) return null;
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(cm)) - 450;
}

/** Deurenberg (1991) estimate from BMI and age. */
export function bmiBodyFat(sex: Sex, bmiValue: number, age: number): number {
  return 1.2 * bmiValue + 0.23 * age - 10.8 * (sex === "male" ? 1 : 0) - 5.4;
}

export type FatCategory = "below" | "essential" | "athletes" | "fitness" | "average" | "obese";
/** ACE body-fat categories: lower bounds per sex. */
export const FAT_BOUNDS: Record<Sex, [FatCategory, number][]> = {
  male: [["essential", 2], ["athletes", 6], ["fitness", 14], ["average", 18], ["obese", 25]],
  female: [["essential", 10], ["athletes", 14], ["fitness", 21], ["average", 25], ["obese", 32]],
};
export function fatCategory(sex: Sex, pct: number): FatCategory {
  let cat: FatCategory = "below";
  for (const [c, from] of FAT_BOUNDS[sex]) if (pct >= from) cat = c;
  return cat;
}

/* ───────────── Waist-to-height ───────────── */

export type WhtrCategory = "low" | "healthy" | "increased" | "high";
export function whtrCategory(ratio: number): WhtrCategory {
  if (ratio < 0.4) return "low";
  if (ratio < 0.5) return "healthy";
  if (ratio < 0.6) return "increased";
  return "high";
}

/* ───────────── Water ───────────── */

export type Climate = "temperate" | "hot";
/** Heuristic daily water estimate (ml): 30 ml/kg + 500 ml per hour of exercise + 500 ml in hot weather. */
export function waterIntake(kg: number, exerciseMin: number, climate: Climate): { base: number; exercise: number; climate: number; total: number } {
  const base = kg * 30;
  const exercise = (Math.max(0, exerciseMin) / 60) * 500;
  const extra = climate === "hot" ? 500 : 0;
  return { base, exercise, climate: extra, total: base + exercise + extra };
}

/* ───────────── Heart rate ───────────── */

export const maxHrFox = (age: number) => 220 - age;
export const maxHrTanaka = (age: number) => 208 - 0.7 * age;
export const ZONES: [number, number][] = [
  [50, 60],
  [60, 70],
  [70, 80],
  [80, 90],
  [90, 100],
];
/** Target HR for an intensity (percent): simple % of max, or Karvonen with resting HR. */
export function targetHr(maxHr: number, pct: number, restHr?: number | null): number {
  return restHr ? (maxHr - restHr) * (pct / 100) + restHr : (maxHr * pct) / 100;
}

/* ───────────── Blood alcohol (Widmark) ───────────── */

export const ETHANOL_DENSITY = 0.789;
export const WIDMARK_R: Record<Sex, number> = { male: 0.68, female: 0.55 };
export const ELIMINATION = 0.15; // ‰ per hour (typical range 0.1–0.2)

export const alcoholGrams = (ml: number, abvPct: number) => ml * (abvPct / 100) * ETHANOL_DENSITY;

/** Widmark estimate in ‰ (g/kg). `hours` since drinking started; never negative. */
export function widmark(grams: number, kg: number, sex: Sex, hours = 0, beta = ELIMINATION): { peak: number; now: number; hoursToZero: number } {
  const peak = grams / (WIDMARK_R[sex] * kg);
  return { peak, now: Math.max(0, peak - beta * hours), hoursToZero: peak / beta };
}
