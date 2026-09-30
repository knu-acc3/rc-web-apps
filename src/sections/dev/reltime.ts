import { INTL_LOCALE, type Locale } from "@/i18n/config";

const DAY = 24 * 3600;
/** [unit, seconds per unit, use this unit from this many seconds] — thresholds avoid "2 years" for 1.6 years */
const UNITS: [Intl.RelativeTimeFormatUnit, number, number][] = [
  ["year", 365.25 * DAY, 2 * 365.25 * DAY],
  ["month", 30.44 * DAY, 45 * DAY],
  ["day", DAY, 36 * 3600],
  ["hour", 3600, 90 * 60],
  ["minute", 60, 90],
  ["second", 1, 0],
];

/** "21 месяц назад" / "через 5 минут" — Intl handles Russian cases and plurals. */
export function relTime(locale: Locale, diffSec: number): string {
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], { numeric: "auto" });
  const abs = Math.abs(diffSec);
  for (const [unit, size, from] of UNITS) if (abs >= from) return rtf.format(Math.round(diffSec / size), unit);
  return rtf.format(0, "second");
}
