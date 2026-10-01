"use client";

import { ChevronLeft, ChevronRight, Maximize, Minus, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { usePersistentState } from "@/lib/persist";
import { Button } from "@/ui/button";
import { Slider } from "@/ui/field";
import { Kbd, Panel } from "@/ui/panel";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { BarButton } from "./ui/BarButton";
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
const isLook = (v: unknown): v is { b: number; k: number } => !!v && typeof v === "object" && Number.isFinite((v as { b: number }).b) && Number.isFinite((v as { k: number }).k);

export default function ScreenColor({ locale, color = "white" }: { locale: Locale; color?: string }) {
  const t = T[locale];
  const [hex, setHex] = useState(colorById(color)?.hex ?? "#ffffff");
  // Brightness and white tone are remembered between visits; the colour comes from the page.
  const [look, setLook] = usePersistentState(STORE, { b: 100, k: 6500 }, isLook);
  const brightness = look.b;
  const kelvin = look.k;
  const setBrightness = (v: number | ((b: number) => number)) => setLook((l) => ({ ...l, b: Math.min(100, Math.max(5, typeof v === "function" ? v(l.b) : v)) }));
  const setKelvin = (k: number) => setLook((l) => ({ ...l, k: Math.min(10000, Math.max(1900, k)) }));
  const stage = useStage();

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

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
      <div
        onClick={stage.enter}
        className="group relative flex aspect-[16/9] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[1.25rem] shadow-[var(--shadow-card)] ring-1 ring-black/10 transition-[background-color] duration-200 ring-inset sm:aspect-[16/10]"
        style={{ background: fill }}
      >
        <Button variant="filled" size="xl" onClick={(e) => (e.stopPropagation(), stage.enter())} className="motion-safe:transition-transform motion-safe:group-hover:scale-105">
          <Maximize aria-hidden />
          {t.full}
        </Button>
      </div>

      <Panel className="flex min-w-0 flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-fg-2">
            {t.color}
            <span className="text-base font-semibold text-fg">{name}</span>
          </span>
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
                  "size-10 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)] transition-transform hover:scale-110 active:scale-95 pointer-coarse:size-11",
                  c.hex === hex.toLowerCase() && "ring-3 ring-accent ring-offset-2 ring-offset-surface",
                )}
                style={{ background: c.hex }}
              />
            ))}
            <label
              className="relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] transition-transform hover:scale-110 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent pointer-coarse:size-11"
              title={t.custom}
            >
              <span className="sr-only">{t.custom}</span>
              <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between text-sm font-medium text-fg-2">
            <span className="inline-flex items-center gap-1.5">
              <Sun className="size-4" aria-hidden />
              {t.brightness}
            </span>
            <span className="text-xl font-bold text-fg tabular-nums">{brightness}%</span>
          </span>
          <Slider min={5} max={100} step={5} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} format={(v) => `${v}%`} />
        </label>

        {isWhite && (
          <div className="flex flex-col gap-2">
            <span className="flex items-baseline justify-between text-sm font-medium text-fg-2">
              <span>{t.warmth}</span>
              <span className="text-xl font-bold text-fg tabular-nums">{kelvin} K</span>
            </span>
            <Slider aria-label={t.warmth} min={1900} max={10000} step={100} value={kelvin} onChange={(e) => setKelvin(Number(e.target.value))} format={(v) => `${v} K`} />
            <div className="mt-1 flex flex-wrap gap-2">
              {t.presets.map(([k, label]) => (
                <button key={k} type="button" onClick={() => setKelvin(k)} className="chip" aria-pressed={kelvin === k}>
                  <span className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)]" style={{ background: rgbToHex(whiteAt(k)) }} aria-hidden />
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
        <p className="-mt-3 text-sm text-fg-3">{t.keepOn}</p>
      </Panel>

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
            <BarButton label={t.prev} icon={<ChevronLeft aria-hidden />} onClick={() => step(-1)} />
            <span className="min-w-16 text-center font-semibold">{name}</span>
            <BarButton label={t.next} icon={<ChevronRight aria-hidden />} onClick={() => step(1)} />
            <BarButton label={t.less} icon={<Minus aria-hidden />} onClick={() => bright(-10)} />
            <span className="min-w-11 text-center tabular-nums">{brightness}%</span>
            <BarButton label={t.more} icon={<Plus aria-hidden />} onClick={() => bright(10)} />
          </>
        }
      />
    </div>
  );
}
