"use client";

import { Check } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
  icon?: ReactNode;
}

const useIsoLayoutEffect = typeof window === "undefined" ? () => {} : useLayoutEffect;

/**
 * Material 3 segmented buttons (radiogroup): connected outlined buttons, the chosen one tinted with a check.
 * Never cut off: when the options don't fit on one line they become separate pills that wrap (`data-wrapped`).
 *  - `fill` stretches the group across its container with equal-width options;
 *  - `size` "sm" for a quiet secondary setting, "lg" for the main mode switch of a tool.
 * `wrap` is accepted for old callers and ignored: the group always wraps.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
  fill = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  label: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fill?: boolean;
  wrap?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Wrapped when the last option sits lower than the first. Measured with the options joined, so the check runs
  // again from the joined layout whenever the width changes.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let raf = 0;
    const measure = () => {
      el.removeAttribute("data-wrapped");
      const items = el.children;
      if (items.length < 2) return;
      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;
      if (last.offsetTop > first.offsetTop + 4) el.setAttribute("data-wrapped", "");
    };
    measure();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(el.parentElement ?? el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [options.length]);

  const h = size === "sm" ? "h-9 text-[0.8125rem] pointer-coarse:h-10" : size === "lg" ? "h-12 text-base" : "h-10 text-sm pointer-coarse:h-11";
  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={cn("seg-group", fill && "seg-fill w-full", className)}>
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
            onKeyDown={(e) => {
              const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const i = options.findIndex((x) => x.value === value);
              const next = options[(i + dir + options.length) % options.length];
              onChange(next.value);
              (e.currentTarget.parentElement?.children[options.indexOf(next)] as HTMLElement | undefined)?.focus();
            }}
            tabIndex={active ? 0 : -1}
            className={cn("seg", h)}
          >
            <span aria-hidden className="seg-check">
              <Check className="size-4 shrink-0" strokeWidth={2.75} />
            </span>
            {o.icon}
            <span className="min-w-0 truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
