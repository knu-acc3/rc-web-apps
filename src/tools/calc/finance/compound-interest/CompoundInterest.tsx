"use client";

import { useId } from "react";
import { plural } from "@/i18n/format";
import type { ToolProps } from "../../../types";
import { BarChart } from "../../shared/charts";
import { CURRENCIES, CURRENCY_SYMBOL, fmtCompact, fmtMoney, fmtPct, fmtRound, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { Advanced, CalcGrid, DataTable, Disclaimer, Explain, InlineSelect, InlineToggle, NumSlider, OptionsRow, ResultMain, Stack, SubHeading, ToolActions, SliderRow } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { compound, COMPOUNDINGS, monthlyFactor, type Compounding } from "../lib/growth";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    principal: "Начальная сумма",
    rate: "Ставка в год",
    years: "Срок",
    yearForms: ["год", "года", "лет"],
    comp: "Начисление",
    comps: { yearly: "раз в год", semiannual: "раз в полгода", quarterly: "раз в квартал", monthly: "каждый месяц", daily: "каждый день", continuous: "непрерывно" } satisfies Record<Compounding, string>,
    contrib: "Регулярные пополнения",
    amount: "Сумма пополнения",
    freq: "Как часто",
    monthly: "Каждый месяц",
    yearly: "Раз в год",
    timing: "Когда",
    start: "В начале периода",
    end: "В конце периода",
    final: "Итоговая сумма",
    sub: (i: string) => `из них проценты — ${i}`,
    invested: "Вложено",
    interest: "Проценты",
    eff: "Эффективная ставка",
    growth: "Рост капитала",
    enter: "Заполните сумму, ставку и срок",
    chart: "Состав суммы по годам",
    table: "По годам",
    year: "Год",
    balance: "Сумма",
  },
  en: {
    principal: "Initial amount",
    rate: "Interest rate per year",
    years: "Term",
    yearForms: ["year", "years"],
    comp: "Compounding",
    comps: { yearly: "yearly", semiannual: "semiannually", quarterly: "quarterly", monthly: "monthly", daily: "daily", continuous: "continuously" } satisfies Record<Compounding, string>,
    contrib: "Regular contributions",
    amount: "Contribution",
    freq: "How often",
    monthly: "Monthly",
    yearly: "Yearly",
    timing: "When",
    start: "Start of period",
    end: "End of period",
    final: "Future value",
    sub: (i: string) => `of which interest — ${i}`,
    invested: "Invested",
    interest: "Interest",
    eff: "Effective annual rate",
    growth: "Growth",
    enter: "Enter the amount, rate and term",
    chart: "Balance by year",
    table: "By year",
    year: "Year",
    balance: "Balance",
  },
} as const;

const FREQ = ["monthly", "yearly"] as const;
const TIMING = ["end", "start"] as const;

