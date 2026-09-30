"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/** Box in page fractions (0–1, origin top-left); height follows the signature's aspect ratio. */
export interface Box {
  x: number;
  y: number;
  w: number;
}

/** Renders one page (with its /Rotate) to fit the container width; children are overlaid. */
export function PageStage({ doc, index, label, children }: { doc: PDFDocumentProxy; index: number; label: string; children?: (size: { width: number; height: number }) => ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ key: string; width: number; height: number } | null>(null);
  const key = `${index}`;

  useEffect(() => {
    let live = true;
    (async () => {
      const m = await import("../engine/pdfjs");
      const page = await doc.getPage(index + 1);
      const target = canvasRef.current;
      if (!live || !target) return;
      const vp = page.getViewport({ scale: 1 });
      const box = Math.min(720, target.parentElement?.clientWidth || 600);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const c = await m.renderPage(page, (box * dpr) / vp.width);
      if (live) {
        target.width = c.width;
        target.height = c.height;
        target.getContext("2d")?.drawImage(c, 0, 0);
        setSize({ key, width: box, height: (box * vp.height) / vp.width });
      }
      m.releaseCanvas(c);
      page.cleanup();
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [doc, index, key]);

  const shown = size && size.key === key ? size : null;
  return (
    <div className="relative mx-auto w-full max-w-[45rem]">
      <canvas ref={canvasRef} role="img" aria-label={label} className="block w-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.15)]" style={shown ? { height: shown.height } : { aspectRatio: "1 / 1.414" }} />
      {shown && <div className="absolute inset-0">{children?.(shown)}</div>}
    </div>
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
        className="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-full border-2 border-surface bg-accent"
        aria-hidden
      />
    </div>
  );
}
