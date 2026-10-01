/**
 * Pregnancy dating and ovulation on day numbers (see calc/kit/dates).
 * Every method produces an estimated due date (EDD); the gestational age is always derived from the
 * same "adjusted LMP" = EDD − 280 days, so cycle length affects the due date and the age consistently.
 */

const TERM = 280;

export type DatingMethod = "lmp" | "conception" | "ivf3" | "ivf5" | "ultrasound";

/** Naegele's rule with cycle-length correction: EDD = LMP + 280 + (cycle − 28). */
export const eddFromLmp = (lmp: number, cycle = 28) => lmp + TERM + (cycle - 28);
export const eddFromConception = (conception: number) => conception + 266;
/** Embryo transfer: day-3 embryo → +263 days, day-5 blastocyst → +261 days. */
export const eddFromIvf = (transfer: number, embryoDay: 3 | 5) => transfer + (embryoDay === 5 ? 261 : 263);
/** Ultrasound dating: EDD = scan date + (280 − gestational age at the scan). */
export const eddFromUltrasound = (scan: number, weeks: number, days: number) => scan + TERM - (weeks * 7 + days);

const adjustedLmp = (edd: number) => edd - TERM;
/** Gestational age in days on `today`. */
export const gestationalAge = (edd: number, today: number) => today - adjustedLmp(edd);
export const splitWeeks = (days: number) => ({ weeks: Math.floor(days / 7), days: ((days % 7) + 7) % 7 });

/** 1st: up to 13 weeks 6 days; 2nd: 14+0 … 27+6; 3rd: from 28+0. */
export function trimester(gaDays: number): 1 | 2 | 3 {
  if (gaDays < 14 * 7) return 1;
  if (gaDays < 28 * 7) return 2;
  return 3;
}

/** Approximate calendar month of pregnancy for a gestational week. */
export function pregnancyMonth(week: number): number {
  const ends = [4, 8, 13, 17, 22, 27, 31, 35];
  const i = ends.findIndex((e) => week <= e);
  return i === -1 ? 9 : i + 1;
}

interface KeyDates {
  conception: number;
  endT1: number;
  endT2: number;
  fullTerm: number;
  due: number;
  postTerm: number;
}

export function keyDates(edd: number): KeyDates {
  const l = adjustedLmp(edd);
  return { conception: l + 14, endT1: l + 13 * 7 + 6, endT2: l + 27 * 7 + 6, fullTerm: l + 37 * 7, due: edd, postTerm: l + 42 * 7 };
}

/* ───────────── Ovulation ───────────── */

export interface CycleDays {
  start: number;
  ovulation: number;
  fertileStart: number;
  fertileEnd: number;
  nextStart: number;
}

/**
 * Upcoming cycles. Ovulation falls on cycle day (cycle length − luteal phase), counting the first day
 * of the period as day 1 — day 14 of a 28-day cycle; the luteal phase is the days after ovulation up
 * to the next period. Fertile window = 5 days before ovulation through 1 day after
 * (sperm survive up to ~5 days, the egg ~24 hours).
 */
export function cycles(lmp: number, cycleLen = 28, luteal = 14, count = 6): CycleDays[] {
  const out: CycleDays[] = [];
  for (let k = 0; k < count; k++) {
    const start = lmp + k * cycleLen;
    const nextStart = start + cycleLen;
    const ovulation = start + (cycleLen - luteal) - 1;
    out.push({ start, ovulation, fertileStart: ovulation - 5, fertileEnd: ovulation + 1, nextStart });
  }
  return out;
}
