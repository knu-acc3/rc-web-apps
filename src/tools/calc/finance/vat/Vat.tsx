"use client";

import { useId } from "react";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { CURRENCIES, CURRENCY_SYMBOL, fmtMoney, fmtPct, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { CalcGrid, Disclaimer, Explain, NumSlider, OptionsRow, ResultMain, SelectField, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { addVat, extractVat, VAT_PRESETS } from "../lib/money";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    mode: "Что сделать",
    add: "Начислить НДС",
    extract: "Выделить НДС",
    amountNet: "Сумма без НДС",
    amountGross: "Сумма с НДС",
    rate: "Ставка",
    custom: "своя ставка",
    customRate: "Ставка НДС",
    presets: {
      "kz-2026": "Казахстан с 2026 — 16 %",
      "kz-2025": "Казахстан до 2026 — 12 %",
      "ru-2026": "Россия с 2026 — 22 %",
      "ru-2025": "Россия до 2026 — 20 %",
      "ru-10": "Россия, льготная — 10 %",
    } as Record<string, string>,
    withVat: "Сумма с НДС",
    vatIn: "НДС в сумме",
    vat: "НДС",
    net: "Без НДС",
    gross: "С НДС",
    subAdd: (v: string, r: string) => `в том числе НДС ${r} — ${v}`,
    subExtract: (net: string) => `сумма без НДС — ${net}`,
    enter: "Введите сумму",
    verify: "Ставки НДС меняются: в Казахстане с 1 января 2026 года действует новый Налоговый кодекс, в России ставка с 2026 года — 22 %. Проверьте ставку для вашей операции — есть льготные и нулевые ставки.",
  },
  en: {
    mode: "Mode",
    add: "Add VAT",
    extract: "Extract VAT",
    amountNet: "Amount excluding VAT",
    amountGross: "Amount including VAT",
    rate: "Rate",
    custom: "custom rate",
    customRate: "VAT rate",
    presets: {
      "kz-2026": "Kazakhstan from 2026 — 16%",
      "kz-2025": "Kazakhstan before 2026 — 12%",
      "ru-2026": "Russia from 2026 — 22%",
      "ru-2025": "Russia before 2026 — 20%",
      "ru-10": "Russia, reduced — 10%",
    } as Record<string, string>,
    withVat: "Amount including VAT",
    vatIn: "VAT included",
    vat: "VAT",
    net: "Excluding VAT",
    gross: "Including VAT",
    subAdd: (v: string, r: string) => `including ${r} VAT of ${v}`,
    subExtract: (net: string) => `amount excluding VAT — ${net}`,
    enter: "Enter an amount",
    verify: "VAT rates change: Kazakhstan's new Tax Code applies from 1 January 2026, and Russia's standard rate is 22% from 2026. Check the rate for your transaction — reduced and zero rates exist.",
  },
} as const;

const MODES = ["add", "extract"] as const;
const PRESET_IDS = [...VAT_PRESETS.map((p) => p.id), "custom"] as const;

export default function Vat({ locale, preset = "kz-2026", mode = "add", amount = 100_000 }: ToolProps<{ preset?: string; mode?: "add" | "extract"; amount?: number }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState(
    { a: toInput(locale, amount), m: mode, p: preset, r: "16", c: locale === "ru" ? "KZT" : "USD" },
    { enums: { m: MODES, p: PRESET_IDS, c: CURRENCIES } },
  );
  const m = q.v.m as (typeof MODES)[number];
  const p = VAT_PRESETS.find((x) => x.id === q.v.p);
  const cur: Currency = p ? (p.country === "kz" ? "KZT" : "RUB") : isCurrency(q.v.c) ? q.v.c : "KZT";
  const sym = CURRENCY_SYMBOL[cur];
  const money = (v: number) => fmtMoney(locale, v, cur);
  const A = field(locale, q.v.a, { min: 0, max: 1e13 });
  const R = field(locale, q.v.r, { min: 0, max: 100 });
  const rate = p ? p.rate : R.value;
  const res = A.value !== null && rate !== null ? (m === "add" ? addVat(A.value, rate) : extractVat(A.value, rate)) : null;
  const rateText = rate !== null ? fmtPct(locale, rate) : "";

  const inputs = (
    <>
      <Segmented
        label={t.mode}
        fill
        value={m}
        onChange={(v) => q.set({ m: v })}
        options={[
          { value: "add", label: t.add },
          { value: "extract", label: t.extract },
        ]}
      />
      <NumSlider id={`${id}-a`} locale={locale} label={m === "add" ? t.amountNet : t.amountGross} value={q.v.a} onChange={(a) => q.set({ a })} suffix={sym} error={A.message} min={0} max={moneyMax(cur, 10_000_000)} scale="log" />
      <SelectField id={`${id}-p`} label={t.rate} value={q.v.p} onChange={(v) => q.set({ p: v })} options={PRESET_IDS.map((x) => ({ value: x, label: x === "custom" ? t.custom : t.presets[x] }))} />
      {!p && (
        <>
          <NumSlider id={`${id}-r`} locale={locale} label={t.customRate} value={q.v.r} onChange={(r) => q.set({ r })} suffix="%" error={R.message} min={0} max={30} decimals={1} />
          <OptionsRow>
            <CurrencySelect locale={locale} value={cur} onChange={(c) => q.set({ c })} />
          </OptionsRow>
        </>
      )}
    </>
  );

  const result = (
    <ResultMain
      label={m === "add" ? t.withVat : t.vatIn}
      value={res ? money(m === "add" ? res.gross : res.vat) : "—"}
      sub={res ? (m === "add" ? t.subAdd(money(res.vat), rateText) : t.subExtract(money(res.net))) : t.enter}
      rows={
        res
          ? [
              { label: t.net, value: money(res.net) },
              { label: `${t.vat} ${rateText}`, value: money(res.vat) },
              { label: t.gross, value: money(res.gross) },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Начислить: НДС = Сумма × ставка / 100; С НДС = Сумма + НДС", "Выделить: НДС = Сумма × ставка / (100 + ставка)", "Например, при 16 %: НДС = Сумма × 16 / 116"]}
          notes={[
            "Чтобы выделить НДС, нельзя просто взять ставку от суммы: 16 % от 1 160 — это 185,60, а НДС в сумме 1 160 ₸ — 160 ₸.",
            "Суммы округляются до тиынов (копеек) по правилам математического округления.",
            t.verify,
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Add: VAT = Amount × rate / 100; Gross = Amount + VAT", "Extract: VAT = Amount × rate / (100 + rate)", "For example, at 16%: VAT = Amount × 16 / 116"]}
          notes={["To extract VAT you cannot simply take the rate of the gross amount: 16% of 1,160 is 185.60, but the VAT included in 1,160 is 160.", "Amounts are rounded to cents using standard rounding.", t.verify]}
        />
      )}
      <Disclaimer locale={locale} kind="finance" />
    </Stack>
  );
}
