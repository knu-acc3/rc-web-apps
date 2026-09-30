"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  FilePdf,
  Download,
  ArrowCounterClockwise,
  Image as ImageIcon,
  CaretUp,
  CaretDown,
  TrashSimple,
  ImageSquare,
  CheckCircle,
  X,
  DotsSixVertical,
  ArrowClockwise,
  Plus,
  CaretDown as CaretDownIcon,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  PdfDropzone,
  PdfDropzoneHandle,
} from "@/src/components/ui/pdf-dropzone";
import { cn } from "@/src/lib/cn";
import { downloadPdfBlob, formatFileSize } from "@/src/utils/pdfHelpers";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ColorPickerInput from "@/src/components/ColorPickerInput";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { EXTENDED_IMAGE_ACCEPT, normalizeImagesForBrowser } from "@/src/lib/file-conversion/image-engine";

type PageSize = "a4" | "a3" | "a5" | "letter" | "legal" | "tabloid" | "fit";
type Orientation = "portrait" | "landscape";
type FitMode = "contain" | "cover" | "stretch" | "original";
type Anchor = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

interface ImageItem {
  file: File;
  url: string;
  id: string;
  rotation: 0 | 90 | 180 | 270;
  naturalWidth?: number;
  naturalHeight?: number;
}

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const PAGE_SIZES: Record<
  Exclude<PageSize, "fit">,
  { width: number; height: number; label: string }
> = {
  a4: { width: 595.28, height: 841.89, label: "A4" },
  a3: { width: 841.89, height: 1190.55, label: "A3" },
  a5: { width: 419.53, height: 595.28, label: "A5" },
  letter: { width: 612, height: 792, label: "Letter" },
  legal: { width: 612, height: 1008, label: "Legal" },
  tabloid: { width: 792, height: 1224, label: "Tabloid" },
};

const MM_TO_PT = 2.835;

let idCounter = 0;

