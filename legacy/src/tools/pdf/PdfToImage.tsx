"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowCounterClockwise,
  CheckCircle,
  Download,
  FileText,
  FileZip,
  StopCircle,
  Swap,
  Warning,
  X,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PdfDropzone } from "@/src/components/ui/pdf-dropzone";
import ColorPickerInput from "@/src/components/ColorPickerInput";
import { cn } from "@/src/lib/cn";
import {
  formatFileSize,
  loadPdfDocument,
  readFileAsArrayBuffer,
} from "@/src/utils/pdfHelpers";
import { downloadBlob } from "@/src/utils/exportHelpers";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";

type ImageFormat = "jpeg" | "png" | "webp";

interface ConvertedImage {
  blob: Blob;
  url: string;
  name: string;
  pageNum: number;
}

interface RenderTaskLike {
  cancel(): void;
  promise: Promise<unknown>;
}

interface SafetyProfile {
  maxDpi: number;
  maxPagePixels: number;
  maxTotalPixels: number;
  maxOutputBytes: number;
  maxPdfBytes: number;
  label: "mobile" | "desktop";
}

const DESKTOP_PROFILE: SafetyProfile = {
  maxDpi: 300,
  maxPagePixels: 20_000_000,
  maxTotalPixels: 120_000_000,
  maxOutputBytes: 128 * 1024 * 1024,
  maxPdfBytes: 100 * 1024 * 1024,
  label: "desktop",
};

const MOBILE_PROFILE: SafetyProfile = {
  maxDpi: 200,
  maxPagePixels: 8_000_000,
  maxTotalPixels: 32_000_000,
  maxOutputBytes: 48 * 1024 * 1024,
  maxPdfBytes: 40 * 1024 * 1024,
  label: "mobile",
};

const MAX_CANVAS_EDGE = 16_384;
const PAGE_RANGE_RE = /^[\d\s,-]*$/;
const DPI_PRESETS = [72, 150, 300];

const FORMAT_CONFIG: Record<
  ImageFormat,
  {
    mime: string;
    ext: string;
    label: string;
    hasQuality: boolean;
    supportsAlpha: boolean;
    estimatedBytesPerPixel: number;
  }
> = {
  jpeg: {
    mime: "image/jpeg",
    ext: "jpg",
    label: "JPEG",
    hasQuality: true,
    supportsAlpha: false,
    estimatedBytesPerPixel: 0.35,
  },
  png: {
    mime: "image/png",
    ext: "png",
    label: "PNG",
    hasQuality: false,
    supportsAlpha: true,
    estimatedBytesPerPixel: 1.5,
  },
  webp: {
    mime: "image/webp",
    ext: "webp",
    label: "WebP",
    hasQuality: true,
    supportsAlpha: true,
    estimatedBytesPerPixel: 0.22,
  },
};

class RenderBudgetError extends Error {}

function parsePageRange(input: string, maxPage: number): number[] {
  if (!input.trim())
    return Array.from({ length: maxPage }, (_, index) => index + 1);

  const pages = new Set<number>();
  for (const part of input.split(",")) {
    const value = part.trim();
    if (!value) continue;

    const range = value.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number.parseInt(range[1], 10);
      const end = Number.parseInt(range[2], 10);
      for (
        let page = Math.max(1, start);
        page <= Math.min(maxPage, end);
        page += 1
      ) {
        pages.add(page);
      }
    } else if (/^\d+$/.test(value)) {
      const page = Number.parseInt(value, 10);
      if (page >= 1 && page <= maxPage) pages.add(page);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

function revokeImages(images: ConvertedImage[]): void {
  for (const image of images) URL.revokeObjectURL(image.url);
}

function clearCanvas(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  canvas.width = 1;
  canvas.height = 1;
}

function isRenderCancellation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "RenderingCancelledException" ||
      /cancel/i.test(error.message))
  );
}

function detectSafetyProfile(): SafetyProfile {
  const navigatorWithMemory = navigator as Navigator & {
    deviceMemory?: number;
  };
  const compactViewport = window.matchMedia("(max-width: 767px)").matches;
  const lowMemoryDevice =
    typeof navigatorWithMemory.deviceMemory === "number" &&
    navigatorWithMemory.deviceMemory <= 4;
  return compactViewport || lowMemoryDevice ? MOBILE_PROFILE : DESKTOP_PROFILE;
}

