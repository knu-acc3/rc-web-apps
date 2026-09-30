"use client";

import { useState } from "react";
import { Check, Copy, MagnifyingGlass } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const TAILWIND_COLORS: Record<string, Record<number, string>> = {
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
  },
  stone: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
    950: "#422006",
  },
  lime: {
    50: "#f7fee7",
    100: "#ecfccb",
    200: "#d9f99d",
    300: "#bef264",
    400: "#a3e635",
    500: "#84cc16",
    600: "#65a30d",
    700: "#4d7c0f",
    800: "#3f6212",
    900: "#365314",
    950: "#1a2e05",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },
  cyan: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
    950: "#083344",
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b",
  },
  violet: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },
  fuchsia: {
    50: "#fdf4ff",
    100: "#fae8ff",
    200: "#f5d0fe",
    300: "#f0abfc",
    400: "#e879f9",
    500: "#d946ef",
    600: "#c026d3",
    700: "#a21caf",
    800: "#86198f",
    900: "#701a75",
    950: "#4a044e",
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
    950: "#500724",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },
};

type CopyFormat = "hex" | "rgb" | "class";

function hexToRgb(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgb(${red} ${green} ${blue})`;
}

function copyValue(
  family: string,
  shade: number,
  hex: string,
  format: CopyFormat,
) {
  if (format === "rgb") return hexToRgb(hex);
  if (format === "class") return `bg-${family}-${shade}`;
  return hex;
}

export default function TailwindColors() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [query, setQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("blue");
  const [selectedShade, setSelectedShade] = useState<number>(500);
  const [format, setFormat] = useState<CopyFormat>("hex");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const matchingFamilies = Object.keys(TAILWIND_COLORS).filter((family) => {
    if (!normalizedQuery) return true;
    return SHADES.some((shade) => {
      const hex = TAILWIND_COLORS[family][shade].toLowerCase();
      return (
        family.includes(normalizedQuery) ||
        `${family}-${shade}`.includes(normalizedQuery) ||
        hex.includes(normalizedQuery)
      );
    });
  });
  const activeFamily = matchingFamilies.includes(selectedFamily)
    ? selectedFamily
    : (matchingFamilies[0] ?? selectedFamily);
  const familyColors = TAILWIND_COLORS[activeFamily];
  const visibleShades = SHADES.filter((shade) => {
    if (!normalizedQuery || normalizedQuery === activeFamily) return true;
    const hex = familyColors[shade].toLowerCase();
    return (
      activeFamily.includes(normalizedQuery) ||
      `${activeFamily}-${shade}`.includes(normalizedQuery) ||
      hex.includes(normalizedQuery)
    );
  });
  const activeShade = visibleShades.includes(
    selectedShade as (typeof SHADES)[number],
  )
    ? selectedShade
    : (visibleShades[0] ?? 500);
  const selectedHex = familyColors[activeShade];
  const selectedToken = `${activeFamily}-${activeShade}`;
  const selectedValue = copyValue(
    activeFamily,
    activeShade,
    selectedHex,
    format,
  );

  const handleCopy = async () => {
    const success = await copyText(selectedValue);
    setCopyFailed(!success);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <Label
              htmlFor="tailwind-color-search"
              className="text-sm font-semibold"
            >
              {isEn ? "Find a color" : "Найти цвет"}
            </Label>
            <div className="relative mt-2">
              <MagnifyingGlass
                size={19}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <Input
                id="tailwind-color-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCopied(false);
                  setCopyFailed(false);
                }}
                placeholder={
                  isEn
                    ? "blue, blue-500 or #3b82f6"
                    : "blue, blue-500 или #3b82f6"
                }
                className="h-12 pl-10"
              />
            </div>
          </div>
          <div className="min-w-0">
            <Label
              htmlFor="tailwind-color-family"
              className="text-sm font-semibold"
            >
              {isEn ? "Color family" : "Семейство цвета"}
            </Label>
            <select
              id="tailwind-color-family"
              value={activeFamily}
              disabled={matchingFamilies.length === 0}
              onChange={(event) => {
                setSelectedFamily(event.target.value);
                setSelectedShade(500);
                setCopied(false);
                setCopyFailed(false);
              }}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm capitalize text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] disabled:opacity-50"
            >
              {matchingFamilies.map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </select>
          </div>
        </div>

        {matchingFamilies.length === 0 ? (
          <div
            aria-live="polite"
            className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-text-muted)]"
          >
            {isEn ? "No matching colors." : "Подходящих цветов нет."}
          </div>
        ) : (
          <>
            <div
              aria-live="polite"
              className="mt-4 flex min-w-0 items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"
            >
              <span
                className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] border border-black/10"
                style={{ backgroundColor: selectedHex }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{selectedToken}</p>
                <p className="mt-0.5 break-all font-mono text-sm text-[var(--color-text-muted)]">
                  {selectedValue}
                </p>
              </div>
            </div>

            <ToolPrimaryAction
              type="button"
              className="mt-3"
              onClick={() => void handleCopy()}
              leadingIcon={
                copied ? <Check size={20} weight="bold" /> : <Copy size={20} />
              }
            >
              {copied
                ? isEn
                  ? "Value copied"
                  : "Значение скопировано"
                : isEn
                  ? `Copy ${selectedValue}`
                  : `Скопировать ${selectedValue}`}
            </ToolPrimaryAction>
            {copyFailed ? (
              <p
                role="alert"
                className="mt-2 text-sm text-[var(--color-danger)]"
              >
                {isEn
                  ? "Clipboard access was denied."
                  : "Браузер запретил доступ к буферу обмена."}
              </p>
            ) : null}

            <AdvancedSettings
              className="mt-4"
              title={isEn ? "Copy format" : "Формат копирования"}
              description={
                isEn
                  ? "HEX, modern RGB or Tailwind utility class"
                  : "HEX, современный RGB или utility-класс Tailwind"
              }
            >
              <Label htmlFor="tailwind-copy-format">
                {isEn ? "Selected value format" : "Формат выбранного значения"}
              </Label>
              <select
                id="tailwind-copy-format"
                value={format}
                onChange={(event) => {
                  setFormat(event.target.value as CopyFormat);
                  setCopied(false);
                  setCopyFailed(false);
                }}
                className="mt-1.5 h-11 w-full max-w-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="hex">HEX</option>
                <option value="rgb">RGB</option>
                <option value="class">Tailwind class</option>
              </select>
            </AdvancedSettings>

            <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <div className="grid grid-cols-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
                <span>{isEn ? "Token" : "Токен"}</span>
                <span className="text-right">HEX</span>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {visibleShades.map((shade) => {
                  const hex = familyColors[shade];
                  const selected = shade === activeShade;
                  return (
                    <button
                      key={shade}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedFamily(activeFamily);
                        setSelectedShade(shade);
                        setCopied(false);
                        setCopyFailed(false);
                      }}
                      className={cn(
                        "grid min-h-12 w-full grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                        selected
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      <span
                        className="h-8 w-8 rounded-[var(--radius-sm)] border border-black/10"
                        style={{ backgroundColor: hex }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 truncate font-semibold">
                        {activeFamily}-{shade}
                      </span>
                      <span className="min-w-0 truncate text-right font-mono text-xs text-[var(--color-text-muted)]">
                        {hex}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Static Tailwind CSS v3.4.17 reference: 22 multi-shade default families and 242 HEX values. Single-value tokens are not included. Tailwind CSS v4 uses OKLCH theme variables, so this is not a v4 palette reference."
            : "Статический справочник Tailwind CSS v3.4.17: 22 стандартных семейства с оттенками и 242 HEX-значения. Одиночные токены не включены. В Tailwind CSS v4 используются theme-переменные OKLCH, поэтому это не справочник палитры v4."}
        </p>
      </section>
    </div>
  );
}
