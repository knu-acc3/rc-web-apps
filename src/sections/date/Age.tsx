"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { daysInMonth, fmtDate, isValidYmd, MONTHS, parseYmd, WEEKDAYS, ymdStr, type Ymd } from "@/sections/calendar/lib/dates";
import { age, weekdayOf } from "./lib/engine";
import { BigResult, qty, useToday, ymdText } from "./ui/kit";

export interface AgeProps {
  locale: Locale;
  birthYear?: number;
}

const T = {
  ru: {
    birth: "Дата рождения",
    day: "День",
    month: "Месяц",
    year: "Год",
    on: "Возраст на дату",
    onHint: "по умолчанию — сегодня",
    pick: "Выберите день, месяц и год рождения",
    future: "Дата рождения позже выбранной даты",
    exact: "Точный возраст",
    daysLived: "Прожито дней",
    weeks: "Недель",
    months: "Месяцев",
    next: "Следующий день рождения",
    in: (d: string) => `через ${d}`,
    turns: (n: string) => `исполнится ${n}`,
    bornOn: "День недели рождения",
    happy: "Сегодня день рождения!",
    yearOnly: (a: number, b: number) => `${a} или ${b}: зависит от того, был ли уже день рождения`,
    feb29: "Родившимся 29 февраля в невисокосные годы возраст прибавляется 28 февраля.",
    dash: "—",
  },
  en: {
    birth: "Date of birth",
    day: "Day",
    month: "Month",
    year: "Year",
    on: "Age on date",
    onHint: "defaults to today",
    pick: "Choose the day, month and year of birth",
    future: "The birth date is after the chosen date",
    exact: "Exact age",
    daysLived: "Days lived",
    weeks: "Weeks",
    months: "Months",
    next: "Next birthday",
    in: (d: string) => `in ${d}`,
    turns: (n: string) => `turns ${n}`,
    bornOn: "Born on a",
    happy: "Happy birthday — it's today!",
    yearOnly: (a: number, b: number) => `${a} or ${b}, depending on whether the birthday has passed`,
    feb29: "For people born on February 29, the age increases on February 28 in common years.",
    dash: "—",
  },
} as const;

export default function Age({ locale, birthYear }: AgeProps) {
  const t = T[locale];
  const id = useId();
  const today = useToday();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(birthYear ? String(birthYear) : "");
  const [onText, setOnText] = useState("");
  const on: Ymd | null = parseYmd(onText) ?? today;

  const y = /^\d{4}$/.test(year) ? Number(year) : null;
  const birth: Ymd | null = y && day && month ? { y, m: Number(month), d: Number(day) } : null;
  const valid = birth && isValidYmd(birth) ? birth : null;
  const a = valid && on ? age(valid, on) : null;
  const maxDay = y && month ? daysInMonth(y, Number(month)) : 31;

  let main: React.ReactNode = t.dash;
  let sub: React.ReactNode = t.pick;
  if (a) {
    main = qty(locale, a.years, "y");
    sub = a.isBirthday ? t.happy : `${t.exact}: ${ymdText(locale, a.years, a.months, a.days)}`;
  } else if (valid && on) {
    sub = t.future;
  } else if (y && on && !valid) {
    const after = on.y - y;
    if (after >= 1) {
      main = `${after - 1}–${qty(locale, after, "y")}`;
      sub = t.yearOnly(after - 1, after);
    }
  }

  const rows: [string, string][] = a
    ? [
        [t.daysLived, formatNumber(locale, a.totalDays)],
        [t.weeks, formatNumber(locale, a.totalWeeks)],
        [t.months, formatNumber(locale, a.totalMonths)],
        [t.next, `${fmtDate(locale, a.next)} · ${a.daysToNext ? t.in(qty(locale, a.daysToNext, "d")) + ", " : ""}${t.turns(qty(locale, a.nextAge, "y"))}`],
        [t.bornOn, (locale === "ru" ? WEEKDAYS.ru : WEEKDAYS.en)[weekdayOf(valid!) - 1]],
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg-2">{t.birth}</legend>
          <div className="grid grid-cols-[5rem_minmax(0,1fr)_6rem] gap-2 sm:max-w-md">
            <Select aria-label={t.day} value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="">{t.day}</option>
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
            <Select aria-label={t.month} value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">{t.month}</option>
              {(locale === "ru" ? MONTHS.ru : MONTHS.en).map((name, i) => (
                <option key={i} value={i + 1}>
                  {locale === "ru" ? name.charAt(0).toUpperCase() + name.slice(1) : name}
                </option>
              ))}
            </Select>
            <Input aria-label={t.year} inputMode="numeric" placeholder={t.year} maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </div>
        </fieldset>
        <div className="mt-6 border-t border-line pt-6">
          <BigResult value={main} sub={sub} />
        </div>
        {valid && valid.m === 2 && valid.d === 29 && <p className="mt-3 text-center text-[0.8125rem] text-fg-3">{t.feb29}</p>}
      </Panel>

      {rows.length > 0 && (
        <dl className="facts">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <Field label={t.on} htmlFor={`${id}-on`} hint={t.onHint} className="sm:max-w-xs">
        <Input id={`${id}-on`} type="date" value={onText} onChange={(e) => setOnText(e.target.value)} placeholder={today ? ymdStr(today) : ""} />
      </Field>
    </div>
  );
}
