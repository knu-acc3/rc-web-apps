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

interface VolumeUnit {
  key: string;
  labelRu: string;
  labelEn: string;
  shortRu: string;
  shortEn: string;
  toLiters: number;
  common: boolean;
}

const VOLUME_UNITS: VolumeUnit[] = [
  {
    key: "liter",
    labelRu: "Литры",
    labelEn: "Liters",
    shortRu: "л",
    shortEn: "L",
    toLiters: 1,
    common: true,
  },
  {
    key: "milliliter",
    labelRu: "Миллилитры",
    labelEn: "Milliliters",
    shortRu: "мл",
    shortEn: "mL",
    toLiters: 0.001,
    common: true,
  },
  {
    key: "cubic-meter",
    labelRu: "Кубические метры",
    labelEn: "Cubic meters",
    shortRu: "м³",
    shortEn: "m³",
    toLiters: 1000,
    common: true,
  },
  {
    key: "cubic-centimeter",
    labelRu: "Кубические сантиметры",
    labelEn: "Cubic centimeters",
    shortRu: "см³",
    shortEn: "cm³",
    toLiters: 0.001,
    common: true,
  },
  {
    key: "us-gallon",
    labelRu: "Жидкие галлоны США",
    labelEn: "US liquid gallons",
    shortRu: "gal US",
    shortEn: "gal US",
    toLiters: 3.785411784,
    common: true,
  },
  {
    key: "imperial-gallon",
    labelRu: "Имперские галлоны",
    labelEn: "Imperial gallons",
    shortRu: "gal imp",
    shortEn: "gal imp",
    toLiters: 4.54609,
    common: false,
  },
  {
    key: "us-quart",
    labelRu: "Жидкие кварты США",
    labelEn: "US liquid quarts",
    shortRu: "qt US",
    shortEn: "qt US",
    toLiters: 0.946352946,
    common: false,
  },
  {
    key: "us-pint",
    labelRu: "Жидкие пинты США",
    labelEn: "US liquid pints",
    shortRu: "pt US",
    shortEn: "pt US",
    toLiters: 0.473176473,
    common: false,
  },
  {
    key: "us-cup",
    labelRu: "Чашки США",
    labelEn: "US cups",
    shortRu: "cup US",
    shortEn: "cup US",
    toLiters: 0.2365882365,
    common: false,
  },
  {
    key: "us-fluid-ounce",
    labelRu: "Жидкие унции США",
    labelEn: "US fluid ounces",
    shortRu: "fl oz US",
    shortEn: "fl oz US",
    toLiters: 0.0295735295625,
    common: false,
  },
  {
    key: "us-tablespoon",
    labelRu: "Столовые ложки США",
    labelEn: "US tablespoons",
    shortRu: "tbsp US",
    shortEn: "tbsp US",
    toLiters: 0.01478676478125,
    common: false,
  },
  {
    key: "us-teaspoon",
    labelRu: "Чайные ложки США",
    labelEn: "US teaspoons",
    shortRu: "tsp US",
    shortEn: "tsp US",
    toLiters: 0.00492892159375,
    common: false,
  },
  {
    key: "oil-barrel",
    labelRu: "Нефтяные баррели",
    labelEn: "Oil barrels",
    shortRu: "bbl",
    shortEn: "bbl",
    toLiters: 158.987294928,
    common: false,
  },
];

const PRECISION_OPTIONS = [4, 6, 8, 10];

const VOLUME_PRESETS = [
  { labelRu: "1 л → мл", labelEn: "1 L → mL", value: "1", from: "liter", to: "milliliter" },
  { labelRu: "5 л → галлоны", labelEn: "5 L → gal", value: "5", from: "liter", to: "us-gallon" },
  { labelRu: "1 галлон → л", labelEn: "1 gal → L", value: "1", from: "us-gallon", to: "liter" },
  { labelRu: "500 мл → л", labelEn: "500 mL → L", value: "500", from: "milliliter", to: "liter" },
  { labelRu: "1 м³ → л", labelEn: "1 m³ → L", value: "1", from: "cubic-meter", to: "liter" },
  { labelRu: "1 баррель → л", labelEn: "1 bbl → L", value: "1", from: "oil-barrel", to: "liter" },
];

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

