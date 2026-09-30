"use client";

import { useId } from "react";
import { plural } from "@/i18n/format";
import { Field, Input } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../types";
import { LineChart } from "../../calc/kit/charts";
import { CURRENCIES, CURRENCY_SYMBOL, fmtCompact, fmtMoney, fmtPct, isCurrency, type Currency } from "../../calc/kit/fmt";
import { field, parseLocaleNumber, toInput } from "../../calc/kit/num";
import { CalcGrid, Explain, FieldRow, NumField, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { averageRate, cumulative, futureCost, presentValue } from "../engines/growth";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    mode: "Что посчитать",
    future: "Цена в будущем",
    average: "Средняя инфляция",
    yearly: "По годам",
    amount: "Сумма сегодня",
    rate: "Инфляция, % в год",
    rateHint: "Введите свою оценку — калькулятор не подставляет официальную статистику",
    years: "Через сколько лет",
    p1: "Цена тогда",
    p2: "Цена сейчас",
    period: "Прошло лет",
    list: "Инфляция по годам, %",
    listHint: "Через пробел или точку с запятой: 8,5; 9,4; 12",
    futureLabel: (y: string) => `Будет стоить через ${y}`,
    ppLabel: "Покупательная способность",
    ppHint: (a: string) => `столько сегодняшних денег будет стоить ${a} в будущем`,
    growth: "Рост цен",
    avgLabel: "Средняя инфляция в год",
    avgSub: (x: string) => `цены выросли в ${x} раза`,
    cumLabel: "Накопленная инфляция",
    cumSub: (a: string, b: string) => `${a} превратятся в ${b}`,
    invalidList: "Проверьте список: только числа через пробел или «;»",
    enter: "Заполните поля",
    chart: "Как растёт цена",
    price: "Цена",
    yearsForms: ["год", "года", "лет"],
  },
  en: {
    mode: "What to calculate",
    future: "Future price",
    average: "Average inflation",
    yearly: "Year by year",
    amount: "Amount today",
    rate: "Inflation, % per year",
    rateHint: "Enter your own estimate — no official statistics are filled in",
    years: "Years from now",
    p1: "Price then",
    p2: "Price now",
    period: "Years passed",
    list: "Inflation by year, %",
    listHint: "Separated by spaces or semicolons: 3.2; 4.1; 2.9",
    futureLabel: (y: string) => `Will cost in ${y}`,
    ppLabel: "Purchasing power",
    ppHint: (a: string) => `what ${a} in the future is worth in today's money`,
    growth: "Price growth",
    avgLabel: "Average inflation per year",
    avgSub: (x: string) => `prices rose ${x} times`,
    cumLabel: "Cumulative inflation",
    cumSub: (a: string, b: string) => `${a} becomes ${b}`,
    invalidList: "Check the list: numbers separated by spaces or ';'",
    enter: "Fill in the fields",
    chart: "How the price grows",
    price: "Price",
    yearsForms: ["year", "years"],
  },
} as const;

const MODES = ["future", "average", "yearly"] as const;

