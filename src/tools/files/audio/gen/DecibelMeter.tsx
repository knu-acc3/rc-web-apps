"use client";

import { Mic, MicOff, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { Fab } from "@/tools/files/video/ui/Fab";
import { Setting } from "@/tools/files/video/ui/options";
import { cssColor, mediaErrorKind, openMicrophone, resumeAudio, stopStream, toDb } from "../lib/audio";

const T = {
  ru: {
    start: "Включить микрофон",
    stop: "Выключить",
    reset: "Сбросить",
    level: "Уровень",
    peak: "Пик",
    min: "Мин.",
    max: "Макс.",
    avg: "Среднее (Leq)",
    speed: "Усреднение",
    fast: "Быстрое (0,125 с)",
    slow: "Медленное (1 с)",
    offset: "Калибровка (поправка)",
    unitFs: "dBFS",
    unitCal: "дБ (калибр.)",
    honest: "Это уровень сигнала микрофона в dBFS (0 = максимум), а не звуковое давление: браузер не знает чувствительность микрофона. Для примерных децибел сравните с настоящим шумомером и введите поправку.",
    errors: {
      denied: "Доступ к микрофону запрещён. Разрешите его в настройках сайта и попробуйте снова.",
      notfound: "Микрофон не найден.",
      busy: "Микрофон занят другой программой.",
      insecure: "Микрофон доступен только на защищённой странице (HTTPS).",
      unsupported: "Браузер не поддерживает доступ к микрофону.",
      other: "Не удалось включить микрофон.",
    },
  },
  en: {
    start: "Turn on microphone",
    stop: "Turn off",
    reset: "Reset",
    level: "Level",
    peak: "Peak",
    min: "Min",
    max: "Max",
    avg: "Average (Leq)",
    speed: "Averaging",
    fast: "Fast (0.125 s)",
    slow: "Slow (1 s)",
    offset: "Calibration (offset)",
    unitFs: "dBFS",
    unitCal: "dB (calibrated)",
    honest: "This is the microphone signal level in dBFS (0 = full scale), not sound pressure: the browser doesn't know the microphone's sensitivity. For approximate decibels, compare with a real sound level meter and enter the offset.",
    errors: {
      denied: "Microphone access was denied. Allow it in the site settings and try again.",
      notfound: "No microphone found.",
      busy: "The microphone is used by another app.",
      insecure: "The microphone is only available on a secure (HTTPS) page.",
      unsupported: "This browser doesn't support microphone access.",
      other: "Could not turn on the microphone.",
    },
  },
} as const;

interface Stats {
  level: number;
  peak: number;
  min: number;
  max: number;
  leq: number;
}

const FLOOR = -100;

export default function DecibelMeter({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [speed, setSpeed] = useState<"fast" | "slow">("fast");
  const [offset, setOffset] = useState(0);
  const graph = useRef<HTMLCanvasElement>(null);
  const live = useRef<{ stream: MediaStream; src: MediaStreamAudioSourceNode; raf: number; reset: () => void } | null>(null);
  const tau = useRef(0.125);
  useEffect(() => {
    tau.current = speed === "fast" ? 0.125 : 1;
  }, [speed]);
  const offRef = useRef(offset);
  useEffect(() => {
    offRef.current = offset;
  }, [offset]);

  const stop = () => {
    const l = live.current;
    live.current = null;
    setOn(false);
    if (!l) return;
    cancelAnimationFrame(l.raf);
    l.src.disconnect();
    stopStream(l.stream);
  };
  useEffect(() => () => stop(), []);

  async function start() {
    setError(null);
    try {
      const ctx = await resumeAudio();
      const stream = await openMicrophone({ raw: true });
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      const buf = new Float32Array(an.fftSize);
      let ms = 0; // smoothed mean square
      let energy = 0;
      let count = 0;
      let peak = FLOOR;
      let min = Infinity;
      let max = FLOOR;
      const hist: number[] = [];
      let lastT = performance.now();
      let lastPaint = 0;
      let lastHist = 0;
      const l = {
        stream,
        src,
        raf: 0,
        reset: () => {
          energy = 0;
          count = 0;
          peak = FLOOR;
          min = Infinity;
          max = FLOOR;
          hist.length = 0;
        },
      };
      live.current = l;
      setOn(true);
      const loop = (now: number) => {
        l.raf = requestAnimationFrame(loop);
        const dt = Math.max(0.001, (now - lastT) / 1000);
        lastT = now;
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        let pk = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = buf[i];
          sum += v * v;
          const a = Math.abs(v);
          if (a > pk) pk = a;
        }
        const msNow = sum / buf.length;
        const k = 1 - Math.exp(-dt / tau.current);
        ms += (msNow - ms) * k;
        energy += msNow;
        count++;
        const level = Math.max(FLOOR, toDb(Math.sqrt(ms)));
        peak = Math.max(peak, toDb(pk));
        if (count > 10) {
          min = Math.min(min, level);
          max = Math.max(max, level);
        }
        if (now - lastHist > 100) {
          lastHist = now;
          hist.push(level);
          if (hist.length > 300) hist.shift();
          drawGraph(graph.current, hist, offRef.current);
        }
        if (now - lastPaint > 150) {
          lastPaint = now;
          setStats({ level, peak, min: Number.isFinite(min) ? min : level, max, leq: Math.max(FLOOR, toDb(Math.sqrt(energy / count))) });
        }
      };
      l.raf = requestAnimationFrame(loop);
    } catch (e) {
      stop();
      setError(t.errors[mediaErrorKind(e)]);
    }
  }

  const cal = offset !== 0;
  const fmt = (db: number) => formatNumber(locale, Math.round((db + offset) * 10) / 10, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const unit = cal ? t.unitCal : t.unitFs;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
      <Panel className="flex min-w-0 flex-col items-center gap-5 p-4 sm:p-6">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-fg-3">{t.level}</span>
          <span className="tabular text-7xl font-bold leading-none tracking-tight text-fg sm:text-8xl">{on && stats ? fmt(stats.level) : "—"}</span>
          <span className="mt-1 text-sm font-medium text-fg-2">{unit}</span>
        </div>
        <canvas ref={graph} className="h-24 w-full rounded-[1rem] bg-surface-2 sm:h-32" aria-hidden />
        <dl className="grid w-full grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {(
            [
              [t.peak, stats?.peak],
              [t.min, stats?.min],
              [t.max, stats?.max],
              [t.avg, stats?.leq],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-[1rem] bg-surface-2 px-2 py-2.5">
              <dt className="text-[0.75rem] text-fg-3">{k}</dt>
              <dd className="tabular text-xl font-bold text-fg">{on && v !== undefined ? fmt(v) : "—"}</dd>
            </div>
          ))}
        </dl>
        <Fab label={on ? t.stop : t.start} icon={on ? <MicOff aria-hidden /> : <Mic aria-hidden />} onClick={() => (on ? stop() : start())} active={on} />
        {on && (
          <Button variant="text" size="sm" onClick={() => live.current?.reset()}>
            <RotateCcw aria-hidden />
            {t.reset}
          </Button>
        )}
      </Panel>
      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <Setting label={t.speed}>
            <Segmented label={t.speed} value={speed} onChange={setSpeed} options={[{ value: "fast", label: t.fast }, { value: "slow", label: t.slow }]} />
          </Setting>
          <Field label={t.offset} htmlFor={`${id}-o`}>
            <NumberInput id={`${id}-o`} locale={locale} value={offset} min={-50} max={200} step={1} decimals={1} suffix={locale === "ru" ? "дБ" : "dB"} onChange={(v) => setOffset(v ?? 0)} />
          </Field>
        </Panel>
        {error && <Notice tone="err">{error}</Notice>}
        <Notice>{t.honest}</Notice>
      </div>
    </div>
  );
}

function drawGraph(c: HTMLCanvasElement | null, hist: number[], offset: number) {
  if (!c) return;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(c.clientWidth * dpr);
  const h = Math.round(c.clientHeight * dpr);
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  const g = c.getContext("2d");
  if (!g) return;
  g.clearRect(0, 0, w, h);
  g.strokeStyle = cssColor("--line-strong", "#999");
  g.lineWidth = 1;
  for (const db of [-80, -60, -40, -20]) {
    const y = h * (1 - (db - FLOOR) / -FLOOR);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.strokeStyle = cssColor("--accent", "#2952ff");
  g.lineWidth = 2 * dpr;
  g.beginPath();
  const n = 300;
  hist.forEach((v, i) => {
    const x = w - ((hist.length - 1 - i) / (n - 1)) * w;
    const y = h * (1 - (Math.min(0, v) - FLOOR) / -FLOOR);
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  });
  g.stroke();
  void offset;
}
