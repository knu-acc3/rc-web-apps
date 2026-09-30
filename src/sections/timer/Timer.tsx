"use client";

import { Pause, Play, Plus, RotateCcw, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Kbd } from "@/ui/panel";
import { useFullscreen, useWakeLock } from "@/sections/time/lib/use-fullscreen";
import { TimerOptions, useAlertOptions } from "./TimerOptions";
import { hasPlayed, schedule, unlockAudio, type Scheduled } from "./lib/audio";
import { clampInt, clock, durationShort, durationText, hms } from "./lib/format";
import { useKeys } from "./lib/keys";
import { nowMs } from "./lib/now";
import { notify, useTicker, useTitle } from "./lib/notify";

export interface TimerProps {
  locale: Locale;
  /** Preset duration in seconds. */
  seconds?: number;
}

const T = {
  ru: {
    start: "Старт",
    pause: "Пауза",
    resume: "Продолжить",
    reset: "Сброс",
    stop: "Стоп",
    add: "+1 мин",
    h: "Часы",
    m: "Минуты",
    s: "Секунды",
    done: "Время вышло!",
    doneFor: (d: string) => `Таймер на ${d} завершён`,
    presets: "Быстрый выбор",
    keys: [["Space", "старт/пауза"], ["R", "сброс"], ["F", "весь экран"]],
    title: "Таймер",
  },
  en: {
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    stop: "Stop",
    add: "+1 min",
    h: "Hours",
    m: "Minutes",
    s: "Seconds",
    done: "Time's up!",
    doneFor: (d: string) => `${d} timer finished`,
    presets: "Quick picks",
    keys: [["Space", "start/pause"], ["R", "reset"], ["F", "full screen"]],
    title: "Timer",
  },
} as const;

const PRESETS = [60, 180, 300, 600, 900, 1800, 3600];
type Status = "idle" | "running" | "paused" | "done";

