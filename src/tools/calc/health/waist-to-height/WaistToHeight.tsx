"use client";

import { useId } from "react";
import type { ToolProps } from "../../../types";
import { ScaleBar } from "../../shared/charts";
import { fmtRound } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { CalcGrid, Disclaimer, Explain, InlineToggle, NumSlider, OptionsRow, ResultMain, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { whtrCategory } from "../lib/body";
import { WHTR_LABEL } from "../lib/labels";

const T = {
  ru: {
    waist: "Окружность талии",
    waistHint: "Между нижним ребром и тазовой костью, на выдохе",
    height: "Рост",
    units: "Единицы",
    label: "Отношение талии к росту",
    maxWaist: "Талия меньше половины роста",
    maxWaistV: (v: string) => `до ${v}`,
    enter: "Введите обхват талии и рост",
  },
  en: {
    waist: "Waist circumference",
    waistHint: "Midway between the lowest rib and the top of the hip bone, after breathing out",
    height: "Height",
    units: "Units",
    label: "Waist-to-height ratio",
    maxWaist: "Waist under half your height",
    maxWaistV: (v: string) => `up to ${v}`,
    enter: "Enter your waist and height",
  },
} as const;

export default function WaistToHeight({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ w: "80", h: "170", u: "cm" }, { enums: { u: ["cm", "in"] } });
  const inch = q.v.u === "in";
  const unit = inch ? "in" : locale === "ru" ? "см" : "cm";
  const W = field(locale, q.v.w, { gt: 0, max: 400 });
  const H = field(locale, q.v.h, { gt: 0, max: 300 });
  const ratio = W.value !== null && H.value !== null ? W.value / H.value : null;
  const cat = ratio !== null ? whtrCategory(ratio) : null;

  const inputs = (
    <>
      <NumSlider id={`${id}-w`} locale={locale} label={t.waist} hint={t.waistHint} value={q.v.w} onChange={(w) => q.set({ w })} suffix={unit} error={W.message} min={inch ? 20 : 50} max={inch ? 60 : 150} />
      <NumSlider id={`${id}-h`} locale={locale} label={t.height} value={q.v.h} onChange={(h) => q.set({ h })} suffix={unit} error={H.message} min={inch ? 48 : 120} max={inch ? 87 : 220} />
      <OptionsRow>
        <InlineToggle
          label={t.units}
          value={q.v.u as "cm" | "in"}
          onChange={(u) => {
            if (u === q.v.u) return;
            const f = u === "in" ? 1 / 2.54 : 2.54;
            q.set({ u, w: W.value === null ? q.v.w : toInput(locale, Math.round(W.value * f * 10) / 10), h: H.value === null ? q.v.h : toInput(locale, Math.round(H.value * f * 10) / 10) });
          }}
          options={[
            { value: "cm", label: locale === "ru" ? "см" : "cm" },
            { value: "in", label: "in" },
          ]}
        />
      </OptionsRow>
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={t.label}
            value={ratio !== null ? fmtRound(locale, ratio, 2) : "—"}
            sub={cat ? WHTR_LABEL[locale][cat] : t.enter}
            rows={H.value !== null ? [{ label: t.maxWaist, value: t.maxWaistV(`${fmtRound(locale, H.value / 2, 1)} ${unit}`) }] : undefined}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          >
            {ratio !== null && (
              <ScaleBar
                className="mt-4"
                min={0.3}
                max={0.8}
                value={ratio}
                format={(v) => fmtRound(locale, v, 2)}
                ariaLabel={`${t.label}: ${fmtRound(locale, ratio, 2)}`}
                segments={[
                  { to: 0.4, label: locale === "ru" ? "ниже 0,4" : "below 0.4", tone: "accent", strength: 0.5 },
                  { to: 0.5, label: WHTR_LABEL[locale].healthy, tone: "ok" },
                  { to: 0.6, label: WHTR_LABEL[locale].increased, tone: "warn", strength: 0.6 },
                  { to: 0.8, label: WHTR_LABEL[locale].high, tone: "err", strength: 0.6 },
                ]}
              />
            )}
          </ResultMain>
        }
      />
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Отношение = окружность талии / рост (в одних единицах)"]}
          notes={[
            "Пороги NICE (Великобритания, 2022): 0,4–0,49 — норма, 0,5–0,59 — повышенный риск для здоровья, от 0,6 — высокий риск. Простое правило: талия должна быть меньше половины роста.",
            "Показатель отражает жир в области живота, который сильнее связан с риском диабета 2 типа и сердечно-сосудистых заболеваний, чем общий вес.",
            "Пороги предназначены для взрослых с ИМТ до 35; не применяются при беременности.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Ratio = waist circumference / height (same units)"]}
          notes={[
            "NICE (UK, 2022) thresholds: 0.4–0.49 healthy, 0.5–0.59 increased health risk, 0.6 or more high risk. Simple rule: keep your waist to less than half your height.",
            "The ratio reflects abdominal fat, which is more closely linked to type 2 diabetes and heart disease risk than total weight.",
            "The thresholds are for adults with a BMI under 35 and do not apply during pregnancy.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
