"use client";

import { useState, type FormEvent } from "react";
import { DownloadSimple, Palette } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
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

interface OKLab {
  l: number;
  a: number;
  b: number;
}

type Interpolation = "oklab" | "rgb" | "hsl";
type ExportFormat = "css" | "json";

interface BlendResult {
  colors: string[];
}

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function hexToRgb(hex: string): RGB | null {
  if (!HEX_PATTERN.test(hex)) return null;
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: lightness };

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return { h: hue * 60, s: saturation, l: lightness };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const channel = l * 255;
    return { r: channel, g: channel, b: channel };
  }

  const hueToRgb = (p: number, q: number, value: number) => {
    let t = value;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const normalizedHue = h / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hueToRgb(p, q, normalizedHue + 1 / 3) * 255,
    g: hueToRgb(p, q, normalizedHue) * 255,
    b: hueToRgb(p, q, normalizedHue - 1 / 3) * 255,
  };
}

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgb(channel: number): number {
  const value =
    channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, value * 255));
}

function rgbToOklab(color: RGB): OKLab {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);
  const x = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const y = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const z = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    l: 0.2104542553 * x + 0.793617785 * y - 0.0040720468 * z,
    a: 1.9779984951 * x - 2.428592205 * y + 0.4505937099 * z,
    b: 0.0259040371 * x + 0.7827717662 * y - 0.808675766 * z,
  };
}

function oklabToRgb(color: OKLab): RGB {
  const x = color.l + 0.3963377774 * color.a + 0.2158037573 * color.b;
  const y = color.l - 0.1055613458 * color.a - 0.0638541728 * color.b;
  const z = color.l - 0.0894841775 * color.a - 1.291485548 * color.b;
  const x3 = x * x * x;
  const y3 = y * y * y;
  const z3 = z * z * z;

  return {
    r: linearToSrgb(4.0767416621 * x3 - 3.3077115913 * y3 + 0.2309699292 * z3),
    g: linearToSrgb(-1.2684380046 * x3 + 2.6097574011 * y3 - 0.3413193965 * z3),
    b: linearToSrgb(-0.0041960863 * x3 - 0.7034186147 * y3 + 1.707614701 * z3),
  };
}

function mixColors(
  first: RGB,
  second: RGB,
  amount: number,
  mode: Interpolation,
): RGB {
  if (mode === "hsl") {
    const start = rgbToHsl(first);
    const end = rgbToHsl(second);
    let hueDistance = end.h - start.h;
    if (hueDistance > 180) hueDistance -= 360;
    if (hueDistance < -180) hueDistance += 360;

    return hslToRgb({
      h: (start.h + hueDistance * amount + 360) % 360,
      s: start.s + (end.s - start.s) * amount,
      l: start.l + (end.l - start.l) * amount,
    });
  }

  if (mode === "oklab") {
    const start = rgbToOklab(first);
    const end = rgbToOklab(second);
    return oklabToRgb({
      l: start.l + (end.l - start.l) * amount,
      a: start.a + (end.a - start.a) * amount,
      b: start.b + (end.b - start.b) * amount,
    });
  }

  return {
    r: first.r + (second.r - first.r) * amount,
    g: first.g + (second.g - first.g) * amount,
    b: first.b + (second.b - first.b) * amount,
  };
}

function createPalette(
  firstHex: string,
  secondHex: string,
  count: number,
  mode: Interpolation,
): string[] {
  const first = hexToRgb(firstHex);
  const second = hexToRgb(secondHex);
  if (!first || !second) return [];

  return Array.from({ length: count }, (_, index) => {
    const amount = count === 1 ? 0 : index / (count - 1);
    return rgbToHex(mixColors(first, second, amount, mode));
  });
}

