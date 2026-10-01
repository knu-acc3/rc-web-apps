"use client";

import { Images } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Segmented } from "@/ui/segmented";
import { Caption, OptionsRow, PrimaryButton } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { RangeField, resolveRange } from "./ui/RangeField";
import { JobStatus, ResultCard, baseName, type OutputItem } from "./ui/Result";
import { UserFacingError, pagesCount } from "./ui/strings";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";

export type ImageFormat = "jpg" | "png" | "webp";

const MIME: Record<ImageFormat, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const DPIS = ["72", "150", "300"] as const;

/** Memory limits: phones and low-memory devices get a smaller budget. */
function budget() {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const small = window.matchMedia("(max-width: 767px)").matches || (typeof mem === "number" && mem <= 4);
  return small ? { pagePixels: 16_000_000, outputBytes: 64 * 1024 * 1024 } : { pagePixels: 40_000_000, outputBytes: 400 * 1024 * 1024 };
}

const T = {
  ru: {
    format: "Формат",
    dpi: "Качество",
    dpis: { "72": "72 DPI · экран", "150": "150 DPI · стандарт", "300": "300 DPI · печать" },
    pagesAll: "все",
    info: (n: number, w: number, h: number) => `${pagesCount("ru", n)} → картинки примерно ${formatNumber("ru", w)} × ${formatNumber("ru", h)} px`,
    go: (f: string) => `Сохранить как ${f}`,
    rendering: (i: number, n: number) => `Страница ${i} из ${n}`,
    tooBig: (p: number) => `Страница ${p} слишком большая для этого DPI — браузер не выделит столько памяти. Выберите меньший DPI.`,
    outOfMemory: "Картинки заняли слишком много памяти. Выберите меньше страниц или меньший DPI.",
    noWebp: "Этот браузер не умеет сохранять WebP. Выберите PNG или JPG либо откройте страницу в Chrome или Firefox.",
  },
  en: {
    format: "Format",
    dpi: "Quality",
    dpis: { "72": "72 DPI · screen", "150": "150 DPI · standard", "300": "300 DPI · print" },
    pagesAll: "all",
    info: (n: number, w: number, h: number) => `${pagesCount("en", n)} → images of about ${formatNumber("en", w)} × ${formatNumber("en", h)} px`,
    go: (f: string) => `Save as ${f}`,
    rendering: (i: number, n: number) => `Page ${i} of ${n}`,
    tooBig: (p: number) => `Page ${p} is too large for this DPI — the browser can't allocate that much memory. Choose a lower DPI.`,
    outOfMemory: "The images take too much memory. Choose fewer pages or a lower DPI.",
    noWebp: "This browser can't save WebP. Choose PNG or JPG, or open the page in Chrome or Firefox.",
  },
} as const;

