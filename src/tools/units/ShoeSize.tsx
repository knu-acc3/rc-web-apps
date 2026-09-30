"use client";

import { useState, type FormEvent } from "react";
import { Sneaker, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

export type ShoeCategory = "adultMen" | "adultWomen";
export type ShoeTargetSystem = "eu" | "us" | "uk" | "jp" | "mondopoint";
export type FootLengthUnit = "cm" | "in";

export interface ShoeGuideRow {
  footCm: number;
  eu: string;
  us: string;
  uk: string;
}

/**
 * ISO 19407:2023 Table 2, using the Mondopoint-grading column group.
 * The standard itself treats cross-system values as consumer guidance rather
 * than exact fit, because the systems use different grading intervals.
 */
export const SHOE_GUIDE_ROWS: Readonly<
  Record<ShoeCategory, readonly ShoeGuideRow[]>
> = {
  adultMen: [
    { footCm: 21.5, eu: "34", us: "3.5", uk: "2.5" },
    { footCm: 22, eu: "35", us: "4", uk: "3" },
    { footCm: 22.5, eu: "35.5", us: "4.5", uk: "3.5" },
    { footCm: 23, eu: "36.5", us: "5", uk: "4" },
    { footCm: 23.5, eu: "37", us: "5.5", uk: "4.5" },
    { footCm: 24, eu: "38", us: "6.5", uk: "5.5" },
    { footCm: 24.5, eu: "38.5", us: "7", uk: "6" },
    { footCm: 25, eu: "39.5", us: "7.5", uk: "6.5" },
    { footCm: 25.5, eu: "40", us: "8", uk: "7" },
    { footCm: 26, eu: "41", us: "8.5", uk: "7.5" },
    { footCm: 26.5, eu: "41.5", us: "9.5", uk: "8.5" },
    { footCm: 27, eu: "42.5", us: "10", uk: "9" },
    { footCm: 27.5, eu: "43", us: "10.5", uk: "9.5" },
    { footCm: 28, eu: "44", us: "11", uk: "10" },
    { footCm: 28.5, eu: "44.5", us: "11.5", uk: "10.5" },
    { footCm: 29, eu: "45.5", us: "12", uk: "11" },
    { footCm: 29.5, eu: "46", us: "13", uk: "12" },
    { footCm: 30, eu: "47", us: "13.5", uk: "12.5" },
    { footCm: 30.5, eu: "47.5", us: "14", uk: "13" },
    { footCm: 31, eu: "48.5", us: "14.5", uk: "13.5" },
    { footCm: 31.5, eu: "49", us: "15", uk: "14" },
    { footCm: 32, eu: "50", us: "16", uk: "15" },
  ],
  adultWomen: [
    { footCm: 21.5, eu: "34", us: "4.5", uk: "2.5" },
    { footCm: 22, eu: "35", us: "5", uk: "3" },
    { footCm: 22.5, eu: "35.5", us: "5.5", uk: "3.5" },
    { footCm: 23, eu: "36.5", us: "6", uk: "4" },
    { footCm: 23.5, eu: "37", us: "6.5", uk: "4.5" },
    { footCm: 24, eu: "38", us: "7.5", uk: "5.5" },
    { footCm: 24.5, eu: "38.5", us: "8", uk: "6" },
    { footCm: 25, eu: "39.5", us: "8.5", uk: "6.5" },
    { footCm: 25.5, eu: "40", us: "9", uk: "7" },
    { footCm: 26, eu: "41", us: "9.5", uk: "7.5" },
    { footCm: 26.5, eu: "41.5", us: "10.5", uk: "8.5" },
    { footCm: 27, eu: "42.5", us: "11", uk: "9" },
    { footCm: 27.5, eu: "43", us: "11.5", uk: "9.5" },
    { footCm: 28, eu: "44", us: "12", uk: "10" },
    { footCm: 28.5, eu: "44.5", us: "12.5", uk: "10.5" },
    { footCm: 29, eu: "45.5", us: "13", uk: "11" },
    { footCm: 29.5, eu: "46", us: "14", uk: "12" },
    { footCm: 30, eu: "47", us: "14.5", uk: "12.5" },
    { footCm: 30.5, eu: "47.5", us: "15", uk: "13" },
    { footCm: 31, eu: "48.5", us: "15.5", uk: "13.5" },
    { footCm: 31.5, eu: "49", us: "16", uk: "14" },
    { footCm: 32, eu: "50", us: "17", uk: "15" },
  ],
} as const;

export const DEFAULT_FOOT_LENGTH_CM: Readonly<Record<ShoeCategory, number>> = {
  adultMen: 26.5,
  adultWomen: 24.5,
};

export const SHOE_HALF_GRADE_CM = 0.25;
const SHOE_FLOAT_TOLERANCE_CM = 0.0001;

interface ShoeSuccess {
  status: "success";
  row: ShoeGuideRow;
  target: ShoeTargetSystem;
  category: ShoeCategory;
  size: string;
}

interface ShoeError {
  status: "error";
  message: string;
}

type ShoeSubmission = ShoeSuccess | ShoeError | null;

export function parseFootLength(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function toCentimeters(value: number, unit: FootLengthUnit): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError("Foot length must be a positive finite number.");
  }
  return unit === "cm" ? value : value * 2.54;
}

