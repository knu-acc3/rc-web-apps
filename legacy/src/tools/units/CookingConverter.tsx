"use client";

import { useState, useMemo } from "react";
import {
  CookingPot,
  ArrowsLeftRight,
  Copy,
  Check,
  Sparkle,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

export type CookingDimension = "volume" | "mass";

export type CookingUnit =
  | "milliliter"
  | "liter"
  | "usCup"
  | "usTablespoon"
  | "usTeaspoon"
  | "usFluidOunce"
  | "gram"
  | "kilogram"
  | "ounce"
  | "pound";

export type DensityPreset =
  | "none"
  | "water"
  | "milk"
  | "vegetableOil"
  | "honey"
  | "flour"
  | "sugar"
  | "custom";

export interface CookingUnitDefinition {
  key: CookingUnit;
  dimension: CookingDimension;
  symbol: string;
  en: string;
  ru: string;
  /** Millilitres for volume units; grams for mass units. */
  baseFactor: number;
}

export interface DensityDefinition {
  key: Exclude<DensityPreset, "none" | "custom">;
  gramsPerMilliliter: number;
  en: string;
  ru: string;
}

export const COOKING_LIMITS = {
  maximumValue: 1_000_000_000_000,
  minimumDensity: 0.01,
  maximumDensity: 25,
} as const;

/**
 * US customary volume factors are derived from the exact international inch.
 * Avoirdupois mass factors use the exact international pound (453.59237 g).
 */
export const COOKING_UNITS: readonly CookingUnitDefinition[] = [
  {
    key: "milliliter",
    dimension: "volume",
    symbol: "mL",
    en: "Millilitres",
    ru: "Миллилитры",
    baseFactor: 1,
  },
  {
    key: "liter",
    dimension: "volume",
    symbol: "L",
    en: "Litres",
    ru: "Литры",
    baseFactor: 1_000,
  },
  {
    key: "usCup",
    dimension: "volume",
    symbol: "US cup",
    en: "US cups",
    ru: "Чашки США",
    baseFactor: 236.5882365,
  },
  {
    key: "usTablespoon",
    dimension: "volume",
    symbol: "US tbsp",
    en: "US tablespoons",
    ru: "Столовые ложки США",
    baseFactor: 14.78676478125,
  },
  {
    key: "usTeaspoon",
    dimension: "volume",
    symbol: "US tsp",
    en: "US teaspoons",
    ru: "Чайные ложки США",
    baseFactor: 4.92892159375,
  },
  {
    key: "usFluidOunce",
    dimension: "volume",
    symbol: "US fl oz",
    en: "US fluid ounces",
    ru: "Жидкие унции США",
    baseFactor: 29.5735295625,
  },
  {
    key: "gram",
    dimension: "mass",
    symbol: "g",
    en: "Grams",
    ru: "Граммы",
    baseFactor: 1,
  },
  {
    key: "kilogram",
    dimension: "mass",
    symbol: "kg",
    en: "Kilograms",
    ru: "Килограммы",
    baseFactor: 1_000,
  },
  {
    key: "ounce",
    dimension: "mass",
    symbol: "oz",
    en: "Ounces",
    ru: "Унции",
    baseFactor: 28.349523125,
  },
  {
    key: "pound",
    dimension: "mass",
    symbol: "lb",
    en: "Pounds",
    ru: "Фунты",
    baseFactor: 453.59237,
  },
] as const;

/** Rounded culinary assumptions in g/mL; real products and packing vary. */
export const DENSITY_PRESETS: readonly DensityDefinition[] = [
  {
    key: "water",
    gramsPerMilliliter: 0.998,
    en: "Water (about 20 °C)",
    ru: "Вода (около 20 °C)",
  },
  {
    key: "milk",
    gramsPerMilliliter: 1.03,
    en: "Milk",
    ru: "Молоко",
  },
  {
    key: "vegetableOil",
    gramsPerMilliliter: 0.92,
    en: "Vegetable oil",
    ru: "Растительное масло",
  },
  {
    key: "honey",
    gramsPerMilliliter: 1.42,
    en: "Honey",
    ru: "Мёд",
  },
  {
    key: "flour",
    gramsPerMilliliter: 0.53,
    en: "All-purpose flour, spooned",
    ru: "Пшеничная мука, без утрамбовки",
  },
  {
    key: "sugar",
    gramsPerMilliliter: 0.85,
    en: "Granulated sugar",
    ru: "Сахар-песок",
  },
] as const;



export function cookingUnit(key: CookingUnit): CookingUnitDefinition {
  const found = COOKING_UNITS.find((unit) => unit.key === key);
  if (!found) throw new RangeError("Unknown cooking unit.");
  return found;
}

export function parseCookingValue(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) &&
    parsed >= 0 &&
    parsed <= COOKING_LIMITS.maximumValue
    ? parsed
    : null;
}

