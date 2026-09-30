"use client";

import { ChevronLeft, ChevronRight, Copy, RotateCcw, RotateCw, Trash2, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { Thumbnailer } from "../engine/pdfjs";
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
  /** Marked for deletion (shown faded). */
  deleted?: boolean;
}

interface Props {
  locale: Locale;
  pages: readonly GridPage[];
  thumbsOf: (fileId: string) => Thumbnailer | null;
  label: (p: GridPage, position: number) => string;
  /** Accessible name of a page, e.g. "Страница 3 файла report.pdf". */
  describe?: (p: GridPage, position: number) => string;
  selected?: ReadonlySet<string>;
  onToggle?: (key: string, extendRange: boolean) => void;
  onMove?: (from: number, to: number) => void;
  onRotate?: (key: string, delta: number) => void;
  /** Toggle deletion (or remove the page). */
  onDelete?: (key: string) => void;
  onDuplicate?: (key: string) => void;
  /** Show both rotate buttons (rotate tool) instead of clockwise only. */
  bothRotations?: boolean;
  toolbar?: ReactNode;
}

const iconBtn =
  "inline-flex size-7 items-center justify-center rounded-[6px] text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-40 [&_svg]:size-4";

/**
 * Thumbnail grid with selection, drag & drop and keyboard reordering.
 * Thumbnails render lazily as they scroll into view.
 */
export function PageGrid({ locale, pages, thumbsOf, label, describe, selected, onToggle, onMove, onRotate, onDelete, onDuplicate, bothRotations, toolbar }: Props) {
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

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, p: GridPage, i: number) => {
    const mod = e.altKey || e.ctrlKey || e.metaKey;
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && mod && onMove) {
      e.preventDefault();
      const to = i + (e.key === "ArrowLeft" ? -1 : 1);
      if (to >= 0 && to < pages.length) {
        focusKey.current = p.key;
        onMove(i, to);
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(i + (e.key === "ArrowLeft" ? -1 : 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const c = columns();
      if (mod && onMove) {
        const to = Math.max(0, Math.min(pages.length - 1, i + (e.key === "ArrowUp" ? -c : c)));
        if (to !== i) {
          focusKey.current = p.key;
          onMove(i, to);
        }
      } else focusAt(i + (e.key === "ArrowUp" ? -c : c));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      focusAt(e.key === "Home" ? 0 : pages.length - 1);
    } else if ((e.key === "r" || e.key === "R" || e.key === "к" || e.key === "К") && onRotate && !mod) {
      e.preventDefault();
      onRotate(p.key, e.shiftKey ? -90 : 90);
    } else if ((e.key === "Delete" || e.key === "Backspace") && onDelete) {
      e.preventDefault();
      if (!p.deleted) focusAt(i + 1 < pages.length ? i + 1 : i - 1);
      onDelete(p.key);
    }
  };

  return (
    <div>
      {toolbar}
      {(onMove || onRotate || onDelete) && (
        <p id={helpId} className="mb-3 text-sm text-fg-3">
          {t.gridHelp}
        </p>
      )}
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {pages.map((p, i) => {
          const isSel = selected?.has(p.key) ?? false;
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
              className={cn(
                "flex min-w-0 flex-col rounded-[10px] border bg-surface p-1.5 transition-colors",
                isSel ? "border-accent ring-2 ring-accent/30" : "border-line",
                over === i && "border-accent bg-accent-soft",
                onMove && "cursor-grab active:cursor-grabbing",
              )}
            >
              <button
                type="button"
                ref={(el) => {
                  if (el) refs.current.set(p.key, el);
                  else refs.current.delete(p.key);
                }}
                aria-label={name}
                aria-pressed={onToggle ? isSel : undefined}
                aria-describedby={onMove || onRotate || onDelete ? helpId : undefined}
                aria-keyshortcuts={onMove ? "Alt+ArrowLeft Alt+ArrowRight" : undefined}
                onClick={(e) => onToggle?.(p.key, e.shiftKey)}
                onKeyDown={(e) => onKey(e, p, i)}
                className={cn("relative block w-full rounded-[8px]", !onToggle && "cursor-default")}
              >
                <Thumb thumbs={thumbsOf(p.file)} index={p.index} rotate={p.rotate} dim={p.deleted} />
                {p.deleted && (
                  <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                    <Trash2 className="size-7 text-err" />
                  </span>
                )}
                {onToggle && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full border-2 text-[11px] font-bold",
                      isSel ? "border-accent bg-accent text-accent-fg" : "border-line-strong bg-surface/90",
                    )}
                  >
                    {isSel ? "✓" : ""}
                  </span>
                )}
              </button>
              <div className="mt-1 flex min-h-7 flex-wrap items-center justify-between gap-x-1">
                <span className={cn("tabular truncate px-1 text-xs font-medium text-fg-2", p.deleted && "line-through")}>{label(p, i)}</span>
                <span className="flex flex-wrap items-center justify-end">
                  {onMove && (
                    <button type="button" tabIndex={-1} className={iconBtn} aria-label={`${t.moveLeft}: ${name}`} title={t.moveLeft} disabled={i === 0} onClick={() => onMove(i, i - 1)}>
                      <ChevronLeft />
                    </button>
                  )}
                  {onRotate && bothRotations && (
                    <button type="button" tabIndex={-1} className={iconBtn} aria-label={`${t.rotateLeft}: ${name}`} title={t.rotateLeft} onClick={() => onRotate(p.key, -90)}>
                      <RotateCcw />
                    </button>
                  )}
                  {onRotate && (
                    <button type="button" tabIndex={-1} className={iconBtn} aria-label={`${t.rotateRight}: ${name}`} title={t.rotateRight} onClick={() => onRotate(p.key, 90)}>
                      <RotateCw />
                    </button>
                  )}
                  {onDuplicate && (
                    <button type="button" tabIndex={-1} className={iconBtn} aria-label={`${t.duplicatePage}: ${name}`} title={t.duplicatePage} onClick={() => onDuplicate(p.key)}>
                      <Copy />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      tabIndex={-1}
                      className={cn(iconBtn, !p.deleted && "hover:text-err")}
                      aria-label={`${p.deleted ? t.restorePage : t.deletePage}: ${name}`}
                      title={p.deleted ? t.restorePage : t.deletePage}
                      onClick={() => onDelete(p.key)}
                    >
                      {p.deleted ? <Undo2 /> : <Trash2 />}
                    </button>
                  )}
                  {onMove && (
                    <button type="button" tabIndex={-1} className={iconBtn} aria-label={`${t.moveRight}: ${name}`} title={t.moveRight} disabled={i === pages.length - 1} onClick={() => onMove(i, i + 1)}>
                      <ChevronRight />
                    </button>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Move an item in an array (returns a new array). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
