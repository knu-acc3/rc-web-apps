"use client";

import { useMemo, useState } from "react";
import { ArrowsLeftRight, Check, Copy, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
}

interface HWB {
  h: number;
  w: number;
  b: number;
}

interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

interface LAB {
  l: number;
  a: number;
  b: number;
}

interface OKLCH {
  l: number;
  c: number;
  h: number;
}

type ColorFormat =
  "hex" | "rgb" | "hsl" | "hsv" | "hwb" | "cmyk" | "lab" | "oklch";

interface ColorFormatInfo {
  key: ColorFormat;
  label: string;
  input: boolean;
  rare?: boolean;
}

const COLOR_FORMATS: ColorFormatInfo[] = [
  { key: "hex", label: "HEX", input: true },
  { key: "rgb", label: "RGB(A)", input: true },
  { key: "hsl", label: "HSL(A)", input: true },
  { key: "hsv", label: "HSV / HSB", input: true, rare: true },
  { key: "hwb", label: "HWB", input: true, rare: true },
  { key: "cmyk", label: "CMYK", input: true, rare: true },
  { key: "lab", label: "LAB (D65)", input: false, rare: true },
  { key: "oklch", label: "OKLCH", input: false, rare: true },
];

const PLACEHOLDERS: Record<ColorFormat, string> = {
  hex: "#3366FF",
  rgb: "51, 102, 255",
  hsl: "220, 100%, 60%",
  hsv: "220, 80%, 100%",
  hwb: "220, 20%, 0%",
  cmyk: "80%, 60%, 0%, 0%",
  lab: "",
  oklch: "",
};

const COLOR_PRESETS = [
  { label: "Indigo (#4F46E5)", hex: "#4F46E5" },
  { label: "Emerald (#10B981)", hex: "#10B981" },
  { label: "Amber (#F59E0B)", hex: "#F59E0B" },
  { label: "Rose (#F43F5E)", hex: "#F43F5E" },
  { label: "Sky (#0EA5E9)", hex: "#0EA5E9" },
  { label: "Purple (#8B5CF6)", hex: "#8B5CF6" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function parseNumberToken(token: string): number | null {
  const normalized = token.trim().replace(/deg$/i, "").replace(/%$/, "");
  if (!normalized || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseAlpha(token: string | undefined): number | null {
  if (token === undefined) return 1;
  const value = parseNumberToken(token);
  if (value === null) return null;
  const normalized = token.trim().endsWith("%") ? value / 100 : value;
  return normalized >= 0 && normalized <= 1 ? normalized : null;
}

function unwrapFunction(value: string, acceptedNames: string[]): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^([a-z]+)\s*\((.*)\)$/i);
  if (!match) {
    return /[a-z]/i.test(trimmed) ? null : trimmed;
  }
  if (!acceptedNames.includes(match[1].toLowerCase())) return null;
  return match[2].trim();
}

function splitColorParts(value: string): string[] {
  return value
    .replace(/\//g, ",")
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseHex(value: string): RGBA | null {
  let hex = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]+$/i.test(hex)) return null;

  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((character) => character + character)
      .join("");
  }
  if (hex.length !== 6 && hex.length !== 8) return null;

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
  };
}

function hslToRgb({ h, s, l }: HSL): RGBA {
  const hue = normalizeHue(h);
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) {
    red = chroma;
    green = secondary;
  } else if (segment < 2) {
    red = secondary;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = secondary;
  } else if (segment < 4) {
    green = secondary;
    blue = chroma;
  } else if (segment < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  const offset = lightness - chroma / 2;
  return {
    r: (red + offset) * 255,
    g: (green + offset) * 255,
    b: (blue + offset) * 255,
    a: 1,
  };
}

function hsvToRgb({ h, s, v }: HSV): RGBA {
  const hue = normalizeHue(h);
  const saturation = clamp(s, 0, 100) / 100;
  const brightness = clamp(v, 0, 100) / 100;
  const chroma = brightness * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) {
    red = chroma;
    green = secondary;
  } else if (segment < 2) {
    red = secondary;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = secondary;
  } else if (segment < 4) {
    green = secondary;
    blue = chroma;
  } else if (segment < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  const offset = brightness - chroma;
  return {
    r: (red + offset) * 255,
    g: (green + offset) * 255,
    b: (blue + offset) * 255,
    a: 1,
  };
}

