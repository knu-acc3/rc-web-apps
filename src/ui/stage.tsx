"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * "Stage": a tool shown over the whole screen — a colour fill, a mirror, a scoreboard. Real fullscreen where the
 * browser allows it (not iPhone Safari), otherwise a fixed layer over the window. The screen stays on, the cursor
 * and the control bar hide after a few idle seconds, Esc or the cross closes it.
 */

/** Keep the screen on while `enabled` (Screen Wake Lock API; silently no-op when unsupported). */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } };
    if (!nav.wakeLock) return;
    let lock: { release(): Promise<void> } | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const l = await nav.wakeLock!.request("screen");
        if (cancelled) void l.release();
        else lock = l;
      } catch {
        // denied (battery saver, hidden tab) — ignore
      }
    };
    void acquire();
    const onVis = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (lock) void lock.release().catch(() => {});
    };
  }, [enabled]);
}

const IDLE_MS = 2500;

export interface Stage {
  open: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
  /** Call from a click/key handler: fullscreen needs the user gesture. */
  enter: () => void;
  exit: () => void;
  /** Controls are visible (the user moved, tapped or pressed a key recently). */
  awake: boolean;
  poke: () => void;
}

export function useStage(onExit?: () => void): Stage {
  const [open, setOpen] = useState(false);
  const [awake, setAwake] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const exitRef = useRef(onExit);
  useEffect(() => {
    exitRef.current = onExit;
  });

  const poke = useCallback(() => {
    setAwake(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAwake(false), IDLE_MS);
  }, []);

  const exit = useCallback(() => {
    window.clearTimeout(timer.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setOpen(false);
    exitRef.current?.();
  }, []);

  const enter = useCallback(() => {
    flushSync(() => setOpen(true));
    const el = ref.current;
    if (!el) return;
    el.focus();
    try {
      el.requestFullscreen?.({ navigationUI: "hide" })?.catch(() => {});
    } catch {
      // the fixed layer covers the window anyway
    }
    poke();
  }, [poke]);

  useWakeLock(open);

  // Without real fullscreen the layer covers the window: hide the page scrollbar meanwhile.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);

  // Leaving fullscreen with the browser's own Esc closes the stage too.
  useEffect(() => {
    if (!open) return;
    let wasFull = false;
    const onFs = () => {
      if (document.fullscreenElement) wasFull = true;
      else if (wasFull) exit();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [open, exit]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (typeof document !== "undefined" && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    },
    [],
  );

  return { open, ref, enter, exit, awake, poke };
}

/** The full-screen layer. `bar` is shown at the top while the user is active; `onKey` gets every key but Esc. */
export function StageLayer({
  stage: { ref: layerRef, open, awake, poke, exit },
  label,
  closeLabel,
  bar,
  dark = false,
  onKey,
  onClick,
  className,
  style,
  children,
}: {
  stage: Stage;
  label: string;
  closeLabel: string;
  bar?: ReactNode;
  /** The background is dark: draw the bar light. */
  dark?: boolean;
  onKey?: (e: KeyboardEvent<HTMLDivElement>) => void;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      ref={layerRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      hidden={!open}
      onPointerMove={poke}
      onClick={() => {
        poke();
        onClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          exit();
          return;
        }
        poke();
        onKey?.(e);
      }}
      className={cn("fixed inset-0 z-[100] overflow-hidden outline-none select-none", !awake && "cursor-none", className)}
      style={style}
    >
      {children}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute left-1/2 top-3 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-sm shadow-[var(--shadow-overlay)] transition-opacity duration-500 [padding-top:max(0.375rem,env(safe-area-inset-top))]",
          dark ? "bg-white/90 text-black" : "bg-black/75 text-white",
          awake ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">{bar}</div>
        <button
          type="button"
          onClick={exit}
          aria-label={closeLabel}
          title={closeLabel}
          className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", dark ? "hover:bg-black/10" : "hover:bg-white/15")}
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** True when a key event comes from a text field (shortcuts must not fire there). */
export function typingTarget(e: { target: EventTarget | null }): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}
