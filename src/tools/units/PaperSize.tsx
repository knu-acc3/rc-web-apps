"use client";

import { useState, type FormEvent } from "react";
import { FileText, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

export const MILLIMETRES_PER_INCH = 25.4;
export const PAPER_DPI_LIMITS = { minimum: 1, maximum: 2_400 } as const;

export type PaperFamily = "iso-a" | "north-american";
export type PaperOrientation = "portrait" | "landscape";

export interface PaperFormatDefinition {
  id: string;
  name: string;
  family: PaperFamily;
  widthMm: number;
  heightMm: number;
  exactWidthIn?: number;
  exactHeightIn?: number;
}

/** Curated reference only: ISO 216 A0–A10 and three named North American sizes. */
export const PAPER_FORMATS = [
  { id: "iso-a0", name: "A0", family: "iso-a", widthMm: 841, heightMm: 1189 },
  { id: "iso-a1", name: "A1", family: "iso-a", widthMm: 594, heightMm: 841 },
  { id: "iso-a2", name: "A2", family: "iso-a", widthMm: 420, heightMm: 594 },
  { id: "iso-a3", name: "A3", family: "iso-a", widthMm: 297, heightMm: 420 },
  { id: "iso-a4", name: "A4", family: "iso-a", widthMm: 210, heightMm: 297 },
  { id: "iso-a5", name: "A5", family: "iso-a", widthMm: 148, heightMm: 210 },
  { id: "iso-a6", name: "A6", family: "iso-a", widthMm: 105, heightMm: 148 },
  { id: "iso-a7", name: "A7", family: "iso-a", widthMm: 74, heightMm: 105 },
  { id: "iso-a8", name: "A8", family: "iso-a", widthMm: 52, heightMm: 74 },
  { id: "iso-a9", name: "A9", family: "iso-a", widthMm: 37, heightMm: 52 },
  { id: "iso-a10", name: "A10", family: "iso-a", widthMm: 26, heightMm: 37 },
  {
    id: "na-letter",
    name: "Letter",
    family: "north-american",
    widthMm: 215.9,
    heightMm: 279.4,
    exactWidthIn: 8.5,
    exactHeightIn: 11,
  },
  {
    id: "na-legal",
    name: "Legal",
    family: "north-american",
    widthMm: 215.9,
    heightMm: 355.6,
    exactWidthIn: 8.5,
    exactHeightIn: 14,
  },
  {
    id: "na-tabloid",
    name: "Tabloid",
    family: "north-american",
    widthMm: 279.4,
    heightMm: 431.8,
    exactWidthIn: 11,
    exactHeightIn: 17,
  },
] as const satisfies readonly PaperFormatDefinition[];

export type PaperFormatId = (typeof PAPER_FORMATS)[number]["id"];
export type PaperFormat = (typeof PAPER_FORMATS)[number];

export interface PaperPixelDimensions {
  width: number;
  height: number;
  exactWidth: number;
  exactHeight: number;
  dpi: number;
  rounding: "nearest";
}

export interface PaperSizeCalculation {
  format: PaperFormat;
  orientation: PaperOrientation;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  inchesAreExactSourceValues: boolean;
  pixels: PaperPixelDimensions | null;
}

export function getPaperFormat(id: string): PaperFormat | null {
  return PAPER_FORMATS.find((format) => format.id === id) ?? null;
}

export function parsePaperDpi(input: string): number | null {
  const normalized = input.trim();
  if (!/^[1-9]\d*$/.test(normalized) || normalized.length > 4) return null;

  const dpi = Number(normalized);
  if (
    !Number.isSafeInteger(dpi) ||
    dpi < PAPER_DPI_LIMITS.minimum ||
    dpi > PAPER_DPI_LIMITS.maximum
  ) {
    return null;
  }
  return dpi;
}

export function calculatePaperPixels(
  widthMm: number,
  heightMm: number,
  dpi: number,
): PaperPixelDimensions {
  if (
    !Number.isFinite(widthMm) ||
    !Number.isFinite(heightMm) ||
    widthMm <= 0 ||
    heightMm <= 0 ||
    !Number.isSafeInteger(dpi) ||
    dpi < PAPER_DPI_LIMITS.minimum ||
    dpi > PAPER_DPI_LIMITS.maximum
  ) {
    throw new RangeError(
      "Paper dimensions or DPI are outside the supported range.",
    );
  }

  const exactWidth = (widthMm / MILLIMETRES_PER_INCH) * dpi;
  const exactHeight = (heightMm / MILLIMETRES_PER_INCH) * dpi;
  return {
    width: Math.round(exactWidth),
    height: Math.round(exactHeight),
    exactWidth,
    exactHeight,
    dpi,
    rounding: "nearest",
  };
}

export function calculatePaperSize(
  formatId: string,
  orientation: PaperOrientation,
  dpi: number | null,
): PaperSizeCalculation {
  const format = getPaperFormat(formatId);
  if (!format) throw new RangeError("Unknown paper format.");
  if (orientation !== "portrait" && orientation !== "landscape") {
    throw new RangeError("Unknown paper orientation.");
  }

  const portraitWidthIn =
    "exactWidthIn" in format
      ? format.exactWidthIn
      : format.widthMm / MILLIMETRES_PER_INCH;
  const portraitHeightIn =
    "exactHeightIn" in format
      ? format.exactHeightIn
      : format.heightMm / MILLIMETRES_PER_INCH;
  const isLandscape = orientation === "landscape";
  const widthMm = isLandscape ? format.heightMm : format.widthMm;
  const heightMm = isLandscape ? format.widthMm : format.heightMm;
  const widthIn = isLandscape ? portraitHeightIn : portraitWidthIn;
  const heightIn = isLandscape ? portraitWidthIn : portraitHeightIn;

  return {
    format,
    orientation,
    widthMm,
    heightMm,
    widthIn,
    heightIn,
    inchesAreExactSourceValues: format.family === "north-american",
    pixels: dpi === null ? null : calculatePaperPixels(widthMm, heightMm, dpi),
  };
}

export function paperAreaSquareMetres(format: PaperFormatDefinition): number {
  return (format.widthMm * format.heightMm) / 1_000_000;
}

function formatMillimetres(value: number, isEn: boolean): string {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatInches(value: number, exact: boolean, isEn: boolean): string {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: exact ? 1 : 4,
  }).format(value);
}

