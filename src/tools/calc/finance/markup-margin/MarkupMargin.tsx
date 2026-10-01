"use client";

import { useId } from "react";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { CURRENCIES, CURRENCY_SYMBOL, fmtMoney, fmtPct, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { CalcGrid, DataTable, Explain, NumSlider, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { fromCostPrice, markupToMargin, priceFromMargin, priceFromMarkup, type MarginResult } from "../lib/money";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    mode: "Что известно",
    mPrice: "Цена",
    mMarkup: "Наценка",
    mMargin: "Маржа",
    cost: "Себестоимость (закупка)",
    price: "Цена продажи",
    markupPct: "Наценка",
    marginPct: "Маржа",
    markup: "Наценка",
    margin: "Маржа",
    profit: "Прибыль с единицы",
    salePrice: "Цена продажи",
    enter: "Заполните поля",
    bad: "Маржа должна быть меньше 100 %",
    sub: (m: string) => `маржа ${m}`,
    subP: (p: string) => `прибыль ${p} с единицы`,
    table: "Наценка и маржа: соответствие",
  },
  en: {
    mode: "What you know",
    mPrice: "Price",
    mMarkup: "Markup",
    mMargin: "Margin",
    cost: "Cost",
    price: "Selling price",
    markupPct: "Markup",
    marginPct: "Margin",
    markup: "Markup",
    margin: "Margin",
    profit: "Profit per unit",
    salePrice: "Selling price",
    enter: "Fill in the fields",
    bad: "Margin must be below 100%",
    sub: (m: string) => `margin ${m}`,
    subP: (p: string) => `profit ${p} per unit`,
    table: "Markup vs margin",
  },
} as const;

const MODES = ["price", "markup", "margin"] as const;
const TABLE = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200];

export default function MarkupMargin({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const q = useQueryState({ m: "price", c1: toInput(locale, ru ? 8_000 : 80), p: toInput(locale, ru ? 10_000 : 100), x: "25", c: defCur }, { enums: { m: MODES, c: CURRENCIES } });
  const m = q.v.m as (typeof MODES)[number];
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur);
  const pct = (v: number | null) => (v === null ? "—" : fmtPct(locale, v, 2));
  const C = field(locale, q.v.c1, { min: 0 });
  const P = field(locale, q.v.p, { min: 0 });
  const X = field(locale, q.v.x, m === "margin" ? { max: 99.99 } : { min: -100 });

  let r: MarginResult | null = null;
  let err: string | undefined;
  if (C.value !== null) {
    if (m === "price" && P.value !== null) r = fromCostPrice(C.value, P.value);
    if (m === "markup" && X.value !== null) r = priceFromMarkup(C.value, X.value);
    if (m === "margin" && X.value !== null) {
      r = priceFromMargin(C.value, X.value);
      if (!r) err = t.bad;
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
          { value: "price", label: t.mPrice },
          { value: "markup", label: t.mMarkup },
          { value: "margin", label: t.mMargin },
        ]}
      />
      <NumSlider id={`${id}-c1`} locale={locale} label={t.cost} value={q.v.c1} onChange={(c1) => q.set({ c1 })} suffix={sym} error={C.message} min={0} max={moneyMax(cur, 1_000_000)} scale="log" />
      {m === "price" ? (
        <NumSlider id={`${id}-p`} locale={locale} label={t.price} value={q.v.p} onChange={(p) => q.set({ p })} suffix={sym} error={P.message} min={0} max={moneyMax(cur, 1_000_000)} scale="log" />
      ) : (
        <NumSlider id={`${id}-x`} locale={locale} label={m === "markup" ? t.markupPct : t.marginPct} value={q.v.x} onChange={(x) => q.set({ x })} suffix="%" error={X.message ?? err} min={0} max={m === "markup" ? 200 : 90} />
      )}
      <OptionsRow>
        <CurrencySelect locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
    </>
  );

  const result =
    m === "price" ? (
      <ResultMain
        label={t.markup}
        value={r ? pct(r.markup) : "—"}
        sub={r ? t.sub(pct(r.margin)) : t.enter}
        rows={r ? [{ label: t.margin, value: pct(r.margin) }, { label: t.profit, value: money(r.profit) }] : undefined}
        actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
      />
    ) : (
      <ResultMain
        label={t.salePrice}
        value={r ? money(r.price) : "—"}
        sub={r ? t.subP(money(r.profit)) : (err ?? t.enter)}
        rows={r ? [m === "markup" ? { label: t.margin, value: pct(r.margin) } : { label: t.markup, value: pct(r.markup) }, { label: t.profit, value: money(r.profit) }] : undefined}
        actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
      />
    );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      <section>
        <SubHeading>{t.table}</SubHeading>
        <DataTable caption={t.table} head={[t.markup, t.margin]} rows={TABLE.map((x) => [pct(x), pct(markupToMargin(x))])} />
      </section>
      {ru ? (
        <Explain
          locale={locale}
          formula={["Наценка = (Цена − Себестоимость) / Себестоимость × 100 %", "Маржа = (Цена − Себестоимость) / Цена × 100 %", "Маржа = Наценка / (100 + Наценка) × 100 %"]}
          notes={["Наценка считается от себестоимости, маржа — от цены продажи, поэтому маржа всегда меньше наценки.", "Маржа не может быть 100 % и больше, а наценка ограничений не имеет.", "Налоги (в том числе НДС) и прочие расходы в расчёт не входят."]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Markup = (Price − Cost) / Cost × 100%", "Margin = (Price − Cost) / Price × 100%", "Margin = Markup / (100 + Markup) × 100%"]}
          notes={["Markup is relative to cost and margin relative to price, so the margin is always lower than the markup.", "Margin cannot reach 100%, while markup has no upper limit.", "Taxes (including VAT) and other expenses are not included."]}
        />
      )}
    </Stack>
  );
}
