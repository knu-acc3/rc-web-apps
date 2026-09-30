"use client";

import { useState } from "react";
import { Check, Copy, Palette, Shuffle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useCopyWithToast } from "@/src/hooks/useCopyWithToast";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

type DisplayFormat = "css" | "values";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

interface GeneratedColor {
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  textColor: "#000000" | "#FFFFFF";
  contrastRatio: number;
}

function toHexByte(value: number) {
  return value.toString(16).padStart(2, "0").toUpperCase();
}

function rgbToHex({ r, g, b }: RgbColor) {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;

  let hue = 0;
  if (delta !== 0) {
    if (maximum === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (maximum === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }
  if (hue < 0) hue += 360;

  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    h: Math.round(hue) % 360,
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function srgbToLinear(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }: RgbColor) {
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function chooseTextColor(rgb: RgbColor) {
  const luminance = relativeLuminance(rgb);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;

  return contrastWithWhite >= contrastWithBlack
    ? {
        textColor: "#FFFFFF" as const,
        contrastRatio: contrastWithWhite,
      }
    : {
        textColor: "#000000" as const,
        contrastRatio: contrastWithBlack,
      };
}

function randomRgb(): RgbColor {
  try {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.getRandomValues === "function"
    ) {
      const bytes = new Uint8Array(3);
      globalThis.crypto.getRandomValues(bytes);
      return { r: bytes[0], g: bytes[1], b: bytes[2] };
    }
  } catch {
    // A non-security color generator can safely fall back to Math.random.
  }

  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

function generateColor(): GeneratedColor {
  const rgb = randomRgb();
  const contrast = chooseTextColor(rgb);
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHsl(rgb),
    ...contrast,
  };
}

function formatColorValues(color: GeneratedColor, format: DisplayFormat) {
  if (format === "values") {
    return {
      hex: color.hex,
      rgb: `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`,
      hsl: `${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%`,
    };
  }

  return {
    hex: color.hex,
    rgb: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
    hsl: `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`,
  };
}

export default function RandomColor() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>("css");
  const [color, setColor] = useState<GeneratedColor | null>(null);
  const { copied, copy } = useCopyWithToast();

  const values = color ? formatColorValues(color, displayFormat) : null;
  const copyValue = values
    ? `HEX: ${values.hex}\nRGB: ${values.rgb}\nHSL: ${values.hsl}`
    : "";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Palette size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Random color" : "Случайный цвет"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Generate one uniformly random RGB color."
                : "Создаёт один равномерно случайный RGB-цвет."}
            </p>
          </div>
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-5"
          onClick={() => setColor(generateColor())}
          leadingIcon={<Shuffle size={20} weight="bold" aria-hidden="true" />}
        >
          {isEn ? "Generate color" : "Сгенерировать цвет"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Display format" : "Формат отображения"}
          description={
            displayFormat === "css"
              ? isEn
                ? "CSS functions"
                : "CSS-функции"
              : isEn
                ? "Values only"
                : "Только значения"
          }
        >
          <Label htmlFor="random-color-format">
            {isEn ? "RGB and HSL format" : "Формат RGB и HSL"}
          </Label>
          <Select
            value={displayFormat}
            onValueChange={(value) => setDisplayFormat(value as DisplayFormat)}
          >
            <SelectTrigger id="random-color-format" className="mt-2 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="css">
                {isEn ? "CSS functions" : "CSS-функции"}
              </SelectItem>
              <SelectItem value="values">
                {isEn ? "Values only" : "Только значения"}
              </SelectItem>
            </SelectContent>
          </Select>
        </AdvancedSettings>
      </Card>

      {color && values ? (
        <Card
          className="overflow-hidden p-0"
          aria-live="polite"
          aria-labelledby="random-color-result-title"
        >
          <div
            className="flex min-h-48 items-center justify-center p-5 text-center"
            style={{
              backgroundColor: color.hex,
              color: color.textColor,
            }}
          >
            <div>
              <h2
                id="random-color-result-title"
                className="font-mono text-4xl font-bold tracking-tight"
              >
                {values.hex}
              </h2>
              <p className="mt-2 text-sm font-semibold">
                {isEn
                  ? `${color.textColor === "#000000" ? "Black" : "White"} text · ${color.contrastRatio.toFixed(2)}:1`
                  : `${color.textColor === "#000000" ? "Чёрный" : "Белый"} текст · ${color.contrastRatio.toFixed(2)}:1`}
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="space-y-3">
              {(
                [
                  ["HEX", values.hex],
                  ["RGB", values.rgb],
                  ["HSL", values.hsl],
                ] as const
              ).map(([name, value]) => (
                <div
                  key={name}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5"
                >
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    {name}
                  </p>
                  <p className="mt-0.5 break-words font-mono text-sm font-semibold">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void copy(copyValue, {
                  successMessage: isEn
                    ? "Color values copied"
                    : "Значения цвета скопированы",
                })
              }
              className="mt-4 min-h-11 w-full sm:w-auto"
            >
              {copied ? (
                <Check size={18} weight="bold" aria-hidden="true" />
              ) : (
                <Copy size={18} aria-hidden="true" />
              )}
              {copied
                ? isEn
                  ? "Copied"
                  : "Скопировано"
                : isEn
                  ? "Copy color values"
                  : "Скопировать значения"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
