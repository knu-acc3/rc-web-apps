"use client";

import { useMemo, useState } from "react";
import { ArrowsLeftRight, Check, Copy, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";
import { writeClipboardText } from "@/src/utils/clipboard";

type FuelUnitId = "l100km" | "mpg-us" | "mpg-imperial" | "km-l";

type FuelUnit = {
  id: FuelUnitId;
  labelRu: string;
  labelEn: string;
  symbol: string;
};

const UNITS: FuelUnit[] = [
  {
    id: "l100km",
    labelRu: "Литры на 100 км",
    labelEn: "Litres per 100 km",
    symbol: "L/100 km",
  },
  {
    id: "mpg-us",
    labelRu: "Мили на галлон США",
    labelEn: "US miles per gallon",
    symbol: "mpg US",
  },
  {
    id: "mpg-imperial",
    labelRu: "Мили на имперский галлон",
    labelEn: "Imperial miles per gallon",
    symbol: "mpg Imp",
  },
  {
    id: "km-l",
    labelRu: "Километры на литр",
    labelEn: "Kilometres per litre",
    symbol: "km/L",
  },
];

const FUEL_PRESETS = [
  { labelRu: "8 л/100 км → mpg US", labelEn: "8 L/100 km → mpg US", value: "8", from: "l100km" as FuelUnitId, to: "mpg-us" as FuelUnitId },
  { labelRu: "10 л/100 км → mpg US", labelEn: "10 L/100 km → mpg US", value: "10", from: "l100km" as FuelUnitId, to: "mpg-us" as FuelUnitId },
  { labelRu: "30 mpg US → л/100 км", labelEn: "30 mpg US → L/100 km", value: "30", from: "mpg-us" as FuelUnitId, to: "l100km" as FuelUnitId },
  { labelRu: "40 mpg US → л/100 км", labelEn: "40 mpg US → L/100 km", value: "40", from: "mpg-us" as FuelUnitId, to: "l100km" as FuelUnitId },
  { labelRu: "15 км/л → л/100 км", labelEn: "15 km/L → L/100 km", value: "15", from: "km-l" as FuelUnitId, to: "l100km" as FuelUnitId },
];

const MPG_US_FACTOR = 235.214583;
const MPG_IMPERIAL_FACTOR = 282.480936;

function parsePositive(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toLitresPer100Km(value: number, unit: FuelUnitId) {
  if (unit === "l100km") return value;
  if (unit === "mpg-us") return MPG_US_FACTOR / value;
  if (unit === "mpg-imperial") return MPG_IMPERIAL_FACTOR / value;
  return 100 / value;
}

function fromLitresPer100Km(value: number, unit: FuelUnitId) {
  if (unit === "l100km") return value;
  if (unit === "mpg-us") return MPG_US_FACTOR / value;
  if (unit === "mpg-imperial") return MPG_IMPERIAL_FACTOR / value;
  return 100 / value;
}

function formatValue(value: number, precision: number) {
  if (!Number.isFinite(value)) return "—";
  return value
    .toFixed(precision)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?[1-9])0+$/, "$1");
}

