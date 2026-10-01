"use client";

import { Eraser, Maximize, Minimize } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/ui/button";
import { Switch } from "@/ui/field";
import { useClientValue } from "./lib/client";

const T = {
  ru: {
    area: "Область теста касаний",
    hint: "Коснитесь здесь одним или несколькими пальцами",
    now: "сейчас",
    max: "Максимум одновременно",
    device: "Устройство сообщает (maxTouchPoints)",
    noTouch: "0 — сенсорный ввод не обнаружен",
    trails: "Следы",
    clear: "Очистить",
    full: "Во весь экран",
    exitFull: "Свернуть",
    types: "Тип ввода",
    pressure: "Сила нажатия",
    typeNames: { touch: "палец", pen: "стилус", mouse: "мышь" } as Record<string, string>,
    touches: ["касание", "касания", "касаний"],
  },
  en: {
    area: "Touch test area",
    hint: "Touch here with one or more fingers",
    now: "now",
    max: "Max simultaneous",
    device: "Device reports (maxTouchPoints)",
    noTouch: "0 — no touch input detected",
    trails: "Trails",
    clear: "Clear",
    full: "Full screen",
    exitFull: "Exit full screen",
    types: "Input type",
    pressure: "Pressure",
    typeNames: { touch: "finger", pen: "stylus", mouse: "mouse" } as Record<string, string>,
    touches: ["touch", "touches"],
  },
} as const;

interface Pt {
  x: number;
  y: number;
  r: number;
  hue: number;
  n: number;
  type: string;
  pressure: number;
}

interface Trail {
  hue: number;
  pts: number[];
}

