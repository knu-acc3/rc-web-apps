"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Select } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { applyAspect, centeredAspectRect, roundRect, type Rect } from "./lib/geometry";
import { processFile, toBlob } from "./lib/run";
import { baseName } from "./lib/source";
import type { Op, OutFormat } from "./lib/types";
import { ColorField, NumberField } from "./ui/controls";
import { DEFAULT_QUALITY, LOSSY, OUT_LABEL, sameFormat } from "./ui/format";
import { useEngine } from "./ui/hooks";
import { ImageStage } from "./ui/ImageStage";
import { usePreviewBitmap } from "./ui/LiveStage";
import { RectEditor } from "./ui/RectEditor";
import { SingleImageShell, useExport, useSingleFile } from "./ui/SingleImage";
import { S } from "./ui/strings";

const T = {
  ru: {
    ratio: "Пропорции",
    free: "Свободно",
    output: "Формат",
    same: "Как у исходного",
    x: "X",
    y: "Y",
    w: "Ширина",
    h: "Высота",
    frame: "Рамка обрезки",
    circle: "Круг",
    bg: "Фон вне круга (JPG)",
    size: "Размер результата",
    original: "как выделено",
    download: "Обрезать и скачать",
  },
  en: {
    ratio: "Aspect ratio",
    free: "Free",
    output: "Format",
    same: "Same as source",
    x: "X",
    y: "Y",
    w: "Width",
    h: "Height",
    frame: "Crop frame",
    circle: "Circle",
    bg: "Background outside the circle (JPG)",
    size: "Output size",
    original: "as selected",
    download: "Crop and download",
  },
} as const;

const RATIOS: [string, number | null][] = [
  ["free", null],
  ["1:1", 1],
  ["4:3", 4 / 3],
  ["3:2", 3 / 2],
  ["16:9", 16 / 9],
  ["9:16", 9 / 16],
  ["4:5", 4 / 5],
  ["2:3", 2 / 3],
];

export interface CropProps {
  locale: Locale;
  ratio?: [number, number];
  shape?: "rect" | "circle";
}

export default function Crop({ locale, ratio: presetRatio, shape = "rect" }: CropProps) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const getEngine = useEngine();
  const file = useSingleFile();
  const exp = useExport();
  const { bitmap, info } = usePreviewBitmap(file.prepared ?? undefined, 1600);
  const circle = shape === "circle";
  const presetKey = presetRatio ? `${presetRatio[0]}:${presetRatio[1]}` : null;
  const ratios: [string, number | null][] =
    presetKey && !RATIOS.some(([k]) => k === presetKey) ? [...RATIOS, [presetKey, presetRatio![0] / presetRatio![1]]] : RATIOS;
  const [ratioKey, setRatioKey] = useState<string>(circle ? "1:1" : (presetKey ?? "free"));
  const aspect = circle ? 1 : (ratios.find(([k]) => k === ratioKey)?.[1] ?? null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [out, setOut] = useState<"same" | OutFormat>(circle ? "png" : "same");
  const [bg, setBg] = useState("#FFFFFF");
  const [outSize, setOutSize] = useState<number | null>(null);

  const W = info?.srcWidth ?? 0;
  const H = info?.srcHeight ?? 0;
  // new image → default frame (derived-state pattern, no effect)
  const imgKey = W && H ? `${file.prepared?.id}:${W}x${H}` : "";
  const [rectFor, setRectFor] = useState("");
  if (imgKey !== rectFor) {
    setRectFor(imgKey);
    setRect(imgKey ? centeredAspectRect(W, H, aspect, aspect ? 0.9 : 0.8) : null);
  }

  const chooseRatio = (k: string) => {
    setRatioKey(k);
    const a = ratios.find(([x]) => x === k)?.[1] ?? null;
    if (rect && W) setRect(applyAspect(rect, a, W, H));
  };

  const r = rect && W ? roundRect(rect, W, H) : null;
  const setNum = (k: keyof Rect) => (v: number | null) => {
    if (!r || v === null) return;
    const next = { ...r, [k]: v };
    if (aspect && (k === "w" || k === "h")) {
      if (k === "w") next.h = v / aspect;
      else next.w = v * aspect;
    }
    setRect(applyAspect(next, aspect, W, H));
  };

  const doExport = () => {
    const p = file.prepared;
    if (!p || !r) return;
    exp.run(async (signal, onProgress) => {
      const fmt: OutFormat = out === "same" ? (circle && sameFormat(p.format) === "jpg" ? "png" : sameFormat(p.format)) : out;
      const ops: Op[] = [{ t: "crop", rect: r }];
      if (circle) ops.push({ t: "circle", fill: fmt === "jpg" ? { kind: "color", color: bg } : { kind: "transparent" } });
      if (outSize) ops.push({ t: "size", w: outSize, h: Math.round((outSize * r.h) / r.w) });
      const res = await processFile(
        getEngine(),
        p,
        ops,
        { format: fmt, quality: LOSSY.has(fmt) ? 92 : DEFAULT_QUALITY[fmt], background: bg },
        { signal, onProgress },
      );
      return { blob: toBlob(res), name: `${baseName(p.file.name)}-${circle ? "circle" : "cropped"}.${res.ext}` };
    });
  };

  const options = (
    <>
      {!circle && (
        <Field label={t.ratio}>
          <Segmented
            wrap
            label={t.ratio}
            value={ratioKey}
            onChange={chooseRatio}
            options={ratios.map(([k]) => ({ value: k, label: k === "free" ? t.free : k }))}
          />
        </Field>
      )}
      <Field label={t.output} htmlFor={`${id}-out`} className="w-40">
        <Select id={`${id}-out`} value={out} onChange={(e) => setOut(e.target.value as "same" | OutFormat)}>
          <option value="same">{t.same}</option>
          {(["jpg", "png", "webp"] as const).map((f) => (
            <option key={f} value={f}>
              {OUT_LABEL[f]}
            </option>
          ))}
        </Select>
      </Field>
      {circle && <NumberField label={t.size} value={outSize} onChange={setOutSize} min={16} max={8192} suffix="px" placeholder={t.original} className="w-40" />}
    </>
  );

  const more = r ? (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:col-span-2">
        <NumberField label={t.x} value={r.x} onChange={setNum("x")} min={0} max={W} suffix="px" />
        <NumberField label={t.y} value={r.y} onChange={setNum("y")} min={0} max={H} suffix="px" />
        <NumberField label={t.w} value={r.w} onChange={setNum("w")} min={1} max={W} suffix="px" />
        <NumberField label={t.h} value={r.h} onChange={setNum("h")} min={1} max={H} suffix="px" />
      </div>
      {(circle || out === "jpg") && <ColorField label={circle ? t.bg : `${s.background} (JPG)`} value={bg} onChange={setBg} locale={locale} />}
    </>
  ) : undefined;

  return (
    <SingleImageShell
      locale={locale}
      file={file}
      options={options}
      more={more}
      exp={exp}
      exportLabel={t.download}
      onExport={doExport}
      figure={r ? `${outSize ?? r.w} × ${outSize ? Math.round((outSize * r.h) / r.w) : r.h} px` : "—"}
      stage={
        <ImageStage bitmap={bitmap} srcWidth={W} locale={locale}>
          {(factor) =>
            rect && (
              <RectEditor
                rect={rect}
                onChange={setRect}
                imgW={W}
                imgH={H}
                factor={factor}
                aspect={aspect}
                shape={circle ? "ellipse" : "rect"}
                thirds={!circle}
                locale={locale}
                label={t.frame}
              />
            )
          }
        </ImageStage>
      }
    />
  );
}
