"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Field, Input } from "@/ui/field";
import { parseColor, toHex, type ColorFormat } from "../lib/color";

/** Checkerboard behind translucent swatches (preview-only colors). */
export const CHECKER_STYLE = {
  backgroundImage: "conic-gradient(#c8c8c8 25%, #ffffff 0 50%, #c8c8c8 0 75%, #ffffff 0)",
  backgroundSize: "12px 12px",
} as const;

/** A color chip that shows alpha over a checkerboard. */
export function Swatch({ color, className, label }: { color: string; className?: string; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-block overflow-hidden rounded-[8px] border border-line", className)}
      style={CHECKER_STYLE}
    >
      <span className="absolute inset-0" style={{ background: color }} />
    </span>
  );
}

const T = {
  ru: { invalid: "Не удалось распознать цвет", pick: "Выбрать цвет на палитре" },
  en: { invalid: "Can't recognize this color", pick: "Pick a color from the palette" },
} as const;

/**
 * Text input that accepts any CSS color (hex, rgb(), hsl(), oklch(), names…)
 * with a swatch that opens the native color picker. Controlled: the parent
 * keeps the text and parses it with parseColor().
 */
export function ColorField({
  label,
  value,
  onChange,
  locale,
  hint,
  bare,
  size = "md",
  className,
  id: idProp,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  locale: Locale;
  hint?: string;
  /** How to read a bare number list, e.g. "255, 99, 71" as rgb. */
  bare?: ColorFormat;
  size?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
  /** Visually hide the label (it stays as the input's accessible name). */
  hideLabel?: boolean;
}) {
  const t = T[locale];
  const auto = useId();
  const id = idProp ?? auto;
  const parsed = parseColor(value, bare);
  const invalid = value.trim() !== "" && !parsed;
  const hex6 = parsed ? toHex(parsed, { alpha: false, upper: false }) : "#000000";
  const css = parsed ? toHex(parsed) : "transparent";
  return (
    <Field label={hideLabel ? undefined : label} htmlFor={id} hint={invalid ? undefined : hint} error={invalid ? t.invalid : undefined} className={className}>
      <div className="flex items-stretch gap-2">
        <label className="relative shrink-0 cursor-pointer" title={t.pick}>
          <span className="sr-only">{t.pick}</span>
          <Swatch color={css} className={size === "lg" ? "size-12" : size === "sm" ? "size-9" : "size-10"} />
          <input
            type="color"
            value={hex6}
            onChange={(e) => {
              const alpha = parsed && parsed.alpha < 1 ? toHex(parsed).slice(7) : "";
              onChange(e.target.value.toUpperCase() + alpha);
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          aria-label={hideLabel ? label : undefined}
          autoComplete="off"
          spellCheck={false}
          size={size}
          className="font-mono"
        />
      </div>
    </Field>
  );
}
