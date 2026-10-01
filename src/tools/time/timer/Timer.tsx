"use client";

import { ChevronDown, ChevronUp, Maximize2, Minimize2, Pause, Play, Plus, RotateCcw, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { linkHere, useQueryParam } from "@/lib/share-link";
import { Button, IconButton } from "@/ui/button";
import { useFullscreen } from "@/ui/fullscreen";
import { Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { ShareLink } from "@/ui/share-link";
import { ToolTitle } from "@/ui/tool-title";
import { useWakeLock } from "@/ui/stage";
import { TimerOptions, useAlertOptions } from "./ui/TimerOptions";
import { hasPlayed, schedule, unlockAudio, type Scheduled } from "./lib/audio";
import { clampInt, clock, durationParam, durationShort, durationText, hms, parseDurationParam } from "./lib/format";
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
    full: "На весь экран",
    title: "Таймер",
    namePh: "Например, пицца в духовке",
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
    full: "Full screen",
    title: "Timer",
    namePh: "E.g. pizza in the oven",
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

  // A shared link (?t=10m) sets the length once the page is live; the server renders the page's own default.
  const urlT = useQueryParam("t");
  const urlName = useQueryParam("n");
  const [name, setName] = useState("");
  const urlKey = urlT === null && urlName === null ? null : `${urlT}|${urlName}`;
  const [seenUrl, setSeenUrl] = useState<string | null>(null);
  if (urlKey !== seenUrl) {
    setSeenUrl(urlKey);
    if (urlName) setName(urlName.slice(0, 60));
    const sec = urlT ? parseDurationParam(urlT) : null;
    if (sec && status === "idle") {
      const x = hms(sec);
      setDur(sec);
      setFields({ h: String(x.h).padStart(2, "0"), m: String(x.m).padStart(2, "0"), s: String(x.s).padStart(2, "0") });
      setLeft(sec * 1000);
    }
  }

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
    if (opts.notify) notify(name || t.done, t.doneFor(durationText(dur, locale)));
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

  useTitle(running || status === "paused" ? `${clock(left)}${name ? ` · ${name}` : ""}` : status === "done" ? (name ? `${t.done} ${name}` : t.done) : null);
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
  const big = full ? "text-[min(20vw,36vh)]" : "text-[min(18vw,8rem)] 2xl:text-[10rem]";
  const UNIT = { h: 3600, m: 60, s: 1 } as const;
  const LABEL = { h: t.h, m: t.m, s: t.s } as const;
  const bump = (k: "h" | "m" | "s", dir: 1 | -1) => setDuration(dur + dir * UNIT[k]);
  const pair = (k: "h" | "m" | "s") => (
    <div className="flex flex-col items-center gap-[0.06em]">
      <IconButton
        label={`${LABEL[k]} +1`}
        size="sm"
        variant="tonal"
        onClick={() => bump(k, 1)}
        className={cn("text-base", !editable && "invisible")}
        tabIndex={editable ? undefined : -1}
        icon={<ChevronUp aria-hidden />}
      />
      {editable ? (
        <input
          id={`${id}-${k}`}
          aria-label={LABEL[k]}
          inputMode="numeric"
          autoComplete="off"
          value={fields[k]}
          onChange={(e) => onField(k, e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              bump(k, e.key === "ArrowUp" ? 1 : -1);
            }
          }}
          onBlur={() => setFields((f) => ({ ...f, [k]: String(clampInt(f[k], k === "h" ? 99 : 59)).padStart(2, "0") }))}
          className="tabular w-[2.3ch] cursor-text rounded-[0.14em] bg-surface-2 text-center font-semibold text-fg caret-accent outline-none transition-colors hover:bg-accent-container hover:text-on-accent-container focus:bg-accent-container focus:text-on-accent-container focus:ring-[0.04em] focus:ring-accent"
        />
      ) : (
        <span className="tabular w-[2.3ch] text-center font-semibold">{shown.split(":")[k === "h" ? 0 : k === "m" ? 1 : 2]}</span>
      )}
      <IconButton
        label={`${LABEL[k]} −1`}
        size="sm"
        variant="tonal"
        onClick={() => bump(k, -1)}
        disabled={editable && dur < UNIT[k]}
        className={cn("text-base", !editable && "invisible")}
        tabIndex={editable ? undefined : -1}
        icon={<ChevronDown aria-hidden />}
      />
    </div>
  );
  const colon = <span className="pb-[0.04em] text-fg-3">:</span>;

  return (
    <div className="flex flex-col gap-4">
      <Panel
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-5 px-3 py-6 transition-shadow sm:py-8",
          full && "min-h-screen rounded-none! shadow-none!",
          status === "done" && "ring-2 ring-accent",
        )}
      >
        <ToolTitle value={name} onChange={setName} locale={locale} placeholder={t.namePh} full={full} />
        <div className={cn("flex items-center leading-none tracking-tight", big, status === "paused" ? "text-fg-2" : "text-fg")}>
          {pair("h")}
          {colon}
          {pair("m")}
          {colon}
          {pair("s")}
        </div>

        <p className="min-h-7 text-lg font-semibold text-accent" aria-live="polite">
          {status === "done" ? `${t.done} +${clock(over, { up: true })}` : ""}
        </p>

        <div className="flex w-full max-w-lg flex-wrap items-center justify-center gap-2 sm:gap-3">
          {status === "done" ? (
            <Button variant="filled" size="xl" onClick={reset} className="min-w-40 flex-1 sm:max-w-60">
              <Square aria-hidden />
              {t.stop}
            </Button>
          ) : running ? (
            <Button variant="filled" size="xl" onClick={pause} className="min-w-40 flex-1 sm:max-w-60">
              <Pause aria-hidden />
              {t.pause}
            </Button>
          ) : (
            <Button variant="filled" size="xl" onClick={start} disabled={dur === 0 && status === "idle"} className="min-w-40 flex-1 sm:max-w-60">
              <Play aria-hidden />
              {status === "paused" ? t.resume : t.start}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button variant="tonal" size="xl" onClick={addMinute} aria-label={t.add} title={t.add} className="px-5">
              <Plus aria-hidden />
              <span aria-hidden>1</span>
            </Button>
            <IconButton label={`${t.reset} (R)`} size="lg" variant="tonal" onClick={reset} disabled={status === "idle"} icon={<RotateCcw aria-hidden />} />
            <IconButton label={`${t.full} (F)`} size="lg" onClick={toggleFull} icon={full ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />} />
          </div>
        </div>
      </Panel>

      <div className="flex items-center gap-2">
        <ScrollRow label={t.presets} className="flex-1">
          {PRESETS.map((p) => (
            <button key={p} type="button" aria-pressed={dur === p && editable} className="chip" onClick={() => (editable ? setDuration(p) : undefined)} disabled={!editable}>
              {durationShort(p, locale)}
            </button>
          ))}
        </ScrollRow>
        <ShareLink locale={locale} url={() => linkHere({ query: { ...(dur > 0 ? { t: durationParam(dur) } : {}), ...(name.trim() ? { n: name.trim() } : {}) } })} className="shrink-0" />
      </div>

      <TimerOptions locale={locale} options={opts} onChange={setOpts} />
    </div>
  );
}
