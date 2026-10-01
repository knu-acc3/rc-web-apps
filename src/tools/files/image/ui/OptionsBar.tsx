"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Fold } from "@/ui/fold";
import { Panel } from "@/ui/panel";

/**
 * The settings card of a photo tool: the main options stacked in one column, rarely used ones behind an inline
 * "More options". From `lg` it sits in the left column next to the result and stays in view (sticky).
 */
export function OptionsBar({ children, more, locale, className }: { children: ReactNode; more?: ReactNode; locale: Locale; className?: string }) {
  return (
    <Panel
      className={cn(
        "flex min-w-0 flex-col gap-5 p-4 sm:p-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain",
        className,
      )}
    >
      {children}
      {more && (
        <Fold variant="inline" title={locale === "ru" ? "Дополнительно" : "More options"} className="-mx-1 -mb-1" bodyClassName="flex flex-col gap-4 px-1 pb-1">
          {more}
        </Fold>
      )}
    </Panel>
  );
}

/**
 * Two columns from `lg`: settings on the left (sticky), the photo with its result on the right and `rest` (file list,
 * "add more") under it. On phones the result comes first, then the settings, then `rest`.
 */
export function ToolColumns({ side, children, rest, className }: { side?: ReactNode; children: ReactNode; rest?: ReactNode; className?: string }) {
  if (!side)
    return (
      <div className={cn("flex min-w-0 flex-col gap-4", className)}>
        {children}
        {rest}
      </div>
    );
  return (
    <div
      className={cn(
        "grid items-start gap-4 lg:grid-cols-[minmax(19rem,25rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-6 2xl:grid-cols-[27rem_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-1">{children}</div>
      <div className="min-w-0 self-stretch lg:col-start-1 lg:row-span-2 lg:row-start-1">{side}</div>
      {rest && <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-2">{rest}</div>}
    </div>
  );
}
