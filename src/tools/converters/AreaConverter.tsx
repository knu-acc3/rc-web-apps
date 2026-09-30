"use client";

import { useState } from "react";

import { ArrowsLeftRight, Check, Copy, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";

interface AreaUnit {
  key: string;
  labelRu: string;
  labelEn: string;
  shortRu: string;
  shortEn: string;
  toSquareMeters: number;
  common: boolean;
}

const AREA_UNITS: AreaUnit[] = [
  {
    key: "square-meter",
    labelRu: "Квадратные метры",
    labelEn: "Square meters",
    shortRu: "м²",
    shortEn: "m²",
    toSquareMeters: 1,
    common: true,
  },
  {
    key: "square-kilometer",
    labelRu: "Квадратные километры",
    labelEn: "Square kilometers",
    shortRu: "км²",
    shortEn: "km²",
    toSquareMeters: 1_000_000,
    common: true,
  },
  {
    key: "hectare",
    labelRu: "Гектары",
    labelEn: "Hectares",
    shortRu: "га",
    shortEn: "ha",
    toSquareMeters: 10_000,
    common: true,
  },
  {
    key: "square-foot",
    labelRu: "Квадратные футы",
    labelEn: "Square feet",
    shortRu: "фт²",
    shortEn: "ft²",
    toSquareMeters: 0.09290304,
    common: true,
  },
  {
    key: "acre",
    labelRu: "Акры",
    labelEn: "Acres",
    shortRu: "акр",
    shortEn: "ac",
    toSquareMeters: 4046.8564224,
    common: true,
  },
  {
    key: "are",
    labelRu: "Ары",
    labelEn: "Ares",
    shortRu: "а",
    shortEn: "a",
    toSquareMeters: 100,
    common: false,
  },
  {
    key: "square-yard",
    labelRu: "Квадратные ярды",
    labelEn: "Square yards",
    shortRu: "ярд²",
    shortEn: "yd²",
    toSquareMeters: 0.83612736,
    common: false,
  },
  {
    key: "square-mile",
    labelRu: "Квадратные мили",
    labelEn: "Square miles",
    shortRu: "миля²",
    shortEn: "mi²",
    toSquareMeters: 2_589_988.110336,
    common: false,
  },
  {
    key: "square-centimeter",
    labelRu: "Квадратные сантиметры",
    labelEn: "Square centimeters",
    shortRu: "см²",
    shortEn: "cm²",
    toSquareMeters: 0.0001,
    common: false,
  },
  {
    key: "square-inch",
    labelRu: "Квадратные дюймы",
    labelEn: "Square inches",
    shortRu: "дюйм²",
    shortEn: "in²",
    toSquareMeters: 0.00064516,
    common: false,
  },
];

const PRECISION_OPTIONS = [4, 6, 8, 10];

function parseDecimal(value: string): number {
  return Number(value.trim().replace(",", "."));
}

function formatValue(value: number, precision: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e12 || absolute < 1e-6)
    return value.toExponential(precision - 1);
  return Number(value.toPrecision(precision)).toString();
}

