"use client";

import { AudioWaveform, Play, Square, Volume2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Input, Slider } from "@/ui/field";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";

type Side = "left" | "center" | "right";
type Sound = "tone" | "noise";
type Wave = "sine" | "triangle" | "square" | "sawtooth";
type GenMode = "off" | "tone" | "sweep";

const F_MIN = 20;
const F_MAX = 20000;
const SWEEP_S = 20;
const PAN_CYCLE_S = 4;
const PAN_CYCLES = 2;
const PRESET_HZ = [50, 100, 440, 1000, 5000, 10000, 15000];

const T = {
  ru: {
    volume: "Громкость теста",
    channels: "Каналы",
    sound: "Звук",
    tone: "Сигнал",
    noise: "Шум",
    left: "Левый",
    center: "Оба",
    right: "Правый",
    playing: "звучит",
    channelHint: "Каждый звук должен звучать только со своей стороны. «Оба» — одинаково в левом и правом канале, звук кажется идущим из центра.",
    sweep: "Панорама слева направо",
    sweepStop: "Остановить панораму",
    sweepHint: "Звук плавно проходит от левого динамика к правому и обратно, два раза.",
    gen: "Генератор тона",
    freq: "Частота, Гц",
    freqSlider: "Частота (логарифмическая шкала)",
    wave: "Форма волны",
    waves: { sine: "Синус", triangle: "Треугольник", square: "Меандр", sawtooth: "Пила" },
    out: "Канал",
    play: "Включить тон",
    stop: "Стоп",
    fsweep: `Свип 20 Гц → 20 кГц (${SWEEP_S} с)`,
    warn: "Начинайте с малой громкости и прибавляйте постепенно. Высокие частоты плохо слышны, но на большой громкости утомляют слух, а низкие (ниже 40 Гц) могут повредить маленькие динамики ноутбука и телефона.",
    output: "Вывод звука",
    sampleRate: "Частота дискретизации",
    channelsOut: "Каналов вывода (по данным браузера)",
    latency: "Задержка вывода",
    hz: "Гц",
    khz: "кГц",
    ms: "мс",
    notSupported: "Этот браузер не поддерживает Web Audio API, поэтому звук сгенерировать не получится.",
  },
  en: {
    volume: "Test volume",
    channels: "Channels",
    sound: "Sound",
    tone: "Beeps",
    noise: "Noise",
    left: "Left",
    center: "Both",
    right: "Right",
    playing: "playing",
    channelHint: "Each sound should come from its own side only. “Both” plays equally in the left and right channel, so it seems to come from the centre.",
    sweep: "Pan left to right",
    sweepStop: "Stop panning",
    sweepHint: "The sound glides from the left speaker to the right one and back, twice.",
    gen: "Tone generator",
    freq: "Frequency, Hz",
    freqSlider: "Frequency (logarithmic scale)",
    wave: "Waveform",
    waves: { sine: "Sine", triangle: "Triangle", square: "Square", sawtooth: "Sawtooth" },
    out: "Channel",
    play: "Play tone",
    stop: "Stop",
    fsweep: `Sweep 20 Hz → 20 kHz (${SWEEP_S} s)`,
    warn: "Start at a low volume and raise it gradually. High frequencies are hard to hear but tire your ears at high volume, and low ones (below 40 Hz) can damage small laptop and phone speakers.",
    output: "Audio output",
    sampleRate: "Sample rate",
    channelsOut: "Output channels (reported by the browser)",
    latency: "Output latency",
    hz: "Hz",
    khz: "kHz",
    ms: "ms",
    notSupported: "This browser doesn't support the Web Audio API, so no sound can be generated.",
  },
} as const;

const toSlider = (f: number) => Math.round((1000 * Math.log(f / F_MIN)) / Math.log(F_MAX / F_MIN));
const fromSlider = (v: number) => F_MIN * (F_MAX / F_MIN) ** (v / 1000);
const volToGain = (v: number) => (v / 100) ** 2;

