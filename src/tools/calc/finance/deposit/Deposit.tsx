"use client";

import { useId } from "react";
import { Field, Input } from "@/ui/field";
import type { ToolProps } from "../../../types";
import { LineChart } from "../../shared/charts";
import { useToday } from "../../shared/clock";
import { fmtDay, parseIso } from "../../shared/dates";
import { CURRENCIES, CURRENCY_SYMBOL, fmtCompact, fmtMoney, fmtPct, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { Advanced, CalcGrid, DataTable, Disclaimer, Explain, NumSlider, OptionsRow, ResultMain, Stack, SubHeading, ToggleField, ToolActions, SliderRow } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { depositSchedule, type Capitalization } from "../lib/deposit";
import { CurrencySelect, TERM_UNITS, TermSlider, termText, type TermUnit } from "../loan/parts";

const T = {
  ru: {
    amount: "Сумма вклада",
    rate: "Ставка в год",
    monthsShort: "мес.",
    cap: "Капитализация",
    caps: { monthly: "каждый месяц", quarterly: "раз в квартал", end: "нет, в конце" } satisfies Record<Capitalization, string>,
    more: "Дата открытия, пополнения и снятия",
    start: "Дата открытия",
    startHint: "По умолчанию — сегодня",
    topUp: "Пополнение каждый месяц",
    withdrawal: "Снятие каждый месяц",
    final: "Сумма в конце срока",
    income: "Доход по вкладу",
    sub: (inc: string, eff: string) => `доход ${inc}, эффективная ставка ${eff}`,
    subEnd: (inc: string) => `доход ${inc}, проценты выплачиваются в конце срока`,
    tops: "Пополнения",
    outs: "Снятия",
    endDate: "Дата окончания",
    days: "Дней",
    enter: "Заполните сумму, ставку и срок",
    chart: "Рост вклада",
    balance: "Остаток",
    table: "Начисления по месяцам",
    month: "Месяц",
    date: "Дата",
    interest: "Проценты",
    credited: "Капитализация",
    change: "Пополнение / снятие",
    loading: "Считаем от сегодняшней даты…",
  },
  en: {
    amount: "Deposit amount",
    rate: "Interest rate per year",
    monthsShort: "mo",
    cap: "Capitalization",
    caps: { monthly: "monthly", quarterly: "quarterly", end: "none, at maturity" } satisfies Record<Capitalization, string>,
    more: "Start date, top-ups and withdrawals",
    start: "Start date",
    startHint: "Defaults to today",
    topUp: "Monthly top-up",
    withdrawal: "Monthly withdrawal",
    final: "Balance at maturity",
    income: "Interest earned",
    sub: (inc: string, eff: string) => `interest ${inc}, effective rate ${eff}`,
    subEnd: (inc: string) => `interest ${inc}, paid at maturity`,
    tops: "Top-ups",
    outs: "Withdrawals",
    endDate: "Maturity date",
    days: "Days",
    enter: "Enter the amount, rate and term",
    chart: "Deposit growth",
    balance: "Balance",
    table: "Interest by month",
    month: "Month",
    date: "Date",
    interest: "Interest",
    credited: "Capitalized",
    change: "Top-up / withdrawal",
    loading: "Calculating from today's date…",
  },
} as const;

const CAPS = ["monthly", "quarterly", "end"] as const;

export default function Deposit({ locale, amount = locale === "ru" ? 1_000_000 : 10_000, rate = locale === "ru" ? 14 : 4.5, months = 12 }: ToolProps<{ amount?: number; rate?: number; months?: number }>) {
  const t = T[locale];
  const id = useId();
  const today = useToday();
  const defCur: Currency = locale === "ru" ? "KZT" : "USD";
  const q = useQueryState(
    { s: toInput(locale, amount), r: toInput(locale, rate), t: toInput(locale, months), u: "m", k: "monthly", c: defCur, d: "", tu: "", wd: "" },
    { enums: { k: CAPS, u: TERM_UNITS, c: CURRENCIES } },
  );
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur);
  const unit = q.v.u as TermUnit;
  const cap = q.v.k as Capitalization;
  const S = field(locale, q.v.s, { gt: 0, max: 1e12 });
  const R = field(locale, q.v.r, { min: 0, max: 100 });
  const N = field(locale, q.v.t, unit === "y" ? { gt: 0, max: 30 } : { min: 1, max: 360, int: true });
  const TU = field(locale, q.v.tu, { min: 0 });
  const WD = field(locale, q.v.wd, { min: 0 });
  const startIso = q.v.d || today;
  const start = startIso ? parseIso(startIso) : null;
  const n = N.value === null ? null : Math.round(unit === "y" ? N.value * 12 : N.value);
  const res =
    S.value !== null && R.value !== null && n && start !== null
      ? depositSchedule({ amount: S.value, annualRate: R.value, months: n, start, cap, topUp: TU.value ?? 0, withdrawal: WD.value ?? 0 })
      : null;

  const inputs = (
    <>
      <NumSlider id={`${id}-s`} locale={locale} label={t.amount} value={q.v.s} onChange={(s) => q.set({ s })} suffix={sym} error={S.message} min={0} max={moneyMax(cur, 100_000_000)} scale="log" />
      <NumSlider id={`${id}-r`} locale={locale} label={t.rate} value={q.v.r} onChange={(r) => q.set({ r })} suffix="%" error={R.message} min={0} max={30} decimals={1} />
      <TermSlider id={`${id}-t`} locale={locale} value={q.v.t} unit={unit} onChange={(v, u) => q.set({ t: v, u })} error={N.message} maxYears={5} />
      <ToggleField label={t.cap} value={cap} onChange={(k) => q.set({ k })} options={CAPS.map((c) => ({ value: c, label: t.caps[c] }))} />
      <OptionsRow>
        <CurrencySelect locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
      <Advanced title={t.more} open={!!(q.v.d || q.v.tu || q.v.wd)}>
        <Field label={t.start} htmlFor={`${id}-d`} hint={t.startHint}>
          <Input id={`${id}-d`} type="date" value={startIso ?? ""} onChange={(e) => q.set({ d: e.target.value })} className="max-w-[16rem]" />
        </Field>
        <SliderRow>
          <NumSlider id={`${id}-tu`} locale={locale} label={t.topUp} value={q.v.tu} onChange={(tu) => q.set({ tu })} suffix={sym} error={TU.message} min={0} max={moneyMax(cur, 5_000_000)} scale="log" />
          <NumSlider id={`${id}-wd`} locale={locale} label={t.withdrawal} value={q.v.wd} onChange={(wd) => q.set({ wd })} suffix={sym} error={WD.message} min={0} max={moneyMax(cur, 5_000_000)} scale="log" />
        </SliderRow>
      </Advanced>
    </>
  );

  const sub = !res
    ? start === null && S.value !== null && R.value !== null && n
      ? t.loading
      : t.enter
    : cap === "end"
      ? t.subEnd(money(res.totalInterest))
      : t.sub(money(res.totalInterest), fmtPct(locale, res.effectiveRate, 2));

  const result = (
    <ResultMain
      label={t.final}
      value={res ? money(res.final) : "—"}
      sub={sub}
      rows={
        res
          ? [
              { label: t.income, value: money(res.totalInterest) },
              ...(res.totalTopUps ? [{ label: t.tops, value: money(res.totalTopUps) }] : []),
              ...(res.totalWithdrawals ? [{ label: t.outs, value: `−${money(res.totalWithdrawals)}` }] : []),
              { label: t.endDate, value: fmtDay(locale, res.end), hint: `${termText(locale, n ?? 0)} · ${res.days} ${locale === "ru" ? "дн." : "days"}` },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  const hasMoves = !!res && (res.totalTopUps > 0 || res.totalWithdrawals > 0);

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {res && res.rows.length > 1 && (
        <section>
          <SubHeading>{t.chart}</SubHeading>
          <LineChart
            ariaLabel={t.chart}
            x={[0, ...res.rows.map((r) => r.month)]}
            series={[{ label: t.balance, values: [S.value ?? 0, ...res.rows.map((r, i) => r.balance + (cap === "end" ? res.rows.slice(0, i + 1).reduce((a, x) => a + x.interest, 0) : 0))], tone: "accent", area: true }]}
            xFormat={(m) => `${m} ${t.monthsShort}`}
            yFormat={(v) => fmtCompact(locale, v)}
            zeroBased={false}
          />
        </section>
      )}
      {res && (
        <section>
          <SubHeading>{t.table}</SubHeading>
          <DataTable
            caption={t.table}
            head={[t.month, t.date, t.interest, t.credited, ...(hasMoves ? [t.change] : []), t.balance]}
            rows={res.rows.map((r) => [
              String(r.month),
              fmtDay(locale, r.date, { day: "numeric", month: "short", year: "numeric" }),
              money(r.interest),
              r.credited ? money(r.credited) : "—",
              ...(hasMoves ? [r.topUp || r.withdrawal ? `${r.topUp ? `+${money(r.topUp)}` : ""}${r.withdrawal ? ` −${money(r.withdrawal)}` : ""}` : "—"] : []),
              money(r.balance),
            ])}
            maxHeight={420}
          />
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Проценты за день = остаток × ставка / 365 (366 в високосный год)", "Эффективная ставка = (1 + ставка / m)^m − 1, m = 12 или 4"]}
          notes={[
            "Проценты начисляются каждый день на текущий остаток по фактическому числу дней в месяце и году.",
            "При капитализации начисленные проценты прибавляются к вкладу в день капитализации (каждый месяц или квартал от даты открытия) и дальше сами приносят доход. Без капитализации проценты выплачиваются в конце срока.",
            "Пополнения и снятия происходят в даты ежемесячных начислений, после капитализации.",
            "Налог на доход по вкладу, досрочное расторжение и изменение ставки не учитываются — уточняйте условия в банке. Валюта — только подпись.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Daily interest = balance × rate / 365 (366 in a leap year)", "Effective rate = (1 + rate / m)^m − 1, m = 12 or 4"]}
          notes={[
            "Interest accrues every day on the current balance using the actual number of days in each month and year.",
            "With capitalization the accrued interest is added to the deposit on each capitalization date (monthly or quarterly from the start date) and earns interest itself. Without it, interest is paid at maturity.",
            "Top-ups and withdrawals happen on the monthly anniversary dates, after capitalization.",
            "Tax on interest, early withdrawal penalties and rate changes are not included — check your bank's terms. The currency is only a label.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="finance" />
    </Stack>
  );
}
