"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../types";
import { CURRENCIES, CURRENCY_SYMBOL, fmtMoney, fmtPct, isCurrency, MINOR_UNIT, type Currency } from "../../calc/kit/fmt";
import { roundTo } from "../../calc/kit/math";
import { field, toInput } from "../../calc/kit/num";
import { Advanced, CalcGrid, Disclaimer, Explain, FieldRow, InlineToggle, NumField, OptionsRow, ResultMain, Stack, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { loanSchedule, type ExtraMode, type LoanType } from "../engines/loan";
import { CurrencySelect, ScheduleView, termText } from "./parts";

const T = {
  ru: {
    amount: "Сумма кредита",
    rate: "Ставка, % годовых",
    term: "Срок",
    years: "лет",
    monthsShort: "мес.",
    unit: "Единица срока",
    type: "Тип платежа",
    annuity: "Аннуитетный",
    diff: "Дифференцированный",
    early: "Досрочное погашение",
    oneOff: "Разовый платёж",
    inMonth: "В месяце №",
    monthly: "Каждый месяц сверх графика",
    reduce: "Что уменьшить",
    reduceTerm: "Срок",
    reducePayment: "Платёж",
    monthlyPayment: "Ежемесячный платёж",
    firstLast: "Первый → последний платёж",
    overpay: "Переплата",
    totalPaid: "Всего выплат",
    effTerm: "Срок",
    saved: "Экономия на процентах",
    enter: "Заполните сумму, ставку и срок",
    lastTrue: (v: string) => `последний платёж — ${v}`,
  },
  en: {
    amount: "Loan amount",
    rate: "Interest rate, % per year",
    term: "Term",
    years: "years",
    monthsShort: "mo",
    unit: "Term unit",
    type: "Payment type",
    annuity: "Annuity",
    diff: "Differentiated",
    early: "Early repayment",
    oneOff: "One-off payment",
    inMonth: "In month #",
    monthly: "Extra every month",
    reduce: "Reduce",
    reduceTerm: "Term",
    reducePayment: "Payment",
    monthlyPayment: "Monthly payment",
    firstLast: "First → last payment",
    overpay: "Total interest",
    totalPaid: "Total paid",
    effTerm: "Term",
    saved: "Interest saved",
    enter: "Enter the amount, rate and term",
    lastTrue: (v: string) => `last payment — ${v}`,
  },
} as const;

const TYPES = ["annuity", "diff"] as const;
const UNITS = ["y", "m"] as const;
const MODES = ["term", "payment"] as const;

export default function Loan({
  locale,
  amount = locale === "ru" ? 5_000_000 : 50_000,
  rate = locale === "ru" ? 18 : 8,
  years = 5,
  type = "annuity",
}: ToolProps<{ amount?: number; rate?: number; years?: number; type?: LoanType }>) {
  const t = T[locale];
  const id = useId();
  const defCur: Currency = locale === "ru" ? "KZT" : "USD";
  const q = useQueryState(
    { s: toInput(locale, amount), r: toInput(locale, rate), t: toInput(locale, years), u: "y", k: type, c: defCur, x: "", xm: "12", mx: "", em: "term" },
    { enums: { u: UNITS, k: TYPES, c: CURRENCIES, em: MODES } },
  );
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const unit = q.v.u as (typeof UNITS)[number];
  const S = field(locale, q.v.s, { gt: 0, max: 1e12 });
  const R = field(locale, q.v.r, { min: 0, max: 200 });
  const N = field(locale, q.v.t, unit === "y" ? { gt: 0, max: 50 } : { gt: 0, max: 600, int: true });
  const X = field(locale, q.v.x, { min: 0 });
  const XM = field(locale, q.v.xm, { min: 1, max: 600, int: true });
  const MX = field(locale, q.v.mx, { min: 0 });
  const months = N.value === null ? null : Math.round(unit === "y" ? N.value * 12 : N.value);
  const ok = S.value !== null && R.value !== null && months !== null && months >= 1;

  const input = ok
    ? {
        principal: S.value!,
        annualRate: R.value!,
        months: months!,
        type: q.v.k as LoanType,
        extras: X.value && XM.value ? [{ month: XM.value, amount: X.value }] : [],
        monthlyExtra: MX.value ?? 0,
        extraMode: q.v.em as ExtraMode,
      }
    : null;
  const res = input ? loanSchedule(input) : null;
  const hasExtra = !!input && ((input.extras?.length ?? 0) > 0 || (input.monthlyExtra ?? 0) > 0);
  const base = hasExtra && input ? loanSchedule({ ...input, extras: [], monthlyExtra: 0 }) : null;
  const money = (v: number) => fmtMoney(locale, v, cur);

  let mainValue = "—";
  let mainSub: string = t.enter;
  if (res && S.value !== null) {
    const over = `${t.overpay} ${money(res.totalInterest)} (${fmtPct(locale, (res.totalInterest / S.value) * 100, 1)})`;
    if (q.v.k === "annuity") {
      const regular = res.rows[0]?.payment ?? 0;
      mainValue = money(regular);
      mainSub = res.rows.length > 1 && Math.abs(res.lastPayment - regular) >= 0.01 ? `${over}; ${t.lastTrue(money(res.lastPayment))}` : over;
    } else {
      mainValue = `${money(res.firstPayment)} → ${money(res.lastPayment)}`;
      mainSub = over;
    }
  }

  const inputs = (
    <>
      <NumField id={`${id}-s`} label={t.amount} value={q.v.s} onChange={(s) => q.set({ s })} suffix={sym} error={S.message} size="lg" />
      <FieldRow>
        <NumField id={`${id}-r`} label={t.rate} value={q.v.r} onChange={(r) => q.set({ r })} suffix="%" error={R.message} size="lg" />
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
      <Advanced title={t.early} open={hasExtra}>
        <FieldRow>
          <NumField id={`${id}-x`} label={t.oneOff} value={q.v.x} onChange={(x) => q.set({ x })} suffix={sym} error={X.message} placeholder="0" />
          <NumField id={`${id}-xm`} label={t.inMonth} value={q.v.xm} onChange={(xm) => q.set({ xm })} error={XM.message} inputMode="numeric" />
        </FieldRow>
        <NumField id={`${id}-mx`} label={t.monthly} value={q.v.mx} onChange={(mx) => q.set({ mx })} suffix={sym} error={MX.message} placeholder="0" />
        <InlineToggle
          label={t.reduce}
          showLabel
          value={q.v.em as ExtraMode}
          onChange={(em) => q.set({ em })}
          options={[
            { value: "term", label: t.reduceTerm },
            { value: "payment", label: t.reducePayment },
          ]}
        />
      </Advanced>
    </>
  );

  const result = (
    <ResultMain
      label={q.v.k === "annuity" ? t.monthlyPayment : t.firstLast}
      value={mainValue}
      sub={mainSub}
      rows={
        res
          ? [
              { label: t.totalPaid, value: money(res.totalPaid) },
              { label: t.effTerm, value: termText(locale, res.months) },
              ...(base ? [{ label: t.saved, value: money(Math.max(0, base.totalInterest - res.totalInterest)) }] : []),
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {res && <ScheduleView locale={locale} result={res} cur={cur} filename={locale === "ru" ? "grafik-platezhey.csv" : "loan-schedule.csv"} />}
      <LoanExplain locale={locale} cur={cur} />
      <Disclaimer locale={locale} kind="finance" />
    </Stack>
  );
}

function LoanExplain({ locale, cur }: { locale: Locale; cur: Currency }) {
  const minorGen = locale === "ru" ? ({ KZT: "тиынов", RUB: "копеек", USD: "центов", EUR: "центов" } as const)[cur] : MINOR_UNIT.en[cur];
  return locale === "ru" ? (
    <Explain
      locale={locale}
      formula={["i = ставка / 12 / 100", "Аннуитет: P = S × i / (1 − (1 + i)^−n)", "Дифференцированный: P_k = S / n + остаток_k × i"]}
      notes={[
        "S — сумма кредита, n — срок в месяцах, i — месячная ставка. Проценты за месяц = остаток долга × i.",
        `Платёж и проценты округляются до ${minorGen}; последний платёж выравнивается так, чтобы остаток стал ровно нулевым.`,
        "Досрочный платёж вносится вместе с плановым платежом указанного месяца и сразу уменьшает остаток. «Срок» — платёж прежний, кредит закрывается раньше; «Платёж» — срок прежний, платёж пересчитывается.",
        "Месячная ставка считается как годовая / 12. Некоторые банки начисляют проценты по фактическому числу дней в месяце — суммы могут немного отличаться.",
        "Комиссии, страховки и штрафы не учитываются. Валюта — только подпись, курсы не используются.",
      ]}
    />
  ) : (
    <Explain
      locale={locale}
      formula={["i = rate / 12 / 100", "Annuity: P = S × i / (1 − (1 + i)^−n)", "Differentiated: P_k = S / n + balance_k × i"]}
      notes={[
        "S is the loan amount, n the term in months, i the monthly rate. Monthly interest = outstanding balance × i.",
        `Payments and interest are rounded to the ${minorGen}; the last payment is trued up so the balance ends at exactly zero.`,
        "An early repayment is made together with that month's regular payment and reduces the balance immediately. 'Term' keeps the payment and closes the loan sooner; 'Payment' keeps the end date and recalculates the payment.",
        "The monthly rate is the annual rate / 12. Some banks charge interest by the actual number of days, so amounts may differ slightly.",
        "Fees, insurance and penalties are not included. The currency is only a label; no exchange rates are used.",
      ]}
    />
  );
}