function buildExport(colors: string[], format: ExportFormat): string {
  if (format === "json") return JSON.stringify(colors, null, 2);
  return `:root {\n${colors
    .map((color, index) => `  --blend-${index + 1}: ${color};`)
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

export default function ColorBlender() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [firstColor, setFirstColor] = useState("#2563EB");
  const [secondColor, setSecondColor] = useState("#F97316");
  const [countInput, setCountInput] = useState("5");
  const [interpolation, setInterpolation] = useState<Interpolation>("oklab");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const [result, setResult] = useState<BlendResult | null>(null);

  const firstValid = HEX_PATTERN.test(firstColor);
  const secondValid = HEX_PATTERN.test(secondColor);
  const count = Number(countInput);
  const countValid = Number.isInteger(count) && count >= 2 && count <= 12;
  const formValid = firstValid && secondValid && countValid;
  const exportText = result ? buildExport(result.colors, exportFormat) : "";

  const resetResult = () => setResult(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValid) return;
    setResult({
      colors: createPalette(firstColor, secondColor, count, interpolation),
    });
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
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              id="blend-first-color"
              label={isEn ? "First color" : "Первый цвет"}
              value={firstColor}
              error={
                isEn
                  ? "Enter a six-digit HEX color."
                  : "Введите HEX-цвет из шести знаков."
              }
              onChange={(value) => {
                setFirstColor(value);
                resetResult();
              }}
            />
            <ColorField
              id="blend-second-color"
              label={isEn ? "Second color" : "Второй цвет"}
              value={secondColor}
              error={
                isEn
                  ? "Enter a six-digit HEX color."
                  : "Введите HEX-цвет из шести знаков."
              }
              onChange={(value) => {
                setSecondColor(value);
                resetResult();
              }}
            />
          </div>

          <div className="mt-4 max-w-48">
            <Label htmlFor="blend-count">
              {isEn ? "Colors in palette" : "Цветов в палитре"}
            </Label>
            <Input
              id="blend-count"
              type="number"
              min={2}
              max={12}
              step={1}
              inputMode="numeric"
              value={countInput}
              onChange={(event) => {
                setCountInput(event.target.value);
                resetResult();
              }}
              aria-invalid={!countValid}
              aria-describedby="blend-count-help"
              className={cn(
                "mt-1.5 h-12 font-mono",
                !countValid && "border-[var(--color-danger)]",
              )}
            />
            <p
              id="blend-count-help"
              className={cn(
                "mt-1 text-xs text-[var(--color-text-muted)]",
                !countValid && "text-[var(--color-danger)]",
              )}
            >
              {countValid
                ? isEn
                  ? "From 2 to 12."
                  : "От 2 до 12."
                : isEn
                  ? "Enter a whole number from 2 to 12."
                  : "Введите целое число от 2 до 12."}
            </p>
          </div>
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!formValid}
          leadingIcon={<Palette size={20} />}
        >
          {isEn ? "Blend colors" : "Смешать цвета"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={isEn ? "Interpolation and export" : "Интерполяция и экспорт"}
          description={
            isEn
              ? "Choose how colors are mixed and save the finished palette"
              : "Выберите способ смешивания и сохраните готовую палитру"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="blend-interpolation">
                {isEn ? "Interpolation" : "Интерполяция"}
              </Label>
              <Select
                value={interpolation}
                onValueChange={(value) => {
                  setInterpolation(value as Interpolation);
                  resetResult();
                }}
              >
                <SelectTrigger id="blend-interpolation" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oklab">
                    {isEn ? "Natural (OKLab)" : "Естественная (OKLab)"}
                  </SelectItem>
                  <SelectItem value="rgb">RGB</SelectItem>
                  <SelectItem value="hsl">
                    {isEn ? "By hue (HSL)" : "По тону (HSL)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="blend-export-format">
                {isEn ? "Export format" : "Формат экспорта"}
              </Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as ExportFormat)
                }
              >
                <SelectTrigger id="blend-export-format" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="css">CSS variables</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  ? "Blend the colors before exporting."
                  : "Сначала смешайте цвета."}
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
                  className="h-16 w-full"
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
