"use client";

import { useState, type FormEvent } from "react";
import { Calculator } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const VIDEO_ASPECT_LIMITS = {
  minimumDimension: 1,
  maximumDimension: 1_000_000,
} as const;

export type VideoAspectRounding = "exact" | "nearest" | "floor" | "ceil";

export interface SimplifiedAspectRatio {
  width: number;
  height: number;
}

export interface TargetHeightCalculation {
  width: number;
  height: number;
  exactHeight: number;
  exactNumerator: number;
  exactDenominator: number;
  rounding: VideoAspectRounding;
  wasClampedToMinimum: boolean;
}

export interface VideoAspectCalculation {
  sourceWidth: number;
  sourceHeight: number;
  ratio: SimplifiedAspectRatio;
  target: TargetHeightCalculation | null;
}

type DimensionField = "sourceWidth" | "sourceHeight" | "targetWidth";

interface ValidationError {
  field: DimensionField;
  message: string;
}

const ROUNDING_OPTIONS: readonly VideoAspectRounding[] = [
  "exact",
  "nearest",
  "floor",
  "ceil",
];

export function isValidVideoDimension(value: number): boolean {
  return (
    Number.isFinite(value) &&
    Number.isSafeInteger(value) &&
    value >= VIDEO_ASPECT_LIMITS.minimumDimension &&
    value <= VIDEO_ASPECT_LIMITS.maximumDimension
  );
}

export function parseVideoDimension(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return isValidVideoDimension(parsed) ? parsed : null;
}

export function greatestCommonDivisor(left: number, right: number): number {
  if (
    !Number.isSafeInteger(left) ||
    !Number.isSafeInteger(right) ||
    left <= 0 ||
    right <= 0
  ) {
    throw new RangeError("GCD values must be positive safe integers.");
  }

  let a = left;
  let b = right;
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

export function simplifyAspectRatio(
  width: number,
  height: number,
): SimplifiedAspectRatio {
  if (!isValidVideoDimension(width) || !isValidVideoDimension(height)) {
    throw new RangeError("Video dimensions are outside the supported range.");
  }

  const divisor = greatestCommonDivisor(width, height);
  return { width: width / divisor, height: height / divisor };
}

export function applyVideoRounding(
  value: number,
  rounding: VideoAspectRounding,
): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError("Target height must be a positive finite number.");
  }

  switch (rounding) {
    case "nearest":
      return Math.max(VIDEO_ASPECT_LIMITS.minimumDimension, Math.round(value));
    case "floor":
      return Math.max(VIDEO_ASPECT_LIMITS.minimumDimension, Math.floor(value));
    case "ceil":
      return Math.max(VIDEO_ASPECT_LIMITS.minimumDimension, Math.ceil(value));
    case "exact":
      return value;
  }
}

export function calculateVideoAspect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number | null,
  rounding: VideoAspectRounding,
): VideoAspectCalculation {
  if (
    !isValidVideoDimension(sourceWidth) ||
    !isValidVideoDimension(sourceHeight) ||
    (targetWidth !== null && !isValidVideoDimension(targetWidth))
  ) {
    throw new RangeError("Video dimensions are outside the supported range.");
  }
  if (!ROUNDING_OPTIONS.includes(rounding)) {
    throw new RangeError("Unsupported rounding mode.");
  }

  const ratio = simplifyAspectRatio(sourceWidth, sourceHeight);
  if (targetWidth === null) {
    return { sourceWidth, sourceHeight, ratio, target: null };
  }

  const rawNumerator = targetWidth * sourceHeight;
  if (!Number.isSafeInteger(rawNumerator)) {
    throw new RangeError("Calculated height is outside the safe range.");
  }

  const fractionDivisor = greatestCommonDivisor(rawNumerator, sourceWidth);
  const exactNumerator = rawNumerator / fractionDivisor;
  const exactDenominator = sourceWidth / fractionDivisor;
  const exactHeight = rawNumerator / sourceWidth;
  const height = applyVideoRounding(exactHeight, rounding);
  const unboundedRoundedHeight =
    rounding === "nearest"
      ? Math.round(exactHeight)
      : rounding === "floor"
        ? Math.floor(exactHeight)
        : rounding === "ceil"
          ? Math.ceil(exactHeight)
          : exactHeight;

  return {
    sourceWidth,
    sourceHeight,
    ratio,
    target: {
      width: targetWidth,
      height,
      exactHeight,
      exactNumerator,
      exactDenominator,
      rounding,
      wasClampedToMinimum: rounding !== "exact" && unboundedRoundedHeight < 1,
    },
  };
}

