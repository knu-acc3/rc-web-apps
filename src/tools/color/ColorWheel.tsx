"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { writeClipboardText } from "@/src/utils/clipboard";
import { CheckCircle, ClipboardText, Sparkle } from "@phosphor-icons/react";

type HarmonyId =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "square"
  | "monochromatic";

type Harmony = {
  id: HarmonyId;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  hueOffsets?: number[];
};

type PaletteColor = {
  hex: string;
  textColor: "#000000" | "#FFFFFF";
};

const HARMONIES: Harmony[] = [
  {
    id: "complementary",
    nameEn: "Complementary",
    nameRu: "Комплементарная",
    descriptionEn: "Base color and its direct opposite on the wheel.",
    descriptionRu: "Базовый цвет и цвет напротив него на цветовом круге.",
    hueOffsets: [0, 180],
  },
  {
    id: "analogous",
    nameEn: "Analogous",
    nameRu: "Аналоговая",
    descriptionEn: "Neighboring hues with identical saturation and lightness.",
    descriptionRu: "Три соседних тона с одинаковой насыщенностью и светлотой.",
    hueOffsets: [-30, 0, 30],
  },
  {
    id: "triadic",
    nameEn: "Triadic",
    nameRu: "Триада",
    descriptionEn: "Three hues spaced evenly by 120°.",
    descriptionRu: "Три тона, расположенные через 120°.",
    hueOffsets: [0, 120, 240],
  },
  {
    id: "split-complementary",
    nameEn: "Split-Comp.",
    nameRu: "Раздельно-комплементарная",
    descriptionEn: "Base color plus two adjacent to its opposite.",
    descriptionRu: "Базовый цвет плюс два соседних с противоположным.",
    hueOffsets: [0, 150, 210],
  },
  {
    id: "square",
    nameEn: "Square",
    nameRu: "Тетраида (квадрат)",
    descriptionEn: "Four hues spaced evenly by 90°.",
    descriptionRu: "Четыре тона, расположенные через 90°.",
    hueOffsets: [0, 90, 180, 270],
  },
  {
    id: "monochromatic",
    nameEn: "Monochrome",
    nameRu: "Монохромная",
    descriptionEn: "Variations in lightness of the same hue.",
    descriptionRu: "Вариации светлоты одного и того же цветового тона.",
  },
];

const PRESET_COLORS = [
  { labelRu: "Синий", labelEn: "Blue", hex: "#3366FF" },
  { labelRu: "Изумруд", labelEn: "Emerald", hex: "#10B981" },
  { labelRu: "Янтарь", labelEn: "Amber", hex: "#F59E0B" },
  { labelRu: "Розовый", labelEn: "Rose", hex: "#F43F5E" },
  { labelRu: "Фиолет", labelEn: "Violet", hex: "#8B5CF6" },
  { labelRu: "Бирюза", labelEn: "Teal", hex: "#06B6D4" },
];

function normalizeHex(value: string): string | null {
  const clean = value.trim().replace(/^#/u, "").toUpperCase();
  if (/^[0-9A-F]{3}$/u.test(clean)) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
  }
  if (/^[0-9A-F]{6}$/u.test(clean)) {
    return `#${clean}`;
  }
  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) return [0, 0, Math.round(lightness * 100)];

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
      break;
  }

  return [
    Math.round(hue * 60),
    Math.round(saturation * 100),
    Math.round(lightness * 100),
  ];
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const saturation = Math.max(0, Math.min(100, s)) / 100;
  const lightness = Math.max(0, Math.min(100, l)) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const intermediate = chroma * (1 - Math.abs((segment % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) {
    red = chroma;
    green = intermediate;
  } else if (segment < 2) {
    red = intermediate;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = intermediate;
  } else if (segment < 4) {
    green = intermediate;
    blue = chroma;
  } else if (segment < 5) {
    red = intermediate;
    blue = chroma;
  } else {
    red = chroma;
    blue = intermediate;
  }

  const match = lightness - chroma / 2;
  return [
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ];
}

function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return (
    "#" +
    [r, g, b]
      .map((part) => part.toString(16).padStart(2, "0").toUpperCase())
      .join("")
  );
}

function readableTextColor(hex: string): "#000000" | "#FFFFFF" {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.35 ? "#000000" : "#FFFFFF";
}

function makePalette(hex: string, harmony: Harmony): PaletteColor[] {
  const [r, g, b] = hexToRgb(hex);
  const [hue, saturation, lightness] = rgbToHsl(r, g, b);

  const colors =
    harmony.id === "monochromatic"
      ? [-28, -14, 0, 14, 28].map((offset) =>
          hslToHex(
            hue,
            saturation,
            Math.min(94, Math.max(6, lightness + offset)),
          ),
        )
      : (harmony.hueOffsets ?? [0]).map((offset) =>
          hslToHex(hue + offset, saturation, lightness),
        );

  return Array.from(new Set(colors)).map((colorHex) => ({
    hex: colorHex,
    textColor: readableTextColor(colorHex),
  }));
}

