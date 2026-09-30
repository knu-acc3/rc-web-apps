"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { checker } from "./controls";
import { S } from "./strings";

const ZOOMS = [1, 1.5, 2, 3, 4];

/**
 * Shows a preview bitmap fitted to the available width/height (with zoom
 * steps) and renders an overlay on top. `children` receives the display
 * factor (CSS px per source px) of the full-resolution image.
 */
export function ImageStage({
  bitmap,
  srcWidth,
  locale,
  children,
  draw,
  className,
  maxHeightVh = 65,
  label,
}: {
  bitmap: ImageBitmap | null;
  /** Width of the full-resolution source (overlay coordinates are in source px). */
  srcWidth: number;
  locale: Locale;
  children?: (factor: number) => ReactNode;
  /** Custom drawing instead of the plain bitmap. */
  draw?: (ctx: CanvasRenderingContext2D, bitmap: ImageBitmap) => void;
  className?: string;
  maxHeightVh?: number;
  label?: string;
}) {
  const t = S(locale);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !bitmap) return;
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    if (draw) draw(ctx, bitmap);
    else ctx.drawImage(bitmap, 0, 0);
  }, [bitmap, draw]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth - 24, h: (window.innerHeight * maxHeightVh) / 100 });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [maxHeightVh]);

  const fitW = bitmap && box.w ? Math.min(box.w, bitmap.width * 4, (box.h * bitmap.width) / bitmap.height) : 0;
  const cssW = fitW * zoom;
  const cssH = bitmap ? (cssW * bitmap.height) / bitmap.width : 0;
  const factor = srcWidth && cssW ? cssW / srcWidth : 0;
  const zi = ZOOMS.indexOf(zoom);

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        ref={boxRef}
        className={cn("overflow-auto rounded-[10px] border border-line p-3", checker)}
        style={{ maxHeight: zoom > 1 ? `${maxHeightVh}vh` : undefined }}
      >
        <div className="relative mx-auto" style={{ width: cssW || undefined, height: cssH || undefined }}>
          <canvas ref={canvasRef} role="img" aria-label={label ?? t.preview} className="block size-full" />
          {bitmap && factor > 0 && <div className="absolute inset-0">{children?.(factor)}</div>}
        </div>
      </div>
      {bitmap && (
        <div className="mt-2 flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.zoomOut}
            title={t.zoomOut}
            disabled={zi <= 0}
            onClick={() => setZoom(ZOOMS[Math.max(0, zi - 1)])}
          >
            <ZoomOut aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.zoomIn}
            title={t.zoomIn}
            disabled={zi >= ZOOMS.length - 1}
            onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, zi + 1)])}
          >
            <ZoomIn aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
