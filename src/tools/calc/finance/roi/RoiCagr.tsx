"use client";

import { useId } from "react";
import { plural } from "@/i18n/format";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { CURRENCIES, CURRENCY_SYMBOL, fmtMoney, fmtPct, fmtRound, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { CalcGrid, Explain, NumSlider, OptionsRow, ResultMain, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { cagr, roi } from "../lib/money";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    mode: "Показатель",
    roi: "ROI",
    cagr: "CAGR",
    invested: "Вложено",
    final: "Получено (итоговая стоимость)",
    start: "Начальная стоимость",
    end: "Конечная стоимость",
    years: "Срок",
    yearsOpt: "Срок (необязательно)",
    yearForms: ["год", "года", "лет"],
    roiLabel: "Доходность вложений (ROI)",
    cagrLabel: "Среднегодовой рост (CAGR)",
    profit: (v: string) => `прибыль ${v}`,
    loss: (v: string) => `убыток ${v}`,
    annual: "В среднем за год",
    total: "Общий рост",
    multiple: "Во сколько раз",
    enter: "Заполните суммы",
    badStart: "Начальная сумма должна быть больше нуля",
  },
  en: {
    mode: "Metric",
    roi: "ROI",
    cagr: "CAGR",
    invested: "Amount invested",
    final: "Final value",
    start: "Starting value",
    end: "Ending value",
    years: "Term",
    yearsOpt: "Term (optional)",
    yearForms: ["year", "years"],
    roiLabel: "Return on investment (ROI)",
    cagrLabel: "Compound annual growth rate (CAGR)",
    profit: (v: string) => `profit ${v}`,
    loss: (v: string) => `loss ${v}`,
    annual: "Per year on average",
    total: "Total growth",
    multiple: "Growth multiple",
    enter: "Fill in the amounts",
    badStart: "The starting value must be greater than zero",
  },
} as const;

const MODES = ["roi", "cagr"] as const;

export default function RoiCagr({ locale, mode = "roi" }: ToolProps<{ mode?: (typeof MODES)[number] }>) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const q = useQueryState(
    { m: mode, a: toInput(locale, ru ? 1_000_000 : 10_000), b: toInput(locale, ru ? 1_500_000 : 15_000), y: mode === "cagr" ? "5" : "", c: defCur },
    { enums: { m: MODES, c: CURRENCIES } },
  );
  const m = q.v.m as (typeof MODES)[number];
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur, 0);
  const A = field(locale, q.v.a, { min: 0 });
  const B = field(locale, q.v.b, { min: 0 });
  const Y = field(locale, q.v.y, { gt: 0, max: 200 });
  const signed = (v: number) => (v > 0 ? `+${fmtPct(locale, v, 2)}` : fmtPct(locale, v, 2).replace("-", "−"));

  const label: string = m === "roi" ? t.roiLabel : t.cagrLabel;
  let value = "—";
  let sub: string = t.enter;
  let rows: { label: string; value: string }[] | undefined;
  if (A.value !== null && B.value !== null) {
    if (A.value <= 0) sub = t.badStart;
    else if (m === "roi") {
      const r = roi(A.value, B.value)!;
      const d = B.value - A.value;
      value = signed(r);
      sub = d >= 0 ? t.profit(money(d)) : t.loss(money(-d));
      const c = Y.value ? cagr(A.value, B.value, Y.value) : null;
      rows = c !== null ? [{ label: t.annual, value: signed(c) }] : undefined;
    } else if (Y.value !== null) {
      const c = cagr(A.value, B.value, Y.value);
      if (c !== null) {
        value = signed(c);
        sub = `${t.total}: ${signed(roi(A.value, B.value)!)}`;
        rows = [{ label: t.multiple, value: `× ${fmtRound(locale, B.value / A.value, 3)}` }];
      }
    }
  }

  const inputs = (
    <>
      <Segmented
        label={t.mode}
        fill
        value={m}
        onChange={(v) => q.set({ m: v })}
        options={[
          { value: "roi", label: t.roi },
          { value: "cagr", label: t.cagr },
        ]}
      />
      <NumSlider id={`${id}-a`} locale={locale} label={m === "roi" ? t.invested : t.start} value={q.v.a} onChange={(a) => q.set({ a })} suffix={sym} error={A.message} min={0} max={moneyMax(cur, 100_000_000)} scale="log" />
      <NumSlider id={`${id}-b`} locale={locale} label={m === "roi" ? t.final : t.end} value={q.v.b} onChange={(b) => q.set({ b })} suffix={sym} error={B.message} min={0} max={moneyMax(cur, 100_000_000)} scale="log" />
      <NumSlider id={`${id}-y`} locale={locale} label={m === "roi" ? t.yearsOpt : t.years} value={q.v.y} onChange={(y) => q.set({ y })} suffix={plural(locale, Y.value ?? 5, t.yearForms)} error={Y.message} min={1} max={50} />
      <OptionsRow>
        <CurrencySelect locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
    </>
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={<ResultMain label={label} value={value} sub={sub} rows={rows} actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />} />} />
      {ru ? (
        <Explain
          locale={locale}
          formula={["ROI = (Получено − Вложено) / Вложено × 100 %", "CAGR = (Конечная / Начальная)^(1 / лет) − 1"]}
          notes={[
            "ROI показывает общий результат без учёта времени; CAGR — среднегодовой темп, с которым капитал рос бы равномерно.",
            "Срок может быть дробным: 18 месяцев = 1,5 года.",
            "Промежуточные пополнения и выводы не учитываются — для них нужен другой метод (IRR).",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["ROI = (Final − Invested) / Invested × 100%", "CAGR = (End / Start)^(1 / years) − 1"]}
          notes={["ROI is the total result regardless of time; CAGR is the steady yearly rate that would produce the same growth.", "Years may be fractional: 18 months = 1.5 years.", "Intermediate deposits and withdrawals are not handled — that needs another method (IRR)."]}
        />
      )}
    </Stack>
  );
}
