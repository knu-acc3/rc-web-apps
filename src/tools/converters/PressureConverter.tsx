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

interface PressureUnit {
  key: string;
  labelRu: string;
  labelEn: string;
  shortRu: string;
  shortEn: string;
  toPascals: number;
  common: boolean;
}

const PRESSURE_UNITS: PressureUnit[] = [
  {
    key: "pascal",
    labelRu: "Паскали",
    labelEn: "Pascals",
    shortRu: "Па",
    shortEn: "Pa",
    toPascals: 1,
    common: true,
  },
  {
    key: "kilopascal",
    labelRu: "Килопаскали",
    labelEn: "Kilopascals",
    shortRu: "кПа",
    shortEn: "kPa",
    toPascals: 1000,
    common: true,
  },
  {
    key: "megapascal",
    labelRu: "Мегапаскали",
    labelEn: "Megapascals",
    shortRu: "МПа",
    shortEn: "MPa",
    toPascals: 1_000_000,
    common: true,
  },
  {
    key: "bar",
    labelRu: "Бары",
    labelEn: "Bars",
    shortRu: "бар",
    shortEn: "bar",
    toPascals: 100_000,
    common: true,
  },
  {
    key: "standard-atmosphere",
    labelRu: "Стандартные атмосферы",
    labelEn: "Standard atmospheres",
    shortRu: "атм",
    shortEn: "atm",
    toPascals: 101_325,
    common: true,
  },
  {
    key: "psi",
    labelRu: "Фунты на квадратный дюйм",
    labelEn: "Pounds per square inch",
    shortRu: "psi",
    shortEn: "psi",
    toPascals: 6894.757293168,
    common: true,
  },
  {
    key: "millimeter-mercury",
    labelRu: "Миллиметры ртутного столба",
    labelEn: "Millimeters of mercury",
    shortRu: "мм рт. ст.",
    shortEn: "mmHg",
    toPascals: 133.322387415,
    common: true,
  },
  {
    key: "hectopascal",
    labelRu: "Гектопаскали",
    labelEn: "Hectopascals",
    shortRu: "гПа",
    shortEn: "hPa",
    toPascals: 100,
    common: false,
  },
  {
    key: "millibar",
    labelRu: "Миллибары",
    labelEn: "Millibars",
    shortRu: "мбар",
    shortEn: "mbar",
    toPascals: 100,
    common: false,
  },
  {
    key: "torr",
    labelRu: "Торры",
    labelEn: "Torr",
    shortRu: "Торр",
    shortEn: "Torr",
    toPascals: 101_325 / 760,
    common: false,
  },
  {
    key: "inch-mercury",
    labelRu: "Дюймы ртутного столба",
    labelEn: "Inches of mercury",
    shortRu: "inHg",
    shortEn: "inHg",
    toPascals: 3386.388640341,
    common: false,
  },
];

const PRECISION_OPTIONS = [4, 6, 8, 10];

const PRESSURE_PRESETS = [
  { labelRu: "1 атм → бар", labelEn: "1 atm → bar", value: "1", from: "standard-atmosphere", to: "bar" },
  { labelRu: "100 кПа → атм", labelEn: "100 kPa → atm", value: "100", from: "kilopascal", to: "standard-atmosphere" },
  { labelRu: "2.5 бар → psi", labelEn: "2.5 bar → psi", value: "2.5", from: "bar", to: "psi" },
  { labelRu: "32 psi → бар", labelEn: "32 psi → bar", value: "32", from: "psi", to: "bar" },
  { labelRu: "760 мм рт. ст. → кПа", labelEn: "760 mmHg → kPa", value: "760", from: "millimeter-mercury", to: "kilopascal" },
  { labelRu: "1 МПа → бар", labelEn: "1 MPa → bar", value: "1", from: "megapascal", to: "bar" },
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

export default function PressureConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("1");
  const [from, setFrom] = useState("standard-atmosphere");
  const [to, setTo] = useState("kilopascal");
  const [precision, setPrecision] = useState(6);
  const [showExtended, setShowExtended] = useState(false);
  const [copied, setCopied] = useState(false);

  const fromUnit =
    PRESSURE_UNITS.find((unit) => unit.key === from) ?? PRESSURE_UNITS[4];
  const toUnit =
    PRESSURE_UNITS.find((unit) => unit.key === to) ?? PRESSURE_UNITS[1];
  const numericValue = parseDecimal(input);
  const hasInput = input.trim().length > 0;
  const isValid =
    hasInput && Number.isFinite(numericValue) && numericValue >= 0;
  const convertedValue = isValid
    ? (numericValue * fromUnit.toPascals) / toUnit.toPascals
    : Number.NaN;
  const formattedResult = formatValue(convertedValue, precision);
  const visibleUnits = PRESSURE_UNITS.filter(
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
        {PRESSURE_PRESETS.map((p, idx) => (
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
              htmlFor="pressure-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & unit)" : "Из (величина и единица)"}
            </Label>
            <Input
              id="pressure-value"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={hasInput && !isValid}
              aria-describedby="pressure-value-hint"
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                hasInput && !isValid && "border-[var(--color-danger)]",
              )}
            />
            {hasInput && !isValid ? (
              <p
                id="pressure-value-hint"
                className="text-xs text-[var(--color-danger)]"
              >
                {isEn
                  ? "Enter a non-negative decimal number."
                  : "Введите неотрицательное десятичное число."}
              </p>
            ) : null}

            <select
              id="pressure-from"
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
              htmlFor="pressure-to"
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
              id="pressure-to"
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
            ? "Precision and pressure reference"
            : "Точность и справка по давлению"
        }
        description={
          isEn
            ? "Technical units, definitions and the active ratio"
            : "Технические единицы, определения и текущий коэффициент"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pressure-precision">
              {isEn ? "Significant digits" : "Значащие цифры"}
            </Label>
            <Select
              value={String(precision)}
              onValueChange={(value) => setPrecision(Number(value))}
            >
              <SelectTrigger
                id="pressure-precision"
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
                  ? "hPa, mbar, Torr and inches of mercury"
                  : "гПа, мбар, Торр и дюймы ртутного столба"}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
          <p className="font-mono font-semibold">
            1 {fromShort} ={" "}
            {formatValue(fromUnit.toPascals / toUnit.toPascals, precision)}{" "}
            {toShort}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Every value is normalized to pascals. 1 atm = 101325 Pa exactly; Torr is exactly 1/760 atm and therefore differs slightly from mmHg. This converts numeric pressure values and does not infer absolute versus gauge pressure."
              : "Все значения приводятся к паскалям. 1 атм = 101325 Па точно; Торр равен ровно 1/760 атм и поэтому немного отличается от мм рт. ст. Конвертер переводит числовое давление и не определяет, абсолютное оно или избыточное."}
          </p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
