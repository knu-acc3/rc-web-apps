"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download,
  FileZip,
  Trash,
  Stamp,
  TextT,
  GridFour,
  Image as ImageIcon,
  UploadSimple,
} from "@phosphor-icons/react";
import ImageUploader from "@/src/components/ImageUploader";
import {
  buildExportFileName,
  canvasToBlob,
  downloadCanvas,
  getExportMime,
} from "@/src/utils/exportHelpers";
import type { RasterExportFormat } from "@/src/utils/exportHelpers";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { BeforeAfter } from "@/src/components/tool/BeforeAfter";
import { cn } from "@/src/lib/cn";
import ColorPickerInput from "@/src/components/ColorPickerInput";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile, normalizeImageForBrowser } from "@/src/lib/file-conversion/image-engine";

type WatermarkPosition =
  "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";
type FontStyle = "normal" | "bold" | "italic" | "bold italic";
type FontFamily = "sans-serif" | "serif" | "monospace";
type WatermarkMode = "single" | "tiled" | "logo";

const POSITION_GRID: WatermarkPosition[] = [
  "tl",
  "tc",
  "tr",
  "ml",
  "mc",
  "mr",
  "bl",
  "bc",
  "br",
];

const POSITION_LABELS: Record<WatermarkPosition, { en: string; ru: string }> = {
  tl: { en: "Top left", ru: "Верхний левый" },
  tc: { en: "Top center", ru: "Верхний центр" },
  tr: { en: "Top right", ru: "Верхний правый" },
  ml: { en: "Middle left", ru: "Середина слева" },
  mc: { en: "Center", ru: "По центру" },
  mr: { en: "Middle right", ru: "Середина справа" },
  bl: { en: "Bottom left", ru: "Нижний левый" },
  bc: { en: "Bottom center", ru: "Нижний центр" },
  br: { en: "Bottom right", ru: "Нижний правый" },
};

interface ColorPreset {
  label: { en: string; ru: string };
  value: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  { label: { en: "White", ru: "Белый" }, value: "#FFFFFF" },
  { label: { en: "Black", ru: "Чёрный" }, value: "#000000" },
  { label: { en: "Red", ru: "Красный" }, value: "#FF0000" },
  { label: { en: "Gray", ru: "Серый" }, value: "#808080" },
];

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function getPositionXY(
  pos: WatermarkPosition,
  cw: number,
  ch: number,
  pad: number,
): {
  x: number;
  y: number;
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline;
} {
  const col = pos[1] as "l" | "c" | "r";
  const row = pos[0] as "t" | "m" | "b";
  const x = col === "l" ? pad : col === "r" ? cw - pad : cw / 2;
  const y = row === "t" ? pad : row === "b" ? ch - pad : ch / 2;
  const align: CanvasTextAlign =
    col === "l" ? "left" : col === "r" ? "right" : "center";
  const baseline: CanvasTextBaseline =
    row === "t" ? "top" : row === "b" ? "bottom" : "middle";
  return { x, y, align, baseline };
}

function getLogoAnchor(
  pos: WatermarkPosition,
  cw: number,
  ch: number,
  lw: number,
  lh: number,
  pad: number,
): { x: number; y: number } {
  const col = pos[1] as "l" | "c" | "r";
  const row = pos[0] as "t" | "m" | "b";
  const x = col === "l" ? pad : col === "r" ? cw - pad - lw : (cw - lw) / 2;
  const y = row === "t" ? pad : row === "b" ? ch - pad - lh : (ch - lh) / 2;
  return { x, y };
}