function formatNumber(
  value: number,
  isEn: boolean,
  fractionDigits = 0,
): string {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function dimensionError(
  field: DimensionField,
  value: string,
  isEn: boolean,
): ValidationError | null {
  const isOptional = field === "targetWidth";
  const normalized = value.trim();

  if (!normalized) {
    if (isOptional) return null;
    return {
      field,
      message: isEn
        ? field === "sourceWidth"
          ? "Enter the source width."
          : "Enter the source height."
        : field === "sourceWidth"
          ? "Укажите исходную ширину."
          : "Укажите исходную высоту.",
    };
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      field,
      message: isEn
        ? "Dimensions must be positive whole numbers."
        : "Размеры должны быть положительными целыми числами.",
    };
  }

  if (parseVideoDimension(normalized) === null) {
    const maximum = formatNumber(VIDEO_ASPECT_LIMITS.maximumDimension, isEn);
    return {
      field,
      message: isEn
        ? `Enter a dimension from 1 to ${maximum} pixels.`
        : `Укажите размер от 1 до ${maximum} пикселей.`,
    };
  }

  return null;
}

function roundingCopy(rounding: VideoAspectRounding, isEn: boolean) {
  const copy = {
    exact: {
      title: isEn ? "Exact" : "Точно",
      description: isEn
        ? "Keep a reduced fraction when the height is not whole."
        : "Сохранить сокращённую дробь, если высота нецелая.",
    },
    nearest: {
      title: isEn ? "Nearest integer" : "До ближайшего",
      description: isEn
        ? "Round to the closest whole pixel."
        : "Округлить до ближайшего целого пикселя.",
    },
    floor: {
      title: isEn ? "Round down" : "В меньшую сторону",
      description: isEn
        ? "Use the lower whole-pixel height."
        : "Использовать меньшую целую высоту.",
    },
    ceil: {
      title: isEn ? "Round up" : "В большую сторону",
      description: isEn
        ? "Use the higher whole-pixel height."
        : "Использовать большую целую высоту.",
    },
  } as const;
  return copy[rounding];
}

function exactHeightText(
  target: TargetHeightCalculation,
  isEn: boolean,
): string {
  if (target.exactDenominator === 1) {
    return formatNumber(target.exactNumerator, isEn);
  }
  return `${formatNumber(target.exactNumerator, isEn)} / ${formatNumber(target.exactDenominator, isEn)}`;
}