export default function VolumeConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("1");
  const [from, setFrom] = useState("liter");
  const [to, setTo] = useState("milliliter");
  const [precision, setPrecision] = useState(6);
  const [showExtended, setShowExtended] = useState(false);
  const [copied, setCopied] = useState(false);

  const fromUnit =
    VOLUME_UNITS.find((unit) => unit.key === from) ?? VOLUME_UNITS[0];
  const toUnit =
    VOLUME_UNITS.find((unit) => unit.key === to) ?? VOLUME_UNITS[1];
  const numericValue = parseDecimal(input);
  const hasInput = input.trim().length > 0;
  const isValid =
    hasInput && Number.isFinite(numericValue) && numericValue >= 0;
  const convertedValue = isValid
    ? (numericValue * fromUnit.toLiters) / toUnit.toLiters
    : Number.NaN;
  const formattedResult = formatValue(convertedValue, precision);
  const visibleUnits = VOLUME_UNITS.filter(
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {VOLUME_PRESETS.map((p, idx) => (
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
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* FROM COLUMN */}
          <div className="space-y-2">
            <Label
              htmlFor="volume-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & unit)" : "Из (величина и единица)"}
            </Label>
            <Input
              id="volume-value"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={hasInput && !isValid}
              aria-describedby="volume-value-hint"
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                hasInput && !isValid && "border-[var(--color-danger)]",
              )}
            />
            {hasInput && !isValid ? (
              <p
                id="volume-value-hint"
                className="text-xs text-[var(--color-danger)]"
              >
                {isEn
                  ? "Enter a non-negative decimal number."
                  : "Введите неотрицательное десятичное число."}
              </p>
            ) : null}

            <select
              id="volume-from"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
            >
              {visibleUnits.map((unit) => (
                <option key={unit.key} value={unit.key}>
                  {(isEn ? unit.labelEn : unit.labelRu) +
                    " (" +
                    (isEn ? unit.shortEn : unit.shortRu) +
                    ")"}
                </option>
              ))}
            </select>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center pt-2 md:pt-8">
            <button
              type="button"
              onClick={swapUnits}
              aria-label={isEn ? "Swap units" : "Поменять единицы местами"}
              className="flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm transition-all hover:scale-105 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-95"
            >
              <ArrowsLeftRight size={20} weight="bold" />
            </button>
          </div>

          {/* TO / RESULT COLUMN */}
          <div className="space-y-2">
            <Label
              htmlFor="volume-to"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "To (result & unit)" : "В (результат и единица)"}
            </Label>
            <div
              className="flex h-14 items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)]/40 px-4"
              aria-live="polite"
            >
              <span className="font-mono text-2xl font-black tabular-nums text-[var(--color-text)]">
                {isValid ? formattedResult : "—"}
              </span>
              <span className="font-mono text-sm font-bold text-[var(--color-primary)]">
                {toShort}
              </span>
            </div>

            <select
              id="volume-to"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
            >
              {visibleUnits.map((unit) => (
                <option key={unit.key} value={unit.key}>
                  {(isEn ? unit.labelEn : unit.labelRu) +
                    " (" +
                    (isEn ? unit.shortEn : unit.shortRu) +
                    ")"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* BOTTOM FORMULA & COMPACT COPY BUTTON */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4 sm:flex-row">
          <p className="font-mono text-sm text-[var(--color-text-muted)]">
            {isValid
              ? `${input.replace(",", ".")} ${fromShort} = ${formattedResult} ${toShort}`
              : isEn
                ? "Enter a value to see the conversion."
                : "Введите значение для расчёта."}
          </p>

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
              ? isEn
                ? "Result copied"
                : "Результат скопирован"
              : isEn
                ? "Copy result"
                : "Скопировать результат"}
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
            ? "Extended volume units and the active conversion ratio"
            : "Расширенные единицы объёма и текущий коэффициент"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="volume-precision">
              {isEn ? "Significant digits" : "Значащие цифры"}
            </Label>
            <Select
              value={String(precision)}
              onValueChange={(value) => setPrecision(Number(value))}
            >
              <SelectTrigger
                id="volume-precision"
                className="mt-1.5 h-11 w-full"
              >
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
                  ? "Imperial, US cooking and oil-volume units"
                  : "Имперские, кулинарные единицы США и нефтяной баррель"}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
          <p className="font-mono font-semibold">
            1 {fromShort} ={" "}
            {formatValue(fromUnit.toLiters / toUnit.toLiters, precision)}{" "}
            {toShort}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "The converter normalizes every value to liters. US liquid measures and Imperial measures are distinct standards."
              : "Конвертер приводит значения к литрам. Жидкие меры США и имперские меры — разные стандарты."}
          </p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
