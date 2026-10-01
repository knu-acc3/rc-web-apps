"use client";

import { Minus, Play, Plus, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field, Input, Slider } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { fadeOutAndStop, mediaErrorKind, resumeAudio, smoothSet } from "../lib/audio";
import { NOTE_NAMES_RU, noteOf } from "../lib/pitch";

const MIN = 1;
const MAX = 22000;

const T = {
  ru: {
    freq: "Частота, Гц",
    slider: "Частота (логарифмическая шкала)",
    wave: "Форма волны",
    sine: "Синус",
    square: "Меандр",
    triangle: "Треугольник",
    sawtooth: "Пила",
    volume: "Громкость",
    channel: "Канал",
    both: "Оба",
    left: "Левый",
    right: "Правый",
    mode: "Режим",
    steady: "Постоянный тон",
    sweep: "Свип (плавный переход)",
    from: "От, Гц",
    to: "До, Гц",
    time: "За, секунд",
    play: "Воспроизвести",
    stop: "Остановить",
    note: "Ближайшая нота",
    down: "Ниже на полутон",
    up: "Выше на полутон",
    safety: "Начинайте с малой громкости. Высокие частоты и громкий тон в наушниках могут повредить слух. Динамики телефонов и ноутбуков обычно не воспроизводят частоты ниже 100–200 Гц.",
    noAudio: "Браузер не поддерживает Web Audio.",
    bad: "Введите частоту от 1 до 22 000 Гц",
  },
  en: {
    freq: "Frequency, Hz",
    slider: "Frequency (logarithmic scale)",
    wave: "Waveform",
    sine: "Sine",
    square: "Square",
    triangle: "Triangle",
    sawtooth: "Sawtooth",
    volume: "Volume",
    channel: "Channel",
    both: "Both",
    left: "Left",
    right: "Right",
    mode: "Mode",
    steady: "Steady tone",
    sweep: "Sweep",
    from: "From, Hz",
    to: "To, Hz",
    time: "Over, seconds",
    play: "Play",
    stop: "Stop",
    note: "Nearest note",
    down: "Down a semitone",
    up: "Up a semitone",
    safety: "Start at a low volume. High frequencies and loud tones in headphones can damage hearing. Phone and laptop speakers usually can't reproduce frequencies below 100–200 Hz.",
    noAudio: "This browser doesn't support Web Audio.",
    bad: "Enter a frequency from 1 to 22,000 Hz",
  },
} as const;

const toSlider = (f: number) => Math.log(f / MIN) / Math.log(MAX / MIN);
const fromSlider = (x: number) => MIN * Math.pow(MAX / MIN, x);
const round = (f: number) => (f >= 100 ? Math.round(f) : Math.round(f * 10) / 10);

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  pan: StereoPannerNode | null;
  ctx: AudioContext;
}