export default function VideoAspect() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [sourceWidth, setSourceWidth] = useState("1920");
  const [sourceHeight, setSourceHeight] = useState("1080");
  const [targetWidth, setTargetWidth] = useState("");
  const [rounding, setRounding] = useState<VideoAspectRounding>("exact");
  const [result, setResult] = useState<VideoAspectCalculation | null>(null);
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);

  const clearResult = () => {
    setResult(null);
    setValidationError(null);
  };

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fields: readonly [DimensionField, string][] = [
      ["sourceWidth", sourceWidth],
      ["sourceHeight", sourceHeight],
      ["targetWidth", targetWidth],
    ];
    for (const [field, value] of fields) {
      const error = dimensionError(field, value, isEn);
      if (error) {
        setValidationError(error);
        setResult(null);
        return;
      }
    }

    const parsedSourceWidth = parseVideoDimension(sourceWidth);
    const parsedSourceHeight = parseVideoDimension(sourceHeight);
    const parsedTargetWidth = targetWidth.trim()
      ? parseVideoDimension(targetWidth)
      : null;

    if (parsedSourceWidth === null || parsedSourceHeight === null) return;

    try {
      setResult(
        calculateVideoAspect(
          parsedSourceWidth,
          parsedSourceHeight,
          parsedTargetWidth,
          rounding,
        ),
      );
      setValidationError(null);
    } catch {
      setResult(null);
      setValidationError({
        field: "targetWidth",
        message: isEn
          ? "These dimensions produce a result outside the safe calculation range."
          : "Эти размеры дают результат вне безопасного диапазона расчёта.",
      });
    }
  };

  const target = result?.target ?? null;
  const displayedHeight = target
    ? target.rounding === "exact"
      ? exactHeightText(target, isEn)
      : formatNumber(target.height, isEn)
    : "";
  const ratioText = result
    ? `${formatNumber(result.ratio.width, isEn)}:${formatNumber(result.ratio.height, isEn)}`
    : "";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <form onSubmit={calculate} noValidate>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="video-aspect-source-width">
                {isEn ? "Source width" : "Исходная ширина"}
              </Label>
              <Input
                id="video-aspect-source-width"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                spellCheck={false}
                value={sourceWidth}
                aria-invalid={validationError?.field === "sourceWidth"}
                aria-describedby="video-aspect-dimension-hint"
                onChange={(event) => {
                  setSourceWidth(event.target.value);
                  clearResult();
                }}
                className="mt-1.5 h-12 font-mono text-base tabular-nums"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor="video-aspect-source-height">
                {isEn ? "Source height" : "Исходная высота"}
              </Label>
              <Input
                id="video-aspect-source-height"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                spellCheck={false}
                value={sourceHeight}
                aria-invalid={validationError?.field === "sourceHeight"}
                aria-describedby="video-aspect-dimension-hint"
                onChange={(event) => {
                  setSourceHeight(event.target.value);
                  clearResult();
                }}
                className="mt-1.5 h-12 font-mono text-base tabular-nums"
              />
            </div>

            <div className="min-w-0 sm:col-span-2 sm:max-w-sm">
              <Label htmlFor="video-aspect-target-width">
                {isEn
                  ? "Target width (optional)"
                  : "Новая ширина (необязательно)"}
              </Label>
              <Input
                id="video-aspect-target-width"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                spellCheck={false}
                value={targetWidth}
                aria-invalid={validationError?.field === "targetWidth"}
                aria-describedby="video-aspect-dimension-hint"
                onChange={(event) => {
                  setTargetWidth(event.target.value);
                  clearResult();
                }}
                placeholder="1280"
                className="mt-1.5 h-12 font-mono text-base tabular-nums"
              />
            </div>
          </div>

          <p
            id="video-aspect-dimension-hint"
            className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]"
          >
            {isEn
              ? "Whole pixel dimensions from 1 to 1,000,000. Add a target width to calculate its proportional height."
              : "Целые размеры в пикселях от 1 до 1 000 000. Укажите новую ширину, чтобы рассчитать пропорциональную высоту."}
          </p>

          <ToolPrimaryAction
            type="submit"
            className="mt-5"
            leadingIcon={
              <Calculator size={20} weight="bold" aria-hidden="true" />
            }
          >
            {isEn ? "Calculate size" : "Рассчитать размер"}
          </ToolPrimaryAction>

          {validationError ? (
            <ToolResult
              status="error"
              title={isEn ? "Check the dimensions" : "Проверьте размеры"}
              description={validationError.message}
              className="mt-5"
            />
          ) : null}

          {result ? (
            <ToolResult
              status="success"
              title={
                isEn ? "Aspect ratio calculated" : "Соотношение рассчитано"
              }
              description={
                target
                  ? isEn
                    ? "The new height preserves the source proportions."
                    : "Новая высота сохраняет пропорции исходного кадра."
                  : isEn
                    ? "The source dimensions were reduced by their greatest common divisor."
                    : "Исходные размеры сокращены на их наибольший общий делитель."
              }
              className="mt-5"
            >
              <div
                className={`grid min-w-0 gap-3 ${target ? "sm:grid-cols-2" : "sm:max-w-sm"}`}
              >
                <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]/45 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Simplified ratio" : "Сокращённое соотношение"}
                  </p>
                  <p className="mt-2 break-words font-mono text-3xl font-black tabular-nums text-[var(--color-text)]">
                    {ratioText}
                  </p>
                </div>

                {target ? (
                  <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]/45 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {isEn ? "Target size" : "Новый размер"}
                    </p>
                    <p className="mt-2 break-words font-mono text-2xl font-black tabular-nums text-[var(--color-text)] sm:text-3xl">
                      {formatNumber(target.width, isEn)} × {displayedHeight} px
                    </p>
                  </div>
                ) : null}
              </div>

              {target ? (
                <div className="mt-4 min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3.5 py-3 text-sm leading-6 text-[var(--color-text-muted)] sm:px-4">
                  <p className="font-semibold text-[var(--color-text)]">
                    {isEn ? "Formula" : "Формула"}
                  </p>
                  <p className="mt-1 break-words font-mono text-xs sm:text-sm">
                    newHeight = targetWidth × sourceHeight ÷ sourceWidth
                  </p>
                  <p className="mt-1 break-words font-mono text-xs sm:text-sm">
                    newHeight = {formatNumber(target.width, isEn)} ×{" "}
                    {formatNumber(result.sourceHeight, isEn)} ÷{" "}
                    {formatNumber(result.sourceWidth, isEn)} ={" "}
                    {exactHeightText(target, isEn)} px
                    {target.exactDenominator !== 1
                      ? ` ≈ ${formatNumber(target.exactHeight, isEn, 6)} px`
                      : ""}
                  </p>
                  {target.rounding !== "exact" ? (
                    <div className="mt-2">
                      <p>
                        {roundingCopy(target.rounding, isEn).title}:{" "}
                        <span className="font-mono font-semibold text-[var(--color-text)]">
                          {formatNumber(target.height, isEn)} px
                        </span>
                      </p>
                      {target.wasClampedToMinimum ? (
                        <p className="mt-1 text-xs">
                          {isEn
                            ? "The mathematical rounded value is 0 px, so the minimum valid dimension of 1 px is used."
                            : "Математическое округление даёт 0 px, поэтому используется минимально допустимый размер 1 px."}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
                {isEn
                  ? "This calculator only computes dimensions; it does not resize or transcode a video file."
                  : "Калькулятор только вычисляет размеры и не изменяет и не перекодирует видеофайл."}
              </p>
            </ToolResult>
          ) : null}

          <AdvancedSettings
            className="mt-5"
            title={isEn ? "Advanced settings" : "Расширенные настройки"}
            description={
              isEn
                ? "Rounding for a non-integer target height"
                : "Округление нецелой новой высоты"
            }
          >
            <fieldset>
              <legend className="text-sm font-semibold text-[var(--color-text)]">
                {isEn ? "Height rounding" : "Округление высоты"}
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {ROUNDING_OPTIONS.map((option) => {
                  const copy = roundingCopy(option, isEn);
                  return (
                    <label
                      key={option}
                      className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-3 text-sm transition-colors hover:bg-[var(--color-surface-muted)]/55"
                    >
                      <input
                        type="radio"
                        name="video-aspect-rounding"
                        value={option}
                        checked={rounding === option}
                        onChange={() => {
                          setRounding(option);
                          clearResult();
                        }}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-[var(--color-text)]">
                          {copy.title}
                        </span>
                        <span className="mt-0.5 block leading-5 text-[var(--color-text-muted)]">
                          {copy.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
                {isEn
                  ? "A rounded height is never allowed below the minimum valid dimension of 1 px."
                  : "Округлённая высота не может быть меньше минимально допустимого размера 1 px."}
              </p>
            </fieldset>
          </AdvancedSettings>
        </form>
      </section>
    </div>
  );
}
