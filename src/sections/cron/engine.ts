/**
 * Cron engine: Unix/Vixie (5 fields), with seconds (6 fields, node-cron / Spring style) and
 * Quartz (6–7 fields with ? L W #). Next runs are found by field arithmetic on the wall clock
 * of an IANA time zone — no minute-by-minute scanning — and bounded, so impossible
 * expressions (e.g. 30 February) terminate with "no runs".
 */
import { daysInMonth, instantToWall, wallToInstant, weekday, type Wall } from "./tz";

export type Dialect = "unix" | "seconds" | "quartz";
export type FieldName = "second" | "minute" | "hour" | "dom" | "month" | "dow" | "year";

export interface ParsedField {
  name: FieldName;
  raw: string;
  /** Sorted allowed values (dow: 0–6, Sunday = 0) */
  values: number[];
  /** Field starts with "*" or is "?" — "unrestricted" in the Vixie DOM/DOW sense */
  star: boolean;
  /** Quartz specials */
  last?: boolean; // DOM "L"
  lastOffset?: number; // DOM "L-3"
  lastWeekday?: boolean; // DOM "LW"
  nearestWeekday?: number[]; // DOM "15W"
  lastDow?: number[]; // DOW "5L" (converted to 0–6)
  nthDow?: [number, number][]; // DOW "6#3" → [5, 3]
}

export interface CronExpr {
  dialect: Dialect;
  source: string;
  macro?: string;
  reboot?: boolean;
  fields: Record<FieldName, ParsedField>;
}

export class CronError extends Error {
  constructor(
    readonly code: string,
    readonly field?: FieldName,
    readonly detail?: string,
  ) {
    super(`${code}${field ? ` in ${field}` : ""}${detail ? `: ${detail}` : ""}`);
  }
}

export const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const RANGE: Record<FieldName, [number, number]> = {
  second: [0, 59],
  minute: [0, 59],
  hour: [0, 23],
  dom: [1, 31],
  month: [1, 12],
  dow: [0, 7],
  year: [1970, 2199],
};

function parseValue(tok: string, f: FieldName, quartz: boolean): number {
  const up = tok.toUpperCase();
  if (f === "month") {
    const i = MONTHS.indexOf(up);
    if (i >= 0) return i + 1;
  }
  if (f === "dow") {
    const i = DAYS.indexOf(up);
    if (i >= 0) return quartz ? i + 1 : i;
  }
  if (!/^\d+$/.test(tok)) throw new CronError("bad-value", f, tok);
  const v = Number(tok);
  const [lo, hi] = quartz && f === "dow" ? [1, 7] : RANGE[f];
  if (v < lo || v > hi) throw new CronError("out-of-range", f, tok);
  return v;
}

