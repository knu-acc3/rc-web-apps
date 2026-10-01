"use client";

import { Check, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { Thumbnailer } from "../lib/pdfjs";
import { S } from "./strings";
import { Thumb } from "./Thumb";

export interface GridPage {
  /** Stable key (survives reordering). */
  key: string;
  /** Id of the source file. */
  file: string;
  /** 0-based page index in the source file. */
  index: number;
  /** Extra clockwise rotation, degrees. */
  rotate: number;
}

interface Props {
  locale: Locale;
  pages: readonly GridPage[];
  thumbsOf?: (fileId: string) => Thumbnailer | null;
  /** Custom thumbnail (e.g. an image preview) instead of a rendered PDF page. */
  renderThumb?: (p: GridPage) => ReactNode;
  label: (p: GridPage, position: number) => string;
  /** Accessible name of a page. */
  describe?: (p: GridPage, position: number) => string;
  selected?: ReadonlySet<string>;
  /** "delete" shows selected pages as marked for removal. */
  mark?: "select" | "delete";
  onToggle?: (key: string, extendRange: boolean) => void;
  onMove?: (from: number, to: number) => void;
  onRotate?: (key: string, delta: number) => void;
  onDelete?: (key: string) => void;
  /** One quiet row of actions above the grid. */
  toolbar?: ReactNode;
}

/**
 * Page thumbnails: click to select (Shift+click for a range), drag to reorder.
 * Keyboard: arrows move focus, Space selects, Alt+arrows move the page,
 * R rotates, Delete removes. Thumbnails render lazily while scrolling.
 */
export function PageGrid({ locale, pages, thumbsOf, renderThumb, label, describe, selected, mark = "select", onToggle, onMove, onRotate, onDelete, toolbar }: Props) {
  const t = S[locale];
  const helpId = useId();
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const focusKey = useRef<string | null>(null);
  const dragFrom = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  // Keep keyboard focus on a page after it moved.
  useEffect(() => {
    if (focusKey.current) {
      refs.current.get(focusKey.current)?.focus();
      focusKey.current = null;
    }
  });

  const focusAt = (i: number) => {
    const p = pages[Math.max(0, Math.min(pages.length - 1, i))];
    if (p) refs.current.get(p.key)?.focus();
  };

  const columns = () => {
    const els = pages.map((p) => refs.current.get(p.key)).filter(Boolean) as HTMLElement[];
    if (!els.length) return 1;
    const top = els[0].offsetTop;
    const n = els.findIndex((e) => e.offsetTop !== top);
    return n === -1 ? els.length : n;
  };

  const move = (p: GridPage, from: number, to: number) => {
    if (!onMove || to < 0 || to >= pages.length || to === from) return;
    focusKey.current = p.key;
    onMove(from, to);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, p: GridPage, i: number) => {
    const mod = e.altKey || e.ctrlKey || e.metaKey;
    const horiz = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    const vert = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (horiz || vert) {
      e.preventDefault();
      const step = horiz || vert * columns();
      if (mod) move(p, i, Math.max(0, Math.min(pages.length - 1, i + step)));
      else focusAt(i + step);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      focusAt(e.key === "Home" ? 0 : pages.length - 1);
    } else if (onRotate && !mod && (e.key === "r" || e.key === "R" || e.key === "к" || e.key === "К")) {
      e.preventDefault();
      onRotate(p.key, e.shiftKey ? -90 : 90);
    } else if (onDelete && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      focusAt(i + 1 < pages.length ? i + 1 : i - 1);
      onDelete(p.key);
    }
  };

  const interactive = !!(onMove || onRotate || onDelete || onToggle);

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      {interactive && <p className="text-sm text-fg-3">{onMove ? t.gridTip : mark === "delete" ? t.gridTipDelete : t.gridTipSelect}</p>}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]" aria-describedby={interactive ? helpId : undefined}>
        {pages.map((p, i) => {
          const isSel = selected?.has(p.key) ?? false;
          const del = isSel && mark === "delete";
          const name = describe?.(p, i) ?? `${t.page} ${label(p, i)}`;
          return (
            <li
              key={p.key}
              draggable={!!onMove}
              onDragStart={(e) => {
                dragFrom.current = i;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(i));
              }}
              onDragOver={(e) => {
                if (dragFrom.current === null) return;
                e.preventDefault();
                if (over !== i) setOver(i);
              }}
              onDragLeave={() => setOver((o) => (o === i ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const from = dragFrom.current;
                dragFrom.current = null;
                setOver(null);
                if (from !== null && from !== i) onMove?.(from, i);
              }}
              onDragEnd={() => {
                dragFrom.current = null;
                setOver(null);
              }}
              className={cn("min-w-0", onMove && "cursor-grab active:cursor-grabbing")}
            >
              <button
                type="button"
                ref={(el) => {
                  if (el) refs.current.set(p.key, el);
                  else refs.current.delete(p.key);
                }}
                aria-label={name}
                aria-pressed={onToggle ? isSel : undefined}
                onClick={(e) => onToggle?.(p.key, e.shiftKey)}
                onKeyDown={(e) => onKey(e, p, i)}
                className={cn(
                  "group relative block w-full rounded-[0.875rem] border-2 p-1.5 transition-[border-color,background-color,transform] duration-150 motion-safe:active:scale-[0.97]",
                  over === i ? "border-accent bg-accent-soft" : del ? "border-err/60 bg-err-soft/40" : isSel ? "border-accent bg-accent-soft/60" : "border-transparent hover:bg-surface-2",
                  !onToggle && "cursor-default",
                )}
              >
                {renderThumb ? renderThumb(p) : <Thumb thumbs={thumbsOf?.(p.file) ?? null} index={p.index} rotate={p.rotate} dim={del} />}
                {del && (
                  <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                    <span className="flex size-9 items-center justify-center rounded-full bg-err text-white">
                      <Trash2 className="size-4" />
                    </span>
                  </span>
                )}
                {isSel && !del && (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-accent text-accent-fg" aria-hidden>
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
                <span className={cn("tabular mt-1 block truncate text-center text-xs text-fg-3", isSel && "font-semibold text-fg", del && "line-through")}>{label(p, i)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {interactive && (
        <p id={helpId} className="sr-only">
          {onMove ? (onRotate ? t.gridHelp : t.gridHelpMove) : mark === "delete" ? t.gridHelpDelete : t.gridHelpSelect}
        </p>
      )}
    </div>
  );
}
