import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Replace narrow/non-breaking spaces from Intl with normal spaces for inputs and copy. */
export const plainSpaces = (s: string) => s.replace(/[  ]/g, " ");

export interface Tile {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

/** The focal result: a row of large values. Put aria-live on the wrapper that owns the result. */
export function ResultTiles({ items, className }: { items: Tile[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {items.map((t) => (
        <div key={t.label} className="min-w-0 rounded-[0.625rem] bg-surface-2 px-3 py-2.5">
          <dt className="truncate text-[0.8125rem] text-fg-2">{t.label}</dt>
          <dd className="tabular mt-0.5 truncate text-2xl font-semibold tracking-tight text-fg sm:text-[1.75rem]">{t.value}</dd>
          {t.hint && <dd className="truncate text-[0.8125rem] text-fg-3">{t.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Secondary data under a tool: small, quiet key–value pairs. */
export function QuietFacts({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-1.5 px-1 text-sm min-[420px]:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 items-baseline justify-between gap-3 border-b border-line py-1.5 lg:block lg:border-0 lg:py-0">
          <dt className="text-fg-3">{it.label}</dt>
          <dd className="tabular font-medium text-fg">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
