"use client";

import { useId } from "react";
import { Checkbox } from "@/ui/field";
import type { ToolProps } from "../../types";
import { ScaleBar } from "../../calc/kit/charts";
import { fmtRound } from "../../calc/kit/fmt";
import { CalcGrid, DataTable, Disclaimer, Explain, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { bmi, BMI_CLASSES, bmiBounds, bmiClass, healthyRange, kgToLb } from "../engines/body";
import { BMI_LABEL } from "../lib/labels";
import { BodyFields, bodyDefaults, parseBody, switchUnits, UNIT_SYSTEMS, UnitToggle } from "../ui/parts";

const T = {
  ru: {
    label: "Индекс массы тела",
    asian: "Пороги для азиатского населения (23 / 27,5)",
    range: "Нормальный вес при вашем росте",
    toNormal: "До нормы",
    lose: (v: string) => `снизить на ${v}`,
    gain: (v: string) => `набрать ${v}`,
    ok: "вы в пределах нормы",
    enter: "Введите рост и вес",
    table: "Классификация ИМТ для взрослых (ВОЗ)",
    tableAsian: "Пороги ИМТ для азиатского населения (ВОЗ, 2004)",
    cls: "Категория",
    bmiCol: "ИМТ",
    weightCol: "Вес при вашем росте",
    kg: "кг",
    children: "Для детей и подростков до 18 лет ИМТ оценивают по возрастным процентильным таблицам ВОЗ с учётом пола — эти нормы здесь не применяются. Об оценке веса ребёнка лучше поговорить с педиатром.",
    you: "вы здесь",
  },
  en: {
    label: "Body mass index",
    asian: "Asian cut-offs (23 / 27.5)",
    range: "Healthy weight for your height",
    toNormal: "To healthy range",
    lose: (v: string) => `lose ${v}`,
    gain: (v: string) => `gain ${v}`,
    ok: "you are within the healthy range",
    enter: "Enter your height and weight",
    table: "Adult BMI classification (WHO)",
    tableAsian: "BMI cut-offs for Asian populations (WHO, 2004)",
    cls: "Category",
    bmiCol: "BMI",
    weightCol: "Weight at your height",
    kg: "kg",
    children: "For children and teens under 18, BMI is assessed with WHO age- and sex-specific percentile charts — these adult cut-offs do not apply. Talk to a paediatrician about a child's weight.",
    you: "you",
  },
} as const;


export default function Bmi({ locale, height = 170, weight = 70 }: ToolProps<{ height?: number; weight?: number }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ ...bodyDefaults(locale, height, weight), a: "0" }, { enums: { u: UNIT_SYSTEMS, a: ["0", "1"] } });
  const asian = q.v.a === "1";
  const body = parseBody(locale, q.v);
  const imperial = q.v.u === "i";
  const value = body.cm !== null && body.kg !== null ? bmi(body.kg, body.cm) : null;
  const cls = value !== null ? bmiClass(value, asian) : null;
  const range = body.cm !== null ? healthyRange(body.cm, asian) : null;
  const w = (kg: number) => (imperial ? `${fmtRound(locale, kgToLb(kg), 1)} lb` : `${fmtRound(locale, kg, 1)} ${t.kg}`);
  const bounds = bmiBounds(asian);

  let delta: string = t.ok;
  if (range && body.kg !== null && cls && cls !== "normal") {
    delta = body.kg > range[1] ? t.lose(w(body.kg - range[1])) : t.gain(w(range[0] - body.kg));
  }

  const inputs = (
    <>
      <BodyFields id={id} locale={locale} v={q.v} set={q.set} errors={body.errors} />
      <OptionsRow>
        <UnitToggle locale={locale} value={q.v.u as "m" | "i"} onChange={(u) => q.set(switchUnits(locale, q.v, u))} />
        <Checkbox label={<span className="text-sm text-fg-2">{t.asian}</span>} checked={asian} onChange={(e) => q.set({ a: e.target.checked ? "1" : "0" })} />
      </OptionsRow>
    </>
  );

  const result = (
    <ResultMain
      label={t.label}
      value={value !== null ? fmtRound(locale, value, 1) : "—"}
      sub={cls ? BMI_LABEL[locale][cls] : t.enter}
      rows={
        range && value !== null
          ? [
              { label: t.range, value: `${w(range[0])} – ${w(range[1])}` },
              { label: t.toNormal, value: delta },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    >
      {value !== null && (
        <ScaleBar
          className="mt-4"
          min={14}
          max={45}
          value={value}
          format={(v) => fmtRound(locale, v, 1)}
          ariaLabel={`${t.label}: ${fmtRound(locale, value, 1)}`}
          segments={[
            { to: 18.5, label: locale === "ru" ? "дефицит" : "under", tone: "accent", strength: 0.55 },
            { to: bounds[3], label: locale === "ru" ? "норма" : "normal", tone: "ok" },
            { to: bounds[4], label: locale === "ru" ? "избыток" : "over", tone: "warn", strength: 0.6 },
            { to: 45, label: locale === "ru" ? "ожирение" : "obese", tone: "err", strength: 0.6 },
          ]}
        />
      )}
    </ResultMain>
  );

  const lows = [0, ...bounds];
  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      <section>
        <SubHeading>{asian ? t.tableAsian : t.table}</SubHeading>
        <DataTable
          caption={asian ? t.tableAsian : t.table}
          head={[t.cls, t.bmiCol, ...(body.cm !== null ? [t.weightCol] : [])]}
          highlight={cls ? BMI_CLASSES.indexOf(cls) : undefined}
          rows={BMI_CLASSES.map((c, i) => {
            const lo = lows[i];
            const hi = bounds[i];
            const span = i === 0 ? `< ${fmtRound(locale, hi, 1)}` : hi === undefined ? `≥ ${fmtRound(locale, lo, 1)}` : `${fmtRound(locale, lo, 1)} – ${fmtRound(locale, hi - 0.1, 1)}`;
            const m2 = body.cm !== null ? (body.cm / 100) ** 2 : null;
            const wr = m2 === null ? null : i === 0 ? `< ${w(hi * m2)}` : hi === undefined ? `≥ ${w(lo * m2)}` : `${w(lo * m2)} – ${w((hi - 0.1) * m2)}`;
            return [`${BMI_LABEL[locale][c]}${cls === c ? ` — ${t.you}` : ""}`, span, ...(wr ? [wr] : [])];
          })}
        />
      </section>
      <Disclaimer locale={locale}>{t.children}</Disclaimer>
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["ИМТ = вес (кг) / рост (м)²", "Например: 70 / 1,70² = 24,2"]}
          notes={[
            "Классы по ВОЗ: меньше 18,5 — дефицит массы, 18,5–24,9 — норма, 25–29,9 — избыточный вес, 30–34,9 — ожирение I степени, 35–39,9 — II степени, от 40 — III степени.",
            "Для жителей Азии ВОЗ (2004) предложила более низкие пороги риска: 23 и 27,5 — отметьте галочку, чтобы использовать их.",
            "ИМТ не различает мышцы и жир: у спортсменов он бывает завышен, у пожилых — занижен. Дополните его процентом жира и окружностью талии.",
            "В имперских единицах рост переводится по 1 дюйм = 2,54 см, вес — по 1 фунт = 0,4536 кг.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["BMI = weight (kg) / height (m)²", "BMI = 703 × weight (lb) / height (in)²"]}
          notes={[
            "WHO classes: below 18.5 underweight, 18.5–24.9 normal, 25–29.9 overweight, 30–34.9 obesity class I, 35–39.9 class II, 40 and above class III.",
            "For Asian populations the WHO (2004) suggested lower action points of 23 and 27.5 — tick the box to use them.",
            "BMI does not distinguish muscle from fat: it can overestimate fatness in athletes and underestimate it in older people. Use body-fat percentage and waist size too.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
