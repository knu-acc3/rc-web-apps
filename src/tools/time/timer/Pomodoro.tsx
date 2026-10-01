"use client";

import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/ui/button";
import { Field, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { useStoredJson } from "@/tools/time/time/lib/storage";
import { useFullscreen } from "@/ui/fullscreen";
import { useWakeLock } from "@/ui/stage";
import { TimerOptions, useAlertOptions } from "./ui/TimerOptions";
import { schedule, unlockAudio, type Scheduled } from "./lib/audio";
import { clock } from "./lib/format";
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
    full: "На весь экран",
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
    full: "Full screen",
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

  function setField(k: keyof typeof cfg, v: number | null) {
    if (v === null || v < 1) return;
    const next = { ...cfg, [k]: Math.min(v, k === "cycles" ? 12 : 180) };
    setCfg(next);
    if (status === "idle") setLeft(minutesOf(phase, next) * 60000);
  }

  const phaseLabel = t[phase];
  const inCycle = count % cfg.cycles;
  const dots = Array.from({ length: cfg.cycles }, (_, i) => i < inCycle || (phase === "long" && inCycle === 0 && count > 0));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-start">
      <Panel
        ref={ref}
        className={cn("flex flex-col items-center justify-center gap-5 px-3 py-8 transition-colors duration-500 sm:py-10", full && "min-h-screen rounded-none! shadow-none!", phase !== "work" && "bg-ok-soft")}
      >
        <p className={cn("rounded-full px-4 py-1 text-lg font-semibold", phase === "work" ? "bg-accent-container text-on-accent-container" : "bg-surface text-ok")}>{phaseLabel}</p>
        <div className={cn("tabular font-semibold leading-none tracking-tight", full ? "text-[min(24vw,40vh)]" : "text-[min(20vw,8rem)] 2xl:text-[10rem]", status === "paused" ? "text-fg-2" : "text-fg")}>{clock(left)}</div>
        <div className="flex items-center gap-1.5" aria-label={t.done(count)} role="img">
          {dots.map((on, i) => (
            <span key={i} className={cn("size-3 rounded-full transition-colors", on ? "bg-accent" : "bg-line-strong")} />
          ))}
        </div>
        <div className="flex w-full max-w-lg flex-wrap items-center justify-center gap-2 sm:gap-3">
          {status === "running" ? (
            <Button variant="filled" size="xl" onClick={pause} className="min-w-40 flex-1 sm:max-w-60">
              <Pause aria-hidden />
              {t.pause}
            </Button>
          ) : (
            <Button variant="filled" size="xl" onClick={start} className="min-w-40 flex-1 sm:max-w-60">
              <Play aria-hidden />
              {status === "paused" ? t.resume : t.start}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <IconButton label={t.skip} variant="tonal" size="lg" onClick={() => advance(nowMs(), true)} icon={<SkipForward aria-hidden />} />
            <IconButton label={t.reset} size="lg" onClick={reset} icon={<RotateCcw aria-hidden />} />
            <IconButton label={t.full} size="lg" onClick={toggle} icon={full ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />} />
          </div>
        </div>
        <p className="text-sm text-fg-3" aria-live="polite">
          {t.done(count)}
        </p>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="grid grid-cols-2 gap-x-3 gap-y-4 p-4 sm:grid-cols-4 sm:p-5 lg:grid-cols-2">
          {(
            [
              ["work", t.workLabel],
              ["short", t.shortLabel],
              ["long", t.longLabel],
              ["cycles", t.cyclesLabel],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label} htmlFor={`${id}-${k}`} className="justify-end">
              <NumberInput id={`${id}-${k}`} locale={locale} value={cfg[k]} onChange={(v) => setField(k, v)} min={1} max={k === "cycles" ? 12 : 180} disabled={status === "running"} />
            </Field>
          ))}
          <Switch label={t.auto} checked={auto} onChange={(e) => setAuto(e.target.checked)} className="col-span-full" />
        </Panel>
        <TimerOptions locale={locale} options={opts} onChange={setOpts} />
      </div>
    </div>
  );
}
