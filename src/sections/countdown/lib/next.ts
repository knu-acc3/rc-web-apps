/**
 * Next occurrence of a countdown target in the VISITOR'S local time zone.
 * Runs in the browser only (uses local Date); the server passes civil dates.
 */

export interface CountdownSpec {
  name: string;
  to: string;
  /** Civil dates (YYYY-MM-DD) of upcoming occurrences, sorted. */
  dates?: string[];
  /** Exact UTC instants (ms), sorted. */
  moments?: number[];
  weekend?: boolean;
  /** A one-off event: after it has passed, show how long ago it was. */
  once?: boolean;
  /** The event lasts the whole day (show "today!" during it). */
  allDay?: boolean;
  yearProgress?: boolean;
  expected?: boolean;
  /** Optional wall-clock time for custom countdowns ("HH:MM"). */
  time?: string;
}

export interface Target {
  start: number;
  end: number;
  state: "before" | "during" | "after";
}

const DAY = 86400000;

function localStart(ymd: string, time?: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = (time ?? "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0).getTime();
}

function localNextDay(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0).getTime();
}

export function nextTarget(spec: CountdownSpec, now: number): Target | null {
  if (spec.weekend) {
    const d = new Date(now);
    const wd = d.getDay(); // 0 Sun … 6 Sat
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (wd === 6 || wd === 0) {
      const sat = wd === 6 ? midnight : new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime();
      return { start: sat, end: new Date(new Date(sat).getFullYear(), new Date(sat).getMonth(), new Date(sat).getDate() + 2).getTime(), state: "during" };
    }
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - wd)).getTime();
    return { start, end: start + 2 * DAY, state: "before" };
  }
  if (spec.moments) {
    for (const t of spec.moments) {
      if (now < t) return { start: t, end: t + 3600000, state: "before" };
      if (now < t + 3600000) return { start: t, end: t + 3600000, state: "during" };
    }
    if (spec.once && spec.moments.length) {
      const t = spec.moments[spec.moments.length - 1];
      return { start: t, end: t, state: "after" };
    }
    return null;
  }
  const dates = spec.dates ?? [];
  for (const ymd of dates) {
    const start = localStart(ymd, spec.time);
    const end = spec.allDay ? localNextDay(ymd) : start;
    if (now < start) return { start, end, state: "before" };
    if (now < end) return { start, end, state: "during" };
  }
  if (spec.once && dates.length) {
    const start = localStart(dates[dates.length - 1], spec.time);
    return { start, end: start, state: "after" };
  }
  return null;
}

/** Split a positive duration into days/hours/minutes/seconds. */
export function splitMs(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

/** Share of the current local year that has passed, 0…1. */
export function yearProgress(now: number): number {
  const d = new Date(now);
  const a = new Date(d.getFullYear(), 0, 1).getTime();
  const b = new Date(d.getFullYear() + 1, 0, 1).getTime();
  return (now - a) / (b - a);
}
