import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { fmtDate, fmtDateLong, type Ymd } from "@/tools/time/calendar/lib/dates";
import { pad2, zoned, type ZonedParts } from "./tz";

/**
 * Hours and minutes in words: «2 часа», «5 часов 30 минут», "5 hours 30 minutes".
 * `acc` = accusative for «на 1 час 21 минуту», «прибавьте 1 минуту».
 */
export function durationWords(min: number, locale: Locale, acc = false): string {
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = a % 60;
  const parts: string[] = [];
  if (locale === "ru") {
    if (h) parts.push(`${h} ${plural("ru", h, ["час", "часа", "часов"])}`);
    if (m) parts.push(`${m} ${plural("ru", m, [acc ? "минуту" : "минута", "минуты", "минут"])}`);
    return parts.join(" ") || "0 часов";
  }
  if (h) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
  if (m) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
  return parts.join(" ") || "0 hours";
}

/** Signed short difference: "+2 ч", "−7 ч 30 мин", "0 ч". */
export function diffShort(min: number, locale: Locale): string {
  const sign = min < 0 ? "−" : min > 0 ? "+" : "";
  const a = Math.abs(min);
  const h = Math.floor(a / 60);
  const m = a % 60;
  const hs = locale === "ru" ? "ч" : "h";
  const ms = locale === "ru" ? "мин" : "min";
  if (!a) return `0 ${hs}`;
  return `${sign}${h ? `${h} ${hs}` : ""}${h && m ? " " : ""}${m ? `${m} ${ms}` : ""}`;
}

/** Day length «11 ч 51 мин» / "11 h 51 min". */
export function hmWords(min: number, locale: Locale): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return locale === "ru" ? `${h} ч ${m} мин` : `${h} h ${m} min`;
}

export const placeParts = (p: { tz: string | null; offset: number | null }, t: number): ZonedParts => zoned(p.tz ?? p.offset ?? 0, t);

export const hms = (p: { h: number; mi: number; s: number }, sec = true): string => `${pad2(p.h)}:${pad2(p.mi)}${sec ? `:${pad2(p.s)}` : ""}`;

export const ymdOf = (p: ZonedParts): Ymd => ({ y: p.y, m: p.m, d: p.d });
export const longDate = (locale: Locale, p: ZonedParts): string => fmtDateLong(locale, ymdOf(p));
export const shortDate = (locale: Locale, p: ZonedParts): string => fmtDate(locale, ymdOf(p), false);

/** Day relation of `to` compared to `from`: "", "завтра", "вчера". */
export function dayShift(locale: Locale, from: ZonedParts, to: ZonedParts): string {
  const a = Date.UTC(from.y, from.m - 1, from.d);
  const b = Date.UTC(to.y, to.m - 1, to.d);
  if (b > a) return locale === "ru" ? "завтра" : "tomorrow";
  if (b < a) return locale === "ru" ? "вчера" : "yesterday";
  return "";
}
