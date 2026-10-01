"use client";

import { Play } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Notice, Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { useReducedMotion } from "@/tools/design/color/ui/hooks";
import { BEZIER_PRESETS, bezierCss, parseBezier, type Bezier } from "./lib/bezier";
import { round } from "./lib/tokens";
import { CodePanel, NumberSlider } from "./ui/kit";

const T = {
  ru: {
    graph: "График кривой: перетащите точки или выберите их клавишей Tab и двигайте стрелками",
    p1: "Первая контрольная точка",
    p2: "Вторая контрольная точка",
    preset: "Готовые кривые",
    paste: "Или вставьте значение",
    invalid: "Нужно cubic-bezier(x1, y1, x2, y2), где x от 0 до 1",
    copy: "Копировать",
    copied: "Скопировано",
    linear: "linear",
    yours: "ваша кривая",
    duration: "Длительность",
    sec: "с",
    reduced: "В системе включено «Уменьшить движение», поэтому превью не запускается само.",
    play: "Воспроизвести",
  },
  en: {
    graph: "Curve graph: drag the points, or Tab to them and move with the arrow keys",
    p1: "First control point",
    p2: "Second control point",
    preset: "Presets",
    paste: "Or paste a value",
    invalid: "Expected cubic-bezier(x1, y1, x2, y2) with x between 0 and 1",
    copy: "Copy",
    copied: "Copied",
    linear: "linear",
    yours: "your curve",
    duration: "Duration",
    sec: "s",
    reduced: "Your system asks for reduced motion, so the preview doesn't start on its own.",
    play: "Play",
  },
} as const;

