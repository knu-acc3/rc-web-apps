"use client";

import { useId } from "react";
import { plural } from "@/i18n/format";
import type { ToolProps } from "../../types";
import { fmtRound } from "../../calc/kit/fmt";
import { field, toInput } from "../../calc/kit/num";
import { CalcGrid, Disclaimer, Explain, FieldRow, InlineToggle, NumField, OptionsRow, ResultMain, Stack, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { kgToLb, lbToKg, ML_PER_FLOZ, waterIntake, type Climate } from "../engines/body";

const T = {
  ru: {
    weight: "Вес",
    exercise: "Тренировки в день",
    climate: "Климат",
    temperate: "умеренный",
    hot: "жарко",
    units: "Единицы",
    label: "Воды в день",
    l: "л",
    ml: "мл",
    min: "мин",
    glasses: ["стакан", "стакана", "стаканов"],
    sub: (g: string, oz: string) => `≈ ${g} по 250 мл · ${oz} fl oz`,
    base: "Базовая норма (30 мл × кг)",
    ex: "Тренировки (500 мл в час)",
    heat: "Жаркая погода",
    enter: "Введите вес",
  },
  en: {
    weight: "Weight",
    exercise: "Exercise per day",
    climate: "Climate",
    temperate: "temperate",
    hot: "hot",
    units: "Units",
    label: "Water per day",
    l: "L",
    ml: "ml",
    min: "min",
    glasses: ["glass", "glasses"],
    sub: (g: string, oz: string) => `≈ ${g} of 250 ml · ${oz} US fl oz`,
    base: "Baseline (30 ml × kg)",
    ex: "Exercise (500 ml per hour)",
    heat: "Hot weather",
    enter: "Enter your weight",
  },
} as const;

export default function Water({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ w: "70", u: "kg", e: "30", c: "temperate" }, { enums: { u: ["kg", "lb"], c: ["temperate", "hot"] } });
  const lb = q.v.u === "lb";
  const W = field(locale, q.v.w, { min: 20, max: lb ? 900 : 400 });
  const E = field(locale, q.v.e, { min: 0, max: 600 });
  const kg = W.value === null ? null : lb ? lbToKg(W.value) : W.value;
  const r = kg !== null ? waterIntake(kg, E.value ?? 0, q.v.c as Climate) : null;
  const ml = (v: number) => `${fmtRound(locale, Math.round(v / 10) * 10, 0)} ${t.ml}`;

  const inputs = (
    <>
      <FieldRow>
        <NumField id={`${id}-w`} label={t.weight} value={q.v.w} onChange={(w) => q.set({ w })} suffix={lb ? "lb" : locale === "ru" ? "кг" : "kg"} error={W.message} size="lg" />
        <NumField id={`${id}-e`} label={t.exercise} value={q.v.e} onChange={(e) => q.set({ e })} suffix={t.min} error={E.message} size="lg" />
      </FieldRow>
      <OptionsRow>
        <InlineToggle
          label={t.climate}
          showLabel
          value={q.v.c as Climate}
          onChange={(c) => q.set({ c })}
          options={[
            { value: "temperate", label: t.temperate },
            { value: "hot", label: t.hot },
          ]}
        />
        <InlineToggle
          label={t.units}
          value={q.v.u as "kg" | "lb"}
          onChange={(u) => {
            if (u === q.v.u) return;
            q.set({ u, w: W.value === null ? q.v.w : toInput(locale, Math.round(u === "lb" ? kgToLb(W.value) : lbToKg(W.value))) });
          }}
          options={[
            { value: "kg", label: locale === "ru" ? "кг" : "kg" },
            { value: "lb", label: "lb" },
          ]}
        />
      </OptionsRow>
    </>
  );

  const glasses = r ? Math.round(r.total / 250) : 0;
  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={t.label}
            value={r ? `${fmtRound(locale, r.total / 1000, 1)} ${t.l}` : "—"}
            sub={r ? t.sub(`${glasses} ${plural(locale, glasses, t.glasses)}`, fmtRound(locale, r.total / ML_PER_FLOZ, 0)) : t.enter}
            rows={
              r
                ? [
                    { label: t.base, value: ml(r.base) },
                    { label: t.ex, value: ml(r.exercise) },
                    ...(r.climate ? [{ label: t.heat, value: ml(r.climate) }] : []),
                  ]
                : undefined
            }
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Вода = 30 мл × вес (кг) + 500 мл × часы тренировок + 500 мл в жару"]}
          notes={[
            "Это простая оценка, а не медицинская норма. Для ориентира: Европейское агентство по безопасности пищевых продуктов (EFSA) считает достаточным потребление 2,0 л воды в день для женщин и 2,5 л для мужчин из всех источников.",
            "Около 20–30 % воды мы получаем с едой — супами, овощами, фруктами. Чай, кофе и молоко тоже учитываются.",
            "Лучший ориентир — жажда и светлый цвет мочи. При болезнях почек или сердца, отёках и беременности норму жидкости определяет врач.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Water = 30 ml × weight (kg) + 500 ml × hours of exercise + 500 ml in hot weather"]}
          notes={[
            "This is a simple estimate, not a medical requirement. For reference, the European Food Safety Authority (EFSA) considers 2.0 L of water a day adequate for women and 2.5 L for men, from all sources.",
            "About 20–30% of water comes from food — soups, vegetables, fruit. Tea, coffee and milk count too.",
            "Thirst and pale urine are the best guides. With kidney or heart disease, swelling or pregnancy, your doctor sets the fluid target.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
