"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Input } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { diffDays, fmtDate, isoWeek, parseYmd, WEEKDAYS } from "@/tools/time/calendar/lib/dates";
import { useHolidayChoice } from "@/tools/time/calendar/lib/marks";
import { addPeriod, weekdayOf, type AddUnit } from "./lib/engine";
import { BigResult, CountryChoice, qty, useToday } from "./ui/kit";

export interface AddDaysProps {
  locale: Locale;
  days?: number;
}

const T = {
  ru: {
    from: "Начальная дата",
    today: "сегодня, если пусто",
    op: "Действие",
    add: "Прибавить",
    sub: "Отнять",
    amount: "Сколько",
    unit: "Единица",
    units: { days: "дней", weeks: "недель", months: "месяцев", years: "лет", workdays: "рабочих дней" },
    result: "Получится",
    week: (w: number) => `неделя ${w}`,
    calDays: (s: string) => `${s} календарных`,
    note: "Рабочие дни: Россия — праздники по закону и переносы по постановлениям 2024–2026 гг.; Казахстан — праздники по закону без постановлений о переносах.",
  },
  en: {
    from: "Start date",
    today: "today if empty",
    op: "Operation",
    add: "Add",
    sub: "Subtract",
    amount: "Amount",
    unit: "Unit",
    units: { days: "days", weeks: "weeks", months: "months", years: "years", workdays: "working days" },
    result: "Result",
    week: (w: number) => `week ${w}`,
    calDays: (s: string) => `${s} calendar`,
    note: "Working days: Russia — statutory holidays plus government transfers for 2024–2026; Kazakhstan — statutory holidays without transfer decrees.",
  },
} as const;

export default function AddDays({ locale, days = 30 }: AddDaysProps) {
  const t = T[locale];
  const id = useId();
  const today = useToday();
  const [fromText, setFrom] = useState("");
  const [op, setOp] = useState<"add" | "sub">("add");
  const [amount, setAmount] = useState(String(days));
  const [unit, setUnit] = useState<AddUnit>("days");
  const [choice, setChoice] = useHolidayChoice(locale);
  const from = parseYmd(fromText) ?? today;
  const n = /^\d{1,5}$/.test(amount) ? Number(amount) : null;
  const res = from && n !== null ? addPeriod(from, op === "add" ? n : -n, unit, choice === "none" ? null : choice) : null;
  const span = res && from ? diffDays(from, res) : 0;

  return (
    <Panel className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
      <div className="flex min-w-0 flex-col gap-4">
        <Field label={t.from} htmlFor={`${id}-a`} hint={!fromText ? t.today : undefined} className="sm:max-w-xs">
          <Input id={`${id}-a`} type="date" value={fromText} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-end gap-3">
          <Segmented
            label={t.op}
            value={op}
            onChange={setOp}
            options={[
              { value: "add", label: t.add },
              { value: "sub", label: t.sub },
            ]}
          />
          <NumberInput id={`${id}-n`} aria-label={t.amount} locale={locale} value={n} onChange={(v) => setAmount(v === null ? "" : String(v))} min={0} max={99999} className="w-40" />
        </div>
        <Segmented label={t.unit} value={unit} onChange={setUnit} options={(Object.keys(t.units) as AddUnit[]).map((u) => ({ value: u, label: t.units[u] }))} />
        {unit === "workdays" && (
          <div className="flex flex-col gap-2">
            <CountryChoice locale={locale} value={choice} onChange={setChoice} />
            <p className="text-[0.8125rem] text-fg-3">{t.note}</p>
          </div>
        )}
      </div>
      <div className="min-w-0 rounded-[1rem] bg-surface-2 px-4 py-6 sm:py-8">
        <BigResult
          caption={t.result}
          value={res ? fmtDate(locale, res) : "—"}
          sub={
            res
              ? `${(locale === "ru" ? WEEKDAYS.ru : WEEKDAYS.en)[weekdayOf(res) - 1]}, ${t.week(isoWeek(res).week)}${unit !== "days" ? ` · ${t.calDays(qty(locale, Math.abs(span), "d"))}` : ""}`
              : " "
          }
        />
      </div>
    </Panel>
  );
}