export function shoeGuideRange(category: ShoeCategory): {
  minimumCm: number;
  maximumCm: number;
} {
  const rows = SHOE_GUIDE_ROWS[category];
  return {
    minimumCm: rows[0].footCm - SHOE_HALF_GRADE_CM,
    maximumCm: rows[rows.length - 1].footCm + SHOE_HALF_GRADE_CM,
  };
}

/** Chooses the nearest 5 mm ISO guide row; an exact midpoint goes upward. */
export function findShoeGuideRow(
  footLengthCm: number,
  category: ShoeCategory,
): ShoeGuideRow | null {
  if (!Number.isFinite(footLengthCm) || footLengthCm <= 0) return null;

  const rows = SHOE_GUIDE_ROWS[category];
  const { minimumCm, maximumCm } = shoeGuideRange(category);
  if (footLengthCm < minimumCm || footLengthCm > maximumCm) return null;

  let nearest = rows[0];
  let nearestDistance = Math.abs(footLengthCm - nearest.footCm);
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const distance = Math.abs(footLengthCm - row.footCm);
    if (
      distance < nearestDistance - SHOE_FLOAT_TOLERANCE_CM ||
      (Math.abs(distance - nearestDistance) <= SHOE_FLOAT_TOLERANCE_CM &&
        row.footCm > nearest.footCm)
    ) {
      nearest = row;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function shoeSizeForTarget(
  row: ShoeGuideRow,
  target: ShoeTargetSystem,
): string {
  switch (target) {
    case "eu":
      return row.eu;
    case "us":
      return row.us;
    case "uk":
      return row.uk;
    case "jp":
      return formatCompactNumber(row.footCm);
    case "mondopoint":
      return String(Math.round(row.footCm * 10));
  }
}

export function formatCompactNumber(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/, "");
}

const SHOE_PRESETS = [
  { labelRu: "24 см (Жен)", labelEn: "24 cm (Women)", length: "24", cat: "adultWomen" as ShoeCategory },
  { labelRu: "25 см (Жен)", labelEn: "25 cm (Women)", length: "25", cat: "adultWomen" as ShoeCategory },
  { labelRu: "26.5 см (Муж)", labelEn: "26.5 cm (Men)", length: "26.5", cat: "adultMen" as ShoeCategory },
  { labelRu: "27.5 см (Муж)", labelEn: "27.5 cm (Men)", length: "27.5", cat: "adultMen" as ShoeCategory },
  { labelRu: "28.5 см (Муж)", labelEn: "28.5 cm (Men)", length: "28.5", cat: "adultMen" as ShoeCategory },
];

export default function ShoeSize() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [footLength, setFootLength] = useState("26.5");
  const [targetSystem, setTargetSystem] = useState<ShoeTargetSystem>("eu");
  const [inputUnit, setInputUnit] = useState<FootLengthUnit>("cm");
  const [category, setCategory] = useState<ShoeCategory>("adultMen");

  const computeSubmission = (
    lengthStr = footLength,
    unit = inputUnit,
    cat = category,
    target = targetSystem,
  ): ShoeSubmission => {
    const parsed = parseFootLength(lengthStr);
    const cm = parsed === null ? null : toCentimeters(parsed, unit);
    const rng = shoeGuideRange(cat);
    const inRng = cm !== null && cm >= rng.minimumCm && cm <= rng.maximumCm;

    if (cm === null || !inRng) {
      const copy =
        unit === "cm"
          ? `${formatCompactNumber(rng.minimumCm)}–${formatCompactNumber(rng.maximumCm)} cm`
          : `${formatCompactNumber(rng.minimumCm / 2.54)}–${formatCompactNumber(rng.maximumCm / 2.54)} in`;
      return {
        status: "error",
        message: isEn
          ? `Enter a foot length within the guide range: ${copy}.`
          : `Введите длину стопы в диапазоне справочника: ${copy}.`,
      };
    }

    const row = findShoeGuideRow(cm, cat);
    if (!row) {
      return {
        status: "error",
        message: isEn
          ? "This length is outside the selected category."
          : "Эта длина не входит в диапазон выбранной категории.",
      };
    }

    return {
      status: "success",
      row,
      target,
      category: cat,
      size: shoeSizeForTarget(row, target),
    };
  };

  const [submission, setSubmission] = useState<ShoeSubmission>(() => {
    return computeSubmission("26.5", "cm", "adultMen", "eu");
  });

  const parsedLength = parseFootLength(footLength);
  const footLengthCm =
    parsedLength === null ? null : toCentimeters(parsedLength, inputUnit);
  const range = shoeGuideRange(category);
  const isInRange =
    footLengthCm !== null &&
    footLengthCm >= range.minimumCm &&
    footLengthCm <= range.maximumCm;

  const categoryLabel = (value: ShoeCategory) => {
    const labels: Record<ShoeCategory, { en: string; ru: string }> = {
      adultMen: { en: "Adult men", ru: "Взрослые: мужская сетка" },
      adultWomen: { en: "Adult women", ru: "Взрослые: женская сетка" },
    };
    return isEn ? labels[value].en : labels[value].ru;
  };

  const targetLabel = (
    target: ShoeTargetSystem,
    currentCategory = category,
  ) => {
    if (target === "eu") return "EU";
    if (target === "uk") return isEn ? "UK adult" : "UK взрослый";
    if (target === "jp") return isEn ? "JP (cm)" : "JP (см)";
    if (target === "mondopoint") {
      return isEn ? "Mondopoint (mm)" : "Mondopoint (мм)";
    }
    if (currentCategory === "adultMen") {
      return isEn ? "US men" : "US мужской";
    }
    if (currentCategory === "adultWomen") {
      return isEn ? "US women" : "US женский";
    }
    return isEn ? "US women" : "US женский";
  };

  const rangeCopy = () => {
    if (inputUnit === "cm") {
      return `${formatCompactNumber(range.minimumCm)}–${formatCompactNumber(range.maximumCm)} cm`;
    }
    return `${formatCompactNumber(range.minimumCm / 2.54)}–${formatCompactNumber(range.maximumCm / 2.54)} in`;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmission(computeSubmission());
  };

  const changeInputUnit = (nextUnit: FootLengthUnit) => {
    let nextLengthStr = footLength;
    if (parsedLength !== null) {
      const currentCm = toCentimeters(parsedLength, inputUnit);
      const nextValue = nextUnit === "cm" ? currentCm : currentCm / 2.54;
      nextLengthStr = formatCompactNumber(nextValue);
      setFootLength(nextLengthStr);
    }
    setInputUnit(nextUnit);
    setSubmission(
      computeSubmission(nextLengthStr, nextUnit, category, targetSystem),
    );
  };

  const changeCategory = (nextCategory: ShoeCategory) => {
    const defaultCm = DEFAULT_FOOT_LENGTH_CM[nextCategory];
    const nextValue = inputUnit === "cm" ? defaultCm : defaultCm / 2.54;
    const nextLengthStr = formatCompactNumber(nextValue);
    setCategory(nextCategory);
    setFootLength(nextLengthStr);
    setSubmission(
      computeSubmission(nextLengthStr, inputUnit, nextCategory, targetSystem),
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {SHOE_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInputUnit("cm");
              setCategory(p.cat);
              setFootLength(p.length);
              setSubmission(
                computeSubmission(p.length, "cm", p.cat, targetSystem),
              );
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              category === p.cat && footLength === p.length && inputUnit === "cm"
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {isEn ? p.labelEn : p.labelRu}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="flex w-full flex-col gap-3"
        noValidate
      >
        <Card className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="shoe-foot-length" className="mb-1.5 block text-sm">
                {isEn
                  ? `Foot length (${inputUnit})`
                  : `Длина стопы (${inputUnit === "cm" ? "см" : "дюймы"})`}
              </Label>
              <Input
                id="shoe-foot-length"
                type="text"
                inputMode="decimal"
                value={footLength}
                onChange={(event) => {
                  const next = event.target.value;
                  setFootLength(next);
                  setSubmission(
                    computeSubmission(next, inputUnit, category, targetSystem),
                  );
                }}
                className={cn(
                  "h-12 font-mono text-lg",
                  footLength.trim() && !isInRange
                    ? "border-[var(--color-danger)]/60"
                    : undefined,
                )}
                aria-invalid={footLength.trim() !== "" && !isInRange}
                aria-describedby="shoe-length-hint"
                autoComplete="off"
              />
              <p
                id="shoe-length-hint"
                className={cn(
                  "mt-1.5 text-xs",
                  footLength.trim() && !isInRange
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-text-muted)]",
                )}
              >
                {footLength.trim() && !isInRange
                  ? isEn
                    ? `Supported for this category: ${rangeCopy()}.`
                    : `Для этой категории: ${rangeCopy()}.`
                  : isEn
                    ? "Measure the longer foot while standing."
                    : "Измерьте более длинную стопу стоя."}
              </p>
            </div>

            <label className="text-sm">
              <span className="mb-1.5 block">
                {isEn ? "Target sizing system" : "Целевая размерная сетка"}
              </span>
              <select
                value={targetSystem}
                onChange={(event) => {
                  const next = event.target.value as ShoeTargetSystem;
                  setTargetSystem(next);
                  setSubmission(
                    computeSubmission(footLength, inputUnit, category, next),
                  );
                }}
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              >
                {(["eu", "us", "uk", "jp", "mondopoint"] as const).map(
                  (target) => (
                    <option key={target} value={target}>
                      {targetLabel(target)}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? `Using ${categoryLabel(category).toLowerCase()} guidance. The result is approximate and brand-dependent.`
              : `Используется справочник «${categoryLabel(category)}». Результат приблизительный и зависит от бренда.`}
          </p>

          <div className="mt-4">
            <ToolPrimaryAction
              type="submit"
              fullWidthOnMobile={false}
              className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
              leadingIcon={<Sneaker size={20} aria-hidden="true" />}
            >
              {isEn
                ? "Find approximate size"
                : "Подобрать ориентировочный размер"}
            </ToolPrimaryAction>
          </div>

        <ToolResult
          className="mt-5"
          status={submission?.status ?? "idle"}
          title={
            submission?.status === "success"
              ? isEn
                ? "Approximate size"
                : "Ориентировочный размер"
              : submission?.status === "error"
                ? isEn
                  ? "Check the foot length"
                  : "Проверьте длину стопы"
                : isEn
                  ? "Size guidance"
                  : "Ориентир по размеру"
          }
          description={
            submission?.status === "error"
              ? submission.message
              : submission?.status === "success"
                ? isEn
                  ? "Use the brand's own chart before ordering; its last and fit take priority."
                  : "Перед заказом сверьтесь с таблицей бренда: его колодка и посадка важнее этого ориентира."
                : isEn
                  ? "Enter the measured foot length to get one concise reference size."
                  : "Введите измеренную длину стопы, чтобы получить один ориентировочный размер."
          }
        >
          {submission?.status === "success" ? (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
              <p className="text-sm font-medium text-[var(--color-text-muted)]">
                {targetLabel(submission.target, submission.category)}
              </p>
              <p className="mt-1 break-words font-mono text-3xl font-bold text-[var(--color-text)]">
                {submission.size}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {isEn
                  ? `Matched to the nearest 5 mm guide row at ${formatCompactNumber(submission.row.footCm)} cm; an exact midpoint is resolved upward.`
                  : `Выбрана ближайшая строка справочника с шагом 5 мм — ${formatCompactNumber(submission.row.footCm)} см; точная середина округляется вверх.`}
              </p>
            </div>
          ) : null}
        </ToolResult>
      </Card>

      <AdvancedSettings
        title={isEn ? "Measurement context" : "Параметры измерения"}
        description={
          isEn
            ? "Input unit and the applicable adult US scale"
            : "Единица длины и подходящая взрослая сетка США"
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">
              {isEn ? "Foot-length unit" : "Единица длины стопы"}
            </span>
            <select
              value={inputUnit}
              onChange={(event) =>
                changeInputUnit(event.target.value as FootLengthUnit)
              }
              className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            >
              <option value="cm">{isEn ? "Centimetres" : "Сантиметры"}</option>
              <option value="in">{isEn ? "Inches" : "Дюймы"}</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block font-medium">
              {isEn ? "Sizing category" : "Размерная категория"}
            </span>
            <select
              value={category}
              onChange={(event) =>
                changeCategory(event.target.value as ShoeCategory)
              }
              className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            >
              {(["adultMen", "adultWomen"] as const).map((value) => (
                <option key={value} value={value}>
                  {categoryLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm leading-relaxed text-[var(--color-text-muted)] sm:col-span-2">
            <p>
              {isEn
                ? "Method: ISO 19407:2023 Table 2 recommended adult markings for Mondopoint grading, in 5 mm steps. The nearest row is selected; an exact midpoint goes upward. The standard treats cross-system values as guidance, not exact fit."
                : "Метод: рекомендуемые взрослые размеры из таблицы 2 ISO 19407:2023 для шкалы Mondopoint, с шагом 5 мм. Выбирается ближайшая строка; точная середина округляется вверх. Сам стандарт считает межсистемные значения ориентиром, а не гарантией посадки."}
            </p>
            <p className="mt-2">
              {isEn
                ? "JP is shown as the guide length in centimetres and Mondopoint in millimetres. Width, volume and toe shape are outside this lookup. Allow for socks and intended use, then follow the specific brand chart."
                : "JP показан как длина строки справочника в сантиметрах, Mondopoint — в миллиметрах. Ширина, объём и форма носка в расчёт не входят. Учтите носки и назначение обуви, затем следуйте таблице конкретного бренда."}
            </p>
          </div>
        </div>
      </AdvancedSettings>
      </form>
    </div>
  );
}
