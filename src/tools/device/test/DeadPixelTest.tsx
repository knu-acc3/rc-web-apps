"use client";

import { Maximize, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Kbd } from "@/ui/panel";

const COLORS = [
  { hex: "#000000", ru: "Чёрный", en: "Black", tip: { ru: "ищите светящиеся точки", en: "look for lit dots" } },
  { hex: "#ffffff", ru: "Белый", en: "White", tip: { ru: "ищите тёмные точки", en: "look for dark dots" } },
  { hex: "#ff0000", ru: "Красный", en: "Red", tip: { ru: "точки другого цвета — дефект субпикселя", en: "off-colour dots are a faulty subpixel" } },
  { hex: "#00ff00", ru: "Зелёный", en: "Green", tip: { ru: "точки другого цвета — дефект субпикселя", en: "off-colour dots are a faulty subpixel" } },
  { hex: "#0000ff", ru: "Синий", en: "Blue", tip: { ru: "точки другого цвета — дефект субпикселя", en: "off-colour dots are a faulty subpixel" } },
  { hex: "#808080", ru: "Серый", en: "Gray", tip: { ru: "пятна и полосы — неравномерная подсветка", en: "patches and bands show uneven backlight" } },
] as const;

const HINT_MS = 2500;

const T = {
  ru: {
    start: "Начать тест",
    startWith: (c: string) => `Начать с цвета: ${c}`,
    orColor: "или начните с цвета:",
    intro: "Экран заполнится цветом во весь экран. Протрите экран заранее, чтобы не принять пылинку за битый пиксель.",
    keys: "Управление",
    next: "следующий цвет",
    prev: "предыдущий",
    exit: "выход",
    close: "Выйти из теста",
    dialog: "Полноэкранная заливка для поиска битых пикселей",
    tap: "Касание — следующий цвет",
  },
  en: {
    start: "Start test",
    startWith: (c: string) => `Start with ${c.toLowerCase()}`,
    orColor: "or start with a colour:",
    intro: "The screen will fill with a solid colour in full screen. Wipe the screen first so you don't mistake dust for a dead pixel.",
    keys: "Controls",
    next: "next colour",
    prev: "previous",
    exit: "exit",
    close: "Exit the test",
    dialog: "Full-screen colour fill for finding dead pixels",
    tap: "Tap — next colour",
  },
} as const;

export default function DeadPixelTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [hint, setHint] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const hintTimer = useRef(0);

  function showHint() {
    setHint(true);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(false), HINT_MS);
  }

  function close() {
    window.clearTimeout(hintTimer.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setOpen(false);
    startRef.current?.focus();
  }

  function start(i: number) {
    flushSync(() => {
      setIndex(i);
      setOpen(true);
    });
    const el = overlayRef.current;
    if (!el) return;
    el.focus();
    // without the Fullscreen API (iPhone) the fixed overlay still covers the whole window
    try {
      el.requestFullscreen?.({ navigationUI: "hide" })?.catch(() => {});
    } catch {
      // ignored: the overlay works without fullscreen
    }
    showHint();
  }

  const step = (d: number) => {
    setIndex((i) => (i + d + COLORS.length) % COLORS.length);
    showHint();
  };

  // Without real fullscreen the overlay covers the window: hide the page scrollbar meanwhile.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);

  // Leaving fullscreen with the browser's own Esc handling closes the test too.
  useEffect(() => {
    if (!open) return;
    let wasFull = false;
    const onFs = () => {
      if (document.fullscreenElement) wasFull = true;
      else if (wasFull) {
        window.clearTimeout(hintTimer.current);
        setOpen(false);
        startRef.current?.focus();
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [open]);

  useEffect(() => {
    const timer = hintTimer;
    return () => {
      window.clearTimeout(timer.current);
      if (typeof document !== "undefined" && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const c = COLORS[index];
  const light = c.hex === "#ffffff" || c.hex === "#00ff00";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-4 rounded-[0.75rem] border border-line bg-surface px-4 py-10 text-center sm:py-12">
        <div className="flex h-20 w-36 overflow-hidden rounded-[0.5rem] border border-line-strong" aria-hidden>
          {COLORS.map((col) => (
            <span key={col.hex} className="flex-1" style={{ background: col.hex }} />
          ))}
        </div>
        <Button ref={startRef} variant="primary" size="lg" onClick={() => start(0)}>
          <Maximize aria-hidden />
          {t.start}
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-fg-3">
          <span>{t.orColor}</span>
          {COLORS.map((col, i) => (
            <button
              key={col.hex}
              type="button"
              onClick={() => start(i)}
              aria-label={t.startWith(col[locale])}
              title={col[locale]}
              className="size-7 rounded-full border border-line-strong transition-transform hover:scale-110"
              style={{ background: col.hex }}
            />
          ))}
        </div>
        <p className="max-w-xl text-sm text-fg-3">{t.intro}</p>
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-fg-2">
          <span>
            <Kbd>Space</Kbd> <Kbd>→</Kbd> {t.next}
          </span>
          <span>
            <Kbd>←</Kbd> {t.prev}
          </span>
          <span>
            <Kbd>1</Kbd>–<Kbd>6</Kbd>
          </span>
          <span>
            <Kbd>Esc</Kbd> {t.exit}
          </span>
        </p>
      </div>

      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.dialog}
        tabIndex={-1}
        hidden={!open}
        onClick={() => step(1)}
        onContextMenu={(e) => {
          e.preventDefault();
          step(-1);
        }}
        onMouseMove={() => {
          if (!hint) showHint();
        }}
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          } else if ([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
            e.preventDefault();
            step(1);
          } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) {
            e.preventDefault();
            step(-1);
          } else if (/^[1-6]$/.test(e.key)) {
            setIndex(Number(e.key) - 1);
            showHint();
          } else if (e.key !== "Tab") {
            showHint();
          }
        }}
        className={cn("fixed inset-0 z-[100] outline-none", !hint && "cursor-none")}
        style={{ background: c.hex }}
      >
        <div
          className={cn(
            "absolute left-1/2 top-4 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 text-sm shadow-[var(--shadow-overlay)] transition-opacity duration-500",
            light ? "bg-black/75 text-white" : "bg-white/85 text-black",
            hint ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <span className="font-semibold">
            {index + 1}/{COLORS.length} · {c[locale]}
          </span>
          <span className="hidden opacity-80 sm:inline">{c.tip[locale]}</span>
          <span className="hidden opacity-80 md:inline">
            · Space/→ {t.next} · Esc {t.exit}
          </span>
          <span className="opacity-80 md:hidden">· {t.tap}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label={t.close}
            className="-mr-1 flex size-8 items-center justify-center rounded-full hover:bg-black/10"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
