"use client";

import { useId } from "react";
import type { ToolProps } from "../../types";
import { fmtRound } from "../../calc/kit/fmt";
import { field } from "../../calc/kit/num";
import { CalcGrid, DataTable, Disclaimer, Explain, FieldRow, NumField, OptionsRow, ResultMain, SelectField, Stack, SubHeading, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { ACTIVITIES, ACTIVITY_FACTOR, harrisBenedict, mifflin, weeklyChange, type Activity, type Sex } from "../engines/body";
import { BodyFields, bodyDefaults, parseBody, SEXES, SexToggle, switchUnits, UNIT_SYSTEMS, UnitToggle } from "../ui/parts";

const GOALS = ["-500", "-250", "0", "250", "500"] as const;

const T = {
  ru: {
    age: "Возраст, лет",
    activity: "Активность",
    acts: {
      sedentary: "Сидячий образ жизни (×1,2)",
      light: "Лёгкие тренировки 1–3 раза в неделю (×1,375)",
      moderate: "Умеренные тренировки 3–5 раз в неделю (×1,55)",
      active: "Интенсивные тренировки 6–7 раз в неделю (×1,725)",
      very: "Тяжёлый физический труд или 2 тренировки в день (×1,9)",
    } satisfies Record<Activity, string>,
    goal: "Цель",
    goals: { "-500": "похудеть быстрее (−500)", "-250": "похудеть (−250)", "0": "поддерживать вес", "250": "набрать (+250)", "500": "набрать быстрее (+500)" } satisfies Record<(typeof GOALS)[number], string>,
    label: "Калорий в день",
    kcal: "ккал",
    subKeep: "для поддержания текущего веса",
    subGoal: (keep: string, wk: string) => `поддержание — ${keep}; изменение веса ≈ ${wk} в неделю`,
    bmrM: "Базовый обмен (Миффлин — Сан Жеор)",
    bmrH: "Базовый обмен (Харрис — Бенедикт)",
    tdee: "Расход с учётом активности",
    below: "Цель ниже базового обмена — такой дефицит без наблюдения врача не рекомендуется.",
    enter: "Введите рост, вес и возраст",
    table: "Калории по уровню активности",
    level: "Активность",
    keep: "Поддержание",
    lose: "Похудение (−500)",
    gain: "Набор (+500)",
    kg: "кг",
  },
  en: {
    age: "Age, years",
    activity: "Activity",
    acts: {
      sedentary: "Sedentary (×1.2)",
      light: "Light exercise 1–3 times a week (×1.375)",
      moderate: "Moderate exercise 3–5 times a week (×1.55)",
      active: "Hard exercise 6–7 times a week (×1.725)",
      very: "Physical job or training twice a day (×1.9)",
    } satisfies Record<Activity, string>,
    goal: "Goal",
    goals: { "-500": "lose faster (−500)", "-250": "lose (−250)", "0": "maintain weight", "250": "gain (+250)", "500": "gain faster (+500)" } satisfies Record<(typeof GOALS)[number], string>,
    label: "Calories per day",
    kcal: "kcal",
    subKeep: "to maintain your current weight",
    subGoal: (keep: string, wk: string) => `maintenance ${keep}; weight change ≈ ${wk} a week`,
    bmrM: "BMR (Mifflin–St Jeor)",
    bmrH: "BMR (Harris–Benedict)",
    tdee: "Total daily energy expenditure",
    below: "The target is below your BMR — such a deficit is not advised without medical supervision.",
    enter: "Enter your height, weight and age",
    table: "Calories by activity level",
    level: "Activity",
    keep: "Maintain",
    lose: "Lose (−500)",
    gain: "Gain (+500)",
    kg: "kg",
  },
} as const;

export default function Calories({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ ...bodyDefaults(locale, 175, 75), s: "male", a: "30", act: "light", g: "0" }, { enums: { u: UNIT_SYSTEMS, s: SEXES, act: ACTIVITIES, g: GOALS } });
  const body = parseBody(locale, q.v);
  const A = field(locale, q.v.a, { min: 15, max: 100, int: true });
  const sex = q.v.s as Sex;
  const act = q.v.act as Activity;
  const goal = Number(q.v.g);
  const ok = body.cm !== null && body.kg !== null && A.value !== null;
  const bmrM = ok ? mifflin(sex, body.kg!, body.cm!, A.value!) : null;
  const bmrH = ok ? harrisBenedict(sex, body.kg!, body.cm!, A.value!) : null;
  const tdee = bmrM !== null ? bmrM * ACTIVITY_FACTOR[act] : null;
  const target = tdee !== null ? tdee + goal : null;
  const kcal = (v: number) => `${fmtRound(locale, Math.round(v), 0)} ${t.kcal}`;
  const wk = (d: number) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${fmtRound(locale, Math.abs(weeklyChange(d)), 2)} ${t.kg}`;

  const inputs = (
    <>
      <BodyFields id={id} locale={locale} v={q.v} set={q.set} errors={body.errors} />
      <FieldRow>
        <NumField id={`${id}-a`} label={t.age} value={q.v.a} onChange={(a) => q.set({ a })} error={A.message} inputMode="numeric" />
        <SelectField id={`${id}-g`} label={t.goal} value={q.v.g as (typeof GOALS)[number]} onChange={(g) => q.set({ g })} options={GOALS.map((g) => ({ value: g, label: t.goals[g] }))} />
      </FieldRow>
      <SelectField id={`${id}-act`} label={t.activity} value={act} onChange={(v) => q.set({ act: v })} options={ACTIVITIES.map((a) => ({ value: a, label: t.acts[a] }))} />
      <OptionsRow>
        <SexToggle locale={locale} value={sex} onChange={(s) => q.set({ s })} />
        <UnitToggle locale={locale} value={q.v.u as "m" | "i"} onChange={(u) => q.set(switchUnits(locale, q.v, u))} />
      </OptionsRow>
    </>
  );

  const result = (
    <ResultMain
      label={t.label}
      value={target !== null ? kcal(target) : "—"}
      sub={tdee !== null ? (goal === 0 ? t.subKeep : t.subGoal(kcal(tdee), wk(goal))) : t.enter}
      rows={
        bmrM !== null && bmrH !== null && tdee !== null
          ? [
              { label: t.bmrM, value: kcal(bmrM) },
              { label: t.bmrH, value: kcal(bmrH) },
              { label: t.tdee, value: kcal(tdee) },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    >
      {target !== null && bmrM !== null && target < bmrM && <p className="mt-3 text-sm font-medium text-warn">{t.below}</p>}
    </ResultMain>
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {bmrM !== null && (
        <section>
          <SubHeading>{t.table}</SubHeading>
          <DataTable
            caption={t.table}
            head={[t.level, t.keep, t.lose, t.gain]}
            highlight={ACTIVITIES.indexOf(act)}
            rows={ACTIVITIES.map((a) => {
              const e = bmrM * ACTIVITY_FACTOR[a];
              return [t.acts[a], kcal(e), kcal(e - 500), kcal(e + 500)];
            })}
          />
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Миффлин — Сан Жеор: 10 × вес + 6,25 × рост − 5 × возраст + 5 (муж.) / − 161 (жен.)", "Харрис — Бенедикт (1984): 88,362 + 13,397 × вес + 4,799 × рост − 5,677 × возраст (муж.)", "Норма = базовый обмен × коэффициент активности ± цель"]}
          notes={[
            "Основной расчёт ведётся по формуле Миффлина — Сан Жеора: в исследованиях она точнее других предсказывает базовый обмен у современных взрослых. Результат Харриса — Бенедикта показан для сравнения.",
            "Дефицит 500 ккал в день даёт в среднем около 0,45 кг в неделю (≈ 7 700 ккал на 1 кг жира) — на практике скорость снижается по мере похудения.",
            "Формулы дают оценку ±10 %; уточняйте норму по динамике веса за 2–3 недели. Беременным, кормящим и людям с хроническими заболеваниями нужна индивидуальная консультация.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Mifflin–St Jeor: 10 × weight + 6.25 × height − 5 × age + 5 (men) / − 161 (women)", "Harris–Benedict (1984): 88.362 + 13.397 × weight + 4.799 × height − 5.677 × age (men)", "Target = BMR × activity factor ± goal"]}
          notes={[
            "The main result uses Mifflin–St Jeor, which studies found to predict resting energy expenditure in today's adults more accurately. Harris–Benedict is shown for comparison.",
            "A 500 kcal daily deficit gives about 0.45 kg a week on average (≈ 7,700 kcal per kg of fat); in practice the rate slows as you lose weight.",
            "The formulas are estimates within about ±10%; adjust based on your weight trend over 2–3 weeks. Pregnancy, breastfeeding and chronic conditions need individual advice.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