interface Res {
  disposed: boolean;
  ctx: AudioContext | null;
  master: GainNode | null;
  noise: AudioBuffer | null;
  chan: AudioScheduledSourceNode | null;
  gen: { osc: OscillatorNode; gain: GainNode; pan: StereoPannerNode } | null;
  raf: number;
  genRaf: number;
}

interface OutInfo {
  sampleRate: number;
  channels: number;
  latency: number | null;
}

/** Two seconds of pink noise (Paul Kellet's filter) from a CSPRNG. */
function pinkNoise(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const out = buf.getChannelData(0);
  const rnd = new Uint32Array(16384);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const k = i % rnd.length;
    if (k === 0) crypto.getRandomValues(rnd);
    const white = (rnd[k] / 0xffffffff) * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buf;
}

function stopNode(node: AudioScheduledSourceNode | null | undefined) {
  if (!node) return;
  node.onended = null;
  try {
    node.stop();
  } catch {
    // not started or already stopped
  }
  node.disconnect();
}

export default function SpeakerTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [volume, setVolume] = useState(25);
  const [sound, setSound] = useState<Sound>("tone");
  const [playing, setPlaying] = useState<Side | "pan" | null>(null);
  const [freq, setFreq] = useState(440);
  const [freqText, setFreqText] = useState("440");
  const [wave, setWave] = useState<Wave>("sine");
  const [genSide, setGenSide] = useState<Side>("center");
  const [genMode, setGenMode] = useState<GenMode>("off");
  const [info, setInfo] = useState<OutInfo | null>(null);
  const [failed, setFailed] = useState(false);

  const resRef = useRef<Res | null>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const r: Res = { disposed: false, ctx: null, master: null, noise: null, chan: null, gen: null, raf: 0, genRaf: 0 };
    resRef.current = r;
    return () => {
      r.disposed = true;
      cancelAnimationFrame(r.raf);
      cancelAnimationFrame(r.genRaf);
      stopNode(r.chan);
      stopNode(r.gen?.osc);
      r.chan = null;
      r.gen = null;
      r.ctx?.close().catch(() => {});
      r.ctx = null;
    };
  }, []);

  function ensureCtx(): { r: Res; ctx: AudioContext; master: GainNode } | null {
    const r = resRef.current;
    if (!r) return null;
    if (!r.ctx || !r.master) {
      if (typeof AudioContext === "undefined") {
        setFailed(true);
        return null;
      }
      const ctx = new AudioContext();
      const master = new GainNode(ctx, { gain: volToGain(volume) });
      master.connect(ctx.destination);
      r.ctx = ctx;
      r.master = master;
      // outputLatency is only known once the context is running
      const readInfo = () => {
        if (r.disposed || r.ctx !== ctx) return;
        const lat = ctx.outputLatency > 0 ? (ctx.outputLatency + (ctx.baseLatency || 0)) * 1000 : null;
        setInfo({ sampleRate: ctx.sampleRate, channels: ctx.destination.maxChannelCount, latency: lat });
      };
      readInfo();
      window.setTimeout(readInfo, 600);
    }
    if (r.ctx.state === "suspended") r.ctx.resume().catch(() => {});
    return { r, ctx: r.ctx, master: r.master };
  }

  function stopChannel() {
    const r = resRef.current;
    if (!r) return;
    cancelAnimationFrame(r.raf);
    stopNode(r.chan);
    r.chan = null;
    setPlaying(null);
  }

  function sourceFor(ctx: AudioContext, r: Res, loop: boolean): AudioScheduledSourceNode {
    if (sound === "noise") {
      r.noise ??= pinkNoise(ctx);
      return new AudioBufferSourceNode(ctx, { buffer: r.noise, loop });
    }
    return new OscillatorNode(ctx, { type: "sine", frequency: 660 });
  }

  function playSide(side: Side) {
    const c = ensureCtx();
    if (!c) return;
    const { r, ctx, master } = c;
    stopChannel();
    const pan = new StereoPannerNode(ctx, { pan: side === "left" ? -1 : side === "right" ? 1 : 0 });
    const env = new GainNode(ctx, { gain: 0 });
    env.connect(pan).connect(master);
    const src = sourceFor(ctx, r, false);
    src.connect(env);
    const t0 = ctx.currentTime + 0.03;
    let end: number;
    if (sound === "tone") {
      for (let i = 0; i < 3; i++) {
        const s = t0 + i * 0.3;
        env.gain.setValueAtTime(0, s);
        env.gain.linearRampToValueAtTime(0.8, s + 0.01);
        env.gain.setValueAtTime(0.8, s + 0.17);
        env.gain.linearRampToValueAtTime(0, s + 0.2);
      }
      end = t0 + 0.85;
    } else {
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(0.9, t0 + 0.02);
      env.gain.setValueAtTime(0.9, t0 + 1.2);
      env.gain.linearRampToValueAtTime(0, t0 + 1.25);
      end = t0 + 1.3;
    }
    src.onended = () => {
      env.disconnect();
      pan.disconnect();
      if (r.chan === src) {
        r.chan = null;
        setPlaying(null);
      }
    };
    src.start(t0);
    src.stop(end);
    r.chan = src;
    setPlaying(side);
  }

  function playPan() {
    const c = ensureCtx();
    if (!c) return;
    const { r, ctx, master } = c;
    stopChannel();
    const pan = new StereoPannerNode(ctx, { pan: -1 });
    const env = new GainNode(ctx, { gain: 0 });
    env.connect(pan).connect(master);
    const src = sound === "noise" ? sourceFor(ctx, r, true) : new OscillatorNode(ctx, { type: "sine", frequency: 440 });
    src.connect(env);
    const t0 = ctx.currentTime + 0.05;
    const total = PAN_CYCLE_S * PAN_CYCLES;
    pan.pan.setValueAtTime(-1, t0);
    for (let i = 0; i < PAN_CYCLES; i++) {
      pan.pan.linearRampToValueAtTime(1, t0 + i * PAN_CYCLE_S + PAN_CYCLE_S / 2);
      pan.pan.linearRampToValueAtTime(-1, t0 + (i + 1) * PAN_CYCLE_S);
    }
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.7, t0 + 0.05);
    env.gain.setValueAtTime(0.7, t0 + total - 0.05);
    env.gain.linearRampToValueAtTime(0, t0 + total);
    src.onended = () => {
      env.disconnect();
      pan.disconnect();
      if (r.chan === src) {
        r.chan = null;
        cancelAnimationFrame(r.raf);
        setPlaying(null);
      }
    };
    src.start(t0);
    src.stop(t0 + total + 0.02);
    r.chan = src;
    setPlaying("pan");
    const tick = () => {
      const el = Math.max(0, ctx.currentTime - t0) % PAN_CYCLE_S;
      const p = el < PAN_CYCLE_S / 2 ? -1 + (4 * el) / PAN_CYCLE_S : 3 - (4 * el) / PAN_CYCLE_S;
      if (dotRef.current) dotRef.current.style.left = `${((p + 1) / 2) * 100}%`;
      r.raf = requestAnimationFrame(tick);
    };
    r.raf = requestAnimationFrame(tick);
  }

  function stopGen() {
    const r = resRef.current;
    if (!r) return;
    cancelAnimationFrame(r.genRaf);
    if (r.gen && r.ctx) {
      const { osc, gain } = r.gen;
      gain.gain.setTargetAtTime(0, r.ctx.currentTime, 0.015);
      osc.onended = null;
      osc.stop(r.ctx.currentTime + 0.08);
      setTimeout(() => gain.disconnect(), 150);
    }
    r.gen = null;
    setGenMode("off");
  }

  function startGen(mode: "tone" | "sweep") {
    const c = ensureCtx();
    if (!c) return;
    const { r, ctx, master } = c;
    stopGen();
    const osc = new OscillatorNode(ctx, { type: wave, frequency: mode === "sweep" ? F_MIN : freq });
    const gain = new GainNode(ctx, { gain: 0 });
    const pan = new StereoPannerNode(ctx, { pan: genSide === "left" ? -1 : genSide === "right" ? 1 : 0 });
    osc.connect(gain).connect(pan).connect(master);
    const t0 = ctx.currentTime + 0.02;
    gain.gain.setTargetAtTime(0.8, t0, 0.015);
    osc.start(t0);
    if (mode === "sweep") {
      osc.frequency.setValueAtTime(F_MIN, t0);
      osc.frequency.exponentialRampToValueAtTime(F_MAX, t0 + SWEEP_S);
      osc.stop(t0 + SWEEP_S + 0.05);
      osc.onended = () => {
        if (r.gen?.osc === osc) {
          r.gen = null;
          gain.disconnect();
          setGenMode("off");
        }
      };
      let last = 0;
      const tick = (now: number) => {
        if (r.disposed || r.gen?.osc !== osc) return;
        if (now - last > 100) {
          last = now;
          const el = Math.min(SWEEP_S, Math.max(0, ctx.currentTime - t0));
          const f = F_MIN * (F_MAX / F_MIN) ** (el / SWEEP_S);
          setFreq(f);
          setFreqText(String(Math.round(f)));
        }
        r.genRaf = requestAnimationFrame(tick);
      };
      r.genRaf = requestAnimationFrame(tick);
    }
    r.gen = { osc, gain, pan };
    setGenMode(mode);
  }

  function changeFreq(f: number) {
    const v = Math.min(F_MAX, Math.max(F_MIN, f));
    setFreq(v);
    const r = resRef.current;
    if (r?.gen && r.ctx && genMode === "tone") r.gen.osc.frequency.setTargetAtTime(v, r.ctx.currentTime, 0.01);
  }

  function changeVolume(v: number) {
    setVolume(v);
    const r = resRef.current;
    if (r?.master && r.ctx) r.master.gain.setTargetAtTime(volToGain(v), r.ctx.currentTime, 0.02);
  }

  const fmtHz = (f: number) =>
    f >= 1000 ? `${formatNumber(locale, f / 1000, { maximumFractionDigits: f >= 10000 ? 1 : 2 })} ${t.khz}` : `${formatNumber(locale, f, { maximumFractionDigits: 0 })} ${t.hz}`;
  const sides: Side[] = ["left", "center", "right"];

  return (
    <div className="flex flex-col gap-4">
      {failed && <Notice tone="err">{t.notSupported}</Notice>}

      <div className="flex items-center gap-3 px-1">
        <Volume2 aria-hidden className="size-4 shrink-0 text-fg-3" />
        <label htmlFor={`${id}-vol`} className="shrink-0 text-sm text-fg-2">
          {t.volume}
        </label>
        <Slider id={`${id}-vol`} min={0} max={100} step={1} value={volume} onChange={(e) => changeVolume(Number(e.target.value))} className="max-w-72" />
        <span className="tabular w-12 shrink-0 text-sm text-fg-2">{volume} %</span>
      </div>

      <Panel>
        <PanelHeader
          title={t.channels}
          actions={<Segmented size="sm" label={t.sound} value={sound} onChange={setSound} options={[{ value: "tone", label: t.tone }, { value: "noise", label: t.noise }]} />}
        />
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {sides.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => playSide(s)}
                aria-pressed={playing === s}
                className={cn(
                  "flex min-h-28 flex-col items-center justify-center gap-2 rounded-[12px] border px-2 py-4 text-[15px] font-semibold transition-colors duration-150",
                  playing === s ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface-2 text-fg hover:border-accent",
                )}
              >
                <Volume2 aria-hidden className={cn("size-7", s === "left" && "-scale-x-100")} />
                <span>{t[s]}</span>
                {playing === s && <span className="text-xs font-normal opacity-80">{t.playing}</span>}
              </button>
            ))}
          </div>
          <p className="text-sm text-fg-3">{t.channelHint}</p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant={playing === "pan" ? "danger" : "secondary"} onClick={() => (playing === "pan" ? stopChannel() : playPan())}>
                {playing === "pan" ? <Square aria-hidden /> : <AudioWaveform aria-hidden />}
                {playing === "pan" ? t.sweepStop : t.sweep}
              </Button>
              <span className="text-sm text-fg-3">{t.sweepHint}</span>
            </div>
            <div className="relative mx-3 h-8" aria-hidden>
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-2" />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-fg-3">L</span>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-fg-3">R</span>
              <span
                ref={dotRef}
                className={cn("absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent transition-opacity", playing === "pan" ? "opacity-100" : "opacity-0")}
                style={{ left: "0%" }}
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={t.gen} />
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <Notice tone="warn" className="leading-relaxed">
            {t.warn}
          </Notice>
          <div className="text-center">
            <div className="tabular text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{fmtHz(freq)}</div>
          </div>
          <Field label={t.freqSlider} htmlFor={`${id}-fs`}>
            <Slider
              id={`${id}-fs`}
              min={0}
              max={1000}
              step={1}
              value={toSlider(freq)}
              disabled={genMode === "sweep"}
              aria-valuetext={fmtHz(freq)}
              onChange={(e) => {
                const f = Math.round(fromSlider(Number(e.target.value)));
                setFreqText(String(f));
                changeFreq(f);
              }}
            />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_HZ.map((f) => (
              <button
                key={f}
                type="button"
                className={cn("chip h-8! px-3! text-[13px]!", Math.round(freq) === f && "border-accent! text-accent!")}
                disabled={genMode === "sweep"}
                onClick={() => {
                  setFreqText(String(f));
                  changeFreq(f);
                }}
              >
                {fmtHz(f)}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)]">
            <Field label={t.freq} htmlFor={`${id}-fi`}>
              <Input
                id={`${id}-fi`}
                inputMode="decimal"
                value={freqText}
                disabled={genMode === "sweep"}
                className="tabular"
                onChange={(e) => {
                  setFreqText(e.target.value);
                  const n = parseNumber(e.target.value);
                  if (n !== null && n >= F_MIN && n <= F_MAX) changeFreq(n);
                }}
                aria-invalid={(() => {
                  const n = parseNumber(freqText);
                  return n === null || n < F_MIN || n > F_MAX;
                })()}
              />
            </Field>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.wave}</span>
              <Segmented
                size="sm"
                label={t.wave}
                value={wave}
                onChange={(w) => {
                  setWave(w);
                  const r = resRef.current;
                  if (r?.gen) r.gen.osc.type = w;
                }}
                options={(["sine", "triangle", "square", "sawtooth"] as const).map((w) => ({ value: w, label: t.waves[w] }))}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.out}</span>
              <Segmented
                size="sm"
                label={t.out}
                value={genSide}
                onChange={(s) => {
                  setGenSide(s);
                  const r = resRef.current;
                  if (r?.gen && r.ctx) r.gen.pan.pan.setTargetAtTime(s === "left" ? -1 : s === "right" ? 1 : 0, r.ctx.currentTime, 0.02);
                }}
                options={sides.map((s) => ({ value: s, label: t[s] }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {genMode === "tone" ? (
              <Button variant="danger" onClick={stopGen}>
                <Square aria-hidden />
                {t.stop}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => startGen("tone")}>
                <Play aria-hidden />
                {t.play}
              </Button>
            )}
            {genMode === "sweep" ? (
              <Button variant="danger" onClick={stopGen}>
                <Square aria-hidden />
                {t.stop}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => startGen("sweep")}>
                <AudioWaveform aria-hidden />
                {t.fsweep}
              </Button>
            )}
          </div>
        </div>
      </Panel>

      {info && (
        <dl className="facts">
          <div>
            <dt>{t.sampleRate}</dt>
            <dd>
              {formatNumber(locale, info.sampleRate)} {t.hz}
            </dd>
          </div>
          <div>
            <dt>{t.channelsOut}</dt>
            <dd>{info.channels}</dd>
          </div>
          {info.latency !== null && (
            <div>
              <dt>{t.latency}</dt>
              <dd>
                ≈ {formatNumber(locale, info.latency, { maximumFractionDigits: 0 })} {t.ms}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
