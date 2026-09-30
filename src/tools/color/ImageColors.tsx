"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { DownloadSimple, Palette, UploadSimple } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
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
import { downloadBlob } from "@/src/utils/exportHelpers";
import { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile, normalizeImageForBrowser } from "@/src/lib/file-conversion/image-engine";

interface Pixel {
  r: number;
  g: number;
  b: number;
}

interface PaletteColor extends Pixel {
  hex: string;
  count: number;
  percentage: number;
}

interface ImagePaletteResult {
  colors: PaletteColor[];
  fileName: string;
  width: number;
  height: number;
}

interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}

type ExtractionAlgorithm = "balanced" | "dominant";
type ExportFormat = "css" | "json";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_CANVAS_SIDE = 640;
const MAX_PIXELS_TO_READ = 50_000;

function rgbToHex({ r, g, b }: Pixel): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function readPixels(imageData: ImageData): Pixel[] {
  const totalPixels = imageData.width * imageData.height;
  const stride = Math.max(1, Math.floor(totalPixels / MAX_PIXELS_TO_READ));
  const pixels: Pixel[] = [];

  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += stride) {
    const offset = pixelIndex * 4;
    if (imageData.data[offset + 3] < 128) continue;
    pixels.push({
      r: imageData.data[offset],
      g: imageData.data[offset + 1],
      b: imageData.data[offset + 2],
    });
  }

  return pixels;
}

function getChannelRange(pixels: Pixel[]): {
  channel: keyof Pixel;
  range: number;
} {
  let redMin = 255;
  let redMax = 0;
  let greenMin = 255;
  let greenMax = 0;
  let blueMin = 255;
  let blueMax = 0;

  for (const pixel of pixels) {
    redMin = Math.min(redMin, pixel.r);
    redMax = Math.max(redMax, pixel.r);
    greenMin = Math.min(greenMin, pixel.g);
    greenMax = Math.max(greenMax, pixel.g);
    blueMin = Math.min(blueMin, pixel.b);
    blueMax = Math.max(blueMax, pixel.b);
  }

  const ranges = {
    r: redMax - redMin,
    g: greenMax - greenMin,
    b: blueMax - blueMin,
  };
  const channel = (Object.keys(ranges) as Array<keyof Pixel>).reduce(
    (largest, current) =>
      ranges[current] > ranges[largest] ? current : largest,
    "r",
  );
  return { channel, range: ranges[channel] };
}

function averageBucket(pixels: Pixel[], total: number): PaletteColor {
  let red = 0;
  let green = 0;
  let blue = 0;

  for (const pixel of pixels) {
    red += pixel.r;
    green += pixel.g;
    blue += pixel.b;
  }

  const color = {
    r: Math.round(red / pixels.length),
    g: Math.round(green / pixels.length),
    b: Math.round(blue / pixels.length),
  };
  return {
    ...color,
    hex: rgbToHex(color),
    count: pixels.length,
    percentage: (pixels.length / total) * 100,
  };
}

function mergeDuplicateColors(
  colors: PaletteColor[],
  total: number,
): PaletteColor[] {
  const merged = new Map<string, PaletteColor>();

  for (const color of colors) {
    const current = merged.get(color.hex);
    if (current) {
      current.count += color.count;
      current.percentage = (current.count / total) * 100;
    } else {
      merged.set(color.hex, { ...color });
    }
  }

  return Array.from(merged.values()).sort(
    (first, second) => second.count - first.count,
  );
}

