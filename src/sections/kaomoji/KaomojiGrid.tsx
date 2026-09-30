"use client";

import type { MouseEventHandler } from "react";
import { cn } from "@/lib/cn";

/** Long scenes get two columns so they stay on one or two lines. */
const isLong = (k: string) => Array.from(k).length > 14;

/**
 * Grid of kaomoji tiles. One shared click handler reads the kaomoji from `data-k`, so hundreds
 * of tiles don't each allocate a closure. Native buttons: Enter/Space work out of the box.
 */
export function KaomojiGrid({
  items,
  copied,
  onPick,
  copyLabel,
  size = "md",
}: {
  items: readonly string[];
  copied: string | null;
  onPick: MouseEventHandler<HTMLButtonElement>;
  copyLabel: string;
  size?: "sm" | "md";
}) {
  return (
    <ul
      className={cn(
        "grid gap-2",
        size === "md" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-[repeat(auto-fill,minmax(112px,1fr))]",
      )}
    >
      {items.map((k) => (
        <li key={k} className={cn(size === "md" && isLong(k) && "col-span-2")}>
          <button
            type="button"
            data-k={k}
            onClick={onPick}
            aria-label={`${copyLabel} ${k}`}
            className={cn(
              "flex h-full w-full items-center justify-center rounded-[10px] border px-2 text-center leading-snug [overflow-wrap:anywhere] transition-colors duration-150",
              size === "md" ? "min-h-16 py-3 text-lg" : "min-h-10 py-1.5 text-[15px]",
              k === copied ? "border-ok bg-ok-soft text-ok" : "border-line bg-surface text-fg hover:border-accent hover:text-accent",
            )}
          >
            {k}
          </button>
        </li>
      ))}
    </ul>
  );
}
