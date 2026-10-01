"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field } from "@/ui/field";
import { FORMAT_META } from "./lib/detect";
import { processFile, toBlob } from "./lib/run";
import { baseName } from "./lib/source";
import type { OutFormat } from "./lib/types";
import { BatchWorkspace } from "./ui/BatchWorkspace";
import { ColorField, NumberField, RangeField } from "./ui/controls";
import { ChipChoice } from "@/ui/chip-choice";
import { DEFAULT_QUALITY, LOSSY, OUT_LABEL } from "./ui/format";
import { S } from "./ui/strings";
import { useBatch, type Runner } from "./ui/useBatch";

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
      const { jpegDisplaySize } = await import("./lib/jpeg");
      const bytes = new Uint8Array(await p.file.arrayBuffer());
      const size = jpegDisplaySize(bytes) ?? { width: 0, height: 0 };
      return { blob: new Blob([bytes], { type: "image/jpeg" }), name: `${name}.jpg`, width: size.width, height: size.height, meta: { lossless: true } };
    }
    const r = await processFile(
      ctx.engine,
      p,
      [],
      { format: to, quality: q, background: bg, icoSizes, best: to === "png" },
      { signal: ctx.signal, onProgress: ctx.onProgress, svgWidth: svgWidth ?? undefined },
    );
    return { blob: toBlob(r), name: `${name}.${r.ext}`, width: r.width, height: r.height, meta: { encoder: r.encoder } };
  };
  const batch = useBatch({ runner, settingsKey: key });
  const hasSvg = batch.items.some((i) => i.prepared?.format === "svg") || from === "svg";

  const options = (
    <>
      <Field label={t.to}>
        <ChipChoice layout="wrap" label={t.to} value={to} onChange={setTo} options={TARGETS.map((f) => ({ value: f, label: OUT_LABEL[f] }))} />
      </Field>
      {LOSSY.has(to) && <RangeField label={s.quality} value={q} onChange={setQuality} min={1} max={100} locale={locale} />}
      {to === "ico" && (
        <Field label={t.sizes}>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.sizes}>
            {ICO_SIZES.map((n) => {
              const on = icoSizes.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setIcoSizes((xs) => (on ? (xs.length > 1 ? xs.filter((x) => x !== n) : xs) : [...xs, n].sort((a, b) => a - b)))}
                  className="chip tabular"
                >
                  {n}
                </button>
              );
            })}
          </div>
        </Field>
      )}
    </>
  );

  const more = (
    <>
      <ColorField label={`${s.background} (JPG)`} value={bg} onChange={setBg} locale={locale} />
      {hasSvg && (
        <NumberField label={t.svgWidth} value={svgWidth} onChange={setSvgWidth} min={16} max={16384} suffix="px" placeholder={t.svgAuto} locale={locale} />
      )}
      {to === "gif" && <p className="text-sm text-fg-3">{t.gifNote}</p>}
    </>
  );

  const fromLabel = from ? FORMAT_META[from === "jfif" ? "jpg" : (from as keyof typeof FORMAT_META)]?.label : undefined;
  return (
    <BatchWorkspace
      sizeFocus
      self="convert"
      locale={locale}
      batch={batch}
      options={options}
      more={more}
      zipName={`converted-${to}.zip`}
      dropHint={fromLabel ? `${from === "jfif" ? "JFIF" : fromLabel} → ${OUT_LABEL[to]} · ${s.dropHint}` : undefined}
      extra={(it) => (it.result?.lossless ? <p className="text-[0.8125rem] text-ok">{t.copied}</p> : null)}
    />
  );
}
