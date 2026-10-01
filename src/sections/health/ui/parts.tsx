"use client";

import type { Locale } from "@/i18n/config";
import { field, toInput, type NumResult } from "../../calc/kit/num";
import { FieldRow, InlineToggle, NumField } from "../../calc/kit/ui";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, type Sex } from "../engines/body";

const T = {
  ru: {
    sex: "Пол",
    male: "Мужчина",
    female: "Женщина",
    units: "Единицы",
    metric: "см, кг",
    imperial: "фут, фунт",
    height: "Рост",
    weight: "Вес",
    ft: "Рост, футы",
    inch: "дюймы",
    cm: "см",
    kg: "кг",
    lb: "фунты",
  },
  en: {
    sex: "Sex",
    male: "Male",
    female: "Female",
    units: "Units",
    metric: "cm, kg",
    imperial: "ft, lb",
    height: "Height",
    weight: "Weight",
    ft: "Height, ft",
    inch: "in",
    cm: "cm",
    kg: "kg",
    lb: "lb",
  },
} as const;

export const UNIT_SYSTEMS = ["m", "i"] as const;
export const SEXES = ["male", "female"] as const;

export function SexToggle({ locale, value, onChange }: { locale: Locale; value: Sex; onChange: (s: Sex) => void }) {
  const t = T[locale];
  return (
    <InlineToggle
      label={t.sex}
      value={value}
      onChange={onChange}
      options={[
        { value: "male", label: t.male },
        { value: "female", label: t.female },
      ]}
    />
  );
}

/** Query keys used by BodyFields: u (unit system), h (cm), w (kg), ft, in, lb. */
type BodyKeys = "u" | "h" | "w" | "ft" | "in" | "lb";
type BodyValues = Record<BodyKeys, string>;

export function bodyDefaults(locale: Locale, cm: number, kg: number): BodyValues {
  const { ft, inch } = cmToFtIn(cm);
  return { u: "m", h: toInput(locale, cm), w: toInput(locale, kg), ft: String(ft), in: toInput(locale, Math.round(inch)), lb: toInput(locale, Math.round(kgToLb(kg))) };
}

interface BodyParsed {
  cm: number | null;
  kg: number | null;
  errors: { h?: string; w?: string; ft?: string; in?: string; lb?: string };
}

export function parseBody(locale: Locale, v: BodyValues): BodyParsed {
  if (v.u === "i") {
    const ft = field(locale, v.ft, { min: 1, max: 8 });
    const inch: NumResult & { message?: string } = v.in.trim() === "" ? { value: 0, error: null, empty: true } : field(locale, v.in, { min: 0, max: 11.99 });
    const lb = field(locale, v.lb, { min: 20, max: 1000 });
    return {
      cm: ft.value !== null && inch.value !== null ? ftInToCm(ft.value, inch.value) : null,
      kg: lb.value !== null ? lbToKg(lb.value) : null,
      errors: { ft: ft.message, in: inch.message, lb: lb.message },
    };
  }
  const h = field(locale, v.h, { min: 50, max: 250 });
  const w = field(locale, v.w, { min: 10, max: 400 });
  return { cm: h.value, kg: w.value, errors: { h: h.message, w: w.message } };
}

/** Switch unit system, converting the current values. */
export function switchUnits(locale: Locale, v: BodyValues, next: "m" | "i"): Partial<BodyValues> {
  const p = parseBody(locale, v);
  if (next === "i") {
    const out: Partial<BodyValues> = { u: "i" };
    if (p.cm !== null) {
      const { ft, inch } = cmToFtIn(p.cm);
      out.ft = String(ft);
      out.in = toInput(locale, Math.round(inch));
    }
    if (p.kg !== null) out.lb = toInput(locale, Math.round(kgToLb(p.kg)));
    return out;
  }
  const out: Partial<BodyValues> = { u: "m" };
  if (p.cm !== null) out.h = toInput(locale, Math.round(p.cm));
  if (p.kg !== null) out.w = toInput(locale, Math.round(p.kg * 10) / 10);
  return out;
}

export function UnitToggle({ locale, value, onChange }: { locale: Locale; value: "m" | "i"; onChange: (u: "m" | "i") => void }) {
  const t = T[locale];
  return (
    <InlineToggle
      label={t.units}
      value={value}
      onChange={onChange}
      options={[
        { value: "m", label: t.metric },
        { value: "i", label: t.imperial },
      ]}
    />
  );
}

/** Height and weight inputs in the chosen unit system. */
export function BodyFields({
  id,
  locale,
  v,
  set,
  errors,
  weight = true,
  size = "lg",
}: {
  id: string;
  locale: Locale;
  v: BodyValues;
  set: (patch: Partial<BodyValues>) => void;
  errors: BodyParsed["errors"];
  weight?: boolean;
  size?: "md" | "lg";
}) {
  const t = T[locale];
  if (v.u === "i") {
    return (
      <>
        <FieldRow>
          <NumField id={`${id}-ft`} label={t.ft} value={v.ft} onChange={(ft) => set({ ft })} suffix="ft" error={errors.ft} inputMode="numeric" size={size} />
          <NumField id={`${id}-in`} label={t.inch} value={v.in} onChange={(x) => set({ in: x })} suffix="in" error={errors.in} size={size} />
        </FieldRow>
        {weight && <NumField id={`${id}-lb`} label={`${t.weight}, ${t.lb}`} value={v.lb} onChange={(lb) => set({ lb })} suffix="lb" error={errors.lb} size={size} />}
      </>
    );
  }
  const heightField = <NumField id={`${id}-h`} label={t.height} value={v.h} onChange={(h) => set({ h })} suffix={t.cm} error={errors.h} size={size} />;
  if (!weight) return heightField;
  return (
    <FieldRow>
      {heightField}
      <NumField id={`${id}-w`} label={t.weight} value={v.w} onChange={(w) => set({ w })} suffix={t.kg} error={errors.w} size={size} />
    </FieldRow>
  );
}
