"use client";

import { Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/field";
import { useStoredJson } from "@/sections/time/lib/storage";
import { useFullscreen, useWakeLock } from "@/sections/time/lib/use-fullscreen";
import { scheduleTick, unlockAudio, type Scheduled } from "./lib/audio";
import { timeline, type Segment } from "./lib/alarm";
import { clampInt, clock } from "./lib/format";
import { useKeys } from "./lib/keys";
import { nowMs } from "./lib/now";
import { useTicker, useTitle } from "./lib/notify";

export interface IntervalProps {
  locale: Locale;
  work?: number;
  rest?: number;
  rounds?: number;
  prepare?: number;
}

type Status = "idle" | "running" | "paused" | "done";

const T = {
  ru: {
    prepare: "Приготовьтесь",
    work: "Работа",
    rest: "Отдых",
    done: "Готово!",
    round: (r: number, n: number) => `Раунд ${r} из ${n}`,
    total: "Осталось всего",
    start: "Старт",
    pause: "Пауза",
    resume: "Продолжить",
    reset: "Сброс",
    workS: "Работа, с",
    restS: "Отдых, с",
    rounds: "Раунды",
    prepS: "Подготовка, с",
    beeps: "Звуковые сигналы",
    full: "На весь экран",
  },
  en: {
    prepare: "Get ready",
    work: "Work",
    rest: "Rest",
    done: "Done!",
    round: (r: number, n: number) => `Round ${r} of ${n}`,
    total: "Total left",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    workS: "Work, s",
    restS: "Rest, s",
    rounds: "Rounds",
    prepS: "Get ready, s",
    beeps: "Beeps",
    full: "Full screen",
  },
} as const;

const isBool = (v: unknown): v is boolean => typeof v === "boolean";

export default function Interval({ locale, work: w0 = 20, rest: r0 = 10, rounds: n0 = 8, prepare: p0 = 10 }: IntervalProps) {
  const t = T[locale];
  const id = useId();
  const [txt, setTxt] = useState({ work: String(w0), rest: String(r0), rounds: String(n0), prepare: String(p0) });
  const cfg = {
    work: Math.max(1, clampInt(txt.work, 3600)),
    rest: clampInt(txt.rest, 3600),
    rounds: Math.max(1, clampInt(txt.rounds, 99)),
    prepare: clampInt(txt.prepare, 300),
  };
  const segs = useMemo(() => timeline(cfg.prepare, cfg.work, cfg.rest, cfg.rounds), [cfg.prepare, cfg.work, cfg.rest, cfg.rounds]);
  const totalMs = segs[segs.length - 1].end;
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const startAt = useRef(0);
  const ticks = useRef<Scheduled[]>([]);
  const [beeps, setBeeps] = useStoredJson<boolean>("interval:beeps:v1", true, isBool);
  const { ref, active: full, toggle } = useFullscreen<HTMLDivElement>();
  useWakeLock(status === "running");

  function clearTicks() {
    for (const s of ticks.current) s.stop();
    ticks.current = [];
  }
  /** Schedule every remaining countdown beep on the audio clock (exact even in background tabs). */
  function armTicks(from: number) {
    clearTicks();
    if (!beeps) return;
    for (const s of segs) {
      const endIn = (s.end - from) / 1000;
      if (endIn <= 0) continue;
      const add = (h: Scheduled | null) => {
        if (h) ticks.current.push(h);
      };
      for (const k of [3, 2, 1]) if (endIn - k > 0 && s.end - s.start >= k * 1000 + 500) add(scheduleTick(endIn - k));
      add(scheduleTick(endIn, true));
    }
  }

  function start() {
    unlockAudio();
    const from = status === "paused" ? elapsed : 0;
    startAt.current = nowMs() - from;
    setElapsed(from);
    armTicks(from);
    setStatus("running");
  }
  function pause() {
    clearTicks();
    setElapsed(nowMs() - startAt.current);
    setStatus("paused");
  }
  function reset() {
    clearTicks();
    setElapsed(0);
    setStatus("idle");
  }

  useTicker(status === "running", () => {
    const e = nowMs() - startAt.current;
    if (e >= totalMs) {
      setElapsed(totalMs);
      setStatus("done");
    } else setElapsed(e);
  });
  const beepRef = useRef(beeps);
  useEffect(() => {
    if (beepRef.current === beeps) return;
    beepRef.current = beeps;
    if (status === "running") armTicks(nowMs() - startAt.current);
  });
  useEffect(() => () => clearTicks(), []);

  const seg: Segment | undefined = segs.find((s) => elapsed < s.end) ?? (status === "done" ? undefined : segs[0]);
  const segLeft = seg ? seg.end - elapsed : 0;
  const label = status === "done" ? t.done : seg ? t[seg.kind] : t.done;
  const progress = seg ? (elapsed - seg.start) / (seg.end - seg.start) : 1;
  useTitle(status === "running" || status === "paused" ? `${clock(segLeft)} ${label}` : null);
  useKeys({ " ": () => (status === "running" ? pause() : status === "done" ? reset() : start()), r: reset });

  const color = !seg || status === "done" ? "text-accent" : seg.kind === "work" ? "text-err" : seg.kind === "rest" ? "text-ok" : "text-warn";
  const editable = status === "idle" || status === "done";

  return (
    <div className="flex flex-col gap-4">
      <div ref={ref} className={cn("flex flex-col items-center justify-center gap-4 rounded-[0.75rem] border border-line bg-surface px-3 py-8 sm:py-10", full && "min-h-screen rounded-none border-0")}>
        <p className={cn("text-2xl font-bold uppercase tracking-wide", color)}>{label}</p>
        <div className={cn("tabular font-semibold leading-none tracking-tight", full ? "text-[min(26vw,42vh)]" : "text-[min(22vw,8.75rem)]", status === "paused" ? "text-fg-2" : "text-fg")}>{clock(segLeft)}</div>
        <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className={cn("h-full rounded-full", seg?.kind === "rest" ? "bg-ok" : seg?.kind === "prepare" ? "bg-warn" : "bg-err")} style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
        </div>
        <p className="text-[0.9375rem] text-fg-2">
          {seg && seg.round > 0 ? t.round(seg.round, cfg.rounds) : " "}
          <span className="text-fg-3">
            {" · "}
            {t.total} {clock(totalMs - elapsed)}
          </span>
        </p>
        <div className="flex items-center gap-2">
          {status === "running" ? (
            <Button variant="primary" size="lg" onClick={pause} className="min-w-36">
              <Pause aria-hidden />
              {t.pause}
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={() => {
                if (status === "done") reset();
                start();
              }} className="min-w-36">
              <Play aria-hidden />
              {status === "paused" ? t.resume : t.start}
            </Button>
          )}
          <Button variant="ghost" size="lg" onClick={reset} disabled={status === "idle"} aria-label={t.reset} title={t.reset}>
            <RotateCcw aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {(
          [
            ["work", t.workS],
            ["rest", t.restS],
            ["rounds", t.rounds],
            ["prepare", t.prepS],
          ] as const
        ).map(([k, lbl]) => (
          <label key={k} htmlFor={`${id}-${k}`} className="flex flex-col gap-1 text-[0.8125rem] text-fg-3">
            {lbl}
            <input
              id={`${id}-${k}`}
              inputMode="numeric"
              className="control h-9 w-20 text-sm"
              value={txt[k]}
              disabled={!editable}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                setTxt((x) => ({ ...x, [k]: v }));
                if (status === "done") reset();
              }}
            />
          </label>
        ))}
        <Switch label={t.beeps} checked={beeps} onChange={(e) => setBeeps(e.target.checked)} className="mb-1.5" />
        <Button variant="ghost" size="sm" onClick={toggle} className="mb-0.5 ml-auto">
          <Maximize2 aria-hidden />
          {t.full}
        </Button>
      </div>
    </div>
  );
}
