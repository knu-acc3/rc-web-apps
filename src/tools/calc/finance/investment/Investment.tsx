"use client";

import { useId } from "react";
import type { ToolProps } from "../../../types";
import { LineChart } from "../../shared/charts";
import { plural } from "@/i18n/format";
import { CURRENCIES, CURRENCY_SYMBOL, fmtCompact, fmtMoney, fmtN, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { Advanced, CalcGrid, DataTable, Disclaimer, Explain, NumSlider, OptionsRow, ResultMain, Stack, SubHeading, ToolActions, SliderRow } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { invest } from "../lib/growth";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    initial: "Начальная сумма",
    monthly: "Взнос каждый месяц",
    rate: "Доходность в год",
    years: "Срок",
    more: "Комиссии, инфляция и рост взносов",
    fee: "Комиссии в год",
    inflation: "Инфляция в год",
    increase: "Рост взноса в год",
    final: "Капитал через",
    yearForms: ["год", "года", "лет"],
    subReal: (v: string) => `в сегодняшних деньгах — ${v}`,
    subGain: (v: string) => `доход — ${v}`,
    invested: "Вложено",
    gain: "Доход",
    real: "В сегодняшних деньгах",
    enter: "Заполните суммы, доходность и срок",
    chart: "Рост капитала",
    nominal: "Капитал",
    realS: "С учётом инфляции",
    investedS: "Вложено",
    table: "По годам",
    year: "Год",
  },
  en: {
    initial: "Initial investment",
    monthly: "Monthly contribution",
    rate: "Return per year",
    years: "Term",
    more: "Fees, inflation and contribution growth",
    fee: "Fees per year",
    inflation: "Inflation per year",
    increase: "Contribution growth per year",
    final: "Portfolio after",
    yearForms: ["year", "years"],
    subReal: (v: string) => `in today's money — ${v}`,
    subGain: (v: string) => `gain — ${v}`,
    invested: "Invested",
    gain: "Gain",
    real: "In today's money",
    enter: "Enter the amounts, return and term",
    chart: "Portfolio growth",
    nominal: "Portfolio",
    realS: "Inflation-adjusted",
    investedS: "Invested",
    table: "By year",
    year: "Year",
  },
} as const;