export default function FuelConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [value, setValue] = useState("8");
  const [fromId, setFromId] = useState<FuelUnitId>("l100km");
  const [toId, setToId] = useState<FuelUnitId>("mpg-us");
  const [precision, setPrecision] = useState(2);
  const [fuelPrice, setFuelPrice] = useState("");
  const [distance, setDistance] = useState("");
  const [currency, setCurrency] = useState("");
  const [copied, setCopied] = useState(false);

  const from = UNITS.find((unit) => unit.id === fromId) ?? UNITS[0];
  const to = UNITS.find((unit) => unit.id === toId) ?? UNITS[1];
  const numeric = parsePositive(value);
  const litresPer100Km =
    numeric === null ? null : toLitresPer100Km(numeric, from.id);
  const converted =
    litresPer100Km === null ? null : fromLitresPer100Km(litresPer100Km, to.id);
  const formatted =
    converted === null ? "—" : formatValue(converted, precision);

  const allResults = useMemo(
    () =>
      litresPer100Km === null
        ? []
        : UNITS.map((unit) => ({
            ...unit,
            value: formatValue(
              fromLitresPer100Km(litresPer100Km, unit.id),
              precision,
            ),
          })),
    [litresPer100Km, precision],
  );

  const price = parsePositive(fuelPrice);
  const tripDistance = parsePositive(distance);
  const tripCost =
    litresPer100Km !== null && price !== null && tripDistance !== null
      ? (litresPer100Km * price * tripDistance) / 100
      : null;

  const labelFor = (unit: FuelUnit) => (isEn ? unit.labelEn : unit.labelRu);
  const resetCopied = () => setCopied(false);

  const copyResult = async () => {
    if (converted === null) return;
    const didCopy = await writeClipboardText(`${formatted} ${to.symbol}`);
    if (didCopy) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_600);
    }
  };

  const swapUnits = () => {
    setFromId(to.id);
    setToId(from.id);
    if (converted !== null && formatted !== "—") {
      setValue(formatted);
    }
    resetCopied();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {FUEL_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setValue(p.value);
              setFromId(p.from);
              setToId(p.to);
              resetCopied();
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              fromId === p.from && toId === p.to && value === p.value
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {isEn ? p.labelEn : p.labelRu}
          </button>
        ))}
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] sm:items-end">
          <div className="min-w-0 space-y-3">
            <div>
              <Label htmlFor="fuel-value" className="text-sm font-semibold">
                {isEn ? "Fuel consumption" : "Расход топлива"}
              </Label>
              <Input
                id="fuel-value"
                value={value}
                inputMode="decimal"
                onChange={(event) => {
                  setValue(event.target.value);
                  resetCopied();
                }}
                className="mt-2 h-12 text-lg font-semibold tabular-nums"
                aria-invalid={Boolean(value.trim()) && numeric === null}
              />
              {value.trim() && numeric === null ? (
                <p
                  role="alert"
                  className="mt-1.5 text-sm text-[var(--color-danger)]"
                >
                  {isEn
                    ? "Enter a number greater than zero."
                    : "Введите число больше нуля."}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="fuel-from">{isEn ? "From" : "Из"}</Label>
              <Select
                value={from.id}
                onValueChange={(next) => {
                  setFromId(next as FuelUnitId);
                  resetCopied();
                }}
              >
                <SelectTrigger id="fuel-from" className="mt-1.5 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {labelFor(unit)} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            type="button"
            onClick={swapUnits}
            aria-label={isEn ? "Swap units" : "Поменять единицы местами"}
            className="mx-auto flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm transition-all hover:scale-105 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-95"
          >
            <ArrowsLeftRight size={20} weight="bold" />
          </button>

          <div className="min-w-0 space-y-3">
            <div>
              <Label htmlFor="fuel-to">{isEn ? "To" : "В"}</Label>
              <Select
                value={to.id}
                onValueChange={(next) => {
                  setToId(next as FuelUnitId);
                  resetCopied();
                }}
              >
                <SelectTrigger id="fuel-to" className="mt-1.5 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {labelFor(unit)} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className="min-h-20 rounded-[var(--radius-md)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)] p-3"
              aria-live="polite"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                {isEn ? "Result" : "Результат"}
              </p>
              <p className="mt-1 min-w-0 break-words text-2xl font-extrabold tabular-nums">
                {formatted}{" "}
                <span className="text-base text-[var(--color-text-muted)]">
                  {to.symbol}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4 sm:flex-row">
          <p className="font-mono text-sm text-[var(--color-text-muted)]">
            {converted !== null
              ? `${value} ${from.symbol} = ${formatted} ${to.symbol}`
              : isEn
                ? "Enter a fuel consumption value."
                : "Введите значение расхода топлива."}
          </p>

          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            disabled={converted === null}
            onClick={() => void copyResult()}
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

        <AdvancedSettings
          className="mt-4"
          title={
            isEn ? "Precision and trip cost" : "Точность и стоимость поездки"
          }
          description={
            isEn
              ? "All units, formulas and an optional cost estimate"
              : "Все единицы, формулы и необязательная оценка стоимости"
          }
        >
          <div className="max-w-48">
            <Label htmlFor="fuel-precision">
              {isEn ? "Decimal places" : "Знаков после запятой"}
            </Label>
            <Input
              id="fuel-precision"
              type="number"
              min={0}
              max={8}
              value={precision}
              onChange={(event) => {
                setPrecision(
                  Math.min(8, Math.max(0, Number(event.target.value) || 0)),
                );
                resetCopied();
              }}
              className="mt-1.5 h-11"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="fuel-price">
                {isEn ? "Fuel price per litre" : "Цена литра топлива"}
              </Label>
              <Input
                id="fuel-price"
                value={fuelPrice}
                inputMode="decimal"
                onChange={(event) => setFuelPrice(event.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="fuel-distance">
                {isEn ? "Trip distance, km" : "Расстояние, км"}
              </Label>
              <Input
                id="fuel-distance"
                value={distance}
                inputMode="decimal"
                onChange={(event) => setDistance(event.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="fuel-currency">
                {isEn ? "Currency label" : "Обозначение валюты"}
              </Label>
              <Input
                id="fuel-currency"
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value.slice(0, 8))
                }
                placeholder={isEn ? "USD" : "₸"}
                className="mt-1.5 h-11"
              />
            </div>
          </div>
          {tripCost !== null ? (
            <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                {isEn ? "Estimated trip cost" : "Оценка стоимости поездки"}
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums">
                {formatValue(tripCost, 2)} {currency.trim()}
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-xs leading-5 text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "US mpg = 235.214583 ÷ L/100 km · Imperial mpg = 282.480936 ÷ L/100 km · km/L = 100 ÷ L/100 km."
                : "mpg США = 235,214583 ÷ л/100 км · имперский mpg = 282,480936 ÷ л/100 км · км/л = 100 ÷ л/100 км."}
            </p>
            <p className="mt-1">
              {isEn
                ? "Trip cost assumes the entered price is per litre."
                : "Стоимость поездки предполагает, что цена указана за один литр."}
            </p>
          </div>

          {allResults.length ? (
            <ul className="mt-4 divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
              {allResults.map((row) => (
                <li
                  key={row.id}
                  className="grid grid-cols-2 gap-3 px-3 py-2 text-sm"
                >
                  <span className="text-[var(--color-text-muted)]">
                    {labelFor(row)}
                  </span>
                  <span className="text-right font-semibold tabular-nums">
                    {row.value} {row.symbol}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </AdvancedSettings>
      </section>
    </div>
  );
}
