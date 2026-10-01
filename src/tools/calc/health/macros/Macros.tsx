"use client";

import { useId } from "react";
import type { ToolProps } from "../../../types";
import { Donut } from "../../shared/charts";
import { fmtRound } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { Advanced, CalcGrid, Disclaimer, Explain, NumSlider, ResultMain, SliderRow, Stack, SubHeading, ToggleField, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { KCAL_PER_G, MACRO_PRESETS, macroGrams, type MacroPreset } from "../lib/body";

const PRESETS = ["balanced", "lowcarb", "highprotein", "custom"] as const;

const T = {
  ru: {
    kcal: "Калорий в день",
    kcalHint: "Возьмите из калькулятора калорий",
    preset: "Распределение",
    presets: { balanced: "сбалансированное 25/30/45", lowcarb: "меньше углеводов 30/45/25", highprotein: "больше белка 35/30/35", custom: "своё" } satisfies Record<(typeof PRESETS)[number], string>,
    p: "Белки",
    f: "Жиры",
    c: "Углеводы",
    weightTitle: "Белок на кг веса",
    weight: "Вес",
    label: "Белки · Жиры · Углеводы",
    g: "г",
    sub: (k: string) => `на ${k} в день`,
    protein: "Белки",
    fat: "Жиры",
    carbs: "Углеводы",
    perKg: (v: string) => `${v} г на кг веса`,
    sum: (s: string) => `Сумма должна быть 100 %, сейчас ${s}`,
    enter: "Введите калорийность",
    chart: "Доля калорий",
  },
  en: {
    kcal: "Calories per day",
    kcalHint: "Take it from the calorie calculator",
    preset: "Split",
    presets: { balanced: "balanced 25/30/45", lowcarb: "lower carb 30/45/25", highprotein: "higher protein 35/30/35", custom: "custom" } satisfies Record<(typeof PRESETS)[number], string>,
    p: "Protein",
    f: "Fat",
    c: "Carbs",
    weightTitle: "Protein per kg of body weight",
    weight: "Body weight",
    label: "Protein · Fat · Carbs",
    g: "g",
    sub: (k: string) => `for ${k} a day`,
    protein: "Protein",
    fat: "Fat",
    carbs: "Carbs",
    perKg: (v: string) => `${v} g per kg of body weight`,
    sum: (s: string) => `The split must add up to 100%, now ${s}`,
    enter: "Enter your calories",
    chart: "Share of calories",
  },
} as const;

export default function Macros({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ k: toInput(locale, 2000), s: "balanced", p: "30", f: "30", c: "40", w: "" }, { enums: { s: PRESETS } });
  const preset = q.v.s as (typeof PRESETS)[number];
  const K = field(locale, q.v.k, { min: 500, max: 10000 });
  const P = field(locale, q.v.p, { min: 0, max: 100 });
  const F = field(locale, q.v.f, { min: 0, max: 100 });
  const C = field(locale, q.v.c, { min: 0, max: 100 });
  const W = field(locale, q.v.w, { min: 20, max: 400 });
  const split = preset === "custom" ? (P.value !== null && F.value !== null && C.value !== null ? { protein: P.value, fat: F.value, carbs: C.value } : null) : MACRO_PRESETS[preset as MacroPreset];
  const total = split ? split.protein + split.fat + split.carbs : 0;
  const sumOk = split !== null && Math.abs(total - 100) < 0.01;
  const g = K.value !== null && split && sumOk ? macroGrams(K.value, split) : null;
  const gr = (v: number) => `${fmtRound(locale, Math.round(v), 0)} ${t.g}`;
  const kc = (v: number) => `${fmtRound(locale, Math.round(v), 0)} ${locale === "ru" ? "ккал" : "kcal"}`;

  const inputs = (
    <>
      <NumSlider id={`${id}-k`} locale={locale} label={t.kcal} hint={t.kcalHint} value={q.v.k} onChange={(k) => q.set({ k })} suffix={locale === "ru" ? "ккал" : "kcal"} error={K.message} min={1000} max={5000} step={50} />
      <ToggleField label={t.preset} value={preset} onChange={(s) => q.set({ s })} options={PRESETS.map((p) => ({ value: p, label: t.presets[p] }))} />
      {preset === "custom" && (
        <SliderRow cols={3}>
          <NumSlider id={`${id}-p`} locale={locale} label={t.p} value={q.v.p} onChange={(p) => q.set({ p })} error={P.message} suffix="%" min={0} max={100} />
          <NumSlider id={`${id}-f`} locale={locale} label={t.f} value={q.v.f} onChange={(f) => q.set({ f })} error={F.message} suffix="%" min={0} max={100} />
          <NumSlider id={`${id}-c`} locale={locale} label={t.c} value={q.v.c} onChange={(c) => q.set({ c })} error={C.message} suffix="%" min={0} max={100} />
        </SliderRow>
      )}
      {split && !sumOk && <p className="text-sm text-err">{t.sum(`${fmtRound(locale, total, 1)} %`)}</p>}
      <Advanced title={t.weightTitle} open={!!q.v.w}>
        <NumSlider id={`${id}-w`} locale={locale} label={t.weight} value={q.v.w} onChange={(w) => q.set({ w })} error={W.message} suffix={locale === "ru" ? "кг" : "kg"} min={30} max={200} />
      </Advanced>
    </>
  );

  const result = (
    <ResultMain
      label={t.label}
      value={g ? `${Math.round(g.protein)} · ${Math.round(g.fat)} · ${Math.round(g.carbs)} ${t.g}` : "—"}
      sub={g && K.value ? t.sub(kc(K.value)) : t.enter}
      rows={
        g && split
          ? [
              { label: `${t.protein} (${split.protein} %)`, value: gr(g.protein), hint: W.value ? t.perKg(fmtRound(locale, g.protein / W.value, 1)) : `${kc((g.protein * KCAL_PER_G.protein))}` },
              { label: `${t.fat} (${split.fat} %)`, value: gr(g.fat), hint: kc(g.fat * KCAL_PER_G.fat) },
              { label: `${t.carbs} (${split.carbs} %)`, value: gr(g.carbs), hint: kc(g.carbs * KCAL_PER_G.carbs) },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {g && split && (
        <section>
          <SubHeading>{t.chart}</SubHeading>
          <Donut
            className="panel p-4 sm:p-6"
            ariaLabel={t.chart}
            format={(v) => kc(v)}
            size={132}
            parts={[
              { label: t.protein, value: g.protein * 4, tone: "accent" },
              { label: t.fat, value: g.fat * 9, tone: "warn" },
              { label: t.carbs, value: g.carbs * 4, tone: "ok" },
            ]}
          />
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Белки, г = калории × доля / 4", "Жиры, г = калории × доля / 9", "Углеводы, г = калории × доля / 4"]}
          notes={[
            "1 г белка и углеводов даёт около 4 ккал, 1 г жира — около 9 ккал (коэффициенты Этуотера).",
            "Для большинства взрослых белка обычно достаточно 0,8–1,2 г на кг веса; при регулярных силовых тренировках часто ориентируются на 1,4–2 г/кг. Укажите вес, чтобы увидеть свой показатель.",
            "Распределение — ориентир. При заболеваниях почек, диабете и других состояниях рацион подбирает врач.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Protein, g = calories × share / 4", "Fat, g = calories × share / 9", "Carbs, g = calories × share / 4"]}
          notes={[
            "1 g of protein or carbohydrate provides about 4 kcal and 1 g of fat about 9 kcal (Atwater factors).",
            "Most adults need about 0.8–1.2 g of protein per kg of body weight; people doing regular strength training often aim for 1.4–2 g/kg. Enter your weight to see yours.",
            "The split is a guide. With kidney disease, diabetes or other conditions your diet should be set by a doctor.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
