"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Select, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { processFile, toBlob } from "../engine/run";
import { baseName } from "../engine/source";
import type { Op } from "../engine/types";
import { BatchWorkspace } from "../ui/BatchWorkspace";
import { ColorField, NumberField, RangeField } from "../ui/controls";
import { DEFAULT_QUALITY, OUT_LABEL, resolveOut, type OutChoice } from "../ui/format";
import { S } from "../ui/strings";
import { useBatch, type Runner } from "../ui/useBatch";

const T = {
  ru: {
    mode: "Режим",
    byQuality: "Качество",
    bySize: "Сжать до размера",
    target: "Не больше",
    kb: "КБ",
    colors: "Цвета PNG",
    lossless: "Без потерь",
    colorsN: (n: number) => `${n} цветов`,
    best: "Максимальное сжатие (MozJPEG / OxiPNG, медленнее)",
    exif: "Сохранить EXIF (только JPG)",
    maxW: "Макс. ширина",
    maxH: "Макс. высота",
    any: "любая",
    pngTarget: "Для сжатия до размера используется JPG, WebP или AVIF — PNG не имеет настройки качества.",
  },
  en: {
    mode: "Mode",
    byQuality: "Quality",
    bySize: "Target size",
    target: "At most",
    kb: "KB",
    colors: "PNG colours",
    lossless: "Lossless",
    colorsN: (n: number) => `${n} colours`,
    best: "Maximum compression (MozJPEG / OxiPNG, slower)",
    exif: "Keep EXIF (JPG only)",
    maxW: "Max width",
    maxH: "Max height",
    any: "any",
    pngTarget: "Target size uses JPG, WebP or AVIF — PNG has no quality setting.",
  },
} as const;

const PNG_COLORS = [0, 256, 128, 64, 32, 16] as const;

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
  const [maxW, setMaxW] = useState<number | null>(null);
  const [maxH, setMaxH] = useState<number | null>(null);
  const [bg, setBg] = useState("#FFFFFF");

  const sizeOut: OutChoice = mode === "size" && (out === "png" || out === "same" || out === "gif" || out === "ico") ? "jpg" : out;
  const effOut = mode === "size" ? sizeOut : out;
  const q = quality ?? (effOut === "same" ? 80 : DEFAULT_QUALITY[effOut]);

  const settings = { mode, effOut, q, kb, pngColors, best, keepExif, maxW, maxH, bg };
  const key = JSON.stringify(settings);

  const runner: Runner = async (p, ctx) => {
    const fmt = resolveOut(effOut, p.format);
    const ops: Op[] = maxW || maxH ? [{ t: "resize", spec: { mode: "box", width: maxW ?? undefined, height: maxH ?? undefined, fit: "contain" } }] : [];
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
      meta: { keptOriginal: r.keptOriginal, missedTarget: r.missedTarget, limited: r.limited, quality: r.quality, scale: r.scale, encoder: r.encoder },
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

  const options = (
    <>
      <Segmented
        wrap
        label={t.mode}
        value={mode}
        onChange={setMode}
        options={[
          { value: "quality", label: t.byQuality },
          { value: "size", label: t.bySize },
        ]}
      />
      <Field label={s.outputFormat} htmlFor={`${id}-fmt`} className="w-40">
        <Select id={`${id}-fmt`} value={mode === "size" ? sizeOut : out} onChange={(e) => setOut(e.target.value as OutChoice)} size="md">
          {formatOptions}
        </Select>
      </Field>
      {mode === "size" ? (
        <NumberField label={t.target} value={kb} onChange={setKb} min={5} max={51200} suffix={t.kb} className="w-36" />
      ) : effOut === "png" ? (
        <Field label={t.colors} htmlFor={`${id}-pc`} className="w-40">
          <Select id={`${id}-pc`} value={String(pngColors)} onChange={(e) => setPngColors(Number(e.target.value))}>
            {PNG_COLORS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? t.lossless : t.colorsN(n)}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <div className="min-w-44 flex-1">
          <RangeField label={s.quality} value={q} onChange={setQuality} min={1} max={100} locale={locale} />
        </div>
      )}
    </>
  );

  const more = (
    <>
      <Switch label={t.best} checked={best} onChange={(e) => setBest(e.target.checked)} />
      <Switch label={t.exif} checked={keepExif} onChange={(e) => setKeepExif(e.target.checked)} />
      <div className="grid grid-cols-2 gap-3">
        <NumberField label={t.maxW} value={maxW} onChange={setMaxW} min={16} max={30000} suffix="px" placeholder={t.any} />
        <NumberField label={t.maxH} value={maxH} onChange={setMaxH} min={16} max={30000} suffix="px" placeholder={t.any} />
      </div>
      <ColorField label={`${s.background} (JPG)`} value={bg} onChange={setBg} locale={locale} />
    </>
  );

  return <BatchWorkspace sizeFocus locale={locale} batch={batch} options={options} more={more} zipName="compressed-images.zip" />;
}