function ToneGeneratorInner({ locale, freq: freq0 = 440 }: { locale: Locale; freq?: number }) {
  const t = T[locale];
  const id = useId();
  const [freq, setFreq] = useState(freq0);
  const [text, setText] = useState<string | null>(null);
  const [wave, setWave] = useState<OscillatorType>("sine");
  const [volume, setVolume] = useState(0.25);
  const [channel, setChannel] = useState<"both" | "left" | "right">("both");
  const [mode, setMode] = useState<"steady" | "sweep">("steady");
  const [sweep, setSweep] = useState({ from: 20, to: 20000, time: 20 });
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voice = useRef<Voice | null>(null);
  const sweepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    const v = voice.current;
    voice.current = null;
    if (sweepTimer.current) clearTimeout(sweepTimer.current);
    setPlaying(false);
    if (v) void fadeOutAndStop(v.osc, v.gain, v.ctx, 0.05);
  };
  useEffect(() => () => stop(), []);

  async function play() {
    setError(null);
    try {
      const ctx = await resumeAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : null;
      osc.type = wave;
      gain.gain.value = 0;
      if (pan) pan.pan.value = channel === "left" ? -1 : channel === "right" ? 1 : 0;
      osc.connect(gain);
      (pan ? gain.connect(pan) : gain).connect(ctx.destination);
      const now = ctx.currentTime;
      if (mode === "sweep") {
        const f1 = Math.min(Math.max(sweep.from, MIN), MAX);
        const f2 = Math.min(Math.max(sweep.to, MIN), MAX);
        osc.frequency.setValueAtTime(f1, now);
        osc.frequency.exponentialRampToValueAtTime(f2, now + sweep.time);
        sweepTimer.current = setTimeout(stop, sweep.time * 1000 + 100);
      } else {
        osc.frequency.setValueAtTime(freq, now);
      }
      gain.gain.linearRampToValueAtTime(volume * volume, now + 0.03);
      osc.start();
      voice.current = { osc, gain, pan, ctx };
      setPlaying(true);
    } catch (e) {
      setError(mediaErrorKind(e) === "unsupported" ? t.noAudio : String((e as Error).message));
    }
  }

  // Live changes while playing — controls are never locked.
  useEffect(() => {
    const v = voice.current;
    if (v && mode === "steady") smoothSet(v.osc.frequency, freq, v.ctx, 0.01);
  }, [freq, mode]);
  useEffect(() => {
    const v = voice.current;
    if (v) smoothSet(v.gain.gain, volume * volume, v.ctx);
  }, [volume]);
  useEffect(() => {
    const v = voice.current;
    if (v) v.osc.type = wave;
  }, [wave]);
  useEffect(() => {
    const v = voice.current;
    if (v?.pan) smoothSet(v.pan.pan, channel === "left" ? -1 : channel === "right" ? 1 : 0, v.ctx);
  }, [channel]);

  const setF = (f: number) => {
    setFreq(Math.min(MAX, Math.max(MIN, round(f))));
    setText(null);
  };
  const shown = text ?? formatNumber(locale, freq);
  const parsed = text === null ? freq : parseNumber(text);
  const invalid = parsed === null || parsed < MIN || parsed > MAX;
  const n = noteOf(freq);
  const noteName = locale === "ru" ? `${n.name}${n.octave} (${NOTE_NAMES_RU[(n.midi % 12 + 12) % 12]})` : `${n.name}${n.octave}`;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-5 p-5">
        {mode === "steady" ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full max-w-sm items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setF(freq / Math.pow(2, 1 / 12))} aria-label={t.down} title={t.down}>
                <Minus aria-hidden />
              </Button>
              <label htmlFor={`${id}-f`} className="sr-only">
                {t.freq}
              </label>
              <Input
                id={`${id}-f`}
                value={shown}
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={invalid}
                onChange={(e) => {
                  setText(e.target.value);
                  const v = parseNumber(e.target.value);
                  if (v !== null && v >= MIN && v <= MAX) setFreq(v);
                }}
                onBlur={() => setText(null)}
                className="tabular h-16! min-w-0 flex-1 text-center text-[clamp(1.5rem,9vw,2.25rem)]! font-semibold"
              />
              <span className="text-xl text-fg-2 sm:text-2xl">{locale === "ru" ? "Гц" : "Hz"}</span>
              <Button variant="outline" size="icon" onClick={() => setF(freq * Math.pow(2, 1 / 12))} aria-label={t.up} title={t.up}>
                <Plus aria-hidden />
              </Button>
            </div>
            {invalid && <p className="text-sm text-err">{t.bad}</p>}
            <Slider aria-label={t.slider} min={0} max={1} step={0.0005} value={toSlider(freq)} onChange={(e) => setF(fromSlider(Number(e.target.value)))} className="max-w-xl" />
            <p className="text-sm text-fg-3">
              {t.note}: <span className="font-medium text-fg-2">{noteName}</span>
              {Math.abs(n.cents) >= 1 ? ` ${n.cents > 0 ? "+" : "−"}${formatNumber(locale, Math.abs(Math.round(n.cents)))} ¢` : ""}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Field label={t.from} htmlFor={`${id}-s1`}>
              <Input id={`${id}-s1`} inputMode="decimal" value={String(sweep.from)} onChange={(e) => setSweep((s) => ({ ...s, from: parseNumber(e.target.value) ?? s.from }))} className="tabular" />
            </Field>
            <Field label={t.to} htmlFor={`${id}-s2`}>
              <Input id={`${id}-s2`} inputMode="decimal" value={String(sweep.to)} onChange={(e) => setSweep((s) => ({ ...s, to: parseNumber(e.target.value) ?? s.to }))} className="tabular" />
            </Field>
            <Field label={t.time} htmlFor={`${id}-s3`}>
              <Input id={`${id}-s3`} inputMode="decimal" value={String(sweep.time)} onChange={(e) => setSweep((s) => ({ ...s, time: Math.max(1, parseNumber(e.target.value) ?? s.time) }))} className="tabular" />
            </Field>
          </div>
        )}
        <div className="flex justify-center">
          <Button variant={playing ? "danger" : "primary"} size="lg" onClick={playing ? stop : play} disabled={!playing && mode === "steady" && invalid} className="min-w-48">
            {playing ? <Square className="fill-current" aria-hidden /> : <Play className="fill-current" aria-hidden />}
            {playing ? t.stop : t.play}
          </Button>
        </div>
        <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-3 border-t border-line pt-4">
          <Segmented label={t.wave} value={wave as "sine"} onChange={(x) => setWave(x as OscillatorType)} size="sm" options={(["sine", "square", "triangle", "sawtooth"] as const).map((w) => ({ value: w as "sine", label: t[w] }))} />
          <Segmented label={t.channel} value={channel} onChange={setChannel} size="sm" options={[{ value: "both", label: t.both }, { value: "left", label: t.left }, { value: "right", label: t.right }]} />
          <Segmented label={t.mode} value={mode} onChange={(x) => (playing && stop(), setMode(x))} size="sm" options={[{ value: "steady", label: t.steady }, { value: "sweep", label: t.sweep }]} />
          <label className="flex items-center gap-2 text-sm text-fg-2">
            {t.volume}
            <Slider min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-32" aria-label={t.volume} />
            <span className="tabular w-10">{Math.round(volume * 100)}%</span>
          </label>
        </div>
      </Panel>
      {error && <Notice tone="err">{error}</Notice>}
      <p className="text-sm text-fg-3">{t.safety}</p>
    </div>
  );
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function ToneGenerator(props: { locale: Locale; freq?: number }) {
  return <ToneGeneratorInner key={String(props.freq ?? "")} {...props} />;
}