export default function AreaConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("100");
  const [from, setFrom] = useState("square-meter");
  const [to, setTo] = useState("square-foot");
  const [precision, setPrecision] = useState(6);
  const [showExtended, setShowExtended] = useState(false);
  const [copied, setCopied] = useState(false);

  const fromUnit =
    AREA_UNITS.find((unit) => unit.key === from) ?? AREA_UNITS[0];
  const toUnit = AREA_UNITS.find((unit) => unit.key === to) ?? AREA_UNITS[3];
  const numericValue = parseDecimal(input);
  const hasInput = input.trim().length > 0;
  const isValid =
    hasInput && Number.isFinite(numericValue) && numericValue >= 0;
  const convertedValue = isValid
    ? (numericValue * fromUnit.toSquareMeters) / toUnit.toSquareMeters
    : Number.NaN;
  const formattedResult = formatValue(convertedValue, precision);
  const visibleUnits = AREA_UNITS.filter(
    (unit) =>
      showExtended || unit.common || unit.key === from || unit.key === to,
  );
  const fromShort = isEn ? fromUnit.shortEn : fromUnit.shortRu;
  const toShort = isEn ? toUnit.shortEn : toUnit.shortRu;

  const swapUnits = () => {
    setFrom(to);
    setTo(from);
    if (isValid) setInput(formattedResult);
  };

  const copyResult = async () => {
    if (!isValid) return;
    const text = `${formattedResult} ${toShort}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const presets = [
    { labelRu: "1 га → м²", labelEn: "1 ha → m²", value: "1", from: "hectare", to: "square-meter" },
    { labelRu: "100 м² → ft²", labelEn: "100 m² → ft²", value: "100", from: "square-meter", to: "square-foot" },
    { labelRu: "1 км² → га", labelEn: "1 km² → ha", value: "1", from: "square-kilometer", to: "hectare" },
    { labelRu: "1 акр → м²", labelEn: "1 acre → m²", value: "1", from: "acre", to: "square-meter" },
    { labelRu: "10 соток → м²", labelEn: "10 ares → m²", value: "10", from: "are", to: "square-meter" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInput(p.value);
              setFrom(p.from);
              setTo(p.to);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              from === p.from && to === p.to && input === p.value
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {isEn ? p.labelEn : p.labelRu}
          </button>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        {/* Responsive Exchange Layout */}
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* FROM COLUMN */}
          <div className="space-y-2">
            <Label
              htmlFor="area-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & unit)" : "Из (величина и единица)"}
            </Label>
            <Input
              id="area-value"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={hasInput && !isValid}
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                hasInput && !isValid && "border-[var(--color-danger)]",
              )}
            />
            {hasInput && !isValid ? (
              <p className="text-xs text-[var(--color-danger)]">
                {isEn
                  ? "Enter a non-negative decimal number."
                  : "Введите неотрицательное десятичное число."}
              </p>
            ) : null}

            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger
                id="area-from"
                className="h-12 w-full text-sm font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleUnits.map((unit) => (
                  <SelectItem key={unit.key} value={unit.key}>
                    {isEn ? unit.labelEn : unit.labelRu} (
                    {isEn ? unit.shortEn : unit.shortRu})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center pt-2 md:pt-8">
            <button
              type="button"
              onClick={swapUnits}
              aria-label={isEn ? "Swap units" : "Поменять местами"}
              className="flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm transition-all hover:scale-105 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-95"
            >
              <ArrowsLeftRight size={20} weight="bold" />
            </button>
          </div>

          {/* TO / RESULT COLUMN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="area-to"
                className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
              >
                {isEn ? "To (result)" : "В (результат)"}
              </Label>
              {isValid && (
                <button
                  type="button"
                  onClick={copyResult}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                >
                  {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
                  {copied
                    ? isEn ? "Copied" : "Скопировано!"
                    : isEn ? "Copy" : "Копировать"}
                </button>
              )}
            </div>

            <div
              className="flex h-14 items-center justify-between overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 px-4"
              aria-live="polite"
            >
              <span className="font-mono text-2xl font-extrabold text-[var(--color-text)]">
                {isValid ? formattedResult : "—"}
              </span>
              <span className="font-mono text-base font-bold text-[var(--color-primary)]">
                {toShort}
              </span>
            </div>

            <Select value={to} onValueChange={setTo}>
              <SelectTrigger
                id="area-to"
                className="h-12 w-full text-sm font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleUnits.map((unit) => (
                  <SelectItem key={unit.key} value={unit.key}>
                    {isEn ? unit.labelEn : unit.labelRu} (
                    {isEn ? unit.shortEn : unit.shortRu})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* EQUALITY SUMMARY & PRIMARY ACTION */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            {isValid ? (
              <span>
                {input.replace(",", ".")} {fromShort} ={" "}
                <strong className="font-semibold text-[var(--color-text)]">
                  {formattedResult} {toShort}
                </strong>
                <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                  (1 {fromShort} = {formatValue(fromUnit.toSquareMeters / toUnit.toSquareMeters, precision)} {toShort})
                </span>
              </span>
            ) : (
              <span>{isEn ? "Enter a value above" : "Введите значение выше"}</span>
            )}
          </div>

          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            onClick={copyResult}
            disabled={!isValid}
            leadingIcon={
              copied ? <Check size={20} weight="bold" /> : <Copy size={20} />
            }
          >
            {copied
              ? isEn ? "Result copied!" : "Результат скопирован!"
              : isEn ? "Copy result" : "Скопировать результат"}
          </ToolPrimaryAction>
        </div>
      </Card>

      <AdvancedSettings
        title={
          isEn
            ? "Precision and unit reference"
            : "Точность и справка по единицам"
        }
        description={
          isEn
            ? "Extended area units and the active conversion ratio"
            : "Расширенные единицы площади и текущий коэффициент"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="area-precision">
              {isEn ? "Significant digits" : "Значащие цифры"}
            </Label>
            <Select
              value={String(precision)}
              onValueChange={(value) => setPrecision(Number(value))}
            >
              <SelectTrigger id="area-precision" className="mt-1.5 h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRECISION_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <input
              type="checkbox"
              checked={showExtended}
              onChange={(event) => setShowExtended(event.target.checked)}
              className="mt-0.5 size-5 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block text-sm font-semibold">
                {isEn ? "Show extended units" : "Показать расширенные единицы"}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-[var(--color-text-muted)]">
                {isEn
                  ? "Ares, square yards, miles, centimeters and inches"
                  : "Ары, квадратные ярды, мили, сантиметры и дюймы"}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
          <p className="font-mono font-semibold">
            1 {fromShort} ={" "}
            {formatValue(
              fromUnit.toSquareMeters / toUnit.toSquareMeters,
              precision,
            )}{" "}
            {toShort}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Every value is normalized to square meters. Area factors are squared length factors: 1 ft² = 0.09290304 m² exactly."
              : "Все значения приводятся к квадратным метрам. Коэффициенты площади — это квадраты коэффициентов длины: 1 ft² = 0,09290304 м² точно."}
          </p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
