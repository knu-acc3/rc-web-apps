/**
 * Date calculators: age, differences, adding periods, Unix time, durations and
 * work hours. Pure functions over civil dates (see calendar/lib/dates).
 */
import { addDays, addMonths, addYears, cmpYmd, diffDays, isoWeekday, isLeap, type Ymd } from "@/sections/calendar/lib/dates";
import { addWorkingDays, countWorkingDays, type HolidayCountry } from "@/sections/calendar/lib/holidays";

/* ───────────── age ───────────── */

interface Age {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  /** Next birthday (Feb 29 → Feb 28 in common years, as in Russian civil law). */
  next: Ymd;
  daysToNext: number;
  /** Age reached at the next birthday. */
  nextAge: number;
  isBirthday: boolean;
}

/** Anniversary of `birth` in `year`, clamping Feb 29 to Feb 28 in common years. */
function anniversary(birth: Ymd, year: number): Ymd {
  if (birth.m === 2 && birth.d === 29 && !isLeap(year)) return { y: year, m: 2, d: 28 };
  return { y: year, m: birth.m, d: birth.d };
}

/** Full years, months and days from `from` to `to` (to ≥ from), counted by anniversaries. */
export function ymdBetween(from: Ymd, to: Ymd): { years: number; months: number; days: number } {
  let years = to.y - from.y;
  if (cmpYmd(addYears(from, years), to) > 0) years--;
  const base = addYears(from, years);
  let months = (to.y - base.y) * 12 + (to.m - base.m);
  if (cmpYmd(addMonths(base, months), to) > 0) months--;
  const days = diffDays(addMonths(base, months), to);
  return { years, months, days };
}

export function age(birth: Ymd, on: Ymd): Age | null {
  if (cmpYmd(birth, on) > 0) return null;
  const { years, months, days } = ymdBetween(birth, on);
  const totalDays = diffDays(birth, on);
  let next = anniversary(birth, on.y);
  if (cmpYmd(next, on) < 0) next = anniversary(birth, on.y + 1);
  const isBirthday = cmpYmd(next, on) === 0;
  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
    next,
    daysToNext: diffDays(on, next),
    nextAge: next.y - birth.y,
    isBirthday,
  };
}

/* ───────────── differences ───────────── */

interface Difference {
  /** Signed calendar days b − a. */
  days: number;
  /** Days counting both ends (|days| + 1). */
  inclusive: number;
  weeks: number;
  weekDays: number;
  years: number;
  months: number;
  restDays: number;
  totalMonths: number;
  workdays: number;
  weekends: number;
}

export function difference(a: Ymd, b: Ymd, inclusiveEnd: boolean, country: HolidayCountry | null): Difference {
  const signed = diffDays(a, b);
  const [lo, hi] = signed >= 0 ? [a, b] : [b, a];
  const span = Math.abs(signed) + (inclusiveEnd ? 1 : 0);
  const end = inclusiveEnd ? addDays(hi, 1) : hi;
  const ymd = ymdBetween(lo, end);
  const workdays = span === 0 ? 0 : countWorkingDays(country, lo, addDays(lo, span - 1), true);
  return {
    days: signed,
    inclusive: Math.abs(signed) + 1,
    weeks: Math.floor(span / 7),
    weekDays: span % 7,
    years: ymd.years,
    months: ymd.months,
    restDays: ymd.days,
    totalMonths: ymd.years * 12 + ymd.months,
    workdays,
    weekends: span - workdays,
  };
}

export type AddUnit = "days" | "weeks" | "months" | "years" | "workdays";

export function addPeriod(from: Ymd, n: number, unit: AddUnit, country: HolidayCountry | null): Ymd {
  switch (unit) {
    case "days":
      return addDays(from, n);
    case "weeks":
      return addDays(from, n * 7);
    case "months":
      return addMonths(from, n);
    case "years":
      return addYears(from, n);
    case "workdays":
      return n === 0 ? from : addWorkingDays(country, from, n);
  }
}

export const weekdayOf = (x: Ymd): number => isoWeekday(x.y, x.m, x.d);

/* ───────────── Unix time ───────────── */

export type TsUnit = "s" | "ms" | "us" | "ns";

interface ParsedTs {
  /** Milliseconds since the epoch (may be fractional for µs/ns). */
  ms: number;
  unit: TsUnit;
  /** true when the unit was guessed from the number of digits. */
  guessed: boolean;
  /** The value looks unusual: a date outside 1970–2100, or a unit atypical for this many digits. */
  suspicious: boolean;
}

const FACTOR: Record<TsUnit, number> = { s: 1000, ms: 1, us: 0.001, ns: 0.000001 };

/**
 * Digits → unit: ≤ 11 → seconds, 12–14 → milliseconds, 15–17 → microseconds, 18+ → nanoseconds.
 * (13-digit values such as 1700000000000 are milliseconds, never "seconds in the year 55 000".)
 */
export function detectUnit(digits: number): TsUnit {
  if (digits <= 11) return "s";
  if (digits <= 14) return "ms";
  if (digits <= 17) return "us";
  return "ns";
}

