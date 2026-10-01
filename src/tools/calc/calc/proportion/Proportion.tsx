"use client";

import { useId } from "react";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { fmtN } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { CalcGrid, Explain, FieldRow, InlineToggle, NumField, OptionsRow, ResultMain, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { groundToMap, mapToGround, ruleOfThree } from "../numbers/engines";

const MODES = ["direct", "inverse", "map"] as const;
type Mode = (typeof MODES)[number];

const T = {
  ru: {
    mode: "Тип задачи",
    direct: "Прямая пропорция",
    inverse: "Обратная пропорция",
    map: "Масштаб карты",
    a1: "Известное значение A₁",
    b1: "Ему соответствует B₁",
    a2: "Новое значение A₂",
    answer: "Ответ B₂",
    directHint: "Во сколько раз больше A, во столько же раз больше B: 3 кг стоят 450 ₸ — сколько стоят 5 кг?",
    inverseHint: "Во сколько раз больше A, во столько раз меньше B: 4 рабочих делают работу за 6 дней — за сколько сделают 3?",
    scale: "Масштаб 1 :",
    dir: "Что известно",
    onMap: "Расстояние на карте",
    onGround: "Расстояние на местности",
    cm: "см",
    m: "м",
    km: "км",
    inM: "В метрах",
    inKm: "В километрах",
    mapResult: "На местности",
    groundResult: "На карте",
    scaleText: (s: string, m: string) => `в 1 см — ${m} (масштаб 1 : ${s})`,
    enter: "Заполните все поля",
    div0: "Деление на ноль — проверьте значения",
  },
  en: {
    mode: "Problem type",
    direct: "Direct proportion",
    inverse: "Inverse proportion",
    map: "Map scale",
    a1: "Known value A₁",
    b1: "Corresponds to B₁",
    a2: "New value A₂",
    answer: "Answer B₂",
    directHint: "A and B grow together: if 3 kg cost 450, how much do 5 kg cost?",
    inverseHint: "When A grows, B shrinks: 4 workers finish in 6 days — how long for 3 workers?",
    scale: "Scale 1 :",
    dir: "Known distance",
    onMap: "Distance on the map",
    onGround: "Distance on the ground",
    cm: "cm",
    m: "m",
    km: "km",
    inM: "In metres",
    inKm: "In kilometres",
    mapResult: "On the ground",
    groundResult: "On the map",
    scaleText: (s: string, m: string) => `1 cm = ${m} (scale 1 : ${s})`,
    enter: "Fill in all fields",
    div0: "Division by zero — check the values",
  },
} as const;

export default function Proportion({ locale, mode = "direct" }: ToolProps<{ mode?: Mode }>) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const q = useQueryState({ m: mode, a1: "3", b1: ru ? "450" : "4.5", a2: "5", s: toInput(locale, 25000), dm: "map", v: "4" }, { enums: { m: MODES, dm: ["map", "ground"] } });
  const m = q.v.m as Mode;
  const A1 = field(locale, q.v.a1);
  const B1 = field(locale, q.v.b1);
  const A2 = field(locale, q.v.a2);
  const S = field(locale, q.v.s, { gt: 0 });
  const V = field(locale, q.v.v, { min: 0 });
  const f = (x: number) => fmtN(locale, x, 6);

  let value = "—";
  let sub: string = t.enter;
  let rows: { label: string; value: string }[] | undefined;
  if (m !== "map" && A1.value !== null && B1.value !== null && A2.value !== null) {
    const r = ruleOfThree(A1.value, B1.value, A2.value, m === "inverse");
    if (r === null) sub = t.div0;
    else {
      value = f(r);
      sub = m === "inverse" ? `B₂ = ${f(B1.value)} × ${f(A1.value)} / ${f(A2.value)} = ${f(r)}` : `B₂ = ${f(B1.value)} × ${f(A2.value)} / ${f(A1.value)} = ${f(r)}`;
    }
  }
  const len = (meters: number) => (meters >= 1000 ? `${f(meters / 1000)} ${t.km}` : `${f(meters)} ${t.m}`);
  if (m === "map" && S.value !== null && V.value !== null) {
    const per = mapToGround(1, S.value);
    if (q.v.dm === "map") {
      const meters = mapToGround(V.value, S.value);
      value = len(meters);
      sub = `${f(V.value)} ${t.cm} × ${f(S.value)} = ${f(V.value * S.value)} ${t.cm}`;
      rows = [
        { label: t.inM, value: `${f(meters)} ${t.m}` },
        { label: t.inKm, value: `${f(meters / 1000)} ${t.km}` },
      ];
    } else {
      const cm = groundToMap(V.value, S.value);
      value = `${f(cm)} ${t.cm}`;
      sub = `${f(V.value)} ${t.m} = ${f(V.value * 100)} ${t.cm}; ${f(V.value * 100)} / ${f(S.value)} = ${f(cm)} ${t.cm}`;
    }
    rows = [...(rows ?? []), { label: t.scale.replace(" :", ""), value: t.scaleText(f(S.value), len(per)) }];
  }

  const inputs = (
    <>
      <Segmented
        label={t.mode}
        value={m}
        onChange={(v) => q.set({ m: v })}
        options={[
          { value: "direct", label: t.direct },
          { value: "inverse", label: t.inverse },
          { value: "map", label: t.map },
        ]}
      />
      {m !== "map" ? (
        <>
          <FieldRow>
            <NumField id={`${id}-a1`} label={t.a1} value={q.v.a1} onChange={(a1) => q.set({ a1 })} error={A1.message} size="lg" />
            <NumField id={`${id}-b1`} label={t.b1} value={q.v.b1} onChange={(b1) => q.set({ b1 })} error={B1.message} size="lg" />
          </FieldRow>
          <FieldRow>
            <NumField id={`${id}-a2`} label={t.a2} value={q.v.a2} onChange={(a2) => q.set({ a2 })} error={A2.message} size="lg" />
            <div className="flex min-h-12 items-end pb-3 text-sm text-fg-3">→ {t.answer}</div>
          </FieldRow>
          <p className="text-[0.8125rem] text-fg-3">{m === "direct" ? t.directHint : t.inverseHint}</p>
        </>
      ) : (
        <>
          <NumField id={`${id}-s`} label={t.scale} value={q.v.s} onChange={(s) => q.set({ s })} error={S.message} size="lg" />
          <OptionsRow>
            <InlineToggle
              label={t.dir}
              value={q.v.dm as "map" | "ground"}
              onChange={(dm) => q.set({ dm })}
              options={[
                { value: "map", label: t.onMap },
                { value: "ground", label: t.onGround },
              ]}
            />
          </OptionsRow>
          <NumField id={`${id}-v`} label={q.v.dm === "map" ? t.onMap : t.onGround} value={q.v.v} onChange={(v) => q.set({ v })} suffix={q.v.dm === "map" ? t.cm : t.m} error={V.message} size="lg" />
        </>
      )}
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={<ResultMain label={m === "map" ? (q.v.dm === "map" ? t.mapResult : t.groundResult) : t.answer} value={value} sub={sub} rows={rows} actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />} />}
      />
      {ru ? (
        <Explain
          locale={locale}
          formula={["Прямая: A₁ / B₁ = A₂ / B₂  →  B₂ = B₁ × A₂ / A₁", "Обратная: A₁ × B₁ = A₂ × B₂  →  B₂ = B₁ × A₁ / A₂", "Масштаб 1 : S: на местности = на карте × S (в тех же единицах)"]}
          notes={[
            "Правило трёх: три известных числа и одно неизвестное. В прямой пропорции величины растут вместе (цена и вес), в обратной — одна растёт, другая уменьшается (число рабочих и срок).",
            "Масштаб 1 : 25 000 значит, что 1 см на карте — это 25 000 см = 250 м на местности. Калькулятор переводит результат в метры и километры.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Direct: A₁ / B₁ = A₂ / B₂  →  B₂ = B₁ × A₂ / A₁", "Inverse: A₁ × B₁ = A₂ × B₂  →  B₂ = B₁ × A₁ / A₂", "Scale 1 : S: ground = map × S (same units)"]}
          notes={[
            "The rule of three: three known numbers and one unknown. In a direct proportion both grow together (price and weight); in an inverse one, one grows as the other shrinks (workers and days).",
            "A 1 : 25,000 scale means 1 cm on the map is 25,000 cm = 250 m on the ground. The result is converted to metres and kilometres.",
          ]}
        />
      )}
    </Stack>
  );
}
