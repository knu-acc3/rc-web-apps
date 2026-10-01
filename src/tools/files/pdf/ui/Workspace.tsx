"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Panel } from "@/ui/panel";

/**
 * Layout of a PDF tool once a file is open.
 * Phones: file → preview and controls (order by `previewFirst`) → action → result, one column.
 * From `lg`: with a preview — the preview on the left (sticky, as tall as the
 * screen), file, controls, action and result in a side column; without one —
 * file and controls on the left, action and result in a sticky column on the right.
 * `stickyAction` keeps the action at the bottom of the screen on phones (long page
 * grids); pass it a card with a background then.
 */
export function Workspace({
  files,
  preview,
  controls,
  action,
  result,
  previewFirst = true,
  stickyAction = false,
}: {
  files: ReactNode;
  preview?: ReactNode;
  controls?: ReactNode;
  action: ReactNode;
  result?: ReactNode;
  /** On phones: the preview above the controls (default) or below them. */
  previewFirst?: boolean;
  stickyAction?: boolean;
}) {
  const sticky = stickyAction && "max-lg:sticky max-lg:bottom-2 max-lg:z-20";
  if (!preview) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)]">
        <div className="flex min-w-0 flex-col gap-4">
          {files}
          {controls}
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
          <div className={cn("flex min-w-0 flex-col gap-3", sticky)}>{action}</div>
          {result}
        </div>
      </div>
    );
  }
  const previewBox = <div className="min-w-0 lg:sticky lg:top-20 lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:self-start">{preview}</div>;
  const controlsBox = controls ? <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-2">{controls}</div> : null;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,27rem)] lg:grid-rows-[auto_auto_auto_1fr] lg:gap-x-6 2xl:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]">
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">{files}</div>
      {previewFirst ? previewBox : controlsBox}
      {previewFirst ? controlsBox : previewBox}
      <div className={cn("flex min-w-0 flex-col gap-3 lg:col-start-2 lg:row-start-3", sticky)}>{action}</div>
      {result && <div className="min-w-0 lg:col-start-2 lg:row-start-4">{result}</div>}
    </div>
  );
}

/** Settings card of a tool: one card, groups separated by spacing (no nested borders). */
export function Controls({ children, className }: { children: ReactNode; className?: string }) {
  return <Panel className={cn("flex min-w-0 flex-col gap-5 p-4 sm:p-5", className)}>{children}</Panel>;
}

/** A short line with the main fact before the action ("8 страниц → 4 листа"). */
export function Summary({ children, size = "lg", quiet = false }: { children: ReactNode; size?: "md" | "lg" | "xl"; quiet?: boolean }) {
  return (
    <p className={cn("tabular", size === "md" ? "text-base sm:text-lg" : size === "xl" ? "text-2xl" : "text-lg", quiet ? "font-medium text-fg-2" : "font-semibold text-fg")} aria-live="polite">
      {children}
    </p>
  );
}
