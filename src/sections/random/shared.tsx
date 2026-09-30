"use client";

import { History, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Panel, PanelHeader } from "@/ui/panel";

/** Recent results, newest first. */
export function HistoryPanel({
  title,
  items,
  onClear,
  clearLabel,
  emptyLabel,
  className,
  render,
}: {
  title: string;
  items: readonly { id: number; text: ReactNode }[];
  onClear: () => void;
  clearLabel: string;
  emptyLabel: string;
  className?: string;
  render?: "list" | "inline";
}) {
  return (
    <Panel className={className}>
      <PanelHeader
        title={
          <span className="inline-flex items-center gap-2">
            <History className="size-4 text-fg-3" aria-hidden />
            {title}
          </span>
        }
        actions={
          items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 aria-hidden />
              {clearLabel}
            </Button>
          )
        }
      />
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-fg-3">{emptyLabel}</p>
      ) : render === "inline" ? (
        <ol className="flex flex-wrap gap-1.5 px-4 py-3">
          {items.map((it) => (
            <li key={it.id} className="tabular rounded-[6px] bg-surface-2 px-2 py-0.5 text-sm text-fg-2">
              {it.text}
            </li>
          ))}
        </ol>
      ) : (
        <ol className="max-h-72 overflow-y-auto scrollbar-thin">
          {items.map((it, i) => (
            <li key={it.id} className={cn("flex items-baseline gap-3 border-b border-line px-4 py-2 text-[15px] last:border-b-0", i === 0 && "font-semibold")}>
              <span className="tabular w-8 shrink-0 text-right text-[13px] font-normal text-fg-3">{items.length - i}.</span>
              <span className="min-w-0 break-words text-fg">{it.text}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/** Push to a newest-first list with a size cap. */
export function pushHistory<T>(list: readonly T[], item: T, max = 50): T[] {
  return [item, ...list].slice(0, max);
}

/** Split a textarea into trimmed, non-empty lines. */
export function parseLines(text: string, max = 500): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}
