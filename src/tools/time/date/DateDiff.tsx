"use client";

import { ArrowLeftRight } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { IconButton } from "@/ui/button";
import { Field, Input, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { parseYmd, ymdStr } from "@/tools/time/calendar/lib/dates";
import { useHolidayChoice } from "@/tools/time/calendar/lib/marks";
import { difference } from "./lib/engine";
import { BigResult, CountryChoice, qty, useToday, ymdText } from "./ui/kit";

const T = {
  ru: {
    from: "Начальная дата",
    to: "Конечная дата",
    today: "сегодня, если пусто",
    swap: "Поменять даты местами",
    incl: "Включая конечную дату",
    pick: "Выберите даты",
    between: "Между датами",
    weeks: "В неделях",
    months: "В месяцах",
    work: "Рабочих дней",
    off: "Выходных и праздников",
    hours: "В часах",
    earlier: "конечная дата раньше начальной",
    and: "и",
  },
  en: {
    from: "Start date",
    to: "End date",
    today: "today if empty",
    swap: "Swap dates",
    incl: "Include the end date",
    pick: "Pick the dates",
    between: "Between the dates",
    weeks: "In weeks",
    months: "In months",
    work: "Working days",
    off: "Weekends and holidays",
    hours: "In hours",
    earlier: "the end date is before the start date",
    and: "and",
  },
} as const;

export default function DateDiff({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const today = useToday();
  const [fromText, setFrom] = useState("");
  const [toText, setTo] = useState("");
  const [incl, setIncl] = useState(false);
  const [choice, setChoice] = useHolidayChoice(locale);
  const from = parseYmd(fromText) ?? today;
  const to = parseYmd(toText);
  const d = from && to ? difference(from, to, incl, choice === "none" ? null : choice) : null;
  const span = d ? Math.abs(d.days) + (incl ? 1 : 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
            <Field label={t.from} htmlFor={`${id}-a`}>
              <Input id={`${id}-a`} type="date" value={fromText} onChange={(e) => setFrom(e.target.value)} placeholder={today ? ymdStr(today) : ""} />
            </Field>
            <IconButton
              label={t.swap}
              variant="tonal"
              className="justify-self-center sm:mb-0"
              onClick={() => {
                const a = fromText || (today ? ymdStr(today) : "");
                setFrom(toText);
                setTo(a);
              }}
              icon={<ArrowLeftRight aria-hidden className="max-sm:rotate-90" />}
            />
            <Field label={t.to} htmlFor={`${id}-b`}>
              <Input id={`${id}-b`} type="date" value={toText} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          {!fromText && (
            <p className="-mt-2 text-[0.8125rem] text-fg-3">
              {t.from}: {t.today}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Switch label={t.incl} checked={incl} onChange={(e) => setIncl(e.target.checked)} />
            <CountryChoice locale={locale} value={choice} onChange={setChoice} />
          </div>
        </div>
        <div className="min-w-0 rounded-[1rem] bg-surface-2 px-4 py-6 sm:py-8">
          <BigResult
            caption={t.between}
            value={d ? qty(locale, span, "d") : "—"}
            sub={d ? `${ymdText(locale, d.years, d.months, d.restDays)}${d.days < 0 ? ` (${t.earlier})` : ""}` : t.pick}
          />
        </div>
      </Panel>
      {d && (
        <dl className="facts">
          <div>
            <dt>{t.weeks}</dt>
            <dd>{d.weekDays ? `${qty(locale, d.weeks, "w")} ${t.and} ${qty(locale, d.weekDays, "d")}` : qty(locale, d.weeks, "w")}</dd>
          </div>
          <div>
            <dt>{t.months}</dt>
            <dd>{d.restDays ? `${qty(locale, d.totalMonths, "mo")} ${t.and} ${qty(locale, d.restDays, "d")}` : qty(locale, d.totalMonths, "mo")}</dd>
          </div>
          <div>
            <dt>{t.work}</dt>
            <dd>{formatNumber(locale, d.workdays)}</dd>
          </div>
          <div>
            <dt>{t.off}</dt>
            <dd>{formatNumber(locale, d.weekends)}</dd>
          </div>
          <div>
            <dt>{t.hours}</dt>
            <dd>{formatNumber(locale, span * 24)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
