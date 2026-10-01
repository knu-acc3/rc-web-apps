"use client";

import { Droplets, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Slider } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { fadeGain, resumeAudio, smoothSet } from "../lib/audio";

const FREQ = 165;

const T = {
  ru: {
    start: "Запустить тон 165 Гц",
    stop: "Остановить",
    duration: "Длительность",
    s: "с",
    mode: "Звук",
    steady: "Непрерывный",
    pulse: "Импульсы",
    volume: "Громкость",
    left: "Осталось",
    before: "Перед запуском: снимите чехол, отключите наушники и Bluetooth-колонки, положите телефон динамиком вниз.",
    err: "Не удалось запустить звук в этом браузере.",
  },
  en: {
    start: "Play the 165 Hz tone",
    stop: "Stop",
    duration: "Duration",
    s: "s",
    mode: "Sound",
    steady: "Continuous",
    pulse: "Pulses",
    volume: "Volume",
    left: "Remaining",
    before: "Before you start: remove the case, disconnect headphones and Bluetooth speakers, place the phone speaker-down.",
    err: "Could not start audio in this browser.",
  },
} as const;

export default function SpeakerCleaner({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [seconds, setSeconds] = useState("30");
  const [mode, setMode] = useState<"steady" | "pulse">("steady");
  const [volume, setVolume] = useState(0.8);
  const [left, setLeft] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const run = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode; master: GainNode; end: number } | null>(null);

  const stop = () => {
    const r = run.current;
    run.current = null;
    setLeft(null);
    if (!r) return;
    const end = fadeGain(r.gain.gain, 0, r.ctx, 0.08);
    r.osc.stop(end + 0.02);
    setTimeout(() => r.master.disconnect(), 200);
  };
  useEffect(() => () => stop(), []);

  async function start() {
    setError(false);
    try {
      const ctx = await resumeAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = FREQ;
      const now = ctx.currentTime;
      const dur = Number(seconds);
      const level = 1;
      const master = ctx.createGain();
      master.gain.value = volume * volume;
      gain.gain.setValueAtTime(0, now);
      if (mode === "pulse") {
        // 0.5 s on / 0.25 s off
        for (let s = 0; s < dur; s += 0.75) {
          gain.gain.setValueAtTime(0, now + s);
          gain.gain.linearRampToValueAtTime(level, now + s + 0.02);
          gain.gain.setValueAtTime(level, now + s + 0.48);
          gain.gain.linearRampToValueAtTime(0, now + s + 0.5);
        }
      } else {
        gain.gain.linearRampToValueAtTime(level, now + 0.05);
        gain.gain.setValueAtTime(level, now + dur - 0.1);
        gain.gain.linearRampToValueAtTime(0, now + dur);
      }
      osc.connect(gain).connect(master).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.05);
      osc.onended = () => {
        if (run.current?.osc === osc) {
          run.current = null;
          setLeft(null);
        }
      };
      run.current = { ctx, osc, gain, master, end: performance.now() + dur * 1000 };
      setLeft(dur);
    } catch {
      setError(true);
    }
  }

  const active = left !== null;
  // Volume can be changed while the tone plays.
  useEffect(() => {
    const r = run.current;
    if (r) smoothSet(r.master.gain, volume * volume, r.ctx, 0.03);
  }, [volume]);
  useEffect(() => {
    if (!active) return;
    const h = setInterval(() => {
      const r = run.current;
      if (r) setLeft(Math.max(0, Math.ceil((r.end - performance.now()) / 1000)));
    }, 250);
    return () => clearInterval(h);
  }, [active]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-6">
        <div className="tabular text-6xl font-bold tracking-tight text-fg" aria-live="off">
          {FREQ} <span className="text-3xl font-semibold text-fg-2">{locale === "ru" ? "Гц" : "Hz"}</span>
        </div>
        <Button variant={active ? "danger" : "primary"} size="lg" onClick={() => (active ? stop() : start())} className="h-16! min-w-60 text-lg!">
          {active ? <Square className="fill-current" aria-hidden /> : <Droplets aria-hidden />}
          {active ? `${t.stop} · ${left} ${t.s}` : t.start}
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <Segmented label={t.duration} value={seconds} onChange={setSeconds} size="sm" options={["15", "30", "60", "120"].map((s) => ({ value: s, label: `${s} ${t.s}` }))} />
          <Segmented label={t.mode} value={mode} onChange={setMode} size="sm" options={[{ value: "steady", label: t.steady }, { value: "pulse", label: t.pulse }]} />
          <label className="flex items-center gap-2 text-sm text-fg-2">
            {t.volume}
            <Slider min={0.2} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-32" aria-label={t.volume} />
            <span className="tabular w-10">{Math.round(volume * 100)}%</span>
          </label>
        </div>
        <p className="max-w-lg text-center text-sm text-fg-3">{t.before}</p>
      </Panel>
      {error && <Notice tone="err">{t.err}</Notice>}
    </div>
  );
}
