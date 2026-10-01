"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Badge, Notice } from "@/ui/panel";
import { cssVar } from "./lib/media";
import { frameStats, snapRate, stability, type FrameStats, type Stability } from "./lib/refresh";

const MEASURE_MS = 5000;
const GRAPH_FRAMES = 240;

const T = {
  ru: {
    measuring: "Измеряем…",
    keep: "Не переключайте вкладку и не двигайте окно",
    again: "Измерить снова",
    hz: "Гц",
    ms: "мс",
    measured: (v: string) => `измерено ${v} Гц`,
    notStandard: "не совпадает со стандартной частотой — возможно, включён VRR или браузер ограничивает кадры",
    stats: "Подробности замера",
    median: "Медианный кадр",
    mean: "Средняя частота",
    jitter: "Разброс (станд. отклонение)",
    dropped: "Пропущенные кадры",
    frames: "Кадров в замере",
    range: "Мин. / макс. кадр",
    stability: { stable: "Стабильно", ok: "Небольшой разброс", unstable: "Нестабильно" } satisfies Record<Stability, string>,
    unstableHint: "Большой разброс: закройте тяжёлые вкладки и программы, подключите ноутбук к сети и повторите замер.",
    hidden: "Вкладка была в фоне — замер начат заново.",
    graph: "Время кадров, последние 240",
    live: "сейчас",
  },
  en: {
    measuring: "Measuring…",
    keep: "Keep this tab in front and the window still",
    again: "Measure again",
    hz: "Hz",
    ms: "ms",
    measured: (v: string) => `measured ${v} Hz`,
    notStandard: "doesn't match a standard rate — VRR may be on or the browser may be limiting frames",
    stats: "Measurement details",
    median: "Median frame",
    mean: "Average rate",
    jitter: "Jitter (std. deviation)",
    dropped: "Dropped frames",
    frames: "Frames measured",
    range: "Min / max frame",
    stability: { stable: "Stable", ok: "Slight jitter", unstable: "Unstable" } satisfies Record<Stability, string>,
    unstableHint: "High jitter: close heavy tabs and apps, plug the laptop in and measure again.",
    hidden: "The tab went to the background — the measurement restarted.",
    graph: "Frame times, last 240",
    live: "now",
  },
} as const;

function drawGraph(canvas: HTMLCanvasElement | null, xs: number[], refMs: number | null, colors: { bar: string; warn: string; line: string }) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const g = canvas.getContext("2d");
  if (!g) return;
  g.clearRect(0, 0, w, h);
  const ref = refMs ?? 16.7;
  const top = ref * 3; // show up to 3 frame periods
  const bw = w / GRAPH_FRAMES;
  const start = Math.max(0, xs.length - GRAPH_FRAMES);
  for (let i = start; i < xs.length; i++) {
    const v = Math.min(top, xs[i]);
    const bh = (v / top) * h;
    g.fillStyle = xs[i] > ref * 1.5 ? colors.warn : colors.bar;
    g.fillRect((i - start) * bw, h - bh, Math.max(1, bw - dpr * 0.5), bh);
  }
  if (refMs) {
    const y = h - (refMs / top) * h;
    g.strokeStyle = colors.line;
    g.lineWidth = dpr;
    g.setLineDash([4 * dpr, 4 * dpr]);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
    g.setLineDash([]);
  }
}

