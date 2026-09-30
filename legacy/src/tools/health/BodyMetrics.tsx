"use client";

import { useState } from "react";
import { Calculator, CheckCircle, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type UnitSystem = "metric" | "imperial";
type BodyField = "height" | "weight";
type BodyErrorCode = "empty" | "invalid" | "range";
type BmiCategory = "underweight" | "reference" | "overweight" | "obesity";

type BodyResult =
  | {
      kind: "success";
      bmi: number;
      category: BmiCategory;
      rangeMinKg: number;
      rangeMaxKg: number;
    }
  | {
      kind: "error";
      field: BodyField;
      code: BodyErrorCode;
    };

class BodyInputError extends Error {
  field: BodyField;
  code: BodyErrorCode;

  constructor(field: BodyField, code: BodyErrorCode) {
    super(code);
    this.name = "BodyInputError";
    this.field = field;
    this.code = code;
  }
}

const DECIMAL_VALUE = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
const KG_PER_POUND = 0.45359237;
const METERS_PER_INCH = 0.0254;

function parseMeasurement(
  value: string,
  field: BodyField,
  unitSystem: UnitSystem,
): number {
  const trimmed = value.trim();
  if (!trimmed) throw new BodyInputError(field, "empty");
  if (!DECIMAL_VALUE.test(trimmed)) {
    throw new BodyInputError(field, "invalid");
  }

  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    throw new BodyInputError(field, "invalid");
  }

  const limits =
    field === "height"
      ? unitSystem === "metric"
        ? { min: 80, max: 250 }
        : { min: 31.5, max: 98.4 }
      : unitSystem === "metric"
        ? { min: 20, max: 500 }
        : { min: 44.1, max: 1102.3 };

  if (parsed < limits.min || parsed > limits.max) {
    throw new BodyInputError(field, "range");
  }

  return parsed;
}

function getCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "reference";
  if (bmi < 30) return "overweight";
  return "obesity";
}

function calculateBodyMetrics(
  heightInput: string,
  weightInput: string,
  unitSystem: UnitSystem,
): BodyResult {
  try {
    const height = parseMeasurement(heightInput, "height", unitSystem);
    const weight = parseMeasurement(weightInput, "weight", unitSystem);
    const heightMeters =
      unitSystem === "metric" ? height / 100 : height * METERS_PER_INCH;
    const weightKg = unitSystem === "metric" ? weight : weight * KG_PER_POUND;
    const heightSquared = heightMeters * heightMeters;
    const bmi = weightKg / heightSquared;
    const rangeMinKg = 18.5 * heightSquared;
    const rangeMaxKg = 24.9 * heightSquared;

    if (
      !Number.isFinite(bmi) ||
      !Number.isFinite(rangeMinKg) ||
      !Number.isFinite(rangeMaxKg)
    ) {
      throw new BodyInputError("weight", "invalid");
    }

    return {
      kind: "success",
      bmi,
      category: getCategory(bmi),
      rangeMinKg,
      rangeMaxKg,
    };
  } catch (caught) {
    if (caught instanceof BodyInputError) {
      return {
        kind: "error",
        field: caught.field,
        code: caught.code,
      };
    }

    return { kind: "error", field: "height", code: "invalid" };
  }
}

function categoryLabel(category: BmiCategory, isEn: boolean): string {
  if (category === "underweight") {
    return isEn ? "Below the reference range" : "Ниже референсного диапазона";
  }
  if (category === "reference") {
    return isEn ? "Within the reference range" : "В референсном диапазоне";
  }
  if (category === "overweight") {
    return isEn ? "Overweight range" : "Диапазон избыточной массы";
  }
  return isEn ? "Obesity range" : "Диапазон ожирения";
}

function errorMessage(
  result: Extract<BodyResult, { kind: "error" }>,
  unitSystem: UnitSystem,
  isEn: boolean,
): string {
  const fieldName =
    result.field === "height"
      ? isEn
        ? "Height"
        : "Рост"
      : isEn
        ? "Weight"
        : "Вес";

  if (result.code === "empty") {
    return isEn ? fieldName + " is required." : fieldName + ": заполните поле.";
  }
  if (result.code === "invalid") {
    return isEn
      ? fieldName + " must be a valid number."
      : fieldName + ": введите корректное число.";
  }

  if (result.field === "height") {
    return unitSystem === "metric"
      ? isEn
        ? "Height must be from 80 to 250 cm."
        : "Рост должен быть от 80 до 250 см."
      : isEn
        ? "Height must be from 31.5 to 98.4 inches."
        : "Рост должен быть от 31,5 до 98,4 дюйма.";
  }

  return unitSystem === "metric"
    ? isEn
      ? "Weight must be from 20 to 500 kg."
      : "Вес должен быть от 20 до 500 кг."
    : isEn
      ? "Weight must be from 44.1 to 1102.3 lb."
      : "Вес должен быть от 44,1 до 1102,3 фунта.";
}

