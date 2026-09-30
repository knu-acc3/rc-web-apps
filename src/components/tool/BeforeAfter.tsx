import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export interface BeforeAfterProps {
  before: ReactNode;
  after: ReactNode;
  labelBefore: string;
  labelAfter: string;
  className?: string;
}

/**
 * Responsive comparison surface. It stays side-by-side when space allows and
 * stacks on small screens so neither preview is squeezed or clipped.
 */
export function BeforeAfter({
  before,
  after,
  labelBefore,
  labelAfter,
  className,
}: BeforeAfterProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] md:grid-cols-2",
        className,
      )}
    >
      <section
        aria-label={labelBefore}
        className="min-w-0 border-b border-[var(--color-border)] md:border-b-0 md:border-r"
      >
        <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
          {labelBefore}
        </h3>
        <div className="min-w-0">{before}</div>
      </section>
      <section aria-label={labelAfter} className="min-w-0">
        <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
          {labelAfter}
        </h3>
        <div className="min-w-0">{after}</div>
      </section>
    </div>
  );
}
