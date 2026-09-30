/**
 * Calendar-date arithmetic on day numbers (days since 1970-01-01, UTC) — no time zones,
 * no DST surprises. Dates travel as "YYYY-MM-DD" strings (the value of <input type="date">).
 */

const DAY_MS = 86_400_000;

/** "2026-03-01" → day number, or null when invalid. */
export function parseIso(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return Math.round(Date.UTC(y, mo - 1, d) / DAY_MS);
}

/** Day number → "YYYY-MM-DD". */
export function isoOf(day: number): string {
  const d = new Date(day * DAY_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Day number → { y, m (1-12), d, weekday (0 = Monday … 6 = Sunday) }. */
export function partsOf(day: number): { y: number; m: number; d: number; weekday: number } {
  const dt = new Date(day * DAY_MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), weekday: (dt.getUTCDay() + 6) % 7 };
}

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/** 365 or 366 — length of the calendar year that contains `day`. */
export function daysInYearOf(day: number): number {
  return isLeap(partsOf(day).y) ? 366 : 365;
}

/** Same day-of-month `k` months later, clamped to the month end (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(day: number, k: number): number {
  const { y, m, d } = partsOf(day);
  const total = y * 12 + (m - 1) + k;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return Math.round(Date.UTC(ny, nm - 1, Math.min(d, daysInMonth(ny, nm))) / DAY_MS);
}

/** Localised date: "8 октября 2026 г." / "October 8, 2026". */
export function fmtDay(locale: "ru" | "en", day: number, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }): string {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { ...opts, timeZone: "UTC" }).format(new Date(day * DAY_MS));
}
