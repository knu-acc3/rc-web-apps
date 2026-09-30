"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs of local files */
import { ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Segmented } from "@/ui/segmented";
import { checker } from "./controls";
import { S } from "./strings";

/**
 * Before/after comparison: drag anywhere or use the keyboard (←/→, Home/End)
 * on the divider. "100 %" shows real pixels in a scrollable box.
 */
export function CompareSlider({
  before,
  after,
  locale,
  beforeLabel,
  afterLabel,
  className,
  mode: fixedMode,
}: {
  before: string;
  after: string;
  locale: Locale;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  mode?: "slider" | "side";
}) {
  const t = S(locale);
  const [pos, setPos] = useState(50);
  const [zoom, setZoom] = useState<"fit" | "actual">("fit");
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromEvent = (clientX: number) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  const side = fixedMode === "side";
  const inner = zoom === "actual" && nat ? { width: nat.w, height: nat.h } : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-fg-3">{t.dragHint}</span>
        <Segmented
          wrap
          size="sm"
          label={t.zoom}
          value={zoom}
          onChange={setZoom}
          options={[
            { value: "fit", label: <ZoomOut className="size-4" aria-label={t.fit} />, title: t.fit },
            { value: "actual", label: <ZoomIn className="size-4" aria-label={t.actual} />, title: t.actual },
          ]}
        />
      </div>
      <div className={cn("overflow-auto rounded-[10px] border border-line", checker, zoom === "fit" && "max-h-[70vh]")}>
        {side ? (
          <div className="grid grid-cols-2 gap-1">
            <img src={before} alt={beforeLabel ?? t.before} className={cn("block h-auto", zoom === "fit" ? "w-full" : "max-w-none")} />
            <img src={after} alt={afterLabel ?? t.after} className={cn("block h-auto", zoom === "fit" ? "w-full" : "max-w-none")} />
          </div>
        ) : (
          <div
            ref={box}
            className="relative mx-auto touch-none select-none"
            style={inner ?? { width: "100%", aspectRatio: nat ? `${nat.w} / ${nat.h}` : undefined }}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              fromEvent(e.clientX);
            }}
            onPointerMove={(e) => dragging.current && fromEvent(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            <img
              src={after}
              alt={afterLabel ?? t.after}
              draggable={false}
              onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className={cn("block size-full object-contain", !nat && "relative h-auto")}
            />
            <img
              src={before}
              alt={beforeLabel ?? t.before}
              draggable={false}
              className="absolute inset-0 size-full object-contain"
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.35)]"
              style={{ left: `${pos}%` }}
            />
            <div
              role="slider"
              tabIndex={0}
              aria-label={`${beforeLabel ?? t.before} / ${afterLabel ?? t.after}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos)}
              aria-valuetext={`${Math.round(pos)} %`}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 2;
                if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPos((p) => Math.max(0, p - step));
                else if (e.key === "ArrowRight" || e.key === "ArrowUp") setPos((p) => Math.min(100, p + step));
                else if (e.key === "Home") setPos(0);
                else if (e.key === "End") setPos(100);
                else return;
                e.preventDefault();
              }}
              className="absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-fg shadow-[var(--shadow-overlay)]"
              style={{ left: `${pos}%` }}
            >
              <span aria-hidden className="text-xs">
                ◀▶
              </span>
            </div>
            <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-xs text-white">{beforeLabel ?? t.before}</span>
            <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-xs text-white">{afterLabel ?? t.after}</span>
          </div>
        )}
      </div>
    </div>
  );
}
