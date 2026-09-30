import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;
const YEAR = 365.25 * DAY;
const UNIVERSE_YEARS = 1.38e10;

const F = {
  ru: { s: ["секунда", "секунды", "секунд"], m: ["минута", "минуты", "минут"], h: ["час", "часа", "часов"], d: ["день", "дня", "дней"], y: ["год", "года", "лет"] },
  en: { s: ["second", "seconds"], m: ["minute", "minutes"], h: ["hour", "hours"], d: ["day", "days"], y: ["year", "years"] },
} as const;

/** Human-readable duration for crack-time estimates, with correct Russian plurals. */
export function humanDuration(seconds: number, locale: Locale): string {
  const ru = locale === "ru";
  if (!Number.isFinite(seconds) || seconds / YEAR > UNIVERSE_YEARS) return ru ? "дольше возраста Вселенной" : "longer than the age of the universe";
  if (seconds < 1) return ru ? "меньше секунды" : "less than a second";
  const f = F[locale];
  const unit = (n: number, forms: readonly string[]) => `${formatNumber(locale, n)} ${plural(locale, n, forms)}`;
  if (seconds < MIN) return unit(Math.round(seconds), f.s);
  if (seconds < HOUR) return unit(Math.round(seconds / MIN), f.m);
  if (seconds < DAY) return unit(Math.round(seconds / HOUR), f.h);
  if (seconds < YEAR) return unit(Math.round(seconds / DAY), f.d);
  const years = seconds / YEAR;
  if (years < 1000) return unit(Math.round(years), f.y);
  if (years < 1e6) return ru ? `${formatNumber(locale, Math.round(years / 1e3))} тыс. лет` : `${formatNumber(locale, Math.round(years / 1e3))} thousand years`;
  if (years < 1e9) return ru ? `${formatNumber(locale, Math.round(years / 1e6))} млн лет` : `${formatNumber(locale, Math.round(years / 1e6))} million years`;
  return ru ? `${formatNumber(locale, Math.round(years / 1e9))} млрд лет` : `${formatNumber(locale, Math.round(years / 1e9))} billion years`;
}
