/**
 * Pure time-zone helpers built on Intl (no reliance on the host time zone).
 */

/** Minutes east of UTC → "+05:00" / "-03:30" / "+00:00" (ISO 8601). */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "UTC+05:00"; zero offset → "UTC+00:00". */
export const utcLabel = (minutes: number) => `UTC${formatOffset(minutes)}`;

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = dtfCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    dtfCache.set(timeZone, f);
  }
  return f;
}

/** UTC offset (minutes east of UTC) of an IANA zone at a given instant. */
export function tzOffsetMinutes(timeZone: string, date: Date): number {
  const t = Math.floor(date.getTime() / 1000) * 1000;
  const p: Record<string, number> = {};
  for (const x of partsFormatter(timeZone).formatToParts(new Date(t))) if (x.type !== "literal") p[x.type] = Number(x.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
  return Math.round((asUtc - t) / 60000);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export interface DstInfo {
  observes: boolean;
  /** Standard (winter) offset in minutes. */
  standard: number;
  /** Daylight (summer) offset, null when DST is not observed. */
  daylight: number | null;
}

/** Whether a zone observes DST in a given year (compares mid-January with mid-July). */
export function dstInfo(timeZone: string, year: number): DstInfo {
  const jan = tzOffsetMinutes(timeZone, new Date(Date.UTC(year, 0, 15, 12)));
  const jul = tzOffsetMinutes(timeZone, new Date(Date.UTC(year, 6, 15, 12)));
  if (jan === jul) return { observes: false, standard: jan, daylight: null };
  return { observes: true, standard: Math.min(jan, jul), daylight: Math.max(jan, jul) };
}

export interface Transition {
  /** Instant of the change (UTC). */
  at: Date;
  from: number;
  to: number;
}

/**
 * Next UTC-offset change after `from` within `horizonDays` (default ~13 months).
 * Steps a day at a time, then binary-searches the exact minute.
 */
export function nextTransition(timeZone: string, from: Date, horizonDays = 400): Transition | null {
  const DAY = 86_400_000;
  // Minute-aligned so the binary search always makes progress.
  const t0 = Math.floor(from.getTime() / 60_000) * 60_000;
  let lo = t0;
  const start = tzOffsetMinutes(timeZone, new Date(t0));
  for (let i = 1; i <= horizonDays; i++) {
    const hi = t0 + i * DAY;
    const off = tzOffsetMinutes(timeZone, new Date(hi));
    if (off !== start) {
      let a = lo;
      let b = hi;
      while (b - a > 60_000) {
        const mid = Math.floor((a + b) / 2 / 60_000) * 60_000;
        if (tzOffsetMinutes(timeZone, new Date(mid)) === start) a = mid;
        else b = mid;
      }
      return { at: new Date(b), from: start, to: off };
    }
    lo = hi;
  }
  return null;
}
