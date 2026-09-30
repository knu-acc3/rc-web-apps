"use client";

import { Play, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Select, Slider } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { formatTime } from "@/sections/video/engine/time";
import { createNoise, NOISE_COLORS, NOISE_WORKLET_SRC, type NoiseColor } from "../lib/noise";
import { fadeGain, resumeAudio, smoothSet } from "../lib/audio";

const T = {
  ru: {
    color: "Цвет шума",
    names: { white: "Белый", pink: "Розовый", brown: "Коричневый", blue: "Синий", violet: "Фиолетовый" } as Record<NoiseColor, string>,
    volume: "Громкость",
    timer: "Выключить через",
    never: "не выключать",
    min: "мин",
    h: "ч",
    play: "Включить",
    stop: "Выключить",
    left: "Осталось",
    err: "Не удалось запустить звук в этом браузере.",
    note: "Шум генерируется непрерывно, без повторяющегося фрагмента, поэтому в нём нет щелчков и заметных петель. Цвет и громкость можно менять не останавливая звук.",
  },
  en: {
    color: "Noise colour",
    names: { white: "White", pink: "Pink", brown: "Brown", blue: "Blue", violet: "Violet" } as Record<NoiseColor, string>,
    volume: "Volume",
    timer: "Stop after",
    never: "never",
    min: "min",
    h: "h",
    play: "Play",
    stop: "Stop",
    left: "Remaining",
    err: "Could not start audio in this browser.",
    note: "The noise is generated continuously, without a repeating loop, so there are no clicks or audible seams. Colour and volume change without stopping the sound.",
  },
} as const;

const TIMERS = [0, 5, 15, 30, 45, 60, 90, 120, 240, 480];

interface Chain {
  ctx: AudioContext;
  gain: GainNode;
  node: AudioWorkletNode | ScriptProcessorNode;
  setColor: (c: NoiseColor) => void;
}

let workletUrl: string | null = null;
const loaded = new WeakSet<BaseAudioContext>();

async function buildChain(ctx: AudioContext, color: NoiseColor): Promise<Chain> {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  if (ctx.audioWorklet) {
    if (!loaded.has(ctx)) {
      workletUrl ??= URL.createObjectURL(new Blob([NOISE_WORKLET_SRC], { type: "text/javascript" }));
      await ctx.audioWorklet.addModule(workletUrl);
      loaded.add(ctx);
    }
    const node = new AudioWorkletNode(ctx, "noise-generator", { numberOfInputs: 0, outputChannelCount: [2], processorOptions: { color, seed } });
    node.connect(gain);
    return { ctx, gain, node, setColor: (c) => node.port.postMessage({ color: c }) };
  }
  // Fallback for browsers without AudioWorklet: same generator in a ScriptProcessor.
  const l = createNoise(color, seed);
  const r = createNoise(color, (Math.imul(seed, 2654435761) ^ 0x5bd1e995) >>> 0);
  const node = ctx.createScriptProcessor(4096, 0, 2);
  node.onaudioprocess = (e) => {
    l.fill(e.outputBuffer.getChannelData(0));
    r.fill(e.outputBuffer.getChannelData(1));
  };
  node.connect(gain);
  return {
    ctx,
    gain,
    node,
    setColor: (c) => {
      l.setColor(c);
      r.setColor(c);
    },
  };
}

export default function NoiseGenerator({ locale, color: color0 = "white" }: { locale: Locale; color?: NoiseColor }) {
  const t = T[locale];
  const id = useId();
  const [color, setColor] = useState<NoiseColor>(color0);
  const [volume, setVolume] = useState(0.5);
  const [timer, setTimer] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const chain = useRef<Chain | null>(null);
  const endAt = useRef<number | null>(null);

  const stop = (fade = 0.3) => {
    const c = chain.current;
    chain.current = null;
    endAt.current = null;
    setPlaying(false);
    setLeft(null);
    if (!c) return;
    fadeGain(c.gain.gain, 0, c.ctx, fade);
    setTimeout(() => {
      c.node.disconnect();
      c.gain.disconnect();
      if ("onaudioprocess" in c.node) c.node.onaudioprocess = null;
    }, fade * 1000 + 80);
  };
  useEffect(() => () => stop(0.05), []);

  async function play() {
    setError(false);
    try {
      const ctx = await resumeAudio();
      const c = await buildChain(ctx, color);
      chain.current = c;
      fadeGain(c.gain.gain, volume * volume, ctx, 0.4);
      endAt.current = timer ? performance.now() + timer * 60000 : null;
      setPlaying(true);
    } catch {
      setError(true);
    }
  }

  // Colour change while playing: short dip so the filters' state change is inaudible.
  useEffect(() => {
    const c = chain.current;
    if (!c) return;
    fadeGain(c.gain.gain, 0, c.ctx, 0.06);
    const h = setTimeout(() => {
      c.setColor(color);
      fadeGain(c.gain.gain, volume * volume, c.ctx, 0.12);
    }, 70);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);
  useEffect(() => {
    const c = chain.current;
    if (c) smoothSet(c.gain.gain, volume * volume, c.ctx, 0.05);
  }, [volume]);
  useEffect(() => {
    if (playing) endAt.current = timer ? performance.now() + timer * 60000 : null;
  }, [timer, playing]);

  // Sleep timer with a 10-second fade-out.
  useEffect(() => {
    if (!playing) return;
    const h = setInterval(() => {
      const end = endAt.current;
      if (!end) {
        setLeft(null);
        return;
      }
      const rest = (end - performance.now()) / 1000;
      setLeft(Math.max(0, rest));
      if (rest <= 0) stop(10);
    }, 500);
    return () => clearInterval(h);
  }, [playing]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-6">
        <Segmented label={t.color} value={color} onChange={setColor} options={NOISE_COLORS.map((c) => ({ value: c, label: t.names[c] }))} wrap className="justify-center" />
        <Button variant={playing ? "danger" : "primary"} size="lg" onClick={() => (playing ? stop() : play())} className="h-16! min-w-56 text-lg!">
          {playing ? <Square className="fill-current" aria-hidden /> : <Play className="fill-current" aria-hidden />}
          {playing ? t.stop : t.play}
        </Button>
        {left !== null && (
          <p className="tabular text-2xl font-semibold text-fg">
            <span className="text-sm font-normal text-fg-3">{t.left}: </span>
            {formatTime(left, 0)}
          </p>
        )}
        <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm text-fg-2">
            {t.volume}
            <Slider min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-40" aria-label={t.volume} />
            <span className="tabular w-10">{Math.round(volume * 100)}%</span>
          </label>
          <Field label={t.timer} htmlFor={`${id}-t`} className="w-40">
            <Select id={`${id}-t`} size="sm" value={String(timer)} onChange={(e) => setTimer(Number(e.target.value))}>
              {TIMERS.map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? t.never : m < 60 ? `${m} ${t.min}` : `${m / 60} ${t.h}`}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>
      {error && <Notice tone="err">{t.err}</Notice>}
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
