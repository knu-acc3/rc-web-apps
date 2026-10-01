"use client";

import { Play, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Slider } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { Fab } from "@/tools/files/video/ui/Fab";
import { ChoiceChips, Setting } from "@/tools/files/video/ui/options";
import { formatTime } from "@/tools/files/shared/time";
import { createNoise, NOISE_COLORS, NOISE_WORKLET_SRC, type NoiseColor } from "../lib/noise";
import { fadeGain, resumeAudio, smoothSet } from "../lib/audio";

const T = {
  ru: {
    color: "Цвет шума",
    names: { white: "Белый", pink: "Розовый", brown: "Коричневый", blue: "Синий", violet: "Фиолетовый" } as Record<NoiseColor, string>,
    volume: "Громкость",
    timer: "Выключить через",
    never: "Не выключать",
    min: "мин",
    h: "ч",
    play: "Включить",
    stop: "Выключить",
    left: "Осталось",
    err: "Не удалось запустить звук в этом браузере.",
  },
  en: {
    color: "Noise colour",
    names: { white: "White", pink: "Pink", brown: "Brown", blue: "Blue", violet: "Violet" } as Record<NoiseColor, string>,
    volume: "Volume",
    timer: "Stop after",
    never: "Never",
    min: "min",
    h: "h",
    play: "Play",
    stop: "Stop",
    left: "Remaining",
    err: "Could not start audio in this browser.",
  },
} as const;

const TIMERS = [0, 5, 15, 30, 45, 60, 90, 120, 240, 480];
/** A dot of the noise's namesake colour next to its name. */
const SWATCH: Record<NoiseColor, string> = { white: "#ffffff", pink: "#f4a6c4", brown: "#8d5a3b", blue: "#4a7bf7", violet: "#8b5cf6" };

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

function NoiseGeneratorInner({ locale, color: color0 = "white" }: { locale: Locale; color?: NoiseColor }) {
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

  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        <Panel className="flex min-w-0 flex-col items-center gap-6 p-4 sm:p-6">
          <Segmented
            label={t.color}
            value={color}
            onChange={setColor}
            size="lg"
            className="justify-center"
            options={NOISE_COLORS.map((c) => ({ value: c, label: t.names[c], icon: <span aria-hidden className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: SWATCH[c] }} /> }))}
          />
          <Fab label={playing ? t.stop : t.play} icon={playing ? <Square className="fill-current" aria-hidden /> : <Play className="fill-current" aria-hidden />} onClick={() => (playing ? stop() : play())} active={playing} />
          {left !== null && (
            <p className="tabular flex items-baseline gap-2 text-2xl font-bold text-fg" aria-live="off">
              <span className="text-sm font-normal text-fg-3">{t.left}</span>
              {formatTime(left, 0)}
            </p>
          )}
        </Panel>
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
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
          <Setting label={t.timer}>
            <ChoiceChips label={t.timer} value={String(timer)} onChange={(x) => setTimer(Number(x))} options={TIMERS.map((m) => ({ value: String(m), label: m === 0 ? t.never : m < 60 ? `${m} ${t.min}` : `${formatNumber(locale, m / 60)} ${t.h}` }))} />
          </Setting>
        </Panel>
      </div>
      {error && <Notice tone="err">{t.err}</Notice>}
    </div>
  );
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function NoiseGenerator(props: { locale: Locale; color?: NoiseColor }) {
  return <NoiseGeneratorInner key={props.color ?? ""} {...props} />;
}