function extractBalanced(
  pixels: Pixel[],
  requestedCount: number,
): PaletteColor[] {
  const buckets: Pixel[][] = [pixels];

  while (buckets.length < requestedCount) {
    let chosenIndex = -1;
    let chosenChannel: keyof Pixel = "r";
    let chosenScore = -1;

    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index];
      if (bucket.length < 2) continue;
      const { channel, range } = getChannelRange(bucket);
      const score = range * bucket.length;
      if (score > chosenScore) {
        chosenIndex = index;
        chosenChannel = channel;
        chosenScore = score;
      }
    }

    if (chosenIndex < 0) break;
    const chosenBucket = [...buckets[chosenIndex]].sort(
      (first, second) => first[chosenChannel] - second[chosenChannel],
    );
    const middle = Math.floor(chosenBucket.length / 2);
    buckets.splice(
      chosenIndex,
      1,
      chosenBucket.slice(0, middle),
      chosenBucket.slice(middle),
    );
  }

  const colors = buckets
    .filter((bucket) => bucket.length > 0)
    .map((bucket) => averageBucket(bucket, pixels.length));
  return mergeDuplicateColors(colors, pixels.length).slice(0, requestedCount);
}

function extractDominant(
  pixels: Pixel[],
  requestedCount: number,
): PaletteColor[] {
  const bins = new Map<
    number,
    { red: number; green: number; blue: number; count: number }
  >();

  for (const pixel of pixels) {
    const key = (pixel.r >> 4) * 256 + (pixel.g >> 4) * 16 + (pixel.b >> 4);
    const bin = bins.get(key);
    if (bin) {
      bin.red += pixel.r;
      bin.green += pixel.g;
      bin.blue += pixel.b;
      bin.count += 1;
    } else {
      bins.set(key, {
        red: pixel.r,
        green: pixel.g,
        blue: pixel.b,
        count: 1,
      });
    }
  }

  return Array.from(bins.values())
    .sort((first, second) => second.count - first.count)
    .slice(0, requestedCount)
    .map((bin) => {
      const color = {
        r: Math.round(bin.red / bin.count),
        g: Math.round(bin.green / bin.count),
        b: Math.round(bin.blue / bin.count),
      };
      return {
        ...color,
        hex: rgbToHex(color),
        count: bin.count,
        percentage: (bin.count / pixels.length) * 100,
      };
    });
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  const image = document.createElement("img");
  image.decoding = "async";
  image.src = url;
  try {
    await image.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => URL.revokeObjectURL(url),
  };
}

