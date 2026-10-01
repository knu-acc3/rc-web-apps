"use client";

import { Maximize, Minus, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import Link from "@/ui/link";
import { href } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Checkbox, Field, Select, Slider } from "@/ui/field";
import { Kbd, Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { StageLayer, useStage } from "@/ui/stage";
import { BarButton } from "./ui/BarButton";

const T = {
  ru: {
    area: "Где мерцать",
    square: "Квадрат",
    full: "Весь экран",
    size: "Размер квадрата",
    duration: "Сколько мерцать",
    min: (n: number) => `${n} мин`,
    warnTitle: "Экран будет быстро мерцать",
    warn: "Мерцание разными цветами много раз в секунду опасно для людей со светочувствительной эпилепсией. Не смотрите на экран во время работы — отойдите или прикройте его.",
    ack: "Я понимаю, запустить мерцание",
    start: "Запустить",
    stage: "Мерцание для оживления застрявшего пикселя",
    close: "Остановить",
    left: "осталось",
    done: "Готово. Проверьте экран — застрявший пиксель должен погаснуть на чёрном фоне.",
    check: "Проверить на битые пиксели",
    drag: "Перетащите квадрат на застрявший пиксель",
    smaller: "Меньше",
    bigger: "Больше",
    keys: "Клавиши",
    keyMove: "двигать квадрат",
    keySize: "размер",
    exit: "остановить",
  },
  en: {
    area: "Flicker area",
    square: "Square",
    full: "Whole screen",
    size: "Square size",
    duration: "Run for",
    min: (n: number) => `${n} min`,
    warnTitle: "The screen will flicker rapidly",
    warn: "Rapid multi-colour flicker is dangerous for people with photosensitive epilepsy. Don't watch the screen while it runs — step away or cover it.",
    ack: "I understand — start the flicker",
    start: "Start",
    stage: "Flicker to revive a stuck pixel",
    close: "Stop",
    left: "left",
    done: "Done. Check the screen — a revived stuck pixel goes dark on a black background.",
    check: "Check for dead pixels",
    drag: "Drag the square onto the stuck pixel",
    smaller: "Smaller",
    bigger: "Bigger",
    keys: "Keys",
    keyMove: "move the square",
    keySize: "size",
    exit: "stop",
  },
} as const;

const DURATIONS = [5, 10, 20, 30, 60];

export default function StuckPixelFixer({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [area, setArea] = useState<"square" | "full">("square");
  const [size, setSize] = useState(160);
  const [minutes, setMinutes] = useState(10);
  const [ack, setAck] = useState(false);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const stage = useStage();

  // Noise: every frame each pixel of the canvas gets a random primary colour, black or white.
  useEffect(() => {
    if (!stage.open) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const full = area === "full";
    const w = full ? Math.ceil(window.innerWidth / 2) : size;
    const h = full ? Math.ceil(window.innerHeight / 2) : size;
    canvas.width = w;
    canvas.height = h;
    const img = ctx.createImageData(w, h);
    const px = new Uint32Array(img.data.buffer);
    const palette = new Uint32Array([0xff0000ff, 0xff00ff00, 0xffff0000, 0xffffffff, 0xff000000]); // ABGR: red, green, blue, white, black
    const rnd = new Uint32Array(16384);
    let raf = 0;
    const tick = () => {
      crypto.getRandomValues(rnd);
      for (let i = 0; i < px.length; i++) px[i] = palette[(rnd[i & 16383] + i * 2654435761) % 5];
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage.open, area, size]);

  // Countdown; stops by itself.
  const { open: running, exit } = stage;
  useEffect(() => {
    if (!running) return;
    const end = Date.now() + minutes * 60_000;
    const id = window.setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        setDone(true);
        exit();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, exit, minutes]);

  function start() {
    setDone(false);
    setLeft(minutes * 60);
    setPos(null);
    stage.enter();
  }

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const move = (dx: number, dy: number) =>
    setPos((p) => {
      const cur = p ?? { x: window.innerWidth / 2 - size / 2, y: window.innerHeight / 2 - size / 2 };
      return { x: Math.max(0, Math.min(window.innerWidth - size, cur.x + dx)), y: Math.max(0, Math.min(window.innerHeight - size, cur.y + dy)) };
    });
  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="grid items-start gap-x-8 gap-y-5 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Segmented
              size="lg"
              label={t.area}
              value={area}
              onChange={setArea}
              options={[
                { value: "square", label: t.square },
                { value: "full", label: t.full },
              ]}
            />
            {area === "square" && (
              <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between text-sm font-medium text-fg-2">
                  {t.size}
                  <span className="text-lg font-bold text-fg tabular-nums">{size} px</span>
                </span>
                <Slider min={40} max={400} step={20} value={size} onChange={(e) => setSize(Number(e.target.value))} format={(v) => `${v} px`} />
              </label>
            )}
            <Field label={t.duration} htmlFor={`${id}-min`}>
              <Select id={`${id}-min`} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-fit">
                {DURATIONS.map((m) => (
                  <option key={m} value={m}>
                    {t.min(m)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Notice tone="warn">
            <p className="flex items-center gap-1.5 font-semibold">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              {t.warnTitle}
            </p>
            <p className="mt-1">{t.warn}</p>
            <Checkbox className="mt-2 text-sm text-warn" label={t.ack} checked={ack} onChange={(e) => setAck(e.target.checked)} />
          </Notice>
        </div>
        <Button variant="filled" size="xl" onClick={start} disabled={!ack} className="w-fit">
          <Maximize aria-hidden />
          {t.start}
        </Button>
        {done && (
          <Notice tone="ok">
            {t.done}{" "}
            <Link href={href(locale, ["dead-pixel-test"])} className="font-medium underline underline-offset-2">
              {t.check}
            </Link>
          </Notice>
        )}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
          <span>
            <Kbd>←</Kbd> <Kbd>↑</Kbd> <Kbd>→</Kbd> <Kbd>↓</Kbd> {t.keyMove}
          </span>
          <span>
            <Kbd>+</Kbd> <Kbd>−</Kbd> {t.keySize}
          </span>
          <span>
            <Kbd>Esc</Kbd> {t.exit}
          </span>
        </p>
      </Panel>

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        style={{ background: "#000" }}
        onKey={(e) => {
          const step = e.shiftKey ? 50 : 10;
          if (e.key === "ArrowLeft") move(-step, 0);
          else if (e.key === "ArrowRight") move(step, 0);
          else if (e.key === "ArrowUp") move(0, -step);
          else if (e.key === "ArrowDown") move(0, step);
          else if (e.key === "+" || e.key === "=") setSize((s) => Math.min(400, s + 20));
          else if (e.key === "-" || e.key === "_") setSize((s) => Math.max(40, s - 20));
          else return;
          e.preventDefault();
        }}
        bar={
          <>
            <span className="tabular-nums font-semibold">
              {mm} {t.left}
            </span>
            {area === "square" && (
              <>
                <span className="hidden opacity-80 sm:inline">{t.drag}</span>
                <BarButton label={t.smaller} icon={<Minus aria-hidden />} onClick={() => setSize((s) => Math.max(40, s - 20))} />
                <BarButton label={t.bigger} icon={<Plus aria-hidden />} onClick={() => setSize((s) => Math.min(400, s + 20))} />
              </>
            )}
          </>
        }
      >
        <canvas
          ref={canvasRef}
          className="absolute touch-none"
          onPointerDown={(e) => {
            if (area !== "square") return;
            const r = e.currentTarget.getBoundingClientRect();
            drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setPos({ x: Math.max(0, Math.min(window.innerWidth - size, e.clientX - drag.current.dx)), y: Math.max(0, Math.min(window.innerHeight - size, e.clientY - drag.current.dy)) });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          style={
            area === "full"
              ? { inset: 0, width: "100%", height: "100%", imageRendering: "pixelated" }
              : { left: pos ? pos.x : `calc(50% - ${size / 2}px)`, top: pos ? pos.y : `calc(50% - ${size / 2}px)`, width: size, height: size, cursor: "move" }
          }
        />
      </StageLayer>
    </div>
  );
}
