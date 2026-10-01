"use client";

import { ArrowDown, ArrowDownLeft, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Panel } from "@/ui/panel";
import { parseColor, toHex } from "@/tools/design/color/lib/color";
import { ColorField } from "@/tools/design/color/ui/ColorField";
import { triangleBorderCss, triangleClipCss, trianglePolygon, type TriangleDir } from "./lib/shapes";
import { CodePanel, NumberSlider, Stage } from "./ui/kit";

const T = {
  ru: {
    direction: "Направление",
    dirs: {
      "top-left": "Вверх-влево",
      up: "Вверх",
      "top-right": "Вверх-вправо",
      left: "Влево",
      right: "Вправо",
      "bottom-left": "Вниз-влево",
      down: "Вниз",
      "bottom-right": "Вниз-вправо",
    } as Record<TriangleDir, string>,
    width: "Ширина",
    height: "Высота",
    color: "Цвет",
    borders: "Через border",
    clip: "Через clip-path",
    preview: "Треугольник",
  },
  en: {
    direction: "Direction",
    dirs: {
      "top-left": "Up-left",
      up: "Up",
      "top-right": "Up-right",
      left: "Left",
      right: "Right",
      "bottom-left": "Down-left",
      down: "Down",
      "bottom-right": "Down-right",
    } as Record<TriangleDir, string>,
    width: "Width",
    height: "Height",
    color: "Color",
    borders: "With borders",
    clip: "With clip-path",
    preview: "Triangle",
  },
} as const;

const GRID: (TriangleDir | null)[] = ["top-left", "up", "top-right", "left", null, "right", "bottom-left", "down", "bottom-right"];
const ICON: Record<TriangleDir, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
  "top-left": ArrowUpLeft,
  "top-right": ArrowUpRight,
  "bottom-left": ArrowDownLeft,
  "bottom-right": ArrowDownRight,
};

export default function TriangleGenerator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [dir, setDir] = useState<TriangleDir>("up");
  const [w, setW] = useState(120);
  const [h, setH] = useState(100);
  const [color, setColor] = useState("#6366F1");
  const c = parseColor(color);
  const hex = c ? toHex(c) : "#6366F1";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Stage locale={locale} minHeight={300}>
          <div role="img" aria-label={`${t.preview}: ${t.dirs[dir]}`} style={{ width: w, height: h, background: hex, clipPath: trianglePolygon(dir) }} />
        </Stage>
        <Panel className="flex flex-col gap-4 p-4">
          <div>
            <div className="mb-1.5 text-sm font-medium text-fg-2" id="tri-dir">
              {t.direction}
            </div>
            <div role="radiogroup" aria-labelledby="tri-dir" className="grid w-fit grid-cols-3 gap-1">
              {GRID.map((d, i) =>
                d ? (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={dir === d}
                    aria-label={t.dirs[d]}
                    title={t.dirs[d]}
                    onClick={() => setDir(d)}
                    className={cn("flex size-10 items-center justify-center rounded-[0.5rem] border", dir === d ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-2 hover:bg-surface-2")}
                  >
                    {(() => {
                      const Icon = ICON[d];
                      return <Icon className="size-4" aria-hidden />;
                    })()}
                  </button>
                ) : (
                  <span key={i} />
                ),
              )}
            </div>
          </div>
          <NumberSlider label={t.width} value={w} min={4} max={300} unit="px" onChange={(v) => setW(Math.max(1, v))} />
          <NumberSlider label={t.height} value={h} min={4} max={300} unit="px" onChange={(v) => setH(Math.max(1, v))} />
          <ColorField label={t.color} value={color} onChange={setColor} locale={locale} size="sm" />
        </Panel>
      </div>
      <CodePanel
        locale={locale}
        tabs={[
          { id: "border", label: t.borders, code: triangleBorderCss(dir, w, h, hex), filename: "triangle.css" },
          { id: "clip", label: t.clip, code: triangleClipCss(dir, w, h, hex), filename: "triangle.css" },
        ]}
      />
    </div>
  );
}
