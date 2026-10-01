"use client";

import { Maximize, Plus, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/ui/button";
import type { ToolProps } from "../../../types";
import { compile, errorText } from "../expr/parser";
import { fmtN } from "../../shared/fmt";
import { Explain, Stack } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import {
  DEFAULT_VIEW,
  gridStep,
  pan,
  parseView,
  sample,
  serializeView,
  zoomAt,
  type View,
} from "./sampling";

const COLORS = [
  "#2f6bff",
  "#e5484d",
  "#12a150",
  "#e08a00",
  "#8e4ec6",
  "#0891b2",
];
const KEYS = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;
type FKey = (typeof KEYS)[number];

const T = {
  ru: {
    fn: (i: number) => `Функция ${i}`,
    add: "Добавить функцию",
    remove: "Удалить функцию",
    zoomIn: "Приблизить",
    zoomOut: "Отдалить",
    reset: "Сбросить вид",
    canvas: (list: string) => `График функций: ${list}`,
    hint: "Колесо мыши или щипок — масштаб, перетаскивание — сдвиг. С клавиатуры: стрелки двигают график, + и − меняют масштаб, 0 — исходный вид.",
    logHint: "log — десятичный логарифм, ln — натуральный.",
    at: "При x",
  },
  en: {
    fn: (i: number) => `Function ${i}`,
    add: "Add a function",
    remove: "Remove function",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    reset: "Reset view",
    canvas: (list: string) => `Graph of ${list}`,
    hint: "Scroll or pinch to zoom, drag to pan. Keyboard: arrows pan, + and − zoom, 0 resets the view.",
    logHint: "log is base 10, ln is the natural logarithm.",
    at: "At x",
  },
} as const;

export default function Graph({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const q = useQueryState({
    f1: "sin(x)",
    f2: "x^2/4 - 2",
    f3: "",
    f4: "",
    f5: "",
    f6: "",
    v: serializeView(DEFAULT_VIEW),
  });
  const [viewEdit, setViewEdit] = useState<View | null>(null);
  const view = viewEdit ?? parseView(q.v.v) ?? DEFAULT_VIEW;
  const [size, setSize] = useState({ w: 800, h: 480 });
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [themeTick, setThemeTick] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(view);
  const drag = useRef<{
    x: number;
    y: number;
    view: View;
    pointers: Map<number, { x: number; y: number }>;
    dist: number | null;
  } | null>(null);

  const active = KEYS.filter((k) => q.v[k].trim() !== "" || k === "f1");
  const compiled = KEYS.map((k) => {
    const src = q.v[k].trim();
    if (!src)
      return {
        key: k,
        f: null as ((x: number) => number) | null,
        err: null as string | null,
      };
    try {
      return { key: k, f: compile(src, { decimalComma: ru }), err: null };
    } catch (e) {
      return { key: k, f: null, err: errorText(locale, e, src) };
    }
  });

  useEffect(() => {
    viewRef.current = view;
  });

  // Canvas size follows the container.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({
        w: Math.max(200, Math.round(r.width)),
        h: Math.max(240, Math.round(Math.min(560, r.width * 0.62))),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Redraw when the theme (class on <html>) changes.
  useEffect(() => {
    const mo = new MutationObserver(() => setThemeTick((n) => n + 1));
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    return () => mo.disconnect();
  }, []);

  // Wheel zoom needs a non-passive listener.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      const v = viewRef.current;
      const cx = v.x0 + ((e.clientX - r.left) / r.width) * (v.x1 - v.x0);
      const cy = v.y1 - ((e.clientY - r.top) / r.height) * (v.y1 - v.y0);
      const next = zoomAt(v, Math.exp(e.deltaY * 0.0015), cx, cy);
      setViewEdit(next);
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, []);

  // Persist the view to the URL shortly after interaction stops.
  const viewKey = viewEdit ? serializeView(viewEdit) : null;
  useEffect(() => {
    if (!viewKey) return;
    const tm = setTimeout(() => q.set({ v: viewKey }), 300);
    return () => clearTimeout(tm);
    // q.set is stable in behaviour; only the serialized view matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey]);

  // Draw.
  const fnKey = KEYS.map((k) => q.v[k]).join("\u0001");
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    {
      const dpr = window.devicePixelRatio || 1;
      const { w, h } = size;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const css = getComputedStyle(document.documentElement);
      const col = (name: string, fb: string) =>
        css.getPropertyValue(name).trim() || fb;
      const bg = col("--surface", "#fff");
      const line = col("--line", "#e3e3de");
      const strong = col("--fg-3", "#71737b");
      const text = col("--fg-2", "#55575e");
      const v = view;
      const X = (x: number) => ((x - v.x0) / (v.x1 - v.x0)) * w;
      const Y = (y: number) => h - ((y - v.y0) / (v.y1 - v.y0)) * h;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      // grid
      const sx = gridStep(v.x1 - v.x0, w);
      const sy = gridStep(v.y1 - v.y0, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = line;
      ctx.beginPath();
      for (let x = Math.ceil(v.x0 / sx) * sx; x <= v.x1; x += sx) {
        const px = Math.round(X(x)) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
      }
      for (let y = Math.ceil(v.y0 / sy) * sy; y <= v.y1; y += sy) {
        const py = Math.round(Y(y)) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
      }
      ctx.stroke();
      // axes
      ctx.strokeStyle = strong;
      ctx.beginPath();
      const ax = Math.round(Y(0)) + 0.5;
      const ay = Math.round(X(0)) + 0.5;
      if (ax >= 0 && ax <= h) {
        ctx.moveTo(0, ax);
        ctx.lineTo(w, ax);
      }
      if (ay >= 0 && ay <= w) {
        ctx.moveTo(ay, 0);
        ctx.lineTo(ay, h);
      }
      ctx.stroke();
      // labels
      ctx.fillStyle = text;
      ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
      const lx = Math.min(Math.max(ax + 13, 12), h - 4);
      ctx.textAlign = "center";
      for (let x = Math.ceil(v.x0 / sx) * sx; x <= v.x1; x += sx) {
        if (Math.abs(x) < sx / 2) continue;
        ctx.fillText(fmtN(locale, Number(x.toPrecision(10)), 6), X(x), lx);
      }
      const ly = Math.min(Math.max(ay + 4, 4), w - 40);
      ctx.textAlign = "left";
      for (let y = Math.ceil(v.y0 / sy) * sy; y <= v.y1; y += sy) {
        if (Math.abs(y) < sy / 2) continue;
        ctx.fillText(fmtN(locale, Number(y.toPrecision(10)), 6), ly, Y(y) - 3);
      }
      // functions
      ctx.lineWidth = 2.25;
      ctx.lineJoin = "round";
      compiled.forEach((cf, i) => {
        if (!cf.f) return;
        ctx.strokeStyle = COLORS[i];
        for (const seg of sample(
          cf.f,
          v,
          Math.min(2000, Math.max(400, w * 2)),
        )) {
          ctx.beginPath();
          seg.forEach(([x, y], j) => {
            const py = Math.max(-1e4, Math.min(1e4, Y(y)));
            if (j === 0) ctx.moveTo(X(x), py);
            else ctx.lineTo(X(x), py);
          });
          ctx.stroke();
        }
      });
      // trace line
      if (hoverX !== null) {
        ctx.strokeStyle = strong;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(X(hoverX), 0);
        ctx.lineTo(X(hoverX), h);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    // compiled is derived from fnKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    view.x0,
    view.x1,
    view.y0,
    view.y1,
    size,
    fnKey,
    hoverX,
    themeTick,
    locale,
  ]);

  const toWorld = (clientX: number, clientY: number) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: view.x0 + ((clientX - r.left) / r.width) * (view.x1 - view.x0),
      y: view.y1 - ((clientY - r.top) / r.height) * (view.y1 - view.y0),
      r,
    };
  };

  const zoomBy = (f: number) =>
    setViewEdit(
      zoomAt(view, f, (view.x0 + view.x1) / 2, (view.y0 + view.y1) / 2),
    );
  const panBy = (fx: number, fy: number) =>
    setViewEdit(pan(view, (view.x1 - view.x0) * fx, (view.y1 - view.y0) * fy));

  const described = compiled
    .filter((c) => c.f)
    .map((c) => `y = ${q.v[c.key]}`)
    .join("; ");
  const readout =
    hoverX !== null
      ? compiled
          .map((c, i) => ({ c, i }))
          .filter(({ c }) => c.f)
          .map(({ c, i }) => {
            const y = c.f!(hoverX);
            return {
              i,
              text: `${q.v[c.key]} = ${Number.isFinite(y) ? fmtN(locale, Number(y.toPrecision(8)), 6) : "—"}`,
            };
          })
      : [];

  return (
    <Stack>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-6">
        <section className="flex min-w-0 flex-col gap-3 rounded-[0.75rem] border border-line bg-surface p-4">
          {active.map((k) => {
            const i = KEYS.indexOf(k);
            const cf = compiled[i];
            return (
              <div key={k} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-1 w-5 shrink-0 rounded-full"
                    style={{ background: COLORS[i] }}
                  />
                  <label htmlFor={`${id}-${k}`} className="sr-only">
                    {t.fn(i + 1)}
                  </label>
                  <span
                    aria-hidden
                    className="shrink-0 font-mono text-sm text-fg-3"
                  >
                    y =
                  </span>
                  <input
                    id={`${id}-${k}`}
                    value={q.v[k]}
                    onChange={(e) =>
                      q.set({ [k]: e.target.value } as Partial<
                        Record<FKey, string>
                      >)
                    }
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={!!cf.err}
                    placeholder="x^2"
                    className="control h-10 min-w-0 flex-1 font-mono text-[0.9375rem]"
                  />
                  {k !== "f1" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        q.set({ [k]: "" } as Partial<Record<FKey, string>>)
                      }
                      aria-label={`${t.remove} ${i + 1}`}
                      title={t.remove}
                    >
                      <X aria-hidden />
                    </Button>
                  )}
                </div>
                {cf.err && (
                  <p className="pl-7 text-[0.8125rem] text-err">{cf.err}</p>
                )}
              </div>
            );
          })}
          {active.length < KEYS.length && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                const free = KEYS.find((k) => k !== "f1" && !q.v[k].trim());
                if (free)
                  q.set({ [free]: "x" } as Partial<Record<FKey, string>>);
              }}
            >
              <Plus aria-hidden />
              {t.add}
            </Button>
          )}
          <p className="text-[0.8125rem] text-fg-3">{t.logHint}</p>
        </section>
        <section className="min-w-0">
          <div
            ref={wrapRef}
            className="relative overflow-hidden rounded-[0.75rem] border border-line"
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={t.canvas(described)}
              tabIndex={0}
              style={{
                width: size.w,
                height: size.h,
                touchAction: "none",
                display: "block",
                maxWidth: "100%",
              }}
              onKeyDown={(e) => {
                const map: Record<string, () => void> = {
                  ArrowLeft: () => panBy(-0.1, 0),
                  ArrowRight: () => panBy(0.1, 0),
                  ArrowUp: () => panBy(0, 0.1),
                  ArrowDown: () => panBy(0, -0.1),
                  "+": () => zoomBy(0.8),
                  "=": () => zoomBy(0.8),
                  "-": () => zoomBy(1.25),
                  "0": () => setViewEdit(DEFAULT_VIEW),
                };
                const fn = map[e.key];
                if (fn) {
                  e.preventDefault();
                  fn();
                }
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const d = drag.current ?? {
                  x: e.clientX,
                  y: e.clientY,
                  view,
                  pointers: new Map(),
                  dist: null,
                };
                d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (d.pointers.size === 1) {
                  d.x = e.clientX;
                  d.y = e.clientY;
                  d.view = view;
                  d.dist = null;
                }
                drag.current = d;
              }}
              onPointerMove={(e) => {
                const w = toWorld(e.clientX, e.clientY);
                const d = drag.current;
                if (!d) {
                  setHoverX(w.x);
                  return;
                }
                d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (d.pointers.size >= 2) {
                  const [a, b] = [...d.pointers.values()];
                  const dist = Math.hypot(a.x - b.x, a.y - b.y);
                  if (d.dist !== null && dist > 0) {
                    const mid = toWorld((a.x + b.x) / 2, (a.y + b.y) / 2);
                    setViewEdit(zoomAt(view, d.dist / dist, mid.x, mid.y));
                  }
                  d.dist = dist;
                  return;
                }
                const dx =
                  ((e.clientX - d.x) / w.r.width) * (d.view.x1 - d.view.x0);
                const dy =
                  ((e.clientY - d.y) / w.r.height) * (d.view.y1 - d.view.y0);
                setViewEdit(pan(d.view, -dx, dy));
              }}
              onPointerUp={(e) => {
                const d = drag.current;
                if (!d) return;
                d.pointers.delete(e.pointerId);
                if (d.pointers.size === 0) drag.current = null;
                else {
                  const [p] = [...d.pointers.values()];
                  d.x = p.x;
                  d.y = p.y;
                  d.view = view;
                  d.dist = null;
                }
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
              onPointerLeave={() => setHoverX(null)}
            />
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => zoomBy(0.7)}
                aria-label={t.zoomIn}
                title={t.zoomIn}
              >
                <ZoomIn aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => zoomBy(1 / 0.7)}
                aria-label={t.zoomOut}
                title={t.zoomOut}
              >
                <ZoomOut aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setViewEdit(DEFAULT_VIEW)}
                aria-label={t.reset}
                title={t.reset}
              >
                <Maximize aria-hidden />
              </Button>
            </div>
          </div>
          <div className="mt-2 min-h-6 text-[0.8125rem] text-fg-2">
            {hoverX !== null ? (
              <span className="tabular flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  {t.at} = {fmtN(locale, Number(hoverX.toPrecision(6)), 4)}
                </span>
                {readout.map((r) => (
                  <span key={r.i} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="inline-block size-2 rounded-full"
                      style={{ background: COLORS[r.i] }}
                    />
                    {r.text}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-fg-3">{t.hint}</span>
            )}
          </div>
        </section>
      </div>
      {ru ? (
        <Explain
          locale={locale}
          formula={[
            "y = sin(x), y = x^2 − 4, y = 2x + 1, y = √x, y = ln(x), y = 1/x",
          ]}
          notes={[
            "Записывайте функции от x: умножение можно не писать (2x, 3sin(x)), степень — через ^, десятичный разделитель — запятая или точка.",
            "log — десятичный логарифм, ln — натуральный, sqrt или √ — корень, abs — модуль. Углы в радианах.",
            "Там, где функция не определена (ln x при x ≤ 0) или уходит в бесконечность (tan x, 1/x), линия прерывается, а не соединяет ветви.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={[
            "y = sin(x), y = x^2 − 4, y = 2x + 1, y = √x, y = ln(x), y = 1/x",
          ]}
          notes={[
            "Write functions of x: you can omit the multiplication sign (2x, 3sin(x)) and use ^ for powers.",
            "log is base 10, ln is natural, sqrt or √ is the square root, abs the absolute value. Angles are in radians.",
            "Where a function is undefined (ln x for x ≤ 0) or goes to infinity (tan x, 1/x), the line breaks instead of joining the branches.",
          ]}
        />
      )}
    </Stack>
  );
}
