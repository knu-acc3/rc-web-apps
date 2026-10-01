"use client";

/**
 * Tiny hand-written SVG charts (no chart library). Lines/bars are drawn in a
 * stretched 1000×1000 SVG with non-scaling strokes; axis labels are HTML, so
 * text stays readable at any width (works at 360px). Colors come from design
 * tokens only, so charts follow light/dark themes.
 */

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { niceTicks } from "./ticks";

type Tone = "accent" | "ok" | "warn" | "err" | "muted";
const TONE: Record<Tone, string> = {
  accent: "var(--accent)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
  muted: "var(--fg-3)",
};

interface Series {
  label: string;
  values: number[];
  tone: Tone;
  dashed?: boolean;
  /** Fill the area under the line (light tint). */
  area?: boolean;
}

const PAD = { l: 60, r: 10, t: 10, b: 26 };

function Legend({ items }: { items: { label: string; tone: Tone; dashed?: boolean }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-fg-2">
      {items.map((s) => (
        <li key={s.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-0.5 w-4 rounded"
            style={s.dashed ? { borderTop: `2px dashed ${TONE[s.tone]}`, height: 0 } : { background: TONE[s.tone], height: 3 }}
          />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function pickXTicks(n: number, max = 6): number[] {
  if (n <= 1) return [0];
  const step = Math.max(1, Math.ceil((n - 1) / (max - 1)));
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(i);
  if (out[out.length - 1] !== n - 1) {
    if (n - 1 - out[out.length - 1] < step / 2) out.pop();
    out.push(n - 1);
  }
  return out;
}

/** Multi-series line chart over a shared numeric x axis. */
export function LineChart({
  x,
  series,
  xFormat,
  yFormat,
  height = 220,
  ariaLabel,
  zeroBased = true,
  className,
}: {
  x: number[];
  series: Series[];
  xFormat: (x: number) => string;
  yFormat: (y: number) => string;
  height?: number;
  ariaLabel: string;
  /** Always include 0 on the y axis. */
  zeroBased?: boolean;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = x.length;
  const vals = series.flatMap((s) => s.values).filter(Number.isFinite);
  if (n < 2 || vals.length === 0) return null;
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (zeroBased) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  const yt = niceTicks(lo, hi, 4);
  const x0 = x[0];
  const x1 = x[n - 1];
  const fx = (v: number) => (x1 === x0 ? 0 : (v - x0) / (x1 - x0));
  const fy = (v: number) => (yt.max === yt.min ? 0.5 : (v - yt.min) / (yt.max - yt.min));
  const path = (vs: number[]) => {
    let d = "";
    vs.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      d += `${d ? "L" : "M"}${(fx(x[i]) * 1000).toFixed(1)} ${((1 - fy(v)) * 1000).toFixed(1)}`;
    });
    return d;
  };
  const xt = pickXTicks(n);
  const h = hover;

  return (
    <figure className={cn("min-w-0", className)}>
      <div className="relative select-none" style={{ height }} role="img" aria-label={ariaLabel}>
        {yt.values.map((v) => (
          <div
            key={`y${v}`}
            className="tabular absolute left-0 -translate-y-1/2 truncate pr-2 text-right text-[0.6875rem] text-fg-3"
            style={{ top: `calc(${PAD.t}px + (100% - ${PAD.t + PAD.b}px) * ${1 - fy(v)})`, width: PAD.l }}
          >
            {yFormat(v)}
          </div>
        ))}
        {xt.map((i) => (
          <div
            key={`x${i}`}
            className="tabular absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[0.6875rem] text-fg-3"
            style={{ left: `calc(${PAD.l}px + (100% - ${PAD.l + PAD.r}px) * ${fx(x[i])})` }}
          >
            {xFormat(x[i])}
          </div>
        ))}
        <div
          className="absolute touch-pan-y"
          style={{ left: PAD.l, right: PAD.r, top: PAD.t, bottom: PAD.b }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
            const target = x0 + f * (x1 - x0);
            let best = 0;
            for (let i = 1; i < n; i++) if (Math.abs(x[i] - target) < Math.abs(x[best] - target)) best = i;
            setHover(best);
          }}
          onPointerLeave={() => setHover(null)}
        >
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
            {yt.values.map((v) => (
              <line
                key={v}
                x1={0}
                x2={1000}
                y1={(1 - fy(v)) * 1000}
                y2={(1 - fy(v)) * 1000}
                stroke={v === 0 ? "var(--line-strong)" : "var(--line)"}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {series.map((s) =>
              s.area ? (
                <path
                  key={`a-${s.label}`}
                  d={`${path(s.values)}L1000 ${((1 - fy(Math.max(yt.min, 0))) * 1000).toFixed(1)}L0 ${((1 - fy(Math.max(yt.min, 0))) * 1000).toFixed(1)}Z`}
                  fill={TONE[s.tone]}
                  opacity={0.1}
                />
              ) : null,
            )}
            {series.map((s) => (
              <path
                key={s.label}
                d={path(s.values)}
                fill="none"
                stroke={TONE[s.tone]}
                strokeWidth={2.25}
                strokeDasharray={s.dashed ? "6 5" : undefined}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {h !== null && <line x1={fx(x[h]) * 1000} x2={fx(x[h]) * 1000} y1={0} y2={1000} stroke="var(--fg-3)" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
          </svg>
          {h !== null && (
            <div
              className="pointer-events-none absolute top-1 z-[2] min-w-36 rounded-[0.5rem] border border-line bg-surface px-2.5 py-1.5 text-[0.75rem] shadow-[var(--shadow-overlay)]"
              style={fx(x[h]) > 0.55 ? { right: `${(1 - fx(x[h])) * 100}%`, marginRight: 8 } : { left: `${fx(x[h]) * 100}%`, marginLeft: 8 }}
            >
              <div className="font-semibold text-fg">{xFormat(x[h])}</div>
              {series.map((s) => (
                <div key={s.label} className="tabular flex items-center justify-between gap-3 text-fg-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: TONE[s.tone] }} />
                    {s.label}
                  </span>
                  <span className="font-medium text-fg">{Number.isFinite(s.values[h]) ? yFormat(s.values[h]) : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Legend items={series} />
    </figure>
  );
}

/** Vertical bars (stacked when several series are given). */
export function BarChart({
  labels,
  series,
  yFormat,
  height = 220,
  ariaLabel,
  className,
  maxLabels = 8,
}: {
  labels: string[];
  series: Series[];
  yFormat: (y: number) => string;
  height?: number;
  ariaLabel: string;
  className?: string;
  maxLabels?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  if (n === 0) return null;
  const totals = labels.map((_, i) => series.reduce((s, x) => s + Math.max(0, x.values[i] || 0), 0));
  const yt = niceTicks(0, Math.max(...totals, 0), 4);
  const fy = (v: number) => (yt.max === 0 ? 0 : v / yt.max);
  const slot = 1000 / n;
  const bw = Math.max(2, slot * 0.68);
  const step = Math.max(1, Math.ceil(n / maxLabels));

  return (
    <figure className={cn("min-w-0", className)}>
      <div className="relative select-none" style={{ height }} role="img" aria-label={ariaLabel}>
        {yt.values.map((v) => (
          <div
            key={`y${v}`}
            className="tabular absolute left-0 -translate-y-1/2 truncate pr-2 text-right text-[0.6875rem] text-fg-3"
            style={{ top: `calc(${PAD.t}px + (100% - ${PAD.t + PAD.b}px) * ${1 - fy(v)})`, width: PAD.l }}
          >
            {yFormat(v)}
          </div>
        ))}
        {labels.map((l, i) =>
          i % step === 0 ? (
            <div
              key={`x${i}`}
              className="tabular absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[0.6875rem] text-fg-3"
              style={{ left: `calc(${PAD.l}px + (100% - ${PAD.l + PAD.r}px) * ${(i + 0.5) / n})` }}
            >
              {l}
            </div>
          ) : null,
        )}
        <div
          className="absolute touch-pan-y"
          style={{ left: PAD.l, right: PAD.r, top: PAD.t, bottom: PAD.b }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n))));
          }}
          onPointerLeave={() => setHover(null)}
        >
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            {yt.values.map((v) => (
              <line key={v} x1={0} x2={1000} y1={(1 - fy(v)) * 1000} y2={(1 - fy(v)) * 1000} stroke={v === 0 ? "var(--line-strong)" : "var(--line)"} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {labels.map((_, i) => (
              <g key={i} opacity={hover === null || hover === i ? 1 : 0.55}>
                {series.map((s, k) => {
                  const below = series.slice(0, k).reduce((sum, x) => sum + Math.max(0, x.values[i] || 0), 0);
                  const v = Math.max(0, s.values[i] || 0);
                  const y0 = 1000 - fy(below) * 1000;
                  const y1 = 1000 - fy(below + v) * 1000;
                  return <rect key={s.label} x={i * slot + (slot - bw) / 2} width={bw} y={y1} height={Math.max(0, y0 - y1)} fill={TONE[s.tone]} />;
                })}
              </g>
            ))}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-1 z-[2] min-w-36 rounded-[0.5rem] border border-line bg-surface px-2.5 py-1.5 text-[0.75rem] shadow-[var(--shadow-overlay)]"
              style={(hover + 0.5) / n > 0.55 ? { right: `${(1 - hover / n) * 100}%`, marginRight: 4 } : { left: `${((hover + 1) / n) * 100}%`, marginLeft: 4 }}
            >
              <div className="font-semibold text-fg">{labels[hover]}</div>
              {series.map((s) => (
                <div key={s.label} className="tabular flex items-center justify-between gap-3 text-fg-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: TONE[s.tone] }} />
                    {s.label}
                  </span>
                  <span className="font-medium text-fg">{yFormat(s.values[hover] || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Legend items={series} />
    </figure>
  );
}

/** Donut chart with a legend (shares of a whole). */
export function Donut({
  parts,
  format,
  center,
  size = 148,
  ariaLabel,
  className,
}: {
  parts: { label: string; value: number; tone: Tone }[];
  format: (v: number) => string;
  center?: ReactNode;
  size?: number;
  ariaLabel: string;
  className?: string;
}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  const shares = parts.map((p) => (total > 0 ? (Math.max(0, p.value) / total) * 100 : 0));
  const offsets = shares.map((_, i) => shares.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <figure className={cn("flex flex-wrap items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={ariaLabel}>
        <svg viewBox="0 0 42 42" className="size-full -rotate-90" aria-hidden>
          <circle cx={21} cy={21} r={15.915} fill="none" stroke="var(--surface-2)" strokeWidth={6} />
          {total > 0 &&
            parts.map((p, i) => (
              <circle
                key={p.label}
                cx={21}
                cy={21}
                r={15.915}
                fill="none"
                stroke={TONE[p.tone]}
                strokeWidth={6}
                strokeDasharray={`${shares[i]} ${100 - shares[i]}`}
                strokeDashoffset={-offsets[i]}
              />
            ))}
        </svg>
        {center && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold text-fg">{center}</div>}
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 text-fg-2">
              <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: TONE[p.tone] }} />
              <span className="truncate">{p.label}</span>
            </span>
            <span className="tabular shrink-0 font-semibold text-fg">
              {format(p.value)}
              {total > 0 && <span className="ml-1.5 font-normal text-fg-3">{Math.round((Math.max(0, p.value) / total) * 100)}%</span>}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Horizontal category scale with a marker (BMI classes, body-fat ranges…). */
export function ScaleBar({
  min,
  max,
  segments,
  value,
  format,
  ariaLabel,
  className,
}: {
  min: number;
  max: number;
  /** Consecutive segments; `to` is the upper bound of each (the last one may equal max). */
  segments: { to: number; label: string; tone: Tone; strength?: number }[];
  value: number | null;
  format: (v: number) => string;
  ariaLabel: string;
  className?: string;
}) {
  const f = (v: number) => Math.min(1, Math.max(0, (v - min) / (max - min)));
  const segs = segments.map((s, i) => {
    const from = i === 0 ? min : segments[i - 1].to;
    return { ...s, from, w: f(Math.min(s.to, max)) - f(from) };
  });
  return (
    <figure className={cn("min-w-0", className)} role="img" aria-label={ariaLabel}>
      <div className="relative pt-5">
        {value !== null && Number.isFinite(value) && (
          <div className="absolute top-0 -translate-x-1/2" style={{ left: `${f(value) * 100}%` }} aria-hidden>
            <div className="tabular -mt-0.5 whitespace-nowrap text-center text-[0.75rem] font-semibold text-fg">{format(value)}</div>
          </div>
        )}
        <div className="flex h-3 overflow-hidden rounded-full">
          {segs.map((s) => (
            <div
              key={s.label}
              style={{ width: `${s.w * 100}%`, background: `color-mix(in oklab, ${TONE[s.tone]} ${Math.round((s.strength ?? 0.75) * 100)}%, transparent)` }}
            />
          ))}
        </div>
        {value !== null && Number.isFinite(value) && (
          <div className="absolute top-[1.125rem] h-4 w-1 -translate-x-1/2 rounded-full border border-surface bg-fg" style={{ left: `${f(value) * 100}%` }} aria-hidden />
        )}
      </div>
      <div className="relative mt-1.5 h-4 text-[0.6875rem] text-fg-3" aria-hidden>
        {segs.slice(0, -1).map((s) => (
          <span key={s.label} className="tabular absolute -translate-x-1/2" style={{ left: `${f(s.to) * 100}%` }}>
            {format(s.to)}
          </span>
        ))}
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.75rem] text-fg-2">
        {segs.map((s) => (
          <li key={s.label} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-full"
              style={{ background: `color-mix(in oklab, ${TONE[s.tone]} ${Math.round((s.strength ?? 0.75) * 100)}%, transparent)` }}
            />
            {s.label}
          </li>
        ))}
      </ul>
    </figure>
  );
}
