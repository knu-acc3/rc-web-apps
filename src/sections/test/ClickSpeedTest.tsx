"use client";

import { RotateCcw, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { useStoredNumber, writeStored } from "./lib/client";
import { CPS_DURATIONS, CPS_RANK_LABELS, cps, cpsRank, DEFAULT_CPS_DURATION, isCpsDuration, isNewBest, roundCps, type CpsDuration } from "./lib/cps";

const COOLDOWN_MS = 900;

const T = {
  ru: {
    duration: "Длительность теста",
    sec: (n: number) => `${n} ${plural("ru", n, ["секунда", "секунды", "секунд"])}`,
    secShort: "с",
    start: "Кликните, чтобы начать",
    startSub: "Таймер запустится с первого клика",
    go: "Кликайте!",
    done: "Время вышло",
    clicks: (n: number) => plural("ru", n, ["клик", "клика", "кликов"]),
    timeLeft: "осталось",
    cps: "кликов в секунду",
    best: "Рекорд",
    newBest: "Новый рекорд!",
    again: "Ещё раз",
    area: "Кнопка для кликов",
    result: (clicks: number, secs: number, v: string) => `${clicks} ${plural("ru", clicks, ["клик", "клика", "кликов"])} за ${secs} ${plural("ru", secs, ["секунду", "секунды", "секунд"])} — ${v} CPS`,
  },
  en: {
    duration: "Test duration",
    sec: (n: number) => `${n} ${n === 1 ? "second" : "seconds"}`,
    secShort: "s",
    start: "Click to start",
    startSub: "The timer starts with your first click",
    go: "Click!",
    done: "Time's up",
    clicks: (n: number) => (n === 1 ? "click" : "clicks"),
    timeLeft: "left",
    cps: "clicks per second",
    best: "Best",
    newBest: "New personal best!",
    again: "Try again",
    area: "Click button",
    result: (clicks: number, secs: number, v: string) => `${clicks} ${clicks === 1 ? "click" : "clicks"} in ${secs} ${secs === 1 ? "second" : "seconds"} — ${v} CPS`,
  },
} as const;

type Phase = "idle" | "running" | "cooldown" | "done";

interface Result {
  clicks: number;
  seconds: CpsDuration;
  cps: number;
  record: boolean;
}

const bestKey = (s: number) => `test.cps.best.${s}`;

export default function ClickSpeedTest({ locale, seconds = DEFAULT_CPS_DURATION }: { locale: Locale; seconds?: number }) {
  const t = T[locale];
  const [duration, setDuration] = useState<CpsDuration>(isCpsDuration(seconds) ? seconds : DEFAULT_CPS_DURATION);
  const [phase, setPhase] = useState<Phase>("idle");
  const [clicks, setClicks] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const best = useStoredNumber(bestKey(duration));

  const run = useRef({ start: 0, clicks: 0, raf: 0, timer: 0 });

  useEffect(() => {
    const r = run.current;
    return () => {
      cancelAnimationFrame(r.raf);
      window.clearTimeout(r.timer);
    };
  }, []);

  function finish() {
    const r = run.current;
    cancelAnimationFrame(r.raf);
    const v = roundCps(cps(r.clicks, duration));
    const prev = best;
    const record = isNewBest(prev, v);
    if (record) writeStored(bestKey(duration), String(v));
    setElapsed(duration * 1000);
    setResult({ clicks: r.clicks, seconds: duration, cps: v, record });
    setPhase("cooldown");
    r.timer = window.setTimeout(() => setPhase("done"), COOLDOWN_MS);
  }

  function tick() {
    const r = run.current;
    const el = performance.now() - r.start;
    if (el >= duration * 1000) {
      finish();
      return;
    }
    setElapsed(el);
    r.raf = requestAnimationFrame(tick);
  }

  function press() {
    const r = run.current;
    if (phase === "cooldown") return;
    if (phase === "idle" || phase === "done") {
      r.start = performance.now();
      r.clicks = 1;
      setClicks(1);
      setElapsed(0);
      setResult(null);
      setPhase("running");
      r.raf = requestAnimationFrame(tick);
      return;
    }
    if (performance.now() - r.start >= duration * 1000) return; // late click, the frame loop finishes the run
    r.clicks += 1;
    setClicks(r.clicks);
  }

  function reset(next: CpsDuration = duration) {
    const r = run.current;
    cancelAnimationFrame(r.raf);
    window.clearTimeout(r.timer);
    r.clicks = 0;
    setDuration(next);
    setPhase("idle");
    setClicks(0);
    setElapsed(0);
    setResult(null);
  }

  const leftS = Math.max(0, duration - elapsed / 1000);
  const liveCps = elapsed > 250 ? clicks / (elapsed / 1000) : 0;
  const fmt = (n: number, d = 2) => formatNumber(locale, n, { maximumFractionDigits: d, minimumFractionDigits: d });
  const running = phase === "running";
  const showResult = (phase === "cooldown" || phase === "done") && result;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label={t.duration}
          value={String(duration)}
          onChange={(v) => reset(Number(v) as CpsDuration)}
          options={CPS_DURATIONS.map((d) => ({ value: String(d), label: `${d} ${t.secShort}`, title: t.sec(d) }))}
        />
        <span className="inline-flex items-center gap-1.5 text-sm text-fg-2">
          <Trophy className="size-4 text-warn" aria-hidden />
          {t.best} ({duration} {t.secShort}): <span className="tabular font-semibold text-fg">{best !== null ? `${fmt(best)} CPS` : "—"}</span>
        </span>
      </div>

      <button
        type="button"
        aria-label={t.area}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          press();
        }}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            press();
          }
        }}
        className={cn(
          "relative flex min-h-72 w-full touch-manipulation select-none flex-col items-center justify-center gap-2 rounded-[16px] border-2 px-4 py-8 text-center transition-colors duration-100 sm:min-h-80",
          running ? "border-accent bg-accent-soft" : showResult ? "border-line bg-surface-2" : "border-dashed border-line-strong bg-surface hover:border-accent",
        )}
      >
        {running ? (
          <>
            <span className="tabular text-7xl font-bold tracking-tight text-fg sm:text-8xl">{clicks}</span>
            <span className="text-lg text-fg-2">{t.go}</span>
          </>
        ) : showResult ? (
          <>
            <span className="text-sm font-medium uppercase tracking-wide text-fg-3">{t.done}</span>
            <span className="tabular text-6xl font-bold tracking-tight text-fg sm:text-7xl">{fmt(result.cps)}</span>
            <span className="text-lg text-fg-2">{t.cps}</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-semibold text-fg sm:text-3xl">{t.start}</span>
            <span className="text-[15px] text-fg-3">{t.startSub}</span>
          </>
        )}
        {running && (
          <span className="absolute inset-x-0 bottom-0 h-1.5 overflow-hidden rounded-b-[14px] bg-line" aria-hidden>
            <span className="block h-full bg-accent" style={{ width: `${(leftS / duration) * 100}%` }} />
          </span>
        )}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[15px] text-fg-2 tabular">
        <span>
          <span className="font-semibold text-fg">{fmt(leftS, 1)}</span> {t.secShort} {t.timeLeft}
        </span>
        <span>
          <span className="font-semibold text-fg">{running ? fmt(liveCps, 1) : result ? fmt(result.cps, 1) : "0"}</span> CPS
        </span>
        <span>
          <span className="font-semibold text-fg">{result && !running ? result.clicks : clicks}</span> {t.clicks(result && !running ? result.clicks : clicks)}
        </span>
      </div>

      <div aria-live="polite" className="flex min-h-10 flex-wrap items-center justify-center gap-3">
        {showResult && (
          <>
            <span className="text-[15px] text-fg">{t.result(result.clicks, result.seconds, fmt(result.cps))}</span>
            <Badge tone="accent">{CPS_RANK_LABELS[locale][cpsRank(result.cps)]}</Badge>
            {result.record && <Badge tone="ok">{t.newBest}</Badge>}
            {phase === "done" && (
              <Button variant="outline" size="sm" onClick={() => reset()}>
                <RotateCcw aria-hidden />
                {t.again}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
