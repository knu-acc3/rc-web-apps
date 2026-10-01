"use client";

import { Link2, Link2Off } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field, Select, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import type { FitMode, ResizeSpec } from "./lib/geometry";
import { processFile, toBlob } from "./lib/run";
import { baseName } from "./lib/source";
import type { Fill, Op } from "./lib/types";
import { BatchWorkspace } from "./ui/BatchWorkspace";
import { ColorField, NumberField, RangeField } from "./ui/controls";
import { DEFAULT_QUALITY, LOSSY, OUT_LABEL, resolveOut, type OutChoice } from "./ui/format";
import { S } from "./ui/strings";
import { useBatch, type Runner } from "./ui/useBatch";

const T = {
  ru: {
    mode: "Как задать размер",
    px: "Пиксели",
    percent: "Проценты",
    long: "Длинная сторона",
    lock: "Сохранять пропорции",
    unlock: "Задать обе стороны",
    auto: "авто",
    fit: "Заполнение",
    fits: { contain: "Вписать без обрезки", cover: "Заполнить и обрезать по центру", pad: "Вписать с полями", stretch: "Растянуть" } as Record<FitMode, string>,
    scale: "Масштаб",
    longSide: "Длинная сторона",
    upscale: "Разрешить увеличение",
    padFill: "Поля",
    blur: "Размытое фото",
    color: "Цвет",
    dpi: "DPI в файле",
    dpiHint: "Только метаданные для печати, пиксели не меняются",
    none: "не менять",
    exif: "Сохранить EXIF (только JPG)",
  },
  en: {
    mode: "Resize by",
    px: "Pixels",
    percent: "Percent",
    long: "Long side",
    lock: "Keep aspect ratio",
    unlock: "Set both sides",
    auto: "auto",
    fit: "Fit",
    fits: { contain: "Fit inside", cover: "Fill and crop centre", pad: "Fit with padding", stretch: "Stretch" } as Record<FitMode, string>,
    scale: "Scale",
    longSide: "Long side",
    upscale: "Allow enlarging",
    padFill: "Padding",
    blur: "Blurred photo",
    color: "Colour",
    dpi: "DPI in the file",
    dpiHint: "Print metadata only; pixels don't change",
    none: "keep",
    exif: "Keep EXIF (JPG only)",
  },
} as const;

export interface ResizeProps {
  locale: Locale;
  preset?: { w: number; h: number; fit: "cover" | "contain"; dpi?: number };
}

