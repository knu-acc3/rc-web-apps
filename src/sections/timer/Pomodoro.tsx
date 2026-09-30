"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/field";
import { useStoredJson } from "@/sections/time/lib/storage";
import { useFullscreen, useWakeLock } from "@/sections/time/lib/use-fullscreen";
import { TimerOptions, useAlertOptions } from "./TimerOptions";
import { schedule, unlockAudio, type Scheduled } from "./lib/audio";
import { clampInt, clock } from "./lib/format";
import { useKeys } from "./lib/keys";
import { nowMs } from "./lib/now";
import { notify, useTicker, useTitle } from "./lib/notify";

export interface PomodoroProps {
  locale: Locale;
  work?: number;
  short?: number;
  long?: number;
  cycles?: number;
}

type Phase = "work" | "short" | "long";
type Status = "idle" | "running" | "paused";

const T = {
  ru: {
    work: "Работа",
    short: "Короткий перерыв",
    long: "Длинный перерыв",
    start: "Старт",
    pause: "Пауза",
    resume: "Продолжить",
    skip: "Пропустить",
    reset: "Сброс",
    auto: "Автозапуск следующего этапа",
    min: "мин",
    cyclesLabel: "Помидоров до длинного перерыва",
    workLabel: "Работа, мин",
    shortLabel: "Перерыв, мин",
    longLabel: "Длинный, мин",
    done: (n: number) => `Помидоров за сессию: ${n}`,
    toBreak: "Время перерыва",
    toWork: "Пора за работу",
    toBreakBody: (m: number) => `Отдохните ${m} мин.`,
    toWorkBody: (m: number) => `Следующий помидор — ${m} мин.`,
  },
  en: {
    work: "Focus",
    short: "Short break",
    long: "Long break",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    skip: "Skip",
    reset: "Reset",
    auto: "Auto-start next phase",
    min: "min",
    cyclesLabel: "Pomodoros before a long break",
    workLabel: "Focus, min",
    shortLabel: "Break, min",
    longLabel: "Long, min",
    done: (n: number) => `Pomodoros this session: ${n}`,
    toBreak: "Break time",
    toWork: "Back to work",
    toBreakBody: (m: number) => `Rest for ${m} min.`,
    toWorkBody: (m: number) => `Next pomodoro: ${m} min.`,
  },
} as const;

const isBool = (v: unknown): v is boolean => typeof v === "boolean";

