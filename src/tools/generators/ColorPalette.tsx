"use client";

import { useCallback, useState, type FormEvent } from "react";
import { DownloadSimple, Lock, LockOpen, Palette } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useUrlState } from "@/src/hooks/useUrlState";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
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
import { downloadBlob } from "@/src/utils/exportHelpers";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface PaletteResult {
  colors: string[];
  variation: number;
}

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
}

type Harmony = "analogous" | "complementary" | "triadic" | "monochromatic";
type ExportFormat = "css" | "json";

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function hexToRgb(hex: string): RGB {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const lightness = (maximum + minimum) / 2;

  if (maximum === minimum) return { h: 0, s: 0, l: lightness * 100 };

  const delta = maximum - minimum;
  const saturation =
    lightness > 0.5
      ? delta / (2 - maximum - minimum)
      : delta / (maximum + minimum);
  let hue: number;

  if (maximum === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (maximum === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return { h: hue * 60, s: saturation * 100, l: lightness * 100 };
}

function hslToHex({ h, s, l }: HSL): string {
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = normalizeHue(h) / 60;
  const second = chroma * (1 - Math.abs((segment % 2) - 1));
  const offset = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green, blue] = [chroma, second, 0];
  else if (segment < 2) [red, green, blue] = [second, chroma, 0];
  else if (segment < 3) [red, green, blue] = [0, chroma, second];
  else if (segment < 4) [red, green, blue] = [0, second, chroma];
  else if (segment < 5) [red, green, blue] = [second, 0, chroma];
  else [red, green, blue] = [chroma, 0, second];

  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function harmonyHue(
  baseHue: number,
  harmony: Harmony,
  index: number,
  count: number,
): number {
  if (harmony === "monochromatic") return baseHue;
  if (harmony === "complementary") {
    return normalizeHue(baseHue + (index % 2 === 0 ? 0 : 180));
  }
  if (harmony === "triadic") {
    return normalizeHue(baseHue + (index % 3) * 120);
  }
  const progress = count <= 2 ? 0 : (index - 1) / (count - 2);
  return normalizeHue(baseHue - 50 + progress * 100);
}

function generatePalette(
  baseHex: string,
  harmony: Harmony,
  count: number,
  variation: number,
): string[] {
  const base = rgbToHsl(hexToRgb(baseHex));
  const random = createRandom(hashString(`${baseHex}|${harmony}|${variation}`));

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return baseHex.toUpperCase();
    const hue = harmonyHue(base.h, harmony, index, count);
    const saturation = clamp(base.s + (random() - 0.5) * 18, 28, 92);
    const lightness =
      harmony === "monochromatic"
        ? clamp(18 + (index / (count - 1)) * 68 + (random() - 0.5) * 6, 12, 90)
        : clamp(
            base.l + (index % 2 === 0 ? -8 : 8) + (random() - 0.5) * 20,
            18,
            82,
          );
    return hslToHex({ h: hue, s: saturation, l: lightness });
  });
}

function relativeLuminance(hex: string): number {
  const color = hexToRgb(hex);
  const channels = [color.r, color.g, color.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function getContrastColor(hex: string): string {
  return relativeLuminance(hex) > 0.42 ? "#111827" : "#FFFFFF";
}

function buildExport(colors: string[], format: ExportFormat): string {
  if (format === "json") return JSON.stringify(colors, null, 2);
  return `:root {\n${colors
    .map((color, index) => `  --palette-${index + 1}: ${color};`)
    .join("\n")}\n}`;
}

function ColorField({ id, label, value, error, onChange }: ColorFieldProps) {
  const valid = HEX_PATTERN.test(value);
  const helpId = `${id}-help`;

  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5 flex min-w-0 gap-2">
        <Input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={label}
          className="h-12 w-12 shrink-0 cursor-pointer p-1"
        />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          maxLength={7}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!valid}
          aria-describedby={helpId}
          className={cn(
            "h-12 min-w-0 font-mono uppercase",
            !valid && "border-[var(--color-danger)]",
          )}
        />
      </div>
      <p
        id={helpId}
        className={cn(
          "mt-1 text-xs text-[var(--color-text-muted)]",
          !valid && "text-[var(--color-danger)]",
        )}
      >
        {valid ? "HEX" : error}
      </p>
    </div>
  );
}

