"use client";

import { useMemo, useState } from "react";

import {
  ArrowsLeftRight,
  Ruler,
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

type LengthUnit =
  | "meters"
  | "kilometers"
  | "centimeters"
  | "millimeters"
  | "miles"
  | "yards"
  | "feet"
  | "inches"
  | "nauticalMiles"
  | "astronomicalUnits"
  | "lightYears";

interface LengthUnitInfo {
  key: LengthUnit;
  symbol: string;
  en: string;
  ru: string;
  meters: number;
  rare?: boolean;
}

const LENGTH_UNITS: LengthUnitInfo[] = [
  { key: "meters", symbol: "m", en: "Meters", ru: "Метры", meters: 1 },
  {
    key: "kilometers",
    symbol: "km",
    en: "Kilometers",
    ru: "Километры",
    meters: 1000,
  },
  {
    key: "centimeters",
    symbol: "cm",
    en: "Centimeters",
    ru: "Сантиметры",
    meters: 0.01,
  },
  {
    key: "millimeters",
    symbol: "mm",
    en: "Millimeters",
    ru: "Миллиметры",
    meters: 0.001,
  },
  {
    key: "miles",
    symbol: "mi",
    en: "Miles",
    ru: "Мили",
    meters: 1609.344,
  },
  {
    key: "yards",
    symbol: "yd",
    en: "Yards",
    ru: "Ярды",
    meters: 0.9144,
  },
  {
    key: "feet",
    symbol: "ft",
    en: "Feet",
    ru: "Футы",
    meters: 0.3048,
  },
  {
    key: "inches",
    symbol: "in",
    en: "Inches",
    ru: "Дюймы",
    meters: 0.0254,
  },
  {
    key: "nauticalMiles",
    symbol: "nmi",
    en: "Nautical miles",
    ru: "Морские мили",
    meters: 1852,
    rare: true,
  },
  {
    key: "astronomicalUnits",
    symbol: "AU",
    en: "Astronomical units",
    ru: "Астрономические единицы",
    meters: 149_597_870_700,
    rare: true,
  },
  {
    key: "lightYears",
    symbol: "ly",
    en: "Light-years",
    ru: "Световые годы",
    meters: 9.4607304725808e15,
    rare: true,
  },
];

const COMMON_LENGTH_UNITS = LENGTH_UNITS.filter((unit) => !unit.rare);

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

function unitInfo(key: LengthUnit): LengthUnitInfo {
  return LENGTH_UNITS.find((unit) => unit.key === key)!;
}

function convertLength(
  value: number,
  from: LengthUnit,
  to: LengthUnit,
): number {
  return (value * unitInfo(from).meters) / unitInfo(to).meters;
}

const LENGTH_PRESETS: {
  labelRu: string;
  labelEn: string;
  value: string;
  from: LengthUnit;
  to: LengthUnit;
}[] = [
  { labelRu: "1 м → ft", labelEn: "1 m → ft", value: "1", from: "meters", to: "feet" },
  { labelRu: "1 дюйм → см", labelEn: "1 in → cm", value: "1", from: "inches", to: "centimeters" },
  { labelRu: "100 миль → км", labelEn: "100 mi → km", value: "100", from: "miles", to: "kilometers" },
  { labelRu: "10 000 ft → м", labelEn: "10 000 ft → m", value: "10000", from: "feet", to: "meters" },
  { labelRu: "5 км → мили", labelEn: "5 km → mi", value: "5", from: "kilometers", to: "miles" },
];

export default function LengthConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("1");
  const [fromUnit, setFromUnit] = useState<LengthUnit>("meters");
  const [toUnit, setToUnit] = useState<LengthUnit>("feet");
  const [precision, setPrecision] = useState(4);
  const [showRareUnits, setShowRareUnits] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsedValue = parseDecimal(input);
  const isValid = parsedValue !== null;
  const rawResult =
    parsedValue === null ? null : convertLength(parsedValue, fromUnit, toUnit);
  const result = rawResult === null ? "" : formatNumber(rawResult, precision);
  const hasFreshResult = isValid;
  const availableUnits = showRareUnits ? LENGTH_UNITS : COMMON_LENGTH_UNITS;

  const fromInfo = unitInfo(fromUnit);
  const toInfo = unitInfo(toUnit);

  const allResults = useMemo(() => {
    if (parsedValue === null) return [];
    return LENGTH_UNITS.map((unit) => ({
      key: unit.key,
      label: isEn ? unit.en : unit.ru,
      symbol: unit.symbol,
      value: formatNumber(
        convertLength(parsedValue, fromUnit, unit.key),
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
      if (unitInfo(fromUnit).rare) setFromUnit("meters");
      if (unitInfo(toUnit).rare) setToUnit("feet");
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
        {LENGTH_PRESETS.map((p, idx) => (
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
              htmlFor="length-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & unit)" : "Из (величина и единица)"}
            </Label>
            <Input
              id="length-value"
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
                setFromUnit(event.target.value as LengthUnit);
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
                setToUnit(event.target.value as LengthUnit);
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
                  (1 {fromInfo.symbol} = {formatNumber(convertLength(1, fromUnit, toUnit), precision)} {toInfo.symbol})
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
              copied ? <Check size={20} weight="bold" /> : <Ruler size={20} />
            }
          >
            {copied
              ? isEn ? "Result copied!" : "Результат скопирован!"
              : isEn ? "Convert length" : "Конвертировать длину"}
          </ToolPrimaryAction>
        </div>
      </Card>

      <AdvancedSettings
        title={isEn ? "More length options" : "Дополнительные настройки"}
        description={
          isEn
            ? "Rare units, precision, swap and exact factors"
            : "Редкие единицы, точность, обмен и коэффициенты"
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
              ? "Show nautical and astronomical units"
              : "Показать морские и астрономические единицы"}
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
                ? "Formula: result = value × source factor in meters ÷ target factor in meters."
                : "Формула: результат = значение × коэффициент исходной единицы в метрах ÷ коэффициент целевой единицы."}
            </p>
            <p className="mt-2">
              {isEn
                ? "Exact definitions used: 1 in = 0.0254 m, 1 mi = 1609.344 m, 1 nmi = 1852 m, 1 AU = 149,597,870,700 m."
                : "Точные определения: 1 in = 0,0254 м, 1 mi = 1609,344 м, 1 nmi = 1852 м, 1 AU = 149 597 870 700 м."}
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
