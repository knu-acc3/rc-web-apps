"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button, IconButton } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { Field, Select, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { SliderField } from "@/ui/slider-field";
import { NumberSlider } from "@/tools/design/css/ui/kit";
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
    centerX: "Центр по X",
    centerY: "Центр по Y",
    from: "Начальный угол",
    stops: "Цвета",
    color: (n: number) => `Цвет ${n}`,
    position: "Позиция",
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
    centerX: "Center X",
    centerY: "Center Y",
    from: "Start angle",
    stops: "Colors",
    color: (n: number) => `Color ${n}`,
    position: "Position",
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

/** A typed stop position: "" means "auto" (null). */
const parsePos = (v: string): number | null => {
  const s = v.trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
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
      <div className="overflow-hidden rounded-[1.25rem] shadow-card" style={CHECKER_STYLE}>
        <div className="h-56 sm:h-72 lg:h-80" style={{ background: gradientValue(g) }} role="img" aria-label={gradientValue(g)} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <Segmented
            label={t.type}
            value={g.type}
            fill
            onChange={(v: GradientType) => set({ type: v })}
            options={[
              { value: "linear", label: t.linear },
              { value: "radial", label: t.radial },
              { value: "conic", label: t.conic },
            ]}
          />
          {g.type === "linear" && (
            <>
              <Field label={t.direction} htmlFor={`${id}-dir`}>
                <Select id={`${id}-dir`} value={g.direction} onChange={(e) => set({ direction: e.target.value })}>
                  <option value="">{t.byAngle}</option>
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              {!g.direction && <NumberSlider label={t.angle} value={g.angle} min={0} max={360} unit="°" onChange={(v) => set({ angle: Math.min(720, Math.max(-360, v)) })} />}
            </>
          )}
          {g.type === "radial" && (
            <Segmented
              label={t.shape}
              value={g.shape}
              size="sm"
              onChange={(v: GradientState["shape"]) => set({ shape: v })}
              options={[
                { value: "circle", label: t.circle },
                { value: "ellipse", label: t.ellipse },
              ]}
            />
          )}
          {g.type === "conic" && <NumberSlider label={t.from} value={g.from} min={0} max={360} unit="°" onChange={(v) => set({ from: Math.min(720, Math.max(-360, v)) })} />}
          {g.type !== "linear" && (
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <NumberSlider label={t.centerX} value={g.x} min={0} max={100} unit="%" onChange={(v) => set({ x: Math.min(100, Math.max(0, v)) })} />
              <NumberSlider label={t.centerY} value={g.y} min={0} max={100} unit="%" onChange={(v) => set({ y: Math.min(100, Math.max(0, v)) })} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Field label={t.space} htmlFor={`${id}-sp`}>
              <Select id={`${id}-sp`} value={g.space} onChange={(e) => set({ space: e.target.value as InterpolationSpace })} size="sm" variant="tonal">
                <option value="">{t.spaceDefault}</option>
                <option value="oklab">in oklab</option>
                <option value="oklch">in oklch</option>
                <option value="srgb-linear">in srgb-linear</option>
              </Select>
            </Field>
            <Switch label={t.repeating} checked={g.repeating} onChange={(e) => set({ repeating: e.target.checked })} className="self-end" />
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-fg-2">{t.stops}</legend>
            <ol className="flex flex-col gap-3">
              {g.stops.map((s, i) => (
                <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-2 rounded-[1rem] bg-surface-2 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <ColorField label={t.color(i + 1)} value={s.color} onChange={(v) => setStop(s.id, { color: v })} locale={locale} size="sm" hideLabel className="self-center" />
                  <SliderField
                    id={`${id}-pos-${s.id}`}
                    label={t.position}
                    value={s.pos === null || s.pos === undefined ? "" : String(s.pos)}
                    onChange={(v) => {
                      const n = parsePos(v);
                      setStop(s.id, { pos: n === null ? null : Math.min(100, Math.max(0, n)) });
                    }}
                    parse={parsePos}
                    format={String}
                    min={0}
                    max={100}
                    suffix="%"
                    className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto"
                  />
                  <IconButton
                    label={t.remove(i + 1)}
                    icon={<X aria-hidden />}
                    disabled={g.stops.length <= 2}
                    onClick={() => set({ stops: g.stops.filter((x) => x.id !== s.id) })}
                    className="col-start-2 row-start-1 self-center sm:col-start-3"
                  />
                </li>
              ))}
            </ol>
            <Button variant="tonal" className="mt-3" onClick={addStop}>
              <Plus aria-hidden />
              {t.add}
            </Button>
          </fieldset>
        </Panel>
      </div>

      <CodeOutput value={gradientCss(g)} title={t.code} filename="gradient.css" labels={{ copy: t.copy, copied: t.copied, download: t.download }} minRows={3} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-fg-2">{t.presets}</h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2.5">
          {GRADIENT_PRESETS.map((p, i) => {
            const state = { ...DEFAULT_GRADIENT, ...p.state };
            return (
              <li key={i}>
                <button
                  type="button"
                  className="block w-full overflow-hidden rounded-[1rem] bg-surface text-left shadow-card transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-elev-2 active:translate-y-0 active:shadow-card"
                  onClick={() => setG(state)}
                >
                  <span className="block h-14" style={{ background: gradientValue(state) }} />
                  <span className="block truncate px-2.5 py-1.5 text-xs font-medium text-fg-2">{p.name[locale]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
