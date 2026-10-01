"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { angleAt, armsAngle, polar, snapAngle } from "./lib/geometry";

const T = {
  ru: {
    arm: (n: number) => `Луч ${n}`,
    angle: "Угол между лучами",
    supplement: "Смежный",
    radians: "радианы",
    arms: "Положение лучей",
    step: "Шаг",
    reset: "Сбросить",
    hint: "Перетащите круглые ручки лучей мышью или пальцем, нажмите на шкалу, чтобы перенести ближайший луч, или выберите ручку клавишей Tab и двигайте стрелками (Shift — по 10°).",
    label: "Транспортир",
  },
  en: {
    arm: (n: number) => `Arm ${n}`,
    angle: "Angle between arms",
    supplement: "Supplement",
    radians: "radians",
    arms: "Arm positions",
    step: "Step",
    reset: "Reset",
    hint: "Drag the round arm handles with a mouse or finger, tap the scale to move the nearest arm, or Tab to a handle and use the arrow keys (Shift for 10° steps).",
    label: "Protractor",
  },
} as const;

const W = 440;
const H = 238;
const CX = 220;
const CY = 222;
const R = 210;
const KNOB = R - 16;

export default function Protractor({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [arms, setArms] = useState<[number, number]>([0, 60]);
  const [step, setStep] = useState<"1" | "0.5" | "0.1">("1");
  const [focus, setFocus] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<number | null>(null);

  const st = Number(step);
  const nf = (n: number, d = 1) => formatNumber(locale, n, { maximumFractionDigits: d });
  const angle = armsAngle(arms[0], arms[1]);

  function toSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: pt.x, y: pt.y };
  }

  function setArm(i: number, deg: number) {
    const v = snapAngle(deg, st);
    setArms((prev) => (i === 0 ? [v, prev[1]] : [prev[0], v]));
  }

  function angleFromEvent(e: { clientX: number; clientY: number }) {
    const p = toSvg(e.clientX, e.clientY);
    return p ? angleAt(CX, CY, p.x, p.y) : null;
  }

  function onKey(i: number, e: KeyboardEvent<SVGGElement>) {
    const big = 10;
    const cur = arms[i];
    let next: number | null = null;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = cur + (e.shiftKey ? big : st);
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") next = cur - (e.shiftKey ? big : st);
    else if (e.key === "PageUp") next = cur + big;
    else if (e.key === "PageDown") next = cur - big;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 180;
    if (next === null) return;
    e.preventDefault();
    setArm(i, Math.min(180, Math.max(0, next)));
  }

  // Scale ticks (every degree) and labels (every 10°, outer 0→180 from the right, inner reversed).
  let ticks = "";
  for (let d = 0; d <= 180; d++) {
    const len = d % 10 === 0 ? 18 : d % 5 === 0 ? 12 : 7;
    const a = polar(CX, CY, R, d);
    const b = polar(CX, CY, R - len, d);
    ticks += `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  const labels = Array.from({ length: 19 }, (_, i) => i * 10);
  const lo = Math.min(arms[0], arms[1]);
  const hi = Math.max(arms[0], arms[1]);
  const arcR = 46;
  const s = polar(CX, CY, arcR, lo);
  const e2 = polar(CX, CY, arcR, hi);
  const sector = `M${CX} ${CY}L${s.x} ${s.y}A${arcR} ${arcR} 0 0 0 ${e2.x} ${e2.y}Z`;
  const mid = polar(CX, CY, arcR + 22, (lo + hi) / 2);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-3 sm:p-5">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto block w-full max-w-[47.5rem] select-none"
          role="group"
          aria-label={t.label}
          onClick={(e) => {
            const a = angleFromEvent(e);
            if (a === null) return;
            const nearest = Math.abs(a - arms[0]) <= Math.abs(a - arms[1]) ? 0 : 1;
            setArm(nearest, a);
          }}
        >
          <path d={`M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY} Z`} className="fill-accent-soft stroke-accent" strokeWidth={1} />
          <path d={`M${CX - R + 44} ${CY} A${R - 44} ${R - 44} 0 0 1 ${CX + R - 44} ${CY}`} className="fill-none stroke-accent opacity-40" strokeWidth={1} />
          <path d={ticks} className="stroke-fg" strokeWidth={0.8} />
          {labels.map((d) => {
            const o = polar(CX, CY, R - 28, d);
            const inner = polar(CX, CY, R - 54, d);
            return (
              <g key={d} className="tabular">
                <text x={o.x} y={o.y} fontSize={10} textAnchor="middle" dominantBaseline="central" className="fill-fg" transform={`rotate(${90 - d} ${o.x} ${o.y})`}>
                  {d}
                </text>
                <text x={inner.x} y={inner.y} fontSize={8.5} textAnchor="middle" dominantBaseline="central" className="fill-fg-3" transform={`rotate(${90 - d} ${inner.x} ${inner.y})`}>
                  {180 - d}
                </text>
              </g>
            );
          })}
          <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} className="stroke-fg" strokeWidth={1} />
          <path d={sector} className="fill-accent opacity-25" />
          <text x={mid.x} y={mid.y} fontSize={13} fontWeight={700} textAnchor="middle" dominantBaseline="central" className="fill-accent">
            {nf(angle)}°
          </text>
          {arms.map((deg, i) => {
            const end = polar(CX, CY, R, deg);
            const k = polar(CX, CY, KNOB, deg);
            return (
              <g
                key={i}
                role="slider"
                tabIndex={0}
                aria-label={t.arm(i + 1)}
                aria-valuemin={0}
                aria-valuemax={180}
                aria-valuenow={deg}
                aria-valuetext={`${nf(deg)}°`}
                onKeyDown={(e) => onKey(i, e)}
                onFocus={() => setFocus(i)}
                onBlur={() => setFocus(null)}
                className="cursor-grab outline-none"
              >
                <line x1={CX} y1={CY} x2={end.x} y2={end.y} className={i === 0 ? "stroke-fg" : "stroke-accent"} strokeWidth={2} />
                {focus === i && <circle cx={k.x} cy={k.y} r={15} className="fill-none stroke-accent" strokeWidth={2} />}
                <circle cx={k.x} cy={k.y} r={9} className={i === 0 ? "fill-fg stroke-surface" : "fill-accent stroke-surface"} strokeWidth={2} />
                <circle
                  cx={k.x}
                  cy={k.y}
                  r={20}
                  fill="transparent"
                  style={{ touchAction: "none" }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    drag.current = i;
                  }}
                  onPointerMove={(e) => {
                    if (drag.current !== i) return;
                    const a = angleFromEvent(e);
                    if (a !== null) setArm(i, a);
                  }}
                  onPointerUp={(e) => {
                    drag.current = null;
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                  }}
                />
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={3} className="fill-fg" />
        </svg>
      </Panel>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-fg-2">{t.angle}</p>
          <p className="tabular text-4xl font-semibold tracking-tight text-fg sm:text-5xl" aria-live="polite">
            {nf(angle)}°
          </p>
          <p className="tabular mt-1 text-sm text-fg-3">
            {t.supplement}: {nf(180 - angle)}° · {t.radians}: {nf((angle * Math.PI) / 180, 4)} · {t.arm(1)} {nf(arms[0])}°, {t.arm(2)} {nf(arms[1])}°
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            label={t.step}
            value={step}
            onChange={setStep}
            size="sm"
            options={[
              { value: "1", label: "1°" },
              { value: "0.5", label: formatNumber(locale, 0.5) + "°" },
              { value: "0.1", label: formatNumber(locale, 0.1) + "°" },
            ]}
          />
          <Button variant="ghost" size="sm" onClick={() => setArms([0, 60])}>
            {t.reset}
          </Button>
        </div>
      </div>
      <p className="text-sm text-fg-3">{t.hint}</p>
    </div>
  );
}
