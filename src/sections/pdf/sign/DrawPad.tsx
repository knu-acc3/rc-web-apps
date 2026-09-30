"use client";

import { Eraser } from "lucide-react";
import { useEffect, useRef, type PointerEvent } from "react";
import { Button } from "@/ui/button";

/** Freehand signature pad (mouse, pen or finger). Reports the canvas after every stroke. */
export function DrawPad({ color, label, clearLabel, onStroke, onClear }: { color: string; label: string; clearLabel: string; onStroke: (c: HTMLCanvasElement) => void; onClear: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const pts = useRef<[number, number][]>([]);

  // Match the canvas' pixel size to its CSS size once mounted.
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.round(c.clientWidth * dpr);
    c.height = Math.round(c.clientHeight * dpr);
  }, []);

  const pos = (e: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height];
  };

  const ctx = () => {
    const c = ref.current!;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    const dpr = c.width / Math.max(1, c.clientWidth);
    g.lineWidth = 2.6 * dpr;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = color;
    g.fillStyle = color;
    return g;
  };

  return (
    <div className="relative">
      <canvas
        ref={ref}
        aria-label={label}
        role="img"
        className="block h-44 w-full cursor-crosshair touch-none rounded-[12px] border-2 border-dashed border-line-strong bg-white"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const p = pos(e);
          pts.current = [p];
          const g = ctx();
          g.beginPath();
          g.arc(p[0], p[1], g.lineWidth / 2, 0, Math.PI * 2);
          g.fill();
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = pos(e);
          const list = pts.current;
          list.push(p);
          if (list.length < 3) return;
          // Quadratic smoothing through midpoints.
          const [a, b, c] = list.slice(-3);
          const g = ctx();
          g.beginPath();
          g.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
          g.quadraticCurveTo(b[0], b[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2);
          g.stroke();
        }}
        onPointerUp={() => {
          if (!drawing.current) return;
          drawing.current = false;
          if (ref.current) onStroke(ref.current);
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
      />
      <span className="pointer-events-none absolute right-6 bottom-8 left-6 border-b border-neutral-300" aria-hidden />
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 text-neutral-600! hover:bg-neutral-100! hover:text-neutral-900!"
        onClick={() => {
          const c = ref.current;
          if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
          onClear();
        }}
      >
        <Eraser aria-hidden />
        {clearLabel}
      </Button>
    </div>
  );
}
