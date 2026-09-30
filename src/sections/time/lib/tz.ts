/**
 * Time-zone math on top of Intl (IANA tzdata of the running engine).
 * Works on the server (build-time descriptive facts) and in the browser (live clocks).
 * Offsets are minutes EAST of UTC (Almaty = +300, New York in winter = −300).
 */

const fmtCache = new Map<string, Intl.DateTimeFormat>();

/** Zones renamed in recent tzdata that older engines may not know. */
const ALIASES: Record<string, string> = {
  "Europe/Kyiv": "Europe/Kiev",
  "America/Nuuk": "America/Godthab",
  "Pacific/Kanton": "Pacific/Enderbury",
  "Asia/Qostanay": "Asia/Almaty",
  "America/Ciudad_Juarez": "America/Denver",
  "Asia/Yangon": "Asia/Rangoon",
};

function formatter(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (f) return f;
  const make = (zone: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  try {
    f = make(tz);
  } catch {
    f = make(ALIASES[tz] ?? "UTC");
  }
  fmtCache.set(tz, f);
  return f;
}

/** Is the zone known to this engine (or to our alias table)? */
export function isKnownZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return tz in ALIASES;
  }
}

/**
 * Kazakhstan moved to a single zone UTC+5 on 2024-03-01 (tzdata 2024a).
 * Browsers with older tzdata still show UTC+6 for these zones — correct them.
 */
const KZ_UNIFIED = new Set(["Asia/Almaty", "Asia/Qostanay"]);
const KZ_SWITCH = Date.UTC(2024, 1, 29, 18, 0, 0); // 2024-03-01 00:00 local (UTC+6)

const offCache = new Map<string, number>();

/** UTC offset of `tz` at instant `t` (ms), in minutes. */
export function tzOffset(tz: string, t: number): number {
  if (tz === "UTC" || tz === "Etc/UTC") return 0;
  const sec = Math.floor(t / 1000) * 1000;
  const key = `${tz}|${Math.floor(sec / 60000)}`;
  const hit = offCache.get(key);
  if (hit !== undefined) return hit;
  const p: Record<string, number> = {};
  for (const part of formatter(tz).formatToParts(new Date(sec))) if (part.type !== "literal") p[part.type] = Number(part.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
  let off = Math.round((asUtc - sec) / 60000);
  if (KZ_UNIFIED.has(tz) && t >= KZ_SWITCH && off !== 300) off = 300;
  if (offCache.size > 5000) offCache.clear();
  offCache.set(key, off);
  return off;
}

export interface ZonedParts {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
  /** ISO weekday 1 = Mon … 7 = Sun */
  wd: number;
  /** offset in minutes */
  off: number;
}

/** Wall-clock parts of instant `t` in a zone, or at a fixed offset when `tz` is a number (minutes). */
export function zoned(tz: string | number, t: number): ZonedParts {
  const off = typeof tz === "number" ? tz : tzOffset(tz, t);
  const d = new Date(t + off * 60000);
  const wd = d.getUTCDay();
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    s: d.getUTCSeconds(),
    wd: wd === 0 ? 7 : wd,
    off,
  };
}

/** UTC instant of a wall-clock time in a zone (for gaps, the later side is returned). */
export function zonedToUtc(tz: string | number, y: number, m: number, d: number, h = 0, mi = 0): number {
  const local = Date.UTC(y, m - 1, d, h, mi);
  if (typeof tz === "number") return local - tz * 60000;
  let t = local - tzOffset(tz, local) * 60000;
  // Second pass fixes the case where the first guess crossed a transition.
  t = local - tzOffset(tz, t) * 60000;
  return t;
}

export interface Transition {
  /** UTC instant of the change */
  at: number;
  from: number;
  to: number;
}

/** All offset changes of `tz` in [from, to). */
export function transitions(tz: string, from: number, to: number): Transition[] {
  const out: Transition[] = [];
  const step = 2 * 86400000;
  let a = from;
  let offA = tzOffset(tz, a);
  while (a < to) {
    const b = Math.min(a + step, to);
    const offB = tzOffset(tz, b);
    if (offB !== offA) {
      let lo = a;
      let hi = b;
      while (hi - lo > 60000) {
        const mid = Math.floor((lo + hi) / 2 / 60000) * 60000;
        if (tzOffset(tz, mid) === offA) lo = mid;
        else hi = mid;
      }
      out.push({ at: hi, from: offA, to: offB });
    }
    a = b;
    offA = offB;
  }
  return out;
}

