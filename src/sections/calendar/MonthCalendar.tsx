"use client";

import Link from "@/ui/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import { buttonClass } from "@/ui/button";
import { useStoredJson } from "@/sections/time/lib/storage";
import { useNow } from "@/sections/time/lib/use-now";
import { CalendarControls, Legend } from "./CalendarControls";
import { MonthGrid } from "./MonthGrid";
import { fmtDate, localYmd, monthName } from "./lib/dates";
import { holidayMarker, useHolidayChoice } from "./lib/marks";
import { productionYear } from "./lib/holidays";

export interface MonthCalendarProps {
  locale: Locale;
  year: number;
  month: number;
  prev?: string[] | null;
  next?: string[] | null;
}

const T = {
  ru: { prev: "Предыдущий месяц", next: "Следующий месяц", none: "Праздников в этом месяце нет" },
  en: { prev: "Previous month", next: "Next month", none: "No public holidays this month" },
} as const;
const isBool = (v: unknown): v is boolean => typeof v === "boolean";

export default function MonthCalendar({ locale, year, month, prev, next }: MonthCalendarProps) {
  const t = T[locale];
  const now = useNow();
  const today = now !== null ? localYmd(new Date(now)) : null;
  const [choice, setChoice] = useHolidayChoice(locale);
  const [weeks, setWeeks] = useStoredJson<boolean>("calendar:weeks:v1", false, isBool);
  const holidays = choice === "none" ? [] : productionYear(choice, year).holidays.filter((h) => h.ymd.m === month);

  const link = (path: string[] | null | undefined, label: string, icon: React.ReactNode) =>
    path ? (
      <Link href={href(locale, path)} className={buttonClass("ghost", "icon")} aria-label={label} title={label}>
        {icon}
      </Link>
    ) : (
      <span className="size-10" />
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-3">
        {link(prev, t.prev, <ChevronLeft aria-hidden />)}
        <span className="min-w-48 text-center text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {monthName(locale, month)} {year}
        </span>
        {link(next, t.next, <ChevronRight aria-hidden />)}
      </div>
      <CalendarControls locale={locale} choice={choice} onChoice={setChoice} weeks={weeks} onWeeks={setWeeks} />
      <div className="rounded-[12px] border border-line bg-surface p-3 sm:p-5 print:border-0 print:p-0">
        <MonthGrid locale={locale} year={year} month={month} mark={holidayMarker(choice, locale)} today={today} weekNumbers={weeks} size="lg" showTitle={false} />
      </div>
      <Legend locale={locale} choice={choice} />
      {choice !== "none" && (
        <ul className="text-[15px] text-fg-2">
          {holidays.length === 0 && <li className="text-fg-3">{t.none}</li>}
          {holidays.map((h) => (
            <li key={`${h.key}${h.ymd.d}`}>
              <span className="tabular font-medium text-fg">{fmtDate(locale, h.ymd, false)}</span> — {h.name[locale]}
              {h.expected ? (locale === "ru" ? " (ожидаемая дата)" : " (expected date)") : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
