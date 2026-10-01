"use client";

import { useId, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Field, Input, Slider } from "@/ui/field";
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
  const shown = format ? format(value) : `${formatNumber(locale, value)}${unit ? (unit === "%" || unit === "°" ? unit : ` ${unit}`) : ""}`;
  return (
    <Field label={label} htmlFor={id} hint={hint} aside={<span className="tabular text-sm font-medium text-fg">{shown}</span>}>
      <Slider id={id} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={shown} />
    </Field>
  );
}

/** Integer input that accepts only digits and clamps on blur. */
export function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 100000,
  suffix,
  className,
  placeholder,
}: {
  label: ReactNode;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
  placeholder?: string;
}) {
  const id = useId();
  const [text, setText] = useState(value === null ? "" : String(value));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    if ((text === "" ? null : Number(text)) !== value) setText(value === null ? "" : String(value));
  }
  return (
    <Field label={label} htmlFor={id} className={className}>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          className={cn("tabular", suffix && "pr-10")}
          onChange={(e) => {
            const t = e.target.value.replace(/[^\d]/g, "");
            setText(t);
            if (t === "") onChange(null);
            else {
              const n = Number(t);
              if (n >= min && n <= max) onChange(n);
            }
          }}
          onBlur={() => {
            if (text === "") return;
            const n = Math.min(max, Math.max(min, Number(text)));
            setText(String(n));
            onChange(n);
          }}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-3">{suffix}</span>}
      </div>
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