export function parseTimestamp(input: string, unit: TsUnit | "auto" = "auto"): ParsedTs | null {
  const s = input.trim().replace(/[\s_  ]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const intDigits = s.replace(/^-/, "").split(".")[0].replace(/^0+(?=\d)/, "").length;
  const u = unit === "auto" ? detectUnit(intDigits) : unit;
  const ms = Number(s) * FACTOR[u];
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return null;
  const year = new Date(ms).getUTCFullYear();
  return { ms, unit: u, guessed: unit === "auto", suspicious: year < 1970 || year > 2100 || (intDigits > 1 && detectUnit(intDigits) !== u) };
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const p2 = (n: number) => String(n).padStart(2, "0");

/** RFC 2822 date in UTC or at a fixed offset (minutes). */
export function rfc2822(ms: number, offsetMin = 0): string {
  const d = new Date(ms + offsetMin * 60000);
  const sign = offsetMin < 0 ? "-" : "+";
  const a = Math.abs(offsetMin);
  return `${DAYS_EN[d.getUTCDay()]}, ${p2(d.getUTCDate())} ${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} ${sign}${p2(Math.floor(a / 60))}${p2(a % 60)}`;
}

/** ISO 8601 at a fixed offset; "Z" for UTC. Milliseconds are shown when non-zero. */
export function iso8601(ms: number, offsetMin = 0): string {
  const d = new Date(Math.floor(ms) + offsetMin * 60000);
  const frac = Math.floor(ms) % 1000 !== 0 ? `.${String(((Math.floor(ms) % 1000) + 1000) % 1000).padStart(3, "0")}` : "";
  const a = Math.abs(offsetMin);
  const off = offsetMin === 0 ? "Z" : `${offsetMin < 0 ? "-" : "+"}${p2(Math.floor(a / 60))}:${p2(a % 60)}`;
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}T${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}${frac}${off}`;
}

/* ───────────── durations (hh:mm:ss arithmetic) ───────────── */

/**
 * Parse a duration: "1:30:15", "90:00" (mm:ss), "01:30" (hh:mm when `hhmm`), "1h 30m",
 * "1ч 30мин 15с", "2д 3ч", "45" (minutes by default), "1,5ч". Returns seconds or null.
 */
export function parseDuration(input: string, bare: "min" | "sec" | "hour" = "min", colon: "hms" | "hm" = "hms"): number | null {
  const s = input.trim().toLowerCase().replace(",", ".");
  if (!s) return null;
  const neg = s.startsWith("-") || s.startsWith("−");
  const body = s.replace(/^[-−+]\s*/, "");
  let sec: number | null = null;
  if (/^\d+(\.\d+)?$/.test(body)) {
    const v = Number(body);
    sec = bare === "sec" ? v : bare === "hour" ? v * 3600 : v * 60;
  } else if (/^\d+(:\d{1,2}){1,2}(\.\d+)?$/.test(body)) {
    const parts = body.split(":").map(Number);
    if (parts.slice(1).some((p) => p >= 60)) return null;
    if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else sec = colon === "hm" ? parts[0] * 3600 + parts[1] * 60 : parts[0] * 60 + parts[1];
  } else {
    const re = /(\d+(?:\.\d+)?)\s*(d|д|дн|день|дня|дней|h|hr|hrs|hour|hours|ч|час|часа|часов|m|min|mins|minute|minutes|м|мин|минута|минуты|минут|s|sec|secs|second|seconds|с|сек|секунда|секунды|секунд)(?![a-zа-яё])/gu;
    let total = 0;
    let matched = "";
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const v = Number(m[1]);
      const u = m[2];
      if (/^(d|д)/.test(u)) total += v * 86400;
      else if (/^(h|ч)/.test(u)) total += v * 3600;
      else if (/^(m|м)/.test(u)) total += v * 60;
      else total += v;
      matched += m[0];
    }
    if (!matched || matched.replace(/\s/g, "").length !== body.replace(/\s/g, "").length) return null;
    sec = total;
  }
  if (sec === null || !Number.isFinite(sec)) return null;
  return Math.round((neg ? -sec : sec) * 1000) / 1000;
}

/** "1:05:09", "−0:30:00"; days are folded into hours. */
export function formatDuration(sec: number, withSeconds = true): string {
  const neg = sec < 0;
  const a = Math.round(Math.abs(sec));
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const s = a % 60;
  return `${neg ? "−" : ""}${h}:${p2(m)}${withSeconds ? `:${p2(s)}` : ""}`;
}

/** Sum lines like "+1:30", "-0:15", "45m"; returns total seconds and the index of bad lines. */
export function sumDurations(lines: string[], bare: "min" | "sec" | "hour" = "min"): { total: number; bad: number[] } {
  let total = 0;
  const bad: number[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    const v = parseDuration(t, bare);
    if (v === null) bad.push(i);
    else total += v;
  });
  return { total, bad };
}

/* ───────────── work hours ───────────── */

/** "09:00" → minutes after midnight, or null. */
export function parseClock(s: string): number | null {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 24 || mi > 59 || (h === 24 && mi > 0)) return null;
  return h * 60 + mi;
}

/** Worked minutes for a shift; an end before the start means the shift ends the next day. */
export function shiftMinutes(start: number, end: number, breakMin = 0): number {
  let span = end - start;
  if (span <= 0) span += 1440;
  return Math.max(0, span - Math.max(0, breakMin));
}
