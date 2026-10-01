"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Dropzone } from "@/ui/dropzone";
import { IMAGE_ACCEPT } from "../lib/detect";
import { checker } from "./controls";

const T = {
  ru: {
    help: "Перетащите, чтобы изменить порядок; с клавиатуры: Ctrl+← / Ctrl+→ — переместить, Delete — убрать",
    item: (i: number, name: string) => `${i}. ${name}`,
    add: "Добавить",
  },
  en: {
    help: "Drag to reorder; keyboard: Ctrl+← / Ctrl+→ move, Delete removes",
    item: (i: number, name: string) => `${i}. ${name}`,
    add: "Add",
  },
} as const;

interface StripItem {
  key: string;
  name: string;
  bitmap: ImageBitmap | null;
}

function Thumb({ bitmap }: { bitmap: ImageBitmap | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !bitmap) return;
    const k = Math.min(1, 160 / Math.max(bitmap.width, bitmap.height));
    c.width = Math.max(1, Math.round(bitmap.width * k));
    c.height = Math.max(1, Math.round(bitmap.height * k));
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, c.width, c.height);
  }, [bitmap]);
  return <canvas ref={ref} aria-hidden className="max-h-full max-w-full object-contain" />;
}

/**
 * Horizontal list of image thumbnails that can be reordered by drag & drop
 * or with Ctrl+arrows, and removed with Delete — no per-item buttons.
 */
export function FrameStrip({
  items,
  onMove,
  onRemove,
  onAdd,
  locale,
  label,
  selected,
  onSelect,
}: {
  items: StripItem[];
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onAdd: (files: File[]) => void;
  locale: Locale;
  label: string;
  selected?: number;
  onSelect?: (i: number) => void;
}) {
  const t = T[locale];
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const focusLater = (i: number) => requestAnimationFrame(() => refs.current[i]?.focus());
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.8125rem] text-fg-3">{t.help}</p>
      <ul aria-label={label} className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {items.map((it, i) => (
          <li
            key={it.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            tabIndex={0}
            aria-label={t.item(i + 1, it.name)}
            aria-current={selected === i ? "true" : undefined}
            draggable
            onDragStart={() => setDragFrom(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null && dragFrom !== i) onMove(dragFrom, i);
              setDragFrom(null);
            }}
            onClick={() => onSelect?.(i)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey || e.altKey) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                e.preventDefault();
                const to = Math.max(0, Math.min(items.length - 1, i + (e.key === "ArrowLeft" ? -1 : 1)));
                if (to !== i) {
                  onMove(i, to);
                  focusLater(to);
                }
              } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                focusLater(Math.max(0, Math.min(items.length - 1, i + (e.key === "ArrowLeft" ? -1 : 1))));
              } else if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                onRemove(i);
                focusLater(Math.max(0, i - 1));
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(i);
              }
            }}
            className={cn(
              "relative flex size-20 shrink-0 cursor-grab items-center justify-center overflow-hidden rounded-[0.5rem] border",
              checker,
              selected === i ? "border-accent ring-2 ring-accent/30" : "border-line",
              dragFrom === i && "opacity-50",
            )}
          >
            <Thumb bitmap={it.bitmap} />
            <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[0.6875rem] font-semibold text-white">{i + 1}</span>
          </li>
        ))}
        <li className="shrink-0">
          <Dropzone
            onFiles={onAdd}
            accept={IMAGE_ACCEPT}
            multiple
            compact
            title={t.add}
            className="size-20! min-h-0! gap-1! p-1! text-xs [&>span:first-child]:size-7"
          />
        </li>
      </ul>
    </div>
  );
}
