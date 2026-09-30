"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { diffDays, fmtDate, isoWeek, parseYmd, WEEKDAYS } from "@/sections/calendar/lib/dates";
import { useHolidayChoice } from "@/sections/calendar/lib/marks";
import { addPeriod, weekdayOf, type AddUnit } from "./lib/engine";
import { BigResult, CountryChoice, qty, useToday } from "./ui";

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
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_7rem_10rem]">
          <Field label={t.from} htmlFor={`${id}-a`} hint={!fromText ? t.today : undefined}>
            <Input id={`${id}-a`} type="date" value={fromText} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <div className="flex flex-col gap-1.5 sm:mb-6">
            <span className="text-sm font-medium text-fg-2">{t.op}</span>
            <Segmented
              label={t.op}
              value={op}
              onChange={setOp}
              options={[
                { value: "add", label: t.add },
                { value: "sub", label: t.sub },
              ]}
            />
          </div>
          <Field label={t.amount} htmlFor={`${id}-n`} className="sm:mb-6">
            <Input id={`${id}-n`} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 5))} />
          </Field>
          <Field label={t.unit} htmlFor={`${id}-u`} className="sm:mb-6">
            <Select id={`${id}-u`} value={unit} onChange={(e) => setUnit(e.target.value as AddUnit)}>
              {(Object.keys(t.units) as AddUnit[]).map((u) => (
                <option key={u} value={u}>
                  {t.units[u]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-2 border-t border-line pt-6">
          <BigResult
            caption={t.result}
            value={res ? fmtDate(locale, res) : "—"}
            sub={
              res
                ? `${(locale === "ru" ? WEEKDAYS.ru : WEEKDAYS.en)[weekdayOf(res) - 1]}, ${t.week(isoWeek(res).week)}${unit !== "days" ? ` · ${t.calDays(qty(locale, Math.abs(span), "d"))}` : ""}`
                : " "
            }
          />
        </div>
        {unit === "workdays" && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <CountryChoice locale={locale} value={choice} onChange={setChoice} />
            <p className="max-w-xl text-center text-[0.8125rem] text-fg-3">{t.note}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
