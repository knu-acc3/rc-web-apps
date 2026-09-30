"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { Checkbox, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ColorField, CHECKER_STYLE } from "../ui/ColorField";
import { DEFAULT_GRADIENT, DIRECTIONS, GRADIENT_PRESETS, gradientCss, gradientValue, type GradientState, type GradientStop, type GradientType, type InterpolationSpace } from "./lib/gradient";

const T = {
  ru: {
    type: "Тип градиента",
    linear: "Линейный",
    radial: "Радиальный",
    conic: "Конический",
    angle: "Угол",
    direction: "Направление",
    byAngle: "по углу",
    shape: "Форма",
    circle: "Круг",
    ellipse: "Эллипс",
    center: "Центр X / Y, %",
    from: "Начальный угол",
    stops: "Цвета",
    color: (n: number) => `Цвет ${n}`,
    pos: (n: number) => `Позиция цвета ${n}, %`,
    remove: (n: number) => `Удалить цвет ${n}`,
    add: "Добавить цвет",
    space: "Интерполяция",
    spaceDefault: "обычная (sRGB)",
    repeating: "Повторять",
    presets: "Готовые градиенты",
    code: "CSS-код",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
  },
  en: {
    type: "Gradient type",
    linear: "Linear",
    radial: "Radial",
    conic: "Conic",
    angle: "Angle",
    direction: "Direction",
    byAngle: "by angle",
    shape: "Shape",
    circle: "Circle",
    ellipse: "Ellipse",
    center: "Center X / Y, %",
    from: "Start angle",
    stops: "Colors",
    color: (n: number) => `Color ${n}`,
    pos: (n: number) => `Color ${n} position, %`,
    remove: (n: number) => `Remove color ${n}`,
    add: "Add color",
    space: "Interpolation",
    spaceDefault: "default (sRGB)",
    repeating: "Repeating",
    presets: "Presets",
    code: "CSS code",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
  },
} as const;

const num = (v: string, lo: number, hi: number, fallback: number) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

