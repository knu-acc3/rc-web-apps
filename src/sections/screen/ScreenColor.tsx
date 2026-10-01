"use client";

import { ChevronLeft, ChevronRight, Maximize, Minus, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Slider } from "@/ui/field";
import { Kbd } from "@/ui/panel";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { colorById, dim, hexToRgb, whiteAt, luminance, rgbToHex, SCREEN_COLORS, type Rgb } from "./lib/color";

const T = {
  ru: {
    full: "На весь экран",
    tapHint: "Нажмите на экран, чтобы открыть его на весь экран",
    color: "Цвет",
    custom: "Свой цвет",
    brightness: "Яркость",
    warmth: "Оттенок белого",
    warm: "тёплый",
    cold: "холодный",
    presets: [
      [2700, "Лампа накаливания"],
      [4000, "Тёплый дневной"],
      [6500, "Чистый белый"],
      [9000, "Холодный"],
    ] as [number, string][],
    keys: "Клавиши",
    colorKeys: "цвет",
    brightKeys: "яркость",
    exit: "выход",
    close: "Закрыть",
    stage: "Экран, залитый цветом",
    prev: "Предыдущий цвет",
    next: "Следующий цвет",
    less: "Темнее",
    more: "Ярче",
    keepOn: "Экран не погаснет, пока открыт этот режим.",
  },
  en: {
    full: "Full screen",
    tapHint: "Tap the screen to open it full screen",
    color: "Colour",
    custom: "Custom colour",
    brightness: "Brightness",
    warmth: "White tone",
    warm: "warm",
    cold: "cold",
    presets: [
      [2700, "Incandescent"],
      [4000, "Warm daylight"],
      [6500, "Pure white"],
      [9000, "Cold"],
    ] as [number, string][],
    keys: "Keys",
    colorKeys: "colour",
    brightKeys: "brightness",
    exit: "exit",
    close: "Close",
    stage: "Screen filled with colour",
    prev: "Previous colour",
    next: "Next colour",
    less: "Dimmer",
    more: "Brighter",
    keepOn: "The screen stays on while this mode is open.",
  },
} as const;

const STORE = "screen-color:v1";

