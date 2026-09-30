"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
}

/** Accessible tab list (arrow-key navigation). Content is rendered by the caller. */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: readonly TabItem<T>[];
  label: string;
  className?: string;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 overflow-x-auto border-b border-line scrollbar-thin", className)}>
      {items.map((it, i) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-${it.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(it.value)}
            onKeyDown={(e) => {
              const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const next = (i + dir + items.length) % items.length;
              onChange(items[next].value);
              refs.current[next]?.focus();
            }}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 pb-2.5 pt-2 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-150",
              active ? "border-accent text-fg" : "border-transparent text-fg-2 hover:text-fg",
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
