"use client";

import { Hand, Minus, Play, Plus, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Checkbox, Field, Select, Slider } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { resumeAudio } from "../lib/audio";
import { addTap, tempoFromTaps, tempoMarking } from "../lib/bpm";

const MIN = 20;
const MAX = 300;
const LOOKAHEAD = 0.12; // seconds scheduled ahead of the audio clock

const T = {
  ru: {
    bpm: "Темп, ударов в минуту",
    slower: "Медленнее",
    faster: "Быстрее",
    start: "Старт",
    stop: "Стоп",
    tap: "Задать темп нажатиями",
    meter: "Размер",
    sub: "Доли",
    subs: ["четверти", "восьмые", "триоли", "шестнадцатые"],
    accent: "Акцент на первую долю",
    sound: "Звук",
    click: "Щелчок",
    wood: "Деревянный",
    beep: "Бип",
    volume: "Громкость",
    err: "Не удалось запустить звук в этом браузере.",
  },
  en: {
    bpm: "Tempo, beats per minute",
    slower: "Slower",
    faster: "Faster",
    start: "Start",
    stop: "Stop",
    tap: "Tap to set tempo",
    meter: "Time signature",
    sub: "Subdivision",
    subs: ["quarters", "eighths", "triplets", "sixteenths"],
    accent: "Accent the first beat",
    sound: "Sound",
    click: "Click",
    wood: "Wood",
    beep: "Beep",
    volume: "Volume",
    err: "Could not start audio in this browser.",
  },
} as const;

const METERS = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"] as const;
type Sound = "click" | "wood" | "beep";

function voice(ctx: AudioContext, dest: AudioNode, time: number, level: 0 | 1 | 2, sound: Sound, volume: number) {
  // level 2 = accent, 1 = beat, 0 = subdivision
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const base = sound === "wood" ? 800 : sound === "beep" ? 880 : 1000;
  osc.type = sound === "wood" ? "triangle" : sound === "beep" ? "square" : "sine";
  osc.frequency.value = level === 2 ? base * 1.5 : level === 1 ? base : base * 0.75;
  const peak = volume * volume * (level === 2 ? 1 : level === 1 ? 0.7 : 0.35) * (sound === "beep" ? 0.35 : 1);
  const len = sound === "beep" ? 0.06 : sound === "wood" ? 0.05 : 0.03;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, time + len);
  osc.connect(g).connect(dest);
  osc.start(time);
  osc.stop(time + len + 0.01);
}