export default function ScreenColor({ locale, color = "white" }: { locale: Locale; color?: string }) {
  const t = T[locale];
  const [hex, setHex] = useState(colorById(color)?.hex ?? "#ffffff");
  const [brightness, setBrightness] = useState(100);
  const [kelvin, setKelvin] = useState(6500);
  const stage = useStage();

  // Brightness and white tone are remembered between visits; the colour comes from the page.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "{}") as { b?: number; k?: number };
      /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only available after mount */
      if (typeof saved.b === "number") setBrightness(Math.min(100, Math.max(5, saved.b)));
      if (typeof saved.k === "number") setKelvin(Math.min(10000, Math.max(1900, saved.k)));
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // storage unavailable
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ b: brightness, k: kelvin }));
    } catch {
      // storage unavailable
    }
  }, [brightness, kelvin]);

  const isWhite = hex.toLowerCase() === "#ffffff";
  const base: Rgb = isWhite ? whiteAt(kelvin) : hexToRgb(hex);
  const fill = rgbToHex(dim(base, brightness / 100));
  const dark = luminance(dim(base, brightness / 100)) < 0.35;
  const index = SCREEN_COLORS.findIndex((c) => c.hex === hex.toLowerCase());
  const name = index >= 0 ? SCREEN_COLORS[index][locale] : hex.toUpperCase();

  const step = (d: number) => {
    const i = index < 0 ? 0 : (index + d + SCREEN_COLORS.length) % SCREEN_COLORS.length;
    setHex(SCREEN_COLORS[i].hex);
  };
  const bright = (d: number) => setBrightness((b) => Math.min(100, Math.max(5, b + d)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage.open || e.ctrlKey || e.metaKey || e.altKey || typingTarget(e)) return;
      if (e.key === "f" || e.key === "F" || e.key === "а" || e.key === "А") {
        e.preventDefault();
        stage.enter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  const iconBtn = cn("flex size-9 items-center justify-center rounded-full", dark ? "hover:bg-black/10" : "hover:bg-white/15");

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={stage.enter}
        aria-label={t.full}
        className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[1rem] border border-line-strong transition-[background-color] duration-200 sm:aspect-[2/1]"
        style={{ background: fill }}
      >
        <span
          className={cn(
            "flex items-center gap-2 rounded-full px-5 py-3 text-base font-semibold shadow-[var(--shadow-overlay)] transition-transform group-hover:scale-105",
            dark ? "bg-white/90 text-black" : "bg-black/75 text-white",
          )}
        >
          <Maximize className="size-5" aria-hidden />
          {t.full}
        </span>
      </button>

      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label={t.color} className="flex flex-wrap items-center gap-2">
          {SCREEN_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={c.hex === hex.toLowerCase()}
              aria-label={c[locale]}
              title={c[locale]}
              onClick={() => setHex(c.hex)}
              className={cn(
                "size-10 rounded-full border border-line-strong transition-transform hover:scale-110 pointer-coarse:size-11",
                c.hex === hex.toLowerCase() && "ring-3 ring-accent ring-offset-2 ring-offset-bg",
              )}
              style={{ background: c.hex }}
            />
          ))}
          <label className="relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line-strong bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] pointer-coarse:size-11" title={t.custom}>
            <span className="sr-only">{t.custom}</span>
            <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-sm font-medium text-fg-2">
            <span className="inline-flex items-center gap-1.5">
              <Sun className="size-4" aria-hidden />
              {t.brightness}
            </span>
            <span className="tabular-nums text-fg">{brightness}%</span>
          </span>
          <Slider min={5} max={100} step={5} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
        </label>

        {isWhite && (
          <div className="flex flex-col gap-2">
            <span className="flex items-center justify-between text-sm font-medium text-fg-2">
              <span>{t.warmth}</span>
              <span className="tabular-nums text-fg">{kelvin} K</span>
            </span>
            <Slider aria-label={t.warmth} min={1900} max={10000} step={100} value={kelvin} onChange={(e) => setKelvin(Number(e.target.value))} className="[background:linear-gradient(90deg,#ff8a12,#ffd6a5,#fff,#cfe0ff)] rounded-full" />
            <div className="flex flex-wrap gap-2">
              {t.presets.map(([k, label]) => (
                <button key={k} type="button" onClick={() => setKelvin(k)} className="chip" aria-pressed={kelvin === k}>
                  <span className="size-3 rounded-full border border-line-strong" style={{ background: rgbToHex(whiteAt(k)) }} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
          <span>
            <Kbd>F</Kbd> {t.full.toLowerCase()}
          </span>
          <span>
            <Kbd>←</Kbd> <Kbd>→</Kbd> {t.colorKeys}
          </span>
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> {t.brightKeys}
          </span>
          <span>
            <Kbd>Esc</Kbd> {t.exit}
          </span>
        </p>
        <p className="text-sm text-fg-3">{t.keepOn}</p>
      </div>

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        dark={dark}
        style={{ background: fill }}
        onKey={(e) => {
          if (e.key === "ArrowRight" || e.key === " ") {
            e.preventDefault();
            step(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            bright(5);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            bright(-5);
          }
        }}
        bar={
          <>
            <button type="button" className={iconBtn} onClick={() => step(-1)} aria-label={t.prev} title={t.prev}>
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <span className="min-w-16 text-center font-semibold">{name}</span>
            <button type="button" className={iconBtn} onClick={() => step(1)} aria-label={t.next} title={t.next}>
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <button type="button" className={iconBtn} onClick={() => bright(-10)} aria-label={t.less} title={t.less}>
              <Minus className="size-5" aria-hidden />
            </button>
            <span className="min-w-11 text-center tabular-nums">{brightness}%</span>
            <button type="button" className={iconBtn} onClick={() => bright(10)} aria-label={t.more} title={t.more}>
              <Plus className="size-5" aria-hidden />
            </button>
          </>
        }
      />
    </div>
  );
}