export default function ColorPalette() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const { state: urlState, setState: setUrlState } = useUrlState({
    defaultValues: {
      color: "#2563EB",
      harmony: "analogous" as Harmony,
      count: "5",
    },
  });

  const baseColor = urlState.color;
  const harmony = urlState.harmony as Harmony;
  const countInput = urlState.count;
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const [result, setResult] = useState<PaletteResult | null>(null);
  const [locked, setLocked] = useState<boolean[]>([]);

  const setBaseColor = useCallback((val: string) => {
    setUrlState({ color: val });
  }, [setUrlState]);
  const setHarmony = useCallback((val: Harmony) => {
    setUrlState({ harmony: val });
  }, [setUrlState]);
  const setCountInput = useCallback((val: string) => {
    setUrlState({ count: val });
  }, [setUrlState]);

  const baseValid = HEX_PATTERN.test(baseColor);
  const count = Number(countInput);
  const countValid = Number.isInteger(count) && count >= 3 && count <= 8;
  const formValid = baseValid && countValid;
  const exportText = result ? buildExport(result.colors, exportFormat) : "";

  const clearPalette = () => {
    setResult(null);
    setLocked([]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValid) return;
    const variation = result ? result.variation + 1 : 0;
    const generated = generatePalette(baseColor, harmony, count, variation);
    const colors = generated.map((color, index) =>
      result && locked[index] ? (result.colors[index] ?? color) : color,
    );
    setResult({ colors, variation });
    setLocked(
      Array.from({ length: count }, (_, index) => Boolean(locked[index])),
    );
  };

  const toggleLock = (index: number) => {
    if (!result) return;
    setLocked((current) =>
      result.colors.map((_, colorIndex) =>
        colorIndex === index
          ? !current[colorIndex]
          : Boolean(current[colorIndex]),
      ),
    );
  };

  const downloadPalette = () => {
    if (!result) return;
    const extension = exportFormat === "json" ? "json" : "css";
    const mime = exportFormat === "json" ? "application/json" : "text/css";
    downloadBlob(
      new Blob([exportText], { type: `${mime};charset=utf-8` }),
      `color-palette.${extension}`,
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Card className="p-4 sm:p-5">
          <ColorField
            id="palette-base-color"
            label={isEn ? "Base color" : "Базовый цвет"}
            value={baseColor}
            error={
              isEn
                ? "Enter a six-digit HEX color."
                : "Введите HEX-цвет из шести знаков."
            }
            onChange={(value) => {
              setBaseColor(value);
              clearPalette();
            }}
          />
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!formValid}
          leadingIcon={<Palette size={20} />}
        >
          {isEn ? "Generate palette" : "Создать палитру"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={
            isEn ? "Harmony, locks and export" : "Гармония, фиксация и экспорт"
          }
          description={
            isEn
              ? "Choose the color relationship, keep selected colors and save the result"
              : "Выберите сочетание, сохраните нужные цвета и экспортируйте результат"
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="palette-harmony">
                {isEn ? "Harmony" : "Гармония"}
              </Label>
              <Select
                value={harmony}
                onValueChange={(value) => {
                  setHarmony(value as Harmony);
                  clearPalette();
                }}
              >
                <SelectTrigger id="palette-harmony" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analogous">
                    {isEn ? "Analogous" : "Аналоговая"}
                  </SelectItem>
                  <SelectItem value="complementary">
                    {isEn ? "Complementary" : "Комплементарная"}
                  </SelectItem>
                  <SelectItem value="triadic">
                    {isEn ? "Triadic" : "Триадная"}
                  </SelectItem>
                  <SelectItem value="monochromatic">
                    {isEn ? "Monochromatic" : "Монохромная"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="palette-count">
                {isEn ? "Number of colors" : "Количество цветов"}
              </Label>
              <Input
                id="palette-count"
                type="number"
                min={3}
                max={8}
                step={1}
                inputMode="numeric"
                value={countInput}
                onChange={(event) => {
                  setCountInput(event.target.value);
                  clearPalette();
                }}
                aria-invalid={!countValid}
                aria-describedby="palette-count-help"
                className={cn(
                  "mt-1.5 h-11 font-mono",
                  !countValid && "border-[var(--color-danger)]",
                )}
              />
              <p
                id="palette-count-help"
                className={cn(
                  "mt-1 text-xs text-[var(--color-text-muted)]",
                  !countValid && "text-[var(--color-danger)]",
                )}
              >
                {countValid
                  ? "3–8"
                  : isEn
                    ? "Enter a whole number from 3 to 8."
                    : "Введите целое число от 3 до 8."}
              </p>
            </div>

            <div>
              <Label htmlFor="palette-export">
                {isEn ? "Export format" : "Формат экспорта"}
              </Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as ExportFormat)
                }
              >
                <SelectTrigger id="palette-export" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="css">CSS variables</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {result ? (
            <div className="mt-4">
              <Label>{isEn ? "Keep colors" : "Сохранить цвета"}</Label>
              <div
                className="mt-2 flex flex-wrap gap-2"
                role="group"
                aria-label={
                  isEn ? "Palette color locks" : "Фиксация цветов палитры"
                }
              >
                {result.colors.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    type="button"
                    onClick={() => toggleLock(index)}
                    aria-pressed={Boolean(locked[index])}
                    aria-label={
                      locked[index]
                        ? isEn
                          ? `Unlock ${color}`
                          : `Снять фиксацию ${color}`
                        : isEn
                          ? `Lock ${color}`
                          : `Зафиксировать ${color}`
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
                    style={{
                      backgroundColor: color,
                      color: getContrastColor(color),
                    }}
                  >
                    {locked[index] ? (
                      <Lock size={18} weight="fill" />
                    ) : (
                      <LockOpen size={18} />
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Locked colors stay unchanged on the next generation."
                  : "Зафиксированные цвета не изменятся при следующей генерации."}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {result ? (
              <CopyButton
                text={exportText}
                size="medium"
                tooltip={isEn ? "Copy export" : "Копировать экспорт"}
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={!result}
              onClick={downloadPalette}
            >
              <DownloadSimple size={18} />
              {isEn ? "Download" : "Скачать"}
            </Button>
            {!result ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Generate the palette before exporting."
                  : "Сначала создайте палитру."}
              </p>
            ) : null}
          </div>
        </AdvancedSettings>
      </form>

      {result ? (
        <Card className="p-4 sm:p-5" aria-live="polite">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-base font-bold">
              {isEn ? "Palette" : "Палитра"}
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              {result.colors.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {result.colors.map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div
                  className="h-20 w-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex min-w-0 items-center gap-1 px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold">
                    {color}
                  </span>
                  <CopyButton text={color} size="medium" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
