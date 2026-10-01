import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";

const p2 = (n: number) => String(n).padStart(2, "0");

/**
 * Countdown/stopwatch display. Countdowns round UP (a timer shows 00:01 until the
 * very last second is over); `up: true` (stopwatch, overtime) rounds DOWN.
 */
export function clock(ms: number, opts: { up?: boolean; hundredths?: boolean; forceHours?: boolean; padHours?: boolean } = {}): string {
  const total = Math.max(0, ms);
  const sec = opts.up ? Math.floor(total / 1000) : Math.ceil(total / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const base = h > 0 || opts.forceHours ? `${opts.padHours ? p2(h) : h}:${p2(m)}:${p2(s)}` : `${p2(m)}:${p2(s)}`;
  if (!opts.hundredths) return base;
  return `${base}.${p2(Math.floor((total % 1000) / 10))}`;
}

/** Split seconds into h/m/s. */
export function hms(total: number): { h: number; m: number; s: number } {
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

/**
 * Duration in words. `acc` = accusative («таймер на 1 минуту», «на 21 секунду»),
 * otherwise nominative («1 минута», «30 секунд»).
 */
export function durationText(totalSec: number, locale: Locale, acc = false): string {
  const { h, m, s } = hms(totalSec);
  const parts: string[] = [];
  if (locale === "ru") {
    if (h) parts.push(`${h} ${plural("ru", h, ["час", "часа", "часов"])}`);
    if (m) parts.push(`${m} ${plural("ru", m, [acc ? "минуту" : "минута", "минуты", "минут"])}`);
    if (s) parts.push(`${s} ${plural("ru", s, [acc ? "секунду" : "секунда", "секунды", "секунд"])}`);
    return parts.join(" ") || "0 секунд";
  }
  if (h) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
  if (m) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
  if (s) parts.push(`${s} ${s === 1 ? "second" : "seconds"}`);
  return parts.join(" ") || "0 seconds";
}

/** Compact "5 min", "1 h 30 min", "45 s". */
export function durationShort(totalSec: number, locale: Locale): string {
  const { h, m, s } = hms(totalSec);
  const u = locale === "ru" ? { h: "ч", m: "мин", s: "с" } : { h: "h", m: "min", s: "s" };
  return [h ? `${h} ${u.h}` : "", m ? `${m} ${u.m}` : "", s ? `${s} ${u.s}` : ""].filter(Boolean).join(" ") || `0 ${u.s}`;
}

/** Parse a user-typed field ("7", "07", "") to an integer within [0, max]. */
export function clampInt(text: string, max: number): number {
  const n = parseInt(text.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, n));
}

const MAX_SEC = 99 * 3600 + 59 * 60 + 59;

/** Timer length for a link: 300 → "5m", 5400 → "1h30m", 95 → "1m35s". */
export function durationParam(totalSec: number): string {
  const { h, m, s } = hms(totalSec);
  return `${h ? `${h}h` : ""}${m ? `${m}m` : ""}${s || totalSec === 0 ? `${s}s` : ""}`;
}

/** Reads "5m", "1h30m", "90s", "90" (seconds), "10:00" or "1:30:00"; null for anything else or out of range. */
export function parseDurationParam(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  let sec: number | null = null;
  if (/^\d{1,6}$/.test(s)) sec = Number(s);
  else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(s)) {
    const p = s.split(":").map(Number);
    if (p.slice(1).some((x) => x > 59)) return null;
    sec = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
  } else {
    const m = /^(?:(\d{1,2})h)?(?:(\d{1,4})m)?(?:(\d{1,6})s)?$/.exec(s);
    if (m && (m[1] || m[2] || m[3])) sec = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  }
  return sec !== null && sec > 0 && sec <= MAX_SEC ? sec : null;
}
