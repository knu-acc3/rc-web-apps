"use client";

import { AlarmClock, AlarmClockOff, BellRing } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { useBrowser12h } from "@/lib/clock-format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { useStoredJson } from "@/tools/time/time/lib/storage";
import { useNow } from "@/tools/time/time/lib/use-now";
import { useWakeLock } from "@/ui/stage";
import { TimerOptions, useAlertOptions } from "./ui/TimerOptions";
import { hasPlayed, schedule, unlockAudio, type Scheduled } from "./lib/audio";
import { nextOccurrence } from "./lib/alarm";
import { durationText } from "./lib/format";
import { nowMs } from "./lib/now";
import { notify, useTicker, useTitle } from "./lib/notify";

export interface AlarmProps {
  locale: Locale;
  /** "07:00" */
  time?: string;
}

type Status = "idle" | "armed" | "ringing";

const T = {
  ru: {
    label: "Время будильника",
    now: "Сейчас",
    set: "Завести будильник",
    cancel: "Отменить",
    off: "Выключить",
    snooze: "Отложить на 5 минут",
    in: (d: string, when: string) => `Прозвенит через ${d} — ${when}`,
    today: "сегодня",
    tomorrow: "завтра",
    ringing: "Будильник!",
    wake: "Не гасить экран",
    honest:
      "Будильник работает, пока эта вкладка открыта, а компьютер или телефон не уходит в сон. Перед сном проверьте звук кнопкой «Проверить звук» и не закрывайте вкладку; на телефоне надёжнее встроенный будильник.",
    body: (t: string) => `Будильник на ${t}`,
  },
  en: {
    label: "Alarm time",
    now: "Now",
    set: "Set alarm",
    cancel: "Cancel",
    off: "Turn off",
    snooze: "Snooze 5 minutes",
    in: (d: string, when: string) => `Rings in ${d} — ${when}`,
    today: "today",
    tomorrow: "tomorrow",
    ringing: "Alarm!",
    wake: "Keep screen on",
    honest:
      "The alarm works while this tab stays open and your computer or phone does not go to sleep. Test the sound with 'Test sound' before relying on it and keep the tab open; on a phone the built-in alarm is more reliable.",
    body: (t: string) => `Alarm for ${t}`,
  },
} as const;

const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const p2 = (n: number) => String(n).padStart(2, "0");

export default function Alarm({ locale, time = "07:00" }: AlarmProps) {
  const t = T[locale];
  const h12 = useBrowser12h();
  const id = useId();
  const now = useNow();
  const [value, setValue] = useState(time);
  const [status, setStatus] = useState<Status>("idle");
  const [target, setTarget] = useState(0);
  const sound = useRef<Scheduled | null>(null);
  const [opts, setOpts] = useAlertOptions();
  const [wake, setWake] = useStoredJson<boolean>("alarm:wake:v1", true, isBool);
  useWakeLock(wake && status !== "idle");

  function cancelSound() {
    sound.current?.stop();
    sound.current = null;
  }
  function armSound(at: number) {
    cancelSound();
    if (opts.sound !== "off") sound.current = schedule(opts.sound, (at - nowMs()) / 1000, 10);
  }
  function arm(at: number) {
    unlockAudio();
    setTarget(at);
    armSound(at);
    setStatus("armed");
  }
  function ring() {
    setStatus("ringing");
    if (opts.sound !== "off" && !hasPlayed(sound.current)) {
      cancelSound();
      sound.current = schedule(opts.sound, 0, 10);
    }
    if (opts.notify) notify(t.ringing, t.body(value));
  }
  function off() {
    cancelSound();
    setStatus("idle");
  }

  useTicker(status === "armed", () => {
    if (nowMs() >= target) ring();
  }, 1000);

  const soundRef = useRef(opts.sound);
  useEffect(() => {
    if (soundRef.current === opts.sound) return;
    soundRef.current = opts.sound;
    if (status === "armed") armSound(target);
  });
  useEffect(() => () => sound.current?.stop(), []);

  useTitle(status === "ringing" ? t.ringing : status === "armed" ? `⏰ ${value}` : null);

  const valid = /^\d{2}:\d{2}$/.test(value);
  const nowD = now !== null ? new Date(now) : null;
  let info = "";
  if (status === "armed" && now !== null) {
    const ms = Math.max(0, target - now);
    const minutes = Math.ceil(ms / 60000);
    const tDate = new Date(target);
    const sameDay = nowD && tDate.getDate() === nowD.getDate();
    info = t.in(durationText(minutes * 60, locale), `${sameDay ? t.today : t.tomorrow}, ${value}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className={cn("flex flex-col items-center gap-5 px-3 py-8 transition-colors sm:py-10", status === "ringing" && "bg-accent-soft ring-2 ring-accent")}>
        <p className="tabular text-sm text-fg-3">
          {t.now}: {nowD ? `${p2(nowD.getHours())}:${p2(nowD.getMinutes())}:${p2(nowD.getSeconds())}` : "--:--:--"}
        </p>
        <label htmlFor={`${id}-t`} className="sr-only">
          {t.label}
        </label>
        <input
          id={`${id}-t`}
          type="time"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (status === "armed" && /^\d{2}:\d{2}$/.test(e.target.value)) arm(nextOccurrence(e.target.value, nowMs()));
          }}
          className={cn(
            h12 ? "text-[min(12vw,5rem)]" : "text-[min(17vw,7rem)]",
            "tabular w-full min-w-0 max-w-[28rem] cursor-text rounded-[1.25rem] bg-surface-2 px-3 py-2 text-center leading-none font-semibold tracking-tight text-fg transition-colors outline-none hover:bg-accent-container hover:text-on-accent-container focus:bg-accent-container focus:text-on-accent-container focus:ring-2 focus:ring-accent",
          )}
        />
        <p className="min-h-7 text-lg text-fg-2" aria-live="polite">
          {status === "ringing" ? <span className="font-semibold text-accent">{t.ringing}</span> : info}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {status === "idle" && (
            <Button variant="filled" size="xl" onClick={() => arm(nextOccurrence(value, nowMs()))} disabled={!valid} className="min-w-52">
              <AlarmClock aria-hidden />
              {t.set}
            </Button>
          )}
          {status === "armed" && (
            <Button variant="tonal" size="xl" onClick={off} className="min-w-52">
              <AlarmClockOff aria-hidden />
              {t.cancel}
            </Button>
          )}
          {status === "ringing" && (
            <>
              <Button variant="filled" size="xl" onClick={off} className="min-w-44 motion-safe:animate-pulse">
                <BellRing aria-hidden />
                {t.off}
              </Button>
              <Button variant="tonal" size="xl" onClick={() => arm(nowMs() + 5 * 60000)}>
                {t.snooze}
              </Button>
            </>
          )}
        </div>
      </Panel>
      <Switch label={t.wake} checked={wake} onChange={(e) => setWake(e.target.checked)} />
      <TimerOptions locale={locale} options={opts} onChange={setOpts} />
      <Notice>{t.honest}</Notice>
    </div>
  );
}
