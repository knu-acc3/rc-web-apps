"use client";

import { Minimize2 } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { IMAGE_LEVELS, RASTER_LEVELS, type CompressLevel, type CompressMode } from "./lib/presets";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";


const T = {
  ru: {
    mode: "Способ сжатия",
    modes: { lossless: "Без потерь", images: "Сжать картинки", raster: "Страницы в картинки" },
    level: "Степень",
    levels: { light: "Слабая", medium: "Средняя", strong: "Сильная" },
    explain: {
      lossless: "Ничего видимого не меняется: удаляются неиспользуемые и повторяющиеся объекты, служебные данные редакторов, несжатые потоки сжимаются.",
      images: (q: number, px: number) => `Картинки внутри PDF пересохраняются в JPEG с качеством ${q}% и уменьшаются до ${px} px по длинной стороне. Текст и векторная графика не трогаются.`,
      raster: (dpi: number) => `Каждая страница станет картинкой ${dpi} DPI. Текст перестанет выделяться и искаться — режим для сканов и крайних случаев.`,
    },
    go: "Сжать PDF",
    rendering: (i: number, n: number) => `Страница ${i} из ${n}`,
    notSmaller: (size: string) => `Сжатие не уменьшило файл (${size}) — он уже оптимизирован. Исходный файл остался без изменений, скачивать нечего. Попробуйте другой способ сжатия.`,
    rasterNote: "Текст в этом файле больше нельзя выделить и найти поиском.",
  },
  en: {
    mode: "Method",
    modes: { lossless: "Lossless", images: "Compress images", raster: "Pages to images" },
    level: "Strength",
    levels: { light: "Light", medium: "Medium", strong: "Strong" },
    explain: {
      lossless: "Nothing visible changes: unused and duplicate objects and editor data are removed, uncompressed streams get compressed.",
      images: (q: number, px: number) => `Images inside the PDF are re-saved as JPEG at ${q}% quality and scaled down to ${px} px on the long side. Text and vector graphics are left alone.`,
      raster: (dpi: number) => `Every page becomes a ${dpi} DPI image. Text can no longer be selected or searched — for scans and last-resort cases.`,
    },
    go: "Compress PDF",
    rendering: (i: number, n: number) => `Page ${i} of ${n}`,
    notSmaller: (size: string) => `Compression didn't make the file smaller (${size}) — it is already optimized. Your original is unchanged and there is nothing to download. Try another method.`,
    rasterNote: "Text in this file can no longer be selected or searched.",
  },
} as const;

export default function CompressTool({ locale, mode: mode0 = "images", level: level0 = "medium" }: { locale: Locale; mode?: CompressMode; level?: CompressLevel }) {
  const t = T[locale];
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [mode, setMode] = useState<CompressMode>(mode0);
  const [level, setLevel] = useState<CompressLevel>(level0);
  const [result, setResult] = useState<{ items: OutputItem[]; size: number; mode: CompressMode } | { notSmaller: number } | null>(null);
  const file = pdf.ready[0] ?? null;

  const explain =
    mode === "lossless"
      ? t.explain.lossless
      : mode === "images"
        ? t.explain.images(Math.round(IMAGE_LEVELS[level].quality * 100), IMAGE_LEVELS[level].maxSide)
        : t.explain.raster(RASTER_LEVELS[level].dpi);

  async function compress() {
    if (!file) return;
    setResult(null);
    const usedMode = mode;
    const out = await job.start(async (ctx) => {
      if (usedMode !== "raster") {
        const lv = IMAGE_LEVELS[level];
        return workerJob({ type: "compress", source: { bytes: file.bytes!.slice(0), password: file.password }, mode: usedMode, quality: lv.quality, maxSide: lv.maxSide }, ctx);
      }
      // Render pages on the main thread (pdf.js needs a canvas), assemble in the worker.
      const m = await import("./lib/pdfjs");
      const doc = file.doc!;
      const { dpi, quality } = RASTER_LEVELS[level];
      const pages: { jpeg: ArrayBuffer; width: number; height: number }[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        if (ctx.signal.aborted) throw Object.assign(new Error("cancelled"), { code: "cancelled" });
        ctx.progress((i - 1) / doc.numPages * 0.85, t.rendering(i, doc.numPages));
        const page = await doc.getPage(i);
        let canvas: HTMLCanvasElement | null = null;
        try {
          const vp = page.getViewport({ scale: 1 });
          canvas = await m.renderPage(page, dpi / 72);
          const blob = await m.canvasToBlob(canvas, "image/jpeg", quality);
          pages.push({ jpeg: await blob.arrayBuffer(), width: vp.width, height: vp.height });
        } finally {
          m.releaseCanvas(canvas);
          page.cleanup();
        }
      }
      return workerJob({ type: "raster", pages }, { ...ctx, progress: (p) => ctx.progress(0.85 + p * 0.15) });
    });
    if (!out) return;
    const bytes = out.files[0].bytes;
    if (bytes.length >= file.size) setResult({ notSmaller: bytes.length });
    else setResult({ items: [{ name: `${baseName(file.name)}-compressed.pdf`, blob: pdfBlob(bytes) }], size: file.size, mode: usedMode });
  }

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && (
        <>
          <OptionsRow>
            <Segmented
              label={t.mode}
              value={mode}
              onChange={(v) => {
                setMode(v);
                setResult(null);
              }}
              options={(["lossless", "images", "raster"] as const).map((m) => ({ value: m, label: t.modes[m] }))}
            />
            {mode !== "lossless" && (
              <Segmented
                label={t.level}
                value={level}
                onChange={(v) => {
                  setLevel(v);
                  setResult(null);
                }}
                options={(["light", "medium", "strong"] as const).map((l) => ({ value: l, label: t.levels[l] }))}
              />
            )}
          </OptionsRow>
          <p className="max-w-3xl text-sm text-fg-2">{explain}</p>
          <PrimaryButton disabled={job.running} onClick={compress}>
            <Minimize2 aria-hidden />
            {t.go}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && "notSmaller" in result && (
            <Notice tone="warn" role="status">
              {t.notSmaller(formatBytes(locale, result.notSmaller))}
            </Notice>
          )}
          {result && "items" in result && (
            <ResultCard
              locale={locale}
              items={result.items}
              originalSize={result.size}
              emphasizeSize
              notice={result.mode === "raster" ? t.rasterNote : undefined}
              onReset={() => {
                setResult(null);
                pdf.clear();
                job.reset();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
