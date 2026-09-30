"use client";

import { useEffect, useId, useState } from "react";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Switch } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { countWeekdays, dayToDate, isoToDay, randomDate, type RandomDate } from "./lib/dates";

export interface DateGenProps {
  locale: Locale;
  from?: string;
  to?: string;
}

const T = {
  ru: {
    from: "С",
    to: "По",
    count: "Сколько дат",
    weekdays: "Только будни (пн–пт)",
    time: "Со временем",
    sorted: "По порядку",
    generate: "Случайная дата",
    generateMany: "Случайные даты",
    result: "Результат",
    idle: "Выберите диапазон и нажмите кнопку",
    invalid: "Укажите обе даты; вторая не раньше первой",
    noWeekdays: "В этом диапазоне нет будних дней",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    from: "From",
    to: "To",
    count: "How many dates",
    weekdays: "Weekdays only (Mon–Fri)",
    time: "Include time",
    sorted: "In order",
    generate: "Random date",
    generateMany: "Random dates",
    result: "Result",
    idle: "Choose a range and press the button",
    invalid: "Enter both dates; the second must not be earlier",
    noWeekdays: "There are no weekdays in this range",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const pad = (n: number) => String(n).padStart(2, "0");

export default function DateGen({ locale, from: from0 = "", to: to0 = "" }: DateGenProps) {
  const t = T[locale];
  const id = useId();
  const [from, setFrom] = useState(from0);
  const [to, setTo] = useState(to0);
  const [n, setN] = useState(1);
  const [weekdays, setWeekdays] = useState(false);
  const [withTime, setWithTime] = useState(false);
  const [sorted, setSorted] = useState(true);
  const [dates, setDates] = useState<RandomDate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default range = the current calendar year (the clock is read only in the browser).
  useEffect(() => {
    if (from0 || to0) return;
    const y = new Date().getFullYear();
    /* eslint-disable react-hooks/set-state-in-effect -- the current year is only known after mount */
    setFrom(`${y}-01-01`);
    setTo(`${y}-12-31`);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [from0, to0]);

  const a = isoToDay(from);
  const b = isoToDay(to);
  const valid = a !== null && b !== null && b >= a;

  const fmtDate = new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "full", timeZone: "UTC" });
  const format = (d: RandomDate) => {
    const s = fmtDate.format(dayToDate(d.day));
    return d.minute >= 0 ? `${s}, ${pad(Math.floor(d.minute / 60))}:${pad(d.minute % 60)}` : s;
  };

  function generate() {
    if (!valid) return setError(t.invalid);
    if (weekdays && countWeekdays(a, b) === 0) return setError(t.noWeekdays);
    setError(null);
    const r = Array.from({ length: n }, () => randomDate(a, b, weekdays, withTime));
    if (sorted) r.sort((x, y) => x.day - y.day || x.minute - y.minute);
    setDates(r);
  }

  const text = dates ? dates.map(format).join("\n") : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.from} htmlFor={`${id}-a`}>
            <Input id={`${id}-a`} type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-invalid={!!from && a === null} />
          </Field>
          <Field label={t.to} htmlFor={`${id}-b`}>
            <Input id={`${id}-b`} type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={!!to && (b === null || (a !== null && b < a))} />
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Field label={t.count} htmlFor={`${id}-n`} className="w-28">
            <Select id={`${id}-n`} value={n} onChange={(e) => setN(Number(e.target.value))} size="sm">
              {[1, 2, 3, 5, 10, 20, 50].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Switch label={t.weekdays} checked={weekdays} onChange={(e) => setWeekdays(e.target.checked)} className="pb-1.5" />
          <Switch label={t.time} checked={withTime} onChange={(e) => setWithTime(e.target.checked)} className="pb-1.5" />
          {n > 1 && <Switch label={t.sorted} checked={sorted} onChange={(e) => setSorted(e.target.checked)} className="pb-1.5" />}
        </div>
        <Button variant="primary" size="lg" onClick={generate} disabled={!from || !to} className="w-full sm:w-auto sm:self-start sm:min-w-56">
          {n > 1 ? t.generateMany : t.generate}
        </Button>
        {error && (
          <p className="text-sm text-err" role="alert">
            {error}
          </p>
        )}
      </Panel>

      <Panel>
        <PanelHeader title={t.result} actions={dates && <CopyButton value={text} label={t.copy} copiedLabel={t.copied} variant="ghost" />} />
        <div className="px-4 py-4">
          {!dates && <p className="text-sm text-fg-3">{t.idle}</p>}
          <div aria-live="polite">
            {dates &&
              (dates.length === 1 ? (
                <p className="text-center text-2xl font-semibold text-balance first-letter:uppercase text-fg sm:text-3xl">{format(dates[0])}</p>
              ) : (
                <ol className="flex flex-col gap-1 text-[17px] text-fg">
                  {dates.map((d, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="tabular w-6 shrink-0 text-right text-sm leading-7 text-fg-3">{i + 1}.</span>
                      <span className="first-letter:uppercase">{format(d)}</span>
                    </li>
                  ))}
                </ol>
              ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
