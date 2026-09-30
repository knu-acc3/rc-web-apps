"use client";

import { useState } from "react";
import { Calculator, Drop, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type UnitSystem = "metric" | "imperial";
type WaterErrorCode = "empty" | "invalid" | "range";

type WaterResult =
  | {
      kind: "success";
      lowMl: number;
      highMl: number;
    }
  | {
      kind: "error";
      code: WaterErrorCode;
    };

class WaterInputError extends Error {
  code: WaterErrorCode;

  constructor(code: WaterErrorCode) {
    super(code);
    this.name = "WaterInputError";
    this.code = code;
  }
}

const DECIMAL_VALUE = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
const KG_PER_POUND = 0.45359237;
const LOW_COEFFICIENT = 30;
const HIGH_COEFFICIENT = 35;

function parseWeight(value: string, unitSystem: UnitSystem): number {
  const trimmed = value.trim();
  if (!trimmed) throw new WaterInputError("empty");
  if (!DECIMAL_VALUE.test(trimmed)) {
    throw new WaterInputError("invalid");
  }

  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    throw new WaterInputError("invalid");
  }

  const limits =
    unitSystem === "metric"
      ? { min: 20, max: 500 }
      : { min: 44.1, max: 1102.3 };

  if (parsed < limits.min || parsed > limits.max) {
    throw new WaterInputError("range");
  }

  return unitSystem === "metric" ? parsed : parsed * KG_PER_POUND;
}

function calculateWaterRange(
  weightInput: string,
  unitSystem: UnitSystem,
): WaterResult {
  try {
    const weightKg = parseWeight(weightInput, unitSystem);
    const lowMl = Math.round(weightKg * LOW_COEFFICIENT);
    const highMl = Math.round(weightKg * HIGH_COEFFICIENT);

    if (!Number.isFinite(lowMl) || !Number.isFinite(highMl)) {
      throw new WaterInputError("invalid");
    }

    return { kind: "success", lowMl, highMl };
  } catch (caught) {
    if (caught instanceof WaterInputError) {
      return { kind: "error", code: caught.code };
    }
    return { kind: "error", code: "invalid" };
  }
}

function errorMessage(
  result: Extract<WaterResult, { kind: "error" }>,
  unitSystem: UnitSystem,
  isEn: boolean,
): string {
  if (result.code === "empty") {
    return isEn ? "Weight is required." : "Укажите вес.";
  }
  if (result.code === "invalid") {
    return isEn
      ? "Weight must be a valid number."
      : "Введите корректное значение веса.";
  }

  return unitSystem === "metric"
    ? isEn
      ? "Weight must be from 20 to 500 kg."
      : "Вес должен быть от 20 до 500 кг."
    : isEn
      ? "Weight must be from 44.1 to 1102.3 lb."
      : "Вес должен быть от 44,1 до 1102,3 фунта.";
}

function formatLitres(millilitres: number, isEn: boolean): string {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(millilitres / 1000);
}

function formatMillilitres(millilitres: number, isEn: boolean): string {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    maximumFractionDigits: 0,
  }).format(millilitres);
}

export default function WaterIntake() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<WaterResult | null>(null);

  const weightUnit = unitSystem === "metric" ? "kg" : "lb";

  return (
    <div
      data-health-tool="water-intake"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn
            ? "Estimate a daily fluid range"
            : "Оцените диапазон жидкости на день"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Enter your weight for a broad starting estimate for generally healthy adults. It is not a medical intake target and is not intended for children."
            : "Укажите вес, чтобы получить широкий ориентир для в целом здорового взрослого. Это не медицинская норма и не расчёт для детей."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(calculateWaterRange(weight, unitSystem));
          }}
        >
          <div className="max-w-sm">
            <Label htmlFor="water-weight">
              {isEn ? "Weight" : "Вес"} ({weightUnit})
            </Label>
            <Input
              id="water-weight"
              value={weight}
              onChange={(event) => {
                setWeight(event.target.value);
                setResult(null);
              }}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="mt-2 font-mono"
            />
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={<Calculator size={20} weight="bold" />}
          >
            {isEn ? "Estimate range" : "Рассчитать диапазон"}
          </ToolPrimaryAction>
        </form>

        {result ? (
          result.kind === "error" ? (
            <section
              aria-live="polite"
              data-water-result=""
              data-water-status="error"
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
                    {isEn ? "Check your weight" : "Проверьте значение веса"}
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
              data-water-result=""
              data-water-status="estimate"
              data-water-low-ml={result.lowMl}
              data-water-high-ml={result.highMl}
              className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-surface-muted)] p-4"
            >
              <div className="flex items-start gap-3">
                <Drop
                  size={26}
                  weight="fill"
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-[var(--color-primary)]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn
                      ? "Approximate total fluid"
                      : "Ориентировочный общий объём жидкости"}
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-[var(--color-text)] sm:text-4xl">
                    {formatLitres(result.lowMl, isEn)}–
                    {formatLitres(result.highMl, isEn)}{" "}
                    {isEn ? "L/day" : "л/день"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-text-muted)]">
                    {formatMillilitres(result.lowMl, isEn)}–
                    {formatMillilitres(result.highMl, isEn)}{" "}
                    {isEn ? "ml/day" : "мл/день"}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {isEn
                      ? "This total includes fluid from food and all beverages, not only plain water."
                      : "В этот объём входит жидкость из еды и всех напитков, а не только чистая вода."}
                  </p>
                </div>
              </div>
            </section>
          )
        ) : null}
      </section>

      <AdvancedSettings
        title={isEn ? "Units and calculation note" : "Единицы и метод расчёта"}
        description={
          isEn
            ? "Unit system and the fixed 30–35 ml/kg range"
            : "Система единиц и диапазон 30–35 мл/кг"
        }
      >
        <Label htmlFor="water-units">
          {isEn ? "Unit system" : "Система единиц"}
        </Label>
        <select
          id="water-units"
          value={unitSystem}
          onChange={(event) => {
            setUnitSystem(event.target.value as UnitSystem);
            setWeight("");
            setResult(null);
          }}
          className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] sm:text-sm"
        >
          <option value="metric">
            {isEn ? "Metric (kg)" : "Метрическая (кг)"}
          </option>
          <option value="imperial">
            {isEn ? "Imperial (lb)" : "Имперская (фунты)"}
          </option>
        </select>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            {isEn
              ? "The calculator multiplies body weight by a broad coefficient range of 30–35 ml/kg per day. It deliberately does not add precise-looking climate or activity adjustments."
              : "Калькулятор умножает вес на широкий ориентировочный диапазон 30–35 мл/кг в день. Он намеренно не добавляет климатические или спортивные поправки с ложной точностью."}
          </p>
          <p>
            {isEn
              ? "Individual needs can differ substantially. Kidney or heart disease, pregnancy, heat and strenuous exercise require personalized advice from a qualified clinician."
              : "Индивидуальная потребность может существенно отличаться. При заболеваниях почек или сердца, беременности, жаре и интенсивных нагрузках нужна персональная рекомендация квалифицированного специалиста."}
          </p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
