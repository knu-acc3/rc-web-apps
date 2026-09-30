"use client";

import { useState, type FormEvent } from "react";
import { Ruler, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Card } from "@/src/components/ui/card";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

export type ClothingProfile =
  "womenTops" | "womenBottoms" | "menTops" | "menBottoms";
export type ClothingSizeSystem = "alpha" | "eu" | "us" | "uk" | "ru";

export interface ClothingGuideRow {
  readonly alpha: string;
  readonly eu: string;
  readonly us: string;
  readonly uk: string;
  readonly ru: string;
}

export interface ClothingConversion {
  readonly profile: ClothingProfile;
  readonly sourceSystem: ClothingSizeSystem;
  readonly sourceSize: string;
  readonly rows: readonly ClothingGuideRow[];
  readonly equivalents: Readonly<Record<ClothingSizeSystem, string>>;
}

export const CLOTHING_SIZE_SYSTEMS = [
  "alpha",
  "eu",
  "us",
  "uk",
  "ru",
] as const satisfies readonly ClothingSizeSystem[];

/**
 * A deliberately compact adult ready-to-wear guide. Cross-market clothing
 * labels have no universal one-to-one standard, so these rows are presented
 * only as nearby retail references and never as body or garment measurements.
 */
export const CLOTHING_GUIDES: Readonly<
  Record<ClothingProfile, readonly ClothingGuideRow[]>
> = {
  womenTops: [
    { alpha: "XS", eu: "34", us: "2", uk: "6", ru: "40" },
    { alpha: "S", eu: "36", us: "4", uk: "8", ru: "42" },
    { alpha: "M", eu: "38", us: "6", uk: "10", ru: "44" },
    { alpha: "M", eu: "40", us: "8", uk: "12", ru: "46" },
    { alpha: "L", eu: "42", us: "10", uk: "14", ru: "48" },
    { alpha: "L", eu: "44", us: "12", uk: "16", ru: "50" },
    { alpha: "XL", eu: "46", us: "14", uk: "18", ru: "52" },
    { alpha: "2XL", eu: "48", us: "16", uk: "20", ru: "54" },
  ],
  womenBottoms: [
    { alpha: "XS", eu: "34", us: "2", uk: "6", ru: "40" },
    { alpha: "S", eu: "36", us: "4", uk: "8", ru: "42" },
    { alpha: "M", eu: "38", us: "6", uk: "10", ru: "44" },
    { alpha: "M", eu: "40", us: "8", uk: "12", ru: "46" },
    { alpha: "L", eu: "42", us: "10", uk: "14", ru: "48" },
    { alpha: "L", eu: "44", us: "12", uk: "16", ru: "50" },
    { alpha: "XL", eu: "46", us: "14", uk: "18", ru: "52" },
    { alpha: "2XL", eu: "48", us: "16", uk: "20", ru: "54" },
  ],
  menTops: [
    { alpha: "XS", eu: "44", us: "34", uk: "34", ru: "44" },
    { alpha: "S", eu: "46", us: "36", uk: "36", ru: "46" },
    { alpha: "M", eu: "48", us: "38", uk: "38", ru: "48" },
    { alpha: "L", eu: "50", us: "40", uk: "40", ru: "50" },
    { alpha: "XL", eu: "52", us: "42", uk: "42", ru: "52" },
    { alpha: "2XL", eu: "54", us: "44", uk: "44", ru: "54" },
    { alpha: "3XL", eu: "56", us: "46", uk: "46", ru: "56" },
  ],
  menBottoms: [
    { alpha: "XS", eu: "44", us: "28", uk: "28", ru: "44" },
    { alpha: "S", eu: "46", us: "30", uk: "30", ru: "46" },
    { alpha: "M", eu: "48", us: "32", uk: "32", ru: "48" },
    { alpha: "L", eu: "50", us: "34", uk: "34", ru: "50" },
    { alpha: "XL", eu: "52", us: "36", uk: "36", ru: "52" },
    { alpha: "2XL", eu: "54", us: "38", uk: "38", ru: "54" },
    { alpha: "3XL", eu: "56", us: "40", uk: "40", ru: "56" },
  ],
} as const;

interface ClothingSuccess {
  readonly status: "success";
  readonly conversion: ClothingConversion;
}

interface ClothingError {
  readonly status: "error";
  readonly message: string;
}

type ClothingSubmission = ClothingSuccess | ClothingError | null;

function guideFor(profile: ClothingProfile): readonly ClothingGuideRow[] {
  return CLOTHING_GUIDES[profile] ?? [];
}

export function clothingSizeValue(
  row: ClothingGuideRow,
  system: ClothingSizeSystem,
): string {
  switch (system) {
    case "alpha":
      return row.alpha;
    case "eu":
      return row.eu;
    case "us":
      return row.us;
    case "uk":
      return row.uk;
    case "ru":
      return row.ru;
  }
}

export function availableClothingSourceSizes(
  profile: ClothingProfile,
  system: ClothingSizeSystem,
): readonly string[] {
  const values = new Set<string>();
  for (const row of guideFor(profile)) {
    values.add(clothingSizeValue(row, system));
  }
  return [...values];
}

