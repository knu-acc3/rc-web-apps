"use client";

import { useId } from "react";
import type { ToolProps } from "../../../types";
import { ScaleBar } from "../../shared/charts";
import { fmtRound } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { CalcGrid, DataTable, Disclaimer, Explain, FieldRow, NumField, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { bmi, bmiBodyFat, CM_PER_IN, FAT_BOUNDS, fatCategory, kgToLb, navyBodyFat, type Sex } from "../lib/body";
import { FAT_LABEL } from "../lib/labels";
import { BodyFields, bodyDefaults, parseBody, SEXES, SexToggle, switchUnits, UNIT_SYSTEMS, UnitToggle } from "../ui/parts";

const T = {
  ru: {
    waist: "Талия",
    waistHint: "Мужчины — на уровне пупка, женщины — в самом узком месте",
    neck: "Шея",
    neckHint: "Под кадыком",
    hip: "Бёдра",
    hipHint: "По самой широкой части",
    age: "Возраст",
    label: "Процент жира (метод ВМС США)",
    fatMass: "Жировая масса",
    lean: "Безжировая масса",
    bmiEst: "Оценка по ИМТ (Деуренберг)",
    enter: "Введите рост, вес и обхваты",
    impossible: "Проверьте обхваты: талия должна быть больше шеи",
    table: "Категории процента жира (ACE)",
    cat: "Категория",
    men: "Мужчины",
    women: "Женщины",
    cm: "см",
    kg: "кг",
  },
  en: {
    waist: "Waist",
    waistHint: "Men at the navel, women at the narrowest point",
    neck: "Neck",
    neckHint: "Just below the larynx",
    hip: "Hips",
    hipHint: "At the widest point",
    age: "Age",
    label: "Body fat (US Navy method)",
    fatMass: "Fat mass",
    lean: "Lean mass",
    bmiEst: "BMI-based estimate (Deurenberg)",
    enter: "Enter your height, weight and measurements",
    impossible: "Check the measurements: the waist must be larger than the neck",
    table: "Body-fat categories (ACE)",
    cat: "Category",
    men: "Men",
    women: "Women",
    cm: "cm",
    kg: "kg",
  },
} as const;

export default function BodyFat({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ ...bodyDefaults(locale, 180, 80), s: "male", wa: "85", ne: "38", hi: "98", a: "30" }, { enums: { u: UNIT_SYSTEMS, s: SEXES } });
  const body = parseBody(locale, q.v);
  const sex = q.v.s as Sex;
  const imperial = q.v.u === "i";
  const lenUnit = imperial ? "in" : t.cm;
  const toCm = (v: number | null) => (v === null ? null : imperial ? v * CM_PER_IN : v);
  const WA = field(locale, q.v.wa, { gt: 0, max: 300 });
  const NE = field(locale, q.v.ne, { gt: 0, max: 100 });
  const HI = field(locale, q.v.hi, { gt: 0, max: 300 });
  const A = field(locale, q.v.a, { min: 15, max: 100, int: true });
  const waist = toCm(WA.value);
  const neck = toCm(NE.value);
  const hip = toCm(HI.value);
  const navy = body.cm !== null && waist !== null && neck !== null && (sex === "male" || hip !== null) ? navyBodyFat(sex, body.cm, waist, neck, hip ?? 0) : null;
  const impossible = body.cm !== null && waist !== null && neck !== null && navy === null;
  const bf = navy !== null && navy > 0 && navy < 75 ? navy : null;
  const bmiEst = body.cm !== null && body.kg !== null && A.value !== null ? bmiBodyFat(sex, bmi(body.kg, body.cm), A.value) : null;
  const w = (kg: number) => (imperial ? `${fmtRound(locale, kgToLb(kg), 1)} lb` : `${fmtRound(locale, kg, 1)} ${t.kg}`);
  const pct = (v: number) => `${fmtRound(locale, v, 1)}${locale === "ru" ? " %" : "%"}`;
  const bounds = FAT_BOUNDS[sex];

  const inputs = (
    <>
      <BodyFields id={id} locale={locale} v={q.v} set={q.set} errors={body.errors} size="md" />
      <FieldRow>
        <NumField id={`${id}-wa`} label={t.waist} hint={t.waistHint} value={q.v.wa} onChange={(wa) => q.set({ wa })} suffix={lenUnit} error={WA.message} size="lg" />
        <NumField id={`${id}-ne`} label={t.neck} hint={t.neckHint} value={q.v.ne} onChange={(ne) => q.set({ ne })} suffix={lenUnit} error={NE.message} size="lg" />
      </FieldRow>
      <FieldRow>
        {sex === "female" && <NumField id={`${id}-hi`} label={t.hip} hint={t.hipHint} value={q.v.hi} onChange={(v) => q.set({ hi: v })} suffix={lenUnit} error={HI.message} />}
        <NumField id={`${id}-a`} label={t.age} value={q.v.a} onChange={(a) => q.set({ a })} error={A.message} inputMode="numeric" />
      </FieldRow>
      <OptionsRow>
        <SexToggle locale={locale} value={sex} onChange={(s) => q.set({ s })} />
        <UnitToggle
          locale={locale}
          value={q.v.u as "m" | "i"}
          onChange={(u) => {
            if (u === q.v.u) return;
            const f = u === "i" ? 1 / CM_PER_IN : CM_PER_IN;
            const conv = (x: number | null, raw: string) => (x === null ? raw : toInput(locale, Math.round(x * f * 10) / 10));
            q.set({ ...switchUnits(locale, q.v, u), wa: conv(WA.value, q.v.wa), ne: conv(NE.value, q.v.ne), hi: conv(HI.value, q.v.hi) });
          }}
        />
      </OptionsRow>
    </>
  );

  const result = (
    <ResultMain
      label={t.label}
      value={bf !== null ? pct(bf) : "—"}
      sub={bf !== null ? FAT_LABEL[locale][fatCategory(sex, bf)] : impossible ? t.impossible : t.enter}
      rows={
        bf !== null
          ? [
              ...(body.kg !== null
                ? [
                    { label: t.fatMass, value: w((body.kg * bf) / 100) },
                    { label: t.lean, value: w(body.kg * (1 - bf / 100)) },
                  ]
                : []),
              ...(bmiEst !== null ? [{ label: t.bmiEst, value: pct(bmiEst) }] : []),
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    >
      {bf !== null && (
        <ScaleBar
          className="mt-4"
          min={0}
          max={sex === "male" ? 40 : 48}
          value={bf}
          format={(v) => fmtRound(locale, v, 0)}
          ariaLabel={`${t.label}: ${pct(bf)}`}
          segments={[
            { to: bounds[1][1], label: FAT_LABEL[locale].essential, tone: "accent", strength: 0.5 },
            { to: bounds[2][1], label: FAT_LABEL[locale].athletes, tone: "ok", strength: 0.9 },
            { to: bounds[3][1], label: FAT_LABEL[locale].fitness, tone: "ok", strength: 0.6 },
            { to: bounds[4][1], label: FAT_LABEL[locale].average, tone: "warn", strength: 0.55 },
            { to: sex === "male" ? 40 : 48, label: FAT_LABEL[locale].obese, tone: "err", strength: 0.6 },
          ]}
        />
      )}
    </ResultMain>
  );

  const rng = (s: Sex, i: number) => {
    const b = FAT_BOUNDS[s];
    return i < b.length - 1 ? `${b[i][1]}–${b[i + 1][1] - 1} %` : `≥ ${b[i][1]} %`;
  };

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      <section>
        <SubHeading>{t.table}</SubHeading>
        <DataTable
          caption={t.table}
          head={[t.cat, t.men, t.women]}
          highlight={bf !== null ? Math.max(0, bounds.findIndex(([c]) => c === fatCategory(sex, bf))) : undefined}
          rows={FAT_BOUNDS.male.map(([c], i) => [FAT_LABEL[locale][c], rng("male", i), rng("female", i)])}
        />
      </section>
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Мужчины: 495 / (1,0324 − 0,19077 × lg(талия − шея) + 0,15456 × lg(рост)) − 450", "Женщины: 495 / (1,29579 − 0,35004 × lg(талия + бёдра − шея) + 0,221 × lg(рост)) − 450", "По ИМТ: 1,2 × ИМТ + 0,23 × возраст − 10,8 × пол − 5,4 (пол: 1 — муж., 0 — жен.)"]}
          notes={[
            "Метод ВМС США использует обхваты в сантиметрах и рост; его погрешность относительно точных методов — примерно 3–4 процентных пункта.",
            "Измеряйте утром, мягкой лентой, не втягивая живот; повторяйте замеры в одинаковых условиях.",
            "Оценка по ИМТ (Деуренберг, 1991) грубее: она не видит мышечную массу. Точнее всего состав тела показывает DEXA-сканирование.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Men: 495 / (1.0324 − 0.19077 × log(waist − neck) + 0.15456 × log(height)) − 450", "Women: 495 / (1.29579 − 0.35004 × log(waist + hip − neck) + 0.221 × log(height)) − 450", "BMI-based: 1.2 × BMI + 0.23 × age − 10.8 × sex − 5.4 (sex: 1 male, 0 female)"]}
          notes={[
            "The US Navy method uses circumferences in centimetres and height; it is typically within about 3–4 percentage points of lab methods.",
            "Measure in the morning with a soft tape without pulling in your stomach, and repeat under the same conditions.",
            "The BMI-based estimate (Deurenberg, 1991) is rougher because it cannot see muscle. DEXA scans measure body composition most accurately.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
