"use client";

import { Maximize, Minus, Pause, Play, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Checkbox, Slider } from "@/ui/field";
import { Kbd } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { SAFE_FLASH_HZ } from "./lib/color";
import { FLASH_MODES, flashColor, flashesPerSecond, type FlashMode } from "./lib/flash";

const T = {
  ru: {
    modes: { blink: "Мигание", strobe: "Стробоскоп", police: "Мигалка", sos: "SOS", party: "Дискотека", two: "Два цвета" } as Record<FlashMode, string>,
    mode: "Режим",
    speed: "Частота",
    perSec: "вспышек в секунду",
    sosFixed: "Сигнал SOS идёт с азбукой Морзе: ··· — — — ··· и паузой.",
    colorA: "Цвет вспышки",
    colorB: "Второй цвет",
    warnTitle: "Осторожно: частые вспышки",
    warn: "Мигание чаще 3 раз в секунду может вызвать приступ у людей со светочувствительной эпилепсией. Не направляйте экран на других людей без их согласия.",
    ack: "Я понимаю, разрешить больше 3 вспышек в секунду",
    start: "Старт на весь экран",
    preview: "Показать здесь",
    stop: "Остановить",
    close: "Закрыть",
    stage: "Мигающий свет",
    slower: "Медленнее",
    faster: "Быстрее",
    pause: "Пауза",
    resume: "Продолжить",
    keys: "Клавиши",
    keySpeed: "частота",
    keyPause: "пауза",
    exit: "выход",
  },
  en: {
    modes: { blink: "Blink", strobe: "Strobe", police: "Police", sos: "SOS", party: "Party", two: "Two colours" } as Record<FlashMode, string>,
    mode: "Mode",
    speed: "Speed",
    perSec: "flashes per second",
    sosFixed: "SOS runs at Morse timing: ··· — — — ··· and a pause.",
    colorA: "Flash colour",
    colorB: "Second colour",
    warnTitle: "Caution: rapid flashing",
    warn: "Flashing more than 3 times a second can trigger seizures in people with photosensitive epilepsy. Don't point the screen at others without their consent.",
    ack: "I understand — allow more than 3 flashes per second",
    start: "Start full screen",
    preview: "Preview here",
    stop: "Stop",
    close: "Close",
    stage: "Flashing light",
    slower: "Slower",
    faster: "Faster",
    pause: "Pause",
    resume: "Resume",
    keys: "Keys",
    keySpeed: "speed",
    keyPause: "pause",
    exit: "exit",
  },
} as const;

