import { randomInt } from "./rng";

const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" → days since 1970-01-01 (UTC calendar, no time zones involved). */
export function isoToDay(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(t);
  if (d.getUTCFullYear() !== Number(m[1]) || d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) return null;
  return Math.round(t / DAY_MS);
}

export function dayToDate(day: number, minute = 0): Date {
  return new Date(day * DAY_MS + minute * 60_000);
}

/** 0 = Sunday … 6 = Saturday */
const weekday = (day: number) => dayToDate(day).getUTCDay();
export const isWeekend = (day: number) => {
  const w = weekday(day);
  return w === 0 || w === 6;
};

/** Number of Monday–Friday days in [from, to]. */
export function countWeekdays(from: number, to: number): number {
  let n = 0;
  // whole weeks
  const span = to - from + 1;
  const weeks = Math.floor(span / 7);
  n += weeks * 5;
  for (let d = from + weeks * 7; d <= to; d++) if (!isWeekend(d)) n++;
  return n;
}

export interface RandomDate {
  day: number;
  /** Minute of the day, or -1 when time is off. */
  minute: number;
}

/**
 * Uniform random day in [from, to]; with weekdaysOnly every Monday–Friday is equally
 * likely (rejection of weekend days). With time, the minute of the day is uniform too.
 */
export function randomDate(from: number, to: number, weekdaysOnly: boolean, withTime: boolean): RandomDate {
  if (to < from) throw new RangeError("randomDate: empty range");
  if (weekdaysOnly && countWeekdays(from, to) === 0) throw new RangeError("randomDate: no weekdays in range");
  let day: number;
  do day = from + randomInt(to - from + 1);
  while (weekdaysOnly && isWeekend(day));
  return { day, minute: withTime ? randomInt(1440) : -1 };
}
