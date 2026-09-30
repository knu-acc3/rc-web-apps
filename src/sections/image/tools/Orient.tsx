"use client";

import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { jpegDisplaySize, readExifOrientation, transformJpegLossless } from "../engine/jpeg";
import { processFile, toBlob } from "../engine/run";
import { baseName } from "../engine/source";
import type { Fill, Op } from "../engine/types";
import { BatchWorkspace } from "../ui/BatchWorkspace";
import { ColorField, RangeField } from "../ui/controls";
import { sameFormat } from "../ui/format";
import { LiveStage } from "../ui/LiveStage";
import { useBatch, type Runner } from "../ui/useBatch";

const T = {
  ru: {
    left: "Повернуть на 90° влево",
    right: "Повернуть на 90° вправо",
    r180: "180°",
    angle: "Точный угол",
    corners: "Углы после поворота",
    crop: "Обрезать пустые углы",
    expand: "Расширить холст",
    fill: "Фон углов",
    transparent: "Прозрачный",
    color: "Цвет",
    jpg: "JPG",
    lossless: "Без потерь (EXIF)",
    pixels: "Повернуть пиксели",
    losslessHint:
      "Пиксели не перекодируются, меняется только ориентация. Некоторые старые программы и сайты игнорируют флаг — для них выберите «Повернуть пиксели».",
    losslessNote: (o: number) => `Без потерь: изменён только флаг ориентации EXIF (теперь ${o}), данные изображения не перекодированы`,
    flipMode: "Отражение",
    h: "По горизонтали",
    v: "По вертикали",
    both: "Оба",
    flipH: "Зеркально по горизонтали",
  },
  en: {
    left: "Rotate 90° left",
    right: "Rotate 90° right",
    r180: "180°",
    angle: "Exact angle",
    corners: "Corners after rotation",
    crop: "Crop empty corners",
    expand: "Expand canvas",
    fill: "Corner background",
    transparent: "Transparent",
    color: "Colour",
    jpg: "JPG",
    lossless: "Lossless (EXIF)",
    pixels: "Rotate pixels",
    losslessHint: "Pixels aren't re-encoded; only the orientation flag changes. Some old programs and websites ignore it — for them choose “Rotate pixels”.",
    losslessNote: (o: number) => `Lossless: only the EXIF orientation flag changed (now ${o}); image data wasn't re-encoded`,
    flipMode: "Flip",
    h: "Horizontal",
    v: "Vertical",
    both: "Both",
    flipH: "Mirror horizontally",
  },
} as const;

export interface OrientProps {
  locale: Locale;
  mode?: "rotate" | "flip";
}

