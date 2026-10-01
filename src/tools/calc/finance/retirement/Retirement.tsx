"use client";

import { useId } from "react";
import { plural } from "@/i18n/format";
import type { ToolProps } from "../../../types";
import { LineChart } from "../../shared/charts";
import { CURRENCIES, CURRENCY_SYMBOL, fmtCompact, fmtMoney, fmtN, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { Advanced, CalcGrid, Disclaimer, Explain, FieldRow, NumField, NumSlider, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { retirement } from "../lib/growth";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    age: "Ваш возраст",
    retireAge: "Возраст выхода на пенсию",
    savings: "Уже накоплено",
    monthly: "Откладываю в месяц",
    income: "Желаемый доход на пенсии в месяц",
    incomeHint: "В сегодняшних деньгах",
    returnPre: "Доходность до пенсии",
    returnPost: "Доходность на пенсии",
    inflation: "Инфляция",
    more: "Горизонт и рост взносов",
    endAge: "Планировать до возраста",
    increase: "Рост взносов, % в год",
    nest: "Накопления к пенсии",
    subReal: (v: string) => `в сегодняшних деньгах — ${v}`,
    lasts: (age: string) => `Денег хватит до ${age} лет`,
    lastsAll: (age: string) => `Хватит до ${age} лет и дольше`,
    lastsLabel: "Желаемый доход",
    required: "Нужно накопить к пенсии",
    rule4: "Правило 4 %: безопасно снимать",
    perMonth: (r: string) => `в месяц; в сегодняшних деньгах — ${r}`,
    contributed: "Всего внесёте",
    enter: "Проверьте возраст и суммы",
    ageErr: "Возраст выхода на пенсию должен быть больше текущего",
    chart: "Капитал по возрасту",
    balance: "Капитал",
    yearsOld: ["год", "года", "лет"],
  },
  en: {
    age: "Your age",
    retireAge: "Retirement age",
    savings: "Current savings",
    monthly: "Monthly saving",
    income: "Desired monthly income in retirement",
    incomeHint: "In today's money",
    returnPre: "Return before retirement",
    returnPost: "Return in retirement",
    inflation: "Inflation",
    more: "Horizon and contribution growth",
    endAge: "Plan until age",
    increase: "Contribution growth, % per year",
    nest: "Savings at retirement",
    subReal: (v: string) => `in today's money — ${v}`,
    lasts: (age: string) => `Money lasts until age ${age}`,
    lastsAll: (age: string) => `Lasts to age ${age} and beyond`,
    lastsLabel: "Desired income",
    required: "Needed at retirement",
    rule4: "4% rule: safe withdrawal",
    perMonth: (r: string) => `per month; in today's money — ${r}`,
    contributed: "Total contributions",
    enter: "Check the ages and amounts",
    ageErr: "Retirement age must be greater than your age",
    chart: "Balance by age",
    balance: "Balance",
    yearsOld: ["year", "years"],
  },
} as const;

