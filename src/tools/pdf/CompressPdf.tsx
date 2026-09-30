"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowsInLineHorizontal,
  Download,
  ArrowCounterClockwise,
  FileText,
  Warning,
  X,
  ShieldCheck,
  StopCircle,
  Image as ImageIcon,
  Palette,
  TextT,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { PdfDropzone } from "@/src/components/ui/pdf-dropzone";
import { MobileSlider } from "@/src/components/tool/MobileSlider";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { cn } from "@/src/lib/cn";
import {
  readFileAsArrayBuffer,
  downloadPdfBlob,
  formatFileSize,
  loadPdfDocument,
} from "@/src/utils/pdfHelpers";
import { PDFDocument, PDFName, PDFNumber, PDFRawStream } from "pdf-lib";

type PresetKey = "low" | "medium" | "high" | "rewrite";
type ImageFormat = "jpeg" | "png";
type DpiOption = 72 | 96 | 150 | 300;

interface PresetCfg {
  quality: number; // 0-1
  dpi: DpiOption;
  estRatio: number; // expected output ratio
  qualityBadge: "low" | "mid" | "high" | "best";
}

const PRESETS: Record<PresetKey, PresetCfg> = {
  low: { quality: 0.2, dpi: 72, estRatio: 0.2, qualityBadge: "low" },
  medium: { quality: 0.5, dpi: 96, estRatio: 0.5, qualityBadge: "mid" },
  high: { quality: 0.75, dpi: 150, estRatio: 0.75, qualityBadge: "high" },
  rewrite: { quality: 1, dpi: 300, estRatio: 1, qualityBadge: "best" },
};

const DPI_OPTIONS: DpiOption[] = [72, 96, 150, 300];

/** Convert canvas pixels to grayscale in-place. */
function applyGrayscale(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
}

