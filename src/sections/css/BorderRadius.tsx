"use client";

import { Shuffle } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { randomFloat } from "@/sections/random/lib/rng";
import { blobRadii, parseRadius, radiusValue, type Radii } from "./lib/radius";
import type { Length } from "./lib/tokens";
import { CodePanel, NumberSlider, Stage } from "./ui/kit";

const T = {
  ru: {
    mode: "Режим",
    corners: "Углы",
    blob: "Блоб",
    all: "Все углы",
    link: "Одинаковые углы",
    elliptical: "Эллиптические углы (значения через /)",
    corner: ["Верхний левый", "Верхний правый", "Нижний правый", "Нижний левый"],
    horizontal: "по горизонтали",
    vertical: "по вертикали",
    unit: "Единицы",
    random: "Новая форма",
    paste: "Вставить border-radius",
    invalid: "Не удалось разобрать значение",
    preview: "Превью формы",
  },
  en: {
    mode: "Mode",
    corners: "Corners",
    blob: "Blob",
    all: "All corners",
    link: "Same radius for all corners",
    elliptical: "Elliptical corners (values with /)",
    corner: ["Top left", "Top right", "Bottom right", "Bottom left"],
    horizontal: "horizontal",
    vertical: "vertical",
    unit: "Units",
    random: "New shape",
    paste: "Paste a border-radius",
    invalid: "Can't parse this value",
    preview: "Shape preview",
  },
} as const;

type Unit = "px" | "%" | "rem";
const L = (value: number, unit: Unit): Length => ({ value, unit: value === 0 ? "" : unit });
const same = (v: number, u: Unit): Radii => ({ h: [L(v, u), L(v, u), L(v, u), L(v, u)], v: [L(v, u), L(v, u), L(v, u), L(v, u)] });
const DEFAULT_BLOB: Radii = parseRadius("30% 70% 70% 30% / 30% 30% 70% 70%")!;

export default function BorderRadiusGenerator({ locale, mode: mode0 = "corners" }: { locale: Locale; mode?: "corners" | "blob" }) {
  const t = T[locale];
  const id = useId();
  const [mode, setMode] = useState<"corners" | "blob">(mode0);
  const [unit, setUnit] = useState<Unit>(mode0 === "blob" ? "%" : "px");
  const [linked, setLinked] = useState(true);
  const [elliptical, setElliptical] = useState(false);
  const [r, setR] = useState<Radii>(() => (mode0 === "blob" ? DEFAULT_BLOB : same(16, "px")));
  const [paste, setPaste] = useState("");
  const pasteBad = paste.trim() !== "" && !parseRadius(paste);
  const value = radiusValue(r, mode === "blob");
  const max = unit === "%" ? 50 : unit === "rem" ? 10 : 200;

  function setCorner(i: number, axis: "h" | "v" | "both", v: number) {
    setR((prev) => {
      const next: Radii = { h: [...prev.h], v: [...prev.v] };
      const idx = linked ? [0, 1, 2, 3] : [i];
      for (const k of idx) {
        if (axis !== "v") next.h[k] = L(v, unit);
        if (axis !== "h" && (axis === "v" || !elliptical)) next.v[k] = L(v, unit);
      }
      return next;
    });
  }

  function switchMode(m: "corners" | "blob") {
    setMode(m);
    if (m === "blob") {
      setUnit("%");
      setR(blobRadii(randomFloat));
    } else {
      setUnit("px");
      setR(same(16, "px"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Stage locale={locale} minHeight={320}>
          <div
            role="img"
            aria-label={t.preview}
            className="size-52 sm:size-60"
            style={{ borderRadius: value, background: mode === "blob" ? "linear-gradient(135deg, #6366f1, #ec4899)" : "#6366f1", transition: "border-radius 0.4s ease" }}
          />
        </Stage>
        <Panel className="flex flex-col gap-3 p-4">
          <Segmented
            label={t.mode}
            value={mode}
            onChange={switchMode}
            options={[
              { value: "corners", label: t.corners },
              { value: "blob", label: t.blob },
            ]}
          />
          {mode === "blob" ? (
            <Button variant="primary" onClick={() => setR(blobRadii(randomFloat))} className="self-start">
              <Shuffle aria-hidden />
              {t.random}
            </Button>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Checkbox label={t.link} checked={linked} onChange={(e) => setLinked(e.target.checked)} />
                <Checkbox label={t.elliptical} checked={elliptical} onChange={(e) => setElliptical(e.target.checked)} />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor={`${id}-u`} className="text-sm text-fg-2">
                  {t.unit}
                </label>
                <Select
                  id={`${id}-u`}
                  value={unit}
                  size="sm"
                  className="w-24"
                  onChange={(e) => {
                    const u = e.target.value as Unit;
                    setUnit(u);
                    setR((prev) => ({ h: prev.h.map((l) => L(l.value, u)) as Radii["h"], v: prev.v.map((l) => L(l.value, u)) as Radii["v"] }));
                  }}
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="rem">rem</option>
                </Select>
              </div>
              {(linked ? [0] : [0, 1, 2, 3]).map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <NumberSlider
                    label={`${linked ? t.all : t.corner[i]}${elliptical ? ` — ${t.horizontal}` : ""}`}
                    value={r.h[i].value}
                    min={0}
                    max={max}
                    step={unit === "rem" ? 0.125 : 1}
                    unit={unit}
                    onChange={(v) => setCorner(i, elliptical ? "h" : "both", Math.max(0, v))}
                  />
                  {elliptical && (
                    <NumberSlider
                      label={`${linked ? t.all : t.corner[i]} — ${t.vertical}`}
                      value={r.v[i].value}
                      min={0}
                      max={max}
                      step={unit === "rem" ? 0.125 : 1}
                      unit={unit}
                      onChange={(v) => setCorner(i, "v", Math.max(0, v))}
                    />
                  )}
                </div>
              ))}
            </>
          )}
          <Field label={t.paste} htmlFor={`${id}-p`} error={pasteBad ? t.invalid : undefined}>
            <Input
              id={`${id}-p`}
              value={paste}
              placeholder="12px 24px / 8px"
              className="font-mono"
              autoComplete="off"
              size="sm"
              onChange={(e) => {
                setPaste(e.target.value);
                const p = parseRadius(e.target.value);
                if (p) setR(p);
              }}
            />
          </Field>
        </Panel>
      </div>
      <CodePanel locale={locale} tabs={[{ id: "css", label: "CSS", code: `border-radius: ${value};`, filename: "border-radius.css" }]} minRows={2} />
    </div>
  );
}
