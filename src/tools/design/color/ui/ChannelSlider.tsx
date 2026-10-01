"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { CHECKER_STYLE } from "./ColorField";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Shared keyboard handling for slider-like controls. Returns the new value or null. */
export function sliderKey(e: KeyboardEvent, value: number, min: number, max: number, step: number, bigStep: number): number | null {
  const s = e.shiftKey ? bigStep : step;
  switch (e.key) {
    case "ArrowRight":
    case "ArrowUp":
      return clamp(value + s, min, max);
    case "ArrowLeft":
    case "ArrowDown":
      return clamp(value - s, min, max);
    case "PageUp":
      return clamp(value + bigStep, min, max);
    case "PageDown":
      return clamp(value - bigStep, min, max);
    case "Home":
      return min;
    case "End":
      return max;
    default:
      return null;
  }
}

/**
 * Horizontal slider with a custom track background (hue rainbow, alpha ramp…).
 * Pointer drag on the whole track, full keyboard support on the thumb.
 */
export function ChannelSlider({
  label,
  value,
  min,
  max,
  step = 1,
  bigStep = 10,
  onChange,
  background,
  checker = false,
  thumbColor,
  valueText,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  bigStep?: number;
  onChange: (v: number) => void;
  background: string;
  /** Draw a checkerboard under the track (alpha sliders). */
  checker?: boolean;
  thumbColor?: string;
  valueText?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const pct = ((clamp(value, min, max) - min) / (max - min)) * 100;

  function fromPointer(e: PointerEvent) {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const t = clamp((e.clientX - r.left) / r.width, 0, 1);
    const raw = min + t * (max - min);
    onChange(clamp(Math.round(raw / step) * step, min, max));
  }

  return (
    <div
      className={cn("relative h-7 touch-none select-none", className)}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        thumbRef.current?.focus();
        fromPointer(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
      }}
    >
      <div
        ref={trackRef}
        className="absolute inset-x-2.5 top-1/2 h-3.5 -translate-y-1/2 overflow-hidden rounded-full border border-line"
        style={checker ? CHECKER_STYLE : undefined}
      >
        <div className="absolute inset-0" style={{ background }} />
      </div>
      <div className="absolute inset-x-2.5 top-0 h-full">
        <div
          ref={thumbRef}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Math.round(value * 100) / 100}
          aria-valuetext={valueText}
          onKeyDown={(e) => {
            const next = sliderKey(e, value, min, max, step, bigStep);
            if (next !== null) {
              e.preventDefault();
              onChange(next);
            }
          }}
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_1px_3px_rgb(0_0_0/0.3)]"
          style={{ left: `${pct}%`, background: thumbColor }}
        />
      </div>
    </div>
  );
}
