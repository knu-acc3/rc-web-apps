"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Input } from "@/ui/field";
import { formatTime, parseTime } from "../engine/time";

type Handle = "start" | "end" | "both";

/**
 * Two-handle range selector over a timeline background (filmstrip or waveform).
 * Handles are keyboard sliders (←/→ = step, Shift = ×10, Home/End).
 */
export function RangeSelector({
  duration,
  start,
  end,
  onChange,
  labels,
  background,
  playhead,
  onSeek,
  step = 0.1,
  minLength = 0.1,
  className,
}: {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  labels: { start: string; end: string; selection: string };
  background?: ReactNode;
  playhead?: number | null;
  onSeek?: (t: number) => void;
  step?: number;
  minLength?: number;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: Handle; t0: number; s0: number; e0: number } | null>(null);
  const d = Math.max(duration, 0.001);
  const pct = (t: number) => `${(Math.max(0, Math.min(d, t)) / d) * 100}%`;

  const timeAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.max(0, Math.min(d, ((clientX - r.left) / r.width) * d));
  };
  const set = (s: number, e: number) => {
    s = Math.max(0, Math.min(s, d - minLength));
    e = Math.min(d, Math.max(e, s + minLength));
    onChange(Math.round(s * 1000) / 1000, Math.round(e * 1000) / 1000);
  };

  const down = (handle: Handle, ev: PointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    drag.current = { handle, t0: timeAt(ev.clientX), s0: start, e0: end };
  };
  const move = (ev: PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const t = timeAt(ev.clientX);
    if (g.handle === "start") set(Math.min(t, end - minLength), end);
    else if (g.handle === "end") set(start, Math.max(t, start + minLength));
    else {
      const len = g.e0 - g.s0;
      const s = Math.max(0, Math.min(d - len, g.s0 + (t - g.t0)));
      onChange(Math.round(s * 1000) / 1000, Math.round((s + len) * 1000) / 1000);
    }
  };
  const up = () => {
    drag.current = null;
  };

  const key = (handle: "start" | "end", ev: KeyboardEvent) => {
    const k = ev.shiftKey ? step * 10 : step;
    const cur = handle === "start" ? start : end;
    let next: number | null = null;
    if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") next = cur - k;
    else if (ev.key === "ArrowRight" || ev.key === "ArrowUp") next = cur + k;
    else if (ev.key === "PageDown") next = cur - step * 50;
    else if (ev.key === "PageUp") next = cur + step * 50;
    else if (ev.key === "Home") next = handle === "start" ? 0 : start + minLength;
    else if (ev.key === "End") next = handle === "start" ? end - minLength : d;
    if (next === null) return;
    ev.preventDefault();
    if (handle === "start") set(Math.min(next, end - minLength), end);
    else set(start, Math.max(next, start + minLength));
  };

  const handleCls =
    "absolute top-0 z-20 flex h-full w-4 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40 rounded-[0.25rem]";

  return (
    <div className={cn("select-none", className)}>
      <div
        ref={track}
        className="relative h-20 w-full touch-none overflow-hidden rounded-[0.625rem] border border-line bg-surface-2"
        onPointerDown={(ev) => {
          if (ev.target !== ev.currentTarget && !(ev.target as HTMLElement).dataset.bg) return;
          const t = timeAt(ev.clientX);
          if (onSeek) onSeek(t);
          else if (Math.abs(t - start) < Math.abs(t - end)) set(Math.min(t, end - minLength), end);
          else set(start, Math.max(t, start + minLength));
        }}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div data-bg="1" className="absolute inset-0">
          {background}
        </div>
        {/* dimmed areas outside the selection */}
        <div className="pointer-events-none absolute inset-y-0 left-0 bg-bg/70" style={{ width: pct(start) }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 bg-bg/70" style={{ left: pct(end) }} />
        {/* selection body: drag to move */}
        <div
          className="absolute inset-y-0 z-10 cursor-grab border-y-2 border-accent active:cursor-grabbing"
          style={{ left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }}
          onPointerDown={(ev) => down("both", ev)}
          aria-hidden
        />
        {playhead != null && playhead >= 0 && (
          <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-fg" style={{ left: pct(playhead) }} aria-hidden />
        )}
        <div
          role="slider"
          tabIndex={0}
          aria-label={labels.start}
          aria-valuemin={0}
          aria-valuemax={Math.round(d * 10) / 10}
          aria-valuenow={Math.round(start * 10) / 10}
          aria-valuetext={formatTime(start, 1)}
          className={handleCls}
          style={{ left: pct(start) }}
          onPointerDown={(ev) => down("start", ev)}
          onKeyDown={(ev) => key("start", ev)}
        >
          <span className="h-10 w-2 rounded-full bg-accent shadow-[0_0_0_2px_var(--surface)]" />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label={labels.end}
          aria-valuemin={0}
          aria-valuemax={Math.round(d * 10) / 10}
          aria-valuenow={Math.round(end * 10) / 10}
          aria-valuetext={formatTime(end, 1)}
          className={handleCls}
          style={{ left: pct(end) }}
          onPointerDown={(ev) => down("end", ev)}
          onKeyDown={(ev) => key("end", ev)}
        >
          <span className="h-10 w-2 rounded-full bg-accent shadow-[0_0_0_2px_var(--surface)]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Time-code text field ("1:05.5", "00:01:05.5", "65.5"). Commits on blur/Enter;
 * shows an error state for invalid input.
 */
export function TimeInput({
  label,
  value,
  onCommit,
  max,
  digits = 2,
  className,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  max?: number;
  digits?: number;
  className?: string;
}) {
  const id = useId();
  // Text being edited; null = show the formatted value.
  const [editing, setEditing] = useState<string | null>(null);
  const text = editing ?? formatTime(value, digits);
  const parsed = parseTime(text);
  const invalid = parsed === null || (max !== undefined && parsed > max + 0.001);
  const commit = () => {
    if (editing !== null && !invalid && parsed !== null) onCommit(parsed);
    setEditing(null);
  };
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg-2">
        {label}
      </label>
      <Input
        id={id}
        value={text}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={invalid}
        className="tabular"
        onChange={(e) => setEditing(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
    </div>
  );
}