export default function ColorWheel() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [baseInput, setBaseInput] = useState("#3366FF");
  const [harmonyId, setHarmonyId] = useState<HarmonyId>("complementary");
  const [copyStatus, setCopyStatus] = useState(false);

  const normalizedBase = normalizeHex(baseInput);
  const harmony =
    HARMONIES.find((item) => item.id === harmonyId) ?? HARMONIES[0];

  const palette = useMemo<PaletteColor[] | null>(() => {
    if (!normalizedBase) return null;
    return makePalette(normalizedBase, harmony);
  }, [normalizedBase, harmony]);

  const paletteText =
    palette?.map((color) => color.hex).join(", ") ?? "";

  const copyPalette = async () => {
    if (!paletteText) return;
    await writeClipboardText(paletteText);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* 1-Click Color Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Color presets:" : "Палитра цветов:"}
        </span>
        {PRESET_COLORS.map((p) => (
          <button
            key={p.hex}
            type="button"
            onClick={() => setBaseInput(p.hex)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              normalizedBase === p.hex
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] font-bold text-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            <span
              className="size-3.5 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: p.hex }}
            />
            {isEn ? p.labelEn : p.labelRu}
          </button>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        {/* Base Color Selection */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalizedBase ?? "#3366FF"}
              onChange={(e) => setBaseInput(e.target.value.toUpperCase())}
              aria-label={isEn ? "Choose base color" : "Выбрать базовый цвет"}
              className="h-12 w-16 shrink-0 cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
            />
            <div className="w-36">
              <Label htmlFor="color-wheel-base" className="sr-only">
                {isEn ? "Base color" : "Базовый цвет"}
              </Label>
              <Input
                id="color-wheel-base"
                value={baseInput}
                onChange={(e) => setBaseInput(e.target.value)}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                placeholder="#3366FF"
                className="h-12 font-mono text-base font-bold uppercase"
              />
            </div>
          </div>

          <div className="text-xs text-[var(--color-text-muted)]">
            {normalizedBase ? (
              <span>
                RGB: {hexToRgb(normalizedBase).join(", ")} · HSL:{" "}
                {rgbToHsl(...hexToRgb(normalizedBase)).join("°, ")}%
              </span>
            ) : (
              <span className="text-red-500 font-medium">
                {isEn ? "Enter valid HEX (#RGB or #RRGGBB)" : "Введите корректный HEX (#RGB или #RRGGBB)"}
              </span>
            )}
          </div>
        </div>

        {/* Harmony Type Selector - Visible, Open & Interactive */}
        <div className="mt-5 border-t border-[var(--color-border)] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {isEn ? "Color Harmony Type" : "Тип цветовой гармонии"}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
              {isEn ? harmony.descriptionEn : harmony.descriptionRu}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {HARMONIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setHarmonyId(item.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-all",
                  harmonyId === item.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                {isEn ? item.nameEn : item.nameRu}
              </button>
            ))}
          </div>
        </div>

        {/* Live Palette Results */}
        {palette ? (
          <div className="mt-6 border-t border-[var(--color-border)] pt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--color-text)]">
                {isEn ? "Generated Palette" : "Готовая палитра"} (
                {palette.length} {isEn ? "colors" : "цветов"})
              </span>
              <Button
                data-tool-primary-action=""
                size="md"
                className="w-auto"
                onClick={copyPalette}
              >
                {copyStatus ? (
                  <CheckCircle size={18} weight="fill" />
                ) : (
                  <ClipboardText size={18} />
                )}
                {copyStatus
                  ? isEn ? "Copied" : "Скопировано"
                  : isEn ? "Copy palette" : "Копировать палитру"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {palette.map((color, index) => (
                <div
                  key={color.hex + index}
                  className="group overflow-hidden rounded-xl border border-[var(--color-border)] shadow-xs transition-transform hover:-translate-y-0.5"
                >
                  <div
                    className="flex h-24 items-end p-2.5 sm:h-28"
                    style={{
                      backgroundColor: color.hex,
                      color: color.textColor,
                    }}
                  >
                    <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                      {index === 0
                        ? isEn ? "Base" : "Базовый"
                        : `${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--color-surface)] px-2.5 py-2">
                    <span className="font-mono text-xs font-bold text-[var(--color-text)]">
                      {color.hex}
                    </span>
                    <CopyButton
                      text={color.hex}
                      size="small"
                      tooltip={isEn ? "Copy" : "Копировать"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <AdvancedSettings
        className="mt-4"
        defaultOpen={true}
        title={isEn ? "Color theory reference" : "Справка по цветовым гармониям"}
        description={isEn ? "Hue offsets and color wheel balance" : "Смещение цветовых тонов и баланс"}
      >
        <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
          {isEn ? harmony.descriptionEn : harmony.descriptionRu}
        </p>
      </AdvancedSettings>
    </div>
  );
}