function formatInteger(value: number, isEn: boolean): string {
  return value.toLocaleString(isEn ? "en-US" : "ru-RU");
}

function ResultValue({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]/40 p-4">
      <dt className="text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words font-mono text-xl font-black tabular-nums text-[var(--color-text)] sm:text-2xl">
        {value}
      </dd>
      {note ? (
        <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
          {note}
        </p>
      ) : null}
    </div>
  );
}

const PAPER_PRESETS = [
  { id: "iso-a4" as PaperFormatId, name: "A4" },
  { id: "iso-a3" as PaperFormatId, name: "A3" },
  { id: "iso-a5" as PaperFormatId, name: "A5" },
  { id: "na-letter" as PaperFormatId, name: "Letter" },
  { id: "na-legal" as PaperFormatId, name: "Legal" },
  { id: "na-tabloid" as PaperFormatId, name: "Tabloid" },
  { id: "iso-a1" as PaperFormatId, name: "A1" },
];

export default function PaperSize() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [formatId, setFormatId] = useState<PaperFormatId>("iso-a4");
  const [orientation, setOrientation] = useState<PaperOrientation>("portrait");
  const [dpiInput, setDpiInput] = useState("");
  const [result, setResult] = useState<PaperSizeCalculation | null>(() => {
    try {
      return calculatePaperSize("iso-a4", "portrait", null);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");

  const doCalculate = (
    nextFormat = formatId,
    nextOrientation = orientation,
    nextDpiStr = dpiInput,
  ) => {
    const normalizedDpi = nextDpiStr.trim();
    const dpi = normalizedDpi ? parsePaperDpi(normalizedDpi) : null;
    if (normalizedDpi && dpi === null) {
      setResult(null);
      setError(
        isEn
          ? `Enter a whole DPI value from ${PAPER_DPI_LIMITS.minimum} to ${PAPER_DPI_LIMITS.maximum}, without separators or leading zeros.`
          : `Введите целое DPI от ${PAPER_DPI_LIMITS.minimum} до ${PAPER_DPI_LIMITS.maximum} без разделителей и ведущих нулей.`,
      );
      return;
    }

    try {
      setResult(calculatePaperSize(nextFormat, nextOrientation, dpi));
      setError("");
    } catch {
      setResult(null);
      setError(
        isEn
          ? "The selected paper format could not be calculated."
          : "Не удалось рассчитать выбранный формат бумаги.",
      );
    }
  };

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    doCalculate();
  };

  const status = error ? "error" : result ? "success" : "idle";
  const title = error
    ? isEn
      ? "Paper size not calculated"
      : "Размер бумаги не рассчитан"
    : result
      ? `${result.format.name} — ${result.orientation === "portrait" ? (isEn ? "Portrait" : "Портретная") : isEn ? "Landscape" : "Альбомная"}`
      : isEn
        ? "Ready to look up"
        : "Готов к расчёту";
  const description = error
    ? error
    : result
      ? result.format.family === "iso-a"
        ? isEn
          ? "ISO 216 A-series trimmed size."
          : "Обрезной формат серии A по ISO 216."
        : isEn
          ? "Named North American office paper size."
          : "Именованный североамериканский офисный формат."
      : isEn
        ? "Choose a format and show its dimensions."
        : "Выберите формат и покажите его размеры.";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {PAPER_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setFormatId(p.id);
              doCalculate(p.id, orientation, dpiInput);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              formatId === p.id
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <form onSubmit={calculate} noValidate>
          <div className="max-w-lg">
            <Label htmlFor="paper-format">
              {isEn ? "Paper format" : "Формат бумаги"}
            </Label>
            <select
              id="paper-format"
              value={formatId}
              onChange={(event) => {
                const next = event.target.value as PaperFormatId;
                setFormatId(next);
                doCalculate(next, orientation, dpiInput);
              }}
              className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]"
            >
              <optgroup
                label={isEn ? "ISO 216 · A series" : "ISO 216 · серия A"}
              >
                {PAPER_FORMATS.filter(
                  (format) => format.family === "iso-a",
                ).map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label={isEn ? "North American" : "Североамериканские"}>
                {PAPER_FORMATS.filter(
                  (format) => format.family === "north-american",
                ).map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="mt-5">
            <ToolPrimaryAction
              type="submit"
              fullWidthOnMobile={false}
              className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
              leadingIcon={
                <FileText size={20} weight="bold" aria-hidden="true" />
              }
            >
              {isEn ? "Show dimensions" : "Показать размеры"}
            </ToolPrimaryAction>
          </div>

          <ToolResult
            status={status}
            title={title}
            description={description}
            className="mt-5"
          >
            {result ? (
              <>
                <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <ResultValue
                    label={
                      result.format.family === "iso-a"
                        ? isEn
                          ? "ISO nominal millimetres"
                          : "Номинальные миллиметры ISO"
                        : isEn
                          ? "Millimetres from exact inches"
                          : "Миллиметры из точных дюймов"
                    }
                    value={`${formatMillimetres(result.widthMm, isEn)} × ${formatMillimetres(result.heightMm, isEn)} mm`}
                  />
                  <ResultValue
                    label={
                      result.inchesAreExactSourceValues
                        ? isEn
                          ? "Exact inches"
                          : "Точные дюймы"
                        : isEn
                          ? "Converted inches"
                          : "Пересчёт в дюймы"
                    }
                    value={`${result.inchesAreExactSourceValues ? "" : "≈ "}${formatInches(result.widthIn, result.inchesAreExactSourceValues, isEn)} × ${formatInches(result.heightIn, result.inchesAreExactSourceValues, isEn)} in`}
                    note={
                      result.inchesAreExactSourceValues
                        ? isEn
                          ? "Millimetres use the exact conversion 1 in = 25.4 mm."
                          : "Миллиметры рассчитаны по точному равенству 1 in = 25,4 mm."
                        : isEn
                          ? "Converted from exact ISO millimetres and shown to four decimal places."
                          : "Пересчитано из точных миллиметров ISO и показано до четырёх знаков."
                    }
                  />
                  {result.pixels ? (
                    <div className="sm:col-span-2">
                      <ResultValue
                        label={`${isEn ? "Pixel dimensions" : "Размер в пикселях"} @ ${result.pixels.dpi} DPI`}
                        value={`${formatInteger(result.pixels.width, isEn)} × ${formatInteger(result.pixels.height, isEn)} px`}
                        note={
                          isEn
                            ? "Formula: mm ÷ 25.4 × DPI; each dimension is rounded to the nearest whole pixel."
                            : "Формула: mm ÷ 25,4 × DPI; каждая сторона округляется до ближайшего целого пикселя."
                        }
                      />
                    </div>
                  ) : null}
                </dl>

                <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
                  {isEn
                    ? "This curated reference includes only ISO A0–A10 plus Letter, Legal and Tabloid; it does not represent every regional or print standard."
                    : "Справочник намеренно включает только ISO A0–A10, Letter, Legal и Tabloid и не представляет все региональные и полиграфические стандарты."}
                </p>
              </>
            ) : null}
          </ToolResult>

          <AdvancedSettings
            className="mt-5"
            title={isEn ? "Advanced settings" : "Расширенные настройки"}
            description={
              isEn
                ? "Orientation and optional DPI conversion"
                : "Ориентация и необязательный пересчёт по DPI"
            }
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <Label htmlFor="paper-orientation">
                  {isEn ? "Orientation" : "Ориентация"}
                </Label>
                <select
                  id="paper-orientation"
                  value={orientation}
                  onChange={(event) => {
                    const next = event.target.value as PaperOrientation;
                    setOrientation(next);
                    doCalculate(formatId, next, dpiInput);
                  }}
                  className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                >
                  <option value="portrait">
                    {isEn ? "Portrait" : "Портретная"}
                  </option>
                  <option value="landscape">
                    {isEn ? "Landscape" : "Альбомная"}
                  </option>
                </select>
              </div>

              <div className="min-w-0">
                <Label htmlFor="paper-dpi">
                  {isEn ? "DPI (optional)" : "DPI (необязательно)"}
                </Label>
                <Input
                  id="paper-dpi"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={dpiInput}
                  aria-invalid={Boolean(error)}
                  onChange={(event) => {
                    const next = event.target.value;
                    setDpiInput(next);
                    doCalculate(formatId, orientation, next);
                  }}
                  className="mt-1.5 h-12 font-mono text-base tabular-nums"
                />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {isEn
                    ? `Whole number from ${PAPER_DPI_LIMITS.minimum} to ${PAPER_DPI_LIMITS.maximum}.`
                    : `Целое число от ${PAPER_DPI_LIMITS.minimum} до ${PAPER_DPI_LIMITS.maximum}.`}
                </p>
              </div>
            </div>
          </AdvancedSettings>
        </form>
      </section>
    </div>
  );
}
