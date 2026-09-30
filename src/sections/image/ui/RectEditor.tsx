"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { clampRect, dragHandle, type Handle, type Rect } from "../engine/geometry";

const HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const NAMES: Record<Locale, Record<Handle, string> & { body: string; help: string }> = {
  ru: {
    nw: "Левый верхний угол",
    n: "Верхний край",
    ne: "Правый верхний угол",
    e: "Правый край",
    se: "Правый нижний угол",
    s: "Нижний край",
    sw: "Левый нижний угол",
    w: "Левый край",
    body: "Область",
    help: "Стрелки — переместить, Shift+стрелки — быстрее",
  },
  en: {
    nw: "Top-left corner",
    n: "Top edge",
    ne: "Top-right corner",
    e: "Right edge",
    se: "Bottom-right corner",
    s: "Bottom edge",
    sw: "Bottom-left corner",
    w: "Left edge",
    body: "Area",
    help: "Arrows move, Shift+arrows move faster",
  },
};

const POS: Record<Handle, string> = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
};

const keyDelta = (e: KeyboardEvent): [number, number] | null => {
  if (e.key === "ArrowLeft") return [-1, 0];
  if (e.key === "ArrowRight") return [1, 0];
  if (e.key === "ArrowUp") return [0, -1];
  if (e.key === "ArrowDown") return [0, 1];
  return null;
};

/**
 * Draggable, resizable rectangle over an image (coordinates in source px).
 * Every handle is a real button: focus it and use the arrow keys.
 */
export function RectEditor({
  rect,
  onChange,
  imgW,
  imgH,
  factor,
  aspect = null,
  shape = "rect",
  thirds = false,
  dim = true,
  locale,
  label,
  active = true,
  onActivate,
  tone = "white",
}: {
  rect: Rect;
  onChange: (r: Rect) => void;
  imgW: number;
  imgH: number;
  factor: number;
  aspect?: number | null;
  shape?: "rect" | "ellipse";
  thirds?: boolean;
  dim?: boolean;
  locale: Locale;
  label?: string;
  active?: boolean;
  onActivate?: () => void;
  tone?: "white" | "accent";
}) {
  const n = NAMES[locale];
  const drag = useRef<{ kind: "move" | Handle; x: number; y: number; start: Rect } | null>(null);
  const min = Math.max(4, 12 / factor);

  const begin = (kind: "move" | Handle, e: PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onActivate?.();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, x: e.clientX, y: e.clientY, start: rect };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / factor;
    const dy = (e.clientY - d.y) / factor;
    if (d.kind === "move") onChange(clampRect({ ...d.start, x: d.start.x + dx, y: d.start.y + dy }, imgW, imgH));
    else onChange(dragHandle(d.start, d.kind, dx, dy, imgW, imgH, aspect, min));
  };
  const end = () => {
    drag.current = null;
  };

  const step = (e: KeyboardEvent) => (e.shiftKey ? 20 : 2) / factor;
  const onKey = (kind: "move" | Handle, e: KeyboardEvent) => {
    const d = keyDelta(e);
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    const s = step(e);
    if (kind === "move") onChange(clampRect({ ...rect, x: rect.x + d[0] * s, y: rect.y + d[1] * s }, imgW, imgH));
    else onChange(dragHandle(rect, kind, d[0] * s, d[1] * s, imgW, imgH, aspect, min));
  };

  const style = { left: rect.x * factor, top: rect.y * factor, width: rect.w * factor, height: rect.h * factor };
  const round = shape === "ellipse" ? "rounded-[50%]" : "";
  const border = tone === "accent" ? "border-accent" : "border-white";
  return (
    <>
      {active && dim && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={cn("absolute shadow-[0_0_0_9999px_rgb(0_0_0/0.5)]", round)} style={style} />
        </div>
      )}
      <div className="absolute" style={style}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`${label ?? n.body}: ${Math.round(rect.w)}×${Math.round(rect.h)}. ${n.help}`}
          aria-pressed={active}
          onPointerDown={(e) => begin("move", e)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onKeyDown={(e) => onKey("move", e)}
          onFocus={onActivate}
          className={cn("absolute inset-0 cursor-move touch-none border-2 outline-offset-4", border, round, "shadow-[0_0_0_1px_rgb(0_0_0/0.4)]")}
        >
          {thirds && active && (
            <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", round)}>
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/50" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/50" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/50" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/50" />
            </div>
          )}
        </div>
        {active &&
          HANDLES.filter((h) => !aspect || h.length === 2).map((h) => (
            <button
              key={h}
              type="button"
              aria-label={`${n[h]}. ${n.help}`}
              onPointerDown={(e) => begin(h, e)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onKeyDown={(e) => onKey(h, e)}
              className={cn("absolute z-10 size-4 touch-none rounded-[3px] border border-black/40 bg-white", POS[h])}
            />
          ))}
      </div>
    </>
  );
}
