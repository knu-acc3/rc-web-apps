"use client";

import { ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Kbd } from "@/ui/panel";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { drawPattern, PATTERN_TEXT, PATTERNS, type PatternId } from "./lib/patterns";

const T = {
  ru: { full: "На весь экран", choose: "Тест", close: "Закрыть", stage: "Тест монитора", prev: "Предыдущий тест", next: "Следующий тест", keys: "Клавиши", switch: "другой тест", exit: "выход", tip: "Проверяйте на весь экран: в окне масштаб страницы может размыть линии в 1 пиксель." },
  en: { full: "Full screen", choose: "Test", close: "Close", stage: "Monitor test", prev: "Previous test", next: "Next test", keys: "Keys", switch: "another test", exit: "exit", tip: "Test in full screen: in a window, page zoom can blur 1-pixel lines." },
} as const;

/** Redraw the canvas at real device pixels whenever it is resized. */
function usePatternCanvas(id: PatternId, active: boolean) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    drawPattern(ctx, id, c.width, c.height, dpr);
  }, [id]);
  useEffect(() => {
    if (!active) return;
    draw();
    const c = ref.current;
    if (!c || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [draw, active]);
  return ref;
}

export default function MonitorTest({ locale, pattern = "gradient" }: { locale: Locale; pattern?: PatternId }) {
  const t = T[locale];
  const [id, setId] = useState<PatternId>(PATTERNS.includes(pattern) ? pattern : "gradient");
  const stage = useStage();
  const preview = usePatternCanvas(id, true);
  const big = usePatternCanvas(id, stage.open);
  const i = PATTERNS.indexOf(id);
  const step = (d: number) => setId(PATTERNS[(i + d + PATTERNS.length) % PATTERNS.length]);
  const [name, tip] = PATTERN_TEXT[id][locale];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage.open || e.ctrlKey || e.metaKey || e.altKey || typingTarget(e)) return;
      if (e.key === "f" || e.key === "F" || e.key === "а" || e.key === "А") {
        e.preventDefault();
        stage.enter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label={t.choose} className="flex flex-wrap gap-2">
        {PATTERNS.map((p) => (
          <button key={p} type="button" role="radio" aria-checked={p === id} onClick={() => setId(p)} className="chip" aria-current={p === id ? "page" : undefined}>
            {PATTERN_TEXT[p][locale][0]}
          </button>
        ))}
      </div>
      <button type="button" onClick={stage.enter} aria-label={`${t.full}: ${name}`} className="group relative block aspect-[16/9] w-full overflow-hidden rounded-[1rem] border border-line-strong bg-black">
        <canvas ref={preview} className="size-full" aria-hidden />
        <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-overlay)] transition-transform group-hover:scale-105">
          <Maximize className="size-4" aria-hidden />
          {t.full}
        </span>
      </button>
      <div className="rounded-[0.75rem] border border-line bg-surface px-4 py-3">
        <p className="font-semibold text-fg">{name}</p>
        <p className="mt-1 text-[0.9375rem] text-fg-2">{tip}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="primary" size="lg" onClick={stage.enter}>
          <Maximize aria-hidden />
          {t.full}
        </Button>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
          <span>
            <Kbd>F</Kbd> {t.full.toLowerCase()}
          </span>
          <span>
            <Kbd>←</Kbd> <Kbd>→</Kbd> {t.switch}
          </span>
          <span>
            <Kbd>Esc</Kbd> {t.exit}
          </span>
        </p>
      </div>
      <p className="text-sm text-fg-3">{t.tip}</p>

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        style={{ background: "#000" }}
        onKey={(e) => {
          if (e.key === "ArrowRight" || e.key === " ") {
            e.preventDefault();
            step(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          }
        }}
        bar={
          <>
            <button type="button" className="flex size-9 items-center justify-center rounded-full hover:bg-white/15" onClick={() => step(-1)} aria-label={t.prev} title={t.prev}>
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <span className="font-semibold">
              {i + 1}/{PATTERNS.length} · {name}
            </span>
            <button type="button" className="flex size-9 items-center justify-center rounded-full hover:bg-white/15" onClick={() => step(1)} aria-label={t.next} title={t.next}>
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <span className={cn("hidden max-w-xl text-xs opacity-80 lg:inline")}>{tip}</span>
          </>
        }
      >
        <canvas ref={big} className="size-full" aria-hidden />
      </StageLayer>
    </div>
  );
}
