"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Download,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { triggerDownload } from "@/src/utils/exportHelpers";
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
import { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile, normalizeImageForBrowser } from "@/src/lib/file-conversion/image-engine";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

function formatSize(bytes: number, isEn: boolean): string {
  if (bytes <= 0) return isEn ? "0 B" : "0 Б";
  if (bytes < 1024) return `${bytes} ${isEn ? "B" : "Б"}`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} ${isEn ? "KB" : "КБ"}`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} ${isEn ? "MB" : "МБ"}`;
}

function extensionFor(format: OutputFormat): string {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/webp") return "webp";
  return "png";
}

export default function ImageRotate() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(92);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const generationRef = useRef(0);

  const renderResult = useCallback(
    (
      image: HTMLImageElement,
      angle: number,
      horizontal: boolean,
      vertical: boolean,
      format: OutputFormat,
      exportQuality: number,
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      const radians = (angle * Math.PI) / 180;
      const cosine = Math.abs(Math.cos(radians));
      const sine = Math.abs(Math.sin(radians));
      const width = Math.max(
        1,
        Math.round(image.naturalWidth * cosine + image.naturalHeight * sine),
      );
      const height = Math.max(
        1,
        Math.round(image.naturalWidth * sine + image.naturalHeight * cosine),
      );
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return;
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      } else {
        context.clearRect(0, 0, width, height);
      }
      context.save();
      context.translate(width / 2, height / 2);
      context.rotate(radians);
      context.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
      context.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
      );
      context.restore();
      canvas.toBlob(
        (blob) => {
          if (!blob || generationRef.current !== generation) return;
          if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
          const url = URL.createObjectURL(blob);
          resultUrlRef.current = url;
          setResultUrl(url);
          setResultSize(blob.size);
        },
        format,
        format === "image/png" ? undefined : exportQuality / 100,
      );
    },
    [],
  );

  const loadFile = useCallback(
    async (incoming: File) => {
      if (!isExtendedImageFile(incoming)) return;
      const normalized = await normalizeImageForBrowser(incoming);
      if (!["image/jpeg", "image/png", "image/webp"].includes(normalized.type)) {
        return;
      }

      generationRef.current += 1;
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = "";
      setResultUrl("");
      setResultSize(0);
      setRotation(0);
      setFlipHorizontal(false);
      setFlipVertical(false);
      setFile(normalized);

      const nextFormat: OutputFormat =
        normalized.type === "image/jpeg" ||
        normalized.type === "image/png" ||
        normalized.type === "image/webp"
          ? normalized.type
          : "image/png";
      setOutputFormat(nextFormat);
      const url = URL.createObjectURL(normalized);
      sourceUrlRef.current = url;
      setSourceUrl(url);

      const image = new Image();
      image.onload = () => {
        imageRef.current = image;
        renderResult(image, 0, false, false, nextFormat, quality);
      };
      image.src = url;
    },
    [quality, renderResult],
  );

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const timer = window.setTimeout(
      () =>
        renderResult(
          image,
          rotation,
          flipHorizontal,
          flipVertical,
          outputFormat,
          quality,
        ),
      80,
    );
    return () => window.clearTimeout(timer);
  }, [flipHorizontal, flipVertical, outputFormat, quality, renderResult, rotation]);

  useEffect(
    () => () => {
      generationRef.current += 1;
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [],
  );

  const rotateBy = (degrees: number) => {
    setRotation((current) => {
      const next = (current + degrees) % 360;
      return next < 0 ? next + 360 : next;
    });
  };

  const clearImage = () => {
    generationRef.current += 1;
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    sourceUrlRef.current = "";
    resultUrlRef.current = "";
    imageRef.current = null;
    setFile(null);
    setSourceUrl("");
    setResultUrl("");
    setResultSize(0);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
  };

  const saveImage = () => {
    if (!file || !resultUrl) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    triggerDownload(resultUrl, `${base}_rotated.${extensionFor(outputFormat)}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={inputRef}
        type="file"
        data-file-paste-target="true"
        accept={EXTENDED_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) void loadFile(selected);
          event.currentTarget.value = "";
        }}
      />

      {!file ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={isEn ? "Upload an image to rotate" : "Загрузить изображение для поворота"}
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
            const selected = event.dataTransfer.files[0];
            if (selected) void loadFile(selected);
          }}
          className={cn(
            "cursor-pointer rounded-[var(--radius-lg)] border-2 border-dashed p-8 text-center transition-colors sm:p-10",
            dragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
              : "border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)]",
          )}
        >
          <UploadSimple size={48} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <div className="font-semibold">
            {isEn ? "Upload an image" : "Загрузите изображение"}
          </div>
          <div className="mt-1 text-sm text-[var(--color-text-muted)]">
            {isEn ? "JPEG, PNG or WebP" : "JPEG, PNG или WebP"}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Card className="p-3 sm:p-5">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <ImageIcon size={20} /> {isEn ? "Preview" : "Предпросмотр"}
            </div>
            <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl || sourceUrl}
                alt={isEn ? "Rotated preview" : "Предпросмотр поворота"}
                className="max-h-[520px] max-w-full object-contain"
              />
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={isEn ? "Rotate and flip" : "Поворот и отражение"}>
            <Button type="button" variant="outline" onClick={() => rotateBy(-90)}>
              <ArrowCounterClockwise size={18} /> -90°
            </Button>
            <Button type="button" variant="outline" onClick={() => rotateBy(90)}>
              <ArrowClockwise size={18} /> +90°
            </Button>
            <Button
              type="button"
              variant={flipHorizontal ? "soft" : "outline"}
              onClick={() => setFlipHorizontal((value) => !value)}
              aria-pressed={flipHorizontal}
            >
              <FlipHorizontal size={18} /> {isEn ? "Flip H" : "По X"}
            </Button>
            <Button
              type="button"
              variant={flipVertical ? "soft" : "outline"}
              onClick={() => setFlipVertical((value) => !value)}
              aria-pressed={flipVertical}
            >
              <FlipVertical size={18} /> {isEn ? "Flip V" : "По Y"}
            </Button>
          </div>

          <AdvancedSettings
            title={isEn ? "More options" : "Дополнительные настройки"}
            description={isEn ? "Custom angle, format and quality" : "Свой угол, формат и качество"}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px] sm:items-end">
                <MobileSlider
                  label={isEn ? "Custom angle" : "Произвольный угол"}
                  value={rotation}
                  min={0}
                  max={359}
                  unit="°"
                  onChange={setRotation}
                />
                <div>
                  <Label htmlFor="rotate-angle" className="mb-1.5 block text-sm">
                    {isEn ? "Degrees" : "Градусы"}
                  </Label>
                  <Input
                    id="rotate-angle"
                    type="number"
                    min={0}
                    max={359}
                    value={rotation}
                    onChange={(event) => {
                      const value = Number(event.target.value) || 0;
                      setRotation(((value % 360) + 360) % 360);
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm">
                    {isEn ? "Format" : "Формат"}
                  </Label>
                  <Select
                    value={outputFormat}
                    onValueChange={(value) => setOutputFormat(value as OutputFormat)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image/png">PNG</SelectItem>
                      <SelectItem value="image/jpeg">JPEG</SelectItem>
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
              <Button type="button" variant="danger" onClick={clearImage}>
                <Trash size={18} /> {isEn ? "Choose another image" : "Выбрать другое изображение"}
              </Button>
            </div>
          </AdvancedSettings>

          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={saveImage}
            disabled={!resultUrl}
          >
            <Download size={20} /> {isEn ? "Save image" : "Сохранить изображение"}
          </Button>

          <div className="text-center text-sm text-[var(--color-text-muted)]">
            {rotation}° · {resultUrl ? formatSize(resultSize, isEn) : isEn ? "Rendering…" : "Обработка…"}
          </div>
        </div>
      )}
    </div>
  );
}
