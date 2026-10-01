"use client";

import { useId } from "react";
import { plural } from "@/i18n/format";
import type { ToolProps } from "../../../types";
import { CURRENCIES, CURRENCY_SYMBOL, fmtMoney, fmtPct, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { CalcGrid, Explain, InlineSelect, NumSlider, OptionsRow, ResultMain, SliderRow, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { splitTip } from "../lib/money";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    bill: "Сумма счёта",
    tip: "Чаевые",
    people: "Сколько человек",
    round: "Округлять долю вверх",
    exact: "не округлять",
    perPerson: "С каждого",
    split: (a: string, n1: number, b: string, n2: number) => `${a} — ${n1} ${plural("ru", n1, ["человек", "человека", "человек"])}, ${b} — ${n2} ${plural("ru", n2, ["человек", "человека", "человек"])}`,
    sub: (total: string, tip: string, pct: string) => `итого ${total}, чаевые ${tip} (${pct})`,
    tipRow: "Чаевые",
    total: "Счёт с чаевыми",
    collected: "Соберёте всего",
    actualTip: "Фактические чаевые",
    enter: "Введите сумму счёта",
  },
  en: {
    bill: "Bill amount",
    tip: "Tip",
    people: "Number of people",
    round: "Round each share up",
    exact: "exact",
    perPerson: "Each person pays",
    split: (a: string, n1: number, b: string, n2: number) => `${a} × ${n1}, ${b} × ${n2}`,
    sub: (total: string, tip: string, pct: string) => `total ${total}, tip ${tip} (${pct})`,
    tipRow: "Tip",
    total: "Bill with tip",
    collected: "Collected in total",
    actualTip: "Actual tip",
    enter: "Enter the bill amount",
  },
} as const;

const STEPS = ["0.01", "1", "10", "100", "1000"] as const;

export default function Tip({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const q = useQueryState({ b: toInput(locale, ru ? 18_450 : 86.5), p: "10", n: "3", s: ru ? "100" : "0.01", c: defCur }, { enums: { s: STEPS, c: CURRENCIES } });
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur);
  const B = field(locale, q.v.b, { min: 0 });
  const P = field(locale, q.v.p, { min: 0, max: 100 });
  const N = field(locale, q.v.n, { min: 1, max: 1000, int: true });
  const step = Number(q.v.s);
  const r = B.value !== null && P.value !== null && N.value !== null ? splitTip(B.value, P.value, N.value, step) : null;

  let value = "—";
  let sub: string = t.enter;
  if (r) {
    const hi = r.shares[0];
    const lo = r.shares[r.shares.length - 1];
    const nHi = r.shares.filter((x) => x === hi).length;
    value = money(hi);
    sub = hi !== lo ? t.split(money(hi), nHi, money(lo), r.shares.length - nHi) : t.sub(money(r.collected), money(r.actualTip), fmtPct(locale, r.actualPct, 1));
  }

  const inputs = (
    <>
      <NumSlider id={`${id}-b`} locale={locale} label={t.bill} value={q.v.b} onChange={(b) => q.set({ b })} suffix={sym} error={B.message} min={0} max={moneyMax(cur, 500_000)} scale="log" />
      <SliderRow>
        <NumSlider id={`${id}-p`} locale={locale} label={t.tip} value={q.v.p} onChange={(p) => q.set({ p })} suffix="%" error={P.message} min={0} max={30} />
        <NumSlider id={`${id}-n`} locale={locale} label={t.people} value={q.v.n} onChange={(n) => q.set({ n })} error={N.message} min={1} max={20} />
      </SliderRow>
      <OptionsRow>
        <InlineSelect
          id={`${id}-s`}
          label={t.round}
          value={q.v.s}
          onChange={(s) => q.set({ s })}
          options={STEPS.map((s) => ({ value: s, label: s === "0.01" ? t.exact : `${ru ? "до" : "to"} ${Number(s).toLocaleString(ru ? "ru-RU" : "en-US")} ${sym}` }))}
        />
        <CurrencySelect locale={locale} value={cur} onChange={(c) => q.set({ c })} />
      </OptionsRow>
    </>
  );

  const result = (
    <ResultMain
      label={t.perPerson}
      value={value}
      sub={sub}
      rows={
        r
          ? [
              { label: t.tipRow, value: money(r.tip) },
              { label: t.total, value: money(r.total) },
              ...(r.collected !== r.total
                ? [
                    { label: t.collected, value: money(r.collected) },
                    { label: t.actualTip, value: `${money(r.actualTip)} (${fmtPct(locale, r.actualPct, 1)})` },
                  ]
                : []),
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {ru ? (
        <Explain
          locale={locale}
          formula={["Чаевые = Счёт × процент / 100", "Доля = (Счёт + Чаевые) / число человек"]}
          notes={[
            "Без округления сумма делится до тиына так, чтобы доли в сумме давали ровно итог: 100 ₸ на троих — 33,34 + 33,33 + 33,33.",
            "При округлении вверх каждый платит одинаковую круглую сумму, а излишек добавляется к чаевым — калькулятор показывает фактический процент.",
            "Во многих заведениях Казахстана и России плата за обслуживание уже включена в счёт — проверьте чек, прежде чем добавлять чаевые.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Tip = Bill × percent / 100", "Share = (Bill + Tip) / people"]}
          notes={[
            "Without rounding the total is split to the cent so the shares add up exactly: 100 between three is 33.34 + 33.33 + 33.33.",
            "When rounding up, everyone pays the same round amount and the extra goes to the tip — the calculator shows the actual percentage.",
            "Some restaurants already include a service charge — check the bill before adding a tip.",
          ]}
        />
      )}
    </Stack>
  );
}
