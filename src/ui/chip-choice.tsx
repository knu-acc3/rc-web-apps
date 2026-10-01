"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ScrollRow } from "./scroll-row";

/**
 * One choice out of many (formats, speeds, presets, code types) as Material chips with a radio-group keyboard
 * (arrow keys move the choice); the chosen chip is tinted with a check. Use it from about six options up — fewer
 * fit a Segmented.
 *  - layout "scroll" (default): one row that scrolls sideways with ‹ › on phones and wraps from `lg`;
 *  - layout "wrap": wraps at every width (inside a card).
 */
export function ChipChoice<V extends string | number>({
  label,
  value,
  options,
  onChange,
  layout = "scroll",
  size = "md",
  className,
}: {
  label: string;
  value: V;
  options: readonly { value: V; label: ReactNode; title?: string; disabled?: boolean }[];
  onChange: (v: V) => void;
  layout?: "scroll" | "wrap";
  size?: "md" | "lg";
  className?: string;
}) {
  const anyOn = options.some((o) => o.value === value);
  const chips = options.map((o, i) => {
    const on = o.value === value;
    return (
      <button
        key={String(o.value)}
        type="button"
        role="radio"
        aria-checked={on}
        tabIndex={on || (!anyOn && i === 0) ? 0 : -1}
        title={o.title}
        disabled={o.disabled}
        onClick={() => onChange(o.value)}
        onKeyDown={(e) => {
          const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          const next = (i + dir + options.length) % options.length;
          onChange(options[next].value);
          (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
        }}
        className={cn("chip tabular shrink-0 font-semibold", size === "lg" && "min-h-11 px-4 text-[0.9375rem]")}
      >
        {on && <Check className="size-4" strokeWidth={2.75} aria-hidden />}
        {o.label}
      </button>
    );
  });
  if (layout === "wrap")
    return (
      <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
        {chips}
      </div>
    );
  return (
    <ScrollRow label={label} role="radiogroup" rowClassName="lg:flex-wrap" className={className}>
      {chips}
    </ScrollRow>
  );
}
