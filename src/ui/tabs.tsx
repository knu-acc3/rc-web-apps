"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ScrollRow } from "./scroll-row";

interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
}

/** Material 3 tabs (arrow-key navigation): the active one is accent with a rounded indicator. Content is rendered by
 * the caller. A row that doesn't fit scrolls with ‹ › buttons. */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
  className,
  bare = false,
}: {
  value: T;
  onChange: (v: T) => void;
  items: readonly TabItem<T>[];
  label: string;
  className?: string;
  /** No line under the tabs (when the card around them already draws one). */
  bare?: boolean;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <ScrollRow role="tablist" label={label} className={cn(!bare && "border-b border-line", className)} rowClassName="gap-1 py-0">
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
            data-ripple
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
              "relative isolate flex h-11 shrink-0 items-center rounded-t-[0.75rem] px-4 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors duration-150 hover:bg-surface-2",
              "after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-accent after:transition-transform after:duration-200",
              active ? "text-accent after:scale-x-100" : "text-fg-2 after:scale-x-0 hover:text-fg",
            )}
          >
            {it.label}
          </button>
        );
      })}
    </ScrollRow>
  );
}