export default function Timer({ locale, seconds = 300 }: TimerProps) {
  const t = T[locale];
  const id = useId();
  const [dur, setDur] = useState(seconds);
  const [fields, setFields] = useState(() => {
    const x = hms(seconds);
    return { h: String(x.h).padStart(2, "0"), m: String(x.m).padStart(2, "0"), s: String(x.s).padStart(2, "0") };
  });
  const [status, setStatus] = useState<Status>("idle");
  const [left, setLeft] = useState(seconds * 1000);
  const [over, setOver] = useState(0);
  const endAt = useRef(0);
  const sound = useRef<Scheduled | null>(null);
  const [opts, setOpts] = useAlertOptions();
  const { ref, active: full, toggle: toggleFull } = useFullscreen<HTMLDivElement>();
  useWakeLock(status === "running");

  const running = status === "running";

  function cancelSound() {
    sound.current?.stop();
    sound.current = null;
  }

  function arm(ms: number) {
    cancelSound();
    if (opts.sound !== "off") sound.current = schedule(opts.sound, ms / 1000, 4);
  }

  function start() {
    if (status === "running") return;
    unlockAudio();
    const ms = status === "paused" ? left : dur * 1000;
    if (ms <= 0) return;
    endAt.current = nowMs() + ms;
    setLeft(ms);
    setOver(0);
    arm(ms);
    setStatus("running");
  }

  function pause() {
    if (!running) return;
    const ms = Math.max(0, endAt.current - nowMs());
    cancelSound();
    setLeft(ms);
    setStatus("paused");
  }

  function reset() {
    cancelSound();
    setLeft(dur * 1000);
    setOver(0);
    setStatus("idle");
  }

  function addMinute() {
    if (running) {
      endAt.current += 60000;
      const ms = endAt.current - nowMs();
      setLeft(ms);
      arm(ms);
    } else if (status === "paused") setLeft((l) => l + 60000);
    else setDuration(dur + 60);
  }

  function finish() {
    setStatus("done");
    setLeft(0);
    if (opts.sound !== "off" && !hasPlayed(sound.current)) {
      cancelSound();
      sound.current = schedule(opts.sound, 0, 4);
    }
    if (opts.notify) notify(t.done, t.doneFor(durationText(dur, locale)));
  }

  // Drift-free: remaining time is always endAt − now.
  useTicker(running || status === "done", () => {
    if (status === "running") {
      const ms = endAt.current - nowMs();
      if (ms <= 0) finish();
      else setLeft(ms);
    } else if (status === "done") {
      setOver(nowMs() - endAt.current);
    }
  });

  // Changing the sound while running re-schedules (or cancels) the finish sound.
  const soundRef = useRef(opts.sound);
  useEffect(() => {
    if (soundRef.current === opts.sound) return;
    soundRef.current = opts.sound;
    if (status === "running") {
      cancelSound();
      if (opts.sound !== "off") sound.current = schedule(opts.sound, Math.max(0, endAt.current - nowMs()) / 1000, 4);
    }
  });

  useEffect(() => () => sound.current?.stop(), []);

  useTitle(running || status === "paused" ? clock(left) : status === "done" ? t.done : null);
  useKeys({ " ": () => (running ? pause() : status === "done" ? reset() : start()), r: reset });

  function setDuration(sec: number) {
    const v = Math.max(0, Math.min(99 * 3600 + 59 * 60 + 59, sec));
    setDur(v);
    const x = hms(v);
    setFields({ h: String(x.h).padStart(2, "0"), m: String(x.m).padStart(2, "0"), s: String(x.s).padStart(2, "0") });
    setLeft(v * 1000);
    if (status === "done") setStatus("idle");
  }

  function onField(k: "h" | "m" | "s", text: string) {
    const clean = text.replace(/\D/g, "").slice(0, 2);
    const next = { ...fields, [k]: clean };
    setFields(next);
    const sec = clampInt(next.h, 99) * 3600 + clampInt(next.m, 59) * 60 + clampInt(next.s, 59);
    setDur(sec);
    setLeft(sec * 1000);
  }

  const editable = status === "idle" || status === "done";
  const shown = clock(status === "done" ? 0 : left, { forceHours: true, padHours: true });
  const big = full ? "text-[min(22vw,40vh)]" : "text-[min(19vw,128px)]";
  const field = (k: "h" | "m" | "s", label: string) => (
    <input
      id={`${id}-${k}`}
      aria-label={label}
      inputMode="numeric"
      autoComplete="off"
      value={fields[k]}
      onChange={(e) => onField(k, e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => setFields((f) => ({ ...f, [k]: String(clampInt(f[k], k === "h" ? 99 : 59)).padStart(2, "0") }))}
      className="tabular w-[2.1ch] rounded-[0.12em] bg-transparent text-center font-semibold text-fg outline-none hover:bg-surface-2 focus:bg-accent-soft"
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-6 rounded-[12px] border border-line bg-surface px-3 py-8 sm:py-10",
          full && "min-h-screen rounded-none border-0",
          status === "done" && "border-accent",
        )}
      >
        {editable ? (
          <div className={cn("flex items-baseline leading-none tracking-tight", big)}>
            {field("h", t.h)}
            <span className="text-fg-3">:</span>
            {field("m", t.m)}
            <span className="text-fg-3">:</span>
            {field("s", t.s)}
          </div>
        ) : (
          <div className={cn("tabular font-semibold leading-none tracking-tight text-fg", big, status === "paused" && "text-fg-2")}>{shown}</div>
        )}

        <p className="min-h-7 text-lg font-semibold text-accent" aria-live="polite">
          {status === "done" ? `${t.done} +${clock(over, { up: true })}` : ""}
        </p>

        <div className="flex items-center gap-2">
          {status === "done" ? (
            <Button variant="primary" size="lg" onClick={reset} className="min-w-40">
              <Square aria-hidden />
              {t.stop}
            </Button>
          ) : running ? (
            <Button variant="primary" size="lg" onClick={pause} className="min-w-40">
              <Pause aria-hidden />
              {t.pause}
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={start} disabled={dur === 0 && status === "idle"} className="min-w-40">
              <Play aria-hidden />
              {status === "paused" ? t.resume : t.start}
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={addMinute} aria-label={t.add} title={t.add}>
            <Plus aria-hidden />
            <span className="max-sm:sr-only">1</span>
          </Button>
          <Button variant="ghost" size="lg" onClick={reset} disabled={status === "idle"} aria-label={t.reset} title={t.reset}>
            <RotateCcw aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.presets}>
        {PRESETS.map((p) => (
          <button key={p} type="button" className={cn("chip h-8! px-3! text-[13px]!", dur === p && editable && "border-accent! text-accent!")} onClick={() => (editable ? setDuration(p) : undefined)} disabled={!editable}>
            {durationShort(p, locale)}
          </button>
        ))}
      </div>

      <TimerOptions locale={locale} options={opts} onChange={setOpts} onFullscreen={toggleFull} />
      <p className="hidden flex-wrap gap-x-4 text-[13px] text-fg-3 sm:flex">
        {t.keys.map(([k, label]) => (
          <span key={k}>
            <Kbd>{k}</Kbd> {label}
          </span>
        ))}
      </p>
    </div>
  );
}