export default function RefreshRateTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [progress, setProgress] = useState(0);
  const [live, setLive] = useState<number | null>(null);
  const [stats, setStats] = useState<FrameStats | null>(null);
  const [restarted, setRestarted] = useState(false);
  const [run, setRun] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    let measureStart = 0;
    let measuring = true;
    let lastUi = 0;
    let refMs: number | null = null;
    const measured: number[] = [];
    const recent: number[] = [];
    let colors = { bar: cssVar("--accent", "#2952ff"), warn: cssVar("--err", "#c62828"), line: cssVar("--fg-3", "#71737b") };

    const loop = (now: number) => {
      if (last) {
        const dt = now - last;
        recent.push(dt);
        if (recent.length > GRAPH_FRAMES) recent.shift();
        if (measuring) {
          if (!measureStart) measureStart = last;
          measured.push(dt);
          if (now - measureStart >= MEASURE_MS) {
            measuring = false;
            setStats(frameStats(measured));
            setProgress(1);
          }
        }
      }
      last = now;
      if (now - lastUi > 250) {
        lastUi = now;
        colors = { bar: cssVar("--accent", colors.bar), warn: cssVar("--err", colors.warn), line: cssVar("--fg-3", colors.line) };
        const s = frameStats(recent.slice(-60));
        setLive(s ? s.medianHz : null);
        refMs = s ? 1000 / (snapRate(s.medianHz)?.rate ?? s.medianHz) : null;
        if (measuring && measureStart) setProgress(Math.min(1, (now - measureStart) / MEASURE_MS));
      }
      drawGraph(canvasRef.current, recent, refMs, colors);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        return;
      }
      // background tabs are throttled: throw the partial run away and start over
      if (measuring && measured.length) {
        measured.length = 0;
        measureStart = 0;
        setRestarted(true);
      }
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [run]);

  function again() {
    setStats(null);
    setProgress(0);
    setRestarted(false);
    setRun((n) => n + 1);
  }

  const snap = stats ? snapRate(stats.medianHz) : null;
  const stab = stats ? stability(stats) : null;
  const nf = (n: number, d = 1) => formatNumber(locale, n, { maximumFractionDigits: d, minimumFractionDigits: d });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-[0.75rem] border border-line bg-surface px-4 py-8 text-center sm:py-10">
        <div aria-live="polite" className="flex flex-col items-center gap-2">
          {stats && snap ? (
            <>
              <div className="tabular text-6xl font-bold tracking-tight text-fg sm:text-7xl">
                {snap.close ? snap.rate : nf(stats.medianHz)} <span className="text-3xl font-semibold text-fg-2 sm:text-4xl">{t.hz}</span>
              </div>
              <div className="text-[0.9375rem] text-fg-2">{snap.close ? t.measured(nf(stats.medianHz, 2)) : t.notStandard}</div>
              {stab && <Badge tone={stab === "stable" ? "ok" : stab === "ok" ? "neutral" : "warn"}>{t.stability[stab]}</Badge>}
            </>
          ) : (
            <>
              <div className="tabular text-6xl font-bold tracking-tight text-fg-3 sm:text-7xl">
                {live ? Math.round(live) : "—"} <span className="text-3xl font-semibold sm:text-4xl">{t.hz}</span>
              </div>
              <div className="text-[0.9375rem] text-fg-2">
                {t.measuring} {t.keep}
              </div>
            </>
          )}
        </div>
        {!stats && (
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
        {stats && (
          <Button variant="outline" size="sm" onClick={again} className="mt-3">
            <RotateCcw aria-hidden />
            {t.again}
          </Button>
        )}
      </div>

      {restarted && !stats && <Notice>{t.hidden}</Notice>}
      {stab === "unstable" && <Notice tone="warn">{t.unstableHint}</Notice>}

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium text-fg-2">{t.graph}</span>
          <span className="tabular text-fg-3">
            {t.live}: {live ? `${nf(live)} ${t.hz}` : "—"}
          </span>
        </div>
        <canvas ref={canvasRef} className="block h-24 w-full rounded-[0.625rem] bg-surface-2" aria-hidden />
      </div>

      {stats && (
        <dl className="facts">
          <div>
            <dt>{t.median}</dt>
            <dd className="tabular">
              {nf(stats.medianMs, 2)} {t.ms} ({nf(stats.medianHz, 2)} {t.hz})
            </dd>
          </div>
          <div>
            <dt>{t.mean}</dt>
            <dd className="tabular">
              {nf(stats.meanHz, 2)} {t.hz}
            </dd>
          </div>
          <div>
            <dt>{t.jitter}</dt>
            <dd className="tabular">
              {nf(stats.stdDevMs, 2)} {t.ms}
            </dd>
          </div>
          <div>
            <dt>{t.dropped}</dt>
            <dd className="tabular">{stats.dropped}</dd>
          </div>
          <div>
            <dt>{t.range}</dt>
            <dd className="tabular">
              {nf(stats.minMs, 2)} / {nf(stats.maxMs, 2)} {t.ms}
            </dd>
          </div>
          <div>
            <dt>{t.frames}</dt>
            <dd className="tabular">{stats.frames}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
