/** Sleep cycles: bedtimes for a wake-up time and wake-up times for a bedtime (minutes since midnight). */

export const DAY_MIN = 1440;
export const norm = (m: number) => ((Math.round(m) % DAY_MIN) + DAY_MIN) % DAY_MIN;

/** "07:30" → 450; null when invalid. */
export function parseHm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 450 → "07:30" (24-hour). */
export function hm(m: number): string {
  const x = norm(m);
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
}

/** 450 → "7:30 AM" (12-hour). */
export function hm12(m: number): string {
  const x = norm(m);
  const h = Math.floor(x / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(x % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export interface SleepOption {
  cycles: number;
  /** Clock time (minutes since midnight). */
  time: number;
  /** Time asleep, minutes (cycles × length). */
  sleep: number;
}

/** Bedtimes for waking at `wake`: wake − cycles × length − time to fall asleep. Most cycles first. */
export function bedtimesFor(wake: number, cycleMin = 90, fallAsleep = 15, counts = [6, 5, 4, 3]): SleepOption[] {
  return counts.map((c) => ({ cycles: c, time: norm(wake - c * cycleMin - fallAsleep), sleep: c * cycleMin }));
}

/** Wake-up times for going to bed at `bed`: bed + time to fall asleep + cycles × length. */
export function wakeTimesFor(bed: number, cycleMin = 90, fallAsleep = 15, counts = [3, 4, 5, 6]): SleepOption[] {
  return counts.map((c) => ({ cycles: c, time: norm(bed + fallAsleep + c * cycleMin), sleep: c * cycleMin }));
}

/** Curated variant pages. */
export const WAKE_PAGES = ["05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00"];
export const BED_PAGES = ["21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "00:30", "01:00"];