function hwbToRgb({ h, w, b }: HWB): RGBA {
  let whiteness = clamp(w, 0, 100) / 100;
  let blackness = clamp(b, 0, 100) / 100;
  const total = whiteness + blackness;

  if (total >= 1) {
    whiteness /= total;
    blackness /= total;
    const gray = whiteness * 255;
    return { r: gray, g: gray, b: gray, a: 1 };
  }

  const pure = hsvToRgb({ h, s: 100, v: 100 });
  const scale = 1 - whiteness - blackness;
  return {
    r: (pure.r / 255) * scale * 255 + whiteness * 255,
    g: (pure.g / 255) * scale * 255 + whiteness * 255,
    b: (pure.b / 255) * scale * 255 + whiteness * 255,
    a: 1,
  };
}

function parseColor(value: string, format: ColorFormat): RGBA | null {
  if (format === "hex") return parseHex(value);

  if (format === "rgb") {
    const body = unwrapFunction(value, ["rgb", "rgba"]);
    if (body === null) return null;
    const parts = splitColorParts(body);
    if (parts.length !== 3 && parts.length !== 4) return null;
    const channels = parts.slice(0, 3).map(parseNumberToken);
    const alpha = parseAlpha(parts[3]);
    if (channels.some((channel) => channel === null) || alpha === null) {
      return null;
    }
    const [r, g, b] = channels as number[];
    if ([r, g, b].some((channel) => channel < 0 || channel > 255)) {
      return null;
    }
    return { r, g, b, a: alpha };
  }

  if (format === "hsl") {
    const body = unwrapFunction(value, ["hsl", "hsla"]);
    if (body === null) return null;
    const parts = splitColorParts(body);
    if (parts.length !== 3 && parts.length !== 4) return null;
    const h = parseNumberToken(parts[0]);
    const s = parseNumberToken(parts[1]);
    const l = parseNumberToken(parts[2]);
    const alpha = parseAlpha(parts[3]);
    if (
      h === null ||
      s === null ||
      l === null ||
      alpha === null ||
      s < 0 ||
      s > 100 ||
      l < 0 ||
      l > 100
    ) {
      return null;
    }
    return { ...hslToRgb({ h, s, l }), a: alpha };
  }

  if (format === "hsv") {
    const body = unwrapFunction(value, ["hsv", "hsb"]);
    if (body === null) return null;
    const parts = splitColorParts(body);
    if (parts.length !== 3) return null;
    const h = parseNumberToken(parts[0]);
    const s = parseNumberToken(parts[1]);
    const v = parseNumberToken(parts[2]);
    if (
      h === null ||
      s === null ||
      v === null ||
      s < 0 ||
      s > 100 ||
      v < 0 ||
      v > 100
    ) {
      return null;
    }
    return hsvToRgb({ h, s, v });
  }

  if (format === "hwb") {
    const body = unwrapFunction(value, ["hwb"]);
    if (body === null) return null;
    const parts = splitColorParts(body);
    if (parts.length !== 3 && parts.length !== 4) return null;
    const h = parseNumberToken(parts[0]);
    const w = parseNumberToken(parts[1]);
    const b = parseNumberToken(parts[2]);
    const alpha = parseAlpha(parts[3]);
    if (
      h === null ||
      w === null ||
      b === null ||
      alpha === null ||
      w < 0 ||
      w > 100 ||
      b < 0 ||
      b > 100
    ) {
      return null;
    }
    return { ...hwbToRgb({ h, w, b }), a: alpha };
  }

  if (format === "cmyk") {
    const body = unwrapFunction(value, ["cmyk"]);
    if (body === null) return null;
    const parts = splitColorParts(body);
    if (parts.length !== 4) return null;
    const channels = parts.map(parseNumberToken);
    if (
      channels.some(
        (channel) => channel === null || channel < 0 || channel > 100,
      )
    ) {
      return null;
    }
    const [c, m, y, k] = channels as number[];
    return {
      r: 255 * (1 - c / 100) * (1 - k / 100),
      g: 255 * (1 - m / 100) * (1 - k / 100),
      b: 255 * (1 - y / 100) * (1 - k / 100),
      a: 1,
    };
  }

  return null;
}