export default function Investment({
  locale,
  initial = locale === "ru" ? 500_000 : 5_000,
  monthly = locale === "ru" ? 50_000 : 500,
  rate = locale === "ru" ? 12 : 7,
  years = 15,
  inflation = locale === "ru" ? 8 : 3,
}: ToolProps<{ initial?: number; monthly?: number; rate?: number; years?: number; inflation?: number }>) {
  const t = T[locale];
  const id = useId();
  const defCur: Currency = locale === "ru" ? "KZT" : "USD";
  const q = useQueryState(
    { i: toInput(locale, initial), m: toInput(locale, monthly), r: toInput(locale, rate), y: toInput(locale, years), f: "", n: toInput(locale, inflation), g: "", c: defCur },
    { enums: { c: CURRENCIES } },
  );
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur, 0);
  const I = field(locale, q.v.i, { min: 0 });
  const M = field(locale, q.v.m, { min: 0 });
  const R = field(locale, q.v.r, { gt: -100, max: 100 });
  const Y = field(locale, q.v.y, { gt: 0, max: 80 });
  const F = field(locale, q.v.f, { min: 0, max: 20 });
  const N = field(locale, q.v.n, { gt: -50, max: 100 });
  const G = field(locale, q.v.g, { min: -50, max: 100 });
  const res =
    I.value !== null && M.value !== null && R.value !== null && Y.value !== null
      ? invest({ initial: I.value, monthly: M.value, rate: R.value, years: Y.value, fee: F.value ?? 0, inflation: N.value ?? 0, increase: G.value ?? 0 })
      : null;
  const hasInfl = (N.value ?? 0) !== 0;
  const yearsN = Y.value ?? 0;

  const inputs = (
    <>
      <NumSlider id={`${id}-i`} locale={locale} label={t.initial} value={q.v.i} onChange={(i) => q.set({ i })} suffix={sym} error={I.message} min={0} max={moneyMax(cur, 100_000_000)} scale="log" />
      <NumSlider id={`${id}-m`} locale={locale} label={t.monthly} value={q.v.m} onChange={(m) => q.set({ m })} suffix={sym} error={M.message} min={0} max={moneyMax(cur, 2_000_000)} scale="log" />
      <SliderRow>
        <NumSlider id={`${id}-r`} locale={locale} label={t.rate} value={q.v.r} onChange={(r) => q.set({ r })} suffix="%" error={R.message} min={0} max={30} decimals={1} />
        <NumSlider id={`${id}-y`} locale={locale} label={t.years} value={q.v.y} onChange={(y) => q.set({ y })} suffix={plural(locale, Y.value ?? 5, t.yearForms)} error={Y.message} min={1} max={50} />
      </SliderRow>
      <OptionsRow>
        <CurrencySelect locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
      <Advanced title={t.more} open={!!(q.v.f || q.v.g)}>
        <SliderRow>
          <NumSlider id={`${id}-n`} locale={locale} label={t.inflation} value={q.v.n} onChange={(n) => q.set({ n })} suffix="%" error={N.message} min={0} max={30} decimals={1} />
          <NumSlider id={`${id}-f`} locale={locale} label={t.fee} value={q.v.f} onChange={(f) => q.set({ f })} suffix="%" error={F.message} min={0} max={5} decimals={2} />
        </SliderRow>
        <NumSlider id={`${id}-g`} locale={locale} label={t.increase} value={q.v.g} onChange={(g) => q.set({ g })} suffix="%" error={G.message} min={0} max={30} decimals={1} />
      </Advanced>
    </>
  );

  const result = (
    <ResultMain
      label={`${t.final} ${fmtN(locale, yearsN, 2)} ${plural(locale, yearsN, t.yearForms)}`}
      value={res ? money(res.final) : "—"}
      sub={res ? (hasInfl ? t.subReal(money(res.real)) : t.subGain(money(res.final - res.invested))) : t.enter}
      rows={
        res
          ? [
              { label: t.invested, value: money(res.invested) },
              { label: t.gain, value: money(res.final - res.invested) },
              ...(hasInfl ? [{ label: t.real, value: money(res.real) }] : []),
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
          <LineChart
            ariaLabel={t.chart}
            x={[0, ...res.rows.map((r) => r.year)]}
            series={[
              { label: t.nominal, values: [I.value ?? 0, ...res.rows.map((r) => r.balance)], tone: "accent", area: true },
              ...(hasInfl ? [{ label: t.realS, values: [I.value ?? 0, ...res.rows.map((r) => r.real)], tone: "ok" as const }] : []),
              { label: t.investedS, values: [I.value ?? 0, ...res.rows.map((r) => r.invested)], tone: "muted", dashed: true },
            ]}
            xFormat={(y) => (locale === "ru" ? `${y} г.` : `yr ${y}`)}
            yFormat={(v) => fmtCompact(locale, v)}
          />
        </section>
      )}
      {res && (
        <section>
          <SubHeading>{t.table}</SubHeading>
          <DataTable
            caption={t.table}
            head={[t.year, t.invested, t.gain, t.nominal, ...(hasInfl ? [t.real] : [])]}
            rows={res.rows.map((r) => [String(r.year), money(r.invested), money(r.interest), money(r.balance), ...(hasInfl ? [money(r.real)] : [])])}
            maxHeight={420}
          />
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Месячный множитель g = (1 + доходность)^(1/12) × (1 − комиссия)^(1/12)", "Капитал_m = Капитал_(m−1) × g + взнос", "В сегодняшних деньгах = Капитал / (1 + инфляция)^лет"]}
          notes={[
            "Доходность — среднегодовая; в реальности рынки колеблются, и результат может быть как выше, так и ниже. Отрицательная доходность допустима.",
            "Взнос вносится в конце каждого месяца; при росте взноса он увеличивается раз в год на указанный процент.",
            "Комиссия списывается пропорционально каждый месяц от стоимости портфеля. Налоги не учитываются.",
            "Это не инвестиционная рекомендация.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Monthly factor g = (1 + return)^(1/12) × (1 − fee)^(1/12)", "Balance_m = Balance_(m−1) × g + contribution", "Today's money = Balance / (1 + inflation)^years"]}
          notes={[
            "The return is an average annual figure; real markets fluctuate and results may be higher or lower. Negative returns are allowed.",
            "Contributions are made at the end of each month; with contribution growth they increase once a year.",
            "Fees are deducted monthly in proportion to the portfolio value. Taxes are not included.",
            "This is not investment advice.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="finance" />
    </Stack>
  );
}