/** The next offset change after `t` within ~15 months, or null. */
export function nextTransition(tz: string, t: number): Transition | null {
  return transitions(tz, t, t + 460 * 86400000)[0] ?? null;
}

export interface ZoneYearInfo {
  /** Offset on 15 January and 15 July of the year (minutes). */
  jan: number;
  jul: number;
  /** Standard (smaller in the northern sense: min of both) and daylight offsets; equal when no DST. */
  std: number;
  dst: number;
  hasDst: boolean;
  transitions: Transition[];
}

export function zoneYear(tz: string, year: number): ZoneYearInfo {
  const jan = tzOffset(tz, Date.UTC(year, 0, 15, 12));
  const jul = tzOffset(tz, Date.UTC(year, 6, 15, 12));
  const tr = transitions(tz, Date.UTC(year, 0, 1) - 14 * 3600000, Date.UTC(year + 1, 0, 1) - 14 * 3600000);
  const hasDst = jan !== jul || tr.length > 0;
  return { jan, jul, std: Math.min(jan, jul), dst: Math.max(jan, jul), hasDst, transitions: tr };
}

/* ───────────── formatting ───────────── */

const MINUS = "−";

/** "UTC+5", "UTC+5:30", "UTC−3", "UTC+0" */
export function fmtOffset(min: number, prefix = "UTC"): string {
  const sign = min < 0 ? MINUS : "+";
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `${prefix}${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** "+05:00" style (ISO 8601). */
export function isoOffset(min: number): string {
  const sign = min < 0 ? "-" : "+";
  const a = Math.abs(min);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

/** Slug of an offset page: 0 → "utc", 330 → "utc-plus-5-30", −210 → "utc-minus-3-30". */
export function offsetSlug(min: number): string {
  if (min === 0) return "utc";
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `utc-${min < 0 ? "minus" : "plus"}-${h}${m ? `-${m}` : ""}`;
}

/** Inverse of offsetSlug; null for anything that isn't a valid offset slug. */
export function parseOffsetSlug(slug: string): number | null {
  if (slug === "utc") return 0;
  const m = /^utc-(plus|minus)-(\d{1,2})(?:-(15|30|45))?$/.exec(slug);
  if (!m) return null;
  const h = Number(m[2]);
  const mm = m[3] ? Number(m[3]) : 0;
  if (h === 0 && mm === 0) return null;
  const v = h * 60 + mm;
  if (m[1] === "plus" ? v > 14 * 60 : v > 12 * 60) return null;
  return m[1] === "plus" ? v : -v;
}

/** Difference b − a in minutes as a short human string: "+3 ч", "−7 ч 30 мин", "0". */
export function fmtDiff(min: number, locale: "ru" | "en", signed = true): string {
  if (min === 0) return locale === "ru" ? "0 ч" : "0 h";
  const sign = signed ? (min < 0 ? MINUS : "+") : "";
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = a % 60;
  const hs = locale === "ru" ? "ч" : "h";
  const ms = locale === "ru" ? "мин" : "min";
  return `${sign}${h ? `${h} ${hs}` : ""}${h && m ? " " : ""}${m ? `${m} ${ms}` : ""}`;
}

export const pad2 = (n: number): string => String(n).padStart(2, "0");

/** "14:05" or "14:05:09"; 12-hour when `h12`. */
export function fmtClock(p: { h: number; mi: number; s?: number }, withSeconds = false, h12 = false): string {
  let h = p.h;
  let suffix = "";
  if (h12) {
    suffix = h < 12 ? " AM" : " PM";
    h = h % 12 || 12;
  }
  return `${h12 ? h : pad2(h)}:${pad2(p.mi)}${withSeconds && p.s !== undefined ? `:${pad2(p.s)}` : ""}${suffix}`;
}
