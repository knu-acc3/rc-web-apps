"use client";

import { Printer } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import type { HolidayChoice } from "../lib/marks";

const T = {
  ru: { holidays: "Праздники", ru: "Россия", kz: "Казахстан", none: "Нет", weeks: "Номера недель", print: "Печать", holiday: "праздник", off: "перенесённый выходной", short: "сокращённый день", workSat: "рабочий выходной" },
  en: { holidays: "Holidays", ru: "Russia", kz: "Kazakhstan", none: "None", weeks: "Week numbers", print: "Print", holiday: "holiday", off: "moved day off", short: "shortened day", workSat: "working weekend day" },
} as const;

/** The one quiet row of calendar options (holidays country, week numbers, print). */
export function CalendarControls({
  locale,
  choice,
  onChoice,
  weeks,
  onWeeks,
}: {
  locale: Locale;
  choice: HolidayChoice;
  onChoice: (c: HolidayChoice) => void;
  weeks?: boolean;
  onWeeks?: (v: boolean) => void;
}) {
  const t = T[locale];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 print:hidden">
      <Segmented
        label={t.holidays}
        size="sm"
        value={choice}
        onChange={onChoice}
        options={[
          { value: "ru", label: t.ru },
          { value: "kz", label: t.kz },
          { value: "none", label: t.none },
        ]}
      />
      {onWeeks && <Switch label={t.weeks} checked={!!weeks} onChange={(e) => onWeeks(e.target.checked)} />}
      <Button variant="ghost" size="sm" onClick={() => window.print()} className="ml-auto">
        <Printer aria-hidden />
        {t.print}
      </Button>
    </div>
  );
}

export function Legend({ locale, choice }: { locale: Locale; choice: HolidayChoice }) {
  if (choice === "none") return null;
  const t = T[locale];
  const items: [string, string][] = [
    ["bg-err-soft", t.holiday],
    ["bg-err-soft/50", t.off],
    ...(choice === "ru" ? ([["bg-warn-soft", t.short]] as [string, string][]) : []),
    ["bg-surface-2", t.workSat],
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-fg-3">
      {items.map(([cls, label]) => (
        <li key={label} className="flex items-center gap-1.5">
          <span className={`inline-block size-3 rounded-[0.1875rem] ring-1 ring-line-strong ${cls}`} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
