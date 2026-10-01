"use client";

import { Maximize, Minus, Pause, Play, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Checkbox, Slider } from "@/ui/field";
import { Kbd, Notice, Panel } from "@/ui/panel";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { SAFE_FLASH_HZ } from "./lib/color";
import { BarButton } from "./ui/BarButton";
import { Swatch } from "./ui/Swatch";
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

  const running0 = running && !stage.open;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
      <Panel className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:col-start-2 lg:row-start-1">
        <div role="group" aria-label={t.mode} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FLASH_MODES.map((m) => (
            <button key={m} type="button" aria-pressed={m === mode} onClick={() => setMode(m)} className="chip h-11 justify-center text-[0.9375rem]!">
              {t.modes[m]}
            </button>
          ))}
        </div>

        {mode === "sos" ? (
          <p className="text-sm text-fg-2">{t.sosFixed}</p>
        ) : (
          <label className="flex flex-col gap-2">
            <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-fg-2">
              <span>{t.speed}</span>
              <span className="text-right">
                <span className={cn("text-xl font-bold tabular-nums", fast ? "text-warn" : "text-fg")}>{speed.toLocaleString(locale)}</span> <span className="font-normal text-fg-3">{t.perSec}</span>
              </span>
            </span>
            <Slider min={0.5} max={max} step={0.5} value={speed} onChange={(e) => setHz(Number(e.target.value))} format={(v) => v.toLocaleString(locale)} />
          </label>
        )}

        {(mode === "blink" || mode === "strobe" || mode === "sos" || mode === "two") && (
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            <Swatch label={t.colorA} value={a} onChange={setA} />
            {mode === "two" && <Swatch label={t.colorB} value={b} onChange={setB} />}
          </div>
        )}

        <Notice tone="warn">
          <p className="flex items-center gap-1.5 font-semibold">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {t.warnTitle}
          </p>
          <p className="mt-1">{t.warn}</p>
          <Checkbox className="mt-2 text-sm text-warn" label={t.ack} checked={ack} onChange={(e) => setAck(e.target.checked)} />
        </Notice>
      </Panel>
      <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
        <div ref={previewRef} aria-hidden className={cn("order-last aspect-[16/9] w-full rounded-[1.25rem] bg-black shadow-[var(--shadow-card)] transition-opacity lg:order-first", !running && "opacity-60")} />
        <div className="flex flex-wrap gap-2">
          <Button variant="filled" size="xl" onClick={go}>
            <Maximize aria-hidden />
            {t.start}
          </Button>
          <Button variant="tonal" size="xl" onClick={() => setRunning((r) => !r)} aria-pressed={running0}>
            {running0 ? <Pause aria-hidden /> : <Play aria-hidden />}
            {running0 ? t.stop : t.preview}
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
                <BarButton label={t.slower} icon={<Minus aria-hidden />} onClick={() => faster(-0.5)} />
                <span className={cn("min-w-10 text-center tabular-nums", fast && "text-amber-300")}>{speed.toLocaleString(locale)} Hz</span>
                <BarButton label={t.faster} icon={<Plus aria-hidden />} onClick={() => faster(0.5)} />
              </>
            )}
            <BarButton label={paused ? t.resume : t.pause} icon={paused ? <Play aria-hidden /> : <Pause aria-hidden />} onClick={() => setPaused((p) => !p)} />
          </>
        }
      />
    </div>
  );
}
