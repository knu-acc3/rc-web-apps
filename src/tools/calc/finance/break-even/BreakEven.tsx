"use client";

import { useId } from "react";
import { plural } from "@/i18n/format";
import type { ToolProps } from "../../../types";
import { LineChart } from "../../shared/charts";
import { CURRENCIES, CURRENCY_SYMBOL, fmtCompact, fmtMoney, fmtN, fmtPct, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { Advanced, CalcGrid, Explain, NumSlider, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { breakEven } from "../lib/money";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    fixed: "Постоянные расходы в месяц",
    fixedHint: "Аренда, зарплаты, связь",
    price: "Цена за единицу",
    variable: "Переменные расходы на единицу",
    plan: "Плановый объём продаж",
    planTitle: "Запас прочности",
    label: "Точка безубыточности",
    units: ["единица", "единицы", "единиц"],
    sub: (r: string) => `выручка ${r} в месяц`,
    contribution: "Маржинальный доход с единицы",
    ratio: "Доля маржинального дохода",
    safety: "Запас прочности",
    profitPlan: "Прибыль при плане",
    noBe: "Цена должна быть выше переменных расходов на единицу — иначе каждая продажа увеличивает убыток",
    enter: "Заполните расходы и цену",
    chart: "Выручка и расходы",
    revenue: "Выручка",
    costs: "Расходы",
    qty: "шт.",
  },
  en: {
    fixed: "Fixed costs per month",
    fixedHint: "Rent, salaries, software",
    price: "Price per unit",
    variable: "Variable cost per unit",
    plan: "Planned sales volume",
    planTitle: "Margin of safety",
    label: "Break-even point",
    units: ["unit", "units"],
    sub: (r: string) => `revenue ${r} a month`,
    contribution: "Contribution per unit",
    ratio: "Contribution margin ratio",
    safety: "Margin of safety",
    profitPlan: "Profit at plan",
    noBe: "The price must exceed the variable cost per unit — otherwise every sale adds to the loss",
    enter: "Enter the costs and the price",
    chart: "Revenue and costs",
    revenue: "Revenue",
    costs: "Total costs",
    qty: "units",
  },
} as const;

export default function BreakEven({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const q = useQueryState({ f: toInput(locale, ru ? 1_500_000 : 15_000), p: toInput(locale, ru ? 5_000 : 50), v: toInput(locale, ru ? 2_000 : 20), n: "", c: defCur }, { enums: { c: CURRENCIES } });
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur, 0);
  const F = field(locale, q.v.f, { min: 0 });
  const P = field(locale, q.v.p, { gt: 0 });
  const V = field(locale, q.v.v, { min: 0 });
  const N = field(locale, q.v.n, { min: 0 });
  const be = F.value !== null && P.value !== null && V.value !== null ? breakEven(F.value, V.value, P.value) : null;
  const invalid = F.value !== null && P.value !== null && V.value !== null && !be;
  const plan = N.value;

  const rows = be
    ? [
        { label: t.contribution, value: money(be.contribution) },
        { label: t.ratio, value: fmtPct(locale, be.contributionRatio, 1) },
        ...(plan
          ? [
              { label: t.safety, value: `${fmtN(locale, plan - be.unitsCeil, 0)} ${t.qty} (${fmtPct(locale, ((plan - be.units) / plan) * 100, 1)})` },
              { label: t.profitPlan, value: money(plan * be.contribution - (F.value ?? 0)) },
            ]
          : []),
      ]
    : undefined;

  const maxX = be ? Math.max(2, Math.ceil(Math.max(be.units * 2, plan ?? 0) * 1.05)) : 0;
  const xs = be ? Array.from({ length: 41 }, (_, i) => (maxX * i) / 40) : [];

  const inputs = (
    <>
      <NumSlider id={`${id}-f`} locale={locale} label={t.fixed} hint={t.fixedHint} value={q.v.f} onChange={(f) => q.set({ f })} suffix={sym} error={F.message} min={0} max={moneyMax(cur, 50_000_000)} scale="log" />
      <NumSlider id={`${id}-p`} locale={locale} label={t.price} value={q.v.p} onChange={(p) => q.set({ p })} suffix={sym} error={P.message} min={0} max={moneyMax(cur, 1_000_000)} scale="log" />
      <NumSlider id={`${id}-v`} locale={locale} label={t.variable} value={q.v.v} onChange={(v) => q.set({ v })} suffix={sym} error={V.message} min={0} max={moneyMax(cur, 1_000_000)} scale="log" />
      <OptionsRow>
        <CurrencySelect locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
      <Advanced title={t.planTitle} open={!!q.v.n}>
        <NumSlider id={`${id}-n`} locale={locale} label={t.plan} value={q.v.n} onChange={(n) => q.set({ n })} error={N.message} suffix={t.qty} min={0} max={10_000} scale="log" />
      </Advanced>
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={t.label}
            value={be ? `${fmtN(locale, be.unitsCeil, 0)} ${plural(locale, be.unitsCeil, t.units)}` : "—"}
            sub={be ? t.sub(money(be.unitsCeil * (P.value ?? 0))) : invalid ? t.noBe : t.enter}
            rows={rows}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {be && (
        <section>
          <SubHeading>{t.chart}</SubHeading>
          <LineChart
            ariaLabel={t.chart}
            x={xs}
            series={[
              { label: t.revenue, values: xs.map((x) => x * (P.value ?? 0)), tone: "ok" },
              { label: t.costs, values: xs.map((x) => (F.value ?? 0) + x * (V.value ?? 0)), tone: "err" },
            ]}
            xFormat={(x) => `${fmtN(locale, Math.round(x), 0)}`}
            yFormat={(v) => fmtCompact(locale, v)}
          />
        </section>
      )}
      {ru ? (
        <Explain
          locale={locale}
          formula={["Точка безубыточности, шт. = Постоянные расходы / (Цена − Переменные расходы на единицу)", "Выручка в точке = Точка × Цена", "Запас прочности = (План − Точка) / План × 100 %"]}
          notes={["Точка округляется вверх до целой единицы: продать 499,2 штуки нельзя.", "Модель линейная: цена и переменные расходы не зависят от объёма, налоги не учитываются."]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Break-even units = Fixed costs / (Price − Variable cost per unit)", "Break-even revenue = Units × Price", "Margin of safety = (Plan − Break-even) / Plan × 100%"]}
          notes={["The break-even point is rounded up to a whole unit — you cannot sell 499.2 items.", "The model is linear: price and variable cost do not depend on volume; taxes are not included."]}
        />
      )}
    </Stack>
  );
}
