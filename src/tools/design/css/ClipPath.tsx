"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useRef, useState, type PointerEvent } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { CLIP_SHAPES, clipBySlug, polygonCss, type Point } from "./lib/shapes";
import { CodePanel, Stage } from "./ui/kit";

const T = {
  ru: {
    shape: "Фигура",
    point: (n: number, x: number, y: number) => `Точка ${n}: ${x} %, ${y} %`,
    add: "Добавить точку",
    remove: "Удалить точку",
    hint: "Тяните точки; с клавиатуры — Tab и стрелки (Shift — шаг 10 %), Delete удаляет.",
    value: "Функция clip-path",
    shapes: {
      triangle: "Треугольник",
      trapezoid: "Трапеция",
      parallelogram: "Параллелограмм",
      rhombus: "Ромб",
      pentagon: "Пятиугольник",
      hexagon: "Шестиугольник",
      octagon: "Восьмиугольник",
      star: "Звезда",
      arrow: "Стрелка",
      chevron: "Шеврон",
      cross: "Крест",
      message: "Облачко сообщения",
      circle: "Круг",
      ellipse: "Эллипс",
      inset: "Прямоугольник со скруглением",
    } as Record<string, string>,
  },
  en: {
    shape: "Shape",
    point: (n: number, x: number, y: number) => `Point ${n}: ${x}%, ${y}%`,
    add: "Add point",
    remove: "Remove point",
    hint: "Drag the points; keyboard: Tab and arrows (Shift = 10%), Delete removes.",
    value: "clip-path function",
    shapes: {
      triangle: "Triangle",
      trapezoid: "Trapezoid",
      parallelogram: "Parallelogram",
      rhombus: "Rhombus",
      pentagon: "Pentagon",
      hexagon: "Hexagon",
      octagon: "Octagon",
      star: "Star",
      arrow: "Arrow",
      chevron: "Chevron",
      cross: "Cross",
      message: "Message bubble",
      circle: "Circle",
      ellipse: "Ellipse",
      inset: "Rounded rectangle",
    } as Record<string, string>,
  },
} as const;

const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10) / 10));

export default function ClipPathGenerator({ locale, shape: shape0 = "hexagon" }: { locale: Locale; shape?: string }) {
  const t = T[locale];
  const id = useId();
  const start = clipBySlug.get(shape0) ?? clipBySlug.get("hexagon")!;
  const [slug, setSlug] = useState(start.slug);
  const [points, setPoints] = useState<Point[]>(() => start.points ?? []);
  const [fn, setFn] = useState(() => start.css ?? "");
  const [sel, setSel] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const isPolygon = !!clipBySlug.get(slug)?.points;
  const value = isPolygon ? polygonCss(points) : fn;

  function choose(s: string) {
    const sh = clipBySlug.get(s)!;
    setSlug(s);
    setPoints(sh.points ?? []);
    setFn(sh.css ?? "");
    setSel(0);
  }
  function movePoint(i: number, x: number, y: number) {
    setPoints((ps) => ps.map((p, k) => (k === i ? [clamp(x), clamp(y)] : p)));
  }
  function fromPointer(e: PointerEvent): Point | null {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  }
  function addPoint() {
    if (points.length < 2) return;
    const a = points[sel];
    const b = points[(sel + 1) % points.length];
    const mid: Point = [clamp((a[0] + b[0]) / 2), clamp((a[1] + b[1]) / 2)];
    setPoints((ps) => [...ps.slice(0, sel + 1), mid, ...ps.slice(sel + 1)]);
    setSel(sel + 1);
  }
  function removePoint(i: number) {
    if (points.length <= 3) return;
    setPoints((ps) => ps.filter((_, k) => k !== i));
    setSel(Math.max(0, i - 1));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Stage locale={locale} minHeight={340}>
          <div
            ref={boxRef}
            className="relative size-64 touch-none select-none sm:size-72"
            onPointerMove={(e) => {
              if (drag.current === null) return;
              const p = fromPointer(e);
              if (p) movePoint(drag.current, p[0], p[1]);
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <div className="absolute inset-0 opacity-25" style={{ background: "linear-gradient(135deg, #6366f1, #ec4899, #f59e0b)" }} aria-hidden />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #6366f1, #ec4899, #f59e0b)", clipPath: value }} aria-hidden />
            {isPolygon &&
              points.map(([x, y], i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t.point(i + 1, x, y)}
                  aria-pressed={i === sel}
                  className={`absolute size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.5)] transition-transform hover:scale-125 active:cursor-grabbing pointer-coarse:size-7 ${i === sel ? "scale-110 bg-zinc-900" : "bg-indigo-500"}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onFocus={() => setSel(i)}
                  onPointerDown={(e) => {
                    drag.current = i;
                    boxRef.current?.setPointerCapture(e.pointerId);
                    setSel(i);
                  }}
                  onKeyDown={(e) => {
                    const step = e.shiftKey ? 10 : 1;
                    const d: Record<string, Point> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
                    if (d[e.key]) {
                      e.preventDefault();
                      movePoint(i, x + d[e.key][0], y + d[e.key][1]);
                    } else if (e.key === "Delete" || e.key === "Backspace") {
                      e.preventDefault();
                      removePoint(i);
                    }
                  }}
                />
              ))}
          </div>
        </Stage>
        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <div>
            <div id={`${id}-s`} className="mb-2 text-sm font-medium text-fg-2">
              {t.shape}
            </div>
            <div role="radiogroup" aria-labelledby={`${id}-s`} className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-8">
              {CLIP_SHAPES.map((sh) => (
                <button
                  key={sh.slug}
                  type="button"
                  role="radio"
                  aria-checked={slug === sh.slug}
                  aria-label={t.shapes[sh.slug]}
                  title={t.shapes[sh.slug]}
                  onClick={() => choose(sh.slug)}
                  className="chip aspect-square h-auto! min-h-11 justify-center p-1.5!"
                >
                  <span aria-hidden className="block size-full max-h-9 max-w-9 bg-current opacity-80" style={{ clipPath: sh.points ? polygonCss(sh.points) : sh.css }} />
                </button>
              ))}
            </div>
          </div>
          {isPolygon ? (
            <>
              <p className="text-sm text-fg-3">{t.hint}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="tonal" onClick={addPoint}>
                  <Plus aria-hidden />
                  {t.add}
                </Button>
                <Button variant="text" onClick={() => removePoint(sel)} disabled={points.length <= 3}>
                  <Trash2 aria-hidden />
                  {t.remove}
                </Button>
              </div>
            </>
          ) : (
            <Field label={t.value} htmlFor={`${id}-f`}>
              <Input id={`${id}-f`} value={fn} onChange={(e) => setFn(e.target.value)} className="font-mono" size="sm" autoComplete="off" spellCheck={false} />
            </Field>
          )}
        </Panel>
      </div>
      <CodePanel locale={locale} tabs={[{ id: "css", label: "CSS", code: `clip-path: ${value};`, filename: "clip-path.css" }]} minRows={2} />
    </div>
  );
}
