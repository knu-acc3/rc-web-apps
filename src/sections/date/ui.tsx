"use client";

import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Segmented } from "@/ui/segmented";
import { localYmd, type Ymd } from "@/sections/calendar/lib/dates";
import type { HolidayChoice } from "@/sections/calendar/lib/marks";
import { useMinute } from "@/sections/time/lib/use-now";

/** Today's local date (client only; null during SSR/hydration). */
export function useToday(): Ymd | null {
  const m = useMinute();
  return m === null ? null : localYmd(new Date(m));
}

const FORMS = {
  y: { ru: ["год", "года", "лет"], en: ["year", "years"] },
  mo: { ru: ["месяц", "месяца", "месяцев"], en: ["month", "months"] },
  w: { ru: ["неделя", "недели", "недель"], en: ["week", "weeks"] },
  d: { ru: ["день", "дня", "дней"], en: ["day", "days"] },
  wd: { ru: ["рабочий день", "рабочих дня", "рабочих дней"], en: ["working day", "working days"] },
  h: { ru: ["час", "часа", "часов"], en: ["hour", "hours"] },
  min: { ru: ["минута", "минуты", "минут"], en: ["minute", "minutes"] },
} as const;
export type UnitKey = keyof typeof FORMS;

/** «5 лет», «1 day» — with thin grouping for big numbers. */
export function qty(locale: Locale, n: number, unit: UnitKey): string {
  const v = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US").format(n);
  return `${v} ${plural(locale, n, FORMS[unit][locale])}`;
}

/** «2 года 3 месяца 5 дней» (zero parts skipped, "0 дней" when all zero). */
export function ymdText(locale: Locale, y: number, m: number, d: number): string {
  const parts = [y ? qty(locale, y, "y") : "", m ? qty(locale, m, "mo") : "", d ? qty(locale, d, "d") : ""].filter(Boolean);
  return parts.join(" ") || qty(locale, 0, "d");
}

const CT = {
  ru: { label: "Праздники", none: "Пн–пт", ru: "Россия", kz: "Казахстан" },
  en: { label: "Holidays", none: "Mon–Fri", ru: "Russia", kz: "Kazakhstan" },
} as const;

/** Business-day calendar choice: plain Mon–Fri, Russia or Kazakhstan. */
export function CountryChoice({ locale, value, onChange }: { locale: Locale; value: HolidayChoice; onChange: (v: HolidayChoice) => void }) {
  const t = CT[locale];
  return (
    <Segmented
      label={t.label}
      size="sm"
      value={value}
      onChange={onChange}
      options={[
        { value: "none", label: t.none },
        { value: "ru", label: t.ru },
        { value: "kz", label: t.kz },
      ]}
    />
  );
}

/** A large result number with a caption — the focal point of date tools. */
export function BigResult({ value, caption, sub }: { value: React.ReactNode; caption?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="text-center" aria-live="polite">
      {caption && <p className="text-sm font-medium text-fg-3">{caption}</p>}
      <p className="tabular mt-1 text-4xl font-bold tracking-tight text-fg sm:text-5xl">{value}</p>
      {sub && <p className="mt-2 text-[0.9375rem] text-fg-2">{sub}</p>}
    </div>
  );
}
