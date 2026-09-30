"use client";

import { useMemo, useState } from "react";

import {
  ArrowsLeftRight,
  Thermometer,
  Sparkle,
  Copy,
  Check,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

type TempUnit = "celsius" | "fahrenheit" | "kelvin" | "rankine" | "reaumur";

interface TempUnitInfo {
  key: TempUnit;
  symbol: string;
  en: string;
  ru: string;
  rare?: boolean;
}

const TEMPERATURE_UNITS: TempUnitInfo[] = [
  { key: "celsius", symbol: "°C", en: "Celsius", ru: "Цельсий" },
  { key: "fahrenheit", symbol: "°F", en: "Fahrenheit", ru: "Фаренгейт" },
  { key: "kelvin", symbol: "K", en: "Kelvin", ru: "Кельвин" },
  { key: "rankine", symbol: "°R", en: "Rankine", ru: "Ренкин", rare: true },
  { key: "reaumur", symbol: "°Ré", en: "Réaumur", ru: "Реомюр", rare: true },
];

const COMMON_TEMPERATURE_UNITS = TEMPERATURE_UNITS.filter((unit) => !unit.rare);

function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCelsius(value: number, unit: TempUnit): number {
  switch (unit) {
    case "celsius":
      return value;
    case "fahrenheit":
      return ((value - 32) * 5) / 9;
    case "kelvin":
      return value - 273.15;
    case "rankine":
      return ((value - 491.67) * 5) / 9;
    case "reaumur":
      return (value * 5) / 4;
  }
}

function fromCelsius(value: number, unit: TempUnit): number {
  switch (unit) {
    case "celsius":
      return value;
    case "fahrenheit":
      return (value * 9) / 5 + 32;
    case "kelvin":
      return value + 273.15;
    case "rankine":
      return ((value + 273.15) * 9) / 5;
    case "reaumur":
      return (value * 4) / 5;
  }
}

function convertTemperature(
  value: number,
  from: TempUnit,
  to: TempUnit,
): number {
  return fromCelsius(toCelsius(value, from), to);
}

function formatNumber(value: number, precision: number): string {
  if (Object.is(value, -0) || Math.abs(value) < 1e-14) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e12 || absolute < 10 ** -(precision + 2)) {
    return value.toExponential(Math.max(2, precision));
  }
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

function unitInfo(key: TempUnit): TempUnitInfo {
  return TEMPERATURE_UNITS.find((unit) => unit.key === key)!;
}

const TEMP_PRESETS: {
  labelRu: string;
  labelEn: string;
  value: string;
  from: TempUnit;
  to: TempUnit;
}[] = [
  { labelRu: "0 °C → °F", labelEn: "0 °C → °F", value: "0", from: "celsius", to: "fahrenheit" },
  { labelRu: "100 °C → °F", labelEn: "100 °C → °F", value: "100", from: "celsius", to: "fahrenheit" },
  { labelRu: "36.6 °C → °F", labelEn: "36.6 °C → °F", value: "36.6", from: "celsius", to: "fahrenheit" },
  { labelRu: "20 °C → °F", labelEn: "20 °C → °F", value: "20", from: "celsius", to: "fahrenheit" },
  { labelRu: "-40 °C → °F", labelEn: "-40 °C → °F", value: "-40", from: "celsius", to: "fahrenheit" },
  { labelRu: "0 K → °C", labelEn: "0 K → °C", value: "0", from: "kelvin", to: "celsius" },
];

export default function TemperatureConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("20");
  const [fromUnit, setFromUnit] = useState<TempUnit>("celsius");
  const [toUnit, setToUnit] = useState<TempUnit>("fahrenheit");
  const [precision, setPrecision] = useState(2);
  const [showRareUnits, setShowRareUnits] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsedValue = parseDecimal(input);
  const celsiusValue =
    parsedValue === null ? null : toCelsius(parsedValue, fromUnit);
  const isBelowAbsoluteZero =
    celsiusValue !== null && celsiusValue < -273.15 - 1e-9;
  const isValid = parsedValue !== null && !isBelowAbsoluteZero;
  const rawResult =
    isValid && parsedValue !== null
      ? convertTemperature(parsedValue, fromUnit, toUnit)
      : null;
  const result = rawResult === null ? "" : formatNumber(rawResult, precision);
  const hasFreshResult = isValid;

  const availableUnits = showRareUnits
    ? TEMPERATURE_UNITS
    : COMMON_TEMPERATURE_UNITS;

  const fromInfo = unitInfo(fromUnit);
  const toInfo = unitInfo(toUnit);

  const allResults = useMemo(() => {
    if (!isValid || parsedValue === null) return [];
    return TEMPERATURE_UNITS.map((unit) => ({
      key: unit.key,
      label: isEn ? unit.en : unit.ru,
      symbol: unit.symbol,
      value: formatNumber(
        convertTemperature(parsedValue, fromUnit, unit.key),
        precision,
      ),
    }));
  }, [fromUnit, isEn, isValid, parsedValue, precision]);

  const swap = () => {
    const nextFrom = toUnit;
    const nextTo = fromUnit;
    setFromUnit(nextFrom);
    setToUnit(nextTo);
    if (hasFreshResult && result) setInput(result.replace(/\s/g, ""));
  };

  const copyResult = async () => {
    if (!hasFreshResult) return;
    const text = `${result} ${toInfo.symbol}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // fallback
    }
  };

  const toggleRareUnits = (enabled: boolean) => {
    setShowRareUnits(enabled);
    if (!enabled) {
      if (unitInfo(fromUnit).rare) setFromUnit("celsius");
      if (unitInfo(toUnit).rare) setToUnit("fahrenheit");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {TEMP_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInput(p.value);
              setFromUnit(p.from);
              setToUnit(p.to);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              fromUnit === p.from && toUnit === p.to && input === p.value
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
              htmlFor="temperature-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & scale)" : "Из (величина и шкала)"}
            </Label>
            <Input
              id="temperature-value"
              type="text"
              inputMode="decimal"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="20"
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                input.trim() && !isValid && "border-[var(--color-danger)]",
              )}
              autoComplete="off"
            />
            {input.trim() && parsedValue === null ? (
              <p className="text-xs text-[var(--color-danger)]">
                {isEn ? "Enter a valid number." : "Введите корректное число."}
              </p>
            ) : null}
            {isBelowAbsoluteZero ? (
              <p className="text-xs text-[var(--color-danger)]">
                {isEn
                  ? "This value is below absolute zero."
                  : "Это значение ниже абсолютного нуля."}
              </p>
            ) : null}

            <select
              value={fromUnit}
              onChange={(event) => {
                setFromUnit(event.target.value as TempUnit);
              }}
              className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
            >
              {availableUnits.map((unit) => (
                <option key={unit.key} value={unit.key}>
                  {(isEn ? unit.en : unit.ru) + " (" + unit.symbol + ")"}
                </option>
              ))}
            </select>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center pt-2 md:pt-8">
            <button
              type="button"
              onClick={swap}
              aria-label={isEn ? "Swap units" : "Поменять местами"}
              className="flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm transition-all hover:scale-105 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-95"
            >
              <ArrowsLeftRight size={20} weight="bold" />
            </button>
          </div>

          {/* TO / RESULT COLUMN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {isEn ? "To (result)" : "В (результат)"}
              </Label>
              {hasFreshResult && (
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
                {hasFreshResult ? result : "—"}
              </span>
              <span className="font-mono text-base font-bold text-[var(--color-primary)]">
                {toInfo.symbol}
              </span>
            </div>

            <select
              value={toUnit}
              onChange={(event) => {
                setToUnit(event.target.value as TempUnit);
              }}
              className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
            >
              {availableUnits.map((unit) => (
                <option key={unit.key} value={unit.key}>
                  {(isEn ? unit.en : unit.ru) + " (" + unit.symbol + ")"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* EQUALITY SUMMARY & PRIMARY ACTION */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            {hasFreshResult ? (
              <span>
                {input} {fromInfo.symbol} ={" "}
                <strong className="font-semibold text-[var(--color-text)]">
                  {result} {toInfo.symbol}
                </strong>
              </span>
            ) : (
              <span>{isEn ? "Enter a valid temperature" : "Введите корректную температуру"}</span>
            )}
          </div>

          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            onClick={copyResult}
            disabled={!isValid || fromUnit === toUnit}
            leadingIcon={
              copied ? <Check size={20} weight="bold" /> : <Thermometer size={20} />
            }
          >
            {copied
              ? isEn ? "Result copied!" : "Результат скопирован!"
              : isEn ? "Convert temperature" : "Конвертировать температуру"}
          </ToolPrimaryAction>
        </div>
      </Card>

      <AdvancedSettings
        title={isEn ? "More temperature options" : "Дополнительные настройки"}
        description={
          isEn
            ? "Rare scales, precision, swap and formulas"
            : "Редкие шкалы, точность, обмен и формулы"
        }
      >
        <div className="space-y-5 [&_button]:min-h-11 [&_select]:min-h-11">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={showRareUnits}
              onChange={(event) => toggleRareUnits(event.target.checked)}
              className="h-5 w-5 accent-[var(--color-primary)]"
            />
            {isEn
              ? "Show Rankine and Réaumur"
              : "Показать шкалы Ренкина и Реомюра"}
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block">
              {isEn ? "Decimal places" : "Знаков после запятой"}
            </span>
            <select
              value={precision}
              onChange={(event) => {
                setPrecision(Number(event.target.value));
              }}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:max-w-xs"
            >
              {[0, 2, 4, 6, 10].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={swap}
            disabled={fromUnit === toUnit}
          >
            <ArrowsLeftRight size={18} />
            {isEn ? "Swap units" : "Поменять единицы"}
          </Button>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
            <p className="font-medium text-[var(--color-text)]">
              {isEn ? "Core formulas" : "Основные формулы"}
            </p>
            <p className="mt-1">°F = °C × 9/5 + 32</p>
            <p>K = °C + 273.15</p>
            <p className="mt-2">
              {isEn
                ? "Values below absolute zero are rejected. Conversion uses exact scale definitions; displayed output is rounded only at the final step."
                : "Значения ниже абсолютного нуля отклоняются. Расчёт использует точные определения шкал, округляется только итог."}
            </p>
          </div>

          {allResults.length ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                {isEn ? "All scales" : "Все шкалы"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {allResults.map((item) => (
                  <div
                    key={item.key}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2"
                  >
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {item.label}
                    </span>
                    <span className="break-all text-right font-mono text-sm font-semibold">
                      {item.value + " " + item.symbol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </AdvancedSettings>
    </div>
  );
}
