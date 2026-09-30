"use client";

import { useState } from "react";
import { ArrowsLeftRight, CheckCircle, XCircle } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type ContrastResult = {
  foreground: string;
  background: string;
  foregroundLuminance: number;
  backgroundLuminance: number;
  ratio: number;
};

type ColorFieldProps = {
  id: string;
  label: string;
  pickerLabel: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
};

type StatusRowProps = {
  label: string;
  passes: boolean;
  passLabel: string;
  failLabel: string;
};

function parseCssColor(color: string): [number, number, number] | null {
  const trimmed = color.trim();
  if (!trimmed) return null;

  const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    const raw = hexMatch[1];
    if (raw.length === 3 || raw.length === 4) {
      return [
        parseInt(raw[0] + raw[0], 16),
        parseInt(raw[1] + raw[1], 16),
        parseInt(raw[2] + raw[2], 16),
      ];
    }
    return [
      parseInt(raw.slice(0, 2), 16),
      parseInt(raw.slice(2, 4), 16),
      parseInt(raw.slice(4, 6), 16),
    ];
  }

  if (typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillStyle = trimmed;
        const color1 = ctx.fillStyle;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillStyle = trimmed;
        const color2 = ctx.fillStyle;
        if (color1 === color2) {
          if (color1.startsWith("#")) {
            return [
              parseInt(color1.slice(1, 3), 16),
              parseInt(color1.slice(3, 5), 16),
              parseInt(color1.slice(5, 7), 16),
            ];
          }
          const rgbMatch = color1.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
          if (rgbMatch) {
            return [
              parseInt(rgbMatch[1], 10),
              parseInt(rgbMatch[2], 10),
              parseInt(rgbMatch[3], 10),
            ];
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (rgbMatch) {
    return [
      Math.min(255, parseInt(rgbMatch[1], 10)),
      Math.min(255, parseInt(rgbMatch[2], 10)),
      Math.min(255, parseInt(rgbMatch[3], 10)),
    ];
  }

  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function normalizeHex(value: string): string | null {
  const rgb = parseCssColor(value);
  if (!rgb) return null;
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
}

function hexToRgb(hex: string): [number, number, number] {
  const parsed = parseCssColor(hex);
  if (parsed) return parsed;
  return [0, 0, 0];
}

function relativeLuminance(hex: string): number {
  const channels = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function calculateContrast(
  foreground: string,
  background: string,
): ContrastResult {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return {
    foreground,
    background,
    foregroundLuminance,
    backgroundLuminance,
    ratio: (lighter + 0.05) / (darker + 0.05),
  };
}

function ColorField({
  id,
  label,
  pickerLabel,
  value,
  invalid,
  onChange,
}: ColorFieldProps) {
  const normalized = normalizeHex(value);

  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <div className="mt-2 flex min-w-0 gap-2">
        <input
          type="color"
          value={normalized ?? "#000000"}
          disabled={!normalized}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={pickerLabel}
          className="h-12 w-16 shrink-0 cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={invalid}
          placeholder="#000000"
          className="h-12 min-w-0 font-mono uppercase"
        />
      </div>
    </div>
  );
}

function StatusRow({ label, passes, passLabel, failLabel }: StatusRowProps) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] py-2 first:border-t-0">
      <span className="text-sm font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <span
        className={
          "inline-flex shrink-0 items-center gap-1.5 text-sm font-bold " +
          (passes
            ? "text-[var(--color-success)]"
            : "text-[var(--color-danger)]")
        }
      >
        {passes ? (
          <CheckCircle size={18} weight="fill" aria-hidden="true" />
        ) : (
          <XCircle size={18} weight="fill" aria-hidden="true" />
        )}
        {passes ? passLabel : failLabel}
      </span>
    </div>
  );
}

