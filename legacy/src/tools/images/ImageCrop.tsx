"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  UploadSimple,
  Download,
  Crop,
  Trash,
  Image as ImageIcon,
  ArrowsClockwise,
  Target,
  GridNine,
  Selection,
  MagicWand,
  ArrowCounterClockwise,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { triggerDownload } from "@/src/utils/exportHelpers";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import { MobileSlider } from "@/src/components/tool/MobileSlider";
import { ToolHint } from "@/src/components/tool";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { cn } from "@/src/lib/cn";
import { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile, normalizeImageForBrowser } from "@/src/lib/file-conversion/image-engine";

function formatFileSize(bytes: number, isEn: boolean = false): string {
  if (bytes === 0) return isEn ? "0 B" : "0 Б";
  const units = isEn ? ["B", "KB", "MB", "GB"] : ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CropMode = "manual" | "auto-square" | "auto-content";
type GridMode = "none" | "thirds" | "golden" | "diagonals";
type HandleId =
  "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | "move" | null;

const PRIMARY_COLOR_FALLBACK = "#3b82f6";

function getPrimaryColor(): string {
  if (typeof window === "undefined") return PRIMARY_COLOR_FALLBACK;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-primary")
    .trim();
  return v || PRIMARY_COLOR_FALLBACK;
}

const GOLDEN = 0.6180339887;

// Aspect-ratio presets (label, value as W/H, group)
type Preset = {
  label: string;
  value: number | null;
  group: "free" | "common" | "social" | "paper";
};

function buildPresets(isEn: boolean): Preset[] {
  return [
    { label: isEn ? "Free" : "Свободно", value: null, group: "free" },
    { label: "1:1", value: 1, group: "common" },
    { label: "3:2", value: 3 / 2, group: "common" },
    { label: "4:3", value: 4 / 3, group: "common" },
    { label: "5:4", value: 5 / 4, group: "common" },
    { label: "16:9", value: 16 / 9, group: "common" },
    { label: "9:16", value: 9 / 16, group: "common" },
    { label: "2:3", value: 2 / 3, group: "common" },
    { label: "3:4", value: 3 / 4, group: "common" },
    { label: "4:5", value: 4 / 5, group: "common" },
    {
      label: isEn ? "21:9 cinema" : "21:9 кино",
      value: 21 / 9,
      group: "common",
    },
    {
      label: isEn ? "A4 portrait" : "A4 портрет",
      value: 1 / Math.SQRT2,
      group: "paper",
    },
    {
      label: isEn ? "Story 9:16" : "Сториз 9:16",
      value: 9 / 16,
      group: "social",
    },
    { label: "FB cover 1.91:1", value: 1.91, group: "social" },
    {
      label: isEn ? "Twitter 16:9" : "Твиттер 16:9",
      value: 16 / 9,
      group: "social",
    },
    { label: "IG square", value: 1, group: "social" },
  ];
}

// Compute the bounding box at the given rotation that fits within the original image
function rotatedBounds(
  w: number,
  h: number,
  deg: number,
): { w: number; h: number } {
  const rad = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return { w: w * c + h * s, h: w * s + h * c };
}

// Detect bounding box of non-transparent / non-white content
function detectContentBounds(
  canvas: HTMLCanvasElement,
  threshold = 240,
): { x: number; y: number; w: number; h: number } | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return null;
  }
  const d = data.data;
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];
      const a = d[idx + 3];
      const isBg =
        a < 8 || (r >= threshold && g >= threshold && b >= threshold);
      if (!isBg) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export default function ImageCrop() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string>("");
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [croppedSize, setCroppedSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg" | "webp">(
    "png",
  );
  const [quality, setQuality] = useState(0.92);
  const [displayScale, setDisplayScale] = useState(1);
  const [outputName, setOutputName] = useState("cropped");
  const [gridMode, setGridMode] = useState<GridMode>("thirds");
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState<CropMode>("manual");
  const [resizeWidth, setResizeWidth] = useState<number | "">("");
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [preserveExif, setPreserveExif] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  // Interaction state
  const [activeHandle, setActiveHandle] = useState<HandleId>(null);
  const interactionRef = useRef<{
    mode: "create" | "move" | "resize";
    handle: HandleId;
    startPointer: { x: number; y: number };
    startRect: CropRect;
    shiftKey: boolean;
    altKey: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rotatedImageRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalUrlRef = useRef("");
  const croppedUrlRef = useRef("");

  // Build the source image used for cropping: original image if rotation=0, else rotated offscreen canvas
  const buildRotatedSource = useCallback(
    (img: HTMLImageElement, deg: number): HTMLCanvasElement | null => {
      if (deg === 0) return null;
      const bounds = rotatedBounds(img.width, img.height, deg);
      const off = document.createElement("canvas");
      off.width = Math.round(bounds.w);
      off.height = Math.round(bounds.h);
      const ctx = off.getContext("2d");
      if (!ctx) return off;
      ctx.translate(off.width / 2, off.height / 2);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      return off;
    },
    [],
  );

  const getSourceDims = useCallback(() => {
    const img = imageRef.current;
    if (!img) return { width: 0, height: 0 };
    if (rotation === 0) return { width: img.width, height: img.height };
    const rs = rotatedImageRef.current;
    if (rs) return { width: rs.width, height: rs.height };
    const b = rotatedBounds(img.width, img.height, rotation);
    return { width: b.w, height: b.h };
  }, [rotation]);

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      sx: number,
      sy: number,
      sw: number,
      sh: number,
    ) => {
      if (gridMode === "none" || sw < 30 || sh < 30) return;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (gridMode === "thirds") {
        const v1 = sx + sw / 3;
        const v2 = sx + (sw * 2) / 3;
        const h1 = sy + sh / 3;
        const h2 = sy + (sh * 2) / 3;
        ctx.moveTo(v1, sy);
        ctx.lineTo(v1, sy + sh);
        ctx.moveTo(v2, sy);
        ctx.lineTo(v2, sy + sh);
        ctx.moveTo(sx, h1);
        ctx.lineTo(sx + sw, h1);
        ctx.moveTo(sx, h2);
        ctx.lineTo(sx + sw, h2);
      } else if (gridMode === "golden") {
        const v1 = sx + sw * (1 - GOLDEN);
        const v2 = sx + sw * GOLDEN;
        const h1 = sy + sh * (1 - GOLDEN);
        const h2 = sy + sh * GOLDEN;
        ctx.moveTo(v1, sy);
        ctx.lineTo(v1, sy + sh);
        ctx.moveTo(v2, sy);
        ctx.lineTo(v2, sy + sh);
        ctx.moveTo(sx, h1);
        ctx.lineTo(sx + sw, h1);
        ctx.moveTo(sx, h2);
        ctx.lineTo(sx + sw, h2);
      } else if (gridMode === "diagonals") {
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + sw, sy + sh);
        ctx.moveTo(sx + sw, sy);
        ctx.lineTo(sx, sy + sh);
      }
      ctx.stroke();
    },
    [gridMode],
  );

  const drawHandles = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      primary: string,
    ) => {
      const size = 10;
      const half = size / 2;
      const positions: Array<{ id: HandleId; x: number; y: number }> = [
        { id: "tl", x: sx, y: sy },
        { id: "tr", x: sx + sw, y: sy },
        { id: "bl", x: sx, y: sy + sh },
        { id: "br", x: sx + sw, y: sy + sh },
        { id: "t", x: sx + sw / 2, y: sy },
        { id: "b", x: sx + sw / 2, y: sy + sh },
        { id: "l", x: sx, y: sy + sh / 2 },
        { id: "r", x: sx + sw, y: sy + sh / 2 },
      ];
      positions.forEach((p) => {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(p.x - half, p.y - half, size, size);
        ctx.fill();
        ctx.stroke();
      });
    },
    [],
  );

  const drawCropOverlay = useCallback(
    (rect: CropRect) => {
      const canvas = cropCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const primary = getPrimaryColor();
      const source =
        rotation === 0 ? imageRef.current : rotatedImageRef.current;
      if (!source) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sx = rect.x * displayScale;
      const sy = rect.y * displayScale;
      const sw = rect.w * displayScale;
      const sh = rect.h * displayScale;

      if (sw > 0 && sh > 0) {
        ctx.clearRect(sx, sy, sw, sh);
        ctx.drawImage(source, rect.x, rect.y, rect.w, rect.h, sx, sy, sw, sh);

        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.setLineDash([]);

        drawGrid(ctx, sx, sy, sw, sh);
        drawHandles(ctx, sx, sy, sw, sh, primary);

        ctx.fillStyle = primary;
        ctx.font = "12px sans-serif";
        const label = `${Math.round(rect.w)} × ${Math.round(rect.h)}`;
        const textY = sy > 20 ? sy - 6 : sy + sh + 16;
        ctx.fillText(label, sx, textY);
      }
    },
    [displayScale, drawGrid, drawHandles, rotation],
  );

  const setupCanvas = useCallback(() => {
    const canvas = cropCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const source = rotation === 0 ? imageRef.current : rotatedImageRef.current;
    if (!source) return;

    const maxWidth = container.clientWidth || 800;
    const scale = Math.min(1, maxWidth / source.width);
    setDisplayScale(scale);

    canvas.width = Math.round(source.width * scale);
    canvas.height = Math.round(source.height * scale);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    }
  }, [rotation]);

  const processImage = useCallback(
    (file: File) => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current);
      setOriginalFile(file);
      setOutputName(file.name.replace(/\.[^.]+$/, "") + "_cropped");
      setCroppedUrl("");
      setCroppedSize(0);
      setCropRect({ x: 0, y: 0, w: 0, h: 0 });
      setRotation(0);
      rotatedImageRef.current = null;

      const url = URL.createObjectURL(file);
      originalUrlRef.current = url;

      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setupCanvas();
      };
      img.src = url;
    },
    [setupCanvas],
  );

  // Recompute rotated source canvas whenever rotation changes
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    rotatedImageRef.current = buildRotatedSource(img, rotation);
    // Clamp crop to new bounds
    const src = getSourceDims();
    setCropRect((r) => {
      if (r.w <= 0 || r.h <= 0) return r;
      const nx = Math.max(0, Math.min(r.x, src.width - r.w));
      const ny = Math.max(0, Math.min(r.y, src.height - r.h));
      const nw = Math.min(r.w, src.width - nx);
      const nh = Math.min(r.h, src.height - ny);
      return { x: nx, y: ny, w: nw, h: nh };
    });
    setupCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, buildRotatedSource]);

  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        setupCanvas();
        drawCropOverlay(cropRect);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas, drawCropOverlay, cropRect]);

  // Re-render overlay when relevant state changes
  useEffect(() => {
    if (cropRect.w > 0 && cropRect.h > 0) {
      drawCropOverlay(cropRect);
    } else {
      setupCanvas();
    }
  }, [gridMode, drawCropOverlay, cropRect, setupCanvas, rotation]);

  const getPointerCoords = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = cropCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / displayScale;
      const y = (e.clientY - rect.top) / displayScale;
      return { x, y };
    },
    [displayScale],
  );

  const hitTestHandle = useCallback(
    (px: number, py: number, rect: CropRect): HandleId => {
      if (rect.w <= 0 || rect.h <= 0) return null;
      const tol = 12 / displayScale;
      const checks: Array<{ id: HandleId; x: number; y: number }> = [
        { id: "tl", x: rect.x, y: rect.y },
        { id: "tr", x: rect.x + rect.w, y: rect.y },
        { id: "bl", x: rect.x, y: rect.y + rect.h },
        { id: "br", x: rect.x + rect.w, y: rect.y + rect.h },
        { id: "t", x: rect.x + rect.w / 2, y: rect.y },
        { id: "b", x: rect.x + rect.w / 2, y: rect.y + rect.h },
        { id: "l", x: rect.x, y: rect.y + rect.h / 2 },
        { id: "r", x: rect.x + rect.w, y: rect.y + rect.h / 2 },
      ];
      for (const c of checks) {
        if (Math.abs(px - c.x) <= tol && Math.abs(py - c.y) <= tol) return c.id;
      }
      if (
        px >= rect.x &&
        px <= rect.x + rect.w &&
        py >= rect.y &&
        py <= rect.y + rect.h
      ) {
        return "move";
      }
      return null;
    },
    [displayScale],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const coords = getPointerCoords(e);
      const handle = hitTestHandle(coords.x, coords.y, cropRect);
      setActiveHandle(handle);

      if (handle === "move") {
        interactionRef.current = {
          mode: "move",
          handle,
          startPointer: coords,
          startRect: { ...cropRect },
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        };
      } else if (handle && handle !== null) {
        interactionRef.current = {
          mode: "resize",
          handle,
          startPointer: coords,
          startRect: { ...cropRect },
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        };
      } else {
        // Start new crop
        interactionRef.current = {
          mode: "create",
          handle: null,
          startPointer: coords,
          startRect: { x: coords.x, y: coords.y, w: 0, h: 0 },
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        };
        setCropRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
        if (croppedUrlRef.current) {
          URL.revokeObjectURL(croppedUrlRef.current);
          croppedUrlRef.current = "";
        }
        setCroppedUrl("");
        setCroppedSize(0);
      }
    },
    [getPointerCoords, hitTestHandle, cropRect],
  );

  const clampRect = useCallback(
    (r: CropRect): CropRect => {
      const src = getSourceDims();
      let { x, y, w, h } = r;
      if (w < 0) {
        x = x + w;
        w = -w;
      }
      if (h < 0) {
        y = y + h;
        h = -h;
      }
      x = Math.max(0, Math.min(x, src.width));
      y = Math.max(0, Math.min(y, src.height));
      w = Math.min(w, src.width - x);
      h = Math.min(h, src.height - y);
      return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
    },
    [getSourceDims],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const inter = interactionRef.current;
      if (!inter) {
        // hover: update cursor based on handle
        const coords = getPointerCoords(e);
        const h = hitTestHandle(coords.x, coords.y, cropRect);
        const canvas = cropCanvasRef.current;
        if (canvas) {
          let cursor = "crosshair";
          if (h === "move") cursor = "move";
          else if (h === "tl" || h === "br") cursor = "nwse-resize";
          else if (h === "tr" || h === "bl") cursor = "nesw-resize";
          else if (h === "t" || h === "b") cursor = "ns-resize";
          else if (h === "l" || h === "r") cursor = "ew-resize";
          canvas.style.cursor = cursor;
        }
        return;
      }
      e.preventDefault();
      const coords = getPointerCoords(e);
      const src = getSourceDims();
      const constrain = e.shiftKey;
      const fromCenter = e.altKey;
      const start = inter.startRect;

      let newRect: CropRect;
      if (inter.mode === "create") {
        const x0 = inter.startPointer.x;
        const y0 = inter.startPointer.y;
        let nx = Math.min(x0, coords.x);
        let ny = Math.min(y0, coords.y);
        let nw = Math.abs(coords.x - x0);
        let nh = Math.abs(coords.y - y0);
        const ar = aspectRatio;
        if (ar !== null || constrain) {
          const useAr = ar ?? 1;
          if (nw / Math.max(1, nh) > useAr) {
            nw = nh * useAr;
          } else {
            nh = nw / useAr;
          }
          if (coords.x < x0) nx = x0 - nw;
          if (coords.y < y0) ny = y0 - nh;
        }
        newRect = clampRect({ x: nx, y: ny, w: nw, h: nh });
      } else if (inter.mode === "move") {
        const dx = coords.x - inter.startPointer.x;
        const dy = coords.y - inter.startPointer.y;
        let nx = start.x + dx;
        let ny = start.y + dy;
        nx = Math.max(0, Math.min(nx, src.width - start.w));
        ny = Math.max(0, Math.min(ny, src.height - start.h));
        newRect = { x: nx, y: ny, w: start.w, h: start.h };
      } else {
        // resize
        const dx = coords.x - inter.startPointer.x;
        const dy = coords.y - inter.startPointer.y;
        let x1 = start.x;
        let y1 = start.y;
        let x2 = start.x + start.w;
        let y2 = start.y + start.h;
        const handle = inter.handle;

        if (handle === "tl") {
          x1 = start.x + dx;
          y1 = start.y + dy;
        } else if (handle === "tr") {
          x2 = start.x + start.w + dx;
          y1 = start.y + dy;
        } else if (handle === "bl") {
          x1 = start.x + dx;
          y2 = start.y + start.h + dy;
        } else if (handle === "br") {
          x2 = start.x + start.w + dx;
          y2 = start.y + start.h + dy;
        } else if (handle === "t") {
          y1 = start.y + dy;
        } else if (handle === "b") {
          y2 = start.y + start.h + dy;
        } else if (handle === "l") {
          x1 = start.x + dx;
        } else if (handle === "r") {
          x2 = start.x + start.w + dx;
        }

        let nx = Math.min(x1, x2);
        let ny = Math.min(y1, y2);
        let nw = Math.abs(x2 - x1);
        let nh = Math.abs(y2 - y1);

        const ar = aspectRatio;
        if (ar !== null || constrain) {
          const useAr = ar ?? start.w / Math.max(1, start.h);
          // Decide which dimension drives
          const isCorner =
            handle === "tl" ||
            handle === "tr" ||
            handle === "bl" ||
            handle === "br";
          const isHorz = handle === "l" || handle === "r";
          if (isCorner) {
            if (nw / Math.max(1, nh) > useAr) {
              nh = nw / useAr;
            } else {
              nw = nh * useAr;
            }
            if (handle === "tl") {
              nx = start.x + start.w - nw;
              ny = start.y + start.h - nh;
            } else if (handle === "tr") {
              ny = start.y + start.h - nh;
            } else if (handle === "bl") {
              nx = start.x + start.w - nw;
            }
          } else if (isHorz) {
            nh = nw / useAr;
            ny = start.y + start.h / 2 - nh / 2;
          } else {
            nw = nh * useAr;
            nx = start.x + start.w / 2 - nw / 2;
          }
        }

        if (fromCenter) {
          const cx0 = start.x + start.w / 2;
          const cy0 = start.y + start.h / 2;
          nx = cx0 - nw / 2;
          ny = cy0 - nh / 2;
        }

        newRect = clampRect({ x: nx, y: ny, w: nw, h: nh });
      }

      setCropRect(newRect);
      drawCropOverlay(newRect);
    },
    [
      getPointerCoords,
      hitTestHandle,
      cropRect,
      getSourceDims,
      aspectRatio,
      clampRect,
      drawCropOverlay,
    ],
  );

  const handlePointerUp = useCallback(() => {
    interactionRef.current = null;
    setActiveHandle(null);
  }, []);

  const invalidateCropResult = useCallback(() => {
    if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current);
    croppedUrlRef.current = "";
    setCroppedUrl("");
    setCroppedSize(0);
  }, []);

  const performCrop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || cropRect.w <= 0 || cropRect.h <= 0) return;
    const source = rotation === 0 ? imageRef.current : rotatedImageRef.current;
    if (!source) return;

    const cx = Math.round(cropRect.x);
    const cy = Math.round(cropRect.y);
    const cw = Math.round(cropRect.w);
    const ch = Math.round(cropRect.h);

    let outW = cw;
    let outH = ch;
    if (
      resizeEnabled &&
      typeof resizeWidth === "number" &&
      resizeWidth > 0 &&
      cw > 0
    ) {
      outW = Math.round(resizeWidth);
      outH = Math.round((resizeWidth / cw) * ch);
    }

    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (outputFormat === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, cx, cy, cw, ch, 0, 0, outW, outH);

    const mime =
      outputFormat === "jpeg"
        ? "image/jpeg"
        : outputFormat === "webp"
          ? "image/webp"
          : "image/png";
    canvas.toBlob(
      (blob) => {
        if (blob) {
          if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current);
          const newUrl = URL.createObjectURL(blob);
          croppedUrlRef.current = newUrl;
          setCroppedUrl(newUrl);
          setCroppedSize(blob.size);
        }
      },
      mime,
      outputFormat !== "png" ? quality : undefined,
    );
  }, [cropRect, outputFormat, quality, rotation, resizeEnabled, resizeWidth]);

  const centerCrop = useCallback(() => {
    const src = getSourceDims();
    if (src.width <= 0) return;
    let w: number;
    let h: number;
    if (aspectRatio !== null) {
      const imgRatio = src.width / src.height;
      if (imgRatio > aspectRatio) {
        h = src.height * 0.9;
        w = h * aspectRatio;
      } else {
        w = src.width * 0.9;
        h = w / aspectRatio;
      }
    } else {
      w = src.width * 0.8;
      h = src.height * 0.8;
    }
    const x = (src.width - w) / 2;
    const y = (src.height - h) / 2;
    const newRect = { x, y, w, h };
    setCropRect(newRect);
    drawCropOverlay(newRect);
  }, [aspectRatio, drawCropOverlay, getSourceDims]);

  const applyAspectRatio = useCallback(
    (ratio: number | null) => {
      const dims = getSourceDims();
      if (dims.width <= 0 || dims.height <= 0) return;
      setAspectRatio(ratio);
      let width = dims.width;
      let height = dims.height;
      if (ratio !== null) {
        if (dims.width / dims.height > ratio) width = dims.height * ratio;
        else height = dims.width / ratio;
      }
      const next = {
        x: (dims.width - width) / 2,
        y: (dims.height - height) / 2,
        w: width,
        h: height,
      };
      if (croppedUrlRef.current) {
        URL.revokeObjectURL(croppedUrlRef.current);
        croppedUrlRef.current = "";
      }
      setCroppedUrl("");
      setCroppedSize(0);
      setCropRect(next);
      drawCropOverlay(next);
    },
    [drawCropOverlay, getSourceDims],
  );

  // Auto-square (center)
  const autoSquare = useCallback(() => {
    const src = getSourceDims();
    if (src.width <= 0) return;
    const side = Math.min(src.width, src.height);
    const x = (src.width - side) / 2;
    const y = (src.height - side) / 2;
    const newRect = { x, y, w: side, h: side };
    setAspectRatio(1);
    setCropRect(newRect);
    drawCropOverlay(newRect);
  }, [drawCropOverlay, getSourceDims]);

  // Auto-content: crop transparent/white margins
  const autoContent = useCallback(() => {
    const source = rotation === 0 ? imageRef.current : rotatedImageRef.current;
    if (!source) return;
    setAutoBusy(true);
    setTimeout(() => {
      try {
        const off = document.createElement("canvas");
        off.width = source.width;
        off.height = source.height;
        const ctx = off.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(source, 0, 0);
        const bounds = detectContentBounds(off);
        if (bounds && bounds.w > 0 && bounds.h > 0) {
          setAspectRatio(null);
          setCropRect(bounds);
          drawCropOverlay(bounds);
        }
      } finally {
        setAutoBusy(false);
      }
    }, 30);
  }, [drawCropOverlay, rotation]);

  const acceptFile = useCallback(
    async (file: File) => {
      if (!isExtendedImageFile(file)) return;
      const target = await normalizeImageForBrowser(file);
      processImage(target);
    },
    [processImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (
        file &&
        isExtendedImageFile(file)
      ) {
        acceptFile(file);
      }
    },
    [acceptFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) acceptFile(file);
    },
    [acceptFile],
  );

  const downloadCropped = useCallback(() => {
    if (!croppedUrl) return;
    const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;
    const name = (outputName.trim() || "cropped").replace(
      /\.(png|jpg|jpeg|webp)$/i,
      "",
    );
    triggerDownload(croppedUrl, `${name}.${ext}`);
  }, [croppedUrl, outputName, outputFormat]);

  const clearImage = useCallback(() => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current);
    originalUrlRef.current = "";
    croppedUrlRef.current = "";
    setOriginalFile(null);
    setCroppedUrl("");
    setOriginalWidth(0);
    setOriginalHeight(0);
    setCroppedSize(0);
    setCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setOutputName("cropped");
    setRotation(0);
    setCropMode("manual");
    imageRef.current = null;
    rotatedImageRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current);
    };
  }, []);

  const resetCrop = useCallback(() => {
    if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current);
    croppedUrlRef.current = "";
    setCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setCroppedUrl("");
    setCroppedSize(0);
    setRotation(0);
    setupCanvas();
  }, [setupCanvas]);

  const handleCropInputChange = useCallback(
    (field: keyof CropRect, value: string) => {
      const num = parseInt(value) || 0;
      const newRect = { ...cropRect, [field]: Math.max(0, num) };
      if (aspectRatio !== null) {
        if (field === "w") newRect.h = Math.round(newRect.w / aspectRatio);
        if (field === "h") newRect.w = Math.round(newRect.h * aspectRatio);
      }
      const src = getSourceDims();
      newRect.x = Math.max(0, Math.min(newRect.x, src.width - newRect.w));
      newRect.y = Math.max(0, Math.min(newRect.y, src.height - newRect.h));
      newRect.w = Math.min(newRect.w, src.width - newRect.x);
      newRect.h = Math.min(newRect.h, src.height - newRect.y);
      invalidateCropResult();
      setCropRect(newRect);
      drawCropOverlay(newRect);
    },
    [
      cropRect,
      drawCropOverlay,
      aspectRatio,
      getSourceDims,
      invalidateCropResult,
    ],
  );

  // Percent-based crop edit
  const handleCropPctChange = useCallback(
    (field: keyof CropRect, value: string) => {
      const num = parseFloat(value);
      const src = getSourceDims();
      if (!Number.isFinite(num) || src.width <= 0) return;
      const base = field === "x" || field === "w" ? src.width : src.height;
      const px = (num / 100) * base;
      handleCropInputChange(field, String(Math.round(px)));
    },
    [getSourceDims, handleCropInputChange],
  );

  const applyCustomAspect = useCallback(() => {
    const w = parseFloat(customW);
    const h = parseFloat(customH);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      applyAspectRatio(w / h);
    }
  }, [applyAspectRatio, customW, customH]);

  const presets = useMemo(() => buildPresets(isEn), [isEn]);
  const commonPresets = useMemo(
    () => presets.filter((p) => p.group === "free" || p.group === "common"),
    [presets],
  );
  const visiblePresets = useMemo(
    () =>
      commonPresets.filter(
        (preset) =>
          preset.value === null ||
          preset.value === 1 ||
          preset.value === 3 / 2 ||
          preset.value === 4 / 3 ||
          preset.value === 16 / 9,
      ),
    [commonPresets],
  );
  const socialPresets = useMemo(
    () => presets.filter((p) => p.group === "social" || p.group === "paper"),
    [presets],
  );

  const formatToggles: Array<"png" | "jpeg" | "webp"> = ["png", "jpeg", "webp"];
  const hasQuality = outputFormat !== "png";

  const renderBounds =
    rotation === 0
      ? { w: originalWidth, h: originalHeight }
      : rotatedBounds(originalWidth, originalHeight, rotation);
  const src = { width: renderBounds.w, height: renderBounds.h };
  const pctX = src.width > 0 ? (cropRect.x / src.width) * 100 : 0;
  const pctY = src.height > 0 ? (cropRect.y / src.height) * 100 : 0;
  const pctW = src.width > 0 ? (cropRect.w / src.width) * 100 : 0;
  const pctH = src.height > 0 ? (cropRect.h / src.height) * 100 : 0;

  // Highlight active handle subtly
  void activeHandle;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        data-file-paste-target="true"
        accept={EXTENDED_IMAGE_ACCEPT}
        className="hidden"
        onChange={handleFileSelect}
      />

      {!originalFile && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label={
              isEn
                ? "Upload image to crop"
                : "Загрузить изображение для обрезки"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              "tool-short-landscape-dropzone cursor-pointer rounded-[var(--radius-lg)] border-2 border-dashed p-7 text-center transition-colors sm:p-10",
              dragging
                ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)]"
                : "border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]/30",
            )}
          >
            <UploadSimple
              size={56}
              className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-60"
            />
            <h3 className="mb-1 text-lg font-semibold">
              {isEn ? "Drop an image here" : "Перетащите изображение сюда"}
            </h3>
            <div className="mb-3 text-sm text-[var(--color-text-muted)]">
              {isEn
                ? "or click to select a file"
                : "или нажмите для выбора файла"}
            </div>
          </div>
          <div className="hidden">
            <ToolHint title={isEn ? "Crop controls" : "Управление кропом"}>
              {isEn
                ? "Drag handles to resize the crop. Shift keeps aspect ratio, Alt resizes from center. Presets, grid overlays, rotation and export settings appear after upload."
                : "Тяните маркеры области. Shift сохраняет пропорции, Alt меняет размер от центра. Пресеты, сетка, поворот и экспорт появятся после загрузки."}
            </ToolHint>
          </div>
        </>
      )}

      {originalFile && (
        <div className="flex flex-col gap-4">
          {/* Mode tabs */}
          <div className="hidden">
            <Tabs
              value={cropMode}
              onValueChange={(v) => setCropMode(v as CropMode)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="manual" className="gap-1.5">
                  <Selection size={16} /> {isEn ? "Manual" : "Вручную"}
                </TabsTrigger>
                <TabsTrigger value="auto-square" className="gap-1.5">
                  <Target size={16} /> {isEn ? "Auto-square" : "Авто-квадрат"}
                </TabsTrigger>
                <TabsTrigger value="auto-content" className="gap-1.5">
                  <MagicWand size={16} />{" "}
                  {isEn ? "Auto-content" : "Авто-контент"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-3" />
              <TabsContent value="auto-square" className="mt-3">
                <Card className="p-4 sm:p-6">
                  <p className="mb-3 text-sm text-[var(--color-text-muted)]">
                    {isEn
                      ? "Crop the largest centered square (1:1) from the image."
                      : "Обрезать максимальный центрированный квадрат (1:1) из изображения."}
                  </p>
                  <Button onClick={autoSquare} className="gap-1.5">
                    <Target size={16} />{" "}
                    {isEn ? "Apply auto-square" : "Применить авто-квадрат"}
                  </Button>
                </Card>
              </TabsContent>
              <TabsContent value="auto-content" className="mt-3">
                <Card className="p-4 sm:p-6">
                  <p className="mb-3 text-sm text-[var(--color-text-muted)]">
                    {isEn
                      ? "Scan pixels and crop away transparent or near-white margins."
                      : "Сканировать пиксели и обрезать прозрачные или почти-белые поля."}
                  </p>
                  <Button
                    onClick={autoContent}
                    disabled={autoBusy}
                    className="gap-1.5"
                  >
                    <MagicWand size={16} />
                    {autoBusy
                      ? isEn
                        ? "Scanning..."
                        : "Сканирование..."
                      : isEn
                        ? "Detect content"
                        : "Найти контент"}
                  </Button>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Controls */}
          <Card className="order-2 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold">
                <Crop size={18} />{" "}
                {isEn ? "Selected area" : "Выбранная область"}
              </div>
              <span className="font-mono text-sm text-[var(--color-text-muted)]">
                {Math.round(cropRect.w)} × {Math.round(cropRect.h)} px
              </span>
            </div>

            <div
              className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5"
              role="radiogroup"
              aria-label={isEn ? "Aspect ratio" : "Соотношение сторон"}
            >
              {visiblePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  role="radio"
                  aria-checked={aspectRatio === preset.value}
                  onClick={() => applyAspectRatio(preset.value)}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border px-3 text-sm font-semibold transition-colors",
                    aspectRatio === preset.value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div>
              {!croppedUrl ? (
                <Button
                  size="lg"
                  data-primary-action="image-crop"
                  data-primary-state="crop"
                  onClick={performCrop}
                  disabled={cropRect.w <= 0 || cropRect.h <= 0}
                  className="w-full gap-1.5"
                >
                  <Crop size={18} />{" "}
                  {isEn ? "Crop image" : "Обрезать изображение"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  data-primary-action="image-crop"
                  data-primary-state="download"
                  onClick={downloadCropped}
                  className="w-full gap-1.5"
                >
                  <Download size={18} />{" "}
                  {isEn ? "Download image" : "Скачать изображение"}
                </Button>
              )}
              <Button onClick={centerCrop} variant="outline" className="hidden">
                <Target size={16} />
                {isEn ? "Center" : "Центр"}
              </Button>
              <Button variant="outline" onClick={resetCrop} className="hidden">
                <ArrowsClockwise size={16} /> {isEn ? "Reset" : "Сбросить"}
              </Button>
              <Button
                variant="ghost"
                onClick={clearImage}
                className="hidden"
                aria-label={isEn ? "Remove image" : "Удалить изображение"}
              >
                <Trash size={16} />
              </Button>
            </div>

            <AdvancedSettings
              className="mb-4"
              title={
                isEn
                  ? "Precise crop and export settings"
                  : "Точная обрезка и экспорт"
              }
              description={
                isEn
                  ? "Coordinates, ratios, rotation, grid, format and resize"
                  : "Координаты, пропорции, поворот, сетка, формат и размер"
              }
            >
              {/* Numeric px inputs */}
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    X (px)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={Math.round(cropRect.x) || ""}
                    onChange={(e) => handleCropInputChange("x", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    Y (px)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={Math.round(cropRect.y) || ""}
                    onChange={(e) => handleCropInputChange("y", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Width (px)" : "Ширина (px)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={Math.round(cropRect.w) || ""}
                    onChange={(e) => handleCropInputChange("w", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Height (px)" : "Высота (px)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={Math.round(cropRect.h) || ""}
                    onChange={(e) => handleCropInputChange("h", e.target.value)}
                  />
                </div>
              </div>

              {/* Numeric % inputs */}
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    X (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={pctX ? pctX.toFixed(1) : ""}
                    onChange={(e) => handleCropPctChange("x", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    Y (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={pctY ? pctY.toFixed(1) : ""}
                    onChange={(e) => handleCropPctChange("y", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    W (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={pctW ? pctW.toFixed(1) : ""}
                    onChange={(e) => handleCropPctChange("w", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                    H (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={pctH ? pctH.toFixed(1) : ""}
                    onChange={(e) => handleCropPctChange("h", e.target.value)}
                  />
                </div>
              </div>

              {/* Aspect ratio common */}
              <div className="hidden">
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Aspect ratio" : "Соотношение сторон"}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {commonPresets.map((preset, idx) => (
                    <button
                      key={`${preset.label}-${idx}`}
                      type="button"
                      onClick={() => {
                        setAspectRatio(preset.value);
                      }}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs transition-colors",
                        preset.value !== null && "font-mono",
                        aspectRatio === preset.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] font-bold text-[var(--color-primary-foreground)]"
                          : "border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect ratio social/paper */}
              <div className="hidden">
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Social & paper" : "Соцсети и бумага"}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {socialPresets.map((preset, idx) => (
                    <button
                      key={`${preset.label}-${idx}`}
                      type="button"
                      onClick={() => {
                        setAspectRatio(preset.value);
                      }}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs transition-colors",
                        aspectRatio === preset.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] font-bold text-[var(--color-primary-foreground)]"
                          : "border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom W:H */}
              <div className="mb-3">
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Custom W : H" : "Свой W : H"}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={customW}
                    onChange={(e) => setCustomW(e.target.value)}
                    placeholder="W"
                    className="h-11 max-w-24"
                    inputMode="decimal"
                  />
                  <span className="text-[var(--color-text-muted)]">:</span>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={customH}
                    onChange={(e) => setCustomH(e.target.value)}
                    placeholder="H"
                    className="h-11 max-w-24"
                    inputMode="decimal"
                  />
                  <Button onClick={applyCustomAspect} variant="outline">
                    {isEn ? "Apply" : "Применить"}
                  </Button>
                </div>
              </div>

              {/* Rotation */}
              <div className="mb-3">
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Rotation" : "Поворот"}
                </Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      invalidateCropResult();
                      setRotation((r) => {
                        let v = r - 90;
                        if (v < -180) v += 360;
                        return v;
                      });
                    }}
                    className="gap-1.5"
                  >
                    <ArrowCounterClockwise size={14} /> -90°
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      invalidateCropResult();
                      setRotation((r) => {
                        let v = r + 90;
                        if (v > 180) v -= 360;
                        return v;
                      });
                    }}
                    className="gap-1.5"
                  >
                    <ArrowClockwise size={14} /> +90°
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      invalidateCropResult();
                      setRotation(0);
                    }}
                    className="gap-1.5"
                  >
                    <ArrowsClockwise size={14} /> {isEn ? "Reset" : "Сброс"}
                  </Button>
                </div>
                <MobileSlider
                  label={isEn ? "Angle" : "Угол"}
                  value={rotation}
                  min={-180}
                  max={180}
                  step={1}
                  unit="°"
                  onChange={(v) => {
                    invalidateCropResult();
                    setRotation(Math.max(-180, Math.min(180, v)));
                  }}
                />
              </div>

              {/* Grid mode */}
              <div className="mb-3">
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Overlay" : "Сетка"}
                </Label>
                <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
                  {(
                    ["none", "thirds", "golden", "diagonals"] as GridMode[]
                  ).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGridMode(g)}
                      className={cn(
                        "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-semibold transition-colors min-h-11",
                        gridMode === g
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      {g === "none"
                        ? isEn
                          ? "None"
                          : "Нет"
                        : g === "thirds"
                          ? isEn
                            ? "Thirds"
                            : "Трети"
                          : g === "golden"
                            ? isEn
                              ? "Golden"
                              : "Золото"
                            : isEn
                              ? "Diagonals"
                              : "Диагонали"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format + quality + filename */}
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Format" : "Формат"}
                  </Label>
                  <div
                    role="radiogroup"
                    className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5"
                  >
                    {formatToggles.map((f) => (
                      <button
                        key={f}
                        type="button"
                        role="radio"
                        aria-checked={outputFormat === f}
                        onClick={() => {
                          invalidateCropResult();
                          setOutputFormat(f);
                        }}
                        className={cn(
                          "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-semibold transition-colors min-h-11",
                          outputFormat === f
                            ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                        )}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {hasQuality && (
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      {isEn ? "Quality" : "Качество"}:{" "}
                      <span className="tabular-nums">
                        {Math.round(quality * 100)}%
                      </span>
                    </Label>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={quality}
                      onChange={(e) => {
                        invalidateCropResult();
                        setQuality(parseFloat(e.target.value));
                      }}
                      className="w-full accent-[var(--color-primary)]"
                    />
                  </div>
                )}
                <div className={hasQuality ? "" : "sm:col-span-2"}>
                  <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Filename" : "Имя файла"}
                  </Label>
                  <div className="flex">
                    <Input
                      value={outputName}
                      onChange={(e) => setOutputName(e.target.value)}
                      placeholder="cropped"
                      className="h-11 rounded-r-none text-xs"
                    />
                    <span className="flex items-center rounded-r-[var(--radius-md)] border border-l-0 border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-muted)] tabular-nums">
                      .{outputFormat === "jpeg" ? "jpg" : outputFormat}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resize on export */}
              <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-3">
                <label className="mb-2 flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={resizeEnabled}
                    onChange={(e) => {
                      invalidateCropResult();
                      setResizeEnabled(e.target.checked);
                    }}
                    className="h-5 w-5 accent-[var(--color-primary)]"
                  />
                  {isEn
                    ? "Crop then resize to width"
                    : "Обрезать и изменить ширину"}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    disabled={!resizeEnabled}
                    value={resizeWidth}
                    onChange={(e) => {
                      invalidateCropResult();
                      const v = parseInt(e.target.value);
                      setResizeWidth(Number.isFinite(v) ? v : "");
                    }}
                    placeholder="1080"
                    className="h-11 max-w-32 text-xs"
                    inputMode="numeric"
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "px wide (height auto)" : "px ширина (высота авто)"}
                  </span>
                </div>
              </div>

              {/* EXIF */}
              <div className="hidden">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={preserveExif}
                    onChange={(e) => setPreserveExif(e.target.checked)}
                    className="mt-0.5 accent-[var(--color-primary)]"
                    disabled
                  />
                  <span>
                    <span className="font-semibold">
                      {isEn
                        ? "Preserve EXIF metadata"
                        : "Сохранить метаданные EXIF"}
                    </span>{" "}
                    <span className="text-[var(--color-text-muted)]">
                      {isEn
                        ? "— browser canvas export strips EXIF; full preservation requires server-side or piexifjs (not bundled). Toggle disabled."
                        : "— canvas-экспорт в браузере удаляет EXIF; полное сохранение требует серверной обработки или piexifjs (не включено). Отключено."}
                    </span>
                  </span>
                </label>
              </div>

              <p className="mb-3 text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Drag corner/edge handles to resize. Shift = constrain aspect, Alt = from center."
                  : "Тяните угловые/боковые маркеры. Shift = пропорции, Alt = из центра."}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={centerCrop}
                  variant="outline"
                  className="gap-1.5"
                >
                  <Target size={16} />
                  {isEn ? "Center selection" : "По центру"}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetCrop}
                  className="gap-1.5"
                >
                  <ArrowsClockwise size={16} />{" "}
                  {isEn ? "Reset crop" : "Сбросить область"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearImage}
                  className="text-[var(--color-danger)]"
                  aria-label={isEn ? "Remove image" : "Удалить изображение"}
                >
                  <Trash size={16} />{" "}
                  {isEn ? "Choose another image" : "Выбрать другое изображение"}
                </Button>
              </div>
            </AdvancedSettings>
          </Card>

          {/* Info */}
          <div className="hidden">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="p-4 text-center transition-colors hover:bg-[var(--color-surface-muted)]">
                <div className="text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Original" : "Оригинал"}
                </div>
                <div className="text-lg font-bold tabular-nums">
                  {originalWidth} × {originalHeight}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(originalFile.size, isEn)}
                </div>
              </Card>
              <Card className="p-4 text-center transition-colors hover:bg-[var(--color-surface-muted)]">
                <div className="text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Crop area" : "Область обрезки"}
                </div>
                <div className="text-lg font-bold tabular-nums text-[var(--color-primary)]">
                  {Math.round(cropRect.w)} × {Math.round(cropRect.h)}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] tabular-nums">
                  {isEn ? "at" : "на"} {Math.round(cropRect.x)},{" "}
                  {Math.round(cropRect.y)}
                </div>
              </Card>
              <Card
                className="p-4 text-center"
                style={{
                  background: croppedUrl
                    ? "color-mix(in oklab, var(--color-success) 6%, transparent)"
                    : undefined,
                }}
              >
                <div className="text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Result" : "Результат"}
                </div>
                <div
                  className="text-lg font-bold tabular-nums"
                  style={{
                    color: croppedUrl
                      ? "var(--color-success)"
                      : "var(--color-text-subtle)",
                  }}
                >
                  {croppedUrl ? formatFileSize(croppedSize, isEn) : "—"}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {croppedUrl
                    ? isEn
                      ? "Ready to download"
                      : "Готово к скачиванию"
                    : isEn
                      ? "Waiting for crop"
                      : "Ожидание"}
                </div>
              </Card>
            </div>
          </div>

          {/* Crop Canvas */}
          <Card className="order-1 p-3 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <GridNine size={20} /> {isEn ? "Select area" : "Выберите область"}
            </h3>
            <div
              ref={containerRef}
              className="tool-short-landscape-stage flex min-h-[340px] items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]"
            >
              <canvas
                ref={cropCanvasRef}
                style={{
                  cursor: "crosshair",
                  maxWidth: "100%",
                  display: "block",
                  touchAction: "none",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            </div>
          </Card>

          {/* Cropped Preview */}
          {croppedUrl && (
            <Card className="order-3 p-4 sm:p-6">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <ImageIcon size={20} /> {isEn ? "Crop result" : "Результат"}
              </h3>
              <div className="flex min-h-[100px] items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={croppedUrl}
                  alt="Cropped"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                  }}
                />
              </div>
            </Card>
          )}

          <output aria-live="polite" className="order-6 sr-only">
            {croppedUrl
              ? isEn
                ? `Cropped to ${Math.round(cropRect.w)}×${Math.round(cropRect.h)}, ${formatFileSize(croppedSize, true)}.`
                : `Обрезано до ${Math.round(cropRect.w)}×${Math.round(cropRect.h)}, ${formatFileSize(croppedSize, false)}.`
              : ""}
          </output>
        </div>
      )}
    </div>
  );
}
