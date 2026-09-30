"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  FileZip,
  Lock,
  LockOpen,
  Resize,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { downloadBlob, triggerDownload } from "@/src/utils/exportHelpers";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { MobileSlider } from "@/src/components/tool/MobileSlider";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import {
  EXTENDED_IMAGE_ACCEPT,
  isExtendedImageFile,
  normalizeImagesForBrowser,
} from "@/src/lib/file-conversion/image-engine";

type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp";
type ResizeUnit = "px" | "percent";
type FitMode = "inside" | "exact";

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  resultUrl: string;
  resultBlob: Blob | null;
  originalSize: number;
  resultSize: number;
  originalWidth: number;
  originalHeight: number;
  resultWidth: number;
  resultHeight: number;
  processing: boolean;
  done: boolean;
  error: string | null;
}

interface ImageCompressorProps {
  variant?: "compress" | "resize";
}

function formatFileSize(bytes: number, isEn: boolean): string {
  if (bytes <= 0) return isEn ? "0 B" : "0 Б";
  const units = isEn ? ["B", "KB", "MB", "GB"] : ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function getMime(
  file: File,
  format: OutputFormat,
): Exclude<OutputFormat, "original"> {
  if (format !== "original") return format;
  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp"
  ) {
    return file.type;
  }
  return "image/png";
}

