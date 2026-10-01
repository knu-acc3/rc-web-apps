"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { fromPos, niceValue, STEPS, toPos, type Scale } from "@/lib/slider-scale";
import { Slider } from "./field";

/**
 * A number you can drag: the label on the left, the value written right on the line (tap it to type an exact
 * number), a slider under it and the range ends below. For ages, sums, rates, years — anything with a sensible
 * range. Typed values may go past the slider's ends (the handle just stays at the end).
 * Works on text (calculators keep what the user typed): `parse` reads it, `format` writes a dragged value.
 */
export function SliderField({
  id,
  label,
  value,
  onChange,
  parse,
  format,
  min,
  max,
  step,
  scale = "linear",
  suffix,
  hint,
  error,
  ends,
  inputMode = "decimal",
  className,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (text: string) => void;
  parse: (text: string) => number | null;
  format: (n: number) => string;
  min: number;
  max: number;
  /** Rounding of dragged values; default — whole numbers ("log": two significant digits). */
  step?: number;
  scale?: Scale;
  /** Unit after the value: "₸", "%", "лет". */
  suffix?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Labels under the two ends of the track (default: min and max formatted). */
  ends?: [ReactNode, ReactNode];
  inputMode?: "decimal" | "numeric";
  className?: string;
}) {
  const n = parse(value);
  const pos = toPos(n ?? min, min, max, scale);
  const width = `${Math.max(2, value.length) + 0.75}ch`;
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex min-w-0 items-end justify-between gap-3">
        <label htmlFor={id} className="min-w-0 pb-1 text-sm font-medium text-fg-2">
          {label}
        </label>
        <div className={cn("flex min-w-0 shrink-0 items-baseline gap-1 border-b-2 border-dashed pb-0.5 transition-colors focus-within:border-solid focus-within:border-accent", error ? "border-err" : "border-line-strong hover:border-outline")}>
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            inputMode={inputMode}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!error}
            style={{ width }}
            className="tabular min-w-[2ch] max-w-[12ch] bg-transparent text-right text-xl font-bold tracking-tight text-fg outline-none sm:text-2xl"
          />
          {suffix && <span className="text-base font-semibold text-fg-2">{suffix}</span>}
        </div>
      </div>
      <Slider
        aria-label={typeof label === "string" ? label : undefined}
        aria-valuetext={n === null ? undefined : `${format(n)}${typeof suffix === "string" ? ` ${suffix}` : ""}`}
        min={0}
        max={STEPS}
        step={1}
        value={pos}
        format={() => format(niceValue(fromPos(pos, min, max, scale), step, scale))}
        onChange={(e) => onChange(format(niceValue(fromPos(Number(e.target.value), min, max, scale), step, scale)))}
        className="mt-1"
      />
      <div className="flex justify-between text-xs text-fg-3">
        <span>{ends ? ends[0] : format(min)}</span>
        <span>{ends ? ends[1] : format(max)}</span>
      </div>
      {error ? (
        <p className="mt-1 text-sm text-err" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-sm text-fg-3">{hint}</p>
      ) : null}
    </div>
  );
}