export default function CompoundInterest({ locale, principal = locale === "ru" ? 1_000_000 : 10_000, rate = locale === "ru" ? 12 : 7, years = 10 }: ToolProps<{ principal?: number; rate?: number; years?: number }>) {
  const t = T[locale];
  const id = useId();
  const defCur: Currency = locale === "ru" ? "KZT" : "USD";
  const q = useQueryState(
    { p: toInput(locale, principal), r: toInput(locale, rate), y: toInput(locale, years), n: "monthly", a: "", f: "monthly", w: "end", c: defCur },
    { enums: { n: COMPOUNDINGS, f: FREQ, w: TIMING, c: CURRENCIES } },
  );
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur);
  const comp = q.v.n as Compounding;
  const P = field(locale, q.v.p, { min: 0, max: 1e13 });
  const R = field(locale, q.v.r, { gt: -100, max: 1000 });
  const Y = field(locale, q.v.y, { gt: 0, max: 100 });
  const A = field(locale, q.v.a, { min: 0 });
  const res =
    P.value !== null && R.value !== null && Y.value !== null
      ? compound({ principal: P.value, rate: R.value, years: Y.value, comp, contribution: A.value ?? 0, contribFreq: q.v.f as (typeof FREQ)[number], timing: q.v.w as (typeof TIMING)[number] })
      : null;
  const eff = R.value !== null ? (Math.pow(monthlyFactor(R.value, comp), 12) - 1) * 100 : null;

  const inputs = (
    <>
      <NumSlider id={`${id}-p`} locale={locale} label={t.principal} value={q.v.p} onChange={(p) => q.set({ p })} suffix={sym} error={P.message} min={0} max={moneyMax(cur, 100_000_000)} scale="log" />
      <SliderRow>
        <NumSlider id={`${id}-r`} locale={locale} label={t.rate} value={q.v.r} onChange={(r) => q.set({ r })} suffix="%" error={R.message} min={0} max={30} decimals={1} />
        <NumSlider id={`${id}-y`} locale={locale} label={t.years} value={q.v.y} onChange={(y) => q.set({ y })} suffix={plural(locale, Y.value ?? 5, t.yearForms)} error={Y.message} min={1} max={50} />
      </SliderRow>
      <OptionsRow>
        <InlineSelect id={`${id}-n`} label={t.comp} value={comp} onChange={(n) => q.set({ n })} options={COMPOUNDINGS.map((c) => ({ value: c, label: t.comps[c] }))} />
        <CurrencySelect locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
      <Advanced title={t.contrib} open={!!q.v.a}>
        <NumSlider id={`${id}-a`} locale={locale} label={t.amount} value={q.v.a} onChange={(a) => q.set({ a })} suffix={sym} error={A.message} min={0} max={moneyMax(cur, 5_000_000)} scale="log" />
        <OptionsRow>
          <InlineToggle
            label={t.freq}
            showLabel
            value={q.v.f as (typeof FREQ)[number]}
            onChange={(f) => q.set({ f })}
            options={[
              { value: "monthly", label: t.monthly },
              { value: "yearly", label: t.yearly },
            ]}
          />
          <InlineToggle
            label={t.timing}
            showLabel
            value={q.v.w as (typeof TIMING)[number]}
            onChange={(w) => q.set({ w })}
            options={[
              { value: "end", label: t.end },
              { value: "start", label: t.start },
            ]}
          />
        </OptionsRow>
      </Advanced>
    </>
  );

  const result = (
    <ResultMain
      label={t.final}
      value={res ? money(res.final) : "—"}
      sub={res ? t.sub(money(res.interest)) : t.enter}
      rows={
        res
          ? [
              { label: t.invested, value: money(res.invested) },
              ...(res.invested > 0 ? [{ label: t.growth, value: `× ${fmtRound(locale, res.final / res.invested, 2)}` }] : []),
              ...(eff !== null ? [{ label: t.eff, value: fmtPct(locale, eff, 2) }] : []),
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {res && res.rows.length > 1 && (
        <section>
          <SubHeading>{t.chart}</SubHeading>
          <BarChart
            ariaLabel={t.chart}
            labels={res.rows.map((r) => String(r.year))}
            series={[
              { label: t.invested, values: res.rows.map((r) => r.invested), tone: "accent" },
              { label: t.interest, values: res.rows.map((r) => Math.max(0, r.interest)), tone: "ok" },
            ]}
            yFormat={(v) => fmtCompact(locale, v)}
          />
        </section>
      )}
      {res && (
        <section>
          <SubHeading>{t.table}</SubHeading>
          <DataTable
            caption={t.table}
            head={[t.year, t.invested, t.interest, t.balance]}
            rows={res.rows.map((r) => [String(r.year), money(r.invested), money(r.interest), money(r.balance)])}
            maxHeight={420}
          />
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["A = P × (1 + r / n)^(n × t)", "Непрерывно: A = P × e^(r × t)", "Пополнения: A += PMT × ((1 + i)^k − 1) / i"]}
          notes={[
            "P — начальная сумма, r — годовая ставка, n — число начислений в год, t — срок в годах.",
            "Расчёт идёт помесячно: месячный множитель (1 + r / n)^(n / 12) позволяет сочетать любую частоту начисления с ежемесячными или ежегодными пополнениями.",
            "Пополнения в начале периода успевают принести проценты за этот период, в конце — нет.",
            "Налоги, комиссии и инфляция не учитываются.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["A = P × (1 + r / n)^(n × t)", "Continuous: A = P × e^(r × t)", "Contributions: A += PMT × ((1 + i)^k − 1) / i"]}
          notes={[
            "P is the initial amount, r the annual rate, n the number of compounding periods per year, t the term in years.",
            "The calculation runs month by month with the factor (1 + r / n)^(n / 12), so any compounding frequency works with monthly or yearly contributions.",
            "Contributions at the start of a period earn interest for that period; those at the end do not.",
            "Taxes, fees and inflation are not included.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="finance" />
    </Stack>
  );
}