function formatDecimal(value: number, isEn: boolean): string {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export default function BodyMetrics() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<BodyResult | null>(null);

  const weightUnit = unitSystem === "metric" ? "kg" : "lb";
  const heightUnit = unitSystem === "metric" ? "cm" : "in";

  const resetCalculation = () => {
    setResult(null);
  };

  return (
    <div
      data-health-tool="body-metrics"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Calculate your BMI" : "Рассчитайте индекс массы тела"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Enter height and weight. This screening calculation is for adults aged 18 and over."
            : "Укажите рост и вес. Этот ориентировочный расчёт предназначен для взрослых от 18 лет."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(calculateBodyMetrics(height, weight, unitSystem));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="body-height">
                {isEn ? "Height" : "Рост"} ({heightUnit})
              </Label>
              <Input
                id="body-height"
                value={height}
                onChange={(event) => {
                  setHeight(event.target.value);
                  resetCalculation();
                }}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                className="mt-2 font-mono"
              />
            </div>

            <div>
              <Label htmlFor="body-weight">
                {isEn ? "Weight" : "Вес"} ({weightUnit})
              </Label>
              <Input
                id="body-weight"
                value={weight}
                onChange={(event) => {
                  setWeight(event.target.value);
                  resetCalculation();
                }}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 font-mono"
              />
            </div>
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={<Calculator size={20} weight="bold" />}
          >
            {isEn ? "Calculate BMI" : "Рассчитать ИМТ"}
          </ToolPrimaryAction>
        </form>

        {result ? (
          result.kind === "error" ? (
            <section
              aria-live="polite"
              data-body-result=""
              data-body-status="error"
              role="alert"
              className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-surface-muted)] p-4"
            >
              <div className="flex items-start gap-3">
                <XCircle
                  size={24}
                  weight="fill"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                />
                <div>
                  <h3 className="font-bold text-[var(--color-danger)]">
                    {isEn ? "Check your values" : "Проверьте значения"}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {errorMessage(result, unitSystem, isEn)}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section
              aria-live="polite"
              data-body-result=""
              data-body-status={result.category}
              data-body-bmi={result.bmi.toFixed(1)}
              data-body-range-min={(unitSystem === "metric"
                ? result.rangeMinKg
                : result.rangeMinKg / KG_PER_POUND
              ).toFixed(1)}
              data-body-range-max={(unitSystem === "metric"
                ? result.rangeMaxKg
                : result.rangeMaxKg / KG_PER_POUND
              ).toFixed(1)}
              className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-surface-muted)] p-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle
                  size={26}
                  weight="fill"
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-[var(--color-success)]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Your BMI" : "Ваш ИМТ"}
                  </p>
                  <p
                    data-body-bmi-value=""
                    className="mt-1 text-4xl font-black tracking-tight text-[var(--color-text)]"
                  >
                    {formatDecimal(result.bmi, isEn)}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--color-text)]">
                    {categoryLabel(result.category, isEn)}
                  </p>
                  <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {isEn
                        ? "Weight range at BMI 18.5–24.9"
                        : "Диапазон веса при ИМТ 18,5–24,9"}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[var(--color-text)]">
                      {formatDecimal(
                        unitSystem === "metric"
                          ? result.rangeMinKg
                          : result.rangeMinKg / KG_PER_POUND,
                        isEn,
                      )}{" "}
                      –{" "}
                      {formatDecimal(
                        unitSystem === "metric"
                          ? result.rangeMaxKg
                          : result.rangeMaxKg / KG_PER_POUND,
                        isEn,
                      )}{" "}
                      {weightUnit}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )
        ) : null}
      </section>

      <AdvancedSettings
        title={isEn ? "Units and interpretation" : "Единицы и интерпретация"}
        description={
          isEn
            ? "Change units and read the limits of BMI"
            : "Смена единиц и ограничения метода ИМТ"
        }
      >
        <Label htmlFor="body-units">
          {isEn ? "Unit system" : "Система единиц"}
        </Label>
        <select
          id="body-units"
          value={unitSystem}
          onChange={(event) => {
            setUnitSystem(event.target.value as UnitSystem);
            setHeight("");
            setWeight("");
            setResult(null);
          }}
          className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] sm:text-sm"
        >
          <option value="metric">
            {isEn ? "Metric (cm, kg)" : "Метрическая (см, кг)"}
          </option>
          <option value="imperial">
            {isEn ? "Imperial (in, lb)" : "Имперская (дюймы, фунты)"}
          </option>
        </select>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            {isEn
              ? "BMI is weight in kilograms divided by height in metres squared. For adults, WHO defines overweight as BMI 25 or higher and obesity as BMI 30 or higher."
              : "ИМТ — это вес в килограммах, разделённый на квадрат роста в метрах. Для взрослых ВОЗ определяет избыточную массу при ИМТ от 25, а ожирение — при ИМТ от 30."}
          </p>
          <p>
            {isEn
              ? "BMI is a screening measure, not a diagnosis. It does not account for individual body composition; discuss health concerns with a qualified clinician."
              : "ИМТ — ориентировочный показатель, а не диагноз. Он не учитывает индивидуальный состав тела; вопросы о здоровье обсудите с квалифицированным специалистом."}
          </p>
          <a
            href="https://www.who.int/en/news-room/fact-sheets/detail/obesity-and-overweight"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] underline decoration-1 underline-offset-4 hover:no-underline"
          >
            {isEn ? "Official WHO source" : "Официальный источник ВОЗ"}
          </a>
        </div>
      </AdvancedSettings>
    </div>
  );
}