export function formatClothingSizeValues(values: readonly string[]): string {
  const unique = [...new Set(values)];
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  if (unique.every((value) => /^\d+(?:\.\d+)?$/.test(value))) {
    return unique[0] + "–" + unique[unique.length - 1];
  }
  return unique.join(" / ");
}

export function convertClothingSize(
  profile: ClothingProfile,
  sourceSystem: ClothingSizeSystem,
  sourceSize: string,
): ClothingConversion | null {
  const rows = guideFor(profile).filter(
    (row) => clothingSizeValue(row, sourceSystem) === sourceSize,
  );
  if (rows.length === 0) return null;

  const equivalents = Object.fromEntries(
    CLOTHING_SIZE_SYSTEMS.map((system) => [
      system,
      formatClothingSizeValues(
        rows.map((row) => clothingSizeValue(row, system)),
      ),
    ]),
  ) as Record<ClothingSizeSystem, string>;

  return { profile, sourceSystem, sourceSize, rows, equivalents };
}

function defaultSourceSize(
  profile: ClothingProfile,
  system: ClothingSizeSystem,
): string {
  const rows = guideFor(profile);
  return clothingSizeValue(rows[Math.min(2, rows.length - 1)], system);
}

const CLOTHING_PRESETS = [
  { labelRu: "Жен S (EU 36)", labelEn: "Women S (EU 36)", profile: "womenTops" as ClothingProfile, system: "eu" as ClothingSizeSystem, size: "36" },
  { labelRu: "Жен M (EU 38)", labelEn: "Women M (EU 38)", profile: "womenTops" as ClothingProfile, system: "eu" as ClothingSizeSystem, size: "38" },
  { labelRu: "Жен L (EU 42)", labelEn: "Women L (EU 42)", profile: "womenTops" as ClothingProfile, system: "eu" as ClothingSizeSystem, size: "42" },
  { labelRu: "Муж M (EU 48)", labelEn: "Men M (EU 48)", profile: "menTops" as ClothingProfile, system: "eu" as ClothingSizeSystem, size: "48" },
  { labelRu: "Муж L (EU 50)", labelEn: "Men L (EU 50)", profile: "menTops" as ClothingProfile, system: "eu" as ClothingSizeSystem, size: "50" },
  { labelRu: "Муж XL (EU 52)", labelEn: "Men XL (EU 52)", profile: "menTops" as ClothingProfile, system: "eu" as ClothingSizeSystem, size: "52" },
];