function parseField(raw: string, f: FieldName, dialect: Dialect): ParsedField {
  const quartz = dialect === "quartz";
  const out: ParsedField = { name: f, raw, values: [], star: false };
  if (!raw) throw new CronError("empty", f);
  if (raw === "?") {
    if (f !== "dom" && f !== "dow") throw new CronError("question", f);
    out.star = true;
    out.values = f === "dom" ? range(1, 31) : range(0, 6);
    return out;
  }
  out.star = raw.startsWith("*");
  const set = new Set<number>();
  const [lo, hi] = quartz && f === "dow" ? [1, 7] : RANGE[f];
  for (const item of raw.split(",")) {
    if (!item) throw new CronError("empty-item", f);
    // Quartz specials
    if (f === "dom" && /^L(-\d+)?$/i.test(item)) {
      if (!quartz) throw new CronError("quartz-only", f, item);
      out.last = true;
      out.lastOffset = item.length > 1 ? Number(item.slice(2)) : 0;
      if (out.lastOffset > 30) throw new CronError("out-of-range", f, item);
      continue;
    }
    if (f === "dom" && /^LW$/i.test(item)) {
      if (!quartz) throw new CronError("quartz-only", f, item);
      out.lastWeekday = true;
      continue;
    }
    if (f === "dom" && /^\d+W$/i.test(item)) {
      if (!quartz) throw new CronError("quartz-only", f, item);
      const d = Number(item.slice(0, -1));
      if (d < 1 || d > 31) throw new CronError("out-of-range", f, item);
      (out.nearestWeekday ??= []).push(d);
      continue;
    }
    if (f === "dow" && /^(\d|[A-Z]{3})?L$/i.test(item)) {
      if (!quartz) throw new CronError("quartz-only", f, item);
      if (item.toUpperCase() === "L") set.add(7);
      else (out.lastDow ??= []).push(parseValue(item.slice(0, -1), f, true) - 1);
      continue;
    }
    if (f === "dow" && /^(\d|[A-Z]{3})#[1-5]$/i.test(item)) {
      if (!quartz) throw new CronError("quartz-only", f, item);
      const [d, n] = item.split("#");
      (out.nthDow ??= []).push([parseValue(d, f, true) - 1, Number(n)]);
      continue;
    }
    const m = /^(\*|[^/-]+)(?:-([^/]+))?(?:\/(\d+))?$/.exec(item);
    if (!m) throw new CronError("syntax", f, item);
    const step = m[3] !== undefined ? Number(m[3]) : 1;
    if (step < 1) throw new CronError("step", f, item);
    let a: number;
    let b: number;
    if (m[1] === "*") {
      if (m[2] !== undefined) throw new CronError("syntax", f, item);
      [a, b] = [lo, hi];
      if (f === "dow" && !quartz) b = 6;
    } else {
      a = parseValue(m[1], f, quartz);
      b = m[2] !== undefined ? parseValue(m[2], f, quartz) : m[3] !== undefined ? (f === "dow" && !quartz ? 6 : hi) : a;
    }
    if (b < a) throw new CronError("reversed", f, item);
    for (let v = a; v <= b; v += step) set.add(v);
  }
  let vals = [...set];
  if (f === "dow") vals = [...new Set(vals.map((v) => (quartz ? v - 1 : v % 7)))];
  out.values = vals.sort((x, y) => x - y);
  return out;
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/**
 * Parse an expression. `dialect: "auto"` picks Unix for 5 fields, Quartz when ? L W # are
 * used or there are 7 fields, and seconds-first (node-cron / Spring) for other 6-field input.
 */
export function parseCron(input: string, dialect: Dialect | "auto" = "auto"): CronExpr {
  const src = input.trim().replace(/\s+/g, " ");
  if (!src) throw new CronError("empty-expr");
  const low = src.toLowerCase();
  if (low === "@reboot") {
    const any = parseCron("* * * * *", "unix");
    return { ...any, source: src, macro: "@reboot", reboot: true };
  }
  if (low.startsWith("@")) {
    const m = MACROS[low];
    if (!m) throw new CronError("unknown-macro", undefined, src);
    return { ...parseCron(m, "unix"), source: src, macro: low };
  }
  const parts = src.split(" ");
  let d: Dialect;
  if (dialect !== "auto") d = dialect;
  else if (parts.length === 5) d = "unix";
  else if (parts.length === 7 || /[?LW#]/i.test(parts.slice(3, 6).join(" ").replace(/[A-Z]{3}/gi, (x) => (DAYS.includes(x.toUpperCase()) || MONTHS.includes(x.toUpperCase()) ? "" : x)))) d = "quartz";
  else d = "seconds";
  const expected = d === "unix" ? [5] : d === "seconds" ? [6] : [6, 7];
  if (!expected.includes(parts.length)) throw new CronError("field-count", undefined, String(parts.length));
  const names: FieldName[] = d === "unix" ? ["minute", "hour", "dom", "month", "dow"] : ["second", "minute", "hour", "dom", "month", "dow", "year"];
  const fields = {} as Record<FieldName, ParsedField>;
  names.forEach((n, i) => {
    if (i < parts.length) fields[n] = parseField(parts[i], n, d);
  });
  if (!fields.second) fields.second = { name: "second", raw: "0", values: [0], star: false };
  if (!fields.year) fields.year = { name: "year", raw: "*", values: [], star: true };
  if (d === "quartz" && fields.dom.raw !== "?" && fields.dow.raw !== "?") throw new CronError("quartz-question");
  return { dialect: d, source: src, fields };
}

/* ───────────── matching ───────────── */

function nearestWeekdayOf(y: number, M: number, d: number): number {
  const dim = daysInMonth(y, M);
  const day = Math.min(d, dim);
  const wd = weekday(y, M, day);
  if (wd === 6) return day === 1 ? 3 : day - 1;
  if (wd === 0) return day === dim ? day - 2 : day + 1;
  return day;
}

function domMatches(f: ParsedField, y: number, M: number, d: number): boolean {
  const dim = daysInMonth(y, M);
  if (f.last && d === dim - (f.lastOffset ?? 0)) return true;
  if (f.lastWeekday) {
    let ld = dim;
    while (weekday(y, M, ld) === 0 || weekday(y, M, ld) === 6) ld--;
    if (d === ld) return true;
  }
  if (f.nearestWeekday?.some((n) => nearestWeekdayOf(y, M, n) === d)) return true;
  return f.values.includes(d);
}

function dowMatches(f: ParsedField, y: number, M: number, d: number): boolean {
  const wd = weekday(y, M, d);
  if (f.values.includes(wd)) return true;
  if (f.lastDow?.includes(wd) && d + 7 > daysInMonth(y, M)) return true;
  if (f.nthDow?.some(([w, n]) => w === wd && Math.ceil(d / 7) === n)) return true;
  return false;
}

/**
 * Vixie/cronie semantics: if either DOM or DOW starts with "*", both must match (AND of the
 * bit sets — so "*∕2" still restricts days); if both are restricted, EITHER may match (OR).
 * Quartz: exactly one of them is "?", only the other one counts.
 */
export function dayMatches(e: CronExpr, y: number, M: number, d: number): boolean {
  const { dom, dow } = e.fields;
  if (e.dialect === "quartz") return dom.raw === "?" ? dowMatches(dow, y, M, d) : domMatches(dom, y, M, d);
  const a = domMatches(dom, y, M, d);
  const b = dowMatches(dow, y, M, d);
  return dom.star || dow.star ? a && b : a || b;
}

const nextIn = (vals: number[], from: number) => vals.find((v) => v >= from);

/** Next matching wall time ≥ `w` (inclusive), or null within `maxYears`. */
export function nextWall(e: CronExpr, w: Wall, maxYears = 30): Wall | null {
  const F = e.fields;
  let { y, M, d, h, m, s } = w;
  const yearOk = (yy: number) => F.year.star || F.year.values.includes(yy);
  const limit = w.y + maxYears;
  for (let guard = 0; guard < 100000 && y <= limit; guard++) {
    if (!yearOk(y)) {
      y++;
      M = 1;
      d = 1;
      h = m = s = 0;
      continue;
    }
    const nm = nextIn(F.month.values, M);
    if (nm === undefined) {
      y++;
      M = 1;
      d = 1;
      h = m = s = 0;
      continue;
    }
    if (nm !== M) {
      M = nm;
      d = 1;
      h = m = s = 0;
    }
    if (d > daysInMonth(y, M) || !dayMatches(e, y, M, d)) {
      d++;
      h = m = s = 0;
      if (d > daysInMonth(y, M)) {
        M++;
        d = 1;
        if (M > 12) {
          M = 1;
          y++;
        }
      }
      continue;
    }
    const nh = nextIn(F.hour.values, h);
    if (nh === undefined) {
      d++;
      h = m = s = 0;
      if (d > daysInMonth(y, M)) {
        M++;
        d = 1;
        if (M > 12) {
          M = 1;
          y++;
        }
      }
      continue;
    }
    if (nh !== h) {
      h = nh;
      m = s = 0;
    }
    const nmin = nextIn(F.minute.values, m);
    if (nmin === undefined) {
      h++;
      m = s = 0;
      if (h > 23) {
        h = 0;
        d++;
        if (d > daysInMonth(y, M)) {
          M++;
          d = 1;
          if (M > 12) {
            M = 1;
            y++;
          }
        }
      }
      continue;
    }
    if (nmin !== m) {
      m = nmin;
      s = 0;
    }
    const ns = nextIn(F.second.values, s);
    if (ns === undefined) {
      m++;
      s = 0;
      if (m > 59) {
        m = 0;
        h++;
        if (h > 23) {
          h = 0;
          d++;
          if (d > daysInMonth(y, M)) {
            M++;
            d = 1;
            if (M > 12) {
              M = 1;
              y++;
            }
          }
        }
      }
      continue;
    }
    return { y, M, d, h, m, s: ns };
  }
  return null;
}

function addSecond(w: Wall): Wall {
  const t = new Date(Date.UTC(w.y, w.M - 1, w.d, w.h, w.m, w.s + 1));
  return { y: t.getUTCFullYear(), M: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), m: t.getUTCMinutes(), s: t.getUTCSeconds() };
}

export interface Run {
  ms: number;
  wall: Wall;
  gap?: boolean;
  overlap?: boolean;
}

/** The next `count` runs strictly after `fromMs`, in time zone `tz`. */
export function nextRuns(e: CronExpr, fromMs: number, count: number, tz: string, maxYears = 30): Run[] {
  if (e.reboot) return [];
  const out: Run[] = [];
  let w = addSecond(instantToWall(fromMs, tz));
  const startYear = w.y;
  while (out.length < count) {
    const next = nextWall(e, w, maxYears - (w.y - startYear));
    if (!next) break;
    const r = wallToInstant(next, tz);
    if (r.ms > fromMs && (!out.length || r.ms > out[out.length - 1].ms)) out.push({ ms: r.ms, wall: next, gap: r.gap, overlap: r.overlap });
    w = addSecond(next);
  }
  return out;
}

/** Number of matching days in a calendar year (for facts on variant pages). */
export function matchingDays(e: CronExpr, year: number): number {
  let n = 0;
  for (let M = 1; M <= 12; M++) {
    if (!e.fields.month.values.includes(M)) continue;
    for (let d = 1; d <= daysInMonth(year, M); d++) if (dayMatches(e, year, M, d)) n++;
  }
  return n;
}

/** Runs within one matching day (seconds × minutes × hours). */
export function runsPerDay(e: CronExpr): number {
  return e.fields.second.values.length * e.fields.minute.values.length * e.fields.hour.values.length;
}