export default function GradientGenerator({ locale, preset }: { locale: Locale; preset?: number }) {
  const t = T[locale];
  const id = useId();
  const [g, setG] = useState<GradientState>(() => (preset !== undefined && GRADIENT_PRESETS[preset] ? { ...DEFAULT_GRADIENT, ...GRADIENT_PRESETS[preset].state } : DEFAULT_GRADIENT));
  const set = (patch: Partial<GradientState>) => setG((x) => ({ ...x, ...patch }));
  const setStop = (sid: number, patch: Partial<GradientStop>) => setG((x) => ({ ...x, stops: x.stops.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }));
  const nextId = Math.max(0, ...g.stops.map((s) => s.id)) + 1;

  function addStop() {
    const last = g.stops[g.stops.length - 1];
    set({ stops: [...g.stops.map((s, i) => (i === g.stops.length - 1 && s.pos === 100 ? { ...s, pos: 75 } : s)), { id: nextId, color: last?.color ?? "#FFFFFF", pos: 100 }] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[12px] border border-line" style={CHECKER_STYLE}>
        <div className="h-56 sm:h-72" style={{ background: gradientValue(g) }} role="img" aria-label={gradientValue(g)} />
      </div>

      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Segmented
            label={t.type}
            value={g.type}
            onChange={(v: GradientType) => set({ type: v })}
            options={[
              { value: "linear", label: t.linear },
              { value: "radial", label: t.radial },
              { value: "conic", label: t.conic },
            ]}
          />
          {g.type === "linear" && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-dir`} className="text-xs text-fg-3">
                  {t.direction}
                </label>
                <Select id={`${id}-dir`} value={g.direction} onChange={(e) => set({ direction: e.target.value })} size="sm" className="w-44">
                  <option value="">{t.byAngle}</option>
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              {!g.direction && (
                <div className="flex flex-col gap-1">
                  <label htmlFor={`${id}-ang`} className="text-xs text-fg-3">
                    {t.angle}, °
                  </label>
                  <Input id={`${id}-ang`} type="number" min={0} max={360} value={g.angle} onChange={(e) => set({ angle: num(e.target.value, -360, 720, g.angle) })} size="sm" className="w-24" />
                </div>
              )}
            </>
          )}
          {g.type === "radial" && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-shape`} className="text-xs text-fg-3">
                {t.shape}
              </label>
              <Select id={`${id}-shape`} value={g.shape} onChange={(e) => set({ shape: e.target.value as GradientState["shape"] })} size="sm" className="w-32">
                <option value="circle">{t.circle}</option>
                <option value="ellipse">{t.ellipse}</option>
              </Select>
            </div>
          )}
          {g.type === "conic" && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-from`} className="text-xs text-fg-3">
                {t.from}, °
              </label>
              <Input id={`${id}-from`} type="number" min={0} max={360} value={g.from} onChange={(e) => set({ from: num(e.target.value, -360, 720, g.from) })} size="sm" className="w-24" />
            </div>
          )}
          {g.type !== "linear" && (
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 text-xs text-fg-3">{t.center}</legend>
              <div className="flex gap-1.5">
                <Input aria-label="X, %" type="number" min={0} max={100} value={g.x} onChange={(e) => set({ x: num(e.target.value, 0, 100, g.x) })} size="sm" className="w-20" />
                <Input aria-label="Y, %" type="number" min={0} max={100} value={g.y} onChange={(e) => set({ y: num(e.target.value, 0, 100, g.y) })} size="sm" className="w-20" />
              </div>
            </fieldset>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg-2">{t.stops}</legend>
          <ol className="flex flex-col gap-2">
            {g.stops.map((s, i) => (
              <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_5.5rem_2rem] items-end gap-2">
                <ColorField label={t.color(i + 1)} value={s.color} onChange={(v) => setStop(s.id, { color: v })} locale={locale} size="sm" hideLabel />
                <Input
                  aria-label={t.pos(i + 1)}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={s.pos ?? ""}
                  onChange={(e) => setStop(s.id, { pos: e.target.value === "" ? null : num(e.target.value, 0, 100, 0) })}
                  size="sm"
                />
                <Button variant="ghost" size="icon-sm" aria-label={t.remove(i + 1)} title={t.remove(i + 1)} disabled={g.stops.length <= 2} onClick={() => set({ stops: g.stops.filter((x) => x.id !== s.id) })}>
                  <X />
                </Button>
              </li>
            ))}
          </ol>
          <Button variant="outline" size="sm" className="mt-2" onClick={addStop}>
            <Plus aria-hidden />
            {t.add}
          </Button>
        </fieldset>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
          <label htmlFor={`${id}-sp`} className="text-sm text-fg-3">
            {t.space}
          </label>
          <Select id={`${id}-sp`} value={g.space} onChange={(e) => set({ space: e.target.value as InterpolationSpace })} size="sm" className="w-44">
            <option value="">{t.spaceDefault}</option>
            <option value="oklab">in oklab</option>
            <option value="oklch">in oklch</option>
            <option value="srgb-linear">in srgb-linear</option>
          </Select>
          <Checkbox label={t.repeating} checked={g.repeating} onChange={(e) => set({ repeating: e.target.checked })} />
        </div>
      </Panel>

      <CodeOutput value={gradientCss(g)} title={t.code} filename="gradient.css" labels={{ copy: t.copy, copied: t.copied, download: t.download }} minRows={3} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-fg-2">{t.presets}</h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
          {GRADIENT_PRESETS.map((p, i) => {
            const state = { ...DEFAULT_GRADIENT, ...p.state };
            return (
              <li key={i}>
                <button type="button" className="w-full overflow-hidden rounded-[10px] border border-line text-left hover:border-line-strong" onClick={() => setG(state)}>
                  <span className="block h-12" style={{ background: gradientValue(state) }} />
                  <span className="block px-2 py-1 text-xs text-fg-2">{p.name[locale]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
