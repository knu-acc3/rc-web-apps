"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ScrollRow } from "@/ui/scroll-row";

/**
 * One choice out of many (code types, presets): Material chips with a radio-group keyboard (arrow keys move the
 * choice). By default the chips scroll sideways on phones (ScrollRow) and wrap from `lg`, so every option is visible
 * on a wide screen; `wrap` makes them wrap at every width (inside a card).
 */
export function ChipChoice<V extends string>({
  label,
  value,
  options,
  onChange,
  wrap = false,
  className,
}: {
  label: string;
  value: V;
  options: readonly { value: V; label: ReactNode; title?: string }[];
  onChange: (v: V) => void;
  wrap?: boolean;
  className?: string;
}) {
  const chips = options.map((o, i) => {
    const on = o.value === value;
    return (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={on}
        tabIndex={on ? 0 : -1}
        title={o.title}
        onClick={() => onChange(o.value)}
        onKeyDown={(e) => {
          const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          const next = (i + dir + options.length) % options.length;
          onChange(options[next].value);
          (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
        }}
        className="chip shrink-0"
      >
        {o.label}
      </button>
    );
  });
  if (wrap)
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
