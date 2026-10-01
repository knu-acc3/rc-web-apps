"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { Field, Select, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { processFile, toBlob } from "./lib/run";
import { baseName } from "./lib/source";
import type { Fill, Op } from "./lib/types";
import { BatchWorkspace } from "./ui/BatchWorkspace";
import { ColorField, NumberField, RangeField } from "./ui/controls";
import { DEFAULT_QUALITY, LOSSY, OUT_LABEL, resolveOut, type OutChoice } from "./ui/format";
import { ResizeControls, resizeSpecOf, type ResizeState } from "./ui/ResizeControls";
import { S } from "./ui/strings";
import { useBatch, type BatchItem, type Runner } from "./ui/useBatch";

const T = {
  ru: {
    upscale: "Разрешить увеличение",
    padFill: "Поля",
    blur: "Размытое фото",
    color: "Цвет",
    dpi: "DPI в файле",
    none: "не менять",
    exif: "Сохранить EXIF (только JPG)",
  },
  en: {
    upscale: "Allow enlarging",
    padFill: "Padding",
    blur: "Blurred photo",
    color: "Colour",
    dpi: "DPI in the file",
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
  const [rs, setRs] = useState<ResizeState>(() =>
    preset
      ? { mode: "px", w: preset.w, h: preset.h, locked: false, fit: preset.fit === "contain" ? "pad" : "cover", percent: 50, long: 1600, up: false }
      : { mode: "px", w: 1920, h: null, locked: true, fit: "cover", percent: 50, long: 1600, up: false },
  );
  const [out, setOut] = useState<OutChoice>("same");
  const [quality, setQuality] = useState<number | null>(null);
  const [padFill, setPadFill] = useState<"blur" | "color">(preset?.fit === "contain" ? "color" : "blur");
  const [padColor, setPadColor] = useState("#FFFFFF");
  const [dpi, setDpi] = useState<number | null>(preset?.dpi ?? null);
  const [keepExif, setKeepExif] = useState(false);

  const spec = resizeSpecOf(rs);
  const pad = spec?.mode === "box" && !!spec.width && !!spec.height && spec.fit === "pad";
  const fill: Fill = padFill === "blur" ? { kind: "blur" } : { kind: "color", color: padColor };
  const key = JSON.stringify({ spec, fill, out, quality, dpi, keepExif });

  const runner: Runner = async (p, ctx) => {
    const fmt = resolveOut(out, p.format);
    const ops: Op[] = spec ? [{ t: "resize", spec, fill }] : [];
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
      meta: { limited: r.limited, srcWidth: r.srcWidth, srcHeight: r.srcHeight },
    };
  };
  const batch = useBatch({ runner, settingsKey: key });

  const options = (sel: BatchItem | undefined) => (
    <ResizeControls
      locale={locale}
      value={rs}
      onChange={setRs}
      modes={["percent", "px", "long"]}
      source={sel?.result?.srcWidth && sel.result.srcHeight ? { w: sel.result.srcWidth, h: sel.result.srcHeight } : null}
    />
  );

  const more = (
    <>
      <Switch
        label={t.upscale}
        checked={rs.up}
        onChange={(e) => setRs((x) => ({ ...x, up: e.target.checked, percent: e.target.checked ? x.percent : Math.min(100, x.percent) }))}
      />
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
      {pad && (
        <Field label={t.padFill}>
          <Segmented
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
      <ColorField label={pad && padFill === "color" ? t.padFill : `${s.background} (JPG)`} value={padColor} onChange={setPadColor} locale={locale} />
      <NumberField label={t.dpi} value={dpi} onChange={setDpi} min={1} max={2400} placeholder={t.none} locale={locale} />
    </>
  );

  return (
    <BatchWorkspace
      self="resize"
      locale={locale}
      batch={batch}
      options={options}
      more={more}
      compare={false}
      zipName="resized-images.zip"
      stat={(_it, r) => (
        <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          {r.width} × {r.height} px <span className="text-base font-normal text-fg-3">{formatBytes(locale, r.blob.size)}</span>
        </p>
      )}
    />
  );
}