export default function Metronome({ locale, bpm: bpm0 = 120 }: { locale: Locale; bpm?: number }) {
  const t = T[locale];
  const id = useId();
  const [bpm, setBpm] = useState(bpm0);
  const [meter, setMeter] = useState<(typeof METERS)[number]>("4/4");
  const [sub, setSub] = useState(1);
  const [accent, setAccent] = useState(true);
  const [sound, setSound] = useState<Sound>("click");
  const [volume, setVolume] = useState(0.8);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [error, setError] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);

  const beats = Number(meter.split("/")[0]);
  // Latest settings for the scheduler (read from the worker tick, not from render).
  const cfg = useRef({ bpm, beats, sub, accent, sound, volume });
  useEffect(() => {
    cfg.current = { bpm, beats, sub, accent, sound, volume };
  }, [bpm, beats, sub, accent, sound, volume]);

  const engine = useRef<{ ctx: AudioContext; out: GainNode; worker: Worker; next: number; step: number; queue: { time: number; beat: number }[]; raf: number } | null>(null);

  const stop = () => {
    const e = engine.current;
    engine.current = null;
    setRunning(false);
    setBeat(-1);
    if (!e) return;
    e.worker.postMessage({ cmd: "stop" });
    e.worker.terminate();
    cancelAnimationFrame(e.raf);
    setTimeout(() => e.out.disconnect(), 300);
  };
  useEffect(() => () => stop(), []);

  async function start() {
    setError(false);
    try {
      const ctx = await resumeAudio();
      const out = ctx.createGain();
      out.connect(ctx.destination);
      const worker = new Worker(new URL("./metronome.worker.ts", import.meta.url), { type: "module" });
      const e = { ctx, out, worker, next: ctx.currentTime + 0.06, step: 0, queue: [] as { time: number; beat: number }[], raf: 0 };
      engine.current = e;
      worker.onmessage = () => {
        const c = cfg.current;
        while (e.next < ctx.currentTime + LOOKAHEAD) {
          const onBeat = e.step % c.sub === 0;
          const beatNo = Math.floor(e.step / c.sub) % c.beats;
          const level: 0 | 1 | 2 = onBeat ? (c.accent && beatNo === 0 ? 2 : 1) : 0;
          voice(ctx, out, e.next, level, c.sound, c.volume);
          if (onBeat) e.queue.push({ time: e.next, beat: beatNo });
          e.next += 60 / c.bpm / c.sub;
          e.step++;
          // keep the step counter aligned to whole bars when settings change
          if (e.step >= c.beats * c.sub) e.step = 0;
        }
      };
      const draw = () => {
        const now = ctx.currentTime;
        let shown: number | null = null;
        while (e.queue.length && e.queue[0].time <= now) shown = e.queue.shift()!.beat;
        if (shown !== null) setBeat(shown);
        e.raf = requestAnimationFrame(draw);
      };
      e.raf = requestAnimationFrame(draw);
      worker.postMessage({ cmd: "start", interval: 25 });
      setRunning(true);
    } catch {
      setError(true);
    }
  }

  const set = (v: number) => setBpm(Math.min(MAX, Math.max(MIN, Math.round(v))));
  const tap = () => {
    const next = addTap(taps, performance.now());
    setTaps(next);
    const r = tempoFromTaps(next);
    if (r && next.length >= 3) set(r.bpm);
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => set(bpm - 1)} aria-label={t.slower} title={t.slower}>
            <Minus aria-hidden />
          </Button>
          <div className="flex flex-col items-center">
            <output htmlFor={`${id}-bpm`} className="tabular text-7xl font-bold tracking-tight text-fg" aria-live="off">
              {bpm}
            </output>
            <span className="text-sm text-fg-3">
              BPM · {tempoMarking(bpm)}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={() => set(bpm + 1)} aria-label={t.faster} title={t.faster}>
            <Plus aria-hidden />
          </Button>
        </div>
        <Slider id={`${id}-bpm`} aria-label={t.bpm} min={MIN} max={MAX} step={1} value={bpm} onChange={(e) => set(Number(e.target.value))} className="max-w-md" />
        <div className="flex gap-2" aria-hidden>
          {Array.from({ length: beats }, (_, i) => (
            <span
              key={i}
              className={cn(
                "size-4 rounded-full transition-colors duration-75",
                beat === i ? (i === 0 && accent ? "bg-accent" : "bg-fg") : "bg-surface-2 ring-1 ring-line",
              )}
            />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant={running ? "danger" : "primary"} size="lg" onClick={() => (running ? stop() : start())} className="min-w-40">
            {running ? <Square className="fill-current" aria-hidden /> : <Play className="fill-current" aria-hidden />}
            {running ? t.stop : t.start}
          </Button>
          <Button variant="outline" size="lg" onClick={tap}>
            <Hand aria-hidden />
            {t.tap}
          </Button>
        </div>
        <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-3 border-t border-line pt-4">
          <Segmented label={t.meter} value={meter} onChange={setMeter} size="sm" options={METERS.map((m) => ({ value: m, label: m }))} />
          <Field label={t.sub} htmlFor={`${id}-sub`} className="w-40">
            <Select id={`${id}-sub`} size="sm" value={String(sub)} onChange={(e) => setSub(Number(e.target.value))}>
              {[1, 2, 3, 4].map((s, i) => (
                <option key={s} value={s}>
                  {t.subs[i]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.sound} htmlFor={`${id}-snd`} className="w-36">
            <Select id={`${id}-snd`} size="sm" value={sound} onChange={(e) => setSound(e.target.value as Sound)}>
              <option value="click">{t.click}</option>
              <option value="wood">{t.wood}</option>
              <option value="beep">{t.beep}</option>
            </Select>
          </Field>
          <Checkbox label={t.accent} checked={accent} onChange={(e) => setAccent(e.target.checked)} className="pb-1.5" />
          <label className="flex items-center gap-2 pb-1.5 text-sm text-fg-2">
            {t.volume}
            <Slider min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-28" aria-label={t.volume} />
            <span className="tabular w-10">{formatNumber(locale, Math.round(volume * 100))}%</span>
          </label>
        </div>
      </Panel>
      {error && <Notice tone="err">{t.err}</Notice>}
    </div>
  );
}
