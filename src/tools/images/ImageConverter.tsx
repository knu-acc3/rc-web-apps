"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  FileZip,
  Image as ImageIcon,
  Lock,
  LockOpen,
  Sparkle,
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

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

interface ImageItem {
  id: string;
  file: File;
  sourceUrl: string;
  sourceWidth: number;
  sourceHeight: number;
  resultUrl: string;
  resultBlob: Blob | null;
  resultWidth: number;
  resultHeight: number;
  status: "ready" | "processing" | "done" | "error";
  error: string | null;
}

function formatSize(bytes: number, isEn: boolean): string {
  if (bytes <= 0) return isEn ? "0 B" : "0 Б";
  const units = isEn ? ["B", "KB", "MB", "GB"] : ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatLabel(type: string): string {
  if (type === "image/jpeg") return "JPEG";
  if (type === "image/webp") return "WebP";
  if (type === "image/png") return "PNG";
  return "Image";
}

function extensionFor(type: OutputFormat): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return "png";
}

let converterId = 0;

export default function ImageConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [images, setImages] = useState<ImageItem[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(88);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [targetWidth, setTargetWidth] = useState(1920);
  const [targetHeight, setTargetHeight] = useState(1080);
  const [lockAspect, setLockAspect] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [processedSettings, setProcessedSettings] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageItem[]>([]);
  const generationRef = useRef(0);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const settingsSignature = [
    outputFormat,
    quality,
    resizeEnabled,
    targetWidth,
    targetHeight,
  ].join("|");

  const addFiles = useCallback(async (incoming: File[]) => {
    const supported = incoming.filter(isExtendedImageFile);
    if (supported.length === 0) return;

    const normalized = await normalizeImagesForBrowser(supported);
    const files = normalized.map((file, index) =>
      file === supported[index]
        ? file
        : new File([file], supported[index].name, {
            type: file.type,
            lastModified: supported[index].lastModified,
          }),
    );
    const additions: ImageItem[] = [];

    for (const file of files) {
      const sourceUrl = URL.createObjectURL(file);
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve) => {
          const image = new Image();
          image.onload = () =>
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => resolve({ width: 0, height: 0 });
          image.src = sourceUrl;
        },
      );
      if (dimensions.width === 0 || dimensions.height === 0) {
        URL.revokeObjectURL(sourceUrl);
        continue;
      }
      additions.push({
        id: `convert_${++converterId}`,
        file,
        sourceUrl,
        sourceWidth: dimensions.width,
        sourceHeight: dimensions.height,
        resultUrl: "",
        resultBlob: null,
        resultWidth: 0,
        resultHeight: 0,
        status: "ready",
        error: null,
      });
    }

    if (additions.length === 0) return;
    generationRef.current += 1;
    setProcessedSettings("");
    setImages((current) => {
      current.forEach((item) => {
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
      return [
        ...current.map((item) => ({
          ...item,
          resultUrl: "",
          resultBlob: null,
          resultWidth: 0,
          resultHeight: 0,
          status: "ready" as const,
          error: null,
        })),
        ...additions,
      ];
    });

    if (imagesRef.current.length === 0 && additions[0]) {
      setTargetWidth(additions[0].sourceWidth);
      setTargetHeight(additions[0].sourceHeight);
    }
  }, []);

  const convertOne = useCallback(
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
          let width = image.naturalWidth;
          let height = image.naturalHeight;
          if (resizeEnabled) {
            const ratio = Math.min(
              Math.max(1, targetWidth) / image.naturalWidth,
              Math.max(1, targetHeight) / image.naturalHeight,
            );
            width = Math.max(1, Math.round(image.naturalWidth * ratio));
            height = Math.max(1, Math.round(image.naturalHeight * ratio));
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            resolve({ blob: null, url: "", width, height });
            return;
          }
          if (outputFormat === "image/jpeg") {
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
            outputFormat,
            outputFormat === "image/png" ? undefined : quality / 100,
          );
        };
        image.onerror = () =>
          resolve({ blob: null, url: "", width: 0, height: 0 });
        image.src = item.sourceUrl;
      }),
    [outputFormat, quality, resizeEnabled, targetHeight, targetWidth],
  );

  const convertAll = useCallback(async () => {
    const current = imagesRef.current;
    if (current.length === 0) return;
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setProcessedSettings("");
    setImages((items) =>
      items.map((item) => {
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        return {
          ...item,
          resultUrl: "",
          resultBlob: null,
          resultWidth: 0,
          resultHeight: 0,
          status: "processing",
          error: null,
        };
      }),
    );

    for (const item of current) {
      const result = await convertOne(item);
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
              status: "error",
              error: isEn
                ? "Could not convert this image."
                : "Не удалось конвертировать изображение.",
            };
          }
          return {
            ...candidate,
            resultUrl: result.url,
            resultBlob: result.blob,
            resultWidth: result.width,
            resultHeight: result.height,
            status: "done",
            error: null,
          };
        }),
      );
    }
    setProcessedSettings(settingsSignature);
  }, [convertOne, isEn, settingsSignature]);

  const removeImage = useCallback((id: string) => {
    generationRef.current += 1;
    setProcessedSettings("");
    setImages((current) => {
      const item = current.find((candidate) => candidate.id === id);
      if (item) {
        URL.revokeObjectURL(item.sourceUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      }
      return current.filter((candidate) => candidate.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    generationRef.current += 1;
    setProcessedSettings("");
    imagesRef.current.forEach((item) => {
      URL.revokeObjectURL(item.sourceUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    setImages([]);
  }, []);

  const downloadItem = useCallback(
    (item: ImageItem) => {
      if (!item.resultUrl) return;
      const name = item.file.name.replace(/\.[^.]+$/, "");
      triggerDownload(item.resultUrl, `${name}.${extensionFor(outputFormat)}`);
    },
    [outputFormat],
  );

  const downloadAll = useCallback(async () => {
    const ready = imagesRef.current.filter(
      (item) => item.status === "done" && item.resultBlob && item.resultUrl,
    );
    if (ready.length === 0) return;
    if (ready.length === 1) {
      downloadItem(ready[0]);
      return;
    }
    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const used = new Set<string>();
      ready.forEach((item) => {
        if (!item.resultBlob) return;
        const base = item.file.name.replace(/\.[^.]+$/, "");
        let name = `${base}.${extensionFor(outputFormat)}`;
        let counter = 2;
        while (used.has(name)) {
          name = `${base}_${counter}.${extensionFor(outputFormat)}`;
          counter += 1;
        }
        used.add(name);
        zip.file(name, item.resultBlob);
      });
      downloadBlob(
        await zip.generateAsync({ type: "blob" }),
        "converted-images.zip",
      );
    } finally {
      setDownloading(false);
    }
  }, [downloadItem, outputFormat]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.sourceUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
    },
    [],
  );

  const onWidthChange = (value: number) => {
    const next = Math.max(1, value || 1);
    setTargetWidth(next);
    if (!lockAspect || !images[0]) return;
    setTargetHeight(
      Math.max(
        1,
        Math.round(next * (images[0].sourceHeight / images[0].sourceWidth)),
      ),
    );
  };

  const onHeightChange = (value: number) => {
    const next = Math.max(1, value || 1);
    setTargetHeight(next);
    if (!lockAspect || !images[0]) return;
    setTargetWidth(
      Math.max(
        1,
        Math.round(next * (images[0].sourceWidth / images[0].sourceHeight)),
      ),
    );
  };

  const sourceFormats = Array.from(
    new Set(images.map((item) => formatLabel(item.file.type))),
  ).join(" + ");
  const doneCount = images.filter((item) => item.status === "done").length;
  const converting = images.some((item) => item.status === "processing");
  const allDone =
    images.length > 0 &&
    doneCount === images.length &&
    !converting &&
    processedSettings === settingsSignature;
  const first = images[0];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <input
        ref={inputRef}
        type="file"
        multiple
        data-file-paste-target="true"
        accept={EXTENDED_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />

      {/* 1-Click Quick Target Format Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-[var(--color-primary)]" />
          {isEn ? "Target format:" : "Формат результата:"}
        </span>
        {[
          { key: "image/webp", label: "WebP (быстрый и легкий)", labelEn: "WebP (modern & light)" },
          { key: "image/png", label: "PNG (без потерь)", labelEn: "PNG (lossless)" },
          { key: "image/jpeg", label: "JPEG (фото)", labelEn: "JPEG (photos)" },
        ].map((fmt) => {
          const isActive = outputFormat === fmt.key;
          return (
            <button
              key={fmt.key}
              type="button"
              onClick={() => setOutputFormat(fmt.key as OutputFormat)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
              )}
            >
              {isEn ? fmt.labelEn : fmt.label}
            </button>
          );
        })}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={
          isEn
            ? "Upload images to convert"
            : "Загрузить изображения для конвертации"
        }
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
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
        <div className="font-semibold">
          {isEn ? "Upload images" : "Загрузите изображения"}
        </div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          {isEn
            ? "HEIC, AVIF, TIFF, RAW, PSD and 100+ image formats · Ctrl+V"
            : "HEIC, AVIF, TIFF, RAW, PSD и 100+ форматов · Ctrl+V"}
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-3">
          <Card className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-sm">
                  {isEn ? "From" : "Из"}
                </Label>
                <div className="flex min-h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm font-medium">
                  {sourceFormats}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">
                  {isEn ? "To" : "В"}
                </Label>
                <Select
                  value={outputFormat}
                  onValueChange={(value) =>
                    setOutputFormat(value as OutputFormat)
                  }
                >
                  <SelectTrigger
                    aria-label={isEn ? "Target format" : "Целевой формат"}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/jpeg">JPEG</SelectItem>
                    <SelectItem value="image/webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={resizeEnabled}
                onChange={(event) => setResizeEnabled(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn
                ? "Resize while converting"
                : "Изменить размер при конвертации"}
            </label>

            {resizeEnabled && (
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div>
                  <Label
                    htmlFor="convert-width"
                    className="mb-1.5 block text-sm"
                  >
                    {isEn ? "Max width" : "Макс. ширина"}
                  </Label>
                  <Input
                    id="convert-width"
                    type="number"
                    min={1}
                    value={targetWidth}
                    onChange={(event) =>
                      onWidthChange(Number(event.target.value))
                    }
                  />
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
                    htmlFor="convert-height"
                    className="mb-1.5 block text-sm"
                  >
                    {isEn ? "Max height" : "Макс. высота"}
                  </Label>
                  <Input
                    id="convert-height"
                    type="number"
                    min={1}
                    value={targetHeight}
                    onChange={(event) =>
                      onHeightChange(Number(event.target.value))
                    }
                  />
                </div>
              </div>
            )}
          </Card>

          {!allDone ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                size="lg"
                data-primary-action="image-convert"
                data-primary-state="convert"
                className="h-11 w-auto min-w-[200px] px-6 shadow-sm"
                onClick={() => void convertAll()}
                disabled={
                  converting || (resizeEnabled && (!targetWidth || !targetHeight))
                }
              >
                {converting
                  ? isEn
                    ? "Converting…"
                    : "Конвертация…"
                  : isEn
                    ? `Convert all (${images.length})`
                    : `Конвертировать все (${images.length})`}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                size="lg"
                data-primary-action="image-convert"
                data-primary-state="download"
                className="h-11 w-auto min-w-[200px] px-6 shadow-sm"
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
            </div>
          )}

          <AdvancedSettings
            title={isEn ? "Export options" : "Настройки экспорта"}
            description={
              isEn ? "Quality and metadata" : "Качество и метаданные"
            }
          >
            <div className="space-y-4">
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
              <p className="text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? "Conversion creates a new browser-encoded file. Original metadata is not copied."
                  : "Конвертация создаёт новый файл в браузере. Исходные метаданные не копируются."}
              </p>
              <Button type="button" variant="danger" onClick={clearAll}>
                <Trash size={18} />{" "}
                {isEn ? "Clear all images" : "Очистить изображения"}
              </Button>
            </div>
          </AdvancedSettings>

          {allDone && first?.resultUrl && (
            <Card className="p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <ImageIcon size={20} /> {isEn ? "Preview" : "Предпросмотр"}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-center text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Original" : "Оригинал"}
                  </div>
                  <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={first.sourceUrl}
                      alt={isEn ? "Original preview" : "Предпросмотр оригинала"}
                      className="max-h-72 max-w-full object-contain"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-center text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Converted" : "Результат"}
                  </div>
                  <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={first.resultUrl}
                      alt={
                        isEn ? "Converted preview" : "Предпросмотр результата"
                      }
                      className="max-h-72 max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {images.map((item) => (
              <Card key={item.id} className="flex items-center gap-3 p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      allDone && item.resultUrl
                        ? item.resultUrl
                        : item.sourceUrl
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
                    {formatLabel(item.file.type)} · {item.sourceWidth}×
                    {item.sourceHeight} · {formatSize(item.file.size, isEn)}
                  </div>
                  {allDone && item.resultBlob && (
                    <div className="text-xs font-medium text-[var(--color-primary)]">
                      → {formatLabel(outputFormat)} · {item.resultWidth}×
                      {item.resultHeight} ·{" "}
                      {formatSize(item.resultBlob.size, isEn)}
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
                  disabled={converting}
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
        </div>
      )}
    </div>
  );
}