export default function ClothingSize() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [profile, setProfile] = useState<ClothingProfile>("womenTops");
  const [sourceSystem, setSourceSystem] = useState<ClothingSizeSystem>("eu");
  const [sourceSize, setSourceSize] = useState("38");

  const computeSubmission = (
    prof = profile,
    sys = sourceSystem,
    sz = sourceSize,
  ): ClothingSubmission => {
    const conversion = convertClothingSize(prof, sys, sz);
    if (!conversion) {
      return {
        status: "error",
        message: isEn
          ? "Choose a label available in the selected built-in guide."
          : "Выберите маркировку из выбранной встроенной сетки.",
      };
    }
    return { status: "success", conversion };
  };

  const [submission, setSubmission] = useState<ClothingSubmission>(() => {
    return computeSubmission("womenTops", "eu", "38");
  });

  const sourceSizes = availableClothingSourceSizes(profile, sourceSystem);
  const targetSystems = CLOTHING_SIZE_SYSTEMS.filter(
    (system) => system !== sourceSystem,
  );

  const profileLabel = (value: ClothingProfile) => {
    const labels: Record<ClothingProfile, { en: string; ru: string }> = {
      womenTops: {
        en: "Women — tops & outerwear",
        ru: "Женская — верх и верхняя одежда",
      },
      womenBottoms: {
        en: "Women — bottoms",
        ru: "Женская — брюки и юбки",
      },
      menTops: {
        en: "Men — tops & outerwear",
        ru: "Мужская — верх и верхняя одежда",
      },
      menBottoms: { en: "Men — trousers", ru: "Мужская — брюки" },
    };
    return isEn ? labels[value].en : labels[value].ru;
  };

  const systemLabel = (system: ClothingSizeSystem) => {
    const labels: Record<ClothingSizeSystem, { en: string; ru: string }> = {
      alpha: { en: "Letter label", ru: "Буквенная маркировка" },
      eu: { en: "EU reference", ru: "Ориентир EU" },
      us: { en: "US reference", ru: "Ориентир US" },
      uk: { en: "UK reference", ru: "Ориентир UK" },
      ru: { en: "RU reference", ru: "Ориентир RU" },
    };
    return isEn ? labels[system].en : labels[system].ru;
  };

  const changeProfile = (nextProfile: ClothingProfile) => {
    setProfile(nextProfile);
    const nextSize = defaultSourceSize(nextProfile, sourceSystem);
    setSourceSize(nextSize);
    setSubmission(computeSubmission(nextProfile, sourceSystem, nextSize));
  };

  const changeSystem = (nextSystem: ClothingSizeSystem) => {
    setSourceSystem(nextSystem);
    const nextSize = defaultSourceSize(profile, nextSystem);
    setSourceSize(nextSize);
    setSubmission(computeSubmission(profile, nextSystem, nextSize));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmission(computeSubmission());
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {CLOTHING_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setProfile(p.profile);
              setSourceSystem(p.system);
              setSourceSize(p.size);
              setSubmission(computeSubmission(p.profile, p.system, p.size));
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              profile === p.profile && sourceSystem === p.system && sourceSize === p.size
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {isEn ? p.labelEn : p.labelRu}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="flex w-full flex-col gap-3"
        noValidate
      >
        <Card className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium">
                {isEn ? "Clothing category" : "Категория одежды"}
              </span>
              <select
                value={profile}
                onChange={(event) =>
                  changeProfile(event.target.value as ClothingProfile)
                }
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              >
                {(
                  ["womenTops", "womenBottoms", "menTops", "menBottoms"] as const
                ).map((value) => (
                  <option key={value} value={value}>
                    {profileLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1.5 block font-medium">
                {isEn ? "Source label system" : "Система исходной маркировки"}
              </span>
              <select
                value={sourceSystem}
                onChange={(event) =>
                  changeSystem(event.target.value as ClothingSizeSystem)
                }
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              >
                {CLOTHING_SIZE_SYSTEMS.map((system) => (
                  <option key={system} value={system}>
                    {systemLabel(system)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1.5 block font-medium">
                {isEn ? "Source label" : "Исходная маркировка"}
              </span>
              <select
                value={sourceSize}
                onChange={(event) => {
                  const next = event.target.value;
                  setSourceSize(next);
                  setSubmission(computeSubmission(profile, sourceSystem, next));
                }}
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-mono"
              >
                {sourceSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Labels vary by brand, cut and fit. This lookup returns nearby retail guidance; the garment brand's own measurements take priority."
              : "Маркировка зависит от бренда, кроя и посадки. Справочник даёт близкие розничные ориентиры; мерки конкретного бренда всегда важнее."}
          </p>

          <div className="mt-4">
            <ToolPrimaryAction
              type="submit"
              fullWidthOnMobile={false}
              className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
              leadingIcon={<Ruler size={20} aria-hidden="true" />}
            >
              {isEn ? "Find size guidance" : "Найти ориентиры по размеру"}
            </ToolPrimaryAction>
          </div>

        <ToolResult
          className="mt-5"
          status={submission?.status ?? "idle"}
          title={
            submission?.status === "success"
              ? isEn
                ? "Nearby retail labels"
                : "Близкие розничные маркировки"
              : submission?.status === "error"
                ? isEn
                  ? "Check the selection"
                  : "Проверьте данные"
                : isEn
                  ? "Size guidance"
                  : "Ориентир по размеру"
          }
          description={
            submission?.status === "error"
              ? submission.message
              : submission?.status === "success"
                ? isEn
                  ? "These are heuristic references, not exact universal conversions."
                  : "Это ориентировочные соответствия, а не точный универсальный перевод."
                : isEn
                  ? "Choose the garment category, source label system and label."
                  : "Выберите категорию одежды, систему и исходную маркировку."
          }
        >
          {submission?.status === "success" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {targetSystems.map((system) => (
                <div
                  key={system}
                  className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"
                >
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">
                    {systemLabel(system)}
                  </p>
                  <p className="mt-1 break-words font-mono text-xl font-bold text-[var(--color-text)]">
                    {submission.conversion.equivalents[system]}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </ToolResult>
      </Card>

      <AdvancedSettings
        title={isEn ? "How to read the guide" : "Как читать справочник"}
        description={
          isEn
            ? "Scope and limits of the built-in label rows"
            : "Область применения и ограничения встроенной сетки"
        }
      >
        <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            {isEn
              ? "The built-in rows cover a compact adult ready-to-wear range. There is no official universal EU, US, UK and RU clothing-label conversion, so ambiguous letter labels return a range."
              : "Встроенная сетка охватывает компактный диапазон взрослой готовой одежды. Официального универсального перевода маркировок EU, US, UK и RU нет, поэтому неоднозначные буквенные размеры возвращают диапазон."}
          </p>
          <p>
            {isEn
              ? "For men's tops, US and UK numbers are treated as jacket or chest-number references; for men's trousers, as waist-number references. Those meanings do not transfer to every garment category."
              : "Для мужского верха числа US и UK трактуются как ориентиры пиджачной маркировки по груди, а для брюк — как ориентиры по талии. Эти значения нельзя переносить между всеми категориями одежды."}
          </p>
          <p>
            {isEn
              ? "Body measurements are intentionally not inferred. Compare bust, chest, waist and hip measurements with the exact product chart before ordering."
              : "Мерки тела намеренно не вычисляются. Перед заказом сравните обхват груди, талии и бёдер с таблицей конкретного товара."}
          </p>
        </div>
      </AdvancedSettings>
      </form>
    </div>
  );
}