export default function CompressPdf() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [originalSize, setOriginalSize] = useState(0);

  // Preset + custom controls
  const [preset, setPreset] = useState<PresetKey>("medium");
  const [quality, setQuality] = useState(50);
  const [dpi, setDpi] = useState<DpiOption>(96);
  const [grayscale, setGrayscale] = useState(false);
  const [stripMetadata, setStripMetadata] = useState(false);
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [keepText, setKeepText] = useState(false);

  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [error, setError] = useState("");

  const cancelRef = useRef(false);

  /** Apply preset → custom controls. */
  const applyPreset = useCallback((p: PresetKey) => {
    setPreset(p);
    const cfg = PRESETS[p];
    setQuality(Math.round(cfg.quality * 100));
    setDpi(cfg.dpi);
    setKeepText(p === "rewrite");
    if (p !== "rewrite") setFormat("jpeg");
  }, []);

  const handleFileSelected = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      setFile(f);
      setOriginalSize(f.size);
      setResult(null);
      setCompressedSize(0);
      setError("");
      setProgress(0);
      setPageCount(0);
      try {
        const buf = await readFileAsArrayBuffer(f);
        setPdfData(buf);
      } catch {
        setError(
          isEn
            ? "Failed to read the PDF file."
            : "Не удалось прочитать PDF-файл.",
        );
      }
    },
    [isEn],
  );

  const handleCompress = useCallback(async () => {
    if (!pdfData) return;
    setProcessing(true);
    setError("");
    setResult(null);
    setCompressedSize(0);
    setProgress(0);
    cancelRef.current = false;

    try {
      const qF = Math.min(1, Math.max(0.1, quality / 100));
      const scale = dpi / 72; // baseline 72 DPI = scale 1
      const srcDoc = await PDFDocument.load(pdfData, {
        ignoreEncryption: true,
      });

      // Structure-preserving path: optimize container, clean metadata, and compress embedded raster images.
      if (keepText) {
        if (stripMetadata) {
          srcDoc.setTitle("");
          srcDoc.setAuthor("");
          srcDoc.setSubject("");
          srcDoc.setKeywords([]);
          srcDoc.setProducer("");
          srcDoc.setCreator("");
        }
        setProgress(25);

        try {
          const objects = srcDoc.context.enumerateIndirectObjects();
          const imageEntries: PDFRawStream[] = [];
          for (const [, obj] of objects) {
            if (
              obj instanceof PDFRawStream &&
              obj.dict &&
              obj.dict.get(PDFName.of("Subtype"))?.toString() === "/Image" &&
              obj.dict.get(PDFName.of("Filter"))?.toString() === "/DCTDecode"
            ) {
              imageEntries.push(obj);
            }
          }

          if (imageEntries.length > 0) {
            let processed = 0;
            for (const imgObj of imageEntries) {
              if (cancelRef.current) break;
              if (imgObj.contents && imgObj.contents.length > 10 * 1024) {
                try {
                  const blob = new Blob([new Uint8Array(imgObj.contents)], { type: "image/jpeg" });
                  const bitmap = await createImageBitmap(blob);
                  const maxDim = Math.round((dpi / 72) * 1000);
                  let w = bitmap.width;
                  let h = bitmap.height;
                  if (w > maxDim || h > maxDim) {
                    const ratio = Math.min(maxDim / w, maxDim / h);
                    w = Math.max(1, Math.round(w * ratio));
                    h = Math.max(1, Math.round(h * ratio));
                  }
                  const canvas = document.createElement("canvas");
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(bitmap, 0, 0, w, h);
                    if (grayscale) {
                      applyGrayscale(ctx, w, h);
                    }
                    const newBlob = await new Promise<Blob | null>((resolve) =>
                      canvas.toBlob(resolve, "image/jpeg", qF),
                    );
                    if (newBlob) {
                      const newBytes = new Uint8Array(await newBlob.arrayBuffer());
                      if (newBytes.length < imgObj.contents.length) {
                        (imgObj as unknown as { contents: Uint8Array }).contents = newBytes;
                        imgObj.dict.set(PDFName.of("Length"), PDFNumber.of(newBytes.length));
                      }
                    }
                  }
                } catch {
                  // Ignore image re-encoding error
                }
              }
              processed++;
              setProgress(25 + Math.round((processed / imageEntries.length) * 50));
            }
          }
        } catch {
          // Ignore general embedded image optimization error
        }

        setProgress(85);
        const compressed = await srcDoc.save({ useObjectStreams: true });
        if (cancelRef.current) {
          setProcessing(false);
          return;
        }
        setProgress(100);
        setResult(compressed);
        setCompressedSize(compressed.byteLength);
        return;
      }

      // Rasterize path
      const pdfJsDoc = await loadPdfDocument(pdfData);
      const numPages = pdfJsDoc.numPages;
      setPageCount(numPages);
      const newDoc = await PDFDocument.create();

      for (let i = 1; i <= numPages; i++) {
        if (cancelRef.current) {
          pdfJsDoc.destroy();
          setProcessing(false);
          return;
        }
        const page = await pdfJsDoc.getPage(i);
        const origViewport = page.getViewport({ scale: 1 });
        let actualScale = scale;
        const MAX_DIMENSION = 4096;
        if (origViewport.width * actualScale > MAX_DIMENSION || origViewport.height * actualScale > MAX_DIMENSION) {
          actualScale = Math.min(MAX_DIMENSION / origViewport.width, MAX_DIMENSION / origViewport.height);
        }
        const renderViewport = page.getViewport({ scale: actualScale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(renderViewport.width));
        canvas.height = Math.max(1, Math.round(renderViewport.height));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error(
            isEn
              ? "Failed to initialize 2D canvas context for page rasterization."
              : "Не удалось инициализировать графический контекст холста для сжатия этой страницы."
          );
        }
        await page.render({
          canvasContext: ctx,
          viewport: renderViewport,
          canvas,
        } as Parameters<typeof page.render>[0]).promise;

        if (grayscale) {
          applyGrayscale(ctx, canvas.width, canvas.height);
        }

        const mime = format === "jpeg" ? "image/jpeg" : "image/png";
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob(
            (b) => resolve(b!),
            mime,
            format === "jpeg" ? qF : undefined,
          ),
        );
        const imgBytes = new Uint8Array(await blob.arrayBuffer());
        const embedded =
          format === "jpeg"
            ? await newDoc.embedJpg(imgBytes)
            : await newDoc.embedPng(imgBytes);
        const newPage = newDoc.addPage([
          origViewport.width,
          origViewport.height,
        ]);
        newPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });

        setProgress(Math.round((i / numPages) * 100));
      }

      if (cancelRef.current) {
        pdfJsDoc.destroy();
        setProcessing(false);
        return;
      }

      // Metadata
      if (stripMetadata) {
        newDoc.setTitle("");
        newDoc.setAuthor("");
        newDoc.setSubject("");
        newDoc.setKeywords([]);
        newDoc.setProducer("");
        newDoc.setCreator("");
      } else {
        const title = srcDoc.getTitle();
        const author = srcDoc.getAuthor();
        const subject = srcDoc.getSubject();
        if (title) newDoc.setTitle(title);
        if (author) newDoc.setAuthor(author);
        if (subject) newDoc.setSubject(subject);
      }

      const compressed = await newDoc.save({ useObjectStreams: true });
      pdfJsDoc.destroy();
      setResult(compressed);
      setCompressedSize(compressed.byteLength);
    } catch {
      setError(isEn ? "Failed to compress the PDF." : "Не удалось сжать PDF.");
    } finally {
      setProcessing(false);
    }
  }, [pdfData, quality, dpi, grayscale, stripMetadata, format, keepText, isEn]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const handleDownload = useCallback(() => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, "");
    downloadPdfBlob(result, `${baseName}_compressed.pdf`);
  }, [result, file]);

  const handleReset = useCallback(() => {
    cancelRef.current = true;
    setFile(null);
    setPdfData(null);
    setResult(null);
    setCompressedSize(0);
    setOriginalSize(0);
    setError("");
    setPageCount(0);
    setProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const savedBytes = originalSize - compressedSize;
  const savedPercent =
    originalSize > 0 && compressedSize > 0
      ? (savedBytes / originalSize) * 100
      : 0;
  const didShrink = compressedSize > 0 && compressedSize < originalSize;

  const presetCards: {
    value: Exclude<PresetKey, "rewrite">;
    label: string;
    description: string;
  }[] = [
    {
      value: "low",
      label: isEn ? "Maximum compression" : "Максимальное сжатие",
      description: isEn ? "Smallest file" : "Минимальный файл",
    },
    {
      value: "medium",
      label: isEn ? "Balanced" : "Сбалансированное",
      description: isEn ? "Recommended" : "Рекомендуется",
    },
    {
      value: "high",
      label: isEn ? "High quality" : "Высокое качество",
      description: isEn ? "Sharper pages" : "Более чёткие страницы",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      {!file && (
        <PdfDropzone
          accept="application/pdf,.pdf"
          onFilesSelected={handleFileSelected}
          maxSizeMB={100}
          label="Перетащите файл или нажмите для загрузки"
          labelEn="Drag & drop a file or click to upload"
        />
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label={isEn ? "Dismiss" : "Закрыть"}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {file && pdfData && (
        <>
          <Card className="mt-3 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <FileText size={28} className="text-[var(--color-primary)]" />
              <div className="min-w-0 flex-1">
                <div
                  className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold"
                  title={file.name}
                >
                  {file.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(originalSize, isEn)}
                  {pageCount > 0 && (
                    <>
                      {" · "}
                      {pageCount}{" "}
                      {isEn
                        ? pageCount === 1
                          ? "page"
                          : "pages"
                        : pageCount === 1
                          ? "страница"
                          : pageCount < 5
                            ? "страницы"
                            : "страниц"}
                    </>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={handleReset}>
                <ArrowCounterClockwise size={16} />
                {isEn ? "New file" : "Новый"}
              </Button>
            </div>

            {/* Exactly three primary quality choices. */}
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              {isEn ? "Compression level" : "Уровень сжатия"}
            </div>
            <div
              role="radiogroup"
              aria-label={isEn ? "Compression preset" : "Пресет сжатия"}
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {presetCards.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={preset === opt.value && !keepText}
                  onClick={() => {
                    if (!processing) {
                      applyPreset(opt.value);
                      setKeepText(false);
                    }
                  }}
                  disabled={processing}
                  className={cn(
                    "flex min-h-14 flex-col justify-center gap-0.5 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors",
                    preset === opt.value && !keepText
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                    processing && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="mt-4">
            {!processing && !result && (
              <Button
                size="lg"
                onClick={handleCompress}
                data-primary-action="compress-pdf"
                data-primary-state="input"
                className="tool-primary-action w-full sm:w-auto"
              >
                <ArrowsInLineHorizontal size={18} />
                {keepText
                  ? isEn
                    ? "Optimize PDF"
                    : "Оптимизировать PDF"
                  : isEn
                    ? "Compress PDF"
                    : "Сжать PDF"}
              </Button>
            )}
            {processing && (
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="w-full border-[var(--color-danger)] text-[var(--color-danger)] sm:w-auto"
              >
                <StopCircle size={18} />
                {isEn ? "Cancel" : "Отменить"}
              </Button>
            )}
            {result && (
              <Button
                onClick={handleDownload}
                size="lg"
                data-primary-action="compress-pdf"
                data-primary-state="result"
                className="tool-primary-action w-full bg-[var(--color-success)] text-white hover:opacity-90 sm:w-auto"
              >
                <Download size={18} />
                {isEn ? "Download" : "Скачать"}
                {compressedSize > 0 &&
                  ` (${formatFileSize(compressedSize, isEn)})`}
              </Button>
            )}
          </div>

          <AdvancedSettings
            title={
              isEn ? "More compression options" : "Дополнительные настройки"
            }
            description={
              isEn
                ? "Quality, DPI, format and document structure"
                : "Качество, DPI, формат и структура документа"
            }
            className="mt-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MobileSlider
                label={isEn ? "JPEG image quality" : "Качество JPEG"}
                value={quality}
                min={10}
                max={100}
                step={1}
                onChange={setQuality}
                unit="%"
                disabled={processing || (!keepText && format === "png")}
              />

              <div className="flex flex-col gap-2">
                <label htmlFor="compress-pdf-dpi" className="text-sm font-semibold text-[var(--color-text)]">
                  {isEn ? "Image DPI" : "DPI изображений"}
                </label>
                <select
                  id="compress-pdf-dpi"
                  value={dpi}
                  onChange={(e) => setDpi(Number(e.target.value) as DpiOption)}
                  disabled={processing}
                  className={cn(
                    "h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm",
                    "focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50",
                  )}
                >
                  {DPI_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} DPI
                      {d === 72
                        ? ` · ${isEn ? "screen" : "экран"}`
                        : d === 96
                          ? ` · ${isEn ? "web" : "веб"}`
                          : d === 150
                            ? ` · ${isEn ? "print draft" : "черновая печать"}`
                            : ` · ${isEn ? "print" : "печать"}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                  <ImageIcon size={14} />
                  {isEn ? "Re-encode as" : "Кодировать как"}
                </label>
                <div
                  role="radiogroup"
                  aria-label={isEn ? "Image format" : "Формат изображения"}
                  className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={format === "jpeg"}
                    onClick={() =>
                      !processing && setFormat("jpeg")
                    }
                    disabled={processing || keepText}
                    className={cn(
                      "flex-1 min-h-11 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition-colors",
                      format === "jpeg"
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                      (processing || keepText) &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    JPEG
                    <div className="text-[10px] font-normal opacity-75">
                      {isEn ? "smaller, lossy" : "меньше, потери"}
                    </div>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={format === "png"}
                    onClick={() => !processing && setFormat("png")}
                    disabled={processing || keepText}
                    className={cn(
                      "flex-1 min-h-11 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition-colors",
                      format === "png"
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                      (processing || keepText) &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    PNG
                    <div className="text-[10px] font-normal opacity-75">
                      {isEn
                        ? "lossless"
                        : "без потерь"}
                    </div>
                  </button>
                </div>
                {format === "png" && !keepText && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {isEn
                      ? "PNG uses lossless image encoding. The quality percentage is not applied; DPI and grayscale still affect the result."
                      : "PNG использует сжатие без потерь. Процент качества не применяется; DPI и ч/б по-прежнему влияют на результат."}
                  </p>
                )}
              </div>

              <div className="flex flex-col justify-end gap-2">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-muted)]">
                  <input
                    type="checkbox"
                    checked={grayscale}
                    onChange={(e) => setGrayscale(e.target.checked)}
                    disabled={processing}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <Palette
                    size={14}
                    className="text-[var(--color-text-muted)]"
                  />
                  <span className="flex-1">
                    {isEn ? "Grayscale" : "Чёрно-белый"}
                  </span>
                </label>

                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-muted)]">
                  <input
                    type="checkbox"
                    checked={keepText}
                    onChange={(e) => setKeepText(e.target.checked)}
                    disabled={processing}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <TextT size={14} className="text-[var(--color-text-muted)]" />
                  <span className="flex-1">
                    {isEn
                      ? "Preserve vector text & links (no page rasterization)"
                      : "Сохранять векторный текст и ссылки (без растеризации страниц)"}
                  </span>
                </label>

                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-muted)]">
                  <input
                    type="checkbox"
                    checked={stripMetadata}
                    onChange={(e) => setStripMetadata(e.target.checked)}
                    disabled={processing}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <ShieldCheck
                    size={14}
                    className="text-[var(--color-text-muted)]"
                  />
                  <span className="flex-1">
                    {isEn ? "Strip metadata" : "Удалить метаданные"}
                  </span>
                </label>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {keepText
                ? isEn
                  ? "Vector preservation mode keeps searchable text and compresses only embedded images. Pure vector files without images may not decrease in size."
                  : "Режим сохранения текста оставляет его доступным для поиска и сжимает только внедренные картинки. Если в файле нет картинок, размер может не уменьшиться."
                : isEn
                  ? "Raster compression converts pages into high-efficiency images, providing massive size reduction."
                  : "Растровое сжатие превращает страницы в оптимизированные изображения, обеспечивая максимальное уменьшение файла."}
            </p>
          </AdvancedSettings>

          {processing && (
            <div
              className="mt-4"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>{isEn ? "Processing pages…" : "Обработка страниц…"}</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "var(--color-primary)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Before / After size card with horizontal progress bar */}
          {result && compressedSize > 0 && (
            <Card className="mt-4 p-4 sm:p-6">
              <div className="mb-3 text-sm font-semibold">
                {isEn ? "Before / After" : "До / После"}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Was" : "Было"}
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {formatFileSize(originalSize, isEn)}
                  </div>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--color-primary)]">
                    {isEn ? "Now" : "Стало"}
                  </div>
                  <div className="text-xl font-bold tabular-nums text-[var(--color-primary)]">
                    {formatFileSize(compressedSize, isEn)}
                  </div>
                </div>
                <div
                  className={cn(
                    "col-span-2 rounded-[var(--radius-md)] p-3 text-center sm:col-span-1",
                    didShrink
                      ? "bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)]"
                      : "bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)]",
                  )}
                >
                  <div
                    className={cn(
                      "text-[10px] uppercase tracking-wide",
                      didShrink
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-warning)]",
                    )}
                  >
                    {isEn ? "Saved" : "Экономия"}
                  </div>
                  <div
                    className={cn(
                      "text-xl font-bold tabular-nums",
                      didShrink
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-warning)]",
                    )}
                  >
                    {didShrink
                      ? `${savedPercent.toFixed(0)}%`
                      : isEn
                        ? "No gain"
                        : "Нет выигрыша"}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {result && !didShrink && compressedSize > 0 && (
            <div className="mt-3 flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] p-3 text-sm text-[var(--color-text)]">
              <div className="flex items-start gap-2">
                <Warning
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--color-warning)]"
                />
                <span>
                  {keepText
                    ? isEn
                      ? "This PDF contains vector text and no heavy raster images. In vector mode, file size cannot be decreased further without page rasterization."
                      : "Этот PDF содержит векторный текст без тяжёлых растровых изображений. В режиме сохранения текста размер невозможно уменьшить без растеризации страниц."
                    : isEn
                      ? "The file was already optimal, so its size did not decrease."
                      : "Файл уже был максимально оптимизирован, поэтому его размер не уменьшился."}
                </span>
              </div>
              {keepText && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setKeepText(false);
                    setTimeout(() => {
                      handleCompress();
                    }, 50);
                  }}
                  className="w-full sm:w-auto self-start text-xs border-[var(--color-warning)] font-semibold"
                >
                  <ArrowsInLineHorizontal size={14} className="mr-1.5" />
                  {isEn
                    ? "Compress with rasterization (-50%…-80%)"
                    : "Сжать с растеризацией (-50%…-80%)"}
                </Button>
              )}
            </div>
          )}

          <output aria-live="polite" className="sr-only">
            {result && compressedSize > 0
              ? isEn
                ? `Compression complete: ${formatFileSize(compressedSize, isEn)} (${didShrink ? "-" + savedPercent.toFixed(1) + "%" : "no gain"}).`
                : `Сжатие готово: ${formatFileSize(compressedSize, isEn)} (${didShrink ? "-" + savedPercent.toFixed(1) + "%" : "без выигрыша"}).`
              : ""}
          </output>
        </>
      )}
    </div>
  );
}
