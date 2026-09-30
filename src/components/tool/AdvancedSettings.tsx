"use client";

import type { ReactNode } from "react";
import { CaretDown, SlidersHorizontal } from "@phosphor-icons/react";
import { cn } from "@/src/lib/cn";

export interface AdvancedSettingsProps {
  children: ReactNode;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Keeps the primary workflow calm while preserving power-user controls.
 * Native <details> provides keyboard support and works before hydration.
 */
export function AdvancedSettings({
  children,
  title,
  description,
  defaultOpen = false,
  className,
  contentClassName,
}: AdvancedSettingsProps) {
  return (
    <details
      open={defaultOpen || undefined}
      className={cn(
        "group overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-3.5 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary-ring)] sm:px-4 [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal
          size={18}
          className="shrink-0 text-[var(--color-text-muted)]"
        />
        <span className="min-w-0 flex-1">
          <span className="block">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs font-normal leading-snug text-[var(--color-text-muted)]">
              {description}
            </span>
          ) : null}
        </span>
        <CaretDown
          size={18}
          className="shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div
        className={cn(
          "border-t border-[var(--color-border-subtle)] px-3.5 py-4 sm:px-4",
          contentClassName,
        )}
      >
        {children}
      </div>
    </details>
  );
}
