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
