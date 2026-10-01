"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Panel } from "@/ui/panel";
import { useNow } from "@/sections/time/lib/use-now";
import { addDays, fmtDate, isoWeek, isoWeekMonday, isoWeeksInYear, localYmd, parseYmd, type Ymd } from "./lib/dates";

const T = {
  ru: { now: "Сейчас идёт неделя", of: (y: number, n: number) => `из ${n} недель ${y} года`, date: "Номер недели для даты", result: "неделя", range: "Понедельник — воскресенье" },
  en: { now: "Current week", of: (y: number, n: number) => `of ${n} weeks in ${y}`, date: "Week number of a date", result: "week", range: "Monday to Sunday" },
} as const;

function range(locale: Locale, w: { year: number; week: number }): string {
  const mon = isoWeekMonday(w.year, w.week);
  const sun = addDays(mon, 6);
  return `${fmtDate(locale, mon, mon.y !== sun.y)} — ${fmtDate(locale, sun)}`;
}

export default function WeekNumber({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const now = useNow();
  const today: Ymd | null = now !== null ? localYmd(new Date(now)) : null;
  const cur = today ? isoWeek(today) : null;
  const [text, setText] = useState("");
  const picked = parseYmd(text);
  const pw = picked ? isoWeek(picked) : null;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center sm:py-10">
        <p className="text-sm font-medium text-fg-3">{t.now}</p>
        <p className="tabular text-[5.5rem] leading-none font-bold tracking-tight text-fg sm:text-[7.5rem]">{cur ? cur.week : "—"}</p>
        <p className="min-h-7 text-lg text-fg-2">{cur ? range(locale, cur) : " "}</p>
        <p className="min-h-6 text-[0.9375rem] text-fg-3">{cur ? t.of(cur.year, isoWeeksInYear(cur.year)) : " "}</p>
      </Panel>
      <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <label htmlFor={`${id}-d`} className="text-[0.9375rem] font-medium text-fg-2">
            {t.date}
          </label>
          <input id={`${id}-d`} type="date" className="control h-10 w-44 max-w-full" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <p className="min-h-7 text-lg text-fg" aria-live="polite">
          {pw && (
            <>
              <span className="font-semibold">
                {t.result} {pw.week}
              </span>
              <span className="text-fg-3">
                {" "}
                ({pw.year}) · {range(locale, pw)}
              </span>
            </>
          )}
        </p>
      </Panel>
    </div>
  );
}
