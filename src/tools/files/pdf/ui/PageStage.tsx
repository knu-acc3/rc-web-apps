"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { PageView } from "./PageView";

/** Box in page fractions (0–1, origin top-left); height follows the signature's aspect ratio. */
export interface Box {
  x: number;
  y: number;
  w: number;
}

/**
 * One page (with its /Rotate) as wide as the container on phones, fitted into the
 * window on desktop (≤ 760 px wide), rendered at a
 * phone-friendly resolution with a retry state; `children` are overlaid at the
 * page's exact CSS size.
 */
export function PageStage({ locale, doc, index, label, children }: { locale: Locale; doc: PDFDocumentProxy; index: number; label: string; children?: (size: { width: number; height: number }) => ReactNode }) {
  return (
    <PageView locale={locale} doc={doc} index={index} label={label} fit="stage" maxCssWidth={760}>
      {children}
    </PageView>
  );
}

/** Draggable, resizable (aspect-locked) signature box. Keyboard: arrows move, +/− resize. */
export function DraggableBox({
  box,
  aspect,
  stage,
  url,
  label,
  onChange,
}: {
  box: Box;
  /** Signature width / height. */
  aspect: number;
  stage: { width: number; height: number };
  url: string;
  label: string;
  onChange: (b: Box) => void;
}) {
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; start: Box } | null>(null);
  const hFrac = (w: number) => (w * stage.width) / aspect / stage.height;
  const clamp = (b: Box): Box => {
    const w = Math.min(1, Math.max(0.04, b.w));
    const h = hFrac(w);
    return { w, x: Math.min(1 - w, Math.max(0, b.x)), y: Math.min(Math.max(0, 1 - h), Math.max(0, b.y)) };
  };

  const down = (mode: "move" | "resize", e: PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, sx: e.clientX, sy: e.clientY, start: box };
  };
  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / stage.width;
    const dy = (e.clientY - d.sy) / stage.height;
    onChange(clamp(d.mode === "move" ? { ...d.start, x: d.start.x + dx, y: d.start.y + dy } : { ...d.start, w: d.start.w + dx }));
  };
  const up = () => {
    drag.current = null;
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const map: Record<string, Partial<Box>> = {
      ArrowLeft: { x: box.x - step },
      ArrowRight: { x: box.x + step },
      ArrowUp: { y: box.y - step },
      ArrowDown: { y: box.y + step },
      "+": { w: box.w * 1.1 },
      "=": { w: box.w * 1.1 },
      "-": { w: box.w / 1.1 },
    };
    const patch = map[e.key];
    if (!patch) return;
    e.preventDefault();
    onChange(clamp({ ...box, ...patch }));
  };

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={label}
      onKeyDown={key}
      onPointerDown={(e) => down("move", e)}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="absolute cursor-move touch-none rounded-[0.25rem] outline-2 outline-offset-2 outline-accent outline-dashed focus-visible:outline-solid"
      style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${hFrac(box.w) * 100}%` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob of the signature */}
      <img src={url} alt="" draggable={false} className="pointer-events-none h-full w-full select-none" />
      <span
        onPointerDown={(e) => down("resize", e)}
        onPointerMove={move}
        onPointerUp={up}
        className="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-full border-2 border-white bg-accent shadow-elev-1 pointer-coarse:-right-3.5 pointer-coarse:-bottom-3.5 pointer-coarse:size-7"
        aria-hidden
      />
    </div>
  );
}
