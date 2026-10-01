"use client";

import { useId } from "react";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { CURRENCIES, CURRENCY_SYMBOL, fmtMoney, fmtPct, isCurrency, type Currency } from "../../shared/fmt";
import { roundTo } from "../../shared/math";
import { field, toInput } from "../../shared/num";
import { Advanced, CalcGrid, Disclaimer, Explain, FieldRow, InlineToggle, NumField, OptionsRow, ResultMain, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { loanSchedule, type LoanType } from "../lib/loan";
import { CurrencySelect, ScheduleView, termText } from "../loan/parts";

const T = {
  ru: {
    price: "Стоимость жилья",
    down: "Первоначальный взнос",
    downMode: "Взнос в процентах или суммой",
    rate: "Ставка, % годовых",
    term: "Срок",
    years: "лет",
    monthsShort: "мес.",
    unit: "Единица срока",
    type: "Тип платежа",
    annuity: "Аннуитетный",
    diff: "Дифференцированный",
    currency: "Валюта (только подпись)",
    extras: "Страховка и налог на имущество",
    ins: "Страхование, % от остатка в год",
    tax: "Налог на имущество в год",
    presets: "Примеры параметров программ",
    presetsNote: "Ставки и условия программ меняются — уточняйте в банке. Примеры можно менять.",
    monthly: "Ежемесячный платёж",
    firstLast: "Первый → последний платёж",
    withExtras: (v: string) => `с учётом страховки и налога в первый месяц — ${v}`,
    loan: "Сумма кредита",
    downIs: (v: string) => `Взнос: ${v}`,
    overpay: "Переплата по процентам",
    insTotal: "Страхование за весь срок",
    taxTotal: "Налог за весь срок",
    totalCost: "Полная стоимость покупки",
    totalCostHint: "взнос + все платежи + страховка и налог",
    termIs: "Срок",
    enter: "Заполните стоимость, взнос, ставку и срок",
    downTooBig: "Взнос не может быть больше стоимости",
    insurance: "Страховка",
    taxCol: "Налог",
    p7: "7 % · взнос 20 % · 25 лет",
    p7h: "параметры программы «7-20-25»",
    pMarket: "18 % · взнос 30 % · 15 лет",
    pMarketH: "пример рыночной ставки",
    pFamily: "6 % · взнос 20 % · 30 лет",
    pFamilyH: "как «Семейная ипотека» в России",
  },
  en: {
    price: "Property price",
    down: "Down payment",
    downMode: "Down payment as percent or amount",
    rate: "Interest rate, % per year",
    term: "Term",
    years: "years",
    monthsShort: "mo",
    unit: "Term unit",
    type: "Payment type",
    annuity: "Annuity (fixed)",
    diff: "Differentiated",
    currency: "Currency (label only)",
    extras: "Insurance and property tax",
    ins: "Insurance, % of balance per year",
    tax: "Property tax per year",
    presets: "Example programme parameters",
    presetsNote: "Programme rates and terms change — check with the bank. The examples are editable.",
    monthly: "Monthly payment",
    firstLast: "First → last payment",
    withExtras: (v: string) => `with insurance and tax in the first month — ${v}`,
    loan: "Loan amount",
    downIs: (v: string) => `Down payment: ${v}`,
    overpay: "Total interest",
    insTotal: "Insurance over the term",
    taxTotal: "Property tax over the term",
    totalCost: "Total cost of the purchase",
    totalCostHint: "down payment + all payments + insurance and tax",
    termIs: "Term",
    enter: "Enter the price, down payment, rate and term",
    downTooBig: "The down payment cannot exceed the price",
    insurance: "Insurance",
    taxCol: "Tax",
    p7: "7% · 20% down · 25 years",
    p7h: "Kazakhstan's 7-20-25 programme parameters",
    pMarket: "18% · 30% down · 15 years",
    pMarketH: "example market rate",
    pFamily: "6% · 20% down · 30 years",
    pFamilyH: "like Russia's family mortgage",
  },
} as const;

const TYPES = ["annuity", "diff"] as const;
const UNITS = ["y", "m"] as const;
const DMODES = ["pct", "amt"] as const;

export default function Mortgage({
  locale,
  price = locale === "ru" ? 30_000_000 : 400_000,
  down = 20,
  rate = locale === "ru" ? 16 : 6.5,
  years = locale === "ru" ? 20 : 30,
}: ToolProps<{ price?: number; down?: number; rate?: number; years?: number }>) {
  const t = T[locale];
  const id = useId();
  const defCur: Currency = locale === "ru" ? "KZT" : "USD";
  const q = useQueryState(
    { p: toInput(locale, price), d: toInput(locale, down), dm: "pct", r: toInput(locale, rate), t: toInput(locale, years), u: "y", k: "annuity", c: defCur, i: "", tx: "" },
    { enums: { dm: DMODES, u: UNITS, k: TYPES, c: CURRENCIES } },
  );
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number, digits = 2) => fmtMoney(locale, v, cur, digits);
  const unit = q.v.u as (typeof UNITS)[number];
  const dm = q.v.dm as (typeof DMODES)[number];

  const P = field(locale, q.v.p, { gt: 0, max: 1e13 });
  const D = field(locale, q.v.d, dm === "pct" ? { min: 0, max: 100 } : { min: 0 });
  const R = field(locale, q.v.r, { min: 0, max: 100 });
  const N = field(locale, q.v.t, unit === "y" ? { gt: 0, max: 50 } : { gt: 0, max: 600, int: true });
  const I = field(locale, q.v.i, { min: 0, max: 10 });
  const TX = field(locale, q.v.tx, { min: 0 });

  const downAmount = P.value !== null && D.value !== null ? (dm === "pct" ? roundTo((P.value * D.value) / 100, 2) : D.value) : null;
  const downErr = P.value !== null && downAmount !== null && downAmount >= P.value ? t.downTooBig : undefined;
  const principal = P.value !== null && downAmount !== null && !downErr ? roundTo(P.value - downAmount, 2) : null;
  const months = N.value === null ? null : Math.round(unit === "y" ? N.value * 12 : N.value);
  const res = principal !== null && R.value !== null && months ? loanSchedule({ principal, annualRate: R.value, months, type: q.v.k as LoanType }) : null;

  const insRate = I.value ?? 0;
  const taxYear = TX.value ?? 0;
  const insCol = res ? res.rows.map((r) => roundTo((r.opening * insRate) / 1200, 2)) : [];
  const taxCol = res ? res.rows.map(() => roundTo(taxYear / 12, 2)) : [];
  const sum = (xs: number[]) => Math.round(xs.reduce((s, x) => s + Math.round(x * 100), 0)) / 100;
  const insTotal = sum(insCol);
  const taxTotal = sum(taxCol);
  const extraCols = [
    ...(insRate > 0 ? [{ label: t.insurance, values: insCol }] : []),
    ...(taxYear > 0 ? [{ label: t.taxCol, values: taxCol }] : []),
  ];

  function applyPreset(r: number, d: number, y: number) {
    q.set({ r: toInput(locale, r), d: toInput(locale, d), dm: "pct", t: toInput(locale, y), u: "y" });
  }

  const downHint =
    P.value !== null && downAmount !== null && !downErr
      ? dm === "pct"
        ? t.downIs(money(downAmount, 0))
        : t.downIs(fmtPct(locale, (downAmount / P.value) * 100, 1))
      : undefined;

  const inputs = (
    <>
      <NumField id={`${id}-p`} label={t.price} value={q.v.p} onChange={(p) => q.set({ p })} suffix={sym} error={P.message} size="lg" />
      <NumField
        id={`${id}-d`}
        label={t.down}
        value={q.v.d}
        onChange={(d) => q.set({ d })}
        suffix={dm === "pct" ? "%" : sym}
        error={D.message ?? downErr}
        hint={downHint}
        size="lg"
        aside={
          <Segmented
            size="sm"
            label={t.downMode}
            value={dm}
            onChange={(next) => {
              if (next === dm) return;
              const conv =
                downAmount === null || P.value === null
                  ? q.v.d
                  : next === "amt"
                    ? toInput(locale, Math.round(downAmount))
                    : toInput(locale, roundTo((downAmount / P.value) * 100, 2));
              q.set({ dm: next, d: conv });
            }}
            options={[
              { value: "pct", label: "%" },
              { value: "amt", label: sym },
            ]}
          />
        }
      />
      <FieldRow>
        <NumField id={`${id}-r`} label={t.rate} value={q.v.r} onChange={(r) => q.set({ r })} suffix="%" error={R.message} />
        <NumField
          id={`${id}-t`}
          label={t.term}
          value={q.v.t}
          onChange={(v) => q.set({ t: v })}
          suffix={unit === "y" ? t.years : t.monthsShort}
          error={N.message}
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
      </FieldRow>
      <OptionsRow>
        <InlineToggle
          label={t.type}
          value={q.v.k as LoanType}
          onChange={(k) => q.set({ k })}
          options={[
            { value: "annuity", label: t.annuity },
            { value: "diff", label: t.diff },
          ]}
        />
        <CurrencySelect id={`${id}-c`} locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
      <Advanced title={t.extras} open={insRate > 0 || taxYear > 0}>
        <FieldRow>
          <NumField id={`${id}-i`} label={t.ins} value={q.v.i} onChange={(i) => q.set({ i })} suffix="%" error={I.message} placeholder="0" />
          <NumField id={`${id}-tx`} label={t.tax} value={q.v.tx} onChange={(tx) => q.set({ tx })} suffix={sym} error={TX.message} placeholder="0" />
        </FieldRow>
      </Advanced>
      <Advanced title={t.presets}>
        <ul className="flex flex-col gap-1">
          {(
            [
              [t.p7, t.p7h, 7, 20, 25],
              [t.pMarket, t.pMarketH, 18, 30, 15],
              [t.pFamily, t.pFamilyH, 6, 20, 30],
            ] as const
          ).map(([label, hint, r, d, y]) => (
            <li key={label}>
              <button type="button" className="text-left text-sm text-accent hover:underline" onClick={() => applyPreset(r, d, y)}>
                {label}
              </button>
              <span className="text-[0.8125rem] text-fg-3"> — {hint}</span>
            </li>
          ))}
        </ul>
        <p className="text-[0.8125rem] text-fg-3">{t.presetsNote}</p>
      </Advanced>
    </>
  );

  const firstTotal = res ? roundTo(res.firstPayment + (insCol[0] ?? 0) + (taxCol[0] ?? 0), 2) : 0;
  const mainValue = res ? (q.v.k === "annuity" ? money(res.firstPayment) : `${money(res.firstPayment)} → ${money(res.lastPayment)}`) : "—";
  const mainSub = !res ? (downErr ?? t.enter) : extraCols.length ? t.withExtras(money(firstTotal)) : `${t.loan}: ${money(principal ?? 0, 0)}`;

  const result = (
    <ResultMain
      label={q.v.k === "annuity" ? t.monthly : t.firstLast}
      value={mainValue}
      sub={mainSub}
      rows={
        res && principal !== null && downAmount !== null
          ? [
              { label: t.overpay, value: money(res.totalInterest) },
              ...(insRate > 0 ? [{ label: t.insTotal, value: money(insTotal) }] : []),
              ...(taxYear > 0 ? [{ label: t.taxTotal, value: money(taxTotal) }] : []),
              { label: t.totalCost, hint: t.totalCostHint, value: money(roundTo(downAmount + res.totalPaid + insTotal + taxTotal, 2)) },
              { label: t.termIs, value: termText(locale, res.months) },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {res && <ScheduleView locale={locale} result={res} cur={cur} extraCols={extraCols} filename={locale === "ru" ? "ipoteka-grafik.csv" : "mortgage-schedule.csv"} />}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Кредит = Стоимость − Взнос", "i = ставка / 12 / 100", "Аннуитет: P = Кредит × i / (1 − (1 + i)^−n)", "Страховка за месяц = остаток × тариф / 12"]}
          notes={[
            "Платёж считается тем же движком, что и кредитный калькулятор: проценты за месяц = остаток × i, суммы округляются до тиынов/копеек, последний платёж выравнивается до нуля.",
            "Дифференцированный платёж: долг гасится равными частями, проценты начисляются на остаток — платёж снижается каждый месяц.",
            "Страхование считается от остатка долга на начало месяца, налог на имущество — равными долями по 1/12 годовой суммы. Это упрощение: фактические тарифы и сроки уплаты задают страховая компания и налоговая.",
            "Ставки программ и минимальный взнос меняются — примеры параметров приведены только для ориентира.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Loan = Price − Down payment", "i = rate / 12 / 100", "Annuity: P = Loan × i / (1 − (1 + i)^−n)", "Monthly insurance = balance × rate / 12"]}
          notes={[
            "The payment uses the same engine as the loan calculator: monthly interest = balance × i, amounts are rounded to cents and the last payment is trued up to zero.",
            "Differentiated payments repay the principal in equal parts with interest on the remaining balance, so the payment falls every month.",
            "Insurance is charged on the balance at the start of each month and property tax is spread evenly as 1/12 of the annual amount. This is a simplification: actual tariffs and due dates are set by the insurer and the tax office.",
            "Programme rates and minimum down payments change — the example parameters are only a guide.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="finance" />
    </Stack>
  );
}