export default function Orient({ locale, mode = "rotate" }: OrientProps) {
  const t = T[locale];
  const [quarter, setQuarter] = useState(mode === "rotate" ? 1 : 0);
  const [angle, setAngle] = useState(0);
  const [corners, setCorners] = useState<"crop" | "expand">("crop");
  const [fillKind, setFillKind] = useState<"transparent" | "color">("color");
  const [fillColor, setFillColor] = useState("#FFFFFF");
  const [flip, setFlip] = useState<"h" | "v" | "both">("h");
  const [lossless, setLossless] = useState(true);

  // flip V = flip H + rotate 180
  const flipH = mode === "flip" ? flip === "h" || flip === "v" : false;
  const flipRot = mode === "flip" ? (flip === "v" ? 2 : flip === "both" ? 2 : 0) : 0;
  const k = (((mode === "rotate" ? quarter : flipRot) % 4) + 4) % 4;
  const fill: Fill = fillKind === "transparent" ? { kind: "transparent" } : { kind: "color", color: fillColor };
  const ops: Op[] = [{ t: "orient", flip: flipH, rot: k }];
  if (mode === "rotate" && angle !== 0) ops.push({ t: "rotate", deg: angle, mode: corners, fill });
  const key = JSON.stringify({ ops, lossless });

  const runner: Runner = async (p, ctx) => {
    const name = baseName(p.file.name);
    const canLossless = lossless && p.format === "jpg" && (mode === "flip" || angle === 0);
    if (canLossless) {
      const bytes = new Uint8Array(await p.file.arrayBuffer());
      const out = transformJpegLossless(bytes, flipH, k);
      const size = jpegDisplaySize(out) ?? { width: 0, height: 0 };
      return {
        blob: new Blob([out as BlobPart], { type: "image/jpeg" }),
        name: `${name}-${mode === "flip" ? "flipped" : "rotated"}.jpg`,
        width: size.width,
        height: size.height,
        meta: { lossless: true, quality: readExifOrientation(out) },
      };
    }
    let fmt = sameFormat(p.format);
    if (mode === "rotate" && angle !== 0 && corners === "expand" && fillKind === "transparent" && fmt === "jpg") fmt = "png";
    const r = await processFile(
      ctx.engine,
      p,
      ops,
      { format: fmt, quality: 92, background: fillColor, best: false },
      { signal: ctx.signal, onProgress: ctx.onProgress },
    );
    return { blob: toBlob(r), name: `${name}-${mode === "flip" ? "flipped" : "rotated"}.${r.ext}`, width: r.width, height: r.height };
  };
  const batch = useBatch({ runner, settingsKey: key, delay: 500 });
  const hasJpeg = batch.items.some((i) => i.prepared?.format === "jpg");

  const options =
    mode === "rotate" ? (
      <>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" aria-label={t.left} title={t.left} onClick={() => setQuarter((x) => x - 1)}>
            <RotateCcw aria-hidden />
          </Button>
          <Button variant="outline" size="icon" aria-label={t.right} title={t.right} onClick={() => setQuarter((x) => x + 1)}>
            <RotateCw aria-hidden />
          </Button>
          <Button variant="outline" onClick={() => setQuarter((x) => x + 2)}>
            {t.r180}
          </Button>
        </div>
        <div className="min-w-52 flex-1">
          <RangeField
            label={t.angle}
            value={angle}
            onChange={setAngle}
            min={-45}
            max={45}
            step={0.1}
            locale={locale}
            format={(v) =>
              `${v > 0 ? "+" : v < 0 ? "−" : ""}${formatNumber(locale, Math.abs(v), { maximumFractionDigits: 1 })}° · ${formatNumber(locale, (((k * 90 + angle) % 360) + 360) % 360, { maximumFractionDigits: 1 })}°`
            }
          />
        </div>
      </>
    ) : (
      <Field label={t.flipMode}>
        <Segmented
          wrap
          label={t.flipMode}
          value={flip}
          onChange={setFlip}
          options={[
            {
              value: "h",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <FlipHorizontal2 className="size-4" aria-hidden />
                  {t.h}
                </span>
              ),
            },
            {
              value: "v",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <FlipVertical2 className="size-4" aria-hidden />
                  {t.v}
                </span>
              ),
            },
            { value: "both", label: t.both },
          ]}
        />
      </Field>
    );

  const more = (
    <>
      <Field label={t.jpg} hint={t.losslessHint}>
        <Segmented
          wrap
          label={t.jpg}
          value={lossless ? "lossless" : "pixels"}
          onChange={(v) => setLossless(v === "lossless")}
          options={[
            { value: "lossless", label: t.lossless },
            { value: "pixels", label: t.pixels },
          ]}
        />
      </Field>
      {mode === "rotate" && (
        <>
          <Field label={t.corners}>
            <Segmented
              wrap
              label={t.corners}
              value={corners}
              onChange={setCorners}
              options={[
                { value: "crop", label: t.crop },
                { value: "expand", label: t.expand },
              ]}
            />
          </Field>
          {corners === "expand" && (
            <Field label={t.fill}>
              <Segmented
                wrap
                label={t.fill}
                value={fillKind}
                onChange={setFillKind}
                options={[
                  { value: "color", label: t.color },
                  { value: "transparent", label: t.transparent },
                ]}
              />
            </Field>
          )}
          {corners === "expand" && fillKind === "color" && <ColorField label={t.fill} value={fillColor} onChange={setFillColor} locale={locale} />}
        </>
      )}
    </>
  );

  return (
    <BatchWorkspace
      locale={locale}
      batch={batch}
      options={options}
      more={hasJpeg || mode === "rotate" ? more : undefined}
      zipName={mode === "flip" ? "flipped-images.zip" : "rotated-images.zip"}
      stage={(it) => <LiveStage locale={locale} prepared={it.prepared} ops={ops} />}
      extra={(it) => (it.result?.lossless ? <p className="text-[0.8125rem] text-ok">{t.losslessNote(it.result.quality ?? 1)}</p> : null)}
    />
  );
}
