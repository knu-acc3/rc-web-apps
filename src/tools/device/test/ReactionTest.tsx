"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/panel";
import { randomDelayMs, REACTION_ATTEMPTS, reactionRating, reactionStats, type ReactionRating } from "./lib/reaction";

type Phase = "idle" | "waiting" | "go" | "early" | "shown" | "done";

const T = {
  ru: {
    pad: "Поле теста реакции",
    idle: "Нажмите, чтобы начать",
    idleSub: "Когда поле станет зелёным — кликайте как можно быстрее. Можно пробелом.",
    waiting: "Ждите зелёного…",
    go: "Жмите!",
    early: "Слишком рано!",
    earlySub: "Фальстарт не засчитывается. Нажмите, чтобы попробовать ещё раз.",
    next: "Нажмите для следующей попытки",
    done: "Готово",
    doneSub: "Нажмите, чтобы пройти тест заново",
    attempt: (i: number) => `Попытка ${i} из ${REACTION_ATTEMPTS}`,
    average: "Среднее",
    best: "Лучшее",
    worst: "Худшее",
    ms: "мс",
    again: "Начать заново",
    ratings: { excellent: "Отлично", good: "Хорошо", average: "Средне", below: "Ниже среднего", slow: "Медленно" } satisfies Record<ReactionRating, string>,
    summary: (avg: string, best: string) => `Среднее время реакции ${avg} мс, лучшее ${best} мс`,
  },
  en: {
    pad: "Reaction test area",
    idle: "Click to start",
    idleSub: "When the box turns green, click as fast as you can. Space works too.",
    waiting: "Wait for green…",
    go: "Click!",
    early: "Too soon!",
    earlySub: "A false start doesn't count. Click to try again.",
    next: "Click for the next attempt",
    done: "Done",
    doneSub: "Click to take the test again",
    attempt: (i: number) => `Attempt ${i} of ${REACTION_ATTEMPTS}`,
    average: "Average",
    best: "Best",
    worst: "Worst",
    ms: "ms",
    again: "Start over",
    ratings: { excellent: "Excellent", good: "Good", average: "Average", below: "Below average", slow: "Slow" } satisfies Record<ReactionRating, string>,
    summary: (avg: string, best: string) => `Average reaction time ${avg} ms, best ${best} ms`,
  },
} as const;

export default function ReactionTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [phase, setPhase] = useState<Phase>("idle");
  const [times, setTimes] = useState<number[]>([]);
  const run = useRef({ timeout: 0, raf: 0, goAt: 0 });

  useEffect(() => {
    const r = run.current;
    return () => {
      window.clearTimeout(r.timeout);
      cancelAnimationFrame(r.raf);
    };
  }, []);

  function arm() {
    const r = run.current;
    r.goAt = 0;
    setPhase("waiting");
    r.timeout = window.setTimeout(() => {
      flushSync(() => setPhase("go"));
      // the green frame is painted right after this callback
      r.raf = requestAnimationFrame(() => {
        r.goAt = performance.now();
      });
    }, randomDelayMs());
  }

  function press(ts: number) {
    const r = run.current;
    switch (phase) {
      case "idle":
      case "early":
      case "shown":
        arm();
        return;
      case "done":
        setTimes([]);
        arm();
        return;
      case "waiting":
        window.clearTimeout(r.timeout);
        setPhase("early");
        return;
      case "go": {
        if (!r.goAt) return;
        const ms = Math.max(0, ts - r.goAt);
        const next = [...times, ms];
        setTimes(next);
        setPhase(next.length >= REACTION_ATTEMPTS ? "done" : "shown");
      }
    }
  }

  function restart() {
    const r = run.current;
    window.clearTimeout(r.timeout);
    cancelAnimationFrame(r.raf);
    setTimes([]);
    setPhase("idle");
  }

  const stats = reactionStats(times);
  const last = times[times.length - 1];
  const ms = (n: number) => formatNumber(locale, n, { maximumFractionDigits: 0 });

  const tone =
    phase === "waiting" ? "bg-[#c62828] text-white" : phase === "go" ? "bg-[#12a150] text-white" : phase === "early" ? "bg-warn-soft text-warn" : "bg-accent-soft text-on-accent-container hover:shadow-[var(--elev-2)]";

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        aria-label={t.pad}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          press(e.timeStamp);
        }}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            press(e.timeStamp);
          }
        }}
        className={cn(
          "flex min-h-80 w-full touch-manipulation select-none flex-col items-center justify-center gap-3 rounded-[1.25rem] px-6 py-10 text-center shadow-[var(--elev-1)] transition-[background-color,transform] duration-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99] sm:min-h-96 lg:min-h-[28rem]",
          tone,
        )}
      >
        {phase === "idle" && (
          <>
            <span className="text-3xl font-bold sm:text-4xl">{t.idle}</span>
            <span className="max-w-md text-[0.9375rem] opacity-80">{t.idleSub}</span>
          </>
        )}
        {phase === "waiting" && <span className="text-3xl font-bold sm:text-4xl">{t.waiting}</span>}
        {phase === "go" && <span className="text-5xl font-bold sm:text-6xl">{t.go}</span>}
        {phase === "early" && (
          <>
            <span className="text-3xl font-bold sm:text-4xl">{t.early}</span>
            <span className="max-w-md text-[0.9375rem]">{t.earlySub}</span>
          </>
        )}
        {(phase === "shown" || phase === "done") && last !== undefined && (
          <>
            <span className="text-sm font-medium uppercase tracking-wide opacity-70">{phase === "done" ? t.done : t.attempt(times.length)}</span>
            <span className="tabular text-6xl font-bold tracking-tight sm:text-7xl">
              {ms(phase === "done" && stats ? stats.average : last)} <span className="text-3xl font-semibold opacity-70">{t.ms}</span>
            </span>
            <span className="text-[0.9375rem] opacity-80">{phase === "done" ? t.doneSub : t.next}</span>
          </>
        )}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2" aria-hidden>
        {Array.from({ length: REACTION_ATTEMPTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "tabular flex h-9 min-w-16 items-center justify-center rounded-full px-3 text-sm transition-colors",
              times[i] !== undefined ? "bg-accent-soft font-semibold text-on-accent-container" : "bg-surface-2 text-fg-3",
            )}
          >
            {times[i] !== undefined ? `${ms(times[i])} ${t.ms}` : i + 1}
          </span>
        ))}
      </div>

      <div aria-live="polite" className="flex min-h-10 flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.9375rem] text-fg-2">
        {phase === "done" && stats && (
          <>
            <span>
              {t.average}:{" "}
              <span className="tabular text-xl font-bold text-fg">
                {ms(stats.average)} {t.ms}
              </span>
            </span>
            <span>
              {t.best}:{" "}
              <span className="tabular font-semibold text-fg">
                {ms(stats.best)} {t.ms}
              </span>
            </span>
            <span>
              {t.worst}:{" "}
              <span className="tabular font-semibold text-fg">
                {ms(stats.worst)} {t.ms}
              </span>
            </span>
            <Badge tone="accent">{t.ratings[reactionRating(stats.average)]}</Badge>
            <span className="sr-only">{t.summary(ms(stats.average), ms(stats.best))}</span>
          </>
        )}
        {phase === "shown" && last !== undefined && <span className="sr-only">{`${t.attempt(times.length)}: ${ms(last)} ${t.ms}`}</span>}
      </div>

      {times.length > 0 && phase !== "done" && (
        <div className="flex justify-center">
          <Button variant="tonal" onClick={restart}>
            <RotateCcw aria-hidden />
            {t.again}
          </Button>
        </div>
      )}
    </div>
  );
}
