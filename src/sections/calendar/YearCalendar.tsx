"use client";

import Link from "@/ui/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { buttonClass } from "@/ui/button";
import { Button } from "@/ui/button";
import { useStoredJson } from "@/sections/time/lib/storage";
import { useNow } from "@/sections/time/lib/use-now";
import { CalendarControls, Legend } from "./ui/CalendarControls";
import { MonthGrid } from "./ui/MonthGrid";
import { localYmd } from "./lib/dates";
import { holidayMarker, useHolidayChoice } from "./lib/marks";

export interface YearCalendarProps {
  locale: Locale;
  year: number;
  /** /calendar: show the visitor's current year once hydrated. */
  follow?: boolean;
  prev?: string[] | null;
  next?: string[] | null;
}

const T = {
  ru: { prev: "Предыдущий год", next: "Следующий год" },
  en: { prev: "Previous year", next: "Next year" },
} as const;

const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function YearCalendar({ locale, year, follow = false, prev, next }: YearCalendarProps) {
  const t = T[locale];
  const now = useNow();
  const today = now !== null ? localYmd(new Date(now)) : null;
  const [chosen, setChosen] = useState<number | null>(null);
  const [choice, setChoice] = useHolidayChoice(locale);
  const [weeks, setWeeks] = useStoredJson<boolean>("calendar:weeks:v1", false, isBool);
  const y = chosen ?? (follow && today ? today.y : year);
  const mark = holidayMarker(choice, locale);

  const nav = (dir: -1 | 1) => {
    const target = dir < 0 ? prev : next;
    const label = dir < 0 ? t.prev : t.next;
    const icon = dir < 0 ? <ChevronLeft aria-hidden /> : <ChevronRight aria-hidden />;
    if (follow)
      return (
        <Button variant="ghost" size="icon" aria-label={label} title={label} onClick={() => setChosen(y + dir)}>
          {icon}
        </Button>
      );
    if (!target) return <span className="size-10" />;
    return (
      <Link href={href(locale, target)} className={buttonClass("ghost", "icon")} aria-label={label} title={label}>
        {icon}
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-3">
        {nav(-1)}
        <span className="tabular min-w-24 text-center text-3xl font-bold tracking-tight text-fg sm:text-4xl">{y}</span>
        {nav(1)}
      </div>
      <CalendarControls locale={locale} choice={choice} onChoice={setChoice} weeks={weeks} onWeeks={setWeeks} />
      <div className="grid gap-x-6 gap-y-5 rounded-[0.75rem] border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-3 print:border-0 print:p-0">
        {MONTHS.map((m) => (
          <MonthGrid key={m} locale={locale} year={y} month={m} mark={mark} today={today} weekNumbers={weeks} />
        ))}
      </div>
      <Legend locale={locale} choice={choice} />
    </div>
  );
}