export default function FlashingLight({ locale, mode: initial = "blink" }: { locale: Locale; mode?: FlashMode }) {
  const t = T[locale];
  const [mode, setMode] = useState<FlashMode>(initial);
  const [hz, setHz] = useState(initial === "strobe" ? 3 : initial === "police" ? 3 : 2);
  const [ack, setAck] = useState(false);
  const [a, setA] = useState("#ffffff");
  const [b, setB] = useState("#ff0000");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const stage = useStage(() => setRunning(false));

  const max = ack ? 12 : SAFE_FLASH_HZ;
  const speed = Math.min(hz, max);
  const fast = flashesPerSecond(mode, speed) > SAFE_FLASH_HZ;

  // One animation loop drives whichever surface is visible (the stage or the preview box).
  useEffect(() => {
    if (!running || paused) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const colour = flashColor(mode, (now - start) / 1000, speed, a, b);
      const el = stage.open ? stage.ref.current : previewRef.current;
      if (el) el.style.background = colour;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, paused, mode, speed, a, b, stage.open, stage.ref]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage.open || e.ctrlKey || e.metaKey || e.altKey || typingTarget(e)) return;
      if (e.key === "f" || e.key === "F" || e.key === "а" || e.key === "А") {
        e.preventDefault();
        go();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function go() {
    setPaused(false);
    setRunning(true);
    stage.enter();
  }
  const faster = (d: number) => setHz((h) => Math.round(Math.min(max, Math.max(0.5, h + d)) * 2) / 2);

  const iconBtn = "flex size-9 items-center justify-center rounded-full hover:bg-white/15";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1rem] border border-line bg-surface p-4 sm:p-5">
        <Segmented label={t.mode} value={mode} onChange={setMode} wrap options={FLASH_MODES.map((m) => ({ value: m, label: t.modes[m] }))} />

        {mode === "sos" ? (
          <p className="text-sm text-fg-2">{t.sosFixed}</p>
        ) : (
          <label className="flex flex-col gap-2">
            <span className="flex items-center justify-between text-sm font-medium text-fg-2">
              <span>{t.speed}</span>
              <span className="tabular-nums text-fg">
                {speed.toLocaleString(locale)} <span className="font-normal text-fg-3">{t.perSec}</span>
              </span>
            </span>
            <Slider min={0.5} max={max} step={0.5} value={speed} onChange={(e) => setHz(Number(e.target.value))} />
          </label>
        )}

        {(mode === "blink" || mode === "strobe" || mode === "sos" || mode === "two") && (
          <div className="flex flex-wrap items-center gap-4 text-sm text-fg-2">
            <label className="inline-flex items-center gap-2">
              <input type="color" value={a} onChange={(e) => setA(e.target.value)} className="size-9 cursor-pointer rounded-[0.5rem] border border-line bg-surface p-0.5" />
              {t.colorA}
            </label>
            {mode === "two" && (
              <label className="inline-flex items-center gap-2">
                <input type="color" value={b} onChange={(e) => setB(e.target.value)} className="size-9 cursor-pointer rounded-[0.5rem] border border-line bg-surface p-0.5" />
                {t.colorB}
              </label>
            )}
          </div>
        )}

        <div className="rounded-[0.75rem] bg-warn-soft px-4 py-3 text-sm text-warn">
          <p className="flex items-center gap-1.5 font-semibold">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {t.warnTitle}
          </p>
          <p className="mt-1">{t.warn}</p>
          <Checkbox className="mt-2 text-sm text-warn" label={t.ack} checked={ack} onChange={(e) => setAck(e.target.checked)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="lg" onClick={go}>
            <Maximize aria-hidden />
            {t.start}
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setRunning((r) => !r)} aria-pressed={running && !stage.open}>
            {running && !stage.open ? <Pause aria-hidden /> : <Play aria-hidden />}
            {running && !stage.open ? t.stop : t.preview}
          </Button>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
          <span>
            <Kbd>F</Kbd> {t.start.toLowerCase()}
          </span>
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> {t.keySpeed}
          </span>
          <span>
            <Kbd>Space</Kbd> {t.keyPause}
          </span>
          <span>
            <Kbd>Esc</Kbd> {t.exit}
          </span>
        </p>
      </div>

      <div ref={previewRef} aria-hidden className={cn("aspect-[16/9] w-full rounded-[1rem] border border-line-strong bg-black sm:aspect-[3/1]", !running && "opacity-60")} />

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        style={{ background: "#000" }}
        onKey={(e) => {
          if (e.key === " ") {
            e.preventDefault();
            setPaused((p) => !p);
          } else if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            e.preventDefault();
            faster(0.5);
          } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            e.preventDefault();
            faster(-0.5);
          }
        }}
        bar={
          <>
            <span className="font-semibold">{t.modes[mode]}</span>
            {mode !== "sos" && (
              <>
                <button type="button" className={iconBtn} onClick={() => faster(-0.5)} aria-label={t.slower} title={t.slower}>
                  <Minus className="size-5" aria-hidden />
                </button>
                <span className={cn("min-w-10 text-center tabular-nums", fast && "text-amber-300")}>{speed.toLocaleString(locale)} Hz</span>
                <button type="button" className={iconBtn} onClick={() => faster(0.5)} aria-label={t.faster} title={t.faster}>
                  <Plus className="size-5" aria-hidden />
                </button>
              </>
            )}
            <button type="button" className={iconBtn} onClick={() => setPaused((p) => !p)} aria-label={paused ? t.resume : t.pause} title={paused ? t.resume : t.pause}>
              {paused ? <Play className="size-5" aria-hidden /> : <Pause className="size-5" aria-hidden />}
            </button>
          </>
        }
      />
    </div>
  );
}
