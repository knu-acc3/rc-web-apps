/**
 * Wall-clock ↔ instant conversion for IANA time zones using Intl only.
 * `wallToInstant` resolves DST gaps (non-existent local times) to the first instant
 * after the gap and DST overlaps (repeated local times) to the first occurrence.
 */

export interface Wall {
  y: number;
  M: number; // 1–12
  d: number;
  h: number;
  m: number;
  s: number;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    fmtCache.set(tz, f);
  }
  return f;
}

export function isValidZone(tz: string): boolean {
  try {
    fmt(tz);
    return true;
  } catch {
    return false;
  }
}

/** Local wall-clock fields of an instant in `tz`. */
export function instantToWall(ms: number, tz: string): Wall {
  const parts = fmt(tz).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), M: get("month"), d: get("day"), h: get("hour") % 24, m: get("minute"), s: get("second") };
}

const wallMs = (w: Wall) => Date.UTC(w.y, w.M - 1, w.d, w.h, w.m, w.s);

/** Offset of `tz` from UTC at instant `ms`, in milliseconds (wall − UTC). */
function offsetAt(ms: number, tz: string): number {
  return wallMs(instantToWall(ms, tz)) - Math.floor(ms / 1000) * 1000;
}

interface Resolved {
  ms: number;
  /** The wall time didn't exist (spring-forward gap) and was moved after the gap. */
  gap?: boolean;
  /** The wall time occurs twice (fall-back overlap); the first occurrence is used. */
  overlap?: boolean;
}

export function wallToInstant(w: Wall, tz: string): Resolved {
  const target = wallMs(w);
  // candidate instants using the offsets around the target
  const o1 = offsetAt(target - 36e5 * 14, tz);
  const o2 = offsetAt(target + 36e5 * 14, tz);
  const cands = [...new Set([target - o1, target - o2, target - offsetAt(target, tz)])].sort((a, b) => a - b);
  const exact = cands.filter((c) => wallMs(instantToWall(c, tz)) === target);
  if (exact.length) return { ms: exact[0], overlap: exact.length > 1 };
  // gap: the wall time doesn't exist — return the transition instant (first valid instant after the gap)
  let lo = target - Math.max(o1, o2) - 36e5 * 3;
  let hi = target - Math.min(o1, o2) + 36e5 * 3;
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2 / 1000) * 1000;
    if (wallMs(instantToWall(mid, tz)) >= target) hi = mid;
    else lo = mid;
  }
  return { ms: hi, gap: true };
}

export function daysInMonth(y: number, M: number): number {
  return new Date(Date.UTC(y, M, 0)).getUTCDate();
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(y: number, M: number, d: number): number {
  return new Date(Date.UTC(y, M - 1, d)).getUTCDay();
}
