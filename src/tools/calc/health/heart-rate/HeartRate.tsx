"use client";

import { useId } from "react";
import { plural } from "@/i18n/format";
import type { ToolProps } from "../../../types";
import { field } from "../../shared/num";
import { CalcGrid, DataTable, Disclaimer, Explain, NumSlider, ResultMain, Stack, SubHeading, ToggleField, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { maxHrFox, maxHrTanaka, targetHr, ZONES } from "../lib/body";

const T = {
  ru: {
    age: "Возраст",
    years: ["год", "года", "лет"],
    rest: "Пульс в покое",
    restHint: "Необязательно: утром, лёжа — для метода Карвонена",
    method: "Формула максимума",
    tanaka: "Танака: 208 − 0,7 × возраст",
    fox: "220 − возраст",
    label: "Максимальный пульс",
    bpm: "уд/мин",
    subK: "зоны по Карвонену (с учётом пульса в покое)",
    subS: "зоны в процентах от максимума",
    zones: ["Зона 1 — восстановление", "Зона 2 — базовая выносливость", "Зона 3 — аэробная", "Зона 4 — порог", "Зона 5 — максимум"],
    purpose: [
      "Разминка, заминка, лёгкая активность",
      "Длительные тренировки, жиросжигание, основа выносливости",
      "Темповая работа, развитие аэробной мощности",
      "Интервалы на уровне анаэробного порога",
      "Короткие максимальные ускорения",
    ],
    zone: "Зона",
    range: "Пульс",
    what: "Для чего",
    enter: "Введите возраст",
    table: "Пульсовые зоны",
  },
  en: {
    age: "Age",
    years: ["year", "years"],
    rest: "Resting heart rate",
    restHint: "Optional: in the morning, lying down — for the Karvonen method",
    method: "Max HR formula",
    tanaka: "Tanaka: 208 − 0.7 × age",
    fox: "220 − age",
    label: "Maximum heart rate",
    bpm: "bpm",
    subK: "Karvonen zones (using resting heart rate)",
    subS: "zones as a percentage of maximum",
    zones: ["Zone 1 — recovery", "Zone 2 — endurance", "Zone 3 — aerobic", "Zone 4 — threshold", "Zone 5 — maximum"],
    purpose: ["Warm-up, cool-down, easy activity", "Long sessions, fat burning, aerobic base", "Tempo work, aerobic power", "Intervals around the lactate threshold", "Short all-out efforts"],
    zone: "Zone",
    range: "Heart rate",
    what: "Purpose",
    enter: "Enter your age",
    table: "Heart-rate zones",
  },
} as const;

export default function HeartRate({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ a: "30", r: "", m: "tanaka" }, { enums: { m: ["tanaka", "fox"] } });
  const A = field(locale, q.v.a, { min: 10, max: 100, int: true });
  const R = field(locale, q.v.r, { min: 30, max: 120, int: true });
  const max = A.value !== null ? (q.v.m === "fox" ? maxHrFox(A.value) : maxHrTanaka(A.value)) : null;
  const rest = R.value;
  const bpm = (v: number) => `${Math.round(v)}`;
  const zones = max !== null ? ZONES.map(([lo, hi]) => [targetHr(max, lo, rest), targetHr(max, hi, rest)] as const) : [];

  const inputs = (
    <>
      <NumSlider id={`${id}-a`} locale={locale} label={t.age} value={q.v.a} onChange={(a) => q.set({ a })} suffix={plural(locale, A.value ?? 30, t.years)} error={A.message} min={10} max={90} />
      <NumSlider id={`${id}-r`} locale={locale} label={t.rest} hint={t.restHint} value={q.v.r} onChange={(r) => q.set({ r })} error={R.message} suffix={t.bpm} min={40} max={100} />
      <ToggleField label={t.method} value={q.v.m as "tanaka" | "fox"} onChange={(m) => q.set({ m })} options={[{ value: "tanaka", label: t.tanaka }, { value: "fox", label: t.fox }]} />
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={t.label}
            value={max !== null ? `${bpm(max)} ${t.bpm}` : "—"}
            sub={max !== null ? (rest ? t.subK : t.subS) : t.enter}
            rows={zones.map(([lo, hi], i) => ({ label: t.zones[i], value: `${bpm(lo)}–${bpm(hi)}` }))}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {max !== null && (
        <section>
          <SubHeading>{t.table}</SubHeading>
          <DataTable
            caption={t.table}
            head={[t.zone, "%", t.range, t.what]}
            align={["left", "right", "right", "left"]}
            rows={zones.map(([lo, hi], i) => [t.zones[i], `${ZONES[i][0]}–${ZONES[i][1]}`, `${bpm(lo)}–${bpm(hi)} ${t.bpm}`, <span key="p" className="whitespace-normal text-fg-2">{t.purpose[i]}</span>])}
          />
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Максимум: 208 − 0,7 × возраст (Танака, 2001) или 220 − возраст", "Зона без пульса покоя: максимум × процент", "Карвонен: (максимум − покой) × процент + покой"]}
          notes={[
            "Формула Танаки точнее классической «220 − возраст», особенно после 40 лет. У конкретного человека максимум может отличаться на 10–12 ударов — точно его определяют нагрузочным тестом.",
            "Если указать пульс в покое, зоны считаются по методу Карвонена (резерв пульса) — они лучше учитывают вашу тренированность.",
            "При болезнях сердца, приёме препаратов, влияющих на пульс (например, бета-блокаторов), и в начале тренировок после перерыва согласуйте нагрузку с врачом.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Maximum: 208 − 0.7 × age (Tanaka, 2001) or 220 − age", "Zone without resting HR: maximum × percentage", "Karvonen: (maximum − resting) × percentage + resting"]}
          notes={[
            "The Tanaka formula is more accurate than the classic 220 − age, especially after 40. An individual's maximum can differ by 10–12 beats; an exercise test measures it precisely.",
            "If you enter your resting heart rate, zones use the Karvonen (heart-rate reserve) method, which better reflects your fitness.",
            "With heart conditions, medication that affects heart rate (such as beta-blockers), or when returning to exercise, agree your training load with a doctor.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
