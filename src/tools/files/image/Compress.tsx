"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Select, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { processFile, toBlob } from "./lib/run";
import { baseName } from "./lib/source";
import type { Op } from "./lib/types";
import { BatchWorkspace } from "./ui/BatchWorkspace";
import { ColorField, NumberField, RangeField } from "./ui/controls";
import { DEFAULT_QUALITY, OUT_LABEL, resolveOut, type OutChoice } from "./ui/format";
import { RESIZE_DEFAULT, ResizeControls, resizeSpecOf, type ResizeState } from "./ui/ResizeControls";
import { S } from "./ui/strings";
import { useBatch, type BatchItem, type Runner } from "./ui/useBatch";

const T = {
  ru: {
    mode: "Режим",
    byQuality: "Качество",
    bySize: "Сжать до размера",
    target: "Не больше",
    kb: "КБ",
    mb: "МБ",
    colors: "Цвета PNG",
    lossless: "Без потерь",
    colorsN: (n: number) => `${n} цветов`,
    best: "Максимальное сжатие (MozJPEG / OxiPNG, медленнее)",
    exif: "Сохранить EXIF (только JPG)",
    size: "Размер фото",
  },
  en: {
    mode: "Mode",
    byQuality: "Quality",
    bySize: "Target size",
    target: "At most",
    kb: "KB",
    mb: "MB",
    colors: "PNG colours",
    lossless: "Lossless",
    colorsN: (n: number) => `${n} colours`,
    best: "Maximum compression (MozJPEG / OxiPNG, slower)",
    exif: "Keep EXIF (JPG only)",
    size: "Picture size",
  },
} as const;

const PNG_COLORS = [0, 256, 128, 64, 32, 16] as const;
const KB_CHIPS = [50, 100, 200, 500, 1024] as const;

export interface CompressProps {
  locale: Locale;
  format?: "jpg" | "png" | "webp" | "avif";
  targetKb?: number;
}

export default function Compress({ locale, format, targetKb }: CompressProps) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const [mode, setMode] = useState<"quality" | "size">(targetKb ? "size" : "quality");
  const [out, setOut] = useState<OutChoice>(format ?? (targetKb ? "jpg" : "same"));
  const [quality, setQuality] = useState<number | null>(null);
  const [kb, setKb] = useState<number | null>(targetKb ?? 200);
  const [pngColors, setPngColors] = useState<number>(format === "png" ? 256 : 0);
  const [best, setBest] = useState(true);
  const [keepExif, setKeepExif] = useState(false);
  const [size, setSize] = useState<ResizeState>(RESIZE_DEFAULT);
  const [bg, setBg] = useState("#FFFFFF");

  const sizeOut: OutChoice = mode === "size" && (out === "png" || out === "same" || out === "gif" || out === "ico") ? "jpg" : out;
  const effOut = mode === "size" ? sizeOut : out;
  const q = quality ?? (effOut === "same" ? 80 : DEFAULT_QUALITY[effOut]);

  const spec = resizeSpecOf(size);
  const settings = { mode, effOut, q, kb, pngColors, best, keepExif, spec, bg };
  const key = JSON.stringify(settings);

  const runner: Runner = async (p, ctx) => {
    const fmt = resolveOut(effOut, p.format);
    const ops: Op[] = spec ? [{ t: "resize", spec }] : [];
    const r = await processFile(
      ctx.engine,
      p,
      ops,
      {
        format: fmt,
        quality: q,
        background: bg,
        best,
        pngColors: fmt === "png" ? pngColors : undefined,
        keepExif,
        targetBytes: mode === "size" && kb ? kb * 1024 : undefined,
        allowDownscale: true,
        keepSmaller: mode === "quality",
      },
      { signal: ctx.signal, onProgress: ctx.onProgress },
    );
    const ext = r.keptOriginal ? (p.file.name.match(/\.([^.]+)$/)?.[1] ?? r.ext) : r.ext;
    return {
      blob: toBlob(r),
      name: `${baseName(p.file.name)}-compressed.${ext}`,
      width: r.width,
      height: r.height,
      meta: {
        keptOriginal: r.keptOriginal,
        missedTarget: r.missedTarget,
        limited: r.limited,
        quality: r.quality,
        scale: r.scale,
        encoder: r.encoder,
        srcWidth: r.srcWidth,
        srcHeight: r.srcHeight,
      },
    };
  };

  const batch = useBatch({ runner, settingsKey: key });

  const formatOptions = useMemo(
    () =>
      (mode === "size" ? (["jpg", "webp", "avif"] as const) : (["same", "jpg", "png", "webp", "avif"] as const)).map((f) => (
        <option key={f} value={f}>
          {f === "same" ? s.sameFormat : OUT_LABEL[f]}
        </option>
      )),
    [mode, s.sameFormat],
  );

  const options = (sel: BatchItem | undefined) => (
    <>
      <Segmented
        fill
        label={t.mode}
        value={mode}
        onChange={setMode}
        options={[
          { value: "quality", label: t.byQuality },
          { value: "size", label: t.bySize },
        ]}
      />
      <Field label={s.outputFormat} htmlFor={`${id}-fmt`}>
        <Select id={`${id}-fmt`} value={mode === "size" ? sizeOut : out} onChange={(e) => setOut(e.target.value as OutChoice)}>
          {formatOptions}
        </Select>
      </Field>
      {mode === "size" ? (
        <div className="flex flex-col gap-2">
          <NumberField label={t.target} value={kb} onChange={setKb} min={5} max={51200} step={10} suffix={t.kb} stepper locale={locale} />
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.target}>
            {KB_CHIPS.map((n) => (
              <button key={n} type="button" className="chip tabular" aria-pressed={kb === n} onClick={() => setKb(n)}>
                {n === 1024 ? `1 ${t.mb}` : `${n} ${t.kb}`}
              </button>
            ))}
          </div>
        </div>
      ) : effOut === "png" ? (
        <Field label={t.colors} htmlFor={`${id}-pc`}>
          <Select id={`${id}-pc`} value={String(pngColors)} onChange={(e) => setPngColors(Number(e.target.value))}>
            {PNG_COLORS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? t.lossless : t.colorsN(n)}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <RangeField label={s.quality} value={q} onChange={setQuality} min={1} max={100} locale={locale} />
      )}
      <section className="flex flex-col gap-3" aria-labelledby={`${id}-size`}>
        <h3 id={`${id}-size`} className="text-[0.9375rem] font-semibold text-fg">
          {t.size}
        </h3>
        <ResizeControls
          locale={locale}
          value={size}
          onChange={setSize}
          fits={["contain", "cover", "stretch"]}
          source={sel?.result?.srcWidth && sel.result.srcHeight ? { w: sel.result.srcWidth, h: sel.result.srcHeight } : null}
        />
      </section>
    </>
  );

  const more = (
    <>
      <Switch label={t.best} checked={best} onChange={(e) => setBest(e.target.checked)} />
      <Switch label={t.exif} checked={keepExif} onChange={(e) => setKeepExif(e.target.checked)} />
      <ColorField label={`${s.background} (JPG)`} value={bg} onChange={setBg} locale={locale} />
    </>
  );

  return <BatchWorkspace sizeFocus self="compress" locale={locale} batch={batch} options={options} more={more} zipName="compressed-images.zip" />;
}
