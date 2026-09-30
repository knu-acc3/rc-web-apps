"use client";

import { useId } from "react";
import type { ToolProps } from "../../types";
import { fmtRound } from "../../calc/kit/fmt";
import { CalcGrid, Disclaimer, Explain, OptionsRow, ResultMain, Stack, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { healthyRange, IDEAL_FORMULAS, idealWeight, kgToLb, type IdealFormula, type Sex } from "../engines/body";
import { BodyFields, bodyDefaults, parseBody, SEXES, SexToggle, switchUnits, UNIT_SYSTEMS, UnitToggle } from "../parts";

const T = {
  ru: {
    label: (h: string) => `Нормальный вес при росте ${h}`,
    labelEmpty: "Нормальный вес",
    sub: (lo: string, hi: string) => `по формулам идеального веса — ${lo}–${hi}`,
    formulas: { devine: "Формула Девайна", robinson: "Формула Робинсона", miller: "Формула Миллера", hamwi: "Формула Хамви" } satisfies Record<IdealFormula, string>,
    enter: "Введите рост",
    below: "Формулы созданы для роста от 152,4 см (5 футов) — для более низкого роста значения экстраполированы и менее точны.",
    kg: "кг",
    cm: "см",
  },
  en: {
    label: (h: string) => `Healthy weight at ${h}`,
    labelEmpty: "Healthy weight",
    sub: (lo: string, hi: string) => `ideal-weight formulas give ${lo}–${hi}`,
    formulas: { devine: "Devine formula", robinson: "Robinson formula", miller: "Miller formula", hamwi: "Hamwi formula" } satisfies Record<IdealFormula, string>,
    enter: "Enter your height",
    below: "The formulas were built for heights from 152.4 cm (5 ft); below that the values are extrapolated and less reliable.",
    kg: "kg",
    cm: "cm",
  },
} as const;

export default function IdealWeight({ locale, height = 170, sex = "male" }: ToolProps<{ height?: number; sex?: Sex }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ ...bodyDefaults(locale, height, 70), s: sex }, { enums: { u: UNIT_SYSTEMS, s: SEXES } });
  const body = parseBody(locale, q.v);
  const imperial = q.v.u === "i";
  const s = q.v.s as Sex;
  const w = (kg: number) => (imperial ? `${fmtRound(locale, kgToLb(kg), 0)} lb` : `${fmtRound(locale, kg, 1)} ${t.kg}`);
  const cm = body.cm;
  const range = cm !== null ? healthyRange(cm) : null;
  const formulas = cm !== null ? IDEAL_FORMULAS.map((f) => ({ f, kg: idealWeight(f, s, cm) })) : [];
  const lo = formulas.length ? Math.min(...formulas.map((x) => x.kg)) : 0;
  const hi = formulas.length ? Math.max(...formulas.map((x) => x.kg)) : 0;
  const hText = cm !== null ? (imperial ? `${q.v.ft}′${q.v.in || 0}″` : `${fmtRound(locale, cm, 1)} ${t.cm}`) : "";

  const inputs = (
    <>
      <BodyFields id={id} locale={locale} v={q.v} set={q.set} errors={body.errors} weight={false} />
      <OptionsRow>
        <SexToggle locale={locale} value={s} onChange={(v) => q.set({ s: v })} />
        <UnitToggle locale={locale} value={q.v.u as "m" | "i"} onChange={(u) => q.set(switchUnits(locale, q.v, u))} />
      </OptionsRow>
      {cm !== null && cm < 152.4 && <p className="text-[13px] text-fg-3">{t.below}</p>}
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={cm !== null ? t.label(hText) : t.labelEmpty}
            value={range ? `${w(range[0])} – ${w(range[1])}` : "—"}
            sub={formulas.length ? t.sub(w(lo), w(hi)) : t.enter}
            rows={formulas.map((x) => ({ label: t.formulas[x.f], value: w(x.kg) }))}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
            size="md"
          />
        }
      />
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Нормальный вес = 18,5…24,9 × рост (м)²", "Девайн: М 50 + 2,3 × d, Ж 45,5 + 2,3 × d", "Робинсон: М 52 + 1,9 × d, Ж 49 + 1,7 × d", "Миллер: М 56,2 + 1,41 × d, Ж 53,1 + 1,36 × d", "Хамви: М 48 + 2,7 × d, Ж 45,5 + 2,2 × d", "d — дюймы сверх 5 футов = рост (см) / 2,54 − 60"]}
          notes={[
            "Диапазон нормального веса основан на классификации ИМТ ВОЗ и подходит взрослым любого телосложения как ориентир.",
            "Формулы идеального веса появились в медицинской практике 1960–80-х годов (формулу Девайна, например, применяли для расчёта доз лекарств). Они дают одну цифру и не учитывают телосложение, возраст и мышечную массу — поэтому их значения расходятся на несколько килограммов.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Healthy weight = 18.5…24.9 × height (m)²", "Devine: M 50 + 2.3 × d, F 45.5 + 2.3 × d", "Robinson: M 52 + 1.9 × d, F 49 + 1.7 × d", "Miller: M 56.2 + 1.41 × d, F 53.1 + 1.36 × d", "Hamwi: M 48 + 2.7 × d, F 45.5 + 2.2 × d", "d = inches over 5 ft = height (cm) / 2.54 − 60"]}
          notes={[
            "The healthy range is based on the WHO BMI classification and is a guide for adults of any build.",
            "Ideal-weight formulas come from clinical practice of the 1960s–80s (the Devine formula, for example, was used to dose medicines). They give a single number and ignore frame, age and muscle mass, which is why they differ by several kilograms.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