function rgbToHsl({ r, g, b }: RGBA): HSL {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    h: normalizeHue(hue),
    s: saturation * 100,
    l: lightness * 100,
  };
}

function rgbToHsv({ r, g, b }: RGBA): HSV {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return {
    h: normalizeHue(hue),
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function rgbToHwb(color: RGBA): HWB {
  const hsv = rgbToHsv(color);
  return {
    h: hsv.h,
    w: (Math.min(color.r, color.g, color.b) / 255) * 100,
    b: (1 - Math.max(color.r, color.g, color.b) / 255) * 100,
  };
}

function rgbToCmyk({ r, g, b }: RGBA): CMYK {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const black = 1 - Math.max(red, green, blue);

  if (black >= 1 - 1e-12) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: ((1 - red - black) / (1 - black)) * 100,
    m: ((1 - green - black) / (1 - black)) * 100,
    y: ((1 - blue - black) / (1 - black)) * 100,
    k: black * 100,
  };
}

function srgbToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function rgbToLab({ r, g, b }: RGBA): LAB {
  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);

  const x = red * 0.4124564 + green * 0.3575761 + blue * 0.1804375;
  const y = red * 0.2126729 + green * 0.7151522 + blue * 0.072175;
  const z = red * 0.0193339 + green * 0.119192 + blue * 0.9503041;

  const transform = (value: number): number =>
    value > 216 / 24389
      ? Math.cbrt(value)
      : ((24389 / 27) * value) / 116 + 16 / 116;

  const fx = transform(x / 0.95047);
  const fy = transform(y);
  const fz = transform(z / 1.08883);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function rgbToOklch({ r, g, b }: RGBA): OKLCH {
  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);

  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const lightness =
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const bAxis =
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

  return {
    l: lightness,
    c: Math.sqrt(a * a + bAxis * bAxis),
    h: normalizeHue((Math.atan2(bAxis, a) * 180) / Math.PI),
  };
}