export default function Resize({ locale, preset }: ResizeProps) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const [mode, setMode] = useState<"px" | "percent" | "long">("px");
  const [w, setW] = useState<number | null>(preset?.w ?? 1920);
  const [h, setH] = useState<number | null>(preset?.h ?? null);
  const [locked, setLocked] = useState(!preset);
  const [fit, setFit] = useState<FitMode>(preset ? (preset.fit === "contain" ? "pad" : "cover") : "cover");
  const [percent, setPercent] = useState(50);
  const [long, setLong] = useState<number | null>(1600);
  const [up, setUp] = useState(false);
  const [out, setOut] = useState<OutChoice>("same");
  const [quality, setQuality] = useState<number | null>(null);
  const [padFill, setPadFill] = useState<"blur" | "color">(preset?.fit === "contain" ? "color" : "blur");
  const [padColor, setPadColor] = useState("#FFFFFF");
  const [dpi, setDpi] = useState<number | null>(preset?.dpi ?? null);
  const [keepExif, setKeepExif] = useState(false);

  const both = mode === "px" && !locked && !!w && !!h;
  const spec: ResizeSpec =
    mode === "percent"
      ? { mode: "percent", percent, allowUpscale: up }
      : mode === "long"
        ? { mode: "long", long: long ?? undefined, allowUpscale: up }
        : { mode: "box", width: w ?? undefined, height: locked && w ? undefined : (h ?? undefined), fit: both ? fit : "contain", allowUpscale: up };
  const fill: Fill = padFill === "blur" ? { kind: "blur" } : { kind: "color", color: padColor };
  const key = JSON.stringify({ spec, fill, out, quality, dpi, keepExif });

  const runner: Runner = async (p, ctx) => {
    const fmt = resolveOut(out, p.format);
    const ops: Op[] = [{ t: "resize", spec, fill }];
    const r = await processFile(
      ctx.engine,
      p,
      ops,
      { format: fmt, quality: quality ?? DEFAULT_QUALITY[fmt], background: padColor, dpi: dpi ?? undefined, keepExif },
      { signal: ctx.signal, onProgress: ctx.onProgress },
    );
    return {
      blob: toBlob(r),
      name: `${baseName(p.file.name)}-${r.width}x${r.height}.${r.ext}`,
      width: r.width,
      height: r.height,
      meta: { limited: r.limited },
    };
  };
  const batch = useBatch({ runner, settingsKey: key });

  const options = (
    <>
      <Segmented
        wrap
        label={t.mode}
        value={mode}
        onChange={setMode}
        options={[
          { value: "px", label: t.px },
          { value: "percent", label: t.percent },
          { value: "long", label: t.long },
        ]}
      />
      {mode === "px" && (
        <div className="flex items-end gap-2">
          <NumberField
            label={s.width}
            value={w}
            onChange={(v) => {
              setW(v);
              if (locked && v) setH(null);
            }}
            suffix="px"
            className="w-28"
            placeholder={t.auto}
            max={30000}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={locked}
            aria-label={locked ? t.lock : t.unlock}
            title={locked ? t.lock : t.unlock}
            onClick={() => setLocked((x) => !x)}
            className="mb-0"
          >
            {locked ? <Link2 aria-hidden /> : <Link2Off aria-hidden />}
          </Button>
          <NumberField
            label={s.height}
            value={h}
            onChange={(v) => {
              setH(v);
              if (locked && v) setW(null);
            }}
            suffix="px"
            className="w-28"
            placeholder={t.auto}
            max={30000}
          />
        </div>
      )}
      {both && (
        <Field label={t.fit} htmlFor={`${id}-fit`} className="w-60">
          <Select id={`${id}-fit`} value={fit} onChange={(e) => setFit(e.target.value as FitMode)}>
            {(["cover", "contain", "pad", "stretch"] as const).map((f) => (
              <option key={f} value={f}>
                {t.fits[f]}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {mode === "percent" && (
        <div className="min-w-48 flex-1">
          <RangeField label={t.scale} value={percent} onChange={setPercent} min={1} max={up ? 400 : 100} unit="%" locale={locale} />
        </div>
      )}
      {mode === "long" && <NumberField label={t.longSide} value={long} onChange={setLong} suffix="px" className="w-36" max={30000} />}
    </>
  );

  const more = (
    <>
      <Switch label={t.upscale} checked={up} onChange={(e) => setUp(e.target.checked)} />
      <Switch label={t.exif} checked={keepExif} onChange={(e) => setKeepExif(e.target.checked)} />
      <Field label={s.outputFormat} htmlFor={`${id}-out`}>
        <Select id={`${id}-out`} value={out} onChange={(e) => setOut(e.target.value as OutChoice)}>
          {(["same", "jpg", "png", "webp", "avif"] as const).map((f) => (
            <option key={f} value={f}>
              {f === "same" ? s.sameFormat : OUT_LABEL[f]}
            </option>
          ))}
        </Select>
      </Field>
      {(out === "same" || LOSSY.has(out)) && (
        <RangeField label={s.quality} value={quality ?? (out === "same" ? 88 : DEFAULT_QUALITY[out])} onChange={setQuality} min={1} max={100} locale={locale} />
      )}
      {both && fit === "pad" && (
        <Field label={t.padFill}>
          <Segmented
            wrap
            label={t.padFill}
            value={padFill}
            onChange={setPadFill}
            options={[
              { value: "blur", label: t.blur },
              { value: "color", label: t.color },
            ]}
          />
        </Field>
      )}
      <ColorField
        label={both && fit === "pad" && padFill === "color" ? t.padFill : `${s.background} (JPG)`}
        value={padColor}
        onChange={setPadColor}
        locale={locale}
      />
      <NumberField label={t.dpi} value={dpi} onChange={setDpi} min={1} max={2400} placeholder={t.none} />
    </>
  );

  return (
    <BatchWorkspace
      locale={locale}
      batch={batch}
      options={options}
      more={more}
      compare={false}
      zipName="resized-images.zip"
      stat={(_it, r) => (
        <p className="tabular text-2xl font-semibold tracking-tight text-fg">
          {r.width} × {r.height} px <span className="text-base font-normal text-fg-3">{formatBytes(locale, r.blob.size)}</span>
        </p>
      )}
    />
  );
}