export default function ContrastChecker() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [foregroundInput, setForegroundInput] = useState("#111827");
  const [backgroundInput, setBackgroundInput] = useState("#FFFFFF");
  const [result, setResult] = useState<ContrastResult | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);
  const [error, setError] = useState("");

  const foreground = normalizeHex(foregroundInput);
  const background = normalizeHex(backgroundInput);
  const inputSignature =
    (foreground ?? foregroundInput.trim()) +
    "|" +
    (background ?? backgroundInput.trim());
  const visibleResult = resultSignature === inputSignature ? result : null;

  const updateForeground = (value: string) => {
    setForegroundInput(value);
    setError("");
  };

  const updateBackground = (value: string) => {
    setBackgroundInput(value);
    setError("");
  };

  const checkContrast = () => {
    if (!foreground || !background) {
      setError(
        isEn
          ? "Enter both colors as #RGB or #RRGGBB."
          : "Введите оба цвета в формате #RGB или #RRGGBB.",
      );
      setResult(null);
      setResultSignature(null);
      return;
    }

    const nextResult = calculateContrast(foreground, background);
    setForegroundInput(foreground);
    setBackgroundInput(background);
    setResult(nextResult);
    setResultSignature(foreground + "|" + background);
    setError("");
  };

  const swapColors = () => {
    setForegroundInput(backgroundInput);
    setBackgroundInput(foregroundInput);
    setError("");
  };

  const passLabel = isEn ? "Pass" : "Пройдено";
  const failLabel = isEn ? "Fail" : "Не пройдено";

  return (
    <div data-color-tool="contrast" className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isEn ? "Check two colors" : "Проверьте два цвета"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Compare text and background colors against WCAG contrast thresholds."
              : "Сравните цвет текста и фона по порогам контрастности WCAG."}
          </p>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            checkContrast();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              id="contrast-foreground"
              label={isEn ? "Text color" : "Цвет текста"}
              pickerLabel={isEn ? "Choose text color" : "Выбрать цвет текста"}
              value={foregroundInput}
              invalid={Boolean(error) && !foreground}
              onChange={updateForeground}
            />
            <ColorField
              id="contrast-background"
              label={isEn ? "Background color" : "Цвет фона"}
              pickerLabel={
                isEn ? "Choose background color" : "Выбрать цвет фона"
              }
              value={backgroundInput}
              invalid={Boolean(error) && !background}
              onChange={updateBackground}
            />
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={swapColors}
              className="min-h-11"
            >
              <ArrowsLeftRight size={18} aria-hidden="true" />
              {isEn ? "Swap colors" : "Поменять местами"}
            </Button>
          </div>

          <p
            className={
              "mt-3 min-h-5 text-sm " +
              (error
                ? "font-medium text-[var(--color-danger)]"
                : "text-[var(--color-text-muted)]")
            }
            role={error ? "alert" : undefined}
          >
            {error ||
              (isEn
                ? "Opaque HEX colors only. The result is calculated from unrounded values."
                : "Только непрозрачные HEX-цвета. Результат считается по неокруглённым значениям.")}
          </p>

          <ToolPrimaryAction
            type="submit"
            className="mt-3"
            leadingIcon={<CheckCircle size={20} weight="bold" />}
          >
            {isEn ? "Check contrast" : "Проверить контраст"}
          </ToolPrimaryAction>
        </form>
      </section>

      {visibleResult ? (
        <section
          aria-live="polite"
          data-contrast-result=""
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Contrast ratio" : "Коэффициент контраста"}
              </p>
              <p
                data-contrast-ratio=""
                className="mt-1 text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl"
              >
                {visibleResult.ratio.toFixed(2)}:1
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text-muted)]">
                {visibleResult.ratio >= 4.5
                  ? isEn
                    ? "Passes WCAG AA for normal text"
                    : "Соответствует WCAG AA для обычного текста"
                  : isEn
                    ? "Does not pass WCAG AA for normal text"
                    : "Не соответствует WCAG AA для обычного текста"}
              </p>
            </div>
            <CopyButton
              text={
                visibleResult.foreground +
                " on " +
                visibleResult.background +
                ": " +
                visibleResult.ratio.toFixed(2) +
                ":1"
              }
              size="medium"
              tooltip={isEn ? "Copy result" : "Скопировать результат"}
              className="shrink-0"
            />
          </div>

          <div
            className="mt-5 flex min-h-32 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] p-5 text-center"
            style={{
              backgroundColor: visibleResult.background,
              color: visibleResult.foreground,
            }}
          >
            <span className="text-2xl font-bold">
              {isEn ? "Readable text" : "Читаемый текст"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <h3 className="font-bold text-[var(--color-text)]">
                {isEn ? "Normal text" : "Обычный текст"}
              </h3>
              <StatusRow
                label="AA · 4.5:1"
                passes={visibleResult.ratio >= 4.5}
                passLabel={passLabel}
                failLabel={failLabel}
              />
              <StatusRow
                label="AAA · 7:1"
                passes={visibleResult.ratio >= 7}
                passLabel={passLabel}
                failLabel={failLabel}
              />
            </article>

            <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <h3 className="font-bold text-[var(--color-text)]">
                {isEn ? "Large text" : "Крупный текст"}
              </h3>
              <StatusRow
                label="AA · 3:1"
                passes={visibleResult.ratio >= 3}
                passLabel={passLabel}
                failLabel={failLabel}
              />
              <StatusRow
                label="AAA · 4.5:1"
                passes={visibleResult.ratio >= 4.5}
                passLabel={passLabel}
                failLabel={failLabel}
              />
            </article>

            <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <h3 className="font-bold text-[var(--color-text)]">
                {isEn ? "UI components" : "Элементы интерфейса"}
              </h3>
              <StatusRow
                label="AA · 3:1"
                passes={visibleResult.ratio >= 3}
                passLabel={passLabel}
                failLabel={failLabel}
              />
              <div className="border-t border-[var(--color-border-subtle)] pt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                {isEn
                  ? "Icons, controls and focus indicators"
                  : "Иконки, элементы управления и индикаторы фокуса"}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "WCAG thresholds" : "Пороги WCAG"}
        description={
          isEn
            ? "Definitions used for the result"
            : "Определения, использованные в результате"
        }
      >
        <dl className="space-y-3 text-sm">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
            <dt className="font-bold text-[var(--color-text)]">
              {isEn ? "Normal text" : "Обычный текст"}
            </dt>
            <dd className="mt-1 leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "AA requires 4.5:1; AAA requires 7:1."
                : "Для AA требуется 4.5:1, для AAA — 7:1."}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
            <dt className="font-bold text-[var(--color-text)]">
              {isEn ? "Large text" : "Крупный текст"}
            </dt>
            <dd className="mt-1 leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "At least 24 CSS px regular or 18.66 CSS px bold. AA requires 3:1; AAA requires 4.5:1."
                : "Не менее 24 CSS px обычного или 18.66 CSS px жирного текста. Для AA требуется 3:1, для AAA — 4.5:1."}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
            <dt className="font-bold text-[var(--color-text)]">
              {isEn ? "Scope" : "Область проверки"}
            </dt>
            <dd className="mt-1 leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "This tool checks contrast only. Passing a ratio does not by itself certify full WCAG compliance."
                : "Инструмент проверяет только контраст. Подходящий коэффициент сам по себе не подтверждает полное соответствие WCAG."}
            </dd>
          </div>
        </dl>
      </AdvancedSettings>
    </div>
  );
}