export default function Inflation({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const q = useQueryState(
    { k: "future", a: toInput(locale, ru ? 100_000 : 1_000), r: toInput(locale, ru ? 8 : 3), y: "10", p1: toInput(locale, ru ? 250 : 2.5), p2: toInput(locale, ru ? 400 : 3.6), n: "5", l: ru ? "8; 9; 10; 8,5; 7" : "3; 4; 5; 3.5; 2.5", c: defCur },
    { enums: { k: MODES, c: CURRENCIES } },
  );
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur, v >= 1000 ? 0 : 2);
  const mode = q.v.k as (typeof MODES)[number];
  const A = field(locale, q.v.a, { min: 0 });
  const R = field(locale, q.v.r, { gt: -100, max: 1000 });
  const Y = field(locale, q.v.y, { min: 0, max: 200 });
  const P1 = field(locale, q.v.p1, { gt: 0 });
  const P2 = field(locale, q.v.p2, { gt: 0 });
  const NY = field(locale, q.v.n, { gt: 0, max: 200 });
  const tokens = q.v.l.split(/[\s;]+/).filter(Boolean);
  const listVals = tokens.map((x) => parseLocaleNumber(locale, x));
  const listOk = tokens.length > 0 && listVals.every((x) => x !== null && x > -100);
  const yearsText = (n: number) => `${toInput(locale, n)} ${plural(locale, n, t.yearsForms)}`;

  let label = "";
  let value = "—";
  let sub: string = t.enter;
  let rows: { label: string; value: string; hint?: string }[] | undefined;
  let chart: { x: number[]; y: number[] } | null = null;

  if (mode === "future") {
    label = t.futureLabel(Y.value !== null ? yearsText(Y.value) : "…");
    if (A.value !== null && R.value !== null && Y.value !== null) {
      const fc = futureCost(A.value, R.value, Y.value);
      const pv = presentValue(A.value, R.value, Y.value);
      value = money(fc);
      sub = `${t.growth}: ${fmtPct(locale, (fc / A.value - 1) * 100 || 0, 1)}`;
      rows = [{ label: t.ppLabel, value: money(pv), hint: t.ppHint(money(A.value)) }];
      const years = Math.min(100, Math.ceil(Y.value));
      if (years >= 2) chart = { x: Array.from({ length: years + 1 }, (_, i) => i), y: Array.from({ length: years + 1 }, (_, i) => futureCost(A.value!, R.value!, i)) };
    }
  } else if (mode === "average") {
    label = t.avgLabel;
    if (P1.value !== null && P2.value !== null && NY.value !== null) {
      value = fmtPct(locale, averageRate(P1.value, P2.value, NY.value), 2);
      sub = t.avgSub(toInput(locale, Math.round((P2.value / P1.value) * 100) / 100));
    }
  } else {
    label = t.cumLabel;
    if (listOk && A.value !== null) {
      const rates = listVals as number[];
      const cum = cumulative(rates);
      value = fmtPct(locale, cum, 2);
      sub = t.cumSub(money(A.value), money(A.value * (1 + cum / 100)));
      chart = { x: rates.map((_, i) => i).concat(rates.length), y: [A.value, ...rates.map((_, i) => A.value! * (1 + cumulative(rates.slice(0, i + 1)) / 100))] };
    } else if (!listOk) sub = t.invalidList;
  }

  const inputs = (
    <>
      <Segmented
        label={t.mode}
        value={mode}
        onChange={(k) => q.set({ k })}
        options={[
          { value: "future", label: t.future },
          { value: "average", label: t.average },
          { value: "yearly", label: t.yearly },
        ]}
      />
      {mode === "future" && (
        <>
          <NumField id={`${id}-a`} label={t.amount} value={q.v.a} onChange={(a) => q.set({ a })} suffix={sym} error={A.message} size="lg" />
          <FieldRow>
            <NumField id={`${id}-r`} label={t.rate} value={q.v.r} onChange={(r) => q.set({ r })} suffix="%" error={R.message} size="lg" />
            <NumField id={`${id}-y`} label={t.years} value={q.v.y} onChange={(y) => q.set({ y })} error={Y.message} size="lg" />
          </FieldRow>
          <p className="text-[0.8125rem] text-fg-3">{t.rateHint}</p>
        </>
      )}
      {mode === "average" && (
        <>
          <FieldRow>
            <NumField id={`${id}-p1`} label={t.p1} value={q.v.p1} onChange={(p1) => q.set({ p1 })} suffix={sym} error={P1.message} size="lg" />
            <NumField id={`${id}-p2`} label={t.p2} value={q.v.p2} onChange={(p2) => q.set({ p2 })} suffix={sym} error={P2.message} size="lg" />
          </FieldRow>
          <NumField id={`${id}-n`} label={t.period} value={q.v.n} onChange={(n) => q.set({ n })} error={NY.message} />
        </>
      )}
      {mode === "yearly" && (
        <>
          <NumField id={`${id}-a2`} label={t.amount} value={q.v.a} onChange={(a) => q.set({ a })} suffix={sym} error={A.message} size="lg" />
          <Field label={t.list} htmlFor={`${id}-l`} hint={t.listHint} error={!listOk && tokens.length ? t.invalidList : undefined}>
            <Input id={`${id}-l`} value={q.v.l} onChange={(e) => q.set({ l: e.target.value })} autoComplete="off" spellCheck={false} aria-invalid={!listOk} className="tabular" />
          </Field>
        </>
      )}
      <OptionsRow>
        <CurrencySelect id={`${id}-c`} locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
    </>
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={<ResultMain label={label} value={value} sub={sub} rows={rows} actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />} />} />
      {chart && (
        <section>
          <SubHeading>{t.chart}</SubHeading>
          <LineChart
            ariaLabel={t.chart}
            x={chart.x}
            series={[{ label: t.price, values: chart.y, tone: "warn", area: true }]}
            xFormat={(y) => (ru ? `${y} г.` : `yr ${y}`)}
            yFormat={(v) => fmtCompact(locale, v)}
            zeroBased={false}
          />
        </section>
      )}
      {ru ? (
        <Explain
          locale={locale}
          formula={["Цена через n лет = Сумма × (1 + i)^n", "Покупательная способность = Сумма / (1 + i)^n", "Средняя инфляция = (Цена сейчас / Цена тогда)^(1/n) − 1", "Накопленная = (1 + i₁) × (1 + i₂) × … − 1"]}
          notes={[
            "Инфляция накапливается как сложные проценты: 10 % за два года подряд — это не 20 %, а 21 %.",
            "Ставку инфляции вы задаёте сами — калькулятор не подставляет официальные данные. Для прогноза можно взять цель центрального банка или свою оценку роста цен.",
            "Средняя инфляция по двум ценам показывает, на сколько процентов в год в среднем дорожал товар.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Price in n years = Amount × (1 + i)^n", "Purchasing power = Amount / (1 + i)^n", "Average inflation = (Price now / Price then)^(1/n) − 1", "Cumulative = (1 + i₁) × (1 + i₂) × … − 1"]}
          notes={[
            "Inflation compounds: 10% two years in a row is 21%, not 20%.",
            "You enter the inflation rate yourself — no official data is filled in. For a forecast you can use the central bank's target or your own estimate.",
            "Average inflation from two prices shows how much the item got more expensive per year on average.",
          ]}
        />
      )}
    </Stack>
  );
}

