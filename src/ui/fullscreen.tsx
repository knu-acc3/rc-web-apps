"use client";

import { Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useWakeLock } from "./stage";

/**
 * Fullscreen for one element (F toggles, Esc exits). Where the Fullscreen API is missing or refused — iPhone
 * Safari, in-app browsers — the element is pinned over the whole window instead, so the button always works.
 */
export function useFullscreen<T extends HTMLElement>(hotkey = true) {
  const ref = useRef<T>(null);
  const [real, setReal] = useState(false);
  const [pseudo, setPseudo] = useState(false);

  useEffect(() => {
    const on = () => setReal(!!ref.current && document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // Pinned mode: cover the window, hide the page scroll, Esc leaves.
  useEffect(() => {
    const el = ref.current;
    if (!pseudo || !el) return;
    const prev = el.getAttribute("style") ?? "";
    el.style.cssText += ";position:fixed;inset:0;z-index:100;overflow:auto;background:var(--bg);margin:0;max-width:none";
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPseudo(false);
    window.addEventListener("keydown", onKey);
    return () => {
      el.setAttribute("style", prev);
      root.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [pseudo]);

  const toggle = useCallback(async () => {
    if (pseudo) {
      setPseudo(false);
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    const el = ref.current;
    if (!el) return;
    try {
      if (!el.requestFullscreen) throw new Error("unsupported");
      await el.requestFullscreen();
    } catch {
      setPseudo(true);
    }
  }, [pseudo]);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "f" && e.key !== "F" && e.key !== "а" && e.key !== "А") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      void toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, toggle]);

  return { ref, active: real || pseudo, toggle };
}

const FS_T = {
  ru: { full: "На весь экран", exit: "Выйти из полноэкранного режима" },
  en: { full: "Full screen", exit: "Exit full screen" },
} as const;

/**
 * A block that can be shown full screen (a result for a projector, a TV or a phone held up to a room): a small
 * button in its corner toggles it. `children` gets `true` while full screen so the tool can enlarge its numbers.
 */
export function Presentable({
  locale,
  children,
  className,
  fullClassName,
}: {
  locale: "ru" | "en";
  children: ReactNode | ((full: boolean) => ReactNode);
  className?: string;
  fullClassName?: string;
}) {
  const { ref, active, toggle } = useFullscreen<HTMLDivElement>();
  useWakeLock(active);
  const t = FS_T[locale];
  return (
    // In full screen the element marked `fs-big` (the result) grows to fill the screen.
    <div ref={ref} className={cn("relative", className, active && cn("flex flex-col items-center justify-center gap-6 bg-bg p-4 [&_.fs-big]:text-[min(18vw,26vh)]! [&_.fs-big]:leading-none!", fullClassName))}>
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={active ? t.exit : t.full}
        title={active ? t.exit : t.full}
        className="btn btn-tonal btn-round absolute right-2 top-2 z-10 size-10 pointer-coarse:size-11"
      >
        {active ? <Minimize className="size-[1.125rem]" aria-hidden /> : <Maximize className="size-[1.125rem]" aria-hidden />}
      </button>
      {typeof children === "function" ? children(active) : children}
    </div>
  );
}
