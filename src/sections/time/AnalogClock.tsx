"use client";

import { useEffect, useRef } from "react";
import { Switch } from "@/ui/field";
import { ClockShell } from "./ClockShell";
import { hms, longDate } from "./lib/text";
import { tzOffset, zoned } from "./lib/tz";
import { useStoredJson } from "./lib/storage";
import { useLocalZone, useNow } from "./lib/use-now";
import type { NowProps } from "./types";

const T = {
  ru: { sec: "Секундная стрелка", digits: "Время цифрами", label: "Аналоговые часы" },
  en: { sec: "Second hand", digits: "Digital time", label: "Analog clock" },
} as const;

interface Opts {
  sec: boolean;
  digits: boolean;
}
const DEFAULTS: Opts = { sec: true, digits: true };
const isOpts = (v: unknown): v is Opts => !!v && typeof (v as Opts).sec === "boolean" && typeof (v as Opts).digits === "boolean";

const NUMS = Array.from({ length: 12 }, (_, i) => i + 1);
const TICKS = Array.from({ length: 60 }, (_, i) => i);

export default function AnalogClock({ locale }: NowProps) {
  const t = T[locale];
  const now = useNow();
  const tz = useLocalZone();
  const [o, setO] = useStoredJson<Opts>("analog-clock:v1", DEFAULTS, isOpts);
  const hRef = useRef<SVGLineElement>(null);
  const mRef = useRef<SVGLineElement>(null);
  const sRef = useRef<SVGGElement>(null);
  const p = now !== null && tz ? zoned(tz, now) : null;

  // Smooth hands: rAF writes transforms directly (no React re-render per frame).
  useEffect(() => {
    if (!tz) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const draw = () => {
      const t0 = Date.now();
      const local = t0 + tzOffset(tz, t0) * 60000;
      const ms = ((local % 86400000) + 86400000) % 86400000;
      const sec = reduce ? Math.floor(ms / 1000) : ms / 1000;
      hRef.current?.setAttribute("transform", `rotate(${((sec / 3600) % 12) * 30} 100 100)`);
      mRef.current?.setAttribute("transform", `rotate(${((sec / 60) % 60) * 6} 100 100)`);
      sRef.current?.setAttribute("transform", `rotate(${(sec % 60) * 6} 100 100)`);
      if (reduce) timer = setTimeout(draw, 1000 - (t0 % 1000));
      else raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [tz]);

  return (
    <ClockShell
      locale={locale}
      options={
        <>
          <Switch label={t.sec} checked={o.sec} onChange={(e) => setO({ ...o, sec: e.target.checked })} />
          <Switch label={t.digits} checked={o.digits} onChange={(e) => setO({ ...o, digits: e.target.checked })} />
        </>
      }
    >
      <svg viewBox="0 0 200 200" className="aspect-square w-[min(80vw,62vh,520px)]" role="img" aria-label={p ? `${t.label}: ${hms(p, false)}` : t.label}>
        <circle cx="100" cy="100" r="97" className="fill-surface stroke-line-strong" strokeWidth="2" />
        {TICKS.map((i) => (
          <line
            key={i}
            x1="100"
            y1={i % 5 === 0 ? 9 : 7}
            x2="100"
            y2={i % 5 === 0 ? 18 : 12}
            transform={`rotate(${i * 6} 100 100)`}
            className={i % 5 === 0 ? "stroke-fg" : "stroke-fg-3"}
            strokeWidth={i % 5 === 0 ? 2.2 : 1}
            strokeLinecap="round"
          />
        ))}
        {NUMS.map((n) => {
          const a = (n * 30 * Math.PI) / 180;
          return (
            <text key={n} x={100 + 67 * Math.sin(a)} y={100 - 67 * Math.cos(a)} textAnchor="middle" dominantBaseline="central" className="fill-fg text-[15px] font-semibold">
              {n}
            </text>
          );
        })}
        <g className={tz ? "" : "opacity-0"}>
        <line ref={hRef} x1="100" y1="112" x2="100" y2="52" className="stroke-fg" strokeWidth="6" strokeLinecap="round" />
        <line ref={mRef} x1="100" y1="116" x2="100" y2="28" className="stroke-fg" strokeWidth="4" strokeLinecap="round" />
        <g ref={sRef} className={o.sec ? "" : "hidden"}>
          <line x1="100" y1="122" x2="100" y2="22" className="stroke-accent" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        </g>
        <circle cx="100" cy="100" r="4.5" className="fill-accent" />
      </svg>
      {o.digits && (
        <p className="mt-4 min-h-7 text-center text-lg text-fg-2">
          {p ? (
            <>
              <span className="tabular font-semibold text-fg">{hms(p)}</span> · {longDate(locale, p)}
            </>
          ) : (
            " "
          )}
        </p>
      )}
    </ClockShell>
  );
}