export default function TouchTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [active, setActive] = useState(0);
  const [max, setMax] = useState(0);
  const [lastType, setLastType] = useState<string | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [trails, setTrails] = useState(true);
  const [full, setFull] = useState(false);
  const maxPoints = useClientValue(() => (typeof navigator !== "undefined" ? (navigator.maxTouchPoints ?? 0) : null), null);
  const canFull = useClientValue(() => typeof document !== "undefined" && !!document.documentElement.requestFullscreen, false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailsRef = useRef(trails);
  const clearRef = useRef<() => void>(() => {});

  useEffect(() => {
    trailsRef.current = trails;
  }, [trails]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const pts = new Map<number, Pt>();
    const done: Trail[] = [];
    const live = new Map<number, Trail>();
    let counter = 0;
    let raf = 0;
    let dirty = true;
    let fg = "#15161a";

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      fg = getComputedStyle(canvas).color || fg;
      dirty = true;
    };
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!dirty) return;
      dirty = false;
      const g = canvas.getContext("2d");
      if (!g) return;
      const dpr = window.devicePixelRatio || 1;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.lineCap = "round";
      g.lineJoin = "round";
      g.lineWidth = 3;
      for (const tr of [...done, ...live.values()]) {
        if (tr.pts.length < 4) continue;
        g.strokeStyle = `hsl(${tr.hue} 75% 55% / 0.55)`;
        g.beginPath();
        g.moveTo(tr.pts[0], tr.pts[1]);
        for (let i = 2; i < tr.pts.length; i += 2) g.lineTo(tr.pts[i], tr.pts[i + 1]);
        g.stroke();
      }
      g.font = "600 14px system-ui, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      for (const p of pts.values()) {
        g.fillStyle = `hsl(${p.hue} 80% 55% / 0.25)`;
        g.strokeStyle = `hsl(${p.hue} 80% 50%)`;
        g.lineWidth = 3;
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.fillStyle = fg;
        g.fillText(String(p.n), p.x, p.y);
        g.font = "12px system-ui, sans-serif";
        g.fillText(`${Math.round(p.x)}, ${Math.round(p.y)}`, p.x, p.y - p.r - 12);
        g.font = "600 14px system-ui, sans-serif";
      }
    };
    const pos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const sync = () => {
      setActive(pts.size);
      setMax((m) => Math.max(m, pts.size));
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      canvas.setPointerCapture?.(e.pointerId);
      const { x, y } = pos(e);
      counter++;
      const hue = (counter * 67) % 360;
      pts.set(e.pointerId, { x, y, r: Math.max(26, Math.min(60, (e.width || 0) / 2 + 14)), hue, n: counter, type: e.pointerType, pressure: e.pressure });
      if (trailsRef.current) live.set(e.pointerId, { hue, pts: [x, y] });
      setLastType(e.pointerType);
      setPressure(e.pointerType === "pen" ? e.pressure : null);
      dirty = true;
      sync();
    };
    const onMove = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const { x, y } = pos(e);
      p.x = x;
      p.y = y;
      p.pressure = e.pressure;
      const tr = live.get(e.pointerId);
      if (tr) tr.pts.push(x, y);
      dirty = true;
    };
    const onUp = (e: PointerEvent) => {
      if (!pts.delete(e.pointerId)) return;
      const tr = live.get(e.pointerId);
      if (tr) {
        live.delete(e.pointerId);
        done.push(tr);
        if (done.length > 200) done.shift();
      }
      dirty = true;
      sync();
    };
    const block = (e: TouchEvent) => e.preventDefault();
    clearRef.current = () => {
      done.length = 0;
      for (const tr of live.values()) tr.pts = tr.pts.slice(-2);
      counter = pts.size;
      dirty = true;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    // iOS Safari still pinch-zooms without this despite touch-action: none
    canvas.addEventListener("touchstart", block, { passive: false });
    canvas.addEventListener("touchmove", block, { passive: false });
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("touchstart", block);
      canvas.removeEventListener("touchmove", block);
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const onFs = () => setFull(!!wrap && document.fullscreenElement === wrap);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      if (wrap && document.fullscreenElement === wrap) document.exitFullscreen().catch(() => {});
    };
  }, []);

  function toggleFull() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  }

  function clear() {
    clearRef.current();
    setMax(active);
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={wrapRef} className={cn("relative overflow-hidden rounded-[1.25rem] bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]", full && "rounded-none shadow-none")}>
        <canvas ref={canvasRef} aria-label={t.area} role="img" className={cn("block w-full touch-none select-none text-fg", full ? "h-dvh" : "h-[60vh] min-h-80")} />
        <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-1 text-center">
          <span className="tabular text-5xl font-bold text-fg">{active}</span>
          <span className="text-sm text-fg-2">{active === 0 ? t.hint : `${plural(locale, active, t.touches)} ${t.now}`}</span>
        </div>
        {full ? (
          <Button variant="filled" onClick={toggleFull} className="absolute top-3 right-3">
            <Minimize aria-hidden />
            {t.exitFull}
          </Button>
        ) : (
          canFull && <IconButton variant="filled" size="lg" label={t.full} icon={<Maximize aria-hidden />} onClick={toggleFull} className="absolute top-3 right-3" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem] text-fg-2">
        <span>
          {t.max}: <span className="tabular text-xl font-bold text-fg">{max}</span>
        </span>
        <span>
          {t.device}: <span className="tabular text-xl font-bold text-fg">{maxPoints === null ? "—" : maxPoints === 0 ? t.noTouch : formatNumber(locale, maxPoints)}</span>
        </span>
        {lastType && (
          <span>
            {t.types}: <span className="font-semibold text-fg">{t.typeNames[lastType] ?? lastType}</span>
          </span>
        )}
        {pressure !== null && (
          <span>
            {t.pressure}: <span className="tabular font-semibold text-fg">{formatNumber(locale, pressure, { maximumFractionDigits: 2 })}</span>
          </span>
        )}
        <span className="flex-1" />
        <Switch label={t.trails} checked={trails} onChange={(e) => setTrails(e.target.checked)} />
        <Button variant="tonal" onClick={clear}>
          <Eraser aria-hidden />
          {t.clear}
        </Button>
      </div>
    </div>
  );
}