export default function Retirement({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const q = useQueryState(
    {
      a: "30",
      ra: ru ? "60" : "65",
      ea: ru ? "85" : "90",
      s: toInput(locale, ru ? 1_000_000 : 10_000),
      m: toInput(locale, ru ? 50_000 : 500),
      inc: toInput(locale, ru ? 300_000 : 3_000),
      rp: toInput(locale, ru ? 10 : 7),
      rq: toInput(locale, ru ? 6 : 4),
      n: toInput(locale, ru ? 7 : 3),
      g: toInput(locale, ru ? 5 : 2),
      c: defCur,
    },
    { enums: { c: CURRENCIES } },
  );
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur, 0);
  const A = field(locale, q.v.a, { min: 14, max: 100, int: true });
  const RA = field(locale, q.v.ra, { min: 20, max: 100, int: true });
  const EA = field(locale, q.v.ea, { min: 30, max: 120, int: true });
  const S = field(locale, q.v.s, { min: 0 });
  const M = field(locale, q.v.m, { min: 0 });
  const INC = field(locale, q.v.inc, { min: 0 });
  const RP = field(locale, q.v.rp, { gt: -50, max: 50 });
  const RQ = field(locale, q.v.rq, { gt: -50, max: 50 });
  const N = field(locale, q.v.n, { gt: -20, max: 100 });
  const G = field(locale, q.v.g, { min: -50, max: 100 });
  const ageErr = A.value !== null && RA.value !== null && RA.value <= A.value ? t.ageErr : undefined;
  const endErr = RA.value !== null && EA.value !== null && EA.value <= RA.value ? t.ageErr : undefined;
  const ok = [A, RA, EA, S, M, INC, RP, RQ, N, G].every((x) => x.value !== null || (x === G && x.empty)) && !ageErr && !endErr;
  const res = ok
    ? retirement({
        age: A.value!,
        retireAge: RA.value!,
        endAge: EA.value!,
        savings: S.value!,
        monthly: M.value!,
        increase: G.value ?? 0,
        returnPre: RP.value!,
        returnPost: RQ.value!,
        inflation: N.value!,
        income: INC.value!,
      })
    : null;
  const ageText = (x: number) => fmtN(locale, Math.floor(x), 0);

  const inputs = (
    <>
      <FieldRow className="gap-x-6 gap-y-5">
        <NumSlider id={`${id}-a`} locale={locale} label={t.age} value={q.v.a} onChange={(a) => q.set({ a })} error={A.message} min={14} max={80} />
        <NumSlider id={`${id}-ra`} locale={locale} label={t.retireAge} value={q.v.ra} onChange={(ra) => q.set({ ra })} error={RA.message ?? ageErr} min={40} max={80} />
      </FieldRow>
      <NumSlider id={`${id}-s`} locale={locale} label={t.savings} value={q.v.s} onChange={(s) => q.set({ s })} suffix={sym} error={S.message} min={0} max={moneyMax(cur, 50_000_000)} scale="log" />
      <NumSlider id={`${id}-m`} locale={locale} label={t.monthly} value={q.v.m} onChange={(m) => q.set({ m })} suffix={sym} error={M.message} min={0} max={moneyMax(cur, 1_000_000)} scale="log" />
      <NumSlider id={`${id}-inc`} locale={locale} label={t.income} hint={t.incomeHint} value={q.v.inc} onChange={(inc) => q.set({ inc })} suffix={sym} error={INC.message} min={0} max={moneyMax(cur, 3_000_000)} scale="log" />
      <div className="grid gap-x-6 gap-y-5 min-[480px]:grid-cols-3">
        <NumSlider id={`${id}-rp`} locale={locale} label={t.returnPre} value={q.v.rp} onChange={(rp) => q.set({ rp })} error={RP.message} min={0} max={25} decimals={1} suffix="%" />
        <NumSlider id={`${id}-rq`} locale={locale} label={t.returnPost} value={q.v.rq} onChange={(rq) => q.set({ rq })} error={RQ.message} min={0} max={25} decimals={1} suffix="%" />
        <NumSlider id={`${id}-n`} locale={locale} label={t.inflation} value={q.v.n} onChange={(n) => q.set({ n })} error={N.message} min={0} max={30} decimals={1} suffix="%" />
      </div>
      <OptionsRow>
        <CurrencySelect id={`${id}-c`} locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
      <Advanced title={t.more}>
        <FieldRow className="gap-x-6 gap-y-5">
          <NumSlider id={`${id}-ea`} locale={locale} label={t.endAge} value={q.v.ea} onChange={(ea) => q.set({ ea })} error={EA.message ?? endErr} min={60} max={110} />
          <NumField id={`${id}-g`} label={t.increase} value={q.v.g} onChange={(g) => q.set({ g })} suffix="%" error={G.message} placeholder="0" />
        </FieldRow>
      </Advanced>
    </>
  );

  const result = (
    <ResultMain
      label={t.nest}
      value={res ? money(res.nestEgg) : "—"}
      sub={res ? t.subReal(money(res.nestEggReal)) : (ageErr ?? endErr ?? t.enter)}
      rows={
        res && EA.value !== null
          ? [
              {
                label: t.lastsLabel,
                value: res.depletedAge === null ? t.lastsAll(ageText(EA.value)) : t.lasts(ageText(res.depletedAge)),
              },
              { label: t.required, value: money(res.required), hint: ru ? `чтобы получать ${money(INC.value ?? 0)} в сегодняшних деньгах до ${ageText(EA.value)} лет` : `to receive ${money(INC.value ?? 0)} in today's money until age ${ageText(EA.value)}` },
              { label: t.rule4, value: money(res.rule4Monthly), hint: t.perMonth(money(res.rule4MonthlyReal)) },
              { label: t.contributed, value: money(res.contributed) },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {res && res.points.length > 2 && (
        <section>
          <SubHeading>{t.chart}</SubHeading>
          <LineChart
            ariaLabel={t.chart}
            x={res.points.map((p) => p.age)}
            series={[{ label: t.balance, values: res.points.map((p) => p.balance), tone: "accent", area: true }]}
            xFormat={(a) => `${ageText(a)} ${plural(locale, Math.floor(a), t.yearsOld)}`}
            yFormat={(v) => fmtCompact(locale, v)}
          />
        </section>
      )}
      {ru ? (
        <Explain
          locale={locale}
          formula={["До пенсии: Капитал = Капитал × (1 + r₁)^(1/12) + взнос (каждый месяц)", "На пенсии: Капитал = (Капитал − выплата) × (1 + r₂)^(1/12)", "Правило 4 %: безопасная выплата в год = 4 % × Капитал на старте пенсии"]}
          notes={[
            "Желаемый доход задаётся в сегодняшних деньгах: к выходу на пенсию он индексируется на инфляцию и дальше растёт вместе с ней каждый год.",
            "«Нужно накопить» — сумма, которой при доходности на пенсии хватит на выплаты до выбранного возраста (приведённая стоимость всех будущих выплат).",
            "Правило 4 % пришло из американских исследований 1990-х (Bengen, Trinity study): при снятии 4 % в первый год с последующей индексацией портфель из акций и облигаций исторически выдерживал около 30 лет. Это ориентир, а не гарантия; для других рынков и сроков безопасная доля может быть ниже.",
            "Государственная пенсия и пенсионные взносы (ЕНПФ, ОПС) здесь не учитываются — добавьте их к своим накоплениям, если знаете прогноз.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Before retirement: Balance = Balance × (1 + r₁)^(1/12) + contribution (monthly)", "In retirement: Balance = (Balance − withdrawal) × (1 + r₂)^(1/12)", "4% rule: safe first-year withdrawal = 4% × balance at retirement"]}
          notes={[
            "The desired income is in today's money: it is indexed to inflation until retirement and keeps rising with inflation every year after that.",
            "'Needed at retirement' is the amount that, at the retirement return, funds the withdrawals until the chosen age (present value of all future withdrawals).",
            "The 4% rule comes from US research in the 1990s (Bengen, the Trinity study): withdrawing 4% in the first year and adjusting for inflation historically lasted about 30 years for a stock/bond portfolio. It is a guide, not a guarantee; the safe rate may be lower for other markets and horizons.",
            "State pensions are not included — add them to your savings if you know the forecast.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="finance" />
    </Stack>
  );
}
