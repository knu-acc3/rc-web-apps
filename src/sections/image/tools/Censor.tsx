"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useRef, useState, type PointerEvent } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { centeredAspectRect, clampRect, type Rect } from "../engine/geometry";
import { censorOn } from "../engine/pipeline";
import { processFile, toBlob } from "../engine/run";
import { baseName } from "../engine/source";
import type { Op } from "../engine/types";
import { ColorField, RangeField } from "../ui/controls";
import { DEFAULT_QUALITY, LOSSY, sameFormat } from "../ui/format";
import { useEngine } from "../ui/hooks";
import { ImageStage } from "../ui/ImageStage";
import { usePreviewBitmap } from "../ui/LiveStage";
import { RectEditor } from "../ui/RectEditor";
import { SingleImageShell, useExport, useSingleFile } from "../ui/SingleImage";

const T = {
  ru: {
    mode: "Способ",
    blur: "Размытие",
    pixelate: "Пиксели",
    box: "Заливка",
    strength: "Сила",
    color: "Цвет заливки",
    add: "Добавить область",
    del: "Удалить область",
    area: (n: number) => `Область ${n}`,
    hint: "Выделите область мышью или пальцем; стрелки перемещают выбранную область",
    areas: (n: number) => `${n} ${plural("ru", n, ["область", "области", "областей"])}`,
    safest: "Для номеров и текста надёжнее заливка или крупная пикселизация: слабое размытие иногда частично обратимо.",
    download: "Скачать результат",
  },
  en: {
    mode: "Method",
    blur: "Blur",
    pixelate: "Pixelate",
    box: "Solid box",
    strength: "Strength",
    color: "Box colour",
    add: "Add area",
    del: "Delete area",
    area: (n: number) => `Area ${n}`,
    hint: "Drag on the image to select an area; arrow keys move the selected area",
    areas: (n: number) => `${n} ${plural("en", n, ["area", "areas"])}`,
    safest: "For plates and text a solid box or strong pixelation is safest: weak blur can sometimes be partially reversed.",
    download: "Download result",
  },
} as const;

export default function Censor({ locale }: { locale: Locale }) {
  const t = T[locale];
  const getEngine = useEngine();
  const file = useSingleFile();
  const exp = useExport();
  const { bitmap, info } = usePreviewBitmap(file.prepared ?? undefined, 1600);
  const [mode, setMode] = useState<"blur" | "pixelate" | "box">("pixelate");
  const [strength, setStrength] = useState(60);
  const [color, setColor] = useState("#000000");
  const [areas, setAreas] = useState<Rect[]>([]);
  const [sel, setSel] = useState(0);
  const W = info?.srcWidth ?? 0;
  const H = info?.srcHeight ?? 0;

  const imgKey = W && H ? `${file.prepared?.id}:${W}x${H}` : "";
  const [areasFor, setAreasFor] = useState("");
  if (imgKey !== areasFor) {
    setAreasFor(imgKey);
    setAreas(imgKey ? [centeredAspectRect(W, H, null, 0.3)] : []);
    setSel(0);
  }

  const op: Extract<Op, { t: "censor" }> = { t: "censor", areas, mode, strength, color };
  const opKey = JSON.stringify(op);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, bmp: ImageBitmap) => {
      ctx.drawImage(bmp, 0, 0);
      if (info) censorOn(ctx, bmp.width, bmp.height, JSON.parse(opKey), info.scale);
    },
    [opKey, info],
  );

  // draw a new area by dragging on free space
  const drawing = useRef<{ x: number; y: number; idx: number } | null>(null);
  const toSrc = (e: PointerEvent, factor: number) => {
    const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: (e.clientX - b.left) / factor, y: (e.clientY - b.top) / factor };
  };

  const doExport = () => {
    const p = file.prepared;
    if (!p) return;
    exp.run(async (signal, onProgress) => {
      const fmt = sameFormat(p.format);
      const res = await processFile(getEngine(), p, [op], { format: fmt, quality: LOSSY.has(fmt) ? 90 : DEFAULT_QUALITY[fmt], background: "#FFFFFF" }, { signal, onProgress });
      return { blob: toBlob(res), name: `${baseName(p.file.name)}-censored.${res.ext}` };
    });
  };

  const options = (
    <>
      <Field label={t.mode}>
        <Segmented label={t.mode} value={mode} onChange={setMode} options={[{ value: "pixelate", label: t.pixelate }, { value: "blur", label: t.blur }, { value: "box", label: t.box }]} />
      </Field>
      {mode === "box" ? (
        <ColorField label={t.color} value={color} onChange={setColor} locale={locale} className="w-48" />
      ) : (
        <div className="min-w-44 flex-1">
          <RangeField label={t.strength} value={strength} onChange={setStrength} min={0} max={100} unit="%" locale={locale} />
        </div>
      )}
      <div className="flex gap-1.5">
        <Button variant="outline" onClick={() => { setAreas((a) => [...a, centeredAspectRect(W, H, null, 0.25)]); setSel(areas.length); }} disabled={!W}>
          <Plus aria-hidden />
          {t.add}
        </Button>
        <Button variant="ghost" size="icon" aria-label={t.del} title={t.del} disabled={!areas.length} onClick={() => { setAreas((a) => a.filter((_, i) => i !== sel)); setSel(0); }}>
          <Trash2 aria-hidden />
        </Button>
      </div>
    </>
  );

  return (
    <SingleImageShell
      locale={locale}
      file={file}
      options={options}
      exp={exp}
      onExport={doExport}
      exportLabel={t.download}
      figure={t.areas(areas.length)}
      extra={<p className="text-fg-3">{mode === "box" ? t.hint : `${t.hint}. ${t.safest}`}</p>}
      stage={
        <ImageStage bitmap={bitmap} srcWidth={W} locale={locale} draw={draw}>
          {(factor) => (
            <div
              className="absolute inset-0 cursor-crosshair touch-none"
              onPointerDown={(e) => {
                if (e.target !== e.currentTarget) return;
                const pt = toSrc(e, factor);
                e.currentTarget.setPointerCapture(e.pointerId);
                drawing.current = { ...pt, idx: areas.length };
                setAreas((a) => [...a, { x: pt.x, y: pt.y, w: 1, h: 1 }]);
                setSel(areas.length);
              }}
              onPointerMove={(e) => {
                const d = drawing.current;
                if (!d) return;
                const pt = toSrc(e, factor);
                const r = clampRect({ x: Math.min(d.x, pt.x), y: Math.min(d.y, pt.y), w: Math.abs(pt.x - d.x), h: Math.abs(pt.y - d.y) }, W, H, 1);
                setAreas((a) => a.map((x, i) => (i === d.idx ? r : x)));
              }}
              onPointerUp={() => {
                const d = drawing.current;
                drawing.current = null;
                if (!d) return;
                // discard accidental clicks
                setAreas((a) => a.filter((x, i) => i !== d.idx || (x.w * factor > 6 && x.h * factor > 6)));
              }}
            >
              {areas.map((a, i) => (
                <RectEditor
                  key={i}
                  rect={a}
                  onChange={(r) => setAreas((xs) => xs.map((x, j) => (j === i ? r : x)))}
                  imgW={W}
                  imgH={H}
                  factor={factor}
                  dim={false}
                  active={i === sel}
                  onActivate={() => setSel(i)}
                  locale={locale}
                  label={t.area(i + 1)}
                  tone="accent"
                />
              ))}
            </div>
          )}
        </ImageStage>
      }
    />
  );
}
