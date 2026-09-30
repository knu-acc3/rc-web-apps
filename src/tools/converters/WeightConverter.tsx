"use client";

import { useMemo, useState } from "react";

import {
  ArrowsLeftRight,
  Scales,
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

type WeightUnit =
  | "kilograms"
  | "grams"
  | "milligrams"
  | "tonnes"
  | "pounds"
  | "ounces"
  | "micrograms"
  | "carats"
  | "troyOunces"
  | "grains"
  | "stones";

interface WeightUnitInfo {
  key: WeightUnit;
  symbol: string;
  en: string;
  ru: string;
  grams: number;
  rare?: boolean;
}

const WEIGHT_UNITS: WeightUnitInfo[] = [
  {
    key: "kilograms",
    symbol: "kg",
    en: "Kilograms",
    ru: "Килограммы",
    grams: 1000,
  },
  { key: "grams", symbol: "g", en: "Grams", ru: "Граммы", grams: 1 },
  {
    key: "milligrams",
    symbol: "mg",
    en: "Milligrams",
    ru: "Миллиграммы",
    grams: 0.001,
  },
  {
    key: "tonnes",
    symbol: "t",
    en: "Metric tonnes",
    ru: "Метрические тонны",
    grams: 1_000_000,
  },
  {
    key: "pounds",
    symbol: "lb",
    en: "Pounds",
    ru: "Фунты",
    grams: 453.59237,
  },
  {
    key: "ounces",
    symbol: "oz",
    en: "Ounces",
    ru: "Унции",
    grams: 28.349523125,
  },
  {
    key: "micrograms",
    symbol: "µg",
    en: "Micrograms",
    ru: "Микрограммы",
    grams: 0.000001,
    rare: true,
  },
  {
    key: "carats",
    symbol: "ct",
    en: "Carats",
    ru: "Караты",
    grams: 0.2,
    rare: true,
  },
  {
    key: "troyOunces",
    symbol: "oz t",
    en: "Troy ounces",
    ru: "Тройские унции",
    grams: 31.1034768,
    rare: true,
  },
  {
    key: "grains",
    symbol: "gr",
    en: "Grains",
    ru: "Граны",
    grams: 0.06479891,
    rare: true,
  },
  {
    key: "stones",
    symbol: "st",
    en: "Stones",
    ru: "Стоуны",
    grams: 6350.29318,
    rare: true,
  },
];

const COMMON_WEIGHT_UNITS = WEIGHT_UNITS.filter((unit) => !unit.rare);

function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^[+]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatNumber(value: number, precision: number): string {
  if (Object.is(value, -0) || value === 0) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e12 || absolute < 10 ** -(precision + 2)) {
    return value.toExponential(Math.max(2, precision));
  }
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

function unitInfo(key: WeightUnit): WeightUnitInfo {
  return WEIGHT_UNITS.find((unit) => unit.key === key)!;
}

function convertWeight(
  value: number,
  from: WeightUnit,
  to: WeightUnit,
): number {
  return (value * unitInfo(from).grams) / unitInfo(to).grams;
}

const WEIGHT_PRESETS: {
  labelRu: string;
  labelEn: string;
  value: string;
  from: WeightUnit;
  to: WeightUnit;
}[] = [
  { labelRu: "1 кг → lb", labelEn: "1 kg → lb", value: "1", from: "kilograms", to: "pounds" },
  { labelRu: "1 lb → г", labelEn: "1 lb → g", value: "1", from: "pounds", to: "grams" },
  { labelRu: "1 oz → г", labelEn: "1 oz → g", value: "1", from: "ounces", to: "grams" },
  { labelRu: "100 кг → lb", labelEn: "100 kg → lb", value: "100", from: "kilograms", to: "pounds" },
  { labelRu: "500 мг → г", labelEn: "500 mg → g", value: "500", from: "milligrams", to: "grams" },
];

export default function WeightConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("1");
  const [fromUnit, setFromUnit] = useState<WeightUnit>("kilograms");
  const [toUnit, setToUnit] = useState<WeightUnit>("pounds");
  const [precision, setPrecision] = useState(4);
  const [showRareUnits, setShowRareUnits] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsedValue = parseDecimal(input);
  const isValid = parsedValue !== null;
  const rawResult =
    parsedValue === null ? null : convertWeight(parsedValue, fromUnit, toUnit);
  const result = rawResult === null ? "" : formatNumber(rawResult, precision);
  const hasFreshResult = isValid;
  const availableUnits = showRareUnits ? WEIGHT_UNITS : COMMON_WEIGHT_UNITS;

  const fromInfo = unitInfo(fromUnit);
  const toInfo = unitInfo(toUnit);

  const allResults = useMemo(() => {
    if (parsedValue === null) return [];
    return WEIGHT_UNITS.map((unit) => ({
      key: unit.key,
      label: isEn ? unit.en : unit.ru,
      symbol: unit.symbol,
      value: formatNumber(
        convertWeight(parsedValue, fromUnit, unit.key),
        precision,
      ),
    }));
  }, [fromUnit, isEn, parsedValue, precision]);

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
      if (unitInfo(fromUnit).rare) setFromUnit("kilograms");
      if (unitInfo(toUnit).rare) setToUnit("pounds");
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
        {WEIGHT_PRESETS.map((p, idx) => (
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
              htmlFor="weight-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & unit)" : "Из (величина и единица)"}
            </Label>
            <Input
              id="weight-value"
              type="text"
              inputMode="decimal"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="1"
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                input.trim() && !isValid && "border-[var(--color-danger)]",
              )}
              autoComplete="off"
            />
            {input.trim() && !isValid ? (
              <p className="text-xs text-[var(--color-danger)]">
                {isEn
                  ? "Enter a non-negative number."
                  : "Введите неотрицательное число."}
              </p>
            ) : null}

            <select
              value={fromUnit}
              onChange={(event) => {
                setFromUnit(event.target.value as WeightUnit);
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
                setToUnit(event.target.value as WeightUnit);
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
                <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                  (1 {fromInfo.symbol} = {formatNumber(convertWeight(1, fromUnit, toUnit), precision)} {toInfo.symbol})
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
            disabled={!isValid || fromUnit === toUnit}
            leadingIcon={
              copied ? <Check size={20} weight="bold" /> : <Scales size={20} />
            }
          >
            {copied
              ? isEn ? "Result copied!" : "Результат скопирован!"
              : isEn ? "Convert weight" : "Конвертировать массу"}
          </ToolPrimaryAction>
        </div>
      </Card>

      <AdvancedSettings
        title={isEn ? "More weight options" : "Дополнительные настройки"}
        description={
          isEn
            ? "Specialized units, precision, swap and exact factors"
            : "Специальные единицы, точность, обмен и коэффициенты"
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
              ? "Show specialized mass units"
              : "Показать специальные единицы массы"}
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
            <p>
              {isEn
                ? "Formula: result = value × source factor in grams ÷ target factor in grams."
                : "Формула: результат = значение × коэффициент исходной единицы в граммах ÷ коэффициент целевой единицы."}
            </p>
            <p className="mt-2">
              {isEn
                ? "This tool converts mass units. The metric tonne is used; US short and long tons are not included."
                : "Инструмент переводит единицы массы. Используется метрическая тонна; короткая и длинная тонны не включены."}
            </p>
          </div>

          {allResults.length ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                {isEn ? "All units" : "Все единицы"}
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
