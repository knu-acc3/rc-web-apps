import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

/** Single-choice pill group (radiogroup semantics). Wraps onto a second line on narrow screens so no option hides
 * off-screen; `wrap={false}` keeps one scrolling row. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
  wrap = true,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  label: string;
  size?: "sm" | "md";
  className?: string;
  wrap?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full gap-1 rounded-[0.625rem] bg-surface-2 p-1",
        wrap ? "flex-wrap" : "overflow-x-auto scrollbar-thin",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              "shrink-0 rounded-[0.4375rem] px-3 font-medium whitespace-nowrap transition-colors duration-150",
              size === "sm" ? "h-7 text-[0.8125rem] pointer-coarse:h-9" : "h-8 text-sm pointer-coarse:h-10",
              active ? "bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-fg-2 hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
