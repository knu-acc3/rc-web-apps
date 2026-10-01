"use client";

import { Maximize, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { usePersistentState } from "@/lib/persist";
import { Slider, Switch } from "@/ui/field";
import { Kbd } from "@/ui/panel";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { useNow } from "./lib/use-now";

const COLORS = [
  { id: "red", hex: "#ff3b1f", ru: "Красный", en: "Red" },
  { id: "amber", hex: "#ffae00", ru: "Янтарный", en: "Amber" },
  { id: "green", hex: "#3dff6e", ru: "Зелёный", en: "Green" },
  { id: "cyan", hex: "#36d6ff", ru: "Голубой", en: "Cyan" },
  { id: "white", hex: "#ffffff", ru: "Белый", en: "White" },
] as const;
type ColorId = (typeof COLORS)[number]["id"];

const T = {
  ru: {
    full: "На весь экран",
    color: "Цвет цифр",
    brightness: "Яркость",
    sec: "Секунды",
    date: "Дата",
    h12: "12 часов",
    shift: "Защита от выгорания",
    stage: "Ночные часы",
    close: "Закрыть",
    keys: "Клавиши",
    brightKeys: "яркость",
    dimmer: "Темнее",
    brighter: "Ярче",
    tip: "Поставьте яркость экрана телефона на минимум, а здесь подберите яркость цифр. Красный цвет меньше всего мешает уснуть.",
  },
  en: {
    full: "Full screen",
    color: "Digit colour",
    brightness: "Brightness",
    sec: "Seconds",
    date: "Date",
    h12: "12-hour",
    shift: "Burn-in protection",
    stage: "Night clock",
    close: "Close",
    keys: "Keys",
    brightKeys: "brightness",
    dimmer: "Dimmer",
    brighter: "Brighter",
    tip: "Turn your phone's screen brightness to minimum and pick the digit brightness here. Red disturbs sleep the least.",
  },
} as const;

interface Opts {
  color: ColorId;
  brightness: number;
  sec: boolean;
  date: boolean;
  h12: boolean;
  shift: boolean;
}
const isOpts = (v: unknown): v is Opts => {
  const o = v as Opts;
  return !!o && COLORS.some((c) => c.id === o.color) && typeof o.brightness === "number" && typeof o.sec === "boolean" && typeof o.date === "boolean" && typeof o.h12 === "boolean" && typeof o.shift === "boolean";
};

const MIN_B = 5;

export default function NightClock({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [o, setO] = usePersistentState<Opts>("night-clock:v1", { color: "red", brightness: 60, sec: false, date: true, h12: false, shift: true }, isOpts);
  const now = useNow();
  const stage = useStage();
  const [offset, setOffset] = useState<[number, number]>([0, 0]);
  const hex = COLORS.find((c) => c.id === o.color)!.hex;
  const bright = (d: number) => setO({ ...o, brightness: Math.min(100, Math.max(MIN_B, o.brightness + d)) });

  // Every minute the digits drift a little, so an OLED screen doesn't burn in the same pixels all night.
  const minute = now === null ? 0 : Math.floor(now / 60000);
  useEffect(() => {
    if (!o.shift || !stage.open) return;
    const r = (x: number) => (((minute * 9301 + x * 49297) % 233280) / 233280) * 2 - 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from the minute; animated by CSS
    setOffset([r(1) * 4, r(2) * 6]);
  }, [minute, o.shift, stage.open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typingTarget(e)) return;
      if (e.code === "KeyF" && !stage.open) {
        e.preventDefault();
        stage.enter();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        setO((p) => ({ ...p, brightness: Math.min(100, Math.max(MIN_B, p.brightness + (e.key === "ArrowUp" ? 5 : -5))) }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, setO]);

  const d = now === null ? null : new Date(now);
  const hh = d ? (o.h12 ? ((d.getHours() + 11) % 12) + 1 : d.getHours()) : null;
  const time = d ? `${o.h12 ? hh : String(hh).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "--:--";
  const ampm = d && o.h12 ? (d.getHours() < 12 ? "AM" : "PM") : "";
  const secs = d ? String(d.getSeconds()).padStart(2, "0") : "--";
  const dateText = d ? d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { weekday: "long", day: "numeric", month: "long" }) : "";

  const face = (big: boolean) => (
    <div
      className="flex flex-col items-center justify-center transition-transform duration-[2000ms] ease-in-out"
      style={{ color: hex, opacity: o.brightness / 100, transform: big ? `translate(${offset[0]}vw, ${offset[1]}vh)` : undefined }}
    >
      <div className="flex items-baseline font-semibold leading-none tracking-tight tabular-nums">
        <span className={big ? "[font-size:min(28vw,50vh)]" : "[font-size:min(18vw,8.5rem)]"}>{time}</span>
        {o.sec && <span className={cn("ml-[0.15em] opacity-70", big ? "[font-size:min(9vw,16vh)]" : "[font-size:min(6vw,2.75rem)]")}>{secs}</span>}
        {ampm && <span className={cn("ml-[0.2em] opacity-70", big ? "[font-size:min(5vw,9vh)]" : "text-xl")}>{ampm}</span>}
      </div>
      {o.date && <div className={cn("mt-[0.6em] opacity-70 first-letter:uppercase", big ? "[font-size:min(4vw,6vh)]" : "text-base sm:text-lg")}>{dateText}</div>}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={stage.enter} aria-label={t.full} className="group relative flex min-h-[15rem] w-full items-center justify-center overflow-hidden rounded-[1rem] bg-black px-3 py-10 sm:min-h-[20rem]">
        {face(false)}
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 transition-colors group-hover:bg-white/20">
          <Maximize className="size-4" aria-hidden />
          {t.full}
        </span>
      </button>

      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label={t.color} className="flex flex-wrap items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={o.color === c.id}
              aria-label={c[locale]}
              title={c[locale]}
              onClick={() => setO({ ...o, color: c.id })}
              className={cn("flex size-10 items-center justify-center rounded-full bg-black text-lg font-bold pointer-coarse:size-11", o.color === c.id && "ring-3 ring-accent ring-offset-2 ring-offset-bg")}
              style={{ color: c.hex }}
            >
              8
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-sm font-medium text-fg-2">
            <span className="inline-flex items-center gap-1.5">
              <Moon className="size-4" aria-hidden />
              {t.brightness}
            </span>
            <span className="tabular-nums text-fg">{o.brightness}%</span>
          </span>
          <Slider min={MIN_B} max={100} step={5} value={o.brightness} onChange={(e) => setO({ ...o, brightness: Number(e.target.value) })} />
        </label>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Switch label={t.sec} checked={o.sec} onChange={(e) => setO({ ...o, sec: e.target.checked })} />
          <Switch label={t.date} checked={o.date} onChange={(e) => setO({ ...o, date: e.target.checked })} />
          <Switch label={t.h12} checked={o.h12} onChange={(e) => setO({ ...o, h12: e.target.checked })} />
          <Switch label={t.shift} checked={o.shift} onChange={(e) => setO({ ...o, shift: e.target.checked })} />
        </div>
        <p className="text-sm text-fg-3">{t.tip}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
          <span>
            <Kbd>F</Kbd> {t.full.toLowerCase()}
          </span>
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> {t.brightKeys}
          </span>
        </p>
      </div>

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        className="bg-black"
        bar={
          <>
            <button type="button" onClick={() => bright(-10)} aria-label={t.dimmer} title={t.dimmer} className="flex size-9 items-center justify-center rounded-full hover:bg-white/15">
              <Moon className="size-5" aria-hidden />
            </button>
            <span className="tabular-nums w-10 text-center">{o.brightness}%</span>
            <button type="button" onClick={() => bright(10)} aria-label={t.brighter} title={t.brighter} className="flex size-9 items-center justify-center rounded-full hover:bg-white/15">
              <Sun className="size-5" aria-hidden />
            </button>
          </>
        }
      >
        {stage.open && <div className="flex size-full items-center justify-center">{face(true)}</div>}
      </StageLayer>
    </div>
  );
}