// Parse "#rrggbb" → {r,g,b} 0..1 for pdf-lib rgb()
function parseHex(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return { r: 1, g: 1, b: 1 };
  const n = parseInt(m[1], 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}

export default function JpgToPdf() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const uploaderRef = useRef<PdfDropzoneHandle>(null);
  const imagesRef = useRef<ImageItem[]>([]);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  // Margins: uniform slider + advanced 4-side
  const [marginMm, setMarginMm] = useState(15); // uniform value used by slider/presets
  const [advancedMargins, setAdvancedMargins] = useState(false);
  const [margins, setMargins] = useState<Margins>({
    top: 15,
    right: 15,
    bottom: 15,
    left: 15,
  });

  const [quality, setQuality] = useState(85);
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const [anchor, setAnchor] = useState<Anchor>("mc");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [pageNumbers, setPageNumbers] = useState(false);
  const [outputName, setOutputName] = useState("images-to-pdf");

  // PDF metadata
  const [metaOpen, setMetaOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfAuthor, setPdfAuthor] = useState("");
  const [pdfSubject, setPdfSubject] = useState("");

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Preview index
  const [previewIdx, setPreviewIdx] = useState(0);
  const safePreviewIdx = Math.min(previewIdx, Math.max(0, images.length - 1));

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const accepted = await normalizeImagesForBrowser(files);
    const newItems: ImageItem[] = accepted.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      id: `img-${++idCounter}`,
      rotation: 0 as const,
    }));

    // Probe natural dimensions in background (non-blocking for UX)
    newItems.forEach((item) => {
      const probe = new Image();
      probe.onload = () => {
        setImages((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  naturalWidth: probe.naturalWidth,
                  naturalHeight: probe.naturalHeight,
                }
              : p,
          ),
        );
      };
      probe.src = item.url;
    });

    setImages((prev) => [...prev, ...newItems]);
    setResultBytes(null);
    setError("");
    uploaderRef.current?.reset();
  }, []);

  const moveImage = useCallback((index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setResultBytes(null);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== index);
    });
    setResultBytes(null);
  }, []);

  const rotateImage = useCallback((id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? {
              ...img,
              rotation: ((img.rotation + 90) % 360) as 0 | 90 | 180 | 270,
            }
          : img,
      ),
    );
    setResultBytes(null);
  }, []);

  const reorderTo = useCallback(
    (srcId: string, targetId: string, position: "before" | "after") => {
      setImages((prev) => {
        const srcIdx = prev.findIndex((f) => f.id === srcId);
        const tgtIdx = prev.findIndex((f) => f.id === targetId);
        if (srcIdx < 0 || tgtIdx < 0 || srcId === targetId) return prev;
        const next = [...prev];
        const [moved] = next.splice(srcIdx, 1);
        const insertAt = next.findIndex((f) => f.id === targetId);
        const finalIdx = position === "after" ? insertAt + 1 : insertAt;
        next.splice(finalIdx, 0, moved);
        return next;
      });
      setResultBytes(null);
    },
    [],
  );

  // Cancel DnD on stray drag end
  useEffect(() => {
    const onDragEnd = () => {
      setDragId(null);
      setDragOverId(null);
    };
    window.addEventListener("dragend", onDragEnd);
    return () => window.removeEventListener("dragend", onDragEnd);
  }, []);

  // Compute final page dimensions for given image
  const computePageDims = useCallback(
    (imgW: number, imgH: number) => {
      const m = margins;
      if (pageSize === "fit") {
        return {
          pageW: imgW + (m.left + m.right) * MM_TO_PT,
          pageH: imgH + (m.top + m.bottom) * MM_TO_PT,
        };
      }
      const dims = PAGE_SIZES[pageSize];
      if (orientation === "portrait") {
        return { pageW: dims.width, pageH: dims.height };
      }
      return { pageW: dims.height, pageH: dims.width };
    },
    [pageSize, orientation, margins],
  );

  // Compute placement: returns {x, y, w, h} for image draw, given page and margins
  const computePlacement = useCallback(
    (
      pageW: number,
      pageH: number,
      imgW: number,
      imgH: number,
    ): { x: number; y: number; w: number; h: number } => {
      const m = margins;
      const ml = m.left * MM_TO_PT;
      const mr = m.right * MM_TO_PT;
      const mt = m.top * MM_TO_PT;
      const mb = m.bottom * MM_TO_PT;
      const availW = Math.max(1, pageW - ml - mr);
      const availH = Math.max(1, pageH - mt - mb);

      let drawW: number;
      let drawH: number;

      if (fitMode === "cover") {
        const s = Math.max(availW / imgW, availH / imgH);
        drawW = imgW * s;
        drawH = imgH * s;
      } else if (fitMode === "stretch") {
        drawW = availW;
        drawH = availH;
      } else if (fitMode === "original") {
        drawW = imgW;
        drawH = imgH;
      } else {
        // contain
        const s = Math.min(availW / imgW, availH / imgH, 1);
        drawW = imgW * s;
        drawH = imgH * s;
      }

      // Anchor placement within (ml, pageH - mt - drawH) box of size (availW x availH)
      let x: number;
      let y: number;
      const col = anchor[1] as "l" | "c" | "r";
      const row = anchor[0] as "t" | "m" | "b";

      if (col === "l") x = ml;
      else if (col === "r") x = pageW - mr - drawW;
      else x = ml + (availW - drawW) / 2;

      // pdf-lib origin is bottom-left
      if (row === "t") y = pageH - mt - drawH;
      else if (row === "b") y = mb;
      else y = mb + (availH - drawH) / 2;

      return { x, y, w: drawW, h: drawH };
    },
    [margins, fitMode, anchor],
  );

  const handleConvert = useCallback(async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setError("");
    setResultBytes(null);

    try {
      const pdfDoc = await PDFDocument.create();

      // Metadata
      if (pdfTitle.trim()) pdfDoc.setTitle(pdfTitle.trim());
      if (pdfAuthor.trim()) pdfDoc.setAuthor(pdfAuthor.trim());
      if (pdfSubject.trim()) pdfDoc.setSubject(pdfSubject.trim());
      pdfDoc.setCreator("ulti-tools.com");
      pdfDoc.setProducer("ulti-tools.com / pdf-lib");

      const font = pageNumbers
        ? await pdfDoc.embedFont(StandardFonts.Helvetica)
        : null;
      const total = images.length;
      const bg = parseHex(bgColor);

      for (let i = 0; i < total; i++) {
        const img = images[i];
        const swapDim = img.rotation === 90 || img.rotation === 270;

        const jpegBytes = await new Promise<Uint8Array>((resolve, reject) => {
          const bitmap = new Image();
          bitmap.onload = () => {
            const w = bitmap.naturalWidth;
            const h = bitmap.naturalHeight;
            const canvas = document.createElement("canvas");
            canvas.width = swapDim ? h : w;
            canvas.height = swapDim ? w : h;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = `rgb(${Math.round(bg.r * 255)}, ${Math.round(bg.g * 255)}, ${Math.round(bg.b * 255)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((img.rotation * Math.PI) / 180);
            ctx.drawImage(bitmap, -w / 2, -h / 2);
            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  resolve(new Uint8Array(await blob.arrayBuffer()));
                } else {
                  reject(
                    new Error("Canvas could not encode this image as JPEG."),
                  );
                }
              },
              "image/jpeg",
              quality / 100,
            );
          };
          bitmap.onerror = () =>
            reject(new Error("Image could not be decoded."));
          bitmap.src = img.url;
        });

        let embedded;
        try {
          embedded = await pdfDoc.embedJpg(jpegBytes);
        } catch {
          const originalBytes = new Uint8Array(await img.file.arrayBuffer());
          const type = img.file.type;
          if (type === "image/png") {
            embedded = await pdfDoc.embedPng(originalBytes);
          } else {
            try {
              embedded = await pdfDoc.embedJpg(originalBytes);
            } catch {
              embedded = await pdfDoc.embedPng(originalBytes);
            }
          }
        }

        const imgW = embedded.width;
        const imgH = embedded.height;
        const { pageW, pageH } = computePageDims(imgW, imgH);
        const page = pdfDoc.addPage([pageW, pageH]);

        // Fill background for contain (or anything showing whitespace)
        if (fitMode === "contain" || fitMode === "original") {
          page.drawRectangle({
            x: 0,
            y: 0,
            width: pageW,
            height: pageH,
            color: rgb(bg.r, bg.g, bg.b),
          });
        }

        const { x, y, w, h } = computePlacement(pageW, pageH, imgW, imgH);

        page.drawImage(embedded, {
          x,
          y,
          width: w,
          height: h,
        });

        if (font) {
          const text = `${i + 1} / ${total}`;
          const fontSize = 9;
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const marginRefPt = margins.bottom * MM_TO_PT;
          page.drawText(text, {
            x: pageW - textWidth - (margins.right * MM_TO_PT) / 2,
            y: marginRefPt / 3,
            size: fontSize,
            font,
            color: rgb(0.45, 0.45, 0.45),
          });
        }

        setProgress(((i + 1) / total) * 100);
      }

      const pdfBytes = await pdfDoc.save();
      setResultBytes(pdfBytes);
    } catch {
      setError(
        isEn
          ? "Failed to convert images to PDF."
          : "Не удалось конвертировать изображения в PDF.",
      );
    } finally {
      setProcessing(false);
    }
  }, [
    images,
    pageNumbers,
    quality,
    fitMode,
    margins,
    bgColor,
    pdfTitle,
    pdfAuthor,
    pdfSubject,
    computePageDims,
    computePlacement,
    isEn,
  ]);

  const handleDownload = useCallback(() => {
    if (!resultBytes) return;
    const name = (outputName.trim() || "images-to-pdf").replace(/\.pdf$/i, "");
    downloadPdfBlob(resultBytes, `${name}.pdf`);
  }, [resultBytes, outputName]);

  const handleReset = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setResultBytes(null);
    setError("");
    setProgress(0);
    setOutputName("images-to-pdf");
  }, [images]);

  const handleAddMore = useCallback(() => {
    uploaderRef.current?.openFileDialog();
  }, []);

  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);
  const estimatedPdfSize = Math.round(totalSize * (quality / 100) * 0.95);

  const pageSizeOptions: { value: PageSize; label: string; sub: string }[] = [
    { value: "a4", label: "A4", sub: "210×297mm" },
    { value: "a5", label: "A5", sub: "148×210mm" },
    { value: "a3", label: "A3", sub: "297×420mm" },
    { value: "letter", label: "Letter", sub: "216×279mm" },
    { value: "legal", label: "Legal", sub: "216×356mm" },
    { value: "tabloid", label: "Tabloid", sub: "279×432mm" },
    {
      value: "fit",
      label: isEn ? "Auto-fit" : "По изображению",
      sub: isEn ? "Per-image" : "Под фото",
    },
  ];

  const marginPresets: { label: string; value: number }[] = [
    { label: isEn ? "None" : "0", value: 0 },
    { label: isEn ? "Small" : "Малые", value: 5 },
    { label: isEn ? "Normal" : "Обычные", value: 15 },
    { label: isEn ? "Large" : "Большие", value: 25 },
  ];

  const fitOptions: { value: FitMode; label: string; sub: string }[] = [
    {
      value: "contain",
      label: isEn ? "Contain" : "Вписать",
      sub: isEn ? "Whole image, ratio kept" : "Целиком, пропорции",
    },
    {
      value: "cover",
      label: isEn ? "Cover" : "Заполнить",
      sub: isEn ? "Crop to fill page" : "Обрезать под лист",
    },
    {
      value: "stretch",
      label: isEn ? "Stretch" : "Растянуть",
      sub: isEn ? "Distort to fill" : "С искажением",
    },
    {
      value: "original",
      label: isEn ? "Original" : "Оригинал",
      sub: isEn ? "No scaling" : "Без масштаба",
    },
  ];

  // ============= LIVE PREVIEW =============
  const previewImg = images[safePreviewIdx];
  const previewSvg = useMemo(() => {
    if (!previewImg) return null;
    // Use a reasonable fallback when natural dims unknown
    const rawW = previewImg.naturalWidth ?? 800;
    const rawH = previewImg.naturalHeight ?? 600;
    const swap = previewImg.rotation === 90 || previewImg.rotation === 270;
    const imgW = swap ? rawH : rawW;
    const imgH = swap ? rawW : rawH;
    const { pageW, pageH } = computePageDims(imgW, imgH);
    const place = computePlacement(pageW, pageH, imgW, imgH);

    // Map to SVG viewBox (cap dimension)
    const MAX = 280;
    const scale = MAX / Math.max(pageW, pageH);
    const svgW = pageW * scale;
    const svgH = pageH * scale;
    const ml = margins.left * MM_TO_PT * scale;
    const mr = margins.right * MM_TO_PT * scale;
    const mt = margins.top * MM_TO_PT * scale;
    const mb = margins.bottom * MM_TO_PT * scale;

    // SVG y is top-down. Convert pdf-lib y (bottom-up) to SVG y.
    const svgImgY = svgH - (place.y + place.h) * scale;
    const svgImgX = place.x * scale;
    const svgImgW = place.w * scale;
    const svgImgH = place.h * scale;

    return {
      svgW,
      svgH,
      ml,
      mr,
      mt,
      mb,
      svgImgX,
      svgImgY,
      svgImgW,
      svgImgH,
      pageWMm: Math.round(pageW / MM_TO_PT),
      pageHMm: Math.round(pageH / MM_TO_PT),
    };
  }, [previewImg, computePageDims, computePlacement, margins]);

  const setSideMargin = (side: keyof Margins, v: number) =>
    setMargins((m) => ({ ...m, [side]: Math.max(0, Math.min(50, v)) }));

  const setUniformMargin = (value: number) => {
    const next = Math.max(0, Math.min(50, value));
    setMarginMm(next);
    setMargins({ top: next, right: next, bottom: next, left: next });
  };

  const toggleAdvancedMargins = () => {
    if (advancedMargins) {
      setMargins({
        top: marginMm,
        right: marginMm,
        bottom: marginMm,
        left: marginMm,
      });
    }
    setAdvancedMargins(!advancedMargins);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PdfDropzone
        ref={uploaderRef}
        accept={EXTENDED_IMAGE_ACCEPT}
        onFilesSelected={handleFilesSelected}
        multiple={true}
        maxSizeMB={50}
        label="Перетащите файлы или нажмите для загрузки"
        labelEn="Drag & drop files or click to upload"
        icon={
          <ImageSquare size={48} className="text-[var(--color-text-muted)]" />
        }
      />

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

      {images.length > 0 && (
        <>
          <Card className="mt-4 p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <ImageIcon size={28} className="text-[var(--color-primary)]" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">
                  {images.length}{" "}
                  {isEn
                    ? images.length === 1
                      ? "image"
                      : "images"
                    : images.length === 1
                      ? "изображение"
                      : images.length < 5
                        ? "изображения"
                        : "изображений"}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(totalSize, isEn)} · ~{" "}
                  {formatFileSize(estimatedPdfSize, isEn)} PDF
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddMore}
                className="gap-1"
              >
                <Plus size={14} weight="bold" />
                <span className="hidden sm:inline">
                  {isEn ? "Add more" : "Добавить"}
                </span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <ArrowCounterClockwise size={16} />
                <span className="hidden sm:inline">
                  {isEn ? "Clear all" : "Очистить"}
                </span>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-sm font-semibold">
                  {isEn ? "Page size" : "Размер страницы"}
                </Label>
                <select
                  aria-label={isEn ? "Page size" : "Размер страницы"}
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PageSize)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-semibold">
                  {isEn ? "Fit" : "Размещение"}
                </Label>
                <select
                  aria-label={isEn ? "Image fit" : "Размещение изображения"}
                  value={fitMode}
                  onChange={(e) => setFitMode(e.target.value as FitMode)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                >
                  {fitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ============ Two-column layout: controls + live preview ============ */}
          </Card>

          <Card className="mt-4 bg-[var(--color-surface-muted)] p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">
                {isEn ? "Image order" : "Порядок изображений"}
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                {isEn
                  ? "Drag tiles or use arrows to reorder"
                  : "Тащите плитки или используйте стрелки"}
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, index) => {
                const isDragging = dragId === img.id;
                const isDragOver = dragOverId === img.id && dragId !== img.id;
                const isPreview = index === safePreviewIdx;
                return (
                  <li
                    key={img.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(img.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", img.id);
                    }}
                    onDragOver={(e) => {
                      if (!dragId || dragId === img.id) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverId(img.id);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        if (dragOverId === img.id) setDragOverId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const src =
                        e.dataTransfer.getData("text/plain") || dragId;
                      if (src && src !== img.id) {
                        reorderTo(src, img.id, "before");
                      }
                      setDragId(null);
                      setDragOverId(null);
                    }}
                    onClick={() => setPreviewIdx(index)}
                    className={cn(
                      "relative cursor-pointer rounded-[var(--radius-md)] border-2 bg-[var(--color-surface)] p-2 transition-all",
                      isDragging && "opacity-40 scale-[0.98]",
                      isDragOver
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
                        : isPreview
                          ? "border-[var(--color-primary)]/60"
                          : "border-[var(--color-border)]",
                    )}
                  >
                    <div className="absolute left-1 top-1 z-10 flex items-center gap-1">
                      <span className="cursor-grab rounded bg-black/40 p-0.5 text-white active:cursor-grabbing">
                        <DotsSixVertical size={12} weight="bold" />
                      </span>
                      <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                        {index + 1}
                      </span>
                    </div>
                    <div className="relative h-[120px] w-full overflow-hidden rounded-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.file.name}
                        draggable={false}
                        className="block h-full w-full object-cover transition-transform"
                        style={{ transform: `rotate(${img.rotation}deg)` }}
                      />
                    </div>
                    <div
                      className="mt-1 mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs"
                      title={img.file.name}
                    >
                      {img.file.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          rotateImage(img.id);
                        }}
                        aria-label={isEn ? "Rotate 90°" : "Повернуть 90°"}
                        className="h-7 w-7"
                      >
                        <ArrowClockwise size={14} />
                      </Button>
                      <div className="flex gap-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveImage(index, -1);
                          }}
                          disabled={index === 0}
                          aria-label={isEn ? "Move up" : "Вверх"}
                          className="h-7 w-7"
                        >
                          <CaretUp size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveImage(index, 1);
                          }}
                          disabled={index === images.length - 1}
                          aria-label={isEn ? "Move down" : "Вниз"}
                          className="h-7 w-7"
                        >
                          <CaretDown size={14} />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="h-7 w-7 text-[var(--color-danger)]"
                        aria-label={isEn ? "Remove" : "Удалить"}
                      >
                        <TrashSimple size={14} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="mt-4 grid gap-2">
            <Button
              onClick={handleConvert}
              disabled={processing || images.length === 0}
              className="tool-primary-action w-full gap-1.5"
            >
              <FilePdf size={18} />
              {processing
                ? isEn
                  ? "Converting…"
                  : "Конвертация…"
                : isEn
                  ? `Convert ${images.length} → PDF`
                  : `Конвертировать ${images.length} → PDF`}
            </Button>
            {resultBytes && (
              <Button
                onClick={handleDownload}
                className="bg-[var(--color-success)] text-white hover:opacity-90"
              >
                <Download size={18} />
                {isEn ? "Download PDF" : "Скачать PDF"}
                {` (${formatFileSize(resultBytes.byteLength, isEn)})`}
              </Button>
            )}
          </div>

          <AdvancedSettings
            title={isEn ? "Advanced settings" : "Расширенные настройки"}
            description={
              isEn
                ? "Margins, quality, position, metadata and filename"
                : "Поля, качество, позиция, метаданные и имя файла"
            }
            className="mt-4"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div>
                {/* Page size dropdown (replaces grid for compactness; grid kept secondary) */}
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Page size" : "Размер страницы"}
                </Label>
                <div className="relative mb-3">
                  <select
                    aria-label={isEn ? "Page size" : "Размер страницы"}
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as PageSize)}
                    className="h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                  >
                    {pageSizeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                        {opt.sub ? ` · ${opt.sub}` : ""}
                      </option>
                    ))}
                  </select>
                  <CaretDownIcon
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60"
                  />
                </div>

                {pageSize !== "fit" && (
                  <>
                    <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      {isEn ? "Orientation" : "Ориентация"}
                    </div>
                    <div className="mb-3 inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
                      {(["portrait", "landscape"] as Orientation[]).map((o) => (
                        <button
                          key={o}
                          type="button"
                          role="radio"
                          aria-checked={orientation === o}
                          onClick={() => setOrientation(o)}
                          className={cn(
                            "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors min-h-9",
                            orientation === o
                              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                          )}
                        >
                          {o === "portrait"
                            ? isEn
                              ? "Portrait"
                              : "Книжная"
                            : isEn
                              ? "Landscape"
                              : "Альбомная"}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Fit mode (4 options) */}
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Image fit" : "Заполнение"}
                </div>
                <div
                  role="radiogroup"
                  className="mb-3 grid grid-cols-2 gap-1.5"
                >
                  {fitOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={fitMode === opt.value}
                      onClick={() => setFitMode(opt.value)}
                      className={cn(
                        "rounded-[var(--radius-md)] border p-2 text-left transition-colors min-h-11",
                        fitMode === opt.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        {opt.sub}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Position 9-point grid (for contain & original) */}
                {(fitMode === "contain" || fitMode === "original") && (
                  <>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                        {isEn ? "Position" : "Позиция"}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                          <span>{isEn ? "Background" : "Фон"}</span>
                          <ColorPickerInput
                            value={bgColor}
                            onChange={setBgColor}
                            label={isEn ? "Background color" : "Цвет фона"}
                            size="small"
                          />
                        </label>
                      </div>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label={
                        isEn ? "Image position" : "Позиция изображения"
                      }
                      className="mb-3 grid w-fit grid-cols-3 gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-1"
                    >
                      {(
                        [
                          "tl",
                          "tc",
                          "tr",
                          "ml",
                          "mc",
                          "mr",
                          "bl",
                          "bc",
                          "br",
                        ] as Anchor[]
                      ).map((a) => (
                        <button
                          key={a}
                          type="button"
                          role="radio"
                          aria-checked={anchor === a}
                          aria-label={a}
                          onClick={() => setAnchor(a)}
                          className={cn(
                            "h-7 w-7 rounded-[var(--radius-sm)] border transition-colors flex items-center justify-center",
                            anchor === a
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                              : "border-transparent hover:bg-[var(--color-surface-muted)]",
                          )}
                        >
                          <span
                            className={cn(
                              "block h-2 w-2 rounded-full",
                              anchor === a
                                ? "bg-[var(--color-primary-foreground)]"
                                : "bg-[var(--color-text-muted)]",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Margins */}
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Margins" : "Поля"}
                    {!advancedMargins && (
                      <span className="ml-1 normal-case tabular-nums">
                        : {marginMm}mm
                      </span>
                    )}
                  </Label>
                  <button
                    type="button"
                    onClick={toggleAdvancedMargins}
                    className="text-[11px] text-[var(--color-primary)] hover:underline"
                  >
                    {advancedMargins
                      ? isEn
                        ? "Uniform"
                        : "Одинаковые"
                      : isEn
                        ? "Per side"
                        : "По сторонам"}
                  </button>
                </div>

                {!advancedMargins ? (
                  <>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {marginPresets.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setUniformMargin(preset.value)}
                          className={cn(
                            "rounded-[var(--radius-pill)] border px-2.5 py-1 text-xs font-semibold transition-colors",
                            marginMm === preset.value
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                              : "border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={1}
                      value={marginMm}
                      onChange={(e) =>
                        setUniformMargin(parseInt(e.target.value, 10))
                      }
                      className="mb-4 w-full accent-[var(--color-primary)]"
                      aria-label={isEn ? "Margins (mm)" : "Поля (мм)"}
                    />
                  </>
                ) : (
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {(["top", "right", "bottom", "left"] as const).map(
                      (side) => (
                        <div key={side}>
                          <Label className="mb-0.5 block text-[10px] uppercase text-[var(--color-text-muted)]">
                            {isEn
                              ? side
                              : side === "top"
                                ? "Верх"
                                : side === "right"
                                  ? "Право"
                                  : side === "bottom"
                                    ? "Низ"
                                    : "Лево"}
                            :{" "}
                            <span className="tabular-nums">
                              {margins[side]}mm
                            </span>
                          </Label>
                          <input
                            type="range"
                            min={0}
                            max={50}
                            step={1}
                            value={margins[side]}
                            onChange={(e) =>
                              setSideMargin(side, parseInt(e.target.value, 10))
                            }
                            className="w-full accent-[var(--color-primary)]"
                            aria-label={`${side} margin (mm)`}
                          />
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Quality */}
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Image quality" : "Качество"}:{" "}
                  <span className="tabular-nums">{quality}%</span>
                </Label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="mb-1 w-full accent-[var(--color-primary)]"
                  aria-label={isEn ? "Image quality (%)" : "Качество (%)"}
                />
                <div className="mb-3 text-[10px] text-[var(--color-text-muted)]">
                  {isEn
                    ? "Lower quality = smaller PDF. 85% is recommended."
                    : "Меньше качество = меньше PDF. Рекомендуется 85%."}
                </div>
              </div>

              {/* Live preview */}
              <div className="lg:sticky lg:top-4 lg:self-start">
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Live preview" : "Превью"}
                  {previewImg && (
                    <span className="ml-1 normal-case text-[var(--color-text-muted)]">
                      · {safePreviewIdx + 1} / {images.length}
                    </span>
                  )}
                </Label>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-3">
                  {previewSvg && previewImg ? (
                    <>
                      <div className="flex justify-center">
                        <svg
                          width={previewSvg.svgW}
                          height={previewSvg.svgH}
                          viewBox={`0 0 ${previewSvg.svgW} ${previewSvg.svgH}`}
                          className="rounded shadow-sm"
                          role="img"
                          aria-label={
                            isEn ? "PDF page preview" : "Превью страницы PDF"
                          }
                        >
                          <rect
                            x={0}
                            y={0}
                            width={previewSvg.svgW}
                            height={previewSvg.svgH}
                            fill={
                              fitMode === "contain" || fitMode === "original"
                                ? bgColor
                                : "#ffffff"
                            }
                            stroke="var(--color-border)"
                            strokeWidth={1}
                          />
                          {/* Margins overlay */}
                          <rect
                            x={previewSvg.ml}
                            y={previewSvg.mt}
                            width={Math.max(
                              0,
                              previewSvg.svgW - previewSvg.ml - previewSvg.mr,
                            )}
                            height={Math.max(
                              0,
                              previewSvg.svgH - previewSvg.mt - previewSvg.mb,
                            )}
                            fill="none"
                            stroke="var(--color-primary)"
                            strokeWidth={0.5}
                            strokeDasharray="3 3"
                            opacity={0.5}
                          />
                          {/* Image */}
                          <image
                            href={previewImg.url}
                            x={previewSvg.svgImgX}
                            y={previewSvg.svgImgY}
                            width={previewSvg.svgImgW}
                            height={previewSvg.svgImgH}
                            preserveAspectRatio={
                              fitMode === "stretch" ? "none" : "xMidYMid meet"
                            }
                            transform={
                              previewImg.rotation
                                ? `rotate(${previewImg.rotation} ${
                                    previewSvg.svgImgX + previewSvg.svgImgW / 2
                                  } ${previewSvg.svgImgY + previewSvg.svgImgH / 2})`
                                : undefined
                            }
                            clipPath={
                              fitMode === "cover"
                                ? "url(#previewClip)"
                                : undefined
                            }
                          />
                          <defs>
                            <clipPath id="previewClip">
                              <rect
                                x={previewSvg.ml}
                                y={previewSvg.mt}
                                width={Math.max(
                                  0,
                                  previewSvg.svgW -
                                    previewSvg.ml -
                                    previewSvg.mr,
                                )}
                                height={Math.max(
                                  0,
                                  previewSvg.svgH -
                                    previewSvg.mt -
                                    previewSvg.mb,
                                )}
                              />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div className="mt-2 text-center text-[10px] tabular-nums text-[var(--color-text-muted)]">
                        {previewSvg.pageWMm}×{previewSvg.pageHMm}mm · {fitMode}
                      </div>
                      {images.length > 1 && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPreviewIdx(Math.max(0, safePreviewIdx - 1))
                            }
                            disabled={safePreviewIdx === 0}
                            className="h-7"
                          >
                            <CaretUp size={14} className="-rotate-90" />
                          </Button>
                          <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums">
                            {safePreviewIdx + 1} / {images.length}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPreviewIdx(
                                Math.min(images.length - 1, safePreviewIdx + 1),
                              )
                            }
                            disabled={safePreviewIdx === images.length - 1}
                            className="h-7"
                          >
                            <CaretDown size={14} className="-rotate-90" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-40 items-center justify-center text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Preview loads here" : "Превью появится здесь"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PDF metadata (collapsible) */}
            <div className="mt-2 border-t border-[var(--color-border)] pt-3">
              <button
                type="button"
                onClick={() => setMetaOpen((v) => !v)}
                aria-expanded={metaOpen}
                className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <span>
                  {isEn ? "PDF metadata (optional)" : "Метаданные PDF (опц.)"}
                </span>
                <CaretDownIcon
                  size={14}
                  className={cn(
                    "transition-transform",
                    metaOpen && "rotate-180",
                  )}
                />
              </button>
              {metaOpen && (
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div>
                    <Label
                      htmlFor="jpg2pdf-meta-title"
                      className="mb-1 block text-[10px] uppercase text-[var(--color-text-muted)]"
                    >
                      {isEn ? "Title" : "Заголовок"}
                    </Label>
                    <Input
                      id="jpg2pdf-meta-title"
                      value={pdfTitle}
                      onChange={(e) => setPdfTitle(e.target.value)}
                      placeholder={isEn ? "My document" : "Мой документ"}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="jpg2pdf-meta-author"
                      className="mb-1 block text-[10px] uppercase text-[var(--color-text-muted)]"
                    >
                      {isEn ? "Author" : "Автор"}
                    </Label>
                    <Input
                      id="jpg2pdf-meta-author"
                      value={pdfAuthor}
                      onChange={(e) => setPdfAuthor(e.target.value)}
                      placeholder={isEn ? "Your name" : "Ваше имя"}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="jpg2pdf-meta-subject"
                      className="mb-1 block text-[10px] uppercase text-[var(--color-text-muted)]"
                    >
                      {isEn ? "Subject" : "Тема"}
                    </Label>
                    <Input
                      id="jpg2pdf-meta-subject"
                      value={pdfSubject}
                      onChange={(e) => setPdfSubject(e.target.value)}
                      placeholder={isEn ? "Topic" : "Тема"}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Page numbers + filename */}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label
                  htmlFor="jpg2pdf-output-name"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                >
                  {isEn ? "Filename" : "Имя файла"}
                </Label>
                <div className="flex">
                  <Input
                    id="jpg2pdf-output-name"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    placeholder="images-to-pdf"
                    className="rounded-r-none"
                  />
                  <span className="flex items-center rounded-r-[var(--radius-md)] border border-l-0 border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-muted)]">
                    .pdf
                  </span>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-muted)]">
                <input
                  type="checkbox"
                  checked={pageNumbers}
                  onChange={(e) => setPageNumbers(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <span>{isEn ? "Add page numbers" : "Нумерация страниц"}</span>
              </label>
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
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "var(--color-primary)",
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)] tabular-nums">
                {Math.round(progress)}%
              </div>
            </div>
          )}

          {resultBytes && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)] p-3 text-sm text-[var(--color-success)]"
            >
              <CheckCircle
                size={18}
                className="mt-0.5 shrink-0"
                weight="fill"
              />
              <span>
                {isEn
                  ? `PDF created with ${images.length} page${images.length !== 1 ? "s" : ""} (${formatFileSize(resultBytes.byteLength, isEn)}).`
                  : `PDF готов: ${images.length} ${images.length === 1 ? "страница" : images.length < 5 ? "страницы" : "страниц"} (${formatFileSize(resultBytes.byteLength, isEn)}).`}
              </span>
            </div>
          )}
        </>
      )}

      <output aria-live="polite" className="sr-only">
        {resultBytes
          ? isEn
            ? `Converted ${images.length} images to PDF.`
            : `Конвертировано ${images.length} изображений в PDF.`
          : ""}
      </output>
    </div>
  );
}
