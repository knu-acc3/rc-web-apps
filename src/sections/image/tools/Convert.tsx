"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Field } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { FORMAT_META } from "../engine/detect";
import { processFile, toBlob } from "../engine/run";
import { baseName } from "../engine/source";
import type { OutFormat } from "../engine/types";
import { BatchWorkspace } from "../ui/BatchWorkspace";
import { ColorField, NumberField, RangeField } from "../ui/controls";
import { DEFAULT_QUALITY, LOSSY, OUT_LABEL } from "../ui/format";
import { S } from "../ui/strings";
import { useBatch, type Runner } from "../ui/useBatch";

const T = {
  ru: {
    to: "Конвертировать в",
    sizes: "Размеры в ICO",
    svgWidth: "Ширина для SVG",
    svgAuto: "как в файле",
    copied: "JPEG скопирован без перекодирования — качество и EXIF не изменились",
    gifNote: "GIF: до 256 цветов, прозрачность — вкл/выкл без полупрозрачности",
  },
  en: {
    to: "Convert to",
    sizes: "ICO sizes",
    svgWidth: "Width for SVG",
    svgAuto: "as in file",
    copied: "JPEG copied without re-encoding — quality and EXIF unchanged",
    gifNote: "GIF: up to 256 colours, on/off transparency only",
  },
} as const;

const TARGETS: OutFormat[] = ["jpg", "png", "webp", "avif", "gif", "ico"];
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

export interface ConvertProps {
  locale: Locale;
  from?: string;
  to?: OutFormat;
}

export default function Convert({ locale, from, to: to0 = "jpg" }: ConvertProps) {
  const t = T[locale];
  const s = S(locale);
  const [to, setTo] = useState<OutFormat>(to0);
  const [quality, setQuality] = useState<number | null>(null);
  const [bg, setBg] = useState("#FFFFFF");
  const [icoSizes, setIcoSizes] = useState<number[]>([16, 32, 48]);
  const [svgWidth, setSvgWidth] = useState<number | null>(null);
  const q = quality ?? DEFAULT_QUALITY[to];
  const key = JSON.stringify({ to, q, bg, icoSizes, svgWidth });

  const runner: Runner = async (p, ctx) => {
    const name = baseName(p.file.name);
    if (p.format === "jpg" && to === "jpg") {
      // .jfif / .jpeg / .jpe are already JPEG: copy byte for byte
      const { jpegDisplaySize } = await import("../engine/jpeg");
      const bytes = new Uint8Array(await p.file.arrayBuffer());
      const size = jpegDisplaySize(bytes) ?? { width: 0, height: 0 };
      return { blob: new Blob([bytes], { type: "image/jpeg" }), name: `${name}.jpg`, width: size.width, height: size.height, meta: { lossless: true } };
    }
    const r = await processFile(ctx.engine, p, [], { format: to, quality: q, background: bg, icoSizes, best: to === "png" }, { signal: ctx.signal, onProgress: ctx.onProgress, svgWidth: svgWidth ?? undefined });
    return { blob: toBlob(r), name: `${name}.${r.ext}`, width: r.width, height: r.height, meta: { encoder: r.encoder } };
  };
  const batch = useBatch({ runner, settingsKey: key });
  const hasSvg = batch.items.some((i) => i.prepared?.format === "svg") || from === "svg";

  const options = (
    <>
      <Field label={t.to}>
        <Segmented label={t.to} value={to} onChange={setTo} options={TARGETS.map((f) => ({ value: f, label: OUT_LABEL[f] }))} />
      </Field>
      {LOSSY.has(to) && (
        <div className="min-w-44 flex-1">
          <RangeField label={s.quality} value={q} onChange={setQuality} min={1} max={100} locale={locale} />
        </div>
      )}
      {to === "ico" && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-fg-2">{t.sizes}</legend>
          <div className="flex flex-wrap gap-1.5">
            {ICO_SIZES.map((n) => {
              const on = icoSizes.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setIcoSizes((xs) => (on ? (xs.length > 1 ? xs.filter((x) => x !== n) : xs) : [...xs, n].sort((a, b) => a - b)))}
                  className={cn("h-8 rounded-[7px] border px-2.5 text-[13px] font-medium", on ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-2 hover:text-fg")}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </>
  );

  const more = (
    <>
      <ColorField label={`${s.background} (JPG)`} value={bg} onChange={setBg} locale={locale} />
      {hasSvg && <NumberField label={t.svgWidth} value={svgWidth} onChange={setSvgWidth} min={16} max={16384} suffix="px" placeholder={t.svgAuto} />}
      {to === "gif" && <p className="text-sm text-fg-3 sm:col-span-2">{t.gifNote}</p>}
    </>
  );

  const fromLabel = from ? FORMAT_META[from === "jfif" ? "jpg" : (from as keyof typeof FORMAT_META)]?.label : undefined;
  return (
    <BatchWorkspace
      locale={locale}
      batch={batch}
      options={options}
      more={more}
      zipName={`converted-${to}.zip`}
      dropHint={fromLabel ? `${from === "jfif" ? "JFIF" : fromLabel} → ${OUT_LABEL[to]} · ${s.dropHint}` : undefined}
      extra={(it) => (it.result?.lossless ? <p className="text-[13px] text-ok">{t.copied}</p> : null)}
    />
  );
}
