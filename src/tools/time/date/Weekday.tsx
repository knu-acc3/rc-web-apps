"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { cap, dayOfYear, daysInYear, fmtDate, isoWeek, isValidYmd, parseYmd, WEEKDAYS, type Ymd } from "@/tools/time/calendar/lib/dates";
import { weekdayOf } from "./lib/engine";
import { BigResult, useToday } from "./ui/kit";

const T = {
  ru: {
    date: "Дата",
    today: "сегодня, если пусто",
    info: (d: number, n: number, w: number) => `${d}-й день года из ${n}, неделя ${w}`,
    other: "Этот же день в другие годы",
  },
  en: {
    date: "Date",
    today: "today if empty",
    info: (d: number, n: number, w: number) => `day ${d} of ${n}, week ${w}`,
    other: "The same date in other years",
  },
} as const;

export default function Weekday({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const today = useToday();
  const [text, setText] = useState("");
  const x = parseYmd(text) ?? today;
  const names = locale === "ru" ? WEEKDAYS.ru : WEEKDAYS.en;
  const years: Ymd[] = x ? [-3, -2, -1, 1, 2, 3, 4, 5].map((k) => ({ y: x.y + k, m: x.m, d: x.d })).filter(isValidYmd) : [];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <Field label={t.date} htmlFor={`${id}-d`} hint={!text ? t.today : undefined} className="sm:max-w-xs">
          <Input id={`${id}-d`} type="date" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="min-w-0 rounded-[1rem] bg-surface-2 px-4 py-6 sm:py-8">
          <BigResult
            caption={x ? fmtDate(locale, x) : " "}
            value={x ? cap(names[weekdayOf(x) - 1]) : "—"}
            sub={x ? t.info(dayOfYear(x), daysInYear(x.y), isoWeek(x).week) : " "}
          />
        </div>
      </Panel>
      {years.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-fg">{t.other}</h2>
          <ul className="grid gap-x-6 gap-y-1 text-[0.9375rem] text-fg-2 sm:grid-cols-2">
            {years.map((y) => (
              <li key={y.y}>
                <span className="tabular text-fg">{fmtDate(locale, y)}</span> — {names[weekdayOf(y) - 1]}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
