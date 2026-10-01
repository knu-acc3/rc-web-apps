"use client";

import { useId } from "react";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { CURRENCIES, CURRENCY_SYMBOL, fmtMoney, fmtPct, isCurrency, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { Advanced, CalcGrid, Explain, FieldRow, NumField, OptionsRow, ResultMain, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { discountPercent, discountPrice, originalPrice, stackedDiscount } from "../lib/money";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    mode: "Что посчитать",
    final: "Цена со скидкой",
    original: "Цена до скидки",
    percent: "Процент скидки",
    price: "Цена",
    salePrice: "Цена со скидкой",
    oldPrice: "Цена до скидки",
    pct: "Скидка, %",
    second: "Вторая скидка поверх первой",
    pct2: "Ещё скидка, %",
    saved: "Экономия",
    effective: "Итоговая скидка",
    subSaved: (v: string) => `экономия ${v}`,
    subPct: (v: string) => `скидка ${v} от цены`,
    subOrig: (v: string) => `скидка составила ${v}`,
    enter: "Заполните поля",
    tooBig: "Скидка должна быть меньше 100 %",
  },
  en: {
    mode: "What to calculate",
    final: "Sale price",
    original: "Original price",
    percent: "Discount percent",
    price: "Price",
    salePrice: "Sale price",
    oldPrice: "Original price",
    pct: "Discount, %",
    second: "Second discount on top",
    pct2: "Extra discount, %",
    saved: "You save",
    effective: "Total discount",
    subSaved: (v: string) => `you save ${v}`,
    subPct: (v: string) => `discount of ${v}`,
    subOrig: (v: string) => `the discount was ${v}`,
    enter: "Fill in the fields",
    tooBig: "The discount must be below 100%",
  },
} as const;

const MODES = ["final", "original", "percent"] as const;

export default function Discount({ locale, mode = "final" }: ToolProps<{ mode?: (typeof MODES)[number] }>) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const q = useQueryState(
    { m: mode, p: toInput(locale, ru ? 25_000 : 250), d: "20", d2: "", s: toInput(locale, ru ? 18_000 : 180), c: defCur },
    { enums: { m: MODES, c: CURRENCIES } },
  );
  const m = q.v.m as (typeof MODES)[number];
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur);
  const P = field(locale, q.v.p, { min: 0 });
  const D = field(locale, q.v.d, { min: 0, max: m === "original" ? 99.99 : 100 });
  const D2 = field(locale, q.v.d2, { min: 0, max: 100 });
  const S = field(locale, q.v.s, { min: 0 });

  let label: string = t.final;
  let value = "—";
  let sub: string = t.enter;
  let rows: { label: string; value: string }[] | undefined;
  if (m === "final" && P.value !== null && D.value !== null) {
    const pcts = D2.value ? [D.value, D2.value] : [D.value];
    const eff = stackedDiscount(pcts);
    const r = discountPrice(P.value, eff);
    value = money(r.final);
    sub = t.subSaved(money(r.saved));
    rows = [
      { label: t.saved, value: money(r.saved) },
      ...(D2.value ? [{ label: t.effective, value: fmtPct(locale, eff, 2) }] : []),
    ];
  } else if (m === "original") {
    label = t.original;
    if (S.value !== null && D.value !== null) {
      const o = originalPrice(S.value, D.value);
      if (o !== null) {
        value = money(o);
        sub = t.subOrig(money(o - S.value));
      } else sub = t.tooBig;
    }
  } else if (m === "percent") {
    label = t.percent;
    if (P.value !== null && S.value !== null) {
      const d = discountPercent(P.value, S.value);
      if (d !== null) {
        value = fmtPct(locale, d, 2);
        sub = t.subSaved(money(P.value - S.value));
      }
    }
  }

  const inputs = (
    <>
      <Segmented
        label={t.mode}
        value={m}
        onChange={(v) => q.set({ m: v })}
        options={[
          { value: "final", label: t.final },
          { value: "original", label: t.original },
          { value: "percent", label: t.percent },
        ]}
      />
      {m === "final" && (
        <FieldRow>
          <NumField id={`${id}-p`} label={t.price} value={q.v.p} onChange={(p) => q.set({ p })} suffix={sym} error={P.message} size="lg" />
          <NumField id={`${id}-d`} label={t.pct} value={q.v.d} onChange={(d) => q.set({ d })} suffix="%" error={D.message} size="lg" />
        </FieldRow>
      )}
      {m === "original" && (
        <FieldRow>
          <NumField id={`${id}-s`} label={t.salePrice} value={q.v.s} onChange={(s) => q.set({ s })} suffix={sym} error={S.message} size="lg" />
          <NumField id={`${id}-d`} label={t.pct} value={q.v.d} onChange={(d) => q.set({ d })} suffix="%" error={D.message} size="lg" />
        </FieldRow>
      )}
      {m === "percent" && (
        <FieldRow>
          <NumField id={`${id}-p`} label={t.oldPrice} value={q.v.p} onChange={(p) => q.set({ p })} suffix={sym} error={P.message} size="lg" />
          <NumField id={`${id}-s`} label={t.salePrice} value={q.v.s} onChange={(s) => q.set({ s })} suffix={sym} error={S.message} size="lg" />
        </FieldRow>
      )}
      <OptionsRow>
        <CurrencySelect id={`${id}-c`} locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
      {m === "final" && (
        <Advanced title={t.second} open={!!q.v.d2}>
          <NumField id={`${id}-d2`} label={t.pct2} value={q.v.d2} onChange={(d2) => q.set({ d2 })} suffix="%" error={D2.message} placeholder="0" />
        </Advanced>
      )}
    </>
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={<ResultMain label={label} value={value} sub={sub} rows={rows} actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />} />} />
      {ru ? (
        <Explain
          locale={locale}
          formula={["Цена со скидкой = Цена × (1 − скидка / 100)", "Цена до скидки = Цена со скидкой / (1 − скидка / 100)", "Скидка, % = (Цена до − Цена после) / Цена до × 100", "Две скидки: 1 − (1 − d₁)(1 − d₂)"]}
          notes={["Скидки подряд не складываются, а перемножаются: 20 % и ещё 10 % дают 28 %, а не 30 %.", "Суммы округляются до тиынов или копеек. Валюта — только подпись."]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Sale price = Price × (1 − discount / 100)", "Original price = Sale price / (1 − discount / 100)", "Discount % = (Original − Sale) / Original × 100", "Two discounts: 1 − (1 − d₁)(1 − d₂)"]}
          notes={["Consecutive discounts multiply rather than add: 20% plus 10% is 28%, not 30%.", "Amounts are rounded to cents. The currency is only a label."]}
        />
      )}
    </Stack>
  );
}