async function getImagePixels(file: File): Promise<{
  pixels: Pixel[];
  width: number;
  height: number;
}> {
  const loaded = await loadImage(file);
  try {
    if (loaded.width < 1 || loaded.height < 1) throw new Error("Empty image");
    const scale = Math.min(
      1,
      MAX_CANVAS_SIDE / Math.max(loaded.width, loaded.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(loaded.width * scale));
    canvas.height = Math.max(1, Math.round(loaded.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(loaded.source, 0, 0, canvas.width, canvas.height);
    const pixels = readPixels(
      context.getImageData(0, 0, canvas.width, canvas.height),
    );
    if (pixels.length === 0) throw new Error("No visible pixels");
    return { pixels, width: loaded.width, height: loaded.height };
  } finally {
    loaded.dispose();
  }
}

function buildExport(colors: PaletteColor[], format: ExportFormat): string {
  if (format === "json") {
    return JSON.stringify(
      colors.map(({ hex, r, g, b, percentage }) => ({
        hex,
        rgb: [r, g, b],
        percentage: Number(percentage.toFixed(2)),
      })),
      null,
      2,
    );
  }

  return `:root {\n${colors
    .map((color, index) => `  --image-color-${index + 1}: ${color.hex};`)
    .join("\n")}\n}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return (
    withoutExtension.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") ||
    "image"
  );
}

export default function ImageColors() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const extractionIdRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [colorCountInput, setColorCountInput] = useState("6");
  const [algorithm, setAlgorithm] = useState<ExtractionAlgorithm>("balanced");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const [result, setResult] = useState<ImagePaletteResult | null>(null);

  const colorCount = Number(colorCountInput);
  const colorCountValid =
    Number.isInteger(colorCount) && colorCount >= 3 && colorCount <= 12;
  const exportText = result ? buildExport(result.colors, exportFormat) : "";

  const releaseObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) return;
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      extractionIdRef.current += 1;
      releaseObjectUrl();
    };
  }, [releaseObjectUrl]);

  const acceptFile = async (nextFile: File) => {
    if (!isExtendedImageFile(nextFile)) {
      setError(
        isEn
          ? "Choose a supported image file."
          : "Выберите поддерживаемый файл изображения.",
      );
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError(
        isEn
          ? "The image must be 20 MB or smaller."
          : "Размер изображения не должен превышать 20 МБ.",
      );
      return;
    }

    let browserFile: File;
    try {
      browserFile = await normalizeImageForBrowser(nextFile);
    } catch {
      setError(
        isEn
          ? "This image format could not be decoded."
          : "Не удалось декодировать этот формат изображения.",
      );
      return;
    }

    extractionIdRef.current += 1;
    setLoading(false);
    releaseObjectUrl();
    const url = URL.createObjectURL(browserFile);
    objectUrlRef.current = url;
    setPreviewUrl(url);
    setFile(browserFile);
    setResult(null);
    setError("");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (nextFile) void acceptFile(nextFile);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const nextFile = event.dataTransfer.files[0];
    if (nextFile) void acceptFile(nextFile);
  };

  const handleUploadKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    inputRef.current?.click();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !colorCountValid || loading) return;

    const extractionId = extractionIdRef.current + 1;
    extractionIdRef.current = extractionId;
    setLoading(true);
    setError("");

    try {
      const image = await getImagePixels(file);
      if (extractionId !== extractionIdRef.current) return;
      const colors =
        algorithm === "dominant"
          ? extractDominant(image.pixels, colorCount)
          : extractBalanced(image.pixels, colorCount);
      if (colors.length === 0) throw new Error("Palette is empty");
      setResult({
        colors,
        fileName: file.name,
        width: image.width,
        height: image.height,
      });
    } catch {
      if (extractionId !== extractionIdRef.current) return;
      setResult(null);
      setError(
        isEn
          ? "Could not read this image. Choose another file."
          : "Не удалось прочитать изображение. Выберите другой файл.",
      );
    } finally {
      if (extractionId === extractionIdRef.current) setLoading(false);
    }
  };

  const resetExtraction = () => {
    extractionIdRef.current += 1;
    setLoading(false);
    setResult(null);
  };

  const downloadPalette = () => {
    if (!result) return;
    const extension = exportFormat === "json" ? "json" : "css";
    const mime = exportFormat === "json" ? "application/json" : "text/css";
    downloadBlob(
      new Blob([exportText], { type: `${mime};charset=utf-8` }),
      `${safeBaseName(result.fileName)}-colors.${extension}`,
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Card className="p-4 sm:p-5">
          <input
            ref={inputRef}
            type="file"
            data-file-paste-target="true"
            accept={EXTENDED_IMAGE_ACCEPT}
            onChange={handleFileChange}
            className="sr-only"
            aria-describedby="image-colors-privacy image-colors-error"
          />

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={handleUploadKeyDown}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node))
                return;
              setDragging(false);
            }}
            onDrop={handleDrop}
            aria-label={
              file
                ? isEn
                  ? "Choose another image"
                  : "Выбрать другое изображение"
                : isEn
                  ? "Choose an image"
                  : "Выбрать изображение"
            }
            className={cn(
              "flex min-h-44 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] sm:p-4",
              dragging &&
                "border-[var(--color-primary)] bg-[var(--color-primary-soft)]",
            )}
          >
            {previewUrl && file ? (
              <>
                <div className="relative h-32 w-full overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface)] sm:h-40">
                  <Image
                    src={previewUrl}
                    alt={file.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 90vw, 640px"
                    className="object-contain"
                  />
                </div>
                <p className="mt-3 max-w-full truncate text-sm font-semibold">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(file.size)} ·{" "}
                  {isEn ? "Choose another" : "Заменить"}
                </p>
              </>
            ) : (
              <>
                <UploadSimple
                  size={30}
                  className="text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-bold">
                  {isEn ? "Choose an image" : "Выберите изображение"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  PNG, JPEG, WebP, AVIF · {isEn ? "up to 20 MB" : "до 20 МБ"}
                </p>
              </>
            )}
          </div>

          <p
            id="image-colors-privacy"
            className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]"
          >
            {isEn
              ? "Processed only in this browser. The image is not uploaded."
              : "Обработка выполняется только в этом браузере. Изображение никуда не загружается."}
          </p>
          {error ? (
            <p
              id="image-colors-error"
              role="alert"
              className="mt-2 text-sm text-[var(--color-danger)]"
            >
              {error}
            </p>
          ) : null}
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!file || !colorCountValid}
          loading={loading}
          loadingLabel={isEn ? "Extracting…" : "Извлекаем…"}
          leadingIcon={<Palette size={20} />}
        >
          {isEn ? "Extract colors" : "Извлечь цвета"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={
            isEn ? "Palette settings and export" : "Настройки палитры и экспорт"
          }
          description={
            isEn
              ? "Color count, extraction method and file format"
              : "Количество цветов, метод извлечения и формат файла"
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="image-colors-count">
                {isEn ? "Number of colors" : "Количество цветов"}
              </Label>
              <Input
                id="image-colors-count"
                type="number"
                min={3}
                max={12}
                step={1}
                inputMode="numeric"
                value={colorCountInput}
                disabled={loading}
                onChange={(event) => {
                  setColorCountInput(event.target.value);
                  resetExtraction();
                }}
                aria-invalid={!colorCountValid}
                aria-describedby="image-colors-count-help"
                className={cn(
                  "mt-1.5 h-11 font-mono",
                  !colorCountValid && "border-[var(--color-danger)]",
                )}
              />
              <p
                id="image-colors-count-help"
                className={cn(
                  "mt-1 text-xs text-[var(--color-text-muted)]",
                  !colorCountValid && "text-[var(--color-danger)]",
                )}
              >
                {colorCountValid
                  ? "3–12"
                  : isEn
                    ? "Enter 3 to 12."
                    : "Введите от 3 до 12."}
              </p>
            </div>

            <div>
              <Label htmlFor="image-colors-algorithm">
                {isEn ? "Method" : "Метод"}
              </Label>
              <Select
                value={algorithm}
                disabled={loading}
                onValueChange={(value) => {
                  setAlgorithm(value as ExtractionAlgorithm);
                  resetExtraction();
                }}
              >
                <SelectTrigger
                  id="image-colors-algorithm"
                  className="mt-1.5 h-11"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">
                    {isEn ? "Balanced" : "Сбалансированный"}
                  </SelectItem>
                  <SelectItem value="dominant">
                    {isEn ? "Dominant colors" : "Доминирующие цвета"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="image-colors-export">
                {isEn ? "Export format" : "Формат экспорта"}
              </Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as ExportFormat)
                }
              >
                <SelectTrigger id="image-colors-export" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="css">CSS variables</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {result ? (
              <CopyButton
                text={exportText}
                size="medium"
                tooltip={isEn ? "Copy export" : "Копировать экспорт"}
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={!result}
              onClick={downloadPalette}
            >
              <DownloadSimple size={18} />
              {isEn ? "Download" : "Скачать"}
            </Button>
            {!result ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Extract colors before exporting."
                  : "Сначала извлеките цвета."}
              </p>
            ) : null}
          </div>
        </AdvancedSettings>
      </form>

      {result ? (
        <Card className="p-4 sm:p-5" aria-live="polite">
          <div className="mb-3 flex min-w-0 items-baseline justify-between gap-3">
            <h2 className="text-base font-bold">
              {isEn ? "Palette" : "Палитра"}
            </h2>
            <span className="min-w-0 truncate text-xs text-[var(--color-text-muted)]">
              {result.width} × {result.height}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {result.colors.map((color, index) => (
              <div
                key={`${color.hex}-${index}`}
                className="min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div
                  className="h-16 w-full"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex min-w-0 items-center gap-1 px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-semibold">
                      {color.hex}
                    </p>
                    <p className="text-[0.68rem] text-[var(--color-text-muted)]">
                      {color.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <CopyButton text={color.hex} size="medium" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
