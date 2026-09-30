"use client";

import { useId, type ReactNode } from "react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

export interface RangeFieldProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  step?: number;
  unit?: string;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  showValue?: boolean;
  showNumberInput?: boolean;
  formatValue?: (value: number) => string;
  name?: string;
  id?: string;
  className?: string;
}

/** Range input with a 44px interaction lane and optional exact numeric entry. */
export function RangeField({
  label,
  value,
  min,
  max,
  onValueChange,
  step = 1,
  unit,
  hint,
  error,
  disabled = false,
  showValue = true,
  showNumberInput = false,
  formatValue,
  name,
  id: providedId,
  className,
}: RangeFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const numberId = `${id}-number`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const formatted = formatValue ? formatValue(value) : `${value}${unit ?? ""}`;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1 flex min-h-6 items-baseline justify-between gap-3">
        <Label htmlFor={id} className="leading-snug">
          {label}
        </Label>
        {showValue ? (
          <output
            htmlFor={id}
            className="shrink-0 font-mono text-sm font-bold tabular-nums text-[var(--color-text)]"
          >
            {formatted}
          </output>
        ) : null}
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <input
          id={id}
          name={name}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-valuetext={formatted}
          onChange={(event) => onValueChange(clamp(Number(event.target.value)))}
          className="h-11 min-w-0 flex-1 cursor-pointer appearance-none rounded-[var(--radius-pill)] bg-transparent accent-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-progress]:h-2 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-[var(--color-primary)] [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--color-primary)] [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[var(--color-surface-muted)] [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--color-surface-muted)] [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-primary)]"
        />
        {showNumberInput ? (
          <>
            <Label htmlFor={numberId} className="sr-only">
              {label}
            </Label>
            <Input
              id={numberId}
              type="number"
              min={min}
              max={max}
              step={step}
              value={value}
              disabled={disabled}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              inputMode="decimal"
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) onValueChange(clamp(next));
              }}
              className="h-11 w-24 shrink-0 text-right font-mono tabular-nums"
            />
          </>
        ) : null}
      </div>
      {hint ? (
        <div
          id={hintId}
          className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]"
        >
          {hint}
        </div>
      ) : null}
      {error ? (
        <div
          id={errorId}
          role="alert"
          className="mt-1 text-xs font-medium text-[var(--color-danger)]"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