export default function Pomodoro({ locale, work: w0 = 25, short: s0 = 5, long: l0 = 15, cycles: c0 = 4 }: PomodoroProps) {
  const t = T[locale];
  const id = useId();
  const [cfg, setCfg] = useState({ work: w0, short: s0, long: l0, cycles: c0 });
  const [txt, setTxt] = useState({ work: String(w0), short: String(s0), long: String(l0), cycles: String(c0) });
  const [phase, setPhase] = useState<Phase>("work");
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [left, setLeft] = useState(w0 * 60000);
  const endAt = useRef(0);
  const sound = useRef<Scheduled | null>(null);
  const [opts, setOpts] = useAlertOptions();
  const [auto, setAuto] = useStoredJson<boolean>("pomodoro:auto:v1", true, isBool);
  const { ref, active: full, toggle } = useFullscreen<HTMLDivElement>();
  useWakeLock(status === "running");

  const minutesOf = (p: Phase, c = cfg) => (p === "work" ? c.work : p === "short" ? c.short : c.long);
  const nextPhase = (p: Phase, done: number): Phase => (p !== "work" ? "work" : done % cfg.cycles === 0 ? "long" : "short");

  function cancelSound() {
    sound.current?.stop();
    sound.current = null;
  }
  function arm(ms: number) {
    cancelSound();
    if (opts.sound !== "off") sound.current = schedule(opts.sound, ms / 1000, 1);
  }

  function start() {
    if (status === "running") return;
    unlockAudio();
    const ms = status === "paused" ? left : minutesOf(phase) * 60000;
    endAt.current = nowMs() + ms;
    setLeft(ms);
    arm(ms);
    setStatus("running");
  }
  function pause() {
    cancelSound();
    setLeft(Math.max(0, endAt.current - nowMs()));
    setStatus("paused");
  }
  function reset() {
    cancelSound();
    setStatus("idle");
    setPhase("work");
    setCount(0);
    setLeft(cfg.work * 60000);
  }

  /** Move to the next phase; `at` = when the finished phase ended (keeps chains drift-free). */
  function advance(at: number, byUser: boolean) {
    let p = phase;
    let done = count;
    let end = at;
    // Catch up on phases that elapsed while the tab slept (auto mode only).
    for (;;) {
      if (p === "work") done += 1;
      const np = nextPhase(p, done);
      p = np;
      if (!auto || byUser) break;
      const nextEnd = end + minutesOf(np) * 60000;
      if (nextEnd > nowMs()) {
        end = nextEnd;
        break;
      }
      end = nextEnd;
    }
    setPhase(p);
    setCount(done);
    const isBreak = p !== "work";
    if (!byUser && opts.notify) notify(isBreak ? t.toBreak : t.toWork, isBreak ? t.toBreakBody(minutesOf(p)) : t.toWorkBody(cfg.work));
    if (auto && !byUser) {
      endAt.current = end;
      const ms = end - nowMs();
      setLeft(ms);
      arm(ms);
      setStatus("running");
    } else {
      cancelSound();
      setLeft(minutesOf(p) * 60000);
      setStatus("idle");
    }
  }

  useTicker(status === "running", () => {
    const ms = endAt.current - nowMs();
    if (ms <= 0) advance(endAt.current, false);
    else setLeft(ms);
  });

  // Sound changed while running → re-arm.
  const soundRef = useRef(opts.sound);
  useEffect(() => {
    if (soundRef.current === opts.sound) return;
    soundRef.current = opts.sound;
    if (status === "running") arm(Math.max(0, endAt.current - nowMs()));
  });
  useEffect(() => () => sound.current?.stop(), []);

  useTitle(status === "idle" ? null : `${clock(left)} ${phase === "work" ? "🍅" : "☕"}`);
  useKeys({ " ": () => (status === "running" ? pause() : start()), r: reset });

  function setField(k: keyof typeof cfg, text: string) {
    const clean = text.replace(/\D/g, "").slice(0, 3);
    setTxt((x) => ({ ...x, [k]: clean }));
    const v = clampInt(clean, k === "cycles" ? 12 : 180);
    if (v < 1) return;
    const next = { ...cfg, [k]: v };
    setCfg(next);
    if (status === "idle") setLeft(minutesOf(phase, next) * 60000);
  }

  const phaseLabel = t[phase];
  const inCycle = count % cfg.cycles;
  const dots = Array.from({ length: cfg.cycles }, (_, i) => i < inCycle || (phase === "long" && inCycle === 0 && count > 0));

  return (
    <div className="flex flex-col gap-4">
      <div ref={ref} className={cn("flex flex-col items-center justify-center gap-5 rounded-[12px] border border-line bg-surface px-3 py-8 sm:py-10", full && "min-h-screen rounded-none border-0", phase !== "work" && "bg-ok-soft")}>
        <p className={cn("text-lg font-semibold", phase === "work" ? "text-accent" : "text-ok")}>{phaseLabel}</p>
        <div className={cn("tabular font-semibold leading-none tracking-tight", full ? "text-[min(24vw,40vh)]" : "text-[min(20vw,128px)]", status === "paused" ? "text-fg-2" : "text-fg")}>{clock(left)}</div>
        <div className="flex items-center gap-1.5" aria-label={t.done(count)} role="img">
          {dots.map((on, i) => (
            <span key={i} className={cn("size-2.5 rounded-full", on ? "bg-accent" : "bg-line-strong")} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {status === "running" ? (
            <Button variant="primary" size="lg" onClick={pause} className="min-w-36">
              <Pause aria-hidden />
              {t.pause}
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={start} className="min-w-36">
              <Play aria-hidden />
              {status === "paused" ? t.resume : t.start}
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={() => advance(nowMs(), true)} aria-label={t.skip} title={t.skip}>
            <SkipForward aria-hidden />
          </Button>
          <Button variant="ghost" size="lg" onClick={reset} aria-label={t.reset} title={t.reset}>
            <RotateCcw aria-hidden />
          </Button>
        </div>
        <p className="text-sm text-fg-3" aria-live="polite">
          {t.done(count)}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {(
          [
            ["work", t.workLabel],
            ["short", t.shortLabel],
            ["long", t.longLabel],
            ["cycles", t.cyclesLabel],
          ] as const
        ).map(([k, label]) => (
          <label key={k} htmlFor={`${id}-${k}`} className="flex flex-col gap-1 text-[13px] text-fg-3">
            {label}
            <input
              id={`${id}-${k}`}
              inputMode="numeric"
              className="control h-9 w-20 text-sm"
              value={txt[k]}
              onChange={(e) => setField(k, e.target.value)}
              onBlur={() => setTxt((x) => ({ ...x, [k]: String(cfg[k]) }))}
              disabled={status === "running"}
            />
          </label>
        ))}
        <Switch label={t.auto} checked={auto} onChange={(e) => setAuto(e.target.checked)} className="mb-1.5" />
      </div>
      <TimerOptions locale={locale} options={opts} onChange={setOpts} onFullscreen={toggle} />
    </div>
  );
}
