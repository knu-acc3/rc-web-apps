"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Field, Input } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { WEEKDAYS } from "@/tools/time/calendar/lib/dates";
import { formatDuration, parseClock, shiftMinutes } from "./lib/engine";
import { BigResult } from "./ui/kit";

interface Row {
  start: string;
  end: string;
  brk: string;
}

const T = {
  ru: {
    day: "День",
    start: "Начало",
    end: "Конец",
    brk: "Перерыв, мин",
    hours: "Часы",
    total: "Отработано за неделю",
    decimal: (h: string) => `${h} ч в десятичном виде`,
    rate: "Ставка в час (необязательно)",
    pay: "К оплате",
    night: "смена через полночь",
    off: "выходной",
    hint: "Пустые поля — выходной. Если конец раньше начала, смена считается до следующего дня.",
  },
  en: {
    day: "Day",
    start: "Start",
    end: "End",
    brk: "Break, min",
    hours: "Hours",
    total: "Worked this week",
    decimal: (h: string) => `${h} h as a decimal`,
    rate: "Hourly rate (optional)",
    pay: "Pay",
    night: "overnight shift",
    off: "day off",
    hint: "Leave a day empty for a day off. An end before the start means the shift ends the next day.",
  },
} as const;

const DEFAULT: Row[] = [0, 1, 2, 3, 4, 5, 6].map((i) => (i < 5 ? { start: "09:00", end: "18:00", brk: "60" } : { start: "", end: "", brk: "" }));

export default function WorkHours({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [rows, setRows] = useState<Row[]>(DEFAULT);
  const [rate, setRate] = useState("");
  const days = locale === "ru" ? WEEKDAYS.ruShort : WEEKDAYS.enShort;

  const mins = rows.map((r) => {
    const a = parseClock(r.start);
    const b = parseClock(r.end);
    if (a === null || b === null) return null;
    return { m: shiftMinutes(a, b, Number(r.brk) || 0), night: b <= a };
  });
  const total = mins.reduce((s, x) => s + (x?.m ?? 0), 0);
  const rateNum = parseNumber(rate);
  const set = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <Panel className="min-w-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 text-[0.8125rem] text-fg-2">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-medium sm:pl-5">
                {t.day}
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                {t.start}
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                {t.end}
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                {t.brk}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium sm:pr-5">
                {t.hours}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <th scope="row" className="px-3 py-1.5 font-medium text-fg sm:pl-5">
                  {days[i]}
                </th>
                <td className="px-2 py-1.5">
                  <Input aria-label={`${days[i]}: ${t.start}`} type="time" className="w-auto min-w-24" value={r.start} onChange={(e) => set(i, { start: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <Input aria-label={`${days[i]}: ${t.end}`} type="time" className="w-auto min-w-24" value={r.end} onChange={(e) => set(i, { end: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <NumberInput aria-label={`${days[i]}: ${t.brk}`} locale={locale} value={r.brk.trim() === "" ? null : Number(r.brk)} onChange={(v) => set(i, { brk: v === null ? "" : String(v) })} min={0} max={999} step={5} className="w-32" />
                </td>
                <td className="tabular px-3 py-1.5 text-right text-fg sm:pr-5">
                  {mins[i] ? (
                    <>
                      {formatDuration(mins[i]!.m * 60, false)}
                      {mins[i]!.night && <span className="block text-[0.6875rem] text-fg-3">{t.night}</span>}
                    </>
                  ) : (
                    <span className="text-fg-3">{t.off}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
        <Panel className="flex flex-col gap-5 p-5 sm:p-6">
          <BigResult
            caption={t.total}
            value={formatDuration(total * 60, false)}
            sub={`${t.decimal(formatNumber(locale, total / 60, { maximumFractionDigits: 2 }))}${rateNum ? ` · ${t.pay}: ${formatNumber(locale, (total / 60) * rateNum, { maximumFractionDigits: 2 })}` : ""}`}
          />
          <Field label={t.rate} htmlFor={`${id}-r`} className="mx-auto w-full max-w-60">
            <NumberInput id={`${id}-r`} locale={locale} value={rateNum} onChange={(v) => setRate(v === null ? "" : String(v))} min={0} max={1e9} decimals={2} stepper={false} />
          </Field>
        </Panel>
        <p className="px-1 text-[0.8125rem] text-fg-3">{t.hint}</p>
      </div>
    </div>
  );
}