function formatDecimal(value: number, precision: number): string {
  if (Math.abs(value) < 1e-12 || Object.is(value, -0)) return "0";
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

function hexByte(value: number): string {
  return Math.round(clamp(value, 0, 255))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

function formatHex(color: RGBA): string {
  const alpha = color.a < 1 - 1e-6 ? hexByte(clamp(color.a, 0, 1) * 255) : "";
  return "#" + hexByte(color.r) + hexByte(color.g) + hexByte(color.b) + alpha;
}

function alphaSuffix(alpha: number, precision: number): string {
  return alpha < 1 - 1e-6 ? " / " + formatDecimal(alpha, precision) : "";
}

function formatColor(
  color: RGBA,
  format: ColorFormat,
  precision: number,
): string {
  if (format === "hex") return formatHex(color);

  if (format === "rgb") {
    const channels =
      formatDecimal(color.r, precision) +
      ", " +
      formatDecimal(color.g, precision) +
      ", " +
      formatDecimal(color.b, precision);
    return color.a < 1 - 1e-6
      ? "rgba(" + channels + ", " + formatDecimal(color.a, precision) + ")"
      : "rgb(" + channels + ")";
  }

  if (format === "hsl") {
    const hsl = rgbToHsl(color);
    const channels =
      formatDecimal(hsl.h, precision) +
      ", " +
      formatDecimal(hsl.s, precision) +
      "%, " +
      formatDecimal(hsl.l, precision) +
      "%";
    return color.a < 1 - 1e-6
      ? "hsla(" + channels + ", " + formatDecimal(color.a, precision) + ")"
      : "hsl(" + channels + ")";
  }

  if (format === "hsv") {
    const hsv = rgbToHsv(color);
    return (
      "hsv(" +
      formatDecimal(hsv.h, precision) +
      ", " +
      formatDecimal(hsv.s, precision) +
      "%, " +
      formatDecimal(hsv.v, precision) +
      "%)"
    );
  }

  if (format === "hwb") {
    const hwb = rgbToHwb(color);
    return (
      "hwb(" +
      formatDecimal(hwb.h, precision) +
      " " +
      formatDecimal(hwb.w, precision) +
      "% " +
      formatDecimal(hwb.b, precision) +
      "%" +
      alphaSuffix(color.a, precision) +
      ")"
    );
  }

  if (format === "cmyk") {
    const cmyk = rgbToCmyk(color);
    return (
      "cmyk(" +
      formatDecimal(cmyk.c, precision) +
      "%, " +
      formatDecimal(cmyk.m, precision) +
      "%, " +
      formatDecimal(cmyk.y, precision) +
      "%, " +
      formatDecimal(cmyk.k, precision) +
      "%)"
    );
  }

  if (format === "lab") {
    const lab = rgbToLab(color);
    return (
      "lab-d65(" +
      formatDecimal(lab.l, precision) +
      "% " +
      formatDecimal(lab.a, precision) +
      " " +
      formatDecimal(lab.b, precision) +
      alphaSuffix(color.a, precision) +
      ")"
    );
  }

  const oklch = rgbToOklch(color);
  return (
    "oklch(" +
    formatDecimal(oklch.l, Math.max(3, precision)) +
    " " +
    formatDecimal(oklch.c, Math.max(3, precision)) +
    " " +
    formatDecimal(oklch.h, precision) +
    alphaSuffix(color.a, precision) +
    ")"
  );
}

function formatInfo(key: ColorFormat): ColorFormatInfo {
  return COLOR_FORMATS.find((format) => format.key === key)!;
}

export default function ColorConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("#3366FF");
  const [fromFormat, setFromFormat] = useState<ColorFormat>("hex");
  const [toFormat, setToFormat] = useState<ColorFormat>("rgb");
  const [showRareFormats, setShowRareFormats] = useState(false);
  const [precision, setPrecision] = useState(2);
  const [copied, setCopied] = useState(false);

  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const parsedColor = useMemo(
    () => parseColor(input, fromFormat),
    [fromFormat, input],
  );
  const result =
    parsedColor === null ? "" : formatColor(parsedColor, toFormat, precision);
  const hasFreshResult =
    parsedColor !== null && fromFormat !== toFormat;
  const availableInputFormats = COLOR_FORMATS.filter(
    (format) => format.input && (showRareFormats || !format.rare),
  );
  const availableOutputFormats = COLOR_FORMATS.filter(
    (format) => showRareFormats || !format.rare,
  );

  const allOutputs = useMemo(() => {
    if (!parsedColor) return [];
    return COLOR_FORMATS.map((format) => ({
      key: format.key,
      label: format.label,
      value: formatColor(parsedColor, format.key, precision),
    }));
  }, [parsedColor, precision]);

  const canSwap = formatInfo(toFormat).input;

  const swap = () => {
    if (!canSwap) return;
    const nextFrom = toFormat;
    const nextTo = fromFormat;
    setFromFormat(nextFrom);
    setToFormat(nextTo);
    if (result) setInput(result);
  };

  const toggleRareFormats = (enabled: boolean) => {
    setShowRareFormats(enabled);
    if (!enabled) {
      if (formatInfo(fromFormat).rare) setFromFormat("hex");
      if (formatInfo(toFormat).rare) setToFormat("rgb");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {COLOR_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setFromFormat("hex");
              setInput(p.hex);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              fromFormat === "hex" && input.toUpperCase() === p.hex.toUpperCase()
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            <span
              className="inline-block size-3 rounded-full border border-black/10 shadow-xs"
              style={{ backgroundColor: p.hex }}
            />
            {p.label}
          </button>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="color-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "Color value" : "Значение цвета"}
            </Label>
            <Input
              id="color-value"
              type="text"
              inputMode="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={PLACEHOLDERS[fromFormat]}
              className={cn(
                "mt-1.5 h-14 font-mono text-2xl font-bold",
                input.trim() &&
                  !parsedColor &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
            {input.trim() && !parsedColor ? (
              <p className="mt-1.5 text-xs text-[var(--color-danger)]">
                {isEn
                  ? "The value does not match the selected source format."
                  : "Значение не соответствует выбранному исходному формату."}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {isEn ? "From format" : "Из формата"}
              </Label>
              <select
                value={fromFormat}
                onChange={(event) => {
                  setFromFormat(event.target.value as ColorFormat);
                }}
                className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
              >
                {availableInputFormats.map((format) => (
                  <option key={format.key} value={format.key}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={swap}
              disabled={!canSwap || fromFormat === toFormat}
              aria-label={isEn ? "Swap formats" : "Поменять форматы"}
              className="mx-auto flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm transition-all hover:scale-105 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-95 disabled:opacity-40"
            >
              <ArrowsLeftRight size={20} weight="bold" />
            </button>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {isEn ? "To format" : "В формат"}
              </Label>
              <select
                value={toFormat}
                onChange={(event) => {
                  setToFormat(event.target.value as ColorFormat);
                }}
                className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
              >
                {availableOutputFormats.map((format) => (
                  <option key={format.key} value={format.key}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <section
          className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)]/30 p-4"
          aria-live="polite"
        >
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              {isEn ? "Result" : "Результат"}
            </span>
            {hasFreshResult ? <CopyButton text={result} size="medium" /> : null}
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="h-14 w-14 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-xs"
              style={{
                backgroundColor:
                  hasFreshResult && parsedColor
                    ? formatHex(parsedColor)
                    : "transparent",
              }}
              aria-hidden="true"
            />
            <p className="min-w-0 break-all font-mono text-2xl font-extrabold sm:text-3xl text-[var(--color-text)]">
              {hasFreshResult
                ? result
                : isEn
                  ? "Result appears here"
                  : "Здесь появится результат"}
            </p>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            onClick={() => void handleCopyResult()}
            disabled={!parsedColor || fromFormat === toFormat}
            leadingIcon={copied ? <Check size={20} /> : <Copy size={20} />}
          >
            {copied
              ? (isEn ? "Copied!" : "Скопировано!")
              : (isEn ? "Copy result" : "Копировать результат")}
          </ToolPrimaryAction>
        </div>
      </Card>

      <AdvancedSettings
        title={isEn ? "More color options" : "Дополнительные настройки"}
        description={
          isEn
            ? "More color spaces, precision, swap and limitations"
            : "Дополнительные пространства, точность, обмен и ограничения"
        }
      >
        <div className="space-y-5 [&_button]:min-h-11 [&_select]:min-h-11">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={showRareFormats}
              onChange={(event) => toggleRareFormats(event.target.checked)}
              className="h-5 w-5 accent-[var(--color-primary)]"
            />
            {isEn
              ? "Show HSV, HWB, CMYK, LAB and OKLCH"
              : "Показать HSV, HWB, CMYK, LAB и OKLCH"}
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block">
              {isEn ? "Decimal places" : "Знаков после запятой"}
            </span>
            <select
              value={precision}
              onChange={(event) => {
                setPrecision(Number(event.target.value));
              }}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:max-w-xs"
            >
              {[0, 1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={swap}
            disabled={!canSwap || fromFormat === toFormat}
          >
            <ArrowsLeftRight size={18} />
            {isEn ? "Swap formats" : "Поменять форматы"}
          </Button>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "Accepted input syntax: HEX; RGB channels 0–255; HSL/HSV/HWB/CMYK percentages 0–100. Function wrappers are optional."
                : "Ввод: HEX; каналы RGB 0–255; проценты HSL/HSV/HWB/CMYK 0–100. Название функции можно не писать."}
            </p>
            <p className="mt-2">
              {isEn
                ? "LAB D65 and OKLCH are derived from sRGB and are output-only. LAB D65 is informational, not CSS lab() (which uses D50). CMYK is approximate and has no ICC print profile."
                : "LAB D65 и OKLCH рассчитываются из sRGB и доступны только как результат. LAB D65 — справочная запись, не CSS lab() с D50. CMYK приблизительный: ICC-профиль печати не применяется."}
            </p>
          </div>

          {allOutputs.length ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                {isEn ? "All formats" : "Все форматы"}
              </p>
              <div className="space-y-2">
                {allOutputs.map((item) => (
                  <div
                    key={item.key}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2"
                  >
                    <span className="shrink-0 text-sm text-[var(--color-text-muted)]">
                      {item.label}
                    </span>
                    <span className="min-w-0 break-all text-right font-mono text-sm font-semibold">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </AdvancedSettings>
    </div>
  );
}
