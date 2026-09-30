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

interface EnergyUnit {
  key: string;
  labelRu: string;
  labelEn: string;
  shortRu: string;
  shortEn: string;
  toJoules: number;
  common: boolean;
}

const ENERGY_UNITS: EnergyUnit[] = [
  {
    key: "joule",
    labelRu: "Джоули",
    labelEn: "Joules",
    shortRu: "Дж",
    shortEn: "J",
    toJoules: 1,
    common: true,
  },
  {
    key: "kilojoule",
    labelRu: "Килоджоули",
    labelEn: "Kilojoules",
    shortRu: "кДж",
    shortEn: "kJ",
    toJoules: 1000,
    common: true,
  },
  {
    key: "thermochemical-calorie",
    labelRu: "Термохимические калории",
    labelEn: "Thermochemical calories",
    shortRu: "кал",
    shortEn: "cal",
    toJoules: 4.184,
    common: true,
  },
  {
    key: "kilocalorie",
    labelRu: "Килокалории",
    labelEn: "Kilocalories",
    shortRu: "ккал",
    shortEn: "kcal",
    toJoules: 4184,
    common: true,
  },
  {
    key: "watt-hour",
    labelRu: "Ватт-часы",
    labelEn: "Watt-hours",
    shortRu: "Вт·ч",
    shortEn: "Wh",
    toJoules: 3600,
    common: true,
  },
  {
    key: "kilowatt-hour",
    labelRu: "Киловатт-часы",
    labelEn: "Kilowatt-hours",
    shortRu: "кВт·ч",
    shortEn: "kWh",
    toJoules: 3_600_000,
    common: true,
  },
  {
    key: "btu-it",
    labelRu: "BTU (международная)",
    labelEn: "BTU (International Table)",
    shortRu: "BTU IT",
    shortEn: "BTU IT",
    toJoules: 1055.05585262,
    common: true,
  },
  {
    key: "electronvolt",
    labelRu: "Электронвольты",
    labelEn: "Electronvolts",
    shortRu: "эВ",
    shortEn: "eV",
    toJoules: 1.602176634e-19,
    common: false,
  },
  {
    key: "erg",
    labelRu: "Эрги",
    labelEn: "Ergs",
    shortRu: "эрг",
    shortEn: "erg",
    toJoules: 1e-7,
    common: false,
  },
];

const PRECISION_OPTIONS = [4, 6, 8, 10];

const ENERGY_PRESETS = [
  { labelRu: "1 ккал → кДж", labelEn: "1 kcal → kJ", value: "1", from: "kilocalorie", to: "kilojoule" },
  { labelRu: "1000 Дж → кал", labelEn: "1000 J → cal", value: "1000", from: "joule", to: "thermochemical-calorie" },
  { labelRu: "1 кВт·ч → МДж", labelEn: "1 kWh → MJ", value: "1", from: "kilowatt-hour", to: "megajoule" },
  { labelRu: "2000 ккал → кВт·ч", labelEn: "2000 kcal → kWh", value: "2000", from: "kilocalorie", to: "kilowatt-hour" },
  { labelRu: "100 БТЕ → кДж", labelEn: "100 BTU → kJ", value: "100", from: "british-thermal-unit", to: "kilojoule" },
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

export default function EnergyConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("1");
  const [from, setFrom] = useState("kilowatt-hour");
  const [to, setTo] = useState("joule");
  const [precision, setPrecision] = useState(6);
  const [showExtended, setShowExtended] = useState(false);
  const [copied, setCopied] = useState(false);

  const fromUnit =
    ENERGY_UNITS.find((unit) => unit.key === from) ?? ENERGY_UNITS[5];
  const toUnit =
    ENERGY_UNITS.find((unit) => unit.key === to) ?? ENERGY_UNITS[0];
  const numericValue = parseDecimal(input);
  const hasInput = input.trim().length > 0;
  const isValid =
    hasInput && Number.isFinite(numericValue) && numericValue >= 0;
  const convertedValue = isValid
    ? (numericValue * fromUnit.toJoules) / toUnit.toJoules
    : Number.NaN;
  const formattedResult = formatValue(convertedValue, precision);
  const visibleUnits = ENERGY_UNITS.filter(
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
        {ENERGY_PRESETS.map((p, idx) => (
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
              htmlFor="energy-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & unit)" : "Из (величина и единица)"}
            </Label>
            <Input
              id="energy-value"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={hasInput && !isValid}
              aria-describedby="energy-value-hint"
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                hasInput && !isValid && "border-[var(--color-danger)]",
              )}
            />
            {hasInput && !isValid ? (
              <p
                id="energy-value-hint"
                className="text-xs text-[var(--color-danger)]"
              >
                {isEn
                  ? "Enter a non-negative decimal number."
                  : "Введите неотрицательное десятичное число."}
              </p>
            ) : null}

            <select
              id="energy-from"
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
              htmlFor="energy-to"
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
              id="energy-to"
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
            ? "Precision and energy reference"
            : "Точность и справка по энергии"
        }
        description={
          isEn
            ? "Scientific units, definitions and the active ratio"
            : "Научные единицы, определения и текущий коэффициент"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="energy-precision">
              {isEn ? "Significant digits" : "Значащие цифры"}
            </Label>
            <Select
              value={String(precision)}
              onValueChange={(value) => setPrecision(Number(value))}
            >
              <SelectTrigger
                id="energy-precision"
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
                {isEn ? "Show scientific units" : "Показать научные единицы"}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-[var(--color-text-muted)]">
                {isEn ? "Electronvolts and ergs" : "Электронвольты и эрги"}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
          <p className="font-mono font-semibold">
            1 {fromShort} ={" "}
            {formatValue(fromUnit.toJoules / toUnit.toJoules, precision)}{" "}
            {toShort}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "All values are normalized to joules. Here 1 cal is the thermochemical calorie (4.184 J), 1 kcal = 4184 J, and kWh is a unit of energy, not power."
              : "Все значения приводятся к джоулям. Здесь 1 кал — термохимическая калория (4,184 Дж), 1 ккал = 4184 Дж, а кВт·ч — единица энергии, не мощности."}
          </p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
