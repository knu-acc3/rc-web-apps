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

interface SpeedUnit {
  key: string;
  labelRu: string;
  labelEn: string;
  shortRu: string;
  shortEn: string;
  toMetersPerSecond: number;
  common: boolean;
}

const SPEED_UNITS: SpeedUnit[] = [
  {
    key: "kilometer-hour",
    labelRu: "Километры в час",
    labelEn: "Kilometers per hour",
    shortRu: "км/ч",
    shortEn: "km/h",
    toMetersPerSecond: 1 / 3.6,
    common: true,
  },
  {
    key: "meter-second",
    labelRu: "Метры в секунду",
    labelEn: "Meters per second",
    shortRu: "м/с",
    shortEn: "m/s",
    toMetersPerSecond: 1,
    common: true,
  },
  {
    key: "mile-hour",
    labelRu: "Мили в час",
    labelEn: "Miles per hour",
    shortRu: "миль/ч",
    shortEn: "mph",
    toMetersPerSecond: 0.44704,
    common: true,
  },
  {
    key: "knot",
    labelRu: "Узлы",
    labelEn: "Knots",
    shortRu: "уз",
    shortEn: "kn",
    toMetersPerSecond: 1852 / 3600,
    common: true,
  },
  {
    key: "foot-second",
    labelRu: "Футы в секунду",
    labelEn: "Feet per second",
    shortRu: "фт/с",
    shortEn: "ft/s",
    toMetersPerSecond: 0.3048,
    common: false,
  },
  {
    key: "foot-minute",
    labelRu: "Футы в минуту",
    labelEn: "Feet per minute",
    shortRu: "фт/мин",
    shortEn: "ft/min",
    toMetersPerSecond: 0.00508,
    common: false,
  },
  {
    key: "mach-20c",
    labelRu: "Число Маха при 20 °C",
    labelEn: "Mach at 20 °C",
    shortRu: "Мах",
    shortEn: "Mach",
    toMetersPerSecond: 343,
    common: false,
  },
  {
    key: "speed-of-light",
    labelRu: "Доля скорости света",
    labelEn: "Fraction of light speed",
    shortRu: "c",
    shortEn: "c",
    toMetersPerSecond: 299_792_458,
    common: false,
  },
];

const PRECISION_OPTIONS = [4, 6, 8, 10];

const SPEED_PRESETS = [
  { labelRu: "60 км/ч → mph", labelEn: "60 km/h → mph", value: "60", from: "kilometer-hour", to: "mile-hour" },
  { labelRu: "100 км/ч → mph", labelEn: "100 km/h → mph", value: "100", from: "kilometer-hour", to: "mile-hour" },
  { labelRu: "100 mph → км/ч", labelEn: "100 mph → km/h", value: "100", from: "mile-hour", to: "kilometer-hour" },
  { labelRu: "10 м/с → км/ч", labelEn: "10 m/s → km/h", value: "10", from: "meter-second", to: "kilometer-hour" },
  { labelRu: "20 узлов → км/ч", labelEn: "20 kn → km/h", value: "20", from: "knot", to: "kilometer-hour" },
  { labelRu: "1 Мах → км/ч", labelEn: "1 Mach → km/h", value: "1", from: "mach-20c", to: "kilometer-hour" },
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

export default function SpeedConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("100");
  const [from, setFrom] = useState("kilometer-hour");
  const [to, setTo] = useState("mile-hour");
  const [precision, setPrecision] = useState(6);
  const [showExtended, setShowExtended] = useState(false);
  const [copied, setCopied] = useState(false);

  const fromUnit =
    SPEED_UNITS.find((unit) => unit.key === from) ?? SPEED_UNITS[0];
  const toUnit = SPEED_UNITS.find((unit) => unit.key === to) ?? SPEED_UNITS[2];
  const numericValue = parseDecimal(input);
  const hasInput = input.trim().length > 0;
  const isValid =
    hasInput && Number.isFinite(numericValue) && numericValue >= 0;
  const convertedValue = isValid
    ? (numericValue * fromUnit.toMetersPerSecond) / toUnit.toMetersPerSecond
    : Number.NaN;
  const formattedResult = formatValue(convertedValue, precision);
  const visibleUnits = SPEED_UNITS.filter(
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
        {SPEED_PRESETS.map((p, idx) => (
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
              htmlFor="speed-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & unit)" : "Из (величина и единица)"}
            </Label>
            <Input
              id="speed-value"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={hasInput && !isValid}
              aria-describedby="speed-value-hint"
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                hasInput && !isValid && "border-[var(--color-danger)]",
              )}
            />
            {hasInput && !isValid ? (
              <p
                id="speed-value-hint"
                className="text-xs text-[var(--color-danger)]"
              >
                {isEn
                  ? "Enter a non-negative decimal number."
                  : "Введите неотрицательное десятичное число."}
              </p>
            ) : null}

            <select
              id="speed-from"
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
              htmlFor="speed-to"
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
              id="speed-to"
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
            ? "Technical units and the active conversion ratio"
            : "Технические единицы и текущий коэффициент"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="speed-precision">
              {isEn ? "Significant digits" : "Значащие цифры"}
            </Label>
            <Select
              value={String(precision)}
              onValueChange={(value) => setPrecision(Number(value))}
            >
              <SelectTrigger
                id="speed-precision"
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
                {isEn ? "Show technical units" : "Показать технические единицы"}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-[var(--color-text-muted)]">
                {isEn
                  ? "Feet per second, Mach and fraction of light speed"
                  : "Футы в секунду, число Маха и доля скорости света"}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
          <p className="font-mono font-semibold">
            1 {fromShort} ={" "}
            {formatValue(
              fromUnit.toMetersPerSecond / toUnit.toMetersPerSecond,
              precision,
            )}{" "}
            {toShort}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "All values are normalized to meters per second. Mach uses an approximate sound speed of 343 m/s in dry air at 20 °C; the real value changes with conditions."
              : "Все значения приводятся к метрам в секунду. Для Маха используется приблизительная скорость звука 343 м/с в сухом воздухе при 20 °C; реальное значение зависит от условий."}
          </p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
