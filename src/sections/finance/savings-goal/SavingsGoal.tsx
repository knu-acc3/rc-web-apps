"use client";

import { useId } from "react";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../types";
import { LineChart } from "../../calc/kit/charts";
import { CURRENCIES, CURRENCY_SYMBOL, fmtCompact, fmtMoney, isCurrency, type Currency } from "../../calc/kit/fmt";
import { roundTo } from "../../calc/kit/math";
import { field, toInput } from "../../calc/kit/num";
import { CalcGrid, Disclaimer, Explain, FieldRow, NumField, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { monthlyNeeded, monthsNeeded, savingsPath } from "../engines/growth";
import { CurrencySelect, termText } from "../loan/parts";

const T = {
  ru: {
    mode: "Что посчитать",
    byDate: "Сколько откладывать",
    byAmount: "Сколько копить",
    target: "Цель",
    current: "Уже есть",
    rate: "Доходность, % в год",
    rateHint: "0 — если просто откладываете",
    term: "Срок",
    years: "лет",
    monthsShort: "мес.",
    unit: "Единица срока",
    monthly: "Откладываю в месяц",
    needLabel: "Нужно откладывать в месяц",
    timeLabel: "Цель будет достигнута через",
    subNeed: (term: string, inc: string) => `${term}; проценты добавят ${inc}`,
    subTime: (total: string) => `всего взносов — ${total}`,
    already: "Цель уже достигнута",
    never: "При таком взносе цель не достигается за 100 лет",
    deposits: "Всего взносов",
    interest: "Доход от процентов",
    enter: "Заполните цель и параметры",
    chart: "Накопления",
    savings: "Накоплено",
    targetS: "Цель",
  },
  en: {
    mode: "What to calculate",
    byDate: "Monthly amount",
    byAmount: "Time needed",
    target: "Goal",
    current: "Already saved",
    rate: "Return, % per year",
    rateHint: "0 if you simply put money aside",
    term: "Time frame",
    years: "years",
    monthsShort: "mo",
    unit: "Term unit",
    monthly: "Monthly saving",
    needLabel: "Save each month",
    timeLabel: "You will reach the goal in",
    subNeed: (term: string, inc: string) => `${term}; interest adds ${inc}`,
    subTime: (total: string) => `total deposits — ${total}`,
    already: "Goal already reached",
    never: "At this rate the goal is not reached within 100 years",
    deposits: "Total deposits",
    interest: "Interest earned",
    enter: "Enter the goal and parameters",
    chart: "Savings",
    savings: "Saved",
    targetS: "Goal",
  },
} as const;

const MODES = ["pmt", "time"] as const;
const UNITS = ["y", "m"] as const;

export default function SavingsGoal({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const q = useQueryState(
    { k: "pmt", g: toInput(locale, ru ? 5_000_000 : 50_000), s: toInput(locale, ru ? 500_000 : 5_000), r: toInput(locale, ru ? 12 : 4), t: "3", u: "y", m: toInput(locale, ru ? 100_000 : 1_000), c: defCur },
    { enums: { k: MODES, u: UNITS, c: CURRENCIES } },
  );
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur, 0);
  const mode = q.v.k as (typeof MODES)[number];
  const unit = q.v.u as (typeof UNITS)[number];
  const G = field(locale, q.v.g, { gt: 0 });
  const S = field(locale, q.v.s, { min: 0 });
  const R = field(locale, q.v.r, { gt: -50, max: 100 });
  const N = field(locale, q.v.t, unit === "y" ? { gt: 0, max: 100 } : { min: 1, max: 1200, int: true });
  const M = field(locale, q.v.m, { min: 0 });
  const months = N.value === null ? null : Math.max(1, Math.round(unit === "y" ? N.value * 12 : N.value));
  const base = G.value !== null && S.value !== null && R.value !== null;

  let value = "—";
  let sub: string = t.enter;
  let rows: { label: string; value: string }[] | undefined;
  let path: number[] | null = null;
  if (base && mode === "pmt" && months) {
    const pmt = roundTo(monthlyNeeded(G.value!, S.value!, R.value!, months), 2);
    path = savingsPath(S.value!, R.value!, pmt, months);
    const deposits = pmt * months;
    const interest = Math.max(0, path[path.length - 1] - S.value! - deposits);
    value = pmt === 0 ? t.already : money(pmt);
    sub = t.subNeed(termText(locale, months), money(interest));
    rows = [
      { label: t.deposits, value: money(deposits) },
      { label: t.interest, value: money(interest) },
    ];
  } else if (base && mode === "time" && M.value !== null) {
    const n = monthsNeeded(G.value!, S.value!, R.value!, M.value);
    if (n === null) {
      value = "—";
      sub = t.never;
    } else if (n === 0) {
      value = t.already;
      sub = "";
    } else {
      path = savingsPath(S.value!, R.value!, M.value, n);
      value = termText(locale, n);
      sub = t.subTime(money(M.value * n));
      rows = [
        { label: t.deposits, value: money(M.value * n) },
        { label: t.interest, value: money(Math.max(0, path[path.length - 1] - S.value! - M.value * n)) },
      ];
    }
  }

  const inputs = (
    <>
      <Segmented
        label={t.mode}
        value={mode}
        onChange={(k) => q.set({ k })}
        options={[
          { value: "pmt", label: t.byDate },
          { value: "time", label: t.byAmount },
        ]}
      />
      <NumField id={`${id}-g`} label={t.target} value={q.v.g} onChange={(g) => q.set({ g })} suffix={sym} error={G.message} size="lg" />
      {mode === "pmt" ? (
        <NumField
          id={`${id}-t`}
          label={t.term}
          value={q.v.t}
          onChange={(v) => q.set({ t: v })}
          suffix={unit === "y" ? t.years : t.monthsShort}
          error={N.message}
          size="lg"
          aside={
            <Segmented
              size="sm"
              label={t.unit}
              value={unit}
              onChange={(u) => {
                const nv = N.value;
                q.set({ u, t: nv === null ? q.v.t : toInput(locale, u === "m" ? Math.round(nv * 12) : roundTo(nv / 12, 2)) });
              }}
              options={[
                { value: "y", label: t.years },
                { value: "m", label: t.monthsShort },
              ]}
            />
          }
        />
      ) : (
        <NumField id={`${id}-m`} label={t.monthly} value={q.v.m} onChange={(m) => q.set({ m })} suffix={sym} error={M.message} size="lg" />
      )}
      <FieldRow>
        <NumField id={`${id}-s`} label={t.current} value={q.v.s} onChange={(s) => q.set({ s })} suffix={sym} error={S.message} />
        <NumField id={`${id}-r`} label={t.rate} value={q.v.r} onChange={(r) => q.set({ r })} suffix="%" error={R.message} hint={t.rateHint} />
      </FieldRow>
      <OptionsRow>
        <CurrencySelect id={`${id}-c`} locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={mode === "pmt" ? t.needLabel : t.timeLabel}
            value={value}
            sub={sub || undefined}
            rows={rows}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {path && path.length > 2 && G.value !== null && (
        <section>
          <SubHeading>{t.chart}</SubHeading>
          <LineChart
            ariaLabel={t.chart}
            x={path.map((_, i) => i)}
            series={[
              { label: t.savings, values: path, tone: "accent", area: true },
              { label: t.targetS, values: path.map(() => G.value!), tone: "ok", dashed: true },
            ]}
            xFormat={(m) => (m % 12 === 0 && m > 0 ? `${m / 12} ${ru ? "г." : "yr"}` : `${m} ${t.monthsShort}`)}
            yFormat={(v) => fmtCompact(locale, v)}
          />
        </section>
      )}
      {ru ? (
        <Explain
          locale={locale}
          formula={["Взнос = (Цель − Уже есть × g^n) × (g − 1) / (g^n − 1)", "g = (1 + доходность)^(1/12), n — число месяцев"]}
          notes={[
            "Взносы вносятся в конце каждого месяца; уже накопленная сумма тоже растёт с той же доходностью.",
            "При нулевой доходности взнос = (Цель − Уже есть) / n.",
            "Срок во втором режиме — первый месяц, в котором накопления достигают цели.",
            "Налоги и инфляция не учитываются: если копите на покупку, заложите рост её цены.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Deposit = (Goal − Saved × g^n) × (g − 1) / (g^n − 1)", "g = (1 + return)^(1/12), n = number of months"]}
          notes={[
            "Deposits are made at the end of each month; money already saved grows at the same return.",
            "With a zero return the deposit is (Goal − Saved) / n.",
            "In the second mode the time is the first month in which your savings reach the goal.",
            "Taxes and inflation are ignored: if you are saving for a purchase, allow for its price rising.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="finance" />
    </Stack>
  );
}
