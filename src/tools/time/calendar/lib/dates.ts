/**
 * Pure civil-calendar math (proleptic Gregorian). No time zones, no "now":
 * a civil date is { y, m (1–12), d }. Day numbers count days since 1970-01-01.
 * Shared by the calendar, date, countdown and timer sections.
 */
import type { Locale } from "@/i18n/config";

export interface Ymd {
  y: number;
  m: number;
  d: number;
}

export const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const daysInMonth = (y: number, m: number): number => (m === 2 && isLeap(y) ? 29 : MDAYS[m - 1]);
export const daysInYear = (y: number): number => (isLeap(y) ? 366 : 365);

/** Days since 1970-01-01 (works for any year, incl. < 100). */
export function dayNum(y: number, m: number, d: number): number {
  const dt = new Date(0);
  dt.setUTCFullYear(y, m - 1, d);
  dt.setUTCHours(0, 0, 0, 0);
  return Math.round(dt.getTime() / 86_400_000);
}
export const dayNumOf = (x: Ymd): number => dayNum(x.y, x.m, x.d);

export function fromDayNum(n: number): Ymd {
  const dt = new Date(n * 86_400_000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(y: number, m: number, d: number): number {
  // 1970-01-01 was a Thursday (ISO 4).
  return ((((dayNum(y, m, d) + 3) % 7) + 7) % 7) + 1;
}

export function addDays(x: Ymd, n: number): Ymd {
  return fromDayNum(dayNumOf(x) + n);
}

/** Add calendar months; the day is clamped to the last day of the target month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(x: Ymd, n: number): Ymd {
  const idx = x.y * 12 + (x.m - 1) + n;
  const y = Math.floor(idx / 12);
  const m = idx - y * 12 + 1;
  return { y, m, d: Math.min(x.d, daysInMonth(y, m)) };
}
export const addYears = (x: Ymd, n: number): Ymd => addMonths(x, n * 12);

/** b − a in days. */
export const diffDays = (a: Ymd, b: Ymd): number => dayNumOf(b) - dayNumOf(a);
export const cmpYmd = (a: Ymd, b: Ymd): number => dayNumOf(a) - dayNumOf(b);

const pad = (n: number, w = 2) => String(Math.abs(n)).padStart(w, "0");
/** "2026-03-08" */
export function ymdStr(x: Ymd): string {
  return `${x.y < 0 ? "-" : ""}${pad(x.y, 4)}-${pad(x.m)}-${pad(x.d)}`;
}
/** Parse "YYYY-MM-DD"; returns null for invalid dates (e.g. 2025-02-29). */
export function parseYmd(s: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const x = { y: +m[1], m: +m[2], d: +m[3] };
  return isValidYmd(x) ? x : null;
}
export function isValidYmd(x: Ymd): boolean {
  return Number.isInteger(x.y) && Number.isInteger(x.m) && Number.isInteger(x.d) && x.m >= 1 && x.m <= 12 && x.d >= 1 && x.d <= daysInMonth(x.y, x.m);
}

/** The visitor's local civil date for a Date instant (client only). */
export function localYmd(d: Date): Ymd {
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

/** Day of the year, 1-based. */
export const dayOfYear = (x: Ymd): number => dayNumOf(x) - dayNum(x.y, 1, 1) + 1;

/* ───────────── ISO 8601 weeks ───────────── */

/** ISO week-numbering year and week of a date. */
export function isoWeek(x: Ymd): { year: number; week: number } {
  const wd = isoWeekday(x.y, x.m, x.d);
  // The Thursday of this week decides the year.
  const thu = addDays(x, 4 - wd);
  const week = Math.floor((dayNumOf(thu) - dayNum(thu.y, 1, 1)) / 7) + 1;
  return { year: thu.y, week };
}

/** 53 if the year starts on a Thursday, or is a leap year starting on a Wednesday. */
export function isoWeeksInYear(y: number): 52 | 53 {
  const jan1 = isoWeekday(y, 1, 1);
  return jan1 === 4 || (isLeap(y) && jan1 === 3) ? 53 : 52;
}

/** Monday of ISO week `week` of ISO year `year`. */
export function isoWeekMonday(year: number, week: number): Ymd {
  const jan4 = { y: year, m: 1, d: 4 };
  const mon1 = addDays(jan4, 1 - isoWeekday(year, 1, 4));
  return addDays(mon1, (week - 1) * 7);
}

/* ───────────── names ───────────── */

export const MONTH_SLUGS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;

export const MONTHS = {
  ru: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
  /** «8 марта» */
  ruGen: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  /** «в марте» */
  ruPrep: ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
} as const;

/** Index 0 = Monday. */
export const WEEKDAYS = {
  ru: ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"],
  /** «в понедельник», «в среду» (accusative) */
  ruAcc: ["понедельник", "вторник", "среду", "четверг", "пятницу", "субботу", "воскресенье"],
  ruShort: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  enShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
} as const;

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function monthName(locale: Locale, m: number): string {
  return locale === "ru" ? cap(MONTHS.ru[m - 1]) : MONTHS.en[m - 1];
}
function weekdayName(locale: Locale, isoWd: number): string {
  return locale === "ru" ? WEEKDAYS.ru[isoWd - 1] : WEEKDAYS.en[isoWd - 1];
}

/** «8 марта 2026» / «March 8, 2026» — no Intl, stable on server and client. */
export function fmtDate(locale: Locale, x: Ymd, withYear = true): string {
  if (locale === "ru") return `${x.d} ${MONTHS.ruGen[x.m - 1]}${withYear ? ` ${x.y}` : ""}`;
  return `${MONTHS.en[x.m - 1]} ${x.d}${withYear ? `, ${x.y}` : ""}`;
}
/** «воскресенье, 8 марта 2026» / «Sunday, March 8, 2026» */
export function fmtDateLong(locale: Locale, x: Ymd, withYear = true): string {
  return `${weekdayName(locale, isoWeekday(x.y, x.m, x.d))}, ${fmtDate(locale, x, withYear)}`;
}

/* ───────────── movable feasts ───────────── */

/** Western (Gregorian) Easter Sunday — Meeus/Jones/Butcher algorithm. */
export function westernEaster(y: number): Ymd {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { y, m: month, d: day };
}

/**
 * Orthodox Easter Sunday (Julian computus, Meeus), returned as a Gregorian date.
 * The Julian→Gregorian difference is 13 days for 1900–2099 (computed generally here).
 */
export function orthodoxEaster(y: number): Ymd {
  const a = y % 4;
  const b = y % 7;
  const c = y % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const shift = Math.floor(y / 100) - Math.floor(y / 400) - 2;
  return addDays({ y, m: month, d: day }, shift);
}

/** n-th (1-based) given ISO weekday of a month; n = -1 → last. */
export function nthWeekday(y: number, m: number, isoWd: number, n: number): Ymd {
  if (n > 0) {
    const first = isoWeekday(y, m, 1);
    return { y, m, d: 1 + ((isoWd - first + 7) % 7) + (n - 1) * 7 };
  }
  const lastD = daysInMonth(y, m);
  const last = isoWeekday(y, m, lastD);
  return { y, m, d: lastD - ((last - isoWd + 7) % 7) };
}