const W = 240;
const PAD_X = 30;
const PAD_Y = 70;
const X = (x: number) => PAD_X + W * x;
const Y = (y: number) => PAD_Y + W * (1 - y);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function CubicBezierEditor({ locale, value = [0.25, 0.1, 0.25, 1] }: { locale: Locale; value?: Bezier }) {
  const t = T[locale];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduced = useReducedMotion();
  const [b, setB] = useState<Bezier>(value);
  const [text, setText] = useState("");
  const [duration, setDuration] = useState(1.2);
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<0 | 1 | null>(null);
  const css = bezierCss(b);
  const parsed = text.trim() ? parseBezier(text) : null;

  function toPoint(e: PointerEvent): [number, number] | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const sx = ((e.clientX - r.left) / r.width) * vb.width;
    const sy = ((e.clientY - r.top) / r.height) * vb.height;
    return [clamp((sx - PAD_X) / W, 0, 1), clamp(1 - (sy - PAD_Y) / W, -1, 2)];
  }
  function move(i: 0 | 1, x: number, y: number) {
    setB((prev) => {
      const next = [...prev] as Bezier;
      next[i * 2] = Math.round(clamp(x, 0, 1) * 1000) / 1000;
      next[i * 2 + 1] = Math.round(clamp(y, -1, 2) * 1000) / 1000;
      return next;
    });
  }
  function onKey(i: 0 | 1, e: KeyboardEvent) {
    const step = e.shiftKey ? 0.1 : 0.01;
    const [x, y] = [b[i * 2], b[i * 2 + 1]];
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    move(i, x + d[0], y + d[1]);
  }

  const playing = !reduced || force;
  const imp = reduced && force ? " !important" : "";
  const anim = `pv-${id}`;
  const style = `@keyframes ${anim} { from { left: 0; } to { left: calc(100% - 18px); } }
.${anim}-a, .${anim}-b { ${playing ? `animation: ${anim} ${duration}s ${css} 0.3s infinite alternate both${imp}; animation-duration: ${duration}s${imp}; animation-iteration-count: infinite${imp};` : ""} }
.${anim}-a { ${playing ? `animation-timing-function: linear${imp};` : ""} }`;

  const handle = (i: 0 | 1) => (
    <circle
      cx={X(b[i * 2])}
      cy={Y(b[i * 2 + 1])}
      r={10}
      tabIndex={0}
      role="slider"
      aria-label={i === 0 ? t.p1 : t.p2}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={b[i * 2]}
      aria-valuetext={`x ${b[i * 2]}, y ${b[i * 2 + 1]}`}
      onKeyDown={(e) => onKey(i, e)}
      onPointerDown={(e) => {
        drag.current = i;
        svgRef.current?.setPointerCapture(e.pointerId);
        e.currentTarget.focus();
      }}
      className="cursor-grab fill-accent stroke-white outline-none focus-visible:stroke-fg"
      strokeWidth={3}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel className="p-3 sm:p-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W + PAD_X * 2} ${W + PAD_Y * 2}`}
            className="mx-auto block w-full max-w-sm touch-none select-none"
            role="group"
            aria-label={t.graph}
            onPointerMove={(e) => {
              if (drag.current === null) return;
              const p = toPoint(e);
              if (p) move(drag.current, p[0], p[1]);
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <rect x={X(0)} y={Y(1)} width={W} height={W} className="fill-surface-2 stroke-line" />
            {[0.25, 0.5, 0.75].map((g) => (
              <g key={g} className="stroke-line">
                <line x1={X(g)} y1={Y(0)} x2={X(g)} y2={Y(1)} />
                <line x1={X(0)} y1={Y(g)} x2={X(1)} y2={Y(g)} />
              </g>
            ))}
            <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} className="stroke-fg-3" strokeDasharray="4 4" />
            <line x1={X(0)} y1={Y(0)} x2={X(b[0])} y2={Y(b[1])} className="stroke-fg-2" strokeWidth={1.5} />
            <line x1={X(1)} y1={Y(1)} x2={X(b[2])} y2={Y(b[3])} className="stroke-fg-2" strokeWidth={1.5} />
            <path d={`M ${X(0)} ${Y(0)} C ${X(b[0])} ${Y(b[1])}, ${X(b[2])} ${Y(b[3])}, ${X(1)} ${Y(1)}`} className="fill-none stroke-fg" strokeWidth={3} />
            {handle(0)}
            {handle(1)}
          </svg>
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 rounded-[1rem] bg-surface-2 py-2 pr-2 pl-4">
              <code className="min-w-0 font-mono text-lg font-semibold break-words [overflow-wrap:anywhere] text-fg sm:text-xl">{css}</code>
              <CopyButton value={css} label={t.copy} copiedLabel={t.copied} size="md" variant="primary" compact />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["x1", "y1", "x2", "y2"] as const).map((k, i) => (
                <Field key={k} label={k} htmlFor={`${id}-${k}`}>
                  <NumberInput
                    id={`${id}-${k}`}
                    step={0.01}
                    decimals={2}
                    min={i % 2 === 0 ? 0 : -1}
                    max={i % 2 === 0 ? 1 : 2}
                    value={b[i]}
                    onChange={(v) => {
                      if (v === null) return;
                      const next = [...b] as Bezier;
                      next[i] = i % 2 === 0 ? clamp(v, 0, 1) : v;
                      setB(next);
                    }}
                    size="sm"
                  />
                </Field>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.preset}</span>
              <ScrollRow label={t.preset} rowClassName="gap-1.5">
                {BEZIER_PRESETS.map((p) => (
                  <button key={p.name} type="button" aria-pressed={p.value.every((x, k) => x === b[k])} onClick={() => setB(p.value)} className="chip shrink-0 font-mono text-[0.8125rem]!">
                    {p.name}
                  </button>
                ))}
              </ScrollRow>
            </div>
            <Field label={t.paste} htmlFor={`${id}-ps`} error={text.trim() && !parsed ? t.invalid : undefined}>
              <Input
                id={`${id}-ps`}
                value={text}
                placeholder="cubic-bezier(0.4, 0, 0.2, 1)"
                className="font-mono"
                size="sm"
                autoComplete="off"
                onChange={(e) => {
                  setText(e.target.value);
                  const p = parseBezier(e.target.value);
                  if (p) setB(p);
                }}
              />
            </Field>
          </Panel>

          <Panel className="flex flex-col gap-4 p-4 sm:p-5">
            <style>{style}</style>
            {[
              { cls: `${anim}-a`, label: t.linear },
              { cls: `${anim}-b`, label: t.yours },
            ].map((row) => (
              <div key={row.cls}>
                <div className="mb-1 text-xs text-fg-3">{row.label}</div>
                <div className="relative h-5 rounded-full bg-surface-2">
                  <span key={run} className={`${row.cls} absolute top-0.5 left-0 size-4 rounded-full bg-accent`} />
                </div>
              </div>
            ))}
            <NumberSlider label={t.duration} value={duration} min={0.2} max={10} step={0.1} unit={t.sec} onChange={(v) => setDuration(clamp(v, 0.2, 10))} />
            {reduced && !force && (
              <Button
                variant="outlined"
                className="self-start"
                onClick={() => {
                  setForce(true);
                  setRun((r) => r + 1);
                }}
              >
                <Play aria-hidden />
                {t.play}
              </Button>
            )}
            {reduced && !force && <Notice>{t.reduced}</Notice>}
          </Panel>
        </div>
      </div>
      <CodePanel
        locale={locale}
        tabs={[{ id: "css", label: "CSS", code: `transition: transform ${round(duration, 2)}s ${css};\n/* or */\nanimation-timing-function: ${css};`, filename: "easing.css" }]}
        minRows={3}
      />
    </div>
  );
}