function subscribeSafetyProfile(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const compactViewport = window.matchMedia("(max-width: 767px)");
  compactViewport.addEventListener("change", onStoreChange);
  return () => compactViewport.removeEventListener("change", onStoreChange);
}

function getSafetyProfileSnapshot(): SafetyProfile {
  return typeof window === "undefined"
    ? DESKTOP_PROFILE
    : detectSafetyProfile();
}

export default function PdfToImage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const profile = useSyncExternalStore(
    subscribeSafetyProfile,
    getSafetyProfileSnapshot,
    () => DESKTOP_PROFILE,
  );
  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [firstPageDims, setFirstPageDims] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [format, setFormat] = useState<ImageFormat>("webp");
  const [quality, setQuality] = useState(0.85);
  const [preferredDpi, setDpi] = useState(150);
  const dpi = Math.min(preferredDpi, profile.maxDpi);
  const [pageRange, setPageRange] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [outputPrefix, setOutputPrefix] = useState("page");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);

  const imagesRef = useRef<ConvertedImage[]>([]);
  const cancelRef = useRef(false);
  const renderTaskRef = useRef<RenderTaskLike | null>(null);
  const jobIdRef = useRef(0);

  const config = FORMAT_CONFIG[format];

  const discardResults = useCallback(() => {
    revokeImages(imagesRef.current);
    imagesRef.current = [];
    setConvertedImages([]);
  }, []);

  useEffect(() => {
    return () => {
      jobIdRef.current += 1;
      cancelRef.current = true;
      renderTaskRef.current?.cancel();
      revokeImages(imagesRef.current);
      imagesRef.current = [];
    };
  }, []);

  const pagesToConvert = useMemo(
    () => (pageCount > 0 ? parsePageRange(pageRange, pageCount) : []),
    [pageCount, pageRange],
  );

  const estimate = useMemo(() => {
    if (!firstPageDims || pagesToConvert.length === 0) {
      return {
        width: 0,
        height: 0,
        pagePixels: 0,
        totalPixels: 0,
        outputBytes: 0,
      };
    }
    const scale = dpi / 72;
    const width = Math.ceil(firstPageDims.width * scale);
    const height = Math.ceil(firstPageDims.height * scale);
    const pagePixels = width * height;
    const totalPixels = pagePixels * pagesToConvert.length;
    const qualityFactor = config.hasQuality ? Math.max(0.35, quality) : 1;
    const outputBytes = Math.round(
      totalPixels * config.estimatedBytesPerPixel * qualityFactor,
    );
    return { width, height, pagePixels, totalPixels, outputBytes };
  }, [config, dpi, firstPageDims, pagesToConvert.length, quality]);

  const budgetWarning = useMemo(() => {
    if (!firstPageDims || pagesToConvert.length === 0) return "";
    if (estimate.width > MAX_CANVAS_EDGE || estimate.height > MAX_CANVAS_EDGE) {
      return isEn
        ? "The selected DPI would create a canvas that is too large for a browser."
        : "Выбранный DPI создаст слишком большой холст для браузера.";
    }
    if (estimate.pagePixels > profile.maxPagePixels) {
      return isEn
        ? "A page exceeds the safe pixel limit. Lower the DPI."
        : "Одна страница превышает безопасный лимит пикселей. Уменьшите DPI.";
    }
    if (estimate.totalPixels > profile.maxTotalPixels) {
      return isEn
        ? "This range exceeds the safe processing budget. Lower the DPI or choose fewer pages."
        : "Диапазон превышает безопасный лимит обработки. Уменьшите DPI или число страниц.";
    }
    if (estimate.outputBytes > profile.maxOutputBytes) {
      return isEn
        ? "The estimated output is too large. Use WebP/JPEG, lower the DPI, or choose fewer pages."
        : "Ожидаемый результат слишком большой. Выберите WebP/JPEG, снизьте DPI или число страниц.";
    }
    return "";
  }, [estimate, firstPageDims, isEn, pagesToConvert.length, profile]);

  const handleFileSelected = useCallback(
    async (files: File[]) => {
      const selectedFile = files[0];
      if (!selectedFile) return;

      jobIdRef.current += 1;
      cancelRef.current = true;
      renderTaskRef.current?.cancel();
      discardResults();
      setError("");
      setProgress(0);
      setProcessing(false);
      setFile(null);
      setPdfData(null);
      setPageCount(0);
      setFirstPageDims(null);

      if (selectedFile.size > profile.maxPdfBytes) {
        setError(
          isEn
            ? `This file exceeds the safe ${Math.round(profile.maxPdfBytes / 1024 / 1024)} MB limit for this device.`
            : `Файл превышает безопасный лимит ${Math.round(profile.maxPdfBytes / 1024 / 1024)} МБ для этого устройства.`,
        );
        return;
      }

      const selectionJobId = jobIdRef.current;
      let document: Awaited<ReturnType<typeof loadPdfDocument>> | null = null;
      try {
        const buffer = await readFileAsArrayBuffer(selectedFile);
        document = await loadPdfDocument(buffer);
        const firstPage = await document.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        firstPage.cleanup();

        if (selectionJobId !== jobIdRef.current) return;
        setFile(selectedFile);
        setPdfData(buffer);
        setPageCount(document.numPages);
        setFirstPageDims({ width: viewport.width, height: viewport.height });
        setOutputPrefix(selectedFile.name.replace(/\.pdf$/i, "") || "page");
        cancelRef.current = false;
      } catch {
        if (selectionJobId === jobIdRef.current) {
          setError(
            isEn
              ? "The PDF could not be read. It may be damaged, encrypted, or unsupported."
              : "Не удалось прочитать PDF. Возможно, файл повреждён, зашифрован или не поддерживается.",
          );
        }
      } finally {
        await document?.destroy();
      }
    },
    [discardResults, isEn, profile.maxPdfBytes],
  );

  const handleConvert = useCallback(async () => {
    if (!pdfData || pagesToConvert.length === 0 || budgetWarning) return;

    const jobId = ++jobIdRef.current;
    cancelRef.current = false;
    discardResults();
    setProcessing(true);
    setProgress(0);
    setError("");

    let document: Awaited<ReturnType<typeof loadPdfDocument>> | null = null;
    const results: ConvertedImage[] = [];
    let totalPixels = 0;
    let totalOutputBytes = 0;

    try {
      document = await loadPdfDocument(pdfData);
      const targets = parsePageRange(pageRange, document.numPages);
      const prefix = outputPrefix.trim() || "page";
      const scale = dpi / 72;

      for (let index = 0; index < targets.length; index += 1) {
        if (cancelRef.current || jobId !== jobIdRef.current) break;

        const pageNumber = targets[index];
        const page = await document.getPage(pageNumber);
        let renderCanvas: HTMLCanvasElement | null = null;
        let exportCanvas: HTMLCanvasElement | null = null;

        try {
          const viewport = page.getViewport({ scale });
          const width = Math.ceil(viewport.width);
          const height = Math.ceil(viewport.height);
          const pagePixels = width * height;

          if (width > MAX_CANVAS_EDGE || height > MAX_CANVAS_EDGE) {
            throw new RenderBudgetError(
              isEn
                ? `Page ${pageNumber} would exceed the browser canvas limit.`
                : `Страница ${pageNumber} превышает лимит размера холста браузера.`,
            );
          }
          if (pagePixels > profile.maxPagePixels) {
            throw new RenderBudgetError(
              isEn
                ? `Page ${pageNumber} exceeds the safe per-page pixel limit.`
                : `Страница ${pageNumber} превышает безопасный лимит пикселей.`,
            );
          }
          if (totalPixels + pagePixels > profile.maxTotalPixels) {
            throw new RenderBudgetError(
              isEn
                ? "The selected pages exceed the safe total pixel budget."
                : "Выбранные страницы превышают общий безопасный лимит пикселей.",
            );
          }

          totalPixels += pagePixels;
          renderCanvas = window.document.createElement("canvas");
          renderCanvas.width = width;
          renderCanvas.height = height;
          const renderContext = renderCanvas.getContext("2d", { alpha: true });
          if (!renderContext)
            throw new Error("Canvas 2D context is unavailable");

          const renderTask = page.render({
            canvas: renderCanvas,
            canvasContext: renderContext,
            viewport,
          } as Parameters<typeof page.render>[0]);
          renderTaskRef.current = renderTask;
          await renderTask.promise;
          renderTaskRef.current = null;

          if (cancelRef.current || jobId !== jobIdRef.current) break;

          if (!config.supportsAlpha || !transparentBackground) {
            exportCanvas = window.document.createElement("canvas");
            exportCanvas.width = width;
            exportCanvas.height = height;
            const exportContext = exportCanvas.getContext("2d", {
              alpha: false,
            });
            if (!exportContext)
              throw new Error("Canvas 2D context is unavailable");
            exportContext.fillStyle = backgroundColor;
            exportContext.fillRect(0, 0, width, height);
            exportContext.drawImage(renderCanvas, 0, 0);
          } else {
            exportCanvas = renderCanvas;
          }

          const blob = await new Promise<Blob>((resolve, reject) => {
            exportCanvas?.toBlob(
              (value) =>
                value
                  ? resolve(value)
                  : reject(new Error("Canvas export failed")),
              config.mime,
              config.hasQuality ? quality : undefined,
            );
          });

          if (cancelRef.current || jobId !== jobIdRef.current) break;
          if (totalOutputBytes + blob.size > profile.maxOutputBytes) {
            throw new RenderBudgetError(
              isEn
                ? "The generated files reached the safe memory limit. Use a smaller range or lower DPI."
                : "Созданные файлы достигли безопасного лимита памяти. Уменьшите диапазон или DPI.",
            );
          }

          totalOutputBytes += blob.size;
          const name = `${prefix}_${String(pageNumber).padStart(String(document.numPages).length, "0")}.${config.ext}`;
          results.push({
            blob,
            url: URL.createObjectURL(blob),
            name,
            pageNum: pageNumber,
          });

          if (jobId === jobIdRef.current) {
            setProgress(((index + 1) / targets.length) * 100);
          }
        } finally {
          renderTaskRef.current = null;
          if (exportCanvas && exportCanvas !== renderCanvas)
            clearCanvas(exportCanvas);
          clearCanvas(renderCanvas);
          page.cleanup();
        }
      }

      if (jobId === jobIdRef.current) {
        imagesRef.current = results;
        setConvertedImages(results);
      } else {
        revokeImages(results);
      }
    } catch (caughtError) {
      const cancelled = cancelRef.current || isRenderCancellation(caughtError);
      if (jobId === jobIdRef.current && cancelled) {
        imagesRef.current = results;
        setConvertedImages(results);
      } else {
        revokeImages(results);
        if (jobId === jobIdRef.current) {
          setError(
            caughtError instanceof RenderBudgetError
              ? caughtError.message
              : isEn
                ? "The PDF pages could not be converted."
                : "Не удалось конвертировать страницы PDF.",
          );
        }
      }
    } finally {
      renderTaskRef.current = null;
      await document?.destroy();
      if (jobId === jobIdRef.current) setProcessing(false);
    }
  }, [
    backgroundColor,
    budgetWarning,
    config,
    discardResults,
    dpi,
    isEn,
    outputPrefix,
    pageRange,
    pagesToConvert.length,
    pdfData,
    profile,
    quality,
    transparentBackground,
  ]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    renderTaskRef.current?.cancel();
  }, []);

  const handleReset = useCallback(() => {
    jobIdRef.current += 1;
    cancelRef.current = true;
    renderTaskRef.current?.cancel();
    discardResults();
    setFile(null);
    setPdfData(null);
    setPageCount(0);
    setFirstPageDims(null);
    setPageRange("");
    setProgress(0);
    setError("");
    setOutputPrefix("page");
    setProcessing(false);
  }, [discardResults]);

  const handleFormatChange = useCallback(
    (nextFormat: ImageFormat) => {
      setFormat(nextFormat);
      discardResults();
    },
    [discardResults],
  );

  const downloadAll = useCallback(async () => {
    if (convertedImages.length === 0) return;
    try {
      const JSZip = (await import("jszip")).default;
      const archive = new JSZip();
      for (const image of convertedImages) archive.file(image.name, image.blob);
      const blob = await archive.generateAsync({ type: "blob" });
      downloadBlob(
        blob,
        `${outputPrefix.trim() || "pdf-pages"}_${config.ext}.zip`,
      );
    } catch {
      setError(
        isEn
          ? "The ZIP archive could not be created."
          : "Не удалось создать ZIP-архив.",
      );
    }
  }, [config.ext, convertedImages, isEn, outputPrefix]);

  const formatOptions: {
    value: ImageFormat;
    descriptionEn: string;
    descriptionRu: string;
  }[] = [
    {
      value: "webp",
      descriptionEn: "Small, modern",
      descriptionRu: "Компактный",
    },
    {
      value: "jpeg",
      descriptionEn: "Compatible",
      descriptionRu: "Совместимый",
    },
    { value: "png", descriptionEn: "Lossless", descriptionRu: "Без потерь" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      {!file && (
        <PdfDropzone
          accept="application/pdf,.pdf"
          onFilesSelected={handleFileSelected}
          maxSizeMB={Math.round(profile.maxPdfBytes / 1024 / 1024)}
          label="Перетащите PDF или нажмите для загрузки"
          labelEn="Drag & drop a PDF or click to upload"
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
          <Card className="mt-4 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <FileText
                size={28}
                className="shrink-0 text-[var(--color-primary)]"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(file.size, isEn)} · {pageCount}{" "}
                  {isEn ? (pageCount === 1 ? "page" : "pages") : "стр."}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <ArrowCounterClockwise size={16} />
                <span className="hidden sm:inline">
                  {isEn ? "New file" : "Другой файл"}
                </span>
              </Button>
            </div>

            <div className="mt-5">
              <Label>{isEn ? "Output format" : "Формат результата"}</Label>
              <div role="radiogroup" className="mt-1.5 grid grid-cols-3 gap-2">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={format === option.value}
                    onClick={() => handleFormatChange(option.value)}
                    className={cn(
                      "min-h-11 rounded-[var(--radius-md)] border p-2 text-center transition-colors",
                      format === option.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    <span className="block text-sm font-semibold">
                      {FORMAT_CONFIG[option.value].label}
                    </span>
                    <span className="block text-[10px] text-[var(--color-text-muted)]">
                      {isEn ? option.descriptionEn : option.descriptionRu}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <Label htmlFor="pdf-page-range-primary">
                {isEn ? "Pages" : "Страницы"}
              </Label>
              <Input
                id="pdf-page-range-primary"
                value={pageRange}
                placeholder={
                  isEn
                    ? `All pages (1-${pageCount})`
                    : `Все страницы (1-${pageCount})`
                }
                onChange={(event) => {
                  if (PAGE_RANGE_RE.test(event.target.value))
                    setPageRange(event.target.value);
                }}
                className="mt-1.5"
              />
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                {pagesToConvert.length} {isEn ? "selected" : "выбрано"}
              </div>
            </div>

            {firstPageDims && pagesToConvert.length > 0 && (
              <div
                className={cn(
                  "mt-5 rounded-[var(--radius-md)] border p-3 text-sm",
                  budgetWarning
                    ? "border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-muted)]/50",
                )}
              >
                {budgetWarning ? (
                  <div className="flex items-start gap-2">
                    <Warning size={17} className="mt-0.5 shrink-0" />
                    <span>{budgetWarning}</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {estimate.width} × {estimate.height} px ·{" "}
                      {pagesToConvert.length} {isEn ? "page(s)" : "стр."}
                    </span>
                    <span className="font-semibold">
                      ≈ {formatFileSize(estimate.outputBytes, isEn)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="mt-4 grid gap-2">
            {processing ? (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-[var(--color-danger)] text-[var(--color-danger)]"
              >
                <StopCircle size={18} />
                {isEn ? "Cancel rendering" : "Отменить рендеринг"}
              </Button>
            ) : (
              <Button
                className="tool-primary-action w-full"
                onClick={handleConvert}
                disabled={pagesToConvert.length === 0 || Boolean(budgetWarning)}
              >
                <Swap size={18} />
                {isEn
                  ? `Convert to ${config.label}`
                  : `Конвертировать в ${config.label}`}
              </Button>
            )}
          </div>

          <AdvancedSettings
            title={isEn ? "Advanced settings" : "Расширенные настройки"}
            description={
              isEn
                ? "DPI, quality, background and filename"
                : "DPI, качество, фон и имя файла"
            }
            className="mt-5"
          >
            <div className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <Label>{isEn ? "Resolution" : "Разрешение"}</Label>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Safe maximum" : "Безопасный максимум"}:{" "}
                  {profile.maxDpi} DPI
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {DPI_PRESETS.filter((value) => value <= profile.maxDpi).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDpi(value)}
                      className={cn(
                        "min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-semibold transition-colors",
                        dpi === value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      {value} DPI
                    </button>
                  ),
                )}
                {profile.maxDpi !== 300 && (
                  <button
                    type="button"
                    onClick={() => setDpi(profile.maxDpi)}
                    className={cn(
                      "min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-semibold transition-colors",
                      dpi === profile.maxDpi
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    {profile.maxDpi} DPI
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5">
              <Label htmlFor="pdf-page-range">
                {isEn ? "Pages" : "Страницы"}
              </Label>
              <Input
                id="pdf-page-range"
                value={pageRange}
                placeholder={
                  isEn
                    ? `All pages (1-${pageCount})`
                    : `Все страницы (1-${pageCount})`
                }
                onChange={(event) => {
                  if (PAGE_RANGE_RE.test(event.target.value))
                    setPageRange(event.target.value);
                }}
                className="mt-1.5"
              />
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                {pagesToConvert.length}{" "}
                {isEn ? "pages selected" : "страниц выбрано"}
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">
                    {isEn ? "Custom DPI" : "Свой DPI"}
                  </span>
                  <Input
                    type="number"
                    min={36}
                    max={profile.maxDpi}
                    value={dpi}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isFinite(value))
                        setDpi(Math.min(profile.maxDpi, Math.max(36, value)));
                    }}
                    className="mt-1.5"
                  />
                </label>
                {config.hasQuality && (
                  <label className="block text-sm">
                    <span className="font-medium">
                      {isEn ? "Quality" : "Качество"}:{" "}
                      {Math.round(quality * 100)}%
                    </span>
                    <input
                      type="range"
                      min={0.35}
                      max={1}
                      step={0.05}
                      value={quality}
                      onChange={(event) =>
                        setQuality(Number(event.target.value))
                      }
                      className="mt-3 w-full accent-[var(--color-primary)]"
                    />
                  </label>
                )}
                {config.supportsAlpha && (
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={transparentBackground}
                      onChange={(event) =>
                        setTransparentBackground(event.target.checked)
                      }
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    {isEn ? "Transparent background" : "Прозрачный фон"}
                  </label>
                )}
                {(!config.supportsAlpha || !transparentBackground) && (
                  <div>
                    <Label>{isEn ? "Background color" : "Цвет фона"}</Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ColorPickerInput
                        value={backgroundColor}
                        onChange={setBackgroundColor}
                        label={isEn ? "Background color" : "Цвет фона"}
                        size="small"
                      />
                      <Input
                        value={backgroundColor}
                        onChange={(event) =>
                          setBackgroundColor(event.target.value)
                        }
                        className="h-9 max-w-32 font-mono"
                      />
                    </div>
                  </div>
                )}
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium">
                    {isEn ? "Filename prefix" : "Префикс имени"}
                  </span>
                  <Input
                    value={outputPrefix}
                    onChange={(event) => setOutputPrefix(event.target.value)}
                    className="mt-1.5"
                  />
                </label>
              </div>
            </div>
          </AdvancedSettings>

          {processing && (
            <div
              className="mt-3"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full bg-[var(--color-primary)] transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 text-xs tabular-nums text-[var(--color-text-muted)]">
                {Math.round(progress)}%
              </div>
            </div>
          )}

          {convertedImages.length > 0 && (
            <Card className="mt-4 p-4 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <CheckCircle
                  size={18}
                  weight="fill"
                  className="text-[var(--color-success)]"
                />
                <div className="font-semibold">
                  {convertedImages.length}{" "}
                  {isEn ? "image(s) ready" : "изображений готово"}
                </div>
                <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(
                    convertedImages.reduce(
                      (sum, image) => sum + image.blob.size,
                      0,
                    ),
                    isEn,
                  )}
                </span>
                {convertedImages.length > 1 && (
                  <Button variant="outline" size="sm" onClick={downloadAll}>
                    <FileZip size={16} />
                    {isEn ? "Download ZIP" : "Скачать ZIP"}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {convertedImages.map((image) => (
                  <div
                    key={image.pageNum}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-36 w-full rounded bg-[var(--color-surface-muted)] object-contain"
                    />
                    <div className="mt-2 truncate text-xs font-semibold">
                      {isEn ? "Page" : "Страница"} {image.pageNum}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {formatFileSize(image.blob.size, isEn)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => downloadBlob(image.blob, image.name)}
                    >
                      <Download size={14} /> {isEn ? "Download" : "Скачать"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
