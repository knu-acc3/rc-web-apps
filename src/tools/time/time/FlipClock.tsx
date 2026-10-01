"use client";

import { useState } from "react";
import { Segmented } from "@/ui/segmented";
import { Switch } from "@/ui/field";
import { ClockShell, isOpts, type ClockOptions } from "./ui/ClockShell";
import { longDate } from "./lib/text";
import { pad2, zoned } from "./lib/tz";
import { useStoredJson } from "./lib/storage";
import { useLocalZone, useNow } from "./lib/use-now";
import type { NowProps } from "./lib/types";

const T = {
  ru: { format: "Формат времени", sec: "Секунды", date: "Дата" },
  en: { format: "Time format", sec: "Seconds", date: "Date" },
} as const;

const DEFAULTS: ClockOptions = { h12: false, sec: true, date: false };

/* Split-flap card: the old value's top half folds down, revealing the new one. */
const CSS = `
@keyframes flip-top{from{transform:rotateX(0)}to{transform:rotateX(-90deg)}}
@keyframes flip-bot{from{transform:rotateX(90deg)}to{transform:rotateX(0)}}
.flip-card{position:relative;width:.74em;height:1.12em;perspective:4em;border-radius:.1em}
.flip-half{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:inherit;backface-visibility:hidden}
.flip-half>span{position:absolute;left:0;right:0;height:200%;display:flex;align-items:center;justify-content:center;line-height:1}
.flip-top{top:0;border-radius:.1em .1em 0 0}.flip-top>span{top:0}
.flip-bot{bottom:0;border-radius:0 0 .1em .1em}.flip-bot>span{bottom:0}
.flip-leaf-top{transform-origin:bottom;animation:flip-top .25s ease-in forwards}
.flip-leaf-bot{transform-origin:top;animation:flip-bot .25s .25s ease-out both}
.flip-card:after{content:"";position:absolute;left:0;right:0;top:50%;height:.02em;background:var(--bg);opacity:.6}
@media (prefers-reduced-motion:reduce){.flip-leaf-top,.flip-leaf-bot{display:none}}
`;

function FlipDigit({ value }: { value: string }) {
  const [shown, setShown] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== shown) {
    setPrev(shown);
    setShown(value);
  }
  const flipping = prev !== shown;
  return (
    <span className="flip-card tabular bg-[var(--flip-bg,var(--fg))] font-semibold text-[var(--flip-fg,var(--bg))]" aria-hidden>
      <span className="flip-half flip-top">
        <span>{shown}</span>
      </span>
      <span className="flip-half flip-bot">
        <span>{flipping ? prev : shown}</span>
      </span>
      {flipping && (
        <>
          <span key={`t${shown}${prev}`} className="flip-half flip-top flip-leaf-top">
            <span>{prev}</span>
          </span>
          <span key={`b${shown}${prev}`} className="flip-half flip-bot flip-leaf-bot">
            <span>{shown}</span>
          </span>
        </>
      )}
    </span>
  );
}

function Pair({ text }: { text: string }) {
  return (
    <span className="flex gap-[0.06em]">
      {text.split("").map((ch, i) => (
        <FlipDigit key={i} value={ch} />
      ))}
    </span>
  );
}

export default function FlipClock({ locale }: NowProps) {
  const t = T[locale];
  const now = useNow();
  const tz = useLocalZone();
  const [o, setO] = useStoredJson<ClockOptions>("flip-clock:v1", DEFAULTS, isOpts);
  const p = now !== null && tz ? zoned(tz, now) : null;
  let h = p ? p.h : 0;
  let ampm = "";
  if (p && o.h12) {
    ampm = h < 12 ? "AM" : "PM";
    h = h % 12 || 12;
  }
  const label = p ? `${pad2(h)}:${pad2(p.mi)}${o.sec ? `:${pad2(p.s)}` : ""}${ampm ? ` ${ampm}` : ""}` : "";

  return (
    <ClockShell
      locale={locale}
      options={
        <>
          <Segmented
            label={t.format}
            size="sm"
            value={o.h12 ? "12" : "24"}
            onChange={(v) => setO({ ...o, h12: v === "12" })}
            options={[
              { value: "24", label: locale === "ru" ? "24 ч" : "24 h" },
              { value: "12", label: locale === "ru" ? "12 ч" : "12 h" },
            ]}
          />
          <Switch label={t.sec} checked={o.sec} onChange={(e) => setO({ ...o, sec: e.target.checked })} />
          <Switch label={t.date} checked={o.date} onChange={(e) => setO({ ...o, date: e.target.checked })} />
        </>
      }
    >
      <style>{CSS}</style>
      <div role="img" aria-label={label} className={o.sec ? "flex items-center gap-[0.18em] text-[min(15vw,10.625rem)] 2xl:text-[min(10vw,14rem)]" : "flex items-center gap-[0.22em] text-[min(22vw,14.375rem)] 2xl:text-[min(14vw,18rem)]"}>
        {p ? (
          <>
            <Pair text={pad2(h)} />
            <Pair text={pad2(p.mi)} />
            {o.sec && <Pair text={pad2(p.s)} />}
          </>
        ) : (
          <span className="tabular font-semibold text-fg-3">--:--</span>
        )}
        {ampm && <span className="self-start text-[0.25em] font-semibold text-fg-2">{ampm}</span>}
      </div>
      {o.date && <p className="mt-6 min-h-8 text-[min(5vw,1.875rem)] text-fg-2">{p ? longDate(locale, p) : " "}</p>}
    </ClockShell>
  );
}