export default function WatermarkImage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<WatermarkMode>("single");
  const [text, setText] = useState("© Sample Watermark");
  const [fontSize, setFontSize] = useState(40);
  const [fontStyle, setFontStyle] = useState<FontStyle>("bold");
  const [fontFamily, setFontFamily] = useState<FontFamily>("sans-serif");
  const [color, setColor] = useState("#FFFFFF");
  const [customColor, setCustomColor] = useState("");
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [tileRotation, setTileRotation] = useState(-30);
  const [tileSpacing, setTileSpacing] = useState(120);
  const [position, setPosition] = useState<WatermarkPosition>("br");
  const [padding, setPadding] = useState(30);
  const [outputFormat, setOutputFormat] = useState<RasterExportFormat>("png");
  const [stroke, setStroke] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [logoSizePct, setLogoSizePct] = useState(15);
  const [logoOpacity, setLogoOpacity] = useState(0.7);
  const [logoPosition, setLogoPosition] = useState<WatermarkPosition>("br");
  const [logoPadding, setLogoPadding] = useState(30);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoUrlRef = useRef("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageUrlRef = useRef("");

  const drawWatermarkToCanvas = useCallback(
    (source: HTMLImageElement, canvas: HTMLCanvasElement) => {
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(source, 0, 0);

      if (mode === "logo") {
        if (!logoImage) return;
        const shorter = Math.min(canvas.width, canvas.height);
        const targetW = (logoSizePct / 100) * shorter;
        const ratio = logoImage.height / logoImage.width;
        const lw = targetW;
        const lh = targetW * ratio;
        const { x, y } = getLogoAnchor(
          logoPosition,
          canvas.width,
          canvas.height,
          lw,
          lh,
          logoPadding,
        );
        ctx.save();
        ctx.globalAlpha = logoOpacity;
        ctx.drawImage(logoImage, x, y, lw, lh);
        ctx.restore();
        return;
      }

      const fontStr =
        fontStyle === "normal"
          ? `${fontSize}px ${fontFamily}`
          : `${fontStyle} ${fontSize}px ${fontFamily}`;

      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(1, fontSize / 16);
      ctx.lineJoin = "round";
      ctx.font = fontStr;

      const renderText = (x: number, y: number) => {
        if (stroke) ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      };

      if (mode === "tiled") {
        const metrics = ctx.measureText(text || " ");
        const textWidth = metrics.width;
        const textHeight = fontSize * 1.4;
        const spacingX = textWidth + Math.max(0, tileSpacing);
        const spacingY = textHeight + Math.max(0, tileSpacing);
        const diagonal = Math.sqrt(
          canvas.width * canvas.width + canvas.height * canvas.height,
        );

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((tileRotation * Math.PI) / 180);
        for (let y = -diagonal; y < diagonal; y += spacingY) {
          for (let x = -diagonal; x < diagonal; x += spacingX) {
            renderText(x, y);
          }
        }
        ctx.restore();
      } else {
        const { x, y, align, baseline } = getPositionXY(
          position,
          canvas.width,
          canvas.height,
          padding,
        );
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        renderText(0, 0);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    },
    [
      mode,
      text,
      fontSize,
      fontStyle,
      fontFamily,
      color,
      opacity,
      rotation,
      tileRotation,
      tileSpacing,
      position,
      padding,
      stroke,
      strokeColor,
      logoImage,
      logoSizePct,
      logoOpacity,
      logoPosition,
      logoPadding,
    ],
  );

  const applyWatermark = useCallback(() => {
    if (!image || !canvasRef.current) return;
    drawWatermarkToCanvas(image, canvasRef.current);
  }, [image, drawWatermarkToCanvas]);

  useEffect(() => {
    applyWatermark();
  }, [applyWatermark]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const imageFiles = files.filter((candidate) =>
      candidate.type.startsWith("image/"),
    );
    const f = imageFiles[0];
    if (!f || !f.type.startsWith("image/")) return;
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    setBatchFiles(imageFiles);
    setFile(f);
    const url = URL.createObjectURL(f);
    imageUrlRef.current = url;
    setImageUrl(url);
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = url;
  }, []);

  const handleLogoSelected = useCallback(async (f: File | null) => {
    if (!f || !isExtendedImageFile(f)) return;
    const normalized = await normalizeImageForBrowser(f);
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
    setLogoFile(normalized);
    const url = URL.createObjectURL(normalized);
    logoUrlRef.current = url;
    const img = new Image();
    img.onload = () => setLogoImage(img);
    img.src = url;
  }, []);

  const handleLogoInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void handleLogoSelected(f);
    },
    [handleLogoSelected],
  );

  const clearLogo = useCallback(() => {
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
    logoUrlRef.current = "";
    setLogoFile(null);
    setLogoImage(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }, []);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "") + "_watermarked";
    downloadCanvas(canvasRef.current, {
      baseName,
      format: outputFormat,
      quality: outputFormat === "jpeg" ? 0.9 : undefined,
    });
  }, [file, outputFormat]);

  const handleDownloadAll = useCallback(async () => {
    if (batchFiles.length === 0) return;
    if (batchFiles.length === 1) {
      handleDownload();
      return;
    }

    setBatchProcessing(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const usedNames = new Set<string>();

      for (const sourceFile of batchFiles) {
        try {
          const sourceImage = await loadImageFromFile(sourceFile);
          const canvas = document.createElement("canvas");
          drawWatermarkToCanvas(sourceImage, canvas);
          const blob = await canvasToBlob(
            canvas,
            getExportMime(outputFormat),
            outputFormat === "jpeg" ? 0.9 : undefined,
          );
          const baseName = `${sourceFile.name.replace(/\.[^.]+$/, "")}_watermarked`;
          let fileName = buildExportFileName(baseName, outputFormat);
          let counter = 1;
          while (usedNames.has(fileName)) {
            fileName = buildExportFileName(
              `${baseName}_${counter}`,
              outputFormat,
            );
            counter++;
          }
          usedNames.add(fileName);
          zip.file(fileName, blob);
        } catch {
          // skip
        }
      }

      if (usedNames.size === 0) return;
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = `watermarked_${usedNames.size}.zip`;
        link.rel = "noopener";
        link.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    } finally {
      setBatchProcessing(false);
    }
  }, [batchFiles, drawWatermarkToCanvas, handleDownload, outputFormat]);

  const clearImage = useCallback(() => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = "";
    setFile(null);
    setImage(null);
    setImageUrl("");
    setBatchFiles([]);
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
    };
  }, []);

  const handleColorPreset = (value: string) => {
    setColor(value);
    setCustomColor("");
  };
  const handleCustomColorChange = (val: string) => {
    setCustomColor(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) setColor(val);
  };

  const fontStyles: FontStyle[] = ["normal", "bold", "italic", "bold italic"];
  const fontFamilies: FontFamily[] = ["sans-serif", "serif", "monospace"];
  const formats: RasterExportFormat[] = ["png", "jpeg", "webp"];

  const fontStyleLabels: Record<FontStyle, React.ReactNode> = {
    normal: "Aa",
    bold: <strong>Aa</strong>,
    italic: <em>Aa</em>,
    "bold italic": (
      <strong>
        <em>Aa</em>
      </strong>
    ),
  };

  const fontFamilyLabels: Record<FontFamily, { label: string; cls: string }> = {
    "sans-serif": { label: "Sans", cls: "" },
    serif: { label: "Serif", cls: "font-serif" },
    monospace: { label: "Mono", cls: "font-mono" },
  };

  const isTextMode = mode === "single" || mode === "tiled";
  const showPositionGrid = mode === "single";
  const activePosition = mode === "logo" ? logoPosition : position;
  const activePadding = mode === "logo" ? logoPadding : padding;
  const setActivePosition = mode === "logo" ? setLogoPosition : setPosition;
  const setActivePadding = mode === "logo" ? setLogoPadding : setPadding;

  const modeButtons: {
    id: WatermarkMode;
    en: string;
    ru: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "single",
      en: "Single text",
      ru: "Один текст",
      icon: <TextT size={14} weight="bold" />,
    },
    {
      id: "tiled",
      en: "Tiled text",
      ru: "Замостить",
      icon: <GridFour size={14} weight="bold" />,
    },
    {
      id: "logo",
      en: "Logo image",
      ru: "Логотип",
      icon: <ImageIcon size={14} weight="bold" />,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      {!image && (
        <ImageUploader onFilesSelected={handleFilesSelected} multiple />
      )}

      {image && (
        <>
          <ImageUploader
            onFilesSelected={handleFilesSelected}
            compact
            multiple
          />

          <div className="mt-4 space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div>
              <Label className="mb-1.5 block text-sm font-semibold">
                {isEn ? "Watermark type" : "Тип водяного знака"}
              </Label>
              <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-1">
                {modeButtons.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "flex min-h-11 items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 text-xs font-semibold",
                      mode === item.id
                        ? "bg-[var(--color-primary)] text-white"
                        : "hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    {item.icon}
                    {isEn ? item.en : item.ru}
                  </button>
                ))}
              </div>
            </div>
            {isTextMode && (
              <div>
                <Label className="mb-1.5 block text-sm font-semibold">
                  {isEn ? "Text" : "Текст"}
                </Label>
                <Input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              </div>
            )}
            {(mode === "single" || mode === "logo") && (
              <div>
                <Label className="mb-1.5 block text-sm font-semibold">
                  {isEn ? "Position" : "Позиция"}
                </Label>
                <div className="grid grid-cols-3 gap-1">
                  {(["tl", "mc", "br"] as WatermarkPosition[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setActivePosition(item)}
                      className={cn(
                        "min-h-11 rounded-[var(--radius-md)] border px-2 text-xs font-semibold",
                        activePosition === item
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "border-[var(--color-border)]",
                      )}
                    >
                      {isEn
                        ? POSITION_LABELS[item].en
                        : POSITION_LABELS[item].ru}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 grid gap-2 sm:flex sm:flex-wrap">
            <Button
              className="tool-primary-action"
              onClick={handleDownload}
              disabled={mode === "logo" && !logoImage}
            >
              <Download size={16} />
              {isEn
                ? `Download ${outputFormat.toUpperCase()}`
                : `Скачать ${outputFormat.toUpperCase()}`}
            </Button>
            {batchFiles.length > 1 && (
              <Button
                variant="secondary"
                onClick={handleDownloadAll}
                disabled={batchProcessing || (mode === "logo" && !logoImage)}
              >
                <FileZip size={16} />
                {batchProcessing
                  ? isEn
                    ? "Packing ZIP..."
                    : "Упаковка ZIP..."
                  : isEn
                    ? `Download all (${batchFiles.length})`
                    : `Скачать все (${batchFiles.length})`}
              </Button>
            )}
          </div>

          <AdvancedSettings
            title={isEn ? "Advanced settings" : "Расширенные настройки"}
            description={
              isEn
                ? "Size, opacity, rotation, colors, logo and export"
                : "Размер, прозрачность, поворот, цвета, логотип и экспорт"
            }
            className="my-4"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Stamp size={16} className="text-[var(--color-primary)]" />
              {isEn ? "Watermark Settings" : "Настройки водяного знака"}
              {batchFiles.length > 1 && (
                <span className="ml-auto rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs text-[var(--color-primary)]">
                  {batchFiles.length}
                </span>
              )}
            </div>

            <div className="mb-4">
              <Label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">
                {isEn ? "Watermark mode" : "Режим водяного знака"}
              </Label>
              <div className="inline-flex w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] sm:w-auto">
                {modeButtons.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors sm:flex-none",
                      mode === m.id
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    {m.icon}
                    {isEn ? m.en : m.ru}
                  </button>
                ))}
              </div>
            </div>

            {isTextMode && (
              <div className="mb-4">
                <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Watermark text" : "Текст водяного знака"}
                </Label>
                <Input value={text} onChange={(e) => setText(e.target.value)} />
              </div>
            )}

            {mode === "logo" && (
              <div className="mb-4">
                <Label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">
                  {isEn
                    ? "Logo file (PNG, SVG, JPG)"
                    : "Файл логотипа (PNG, SVG, JPG)"}
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    data-file-paste-target="true"
                    accept={EXTENDED_IMAGE_ACCEPT}
                    onChange={handleLogoInputChange}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <UploadSimple size={16} />
                    {logoFile
                      ? isEn
                        ? "Replace logo"
                        : "Заменить логотип"
                      : isEn
                        ? "Upload logo"
                        : "Загрузить логотип"}
                  </Button>
                  {logoFile && logoImage && (
                    <>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {logoFile.name} — {logoImage.width}×{logoImage.height}
                      </span>
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="text-xs text-[var(--color-danger)] underline-offset-2 hover:underline"
                      >
                        {isEn ? "Remove" : "Удалить"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isTextMode && (
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Font size" : "Размер шрифта"}: {fontSize}px
                  </Label>
                  <input
                    type="range"
                    min={12}
                    max={120}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </div>
              )}

              {mode === "logo" && (
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Logo size" : "Размер логотипа"}: {logoSizePct}%
                  </Label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={logoSizePct}
                    onChange={(e) => setLogoSizePct(parseInt(e.target.value))}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </div>
              )}

              <div>
                <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Opacity" : "Прозрачность"}:{" "}
                  {Math.round((mode === "logo" ? logoOpacity : opacity) * 100)}%
                </Label>
                <input
                  type="range"
                  min={0.05}
                  max={1.0}
                  step={0.05}
                  value={mode === "logo" ? logoOpacity : opacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (mode === "logo") setLogoOpacity(val);
                    else setOpacity(val);
                  }}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              {mode === "single" && (
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Rotation" : "Поворот"}: {rotation}°
                  </Label>
                  <input
                    type="range"
                    min={-90}
                    max={90}
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </div>
              )}

              {mode === "tiled" && (
                <>
                  <div>
                    <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Tile rotation" : "Поворот плитки"}:{" "}
                      {tileRotation}°
                    </Label>
                    <input
                      type="range"
                      min={-90}
                      max={90}
                      value={tileRotation}
                      onChange={(e) =>
                        setTileRotation(parseInt(e.target.value))
                      }
                      className="w-full accent-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Tile spacing" : "Расстояние плитки"}:{" "}
                      {tileSpacing}px
                    </Label>
                    <input
                      type="range"
                      min={20}
                      max={400}
                      value={tileSpacing}
                      onChange={(e) => setTileSpacing(parseInt(e.target.value))}
                      className="w-full accent-[var(--color-primary)]"
                    />
                  </div>
                </>
              )}

              {(mode === "single" || mode === "logo") && (
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Margin from edge" : "Отступ от края"}:{" "}
                    {activePadding}px
                  </Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={activePadding}
                    onChange={(e) => setActivePadding(parseInt(e.target.value))}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </div>
              )}

              {isTextMode && (
                <>
                  <div>
                    <Label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Font style" : "Стиль шрифта"}
                    </Label>
                    <div className="inline-flex overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)]">
                      {fontStyles.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFontStyle(s)}
                          className={cn(
                            "px-3 py-1.5 text-xs transition-colors",
                            fontStyle === s
                              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                              : "hover:bg-[var(--color-surface-muted)]",
                          )}
                        >
                          {fontStyleLabels[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Font family" : "Гарнитура"}
                    </Label>
                    <div className="inline-flex overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)]">
                      {fontFamilies.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFontFamily(f)}
                          className={cn(
                            "px-3 py-1.5 text-xs transition-colors",
                            fontFamilyLabels[f].cls,
                            fontFamily === f
                              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                              : "hover:bg-[var(--color-surface-muted)]",
                          )}
                        >
                          {fontFamilyLabels[f].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={stroke}
                        onChange={(e) => setStroke(e.target.checked)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span className="font-medium">
                        {isEn ? "Outline" : "Обводка"}
                      </span>
                    </label>
                    {stroke && (
                      <ColorPickerInput
                        value={strokeColor}
                        onChange={setStrokeColor}
                        label={isEn ? "Outline color" : "Цвет обводки"}
                        size="small"
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {(showPositionGrid || mode === "logo") && (
              <div className="mt-4">
                <Label className="mb-2 block text-xs text-[var(--color-text-muted)]">
                  {isEn
                    ? `Position: ${POSITION_LABELS[activePosition].en}`
                    : `Расположение: ${POSITION_LABELS[activePosition].ru}`}
                </Label>
                <div className="grid w-fit grid-cols-3 gap-1">
                  {POSITION_GRID.map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setActivePosition(pos)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border-2 transition-colors",
                        activePosition === pos
                          ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)]"
                          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]/20",
                      )}
                    >
                      {activePosition === pos && (
                        <span className="block h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isTextMode && (
              <div className="mt-4">
                <Label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Color" : "Цвет"}
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleColorPreset(preset.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1 text-xs transition-colors",
                        color === preset.value && !customColor
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] font-bold text-[var(--color-primary-foreground)]"
                          : "border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-[var(--color-border)]"
                        style={{ backgroundColor: preset.value }}
                      />
                      {isEn ? preset.label.en : preset.label.ru}
                    </button>
                  ))}
                  <Input
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    placeholder="#FF5722"
                    className="h-9 w-32 font-mono text-sm"
                  />
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border-subtle)] pt-4">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                {isEn ? "Export" : "Экспорт"}
              </span>
              <div className="inline-flex overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)]">
                {formats.map((formatItem) => (
                  <button
                    key={formatItem}
                    type="button"
                    onClick={() => setOutputFormat(formatItem)}
                    className={cn(
                      "min-h-10 px-3 font-mono text-xs transition-colors",
                      outputFormat === formatItem
                        ? "bg-[var(--color-primary)] text-white"
                        : "hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    {formatItem.toUpperCase()}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={clearImage}>
                <Trash size={16} />{" "}
                {isEn ? "Clear image" : "Очистить изображение"}
              </Button>
            </div>
          </AdvancedSettings>

          <BeforeAfter
            labelBefore={isEn ? "Original" : "Оригинал"}
            labelAfter={isEn ? "With watermark" : "С водяным знаком"}
            before={
              <div className="p-3 sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Original"
                  style={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    display: "block",
                  }}
                  className="rounded-[var(--radius-md)]"
                />
                {file && (
                  <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                    {file.name} — {image.width}×{image.height}
                  </div>
                )}
              </div>
            }
            after={
              <div className="p-3 sm:p-4">
                <canvas
                  ref={canvasRef}
                  style={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    display: "block",
                  }}
                  className="rounded-[var(--radius-md)]"
                />
              </div>
            }
          />
        </>
      )}
    </div>
  );
}