export function parseCookingDensity(value: string): number | null {
  const parsed = parseCookingValue(value);
  return parsed !== null &&
    parsed >= COOKING_LIMITS.minimumDensity &&
    parsed <= COOKING_LIMITS.maximumDensity
    ? parsed
    : null;
}

export function densityForPreset(
  preset: DensityPreset,
  customDensity: number | null,
): number | null {
  if (preset === "none") return null;
  if (preset === "custom") return customDensity;
  return (
    DENSITY_PRESETS.find((definition) => definition.key === preset)
      ?.gramsPerMilliliter ?? null
  );
}

export function convertCookingValue(
  value: number,
  from: CookingUnit,
  to: CookingUnit,
  densityGramsPerMilliliter: number | null = null,
): number {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > COOKING_LIMITS.maximumValue
  ) {
    throw new RangeError("Cooking value is outside the supported range.");
  }

  const source = cookingUnit(from);
  const target = cookingUnit(to);

  if (source.dimension === target.dimension) {
    const converted = (value * source.baseFactor) / target.baseFactor;
    if (!Number.isFinite(converted)) {
      throw new RangeError("Converted value is outside the supported range.");
    }
    return converted;
  }

  if (
    densityGramsPerMilliliter === null ||
    !Number.isFinite(densityGramsPerMilliliter) ||
    densityGramsPerMilliliter < COOKING_LIMITS.minimumDensity ||
    densityGramsPerMilliliter > COOKING_LIMITS.maximumDensity
  ) {
    throw new RangeError(
      "A valid density is required for mass-volume conversion.",
    );
  }

  const converted =
    source.dimension === "volume"
      ? (value * source.baseFactor * densityGramsPerMilliliter) /
        target.baseFactor
      : (value * source.baseFactor) /
        densityGramsPerMilliliter /
        target.baseFactor;

  if (!Number.isFinite(converted)) {
    throw new RangeError("Converted value is outside the supported range.");
  }
  return converted;
}

export function formatCookingNumber(value: number, isEn: boolean): string {
  if (!Number.isFinite(value)) return "—";
  if (Object.is(value, -0) || value === 0) return "0";

  const absolute = Math.abs(value);
  if (absolute >= 1e12 || absolute < 1e-6) {
    return value.toExponential(6).replace(/\.?(?:0+)(?=e)/, "");
  }

  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    maximumSignificantDigits: 9,
    useGrouping: true,
  }).format(value);
}

interface CookingPresetItem {
  labelRu: string;
  labelEn: string;
  value: string;
  from: CookingUnit;
  to: CookingUnit;
  density: DensityPreset;
}

const PRESETS: CookingPresetItem[] = [
  { labelRu: "1 стакан → мл", labelEn: "1 cup → mL", value: "1", from: "usCup", to: "milliliter", density: "none" },
  { labelRu: "1 ст. л. → мл", labelEn: "1 tbsp → mL", value: "1", from: "usTablespoon", to: "milliliter", density: "none" },
  { labelRu: "1 ч. л. → мл", labelEn: "1 tsp → mL", value: "1", from: "usTeaspoon", to: "milliliter", density: "none" },
  { labelRu: "1 стакан муки → г", labelEn: "1 cup flour → g", value: "1", from: "usCup", to: "gram", density: "flour" },
  { labelRu: "1 стакан сахара → г", labelEn: "1 cup sugar → g", value: "1", from: "usCup", to: "gram", density: "sugar" },
  { labelRu: "1 oz → г", labelEn: "1 oz → g", value: "1", from: "ounce", to: "gram", density: "none" },
  { labelRu: "100 г муки → стаканы", labelEn: "100g flour → cups", value: "100", from: "gram", to: "usCup", density: "flour" },
];

