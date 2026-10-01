"use client";

import { useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { formatNum, parseNum } from "@/lib/number-input";
import { Button } from "@/ui/button";
import { SliderField } from "@/ui/slider-field";
import { runPdfJob } from "../lib/client";
import type { Job as PdfJob, JobResult } from "../lib/jobs";
import type { JobContext } from "./use-job";

/** Run a worker job wired to a useJob context (progress + cancel). */
export function workerJob(job: PdfJob, ctx: JobContext): Promise<JobResult> {
  return runPdfJob(job, { onProgress: (p) => ctx.progress(p), signal: ctx.signal });
}

/**
 * The main action of a tool: a large filled button across the action column.
 * `done` (a result is ready) turns it tonal, so "Download" is the one filled button.
 */
export function PrimaryButton({ children, disabled, done, onClick, className }: { children: ReactNode; disabled?: boolean; done?: boolean; onClick: () => void; className?: string }) {
  return (
    <Button variant={done ? "tonal" : "filled"} size="lg" className={cn("w-full", className)} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

/** Small caption above a control group. */
export function Caption({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <span id={id} className="mb-2 block text-sm font-medium text-fg-2">
      {children}
    </span>
  );
}

/**
 * A number with a sensible range as a slider with the value written on the line
 * (tap the value to type an exact one). Keeps what the user is typing.
 */
export function ValueSlider({
  id,
  locale,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  disabled,
}: {
  id: string;
  locale: Locale;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  const fmt = (n: number) => formatNum(n, 0, locale);
  const [text, setText] = useState(fmt(value));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    if (parseNum(text) !== value) setText(fmt(value));
  }
  return (
    <div className={cn(disabled && "pointer-events-none opacity-50")} aria-disabled={disabled || undefined}>
      <SliderField
        id={id}
        label={label}
        value={text}
        onChange={(v) => {
          setText(v);
          const n = parseNum(v);
          if (n !== null) onChange(Math.min(max, Math.max(min, n)));
        }}
        parse={parseNum}
        format={fmt}
        min={min}
        max={max}
        step={step}
        suffix={suffix}
        inputMode={min < 0 ? "decimal" : "numeric"}
      />
    </div>
  );
}

/** Grid picker of a position on the page (3 columns: left, centre, right). */
export function PositionPicker<A extends string>({ label, value, options, onChange, names, disabled }: { label: string; value: A; options: readonly A[]; onChange: (a: A) => void; names: Record<A, string>; disabled?: boolean }) {
  return (
    <div role="group" aria-label={label} className={cn("grid w-fit grid-cols-3 gap-1 rounded-[1rem] bg-surface-2 p-1.5", disabled && "opacity-50")}>
      {options.map((a) => (
        <button
          key={a}
          type="button"
          aria-pressed={a === value}
          aria-label={names[a]}
          title={names[a]}
          disabled={disabled}
          onClick={() => onChange(a)}
          className={cn("flex h-10 w-12 items-center justify-center rounded-[0.75rem] transition-colors duration-150 pointer-coarse:h-11", a === value ? "bg-accent text-accent-fg shadow-elev-1" : "text-fg-3 hover:bg-surface-3 hover:text-fg")}
        >
          <span className={cn("block rounded-full bg-current transition-[width,height] duration-150", a === value ? "size-3" : "size-2")} aria-hidden />
        </button>
      ))}
    </div>
  );
}