export default function PdfToImagesTool({ locale, format: format0 = "jpg", choose = false }: { locale: Locale; format?: ImageFormat; choose?: boolean }) {
  const t = T[locale];
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [format, setFormat] = useState<ImageFormat>(format0);
  const [dpi, setDpi] = useState<(typeof DPIS)[number]>("150");
  const [range, setRange] = useState("");
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [firstSize, setFirstSize] = useState<{ file: string; w: number; h: number } | null>(null);
  const file = pdf.ready[0] ?? null;
  const count = file?.pages ?? 0;
  const pages = resolveRange(range, Math.max(1, count));

  // Size of the first page, for the pixel estimate.
  useEffect(() => {
    const doc = file?.doc;
    if (!doc || !file) return;
    let live = true;
    void doc.getPage(1).then((p) => {
      const vp = p.getViewport({ scale: 1 });
      if (live) setFirstSize({ file: file.id, w: vp.width, h: vp.height });
    });
    return () => {
      live = false;
    };
  }, [file]);

  // Object URLs of previews are revoked when replaced and on unmount.
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const scale = Number(dpi) / 72;
  const size = firstSize && file && firstSize.file === file.id ? { w: Math.round(firstSize.w * scale), h: Math.round(firstSize.h * scale) } : null;

  async function convert() {
    if (!file?.doc || !pages.ok) return;
    setResult(null);
    setPreviews([]);
    const doc = file.doc;
    const list = pages.pages;
    const mime = MIME[format];
    const base = baseName(file.name);
    const pad = String(count).length;
    const out = await job.start(async (ctx) => {
      const m = await import("./lib/pdfjs");
      const limits = budget();
      const items: OutputItem[] = [];
      let total = 0;
      for (let k = 0; k < list.length; k++) {
        if (ctx.signal.aborted) throw Object.assign(new Error("cancelled"), { code: "cancelled" });
        const n = list[k];
        ctx.progress(k / list.length, t.rendering(k + 1, list.length));
        const page = await doc.getPage(n);
        let canvas: HTMLCanvasElement | null = null;
        try {
          const vp = page.getViewport({ scale });
          if (vp.width * vp.height > limits.pagePixels || vp.width > 16384 || vp.height > 16384) throw new UserFacingError(t.tooBig(n));
          canvas = await m.renderPage(page, scale);
          const blob = await m.canvasToBlob(canvas, mime, format === "png" ? undefined : 0.92);
          if (blob.type !== mime) throw new UserFacingError(t.noWebp);
          total += blob.size;
          if (total > limits.outputBytes) throw new UserFacingError(t.outOfMemory);
          items.push({ name: `${base}-page-${String(n).padStart(pad, "0")}.${format}`, blob });
        } finally {
          m.releaseCanvas(canvas);
          page.cleanup();
        }
      }
      ctx.progress(1);
      return items;
    });
    if (out) {
      setResult(out);
      setPreviews(out.slice(0, 24).map((it) => URL.createObjectURL(it.blob)));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && (
        <>
          <OptionsRow className="items-start!">
            {choose && (
              <div>
                <Caption>{t.format}</Caption>
                <Segmented
                  label={t.format}
                  value={format}
                  onChange={(v) => {
                    setFormat(v);
                    setResult(null);
                  }}
                  options={[
                    { value: "jpg", label: "JPG" },
                    { value: "png", label: "PNG" },
                    { value: "webp", label: "WebP" },
                  ]}
                />
              </div>
            )}
            <div>
              <Caption>{t.dpi}</Caption>
              <Segmented
                label={t.dpi}
                value={dpi}
                onChange={(v) => {
                  setDpi(v);
                  setResult(null);
                }}
                options={DPIS.map((d) => ({ value: d, label: t.dpis[d] }))}
              />
            </div>
            <RangeField locale={locale} value={range} onChange={setRange} result={pages} pageCount={count} placeholder={`${t.pagesAll} (1-${count})`} size="sm" className="w-full sm:w-64" />
          </OptionsRow>
          {pages.ok && size && <p className="tabular text-lg font-semibold text-fg">{t.info(pages.pages.length, size.w, size.h)}</p>}
          <PrimaryButton disabled={!pages.ok || job.running} onClick={convert}>
            <Images aria-hidden />
            {t.go(format.toUpperCase())}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              zipName={`${baseName(file.name)}-${format}.zip`}
              onReset={() => {
                setResult(null);
                setPreviews([]);
                pdf.clear();
                job.reset();
              }}
            >
              {previews.length > 1 && (
                <ul className="grid grid-cols-4 gap-2 border-t border-line p-3 sm:grid-cols-6 lg:grid-cols-8">
                  {previews.map((u, i) => (
                    <li key={u} className="flex aspect-square items-center justify-center overflow-hidden rounded-[0.375rem] bg-surface-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                      <img src={u} alt={result[i]?.name ?? ""} className="max-h-full max-w-full object-contain" />
                    </li>
                  ))}
                </ul>
              )}
            </ResultCard>
          )}
        </>
      )}
    </div>
  );
}