const POPULAR_INGREDIENTS: {
  key: Exclude<DensityPreset, "none" | "custom">;
  icon: string;
  ru: string;
  en: string;
  density: number;
}[] = [
  { key: "flour", icon: "🌾", ru: "Мука", en: "Flour", density: 0.53 },
  { key: "sugar", icon: "🍬", ru: "Сахар", en: "Sugar", density: 0.85 },
  { key: "water", icon: "💧", ru: "Вода", en: "Water", density: 0.998 },
  { key: "milk", icon: "🥛", ru: "Молоко", en: "Milk", density: 1.03 },
  { key: "vegetableOil", icon: "🧈", ru: "Раст. масло", en: "Oil", density: 0.92 },
  { key: "honey", icon: "🍯", ru: "Мёд", en: "Honey", density: 1.42 },
];

export default function CookingConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("1");
  const [fromUnit, setFromUnit] = useState<CookingUnit>("usCup");
  const [toUnit, setToUnit] = useState<CookingUnit>("milliliter");
  const [densityPreset, setDensityPreset] = useState<DensityPreset>("none");
  const [customDensity, setCustomDensity] = useState("1");
  const [copied, setCopied] = useState(false);

  const source = cookingUnit(fromUnit);
  const target = cookingUnit(toUnit);
  const crossesDimensions = source.dimension !== target.dimension;
  const parsedValue = parseCookingValue(input);
  const parsedCustomDensity = parseCookingDensity(customDensity);

  // If units cross mass/volume and no density was explicitly selected, default to flour or water
  const effectiveDensityPreset: DensityPreset =
    crossesDimensions && densityPreset === "none" ? "flour" : densityPreset;

  const selectedDensity = densityForPreset(
    effectiveDensityPreset,
    parsedCustomDensity,
  );

  const liveResult = useMemo(() => {
    if (parsedValue === null) return null;
    if (fromUnit === toUnit) return { value: parsedValue, error: null };
    if (crossesDimensions && selectedDensity === null) {
      return { value: null, error: "density" as const };
    }
    try {
      const val = convertCookingValue(
        parsedValue,
        fromUnit,
        toUnit,
        selectedDensity,
      );
      return { value: val, error: null };
    } catch {
      return { value: null, error: "range" as const };
    }
  }, [crossesDimensions, fromUnit, parsedValue, selectedDensity, toUnit]);

  const unitLabel = (unit: CookingUnitDefinition) =>
    `${isEn ? unit.en : unit.ru} (${unit.symbol})`;

  const swap = () => {
    const nextFrom = toUnit;
    const nextTo = fromUnit;
    setFromUnit(nextFrom);
    setToUnit(nextTo);
    if (liveResult?.value !== null && liveResult?.value !== undefined) {
      setInput(
        formatCookingNumber(liveResult.value, isEn).replace(/\s/g, ""),
      );
    }
  };

  const copyResult = async () => {
    if (!liveResult || liveResult.value === null) return;
    const formatted = formatCookingNumber(liveResult.value, isEn);
    const text = `${formatted} ${target.symbol}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // fallback
    }
  };

  const formattedResult =
    liveResult?.value !== null && liveResult?.value !== undefined
      ? formatCookingNumber(liveResult.value, isEn)
      : "—";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        copyResult();
      }}
      className="mx-auto flex w-full max-w-4xl flex-col gap-4"
      noValidate
    >
      {/* 1-Click Cooking Presets Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInput(p.value);
              setFromUnit(p.from);
              setToUnit(p.to);
              setDensityPreset(p.density);
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
              htmlFor="cooking-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "From (value & measure)" : "Из (величина и мера)"}
            </Label>
            <Input
              id="cooking-value"
              type="text"
              inputMode="decimal"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="1"
              autoComplete="off"
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                input.trim() && parsedValue === null && "border-[var(--color-danger)]",
              )}
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value as CookingUnit)}
              className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
            >
              <optgroup label={isEn ? "Volume" : "Объём"}>
                {COOKING_UNITS.filter((u) => u.dimension === "volume").map(
                  (u) => (
                    <option key={u.key} value={u.key}>
                      {unitLabel(u)}
                    </option>
                  ),
                )}
              </optgroup>
              <optgroup label={isEn ? "Mass" : "Масса"}>
                {COOKING_UNITS.filter((u) => u.dimension === "mass").map(
                  (u) => (
                    <option key={u.key} value={u.key}>
                      {unitLabel(u)}
                    </option>
                  ),
                )}
              </optgroup>
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
              {liveResult?.value !== null && liveResult?.value !== undefined && (
                <button
                  type="button"
                  onClick={copyResult}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                >
                  {copied ? (
                    <Check size={14} weight="bold" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copied
                    ? isEn
                      ? "Copied"
                      : "Скопировано!"
                    : isEn
                      ? "Copy"
                      : "Копировать"}
                </button>
              )}
            </div>

            <div className="flex h-14 items-center justify-between overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 px-4">
              <span className="font-mono text-2xl font-extrabold text-[var(--color-text)]">
                {formattedResult}
              </span>
              <span className="font-mono text-base font-bold text-[var(--color-primary)]">
                {target.symbol}
              </span>
            </div>

            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value as CookingUnit)}
              className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
            >
              <optgroup label={isEn ? "Volume" : "Объём"}>
                {COOKING_UNITS.filter((u) => u.dimension === "volume").map(
                  (u) => (
                    <option key={u.key} value={u.key}>
                      {unitLabel(u)}
                    </option>
                  ),
                )}
              </optgroup>
              <optgroup label={isEn ? "Mass" : "Масса"}>
                {COOKING_UNITS.filter((u) => u.dimension === "mass").map(
                  (u) => (
                    <option key={u.key} value={u.key}>
                      {unitLabel(u)}
                    </option>
                  ),
                )}
              </optgroup>
            </select>
          </div>
        </div>

        {/* INGREDIENT DENSITY BAR WHEN CROSSING MASS ↔ VOLUME */}
        {crossesDimensions && (
          <div className="mt-5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]/40 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--color-text)]">
              <span>
                {isEn
                  ? "Culinary ingredient (density):"
                  : "Продукт для перевода объёма в массу:"}
              </span>
              <span className="font-mono text-[var(--color-primary)]">
                {selectedDensity} {isEn ? "g/mL" : "г/мл"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_INGREDIENTS.map((ing) => (
                <button
                  key={ing.key}
                  type="button"
                  onClick={() => setDensityPreset(ing.key)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    effectiveDensityPreset === ing.key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
                  )}
                >
                  <span>{ing.icon}</span>
                  <span>{isEn ? ing.en : ing.ru}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EQUALITY SUMMARY & COMPACT PRIMARY ACTION */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            {liveResult?.value !== null &&
            liveResult?.value !== undefined &&
            parsedValue !== null ? (
              <span>
                {formatCookingNumber(parsedValue, isEn)} {source.symbol} ≈{" "}
                <strong className="font-semibold text-[var(--color-text)]">
                  {formattedResult} {target.symbol}
                </strong>
                {crossesDimensions && selectedDensity && (
                  <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                    ({isEn ? "density" : "плотность"} {selectedDensity}{" "}
                    {isEn ? "g/mL" : "г/мл"})
                  </span>
                )}
              </span>
            ) : (
              <span>
                {isEn ? "Enter a value above" : "Введите значение выше"}
              </span>
            )}
          </div>

          <ToolPrimaryAction
            type="submit"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[200px] px-6 shadow-sm"
            disabled={liveResult?.value === null}
            leadingIcon={
              copied ? (
                <Check size={20} weight="bold" />
              ) : (
                <CookingPot size={20} />
              )
            }
          >
            {copied
              ? isEn
                ? "Result copied!"
                : "Результат скопирован!"
              : isEn
                ? "Convert measure"
                : "Перевести меру"}
          </ToolPrimaryAction>
        </div>
      </Card>

      <AdvancedSettings
        title={
          isEn ? "Kitchen reference and density" : "Кулинарная справка и плотность"
        }
        description={
          isEn
            ? "Common kitchen measurements and custom density"
            : "Таблица мер и пользовательская плотность"
        }
      >
        <div className="space-y-4">
          {/* Quick reference guide */}
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <th className="pb-1.5 font-semibold">
                    {isEn ? "Kitchen measure" : "Кулинарная мера"}
                  </th>
                  <th className="pb-1.5 font-semibold">
                    {isEn ? "Metric equivalent" : "Метрический объём"}
                  </th>
                  <th className="pb-1.5 font-semibold">
                    {isEn ? "Spoons" : "В ложках"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]/50 font-mono">
                <tr>
                  <td className="py-1.5 font-sans font-medium">1 US cup</td>
                  <td className="py-1.5">236.6 mL (~240 mL)</td>
                  <td className="py-1.5">16 tbsp</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">1 US tbsp</td>
                  <td className="py-1.5">14.8 mL (~15 mL)</td>
                  <td className="py-1.5">3 tsp</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">1 US tsp</td>
                  <td className="py-1.5">4.9 mL (~5 mL)</td>
                  <td className="py-1.5">—</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">1 US fl oz</td>
                  <td className="py-1.5">29.6 mL (~30 mL)</td>
                  <td className="py-1.5">2 tbsp</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">1 oz (mass)</td>
                  <td className="py-1.5">28.35 g</td>
                  <td className="py-1.5">—</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">1 lb (mass)</td>
                  <td className="py-1.5">453.6 g</td>
                  <td className="py-1.5">16 oz</td>
                </tr>
              </tbody>
            </table>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              {isEn ? "Ingredient or density preset" : "Продукт или плотность"}
            </span>
            <select
              value={densityPreset}
              onChange={(event) => {
                setDensityPreset(event.target.value as DensityPreset);
              }}
              className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            >
              <option value="none">
                {isEn ? "Default (flour / water)" : "По умолчанию (мука / вода)"}
              </option>
              {DENSITY_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {(isEn ? preset.en : preset.ru) +
                    ` — ${preset.gramsPerMilliliter} g/mL`}
                </option>
              ))}
              <option value="custom">
                {isEn ? "Custom density" : "Своя плотность"}
              </option>
            </select>
          </label>

          {densityPreset === "custom" ? (
            <div>
              <Label htmlFor="cooking-density" className="mb-1.5 block text-sm">
                {isEn ? "Density, g/mL" : "Плотность, г/мл"}
              </Label>
              <Input
                id="cooking-density"
                type="text"
                inputMode="decimal"
                value={customDensity}
                onChange={(event) => {
                  setCustomDensity(event.target.value);
                }}
                className={cn(
                  "min-h-11 font-mono sm:max-w-xs",
                  parsedCustomDensity === null
                    ? "border-[var(--color-danger)]/60"
                    : undefined,
                )}
                aria-invalid={parsedCustomDensity === null}
                aria-describedby="cooking-density-hint"
                autoComplete="off"
              />
              <p
                id="cooking-density-hint"
                className={cn(
                  "mt-1.5 text-xs",
                  parsedCustomDensity === null
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-text-muted)]",
                )}
              >
                {isEn
                  ? "Enter 0.01–25 g/mL using a package or recipe reference."
                  : "Введите 0,01–25 г/мл по данным упаковки или рецепта."}
              </p>
            </div>
          ) : null}

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "Reference-density assumption: rounded room-temperature culinary bulk values. Flour assumes it was spooned without compacting. Brand, temperature and packing can change the real value."
                : "Допущение для готовых значений: округлённые кулинарные справочные плотности при комнатной температуре. Мука предполагается набранной без утрамбовки. Марка, температура и укладка продукта меняют реальное значение."}
            </p>
            <p className="mt-2">
              {isEn
                ? "Formula: volume × g/mL = mass; mass ÷ g/mL = volume. US cup, spoon and fluid-ounce factors are US customary—not metric or UK measures."
                : "Формула: объём × г/мл = масса; масса ÷ г/мл = объём. Чашка, ложки и жидкая унция здесь относятся к системе США, а не к метрической или британской системе."}
            </p>
          </div>
        </div>
      </AdvancedSettings>
    </form>
  );
}
