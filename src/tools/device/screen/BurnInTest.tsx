"use client";

import { ChevronLeft, ChevronRight, Maximize, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Select } from "@/ui/field";
import { Kbd } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { StageLayer, useStage } from "@/ui/stage";

/** Fills where retained images show best: mid gray first (burn-in shows as darker shapes), then pure colours. */
const CHECK = [
  { hex: "#7f7f7f", ru: "Серый 50%", en: "50% gray" },
  { hex: "#3f3f3f", ru: "Тёмно-серый", en: "Dark gray" },
  { hex: "#ffffff", ru: "Белый", en: "White" },
  { hex: "#ff0000", ru: "Красный", en: "Red" },
  { hex: "#00ff00", ru: "Зелёный", en: "Green" },
  { hex: "#0000ff", ru: "Синий", en: "Blue" },
];
const WASH = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"];

const T = {
  ru: {
    mode: "Что сделать",
    check: "Проверить",
    wash: "Прогнать цвета",
    checkHint: "На сером и цветных фонах выгоревшие места видны как тени от значков, клавиатуры, панели навигации или логотипа канала.",
    washHint: "Экран раз в секунду меняет цвет и прогоняет белую полосу. Это помогает убрать временное остаточное изображение; настоящее выгорание OLED не лечится.",
    duration: "Длительность",
    min: (n: number) => `${n} мин`,
    start: "Начать на весь экран",
    close: "Закрыть",
    stage: "Тест выгорания экрана",
    left: "осталось",
    prev: "Предыдущий цвет",
    next: "Следующий цвет",
    keys: "Клавиши",
    switch: "цвет",
    exit: "выход",
  },
  en: {
    mode: "What to do",
    check: "Check",
    wash: "Cycle colours",
    checkHint: "On gray and colour fills, burned-in areas show as shadows of icons, a keyboard, the navigation bar or a channel logo.",
    washHint: "The screen changes colour once a second and sweeps a white bar. It helps clear temporary image retention; real OLED burn-in can't be undone.",
    duration: "Duration",
    min: (n: number) => `${n} min`,
    start: "Start full screen",
    close: "Close",
    stage: "Screen burn-in test",
    left: "left",
    prev: "Previous colour",
    next: "Next colour",
    keys: "Keys",
    switch: "colour",
    exit: "exit",
  },
} as const;

export default function BurnInTest({ locale, mode: initial = "check" }: { locale: Locale; mode?: "check" | "wash" }) {
  const t = T[locale];
  const [mode, setMode] = useState<"check" | "wash">(initial);
  const [i, setI] = useState(0);
  const [minutes, setMinutes] = useState(10);
  const [left, setLeft] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const stage = useStage();
  const { open, exit, ref } = stage;

  // Colour wash: 1 s per colour (well under 3 flashes per second), a white bar sweeping every half minute.
  useEffect(() => {
    if (!open || mode !== "wash") return;
    const start = performance.now();
    const end = Date.now() + minutes * 60_000;
    let raf = 0;
    let shown = -1;
    const tick = (now: number) => {
      const s = (now - start) / 1000;
      const el = ref.current;
      if (el) el.style.background = WASH[Math.floor(s) % WASH.length];
      const bar = barRef.current;
      if (bar) {
        const phase = s % 30;
        bar.style.display = phase < 8 ? "block" : "none";
        bar.style.left = `${(phase / 8) * 110 - 10}%`;
      }
      const remain = Math.max(0, Math.round((end - Date.now()) / 1000));
      if (remain !== shown) {
        shown = remain;
        setLeft(remain);
      }
      if (remain === 0) exit();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, mode, minutes, exit, ref]);

  const step = (d: number) => setI((x) => (x + d + CHECK.length) % CHECK.length);
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const iconBtn = "flex size-9 items-center justify-center rounded-full hover:bg-white/15";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1rem] border border-line bg-surface p-4 sm:p-5">
        <Segmented label={t.mode} value={mode} onChange={setMode} options={[{ value: "check", label: t.check }, { value: "wash", label: t.wash }]} />
        <p className="text-[0.9375rem] text-fg-2">{mode === "check" ? t.checkHint : t.washHint}</p>
        {mode === "check" ? (
          <div className="flex h-16 overflow-hidden rounded-[0.5rem] border border-line-strong" aria-hidden>
            {CHECK.map((c) => (
              <span key={c.hex} className="flex-1" style={{ background: c.hex }} />
            ))}
          </div>
        ) : (
          <label className="flex max-w-xs flex-col gap-2 text-sm font-medium text-fg-2">
            {t.duration}
            <Select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {[5, 10, 20, 30, 60].map((m) => (
                <option key={m} value={m}>
                  {t.min(m)}
                </option>
              ))}
            </Select>
          </label>
        )}
        <div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setI(0);
              setLeft(minutes * 60);
              stage.enter();
            }}
          >
            {mode === "check" ? <Maximize aria-hidden /> : <Play aria-hidden />}
            {t.start}
          </Button>
        </div>
        {mode === "check" && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
            <span>
              <Kbd>←</Kbd> <Kbd>→</Kbd> {t.switch}
            </span>
            <span>
              <Kbd>Esc</Kbd> {t.exit}
            </span>
          </p>
        )}
      </div>

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        dark={mode === "check" && i === 1}
        style={{ background: mode === "check" ? CHECK[i].hex : "#000" }}
        onClick={mode === "check" ? () => step(1) : undefined}
        onKey={(e) => {
          if (mode !== "check") return;
          if (e.key === "ArrowRight" || e.key === " ") {
            e.preventDefault();
            step(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          }
        }}
        bar={
          mode === "check" ? (
            <>
              <button type="button" className={iconBtn} onClick={() => step(-1)} aria-label={t.prev} title={t.prev}>
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <span className="font-semibold">{CHECK[i][locale]}</span>
              <button type="button" className={iconBtn} onClick={() => step(1)} aria-label={t.next} title={t.next}>
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </>
          ) : (
            <span className="tabular-nums font-semibold">
              {mm} {t.left}
            </span>
          )
        }
      >
        {mode === "wash" && <div ref={barRef} className="absolute inset-y-0 w-[8%] bg-white" style={{ display: "none" }} />}
      </StageLayer>
    </div>
  );
}
