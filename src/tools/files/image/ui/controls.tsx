"use client";

import { useId, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Field, Input, Slider } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { normalizeHex } from "../lib/palette";
import { S } from "./strings";

/** Colour picker + validated HEX text input. `value` is always "#RRGGBB". */
export function ColorField({
  label,
  value,
  onChange,
  locale,
  className,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  locale: Locale;
  className?: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(value);
  }
  const bad = normalizeHex(text) === null;
  return (
    <Field label={label} htmlFor={`${id}-hex`} error={bad ? S(locale).hexInvalid : undefined} className={className}>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-[0.5rem] border border-line bg-surface p-1"
        />
        <Input
          id={`${id}-hex`}
          value={text}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={bad}
          className="font-mono uppercase"
          onChange={(e) => {
            setText(e.target.value);
            const n = normalizeHex(e.target.value);
            if (n) onChange(n);
          }}
          onBlur={() => setText(value)}
        />
      </div>
    </Field>
  );
}

/** Labelled range slider with the current value shown. */
export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  locale,
  hint,
  format,
}: {
  label: ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  locale: Locale;
  hint?: ReactNode;
  format?: (v: number) => string;
}) {
  const id = useId();
  const show = (v: number) => (format ? format(v) : `${formatNumber(locale, v)}${unit ? (unit === "°" ? unit : ` ${unit}`) : ""}`);
  const shown = show(value);
  return (
    <Field label={label} htmlFor={id} hint={hint} aside={<span className="tabular text-[0.9375rem] font-semibold text-fg">{shown}</span>}>
      <Slider id={id} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={shown} format={show} />
    </Field>
  );
}

/** Labelled number field (− / + optional): clamps on blur; empty = null. */
export function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 100000,
  step = 1,
  suffix,
  className,
  placeholder,
  stepper = false,
  locale,
  hint,
}: {
  label: ReactNode;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  placeholder?: string;
  /** Show − / + (for small values: DPI, delays, counts). */
  stepper?: boolean;
  locale?: Locale;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} className={className} hint={hint}>
      <NumberInput
        id={id}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        suffix={suffix}
        placeholder={placeholder}
        stepper={stepper}
        locale={locale}
      />
    </Field>
  );
}

/** Thin progress bar (decorative; status text is announced separately). */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)} aria-hidden>
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-200"
        style={{ width: `${Math.round(Math.max(0.03, Math.min(1, value)) * 100)}%` }}
      />
    </div>
  );
}

/** Checkerboard background that works in light and dark themes. */
export const checker =
  "bg-[length:16px_16px] bg-[position:0_0,8px_8px] [background-image:linear-gradient(45deg,var(--surface-2)_25%,transparent_25%,transparent_75%,var(--surface-2)_75%),linear-gradient(45deg,var(--surface-2)_25%,transparent_25%,transparent_75%,var(--surface-2)_75%)] bg-surface";

/**
 * A drop zone that replaces the current file: the full zone's "Choose file" button (the compact zone says "Add more"),
 * squeezed to the height of a compact one.
 */
export const replaceDrop = "min-h-0! gap-2! px-4! py-5!";
