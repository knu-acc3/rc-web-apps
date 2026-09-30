"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Stat } from "@/ui/panel";
import { useNow } from "@/sections/time/lib/use-now";
import { Legend } from "./CalendarControls";
import { MonthGrid } from "./MonthGrid";
import { localYmd } from "./lib/dates";
import { yearNorm, type HolidayCountry } from "./lib/holidays";
import { holidayMarker } from "./lib/marks";

export interface ProductionCalendarProps {
  locale: Locale;
  country: HolidayCountry;
  year: number;
  /** Links to the other published production calendars (landing page). */
  others?: { country: HolidayCountry; year: number; path: string[] }[];
}

const T = {
  ru: { work: "Рабочих дней", off: "Выходных и праздничных", hours: "Норма часов (40 ч/нед.)", print: "Печать", ru: "Россия", kz: "Казахстан" },
  en: { work: "Working days", off: "Days off and holidays", hours: "Hours norm (40 h/week)", print: "Print", ru: "Russia", kz: "Kazakhstan" },
} as const;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ProductionCalendar({ locale, country, year, others }: ProductionCalendarProps) {
  const t = T[locale];
  const now = useNow();
  const today = now !== null ? localYmd(new Date(now)) : null;
  const norm = yearNorm(country, year);
  const mark = holidayMarker(country, locale);

  return (
    <div className="flex flex-col gap-4">
      {others && others.length > 0 && (
        <nav className="flex flex-wrap items-center gap-2 print:hidden" aria-label={locale === "ru" ? "Другие годы" : "Other years"}>
          {others.map((o) => {
            const active = o.country === country && o.year === year;
            return (
              <Link
                key={`${o.country}${o.year}`}
                href={href(locale, o.path)}
                aria-current={active ? "page" : undefined}
                className={active ? "chip border-accent! text-accent!" : "chip"}
              >
                {t[o.country]} {o.year}
              </Link>
            );
          })}
        </nav>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.work} value={formatNumber(locale, norm.workDays)} />
        <Stat label={t.off} value={formatNumber(locale, norm.offDays)} />
        <Stat label={t.hours} value={formatNumber(locale, norm.hours40)} />
      </div>
      <div className="grid gap-x-6 gap-y-5 rounded-[12px] border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-3 print:border-0 print:p-0">
        {MONTHS.map((m) => (
          <MonthGrid key={m} locale={locale} year={year} month={m} mark={mark} today={today} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Legend locale={locale} choice={country} />
        <Button variant="ghost" size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer aria-hidden />
          {t.print}
        </Button>
      </div>
    </div>
  );
}