function getExtension(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

let imageId = 0;

export default function ImageCompressor({
  variant = "compress",
}: ImageCompressorProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const isResizeMode = variant === "resize";

  const [images, setImages] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(80);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    isResizeMode ? "original" : "image/jpeg",
  );
  const [sizePercent, setSizePercent] = useState(100);
  const [maxWidth, setMaxWidth] = useState(0);
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [resizeUnit, setResizeUnit] = useState<ResizeUnit>("px");
  const [fitMode, setFitMode] = useState<FitMode>("exact");
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [processedSettings, setProcessedSettings] = useState("");
  const [estimatedResultSize, setEstimatedResultSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<ImageItem[]>([]);
  const generationRef = useRef(0);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    const root = rootRef.current;
    root?.setAttribute("data-image-compressor-ready", "true");
    return () => {
      root?.removeAttribute("data-image-compressor-ready");
      imagesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.originalUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
    };
  }, []);

  const settingsSignature = [
    fitMode,
    maxWidth,
    outputFormat,
    quality,
    resizeHeight,
    resizeUnit,
    resizeWidth,
    sizePercent,
  ].join("|");

  const addFiles = useCallback(
    async (incoming: File[]) => {
      const supported = incoming.filter(isExtendedImageFile);
      if (supported.length === 0) return;

      const selected = isResizeMode ? supported.slice(0, 1) : supported;
      const normalized = await normalizeImagesForBrowser(selected);
      const files = normalized.map((file, index) =>
        file === selected[index]
          ? file
          : new File([file], selected[index].name, {
              type: file.type,
              lastModified: selected[index].lastModified,
            }),
      );
      const newItems: ImageItem[] = [];

      for (const [index, file] of files.entries()) {
        const originalUrl = URL.createObjectURL(file);
        const dimensions = await new Promise<{ width: number; height: number }>(
          (resolve) => {
            const image = new Image();
            image.onload = () =>
              resolve({
                width: image.naturalWidth,
                height: image.naturalHeight,
              });
            image.onerror = () => resolve({ width: 0, height: 0 });
            image.src = originalUrl;
          },
        );

        if (dimensions.width === 0 || dimensions.height === 0) {
          URL.revokeObjectURL(originalUrl);
          continue;
        }

        newItems.push({
          id: `image_${++imageId}`,
          file,
          originalUrl,
          resultUrl: "",
          resultBlob: null,
          originalSize: selected[index].size,
          resultSize: 0,
          originalWidth: dimensions.width,
          originalHeight: dimensions.height,
          resultWidth: 0,
          resultHeight: 0,
          processing: false,
          done: false,
          error: null,
        });
      }

      if (newItems.length === 0) return;
      generationRef.current += 1;
      setProcessedSettings("");
      setImages((current) => {
        current.forEach((item) => {
          if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        });
        const base = isResizeMode ? [] : current;
        if (isResizeMode) {
          current.forEach((item) => URL.revokeObjectURL(item.originalUrl));
        }
        return [
          ...base.map((item) => ({
            ...item,
            resultUrl: "",
            resultBlob: null,
            resultSize: 0,
            resultWidth: 0,
            resultHeight: 0,
            done: false,
            processing: false,
            error: null,
          })),
          ...newItems,
        ];
      });

      if (isResizeMode) {
        setResizeUnit("px");
        setResizeWidth(newItems[0].originalWidth);
        setResizeHeight(newItems[0].originalHeight);
      }
    },
    [isResizeMode],
  );

  const processOne = useCallback(
    (
      item: ImageItem,
    ): Promise<{
      blob: Blob | null;
      url: string;
      width: number;
      height: number;
    }> =>
      new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          let width: number;
          let height: number;

          if (isResizeMode) {
            const requestedWidth =
              resizeUnit === "percent"
                ? Math.round(image.naturalWidth * (resizeWidth / 100))
                : resizeWidth;
            const requestedHeight =
              resizeUnit === "percent"
                ? Math.round(image.naturalHeight * (resizeHeight / 100))
                : resizeHeight;
            width = Math.max(1, requestedWidth || image.naturalWidth);
            height = Math.max(1, requestedHeight || image.naturalHeight);

            if (fitMode === "inside") {
              const ratio = Math.min(
                width / image.naturalWidth,
                height / image.naturalHeight,
              );
              width = Math.max(1, Math.round(image.naturalWidth * ratio));
              height = Math.max(1, Math.round(image.naturalHeight * ratio));
            }
          } else {
            width = Math.max(
              1,
              Math.round(image.naturalWidth * (sizePercent / 100)),
            );
            height = Math.max(
              1,
              Math.round(image.naturalHeight * (sizePercent / 100)),
            );
            if (maxWidth > 0 && width > maxWidth) {
              const ratio = maxWidth / width;
              width = maxWidth;
              height = Math.max(1, Math.round(height * ratio));
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            resolve({ blob: null, url: "", width, height });
            return;
          }

          const mime = getMime(item.file, outputFormat);
          if (mime === "image/jpeg") {
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
          }
          context.drawImage(image, 0, 0, width, height);
          canvas.toBlob(
            (blob) =>
              resolve({
                blob,
                url: blob ? URL.createObjectURL(blob) : "",
                width,
                height,
              }),
            mime,
            mime === "image/png" ? undefined : quality / 100,
          );
        };
        image.onerror = () =>
          resolve({ blob: null, url: "", width: 0, height: 0 });
        image.src = item.originalUrl;
      }),
    [
      fitMode,
      isResizeMode,
      maxWidth,
      outputFormat,
      quality,
      resizeHeight,
      resizeUnit,
      resizeWidth,
      sizePercent,
    ],
  );

  const estimateKey = images
    .map((item) => `${item.id}:${item.originalSize}`)
    .join("|");

  useEffect(() => {
    if (isResizeMode || imagesRef.current.length === 0) {
      setEstimatedResultSize(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const sample = imagesRef.current.slice(0, 3);
        let sourceBytes = 0;
        let outputBytes = 0;
        for (const item of sample) {
          const result = await processOne(item);
          if (result.url) URL.revokeObjectURL(result.url);
          if (!result.blob) continue;
          sourceBytes += item.originalSize;
          outputBytes += result.blob.size;
        }
        if (cancelled || sourceBytes === 0) return;
        const total = imagesRef.current.reduce(
          (sum, item) => sum + item.originalSize,
          0,
        );
        setEstimatedResultSize(
          Math.max(1, Math.round(total * (outputBytes / sourceBytes))),
        );
      })();
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [estimateKey, isResizeMode, processOne]);

  const processAll = useCallback(async () => {
    const current = imagesRef.current;
    if (current.length === 0) return;
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setImages((items) =>
      items.map((item) => {
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        return {
          ...item,
          resultUrl: "",
          resultBlob: null,
          resultSize: 0,
          resultWidth: 0,
          resultHeight: 0,
          processing: true,
          done: false,
          error: null,
        };
      }),
    );

    for (const item of current) {
      const result = await processOne(item);
      if (generationRef.current !== generation) {
        if (result.url) URL.revokeObjectURL(result.url);
        return;
      }
      setImages((items) =>
        items.map((candidate) => {
          if (candidate.id !== item.id) return candidate;
          if (!result.blob || !result.url) {
            return {
              ...candidate,
              processing: false,
              error: isEn
                ? "Could not process this image."
                : "Не удалось обработать изображение.",
            };
          }
          if (candidate.resultUrl) URL.revokeObjectURL(candidate.resultUrl);
          return {
            ...candidate,
            resultUrl: result.url,
            resultBlob: result.blob,
            resultSize: result.blob.size,
            resultWidth: result.width,
            resultHeight: result.height,
            processing: false,
            done: true,
            error: null,
          };
        }),
      );
    }
    setProcessedSettings(settingsSignature);
  }, [isEn, processOne, settingsSignature]);

  const removeImage = useCallback((id: string) => {
    generationRef.current += 1;
    setProcessedSettings("");
    setImages((current) => {
      const item = current.find((candidate) => candidate.id === id);
      if (item) {
        URL.revokeObjectURL(item.originalUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      }
      return current.filter((candidate) => candidate.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    generationRef.current += 1;
    setProcessedSettings("");
    imagesRef.current.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    setImages([]);
  }, []);

  const downloadOne = useCallback(
    (item: ImageItem) => {
      if (!item.resultUrl || !item.resultBlob) return;
      const extension = getExtension(item.resultBlob.type);
      const base = item.file.name.replace(/\.[^.]+$/, "");
      const suffix = isResizeMode ? "_resized" : "_compressed";
      triggerDownload(item.resultUrl, `${base}${suffix}.${extension}`);
    },
    [isResizeMode],
  );

  const downloadAll = useCallback(async () => {
    const ready = imagesRef.current.filter(
      (item) => item.done && item.resultBlob && item.resultUrl,
    );
    if (ready.length === 0) return;
    if (ready.length === 1) {
      downloadOne(ready[0]);
      return;
    }

    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const used = new Set<string>();
      ready.forEach((item) => {
        if (!item.resultBlob) return;
        const extension = getExtension(item.resultBlob.type);
        const base = item.file.name.replace(/\.[^.]+$/, "");
        let name = `${base}_compressed.${extension}`;
        let counter = 2;
        while (used.has(name)) {
          name = `${base}_compressed_${counter}.${extension}`;
          counter += 1;
        }
        used.add(name);
        zip.file(name, item.resultBlob);
      });
      downloadBlob(
        await zip.generateAsync({ type: "blob" }),
        "compressed-images.zip",
      );
    } finally {
      setDownloading(false);
    }
  }, [downloadOne]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.originalUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
    },
    [],
  );

  const onWidthChange = (value: number) => {
    const next = Math.max(1, value || 1);
    setResizeWidth(next);
    if (!lockAspect) return;
    if (resizeUnit === "percent") {
      setResizeHeight(next);
      return;
    }
    const first = images[0];
    if (first) {
      setResizeHeight(
        Math.max(
          1,
          Math.round(next * (first.originalHeight / first.originalWidth)),
        ),
      );
    }
  };

  const onHeightChange = (value: number) => {
    const next = Math.max(1, value || 1);
    setResizeHeight(next);
    if (!lockAspect) return;
    if (resizeUnit === "percent") {
      setResizeWidth(next);
      return;
    }
    const first = images[0];
    if (first) {
      setResizeWidth(
        Math.max(
          1,
          Math.round(next * (first.originalWidth / first.originalHeight)),
        ),
      );
    }
  };

  const switchResizeUnit = (unit: ResizeUnit) => {
    setResizeUnit(unit);
    if (unit === "percent") {
      setResizeWidth(100);
      setResizeHeight(100);
      return;
    }
    const first = images[0];
    if (first) {
      setResizeWidth(first.originalWidth);
      setResizeHeight(first.originalHeight);
    }
  };

  const doneCount = images.filter((item) => item.done).length;
  const processing = images.some((item) => item.processing);
  const allDone =
    images.length > 0 &&
    doneCount === images.length &&
    !processing &&
    processedSettings === settingsSignature;
  const totalOriginal = images.reduce(
    (sum, item) => sum + item.originalSize,
    0,
  );
  const totalResult = images.reduce((sum, item) => sum + item.resultSize, 0);
  const savedPercent =
    totalOriginal > 0 && totalResult > 0
      ? Math.round((1 - totalResult / totalOriginal) * 100)
      : 0;
  const firstImage = images[0];

  const dropLabel = isResizeMode
    ? isEn
      ? "Upload an image to resize"
      : "Загрузите изображение для изменения размера"
    : isEn
      ? "Upload images to compress"
      : "Загрузите изображения для сжатия";

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-4xl">
      <input
        ref={fileInputRef}
        type="file"
        data-file-paste-target="true"
        accept={EXTENDED_IMAGE_ACCEPT}
        multiple={!isResizeMode}
        className="hidden"
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label={dropLabel}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void addFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "tool-short-landscape-dropzone cursor-pointer rounded-[var(--radius-lg)] border-2 border-dashed text-center transition-colors",
          images.length > 0 ? "mb-3 p-3" : "p-8 sm:p-10",
          dragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)]",
        )}
      >
        <UploadSimple
          size={images.length > 0 ? 28 : 48}
          className="mx-auto mb-2 text-[var(--color-text-muted)]"
        />
        <div className="font-semibold">{dropLabel}</div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          {isEn
            ? "HEIC, AVIF, TIFF, RAW, PSD and 100+ image formats · Ctrl+V"
            : "HEIC, AVIF, TIFF, RAW, PSD и 100+ форматов · Ctrl+V"}
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-3">
          <Card className="p-4 sm:p-5">
            {isResizeMode ? (
              <>
                <div className="mb-3 flex items-center gap-2 font-semibold">
                  <Resize size={20} />
                  {isEn ? "New size" : "Новый размер"}
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <div>
                    <Label
                      htmlFor="resize-width"
                      className="mb-1.5 block text-sm"
                    >
                      {isEn ? "Width" : "Ширина"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="resize-width"
                        type="number"
                        min={1}
                        value={resizeWidth || ""}
                        onChange={(event) =>
                          onWidthChange(Number(event.target.value))
                        }
                        className="pr-10"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[var(--color-text-muted)]">
                        {resizeUnit === "px" ? "px" : "%"}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant={lockAspect ? "soft" : "outline"}
                    onClick={() => setLockAspect((value) => !value)}
                    aria-label={
                      lockAspect
                        ? isEn
                          ? "Unlock aspect ratio"
                          : "Отключить пропорции"
                        : isEn
                          ? "Lock aspect ratio"
                          : "Сохранить пропорции"
                    }
                  >
                    {lockAspect ? <Lock size={18} /> : <LockOpen size={18} />}
                  </Button>
                  <div>
                    <Label
                      htmlFor="resize-height"
                      className="mb-1.5 block text-sm"
                    >
                      {isEn ? "Height" : "Высота"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="resize-height"
                        type="number"
                        min={1}
                        value={resizeHeight || ""}
                        onChange={(event) =>
                          onHeightChange(Number(event.target.value))
                        }
                        className="pr-10"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[var(--color-text-muted)]">
                        {resizeUnit === "px" ? "px" : "%"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MobileSlider
                  label={isEn ? "Quality" : "Качество"}
                  value={quality}
                  min={10}
                  max={100}
                  unit="%"
                  onChange={setQuality}
                />
                <div>
                  <Label className="mb-1.5 block text-sm">
                    {isEn ? "Format" : "Формат"}
                  </Label>
                  <Select
                    value={outputFormat}
                    onValueChange={(value) =>
                      setOutputFormat(value as OutputFormat)
                    }
                  >
                    <SelectTrigger
                      aria-label={isEn ? "Output format" : "Формат результата"}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image/jpeg">JPEG</SelectItem>
                      <SelectItem value="image/webp">WebP</SelectItem>
                      <SelectItem value="image/png">PNG</SelectItem>
                      <SelectItem value="original">
                        {isEn ? "Keep format" : "Сохранить формат"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">
                    {isEn ? "Image size" : "Размер изображения"}
                  </Label>
                  <Select
                    value={String(sizePercent)}
                    onValueChange={(value) => setSizePercent(Number(value))}
                  >
                    <SelectTrigger
                      aria-label={isEn ? "Image size" : "Размер изображения"}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100%</SelectItem>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </Card>

          {!isResizeMode && !allDone && estimatedResultSize !== null && (
            <div
              className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              role="status"
            >
              <span className="text-[var(--color-text-muted)]">
                {isEn
                  ? "Estimated after compression"
                  : "Расчётный размер после сжатия"}
              </span>
              <strong>
                ≈ {formatFileSize(estimatedResultSize, isEn)}
                {totalOriginal > 0 && estimatedResultSize < totalOriginal && (
                  <span className="ml-2 text-[var(--color-success)]">
                    −{Math.round((1 - estimatedResultSize / totalOriginal) * 100)}%
                  </span>
                )}
              </strong>
            </div>
          )}

          {!allDone ? (
            <Button
              size="lg"
              data-primary-action={
                isResizeMode ? "image-resize" : "image-compress"
              }
              data-primary-state="process"
              className="w-full"
              onClick={() => void processAll()}
              disabled={
                processing || (isResizeMode && (!resizeWidth || !resizeHeight))
              }
            >
              {processing
                ? isEn
                  ? "Processing…"
                  : "Обработка…"
                : isResizeMode
                  ? isEn
                    ? "Resize image"
                    : "Изменить размер"
                  : isEn
                    ? `Compress${images.length > 1 ? ` ${images.length} images` : " image"}`
                    : `Сжать${images.length > 1 ? ` ${images.length} изображения` : " изображение"}`}
            </Button>
          ) : (
            <Button
              size="lg"
              data-primary-action={
                isResizeMode ? "image-resize" : "image-compress"
              }
              data-primary-state="download"
              className="w-full"
              onClick={() => void downloadAll()}
              disabled={downloading}
            >
              {images.length > 1 ? (
                <FileZip size={20} />
              ) : (
                <Download size={20} />
              )}
              {downloading
                ? isEn
                  ? "Packing…"
                  : "Упаковка…"
                : images.length > 1
                  ? isEn
                    ? "Download ZIP"
                    : "Скачать ZIP"
                  : isEn
                    ? "Download image"
                    : "Скачать изображение"}
            </Button>
          )}

          <AdvancedSettings
            title={
              isResizeMode
                ? isEn
                  ? "More resize options"
                  : "Дополнительные настройки"
                : isEn
                  ? "More compression options"
                  : "Дополнительные настройки"
            }
            description={
              isResizeMode
                ? isEn
                  ? "Units, fit, presets and export"
                  : "Единицы, вписывание, размеры и экспорт"
                : isEn
                  ? "Width limits and metadata"
                  : "Ограничение ширины и метаданные"
            }
          >
            {isResizeMode ? (
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-sm">
                    {isEn ? "Units" : "Единицы"}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["px", "percent"] as ResizeUnit[]).map((unit) => (
                      <Button
                        key={unit}
                        type="button"
                        variant={resizeUnit === unit ? "soft" : "outline"}
                        onClick={() => switchResizeUnit(unit)}
                      >
                        {unit === "px" ? "Pixels" : "%"}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">
                    {isEn ? "Fit" : "Вписывание"}
                  </Label>
                  <Select
                    value={fitMode}
                    onValueChange={(value) => setFitMode(value as FitMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exact">
                        {isEn ? "Exact dimensions" : "Точный размер"}
                      </SelectItem>
                      <SelectItem value="inside">
                        {isEn ? "Fit inside dimensions" : "Вписать в границы"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {resizeUnit === "px" && (
                  <div>
                    <Label className="mb-1.5 block text-sm">
                      {isEn ? "Common dimensions" : "Частые размеры"}
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        [1920, 1080],
                        [1280, 720],
                        [1080, 1080],
                        [800, 600],
                      ].map(([width, height]) => (
                        <Button
                          key={`${width}x${height}`}
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setResizeWidth(width);
                            setResizeHeight(height);
                          }}
                        >
                          {width}×{height}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-sm">
                      {isEn ? "Output format" : "Формат результата"}
                    </Label>
                    <Select
                      value={outputFormat}
                      onValueChange={(value) =>
                        setOutputFormat(value as OutputFormat)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">
                          {isEn ? "Keep format" : "Сохранить формат"}
                        </SelectItem>
                        <SelectItem value="image/jpeg">JPEG</SelectItem>
                        <SelectItem value="image/png">PNG</SelectItem>
                        <SelectItem value="image/webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {outputFormat !== "image/png" && (
                    <MobileSlider
                      label={isEn ? "Quality" : "Качество"}
                      value={quality}
                      min={10}
                      max={100}
                      unit="%"
                      onChange={setQuality}
                    />
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? "Browser export creates a new image and does not copy EXIF metadata."
                    : "Браузер создаёт новое изображение и не копирует метаданные EXIF."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="compress-max-width"
                    className="mb-1.5 block text-sm"
                  >
                    {isEn ? "Maximum width" : "Максимальная ширина"}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="compress-max-width"
                      type="number"
                      min={0}
                      value={maxWidth || ""}
                      onChange={(event) =>
                        setMaxWidth(Math.max(0, Number(event.target.value)))
                      }
                      placeholder={isEn ? "No limit" : "Без ограничения"}
                    />
                    <span className="text-sm text-[var(--color-text-muted)]">
                      px
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1920, 1200, 800].map((width) => (
                    <Button
                      key={width}
                      type="button"
                      variant="outline"
                      onClick={() => setMaxWidth(width)}
                    >
                      {width}px
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? "Compressed copies are re-encoded in the browser, so EXIF metadata is not copied."
                    : "Сжатые копии перекодируются в браузере, поэтому метаданные EXIF не копируются."}
                </p>
                <Button type="button" variant="danger" onClick={clearAll}>
                  <Trash size={18} />{" "}
                  {isEn ? "Clear all images" : "Очистить изображения"}
                </Button>
              </div>
            )}
          </AdvancedSettings>

          {allDone && (
            <div
              className="grid grid-cols-3 gap-2"
              aria-label={isEn ? "Before and after" : "До и после"}
            >
              <Card className="p-3 text-center">
                <div className="text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Before" : "До"}
                </div>
                <div className="font-semibold tabular-nums">
                  {formatFileSize(totalOriginal, isEn)}
                </div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-xs text-[var(--color-text-muted)]">
                  {isEn ? "After" : "После"}
                </div>
                <div className="font-semibold tabular-nums text-[var(--color-primary)]">
                  {formatFileSize(totalResult, isEn)}
                </div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-xs text-[var(--color-text-muted)]">
                  {isResizeMode
                    ? isEn
                      ? "Output"
                      : "Результат"
                    : isEn
                      ? "Saved"
                      : "Экономия"}
                </div>
                <div className="font-semibold tabular-nums">
                  {isResizeMode && firstImage
                    ? `${firstImage.resultWidth}×${firstImage.resultHeight}`
                    : `${savedPercent}%`}
                </div>
              </Card>
            </div>
          )}

          <div className="space-y-2">
            {images.map((item) => (
              <Card key={item.id} className="flex items-center gap-3 p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      allDone && item.resultUrl
                        ? item.resultUrl
                        : item.originalUrl
                    }
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {item.file.name}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {item.originalWidth}×{item.originalHeight} ·{" "}
                    {formatFileSize(item.originalSize, isEn)}
                  </div>
                  {allDone && item.done && (
                    <div className="text-xs font-medium text-[var(--color-primary)]">
                      → {item.resultWidth}×{item.resultHeight} ·{" "}
                      {formatFileSize(item.resultSize, isEn)}
                    </div>
                  )}
                  {item.error && (
                    <div
                      className="text-xs text-[var(--color-danger)]"
                      role="status"
                    >
                      {item.error}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeImage(item.id)}
                  disabled={processing}
                  aria-label={
                    isEn
                      ? `Remove ${item.file.name}`
                      : `Удалить ${item.file.name}`
                  }
                >
                  <X size={18} />
                </Button>
              </Card>
            ))}
          </div>

          {isResizeMode && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearAll}
              className="w-full text-[var(--color-danger)]"
            >
              <Trash size={18} />{" "}
              {isEn ? "Choose another image" : "Выбрать другое изображение"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
