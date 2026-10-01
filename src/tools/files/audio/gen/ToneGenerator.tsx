"use client";

import { Minus, Play, Plus, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { Field, Slider } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Notice, Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { Segmented } from "@/ui/segmented";
import { Fab } from "@/tools/files/video/ui/Fab";
import { Setting } from "@/tools/files/video/ui/options";
import { fadeOutAndStop, mediaErrorKind, resumeAudio, smoothSet } from "../lib/audio";
import { NOTE_NAMES_RU, noteOf } from "../lib/pitch";

const MIN = 1;
const MAX = 22000;

const T = {
  ru: {
    freqLabel: "Частота",
    presets: "Частые частоты",
    khz: "кГц",
    sec: "с",
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
    sweep: "Свип",
    from: "От",
    to: "До",
    time: "За время",
    play: "Воспроизвести",
    stop: "Остановить",
    note: "Ближайшая нота",
    down: "Ниже на полутон",
    up: "Выше на полутон",
    safety: "Начинайте с малой громкости: громкий тон в наушниках может повредить слух.",
    noAudio: "Браузер не поддерживает Web Audio.",
    bad: "Введите частоту от 1 до 22 000 Гц",
  },
  en: {
    freqLabel: "Frequency",
    presets: "Common frequencies",
    khz: "kHz",
    sec: "s",
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
    from: "From",
    to: "To",
    time: "Over",
    play: "Play",
    stop: "Stop",
    note: "Nearest note",
    down: "Down a semitone",
    up: "Up a semitone",
    safety: "Start at a low volume: a loud tone in headphones can damage hearing.",
    noAudio: "This browser doesn't support Web Audio.",
    bad: "Enter a frequency from 1 to 22,000 Hz",
  },
} as const;

const toSlider = (f: number) => Math.log(f / MIN) / Math.log(MAX / MIN);
const fromSlider = (x: number) => MIN * Math.pow(MAX / MIN, x);
/** Quick picks under the slider: the ends of hearing, speaker checks, concert A, a kilohertz. */
const MARKS = [20, 100, 440, 1000, 10000, 20000];
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

  const hz = locale === "ru" ? "Гц" : "Hz";
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        <Panel className="flex min-w-0 flex-col items-center gap-6 p-4 sm:p-6">
          {mode === "steady" ? (
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={`${id}-f`} className="text-sm font-medium text-fg-2">
                  {t.freqLabel}
                </label>
                <span className="text-sm text-fg-3">
                  {t.note}: <span className="font-semibold text-fg-2">{noteName}</span>
                  {Math.abs(n.cents) >= 1 ? ` ${n.cents > 0 ? "+" : "−"}${formatNumber(locale, Math.abs(Math.round(n.cents)))} ¢` : ""}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2 sm:gap-4">
                <IconButton variant="tonal" size="lg" label={t.down} icon={<Minus aria-hidden />} onClick={() => setF(freq / Math.pow(2, 1 / 12))} />
                <div className={cn("flex min-w-0 items-baseline gap-2 border-b-2 border-dashed pb-1 transition-colors focus-within:border-solid focus-within:border-accent", invalid ? "border-err" : "border-line-strong hover:border-outline")}>
                  <input
                    id={`${id}-f`}
                    value={shown}
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={invalid}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      setText(e.target.value);
                      const v = parseNumber(e.target.value);
                      if (v !== null && v >= MIN && v <= MAX) setFreq(v);
                    }}
                    onBlur={() => setText(null)}
                    style={{ width: `${Math.max(3, shown.length) + 0.5}ch` }}
                    className="tabular min-w-0 max-w-[8ch] bg-transparent text-center text-5xl font-bold tracking-tight text-fg outline-none sm:text-6xl"
                  />
                  <span className="text-2xl font-semibold text-fg-2">{hz}</span>
                </div>
                <IconButton variant="tonal" size="lg" label={t.up} icon={<Plus aria-hidden />} onClick={() => setF(freq * Math.pow(2, 1 / 12))} />
              </div>
              {invalid && (
                <p className="text-center text-sm text-err" role="alert">
                  {t.bad}
                </p>
              )}
              <Slider aria-label={t.slider} aria-valuetext={`${formatNumber(locale, freq)} ${hz}`} min={0} max={1} step={0.0005} value={toSlider(freq)} format={() => `${formatNumber(locale, freq)} ${hz}`} onChange={(e) => setF(fromSlider(Number(e.target.value)))} />
              <ScrollRow label={t.presets} className="mt-2" rowClassName="justify-center-safe">
                {MARKS.map((m) => (
                  <button key={m} type="button" className="chip tabular shrink-0" aria-pressed={freq === m} onClick={() => setF(m)}>
                    {m >= 1000 ? `${formatNumber(locale, m / 1000)} ${t.khz}` : `${m} ${hz}`}
                  </button>
                ))}
              </ScrollRow>
            </div>
          ) : (
            <div className="grid w-full gap-4 sm:grid-cols-3">
              <Field label={t.from} htmlFor={`${id}-s1`}>
                <NumberInput id={`${id}-s1`} locale={locale} value={sweep.from} min={MIN} max={MAX} step={10} stepper={false} suffix={hz} onChange={(v) => v !== null && setSweep((s) => ({ ...s, from: v }))} />
              </Field>
              <Field label={t.to} htmlFor={`${id}-s2`}>
                <NumberInput id={`${id}-s2`} locale={locale} value={sweep.to} min={MIN} max={MAX} step={10} stepper={false} suffix={hz} onChange={(v) => v !== null && setSweep((s) => ({ ...s, to: v }))} />
              </Field>
              <Field label={t.time} htmlFor={`${id}-s3`}>
                <NumberInput id={`${id}-s3`} locale={locale} value={sweep.time} min={1} max={600} step={1} suffix={t.sec} onChange={(v) => v !== null && setSweep((s) => ({ ...s, time: Math.max(1, v) }))} />
              </Field>
            </div>
          )}
          <Fab label={playing ? t.stop : t.play} icon={playing ? <Square className="fill-current" aria-hidden /> : <Play className="fill-current" aria-hidden />} onClick={playing ? stop : play} active={playing} disabled={!playing && mode === "steady" && invalid} />
        </Panel>
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <Setting label={t.mode}>
            <Segmented label={t.mode} value={mode} onChange={(x) => (playing && stop(), setMode(x))} options={[{ value: "steady", label: t.steady }, { value: "sweep", label: t.sweep }]} />
          </Setting>
          <Setting label={t.wave}>
            <Segmented label={t.wave} value={wave as "sine"} onChange={(x) => setWave(x as OscillatorType)} options={(["sine", "square", "triangle", "sawtooth"] as const).map((w) => ({ value: w as "sine", label: t[w] }))} />
          </Setting>
          <Setting label={t.channel}>
            <Segmented label={t.channel} value={channel} fill onChange={setChannel} options={[{ value: "both", label: t.both }, { value: "left", label: t.left }, { value: "right", label: t.right }]} />
          </Setting>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-v`} className="text-sm font-medium text-fg-2">
                {t.volume}
              </label>
              <output htmlFor={`${id}-v`} className="tabular text-lg font-semibold text-fg">
                {pct(volume)}
              </output>
            </div>
            <Slider id={`${id}-v`} min={0} max={1} step={0.01} value={volume} format={pct} aria-valuetext={pct(volume)} onChange={(e) => setVolume(Number(e.target.value))} />
          </div>
        </Panel>
      </div>
      {error && <Notice tone="err">{error}</Notice>}
      <p className="text-sm text-fg-3">{t.safety}</p>
    </div>
  );
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function ToneGenerator(props: { locale: Locale; freq?: number }) {
  return <ToneGeneratorInner key={String(props.freq ?? "")} {...props} />;
}
