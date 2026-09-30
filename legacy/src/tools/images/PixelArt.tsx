"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  Copy,
  Download,
  Eraser,
  PaintBucket,
  PencilSimple,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";
import { downloadBlob, downloadCanvas } from "@/src/utils/exportHelpers";

const GRID_SIZES = [8, 16, 32, 64] as const;
const EXPORT_SCALES = [4, 8, 16, 32] as const;
const GIF_DELAYS = [100, 200, 500, 1000] as const;

type GridSize = (typeof GRID_SIZES)[number];
type Tool = "draw" | "erase" | "fill";
type ExportFormat = "png" | "jpeg" | "webp" | "gif";
type Grid = string[][];

interface HistorySnapshot {
  frames: Grid[];
  frameIndex: number;
  gridSize: GridSize;
}

function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ""),
  );
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function cloneFrames(frames: Grid[]): Grid[] {
  return frames.map(cloneGrid);
}

function resizeGrid(grid: Grid, size: number): Grid {
  const oldSize = grid.length;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const sourceX = Math.min(oldSize - 1, Math.floor((x * oldSize) / size));
      const sourceY = Math.min(oldSize - 1, Math.floor((y * oldSize) / size));
      return grid[sourceY]?.[sourceX] ?? "";
    }),
  );
}

function floodFill(
  grid: Grid,
  startX: number,
  startY: number,
  replacement: string,
): Grid {
  const result = cloneGrid(grid);
  const target = result[startY]?.[startX] ?? "";
  if (target === replacement) return result;
  const queue: Array<[number, number]> = [[startX, startY]];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x}:${y}`;
    if (
      visited.has(key) ||
      x < 0 ||
      y < 0 ||
      y >= result.length ||
      x >= result.length
    )
      continue;
    visited.add(key);
    if (result[y][x] !== target) continue;
    result[y][x] = replacement;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return result;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[\da-f]{6}$/i.test(hex) ? hex.slice(1) : "FFFFFF";
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function lzwEncode(pixels: Uint8Array, minimumCodeSize: number): number[] {
  const clearCode = 1 << minimumCodeSize;
  const endCode = clearCode + 1;
  let codeSize = minimumCodeSize + 1;
  let nextCode = endCode + 1;
  const dictionary = new Map<string, number>();
  const reset = () => {
    dictionary.clear();
    for (let index = 0; index < clearCode; index += 1)
      dictionary.set(String.fromCharCode(index), index);
    codeSize = minimumCodeSize + 1;
    nextCode = endCode + 1;
  };
  reset();

  const output: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;
  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      output.push(bitBuffer & 255);
      bitBuffer >>>= 8;
      bitCount -= 8;
    }
  };

  emit(clearCode);
  let prefix = String.fromCharCode(pixels[0] ?? 0);
  for (let index = 1; index < pixels.length; index += 1) {
    const next = String.fromCharCode(pixels[index]);
    const combined = prefix + next;
    if (dictionary.has(combined)) {
      prefix = combined;
      continue;
    }
    emit(dictionary.get(prefix) ?? 0);
    if (nextCode < 4096) {
      dictionary.set(combined, nextCode);
      nextCode += 1;
      if (nextCode > 1 << codeSize && codeSize < 12) codeSize += 1;
    } else {
      emit(clearCode);
      reset();
    }
    prefix = next;
  }
  emit(dictionary.get(prefix) ?? 0);
  emit(endCode);
  if (bitCount > 0) output.push(bitBuffer & 255);
  return output;
}

function encodeGif(
  frames: Grid[],
  gridSize: number,
  cellPixels: number,
  padding: number,
  delayMs: number,
  backgroundColor: string,
  transparent: boolean,
): Uint8Array {
  const contentSize = gridSize * cellPixels;
  const width = contentSize + padding * 2;
  const height = contentSize + padding * 2;
  const transparentKey = "__transparent__";
  const colors = new Map<string, number>();
  const palette: Array<[number, number, number]> = [];
  const backgroundKey = backgroundColor.toUpperCase();
  colors.set(transparent ? transparentKey : backgroundKey, 0);
  palette.push(hexToRgb(backgroundColor));

  frames.forEach((frame) =>
    frame.forEach((row) =>
      row.forEach((cell) => {
        const key = cell
          ? cell.toUpperCase()
          : transparent
            ? transparentKey
            : backgroundKey;
        if (!colors.has(key) && palette.length < 256) {
          colors.set(key, palette.length);
          palette.push(hexToRgb(cell || backgroundColor));
        }
      }),
    ),
  );

  let depth = 2;
  while (1 << depth < palette.length) depth += 1;
  const paletteSize = 1 << depth;
  while (palette.length < paletteSize) palette.push([0, 0, 0]);

  const indexedFrames = frames.map((frame) => {
    const pixels = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const contentX = x - padding;
        const contentY = y - padding;
        const inside =
          contentX >= 0 &&
          contentY >= 0 &&
          contentX < contentSize &&
          contentY < contentSize;
        const cell = inside
          ? (frame[Math.floor(contentY / cellPixels)]?.[
              Math.floor(contentX / cellPixels)
            ] ?? "")
          : "";
        const key = cell
          ? cell.toUpperCase()
          : transparent
            ? transparentKey
            : backgroundKey;
        pixels[y * width + x] = colors.get(key) ?? 0;
      }
    }
    return pixels;
  });

  const output: number[] = [];
  for (const character of "GIF89a") output.push(character.charCodeAt(0));
  output.push(
    width & 255,
    (width >> 8) & 255,
    height & 255,
    (height >> 8) & 255,
  );
  output.push(0x80 | ((depth - 1) << 4) | (depth - 1), 0, 0);
  palette.forEach(([red, green, blue]) => output.push(red, green, blue));
  output.push(0x21, 0xff, 0x0b);
  for (const character of "NETSCAPE2.0") output.push(character.charCodeAt(0));
  output.push(0x03, 0x01, 0x00, 0x00, 0x00);

  const delay = Math.max(2, Math.round(delayMs / 10));
  indexedFrames.forEach((pixels) => {
    output.push(0x21, 0xf9, 0x04);
    output.push(
      ((transparent ? 2 : 1) << 2) | (transparent ? 1 : 0),
      delay & 255,
      (delay >> 8) & 255,
      0,
      0,
    );
    output.push(
      0x2c,
      0,
      0,
      0,
      0,
      width & 255,
      (width >> 8) & 255,
      height & 255,
      (height >> 8) & 255,
      0,
    );
    const minimumCodeSize = Math.max(2, depth);
    output.push(minimumCodeSize);
    const compressed = lzwEncode(pixels, minimumCodeSize);
    for (let offset = 0; offset < compressed.length; offset += 255) {
      const block = compressed.slice(offset, offset + 255);
      output.push(block.length, ...block);
    }
    output.push(0);
  });
  output.push(0x3b);
  return new Uint8Array(output);
}

export default function PixelArt() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const canvasSize = 512;

  const [gridSize, setGridSize] = useState<GridSize>(16);
  const [frames, setFrames] = useState<Grid[]>(() => [createEmptyGrid(16)]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState("#111827");
  const [showGrid, setShowGrid] = useState(true);
  const [mirrorX, setMirrorX] = useState(false);
  const [mirrorY, setMirrorY] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [exportScale, setExportScale] = useState(16);
  const [exportPadding, setExportPadding] = useState(0);
  const [opaqueBackground, setOpaqueBackground] = useState(false);
  const [exportBackground, setExportBackground] = useState("#FFFFFF");
  const [gifDelay, setGifDelay] = useState(200);
  const [outputName, setOutputName] = useState("pixel-art");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const currentGrid = frames[frameIndex] ?? frames[0];

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentGrid) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const cell = canvasSize / gridSize;
    context.clearRect(0, 0, canvasSize, canvasSize);

    const checker = Math.max(8, cell / 2);
    for (let y = 0; y < canvasSize; y += checker) {
      for (let x = 0; x < canvasSize; x += checker) {
        context.fillStyle =
          (x / checker + y / checker) % 2 === 0 ? "#ffffff" : "#e5e7eb";
        context.fillRect(x, y, checker, checker);
      }
    }
    currentGrid.forEach((row, y) =>
      row.forEach((cellColor, x) => {
        if (!cellColor) return;
        context.fillStyle = cellColor;
        context.fillRect(x * cell, y * cell, Math.ceil(cell), Math.ceil(cell));
      }),
    );

    if (showGrid) {
      context.strokeStyle = "rgba(15, 23, 42, 0.18)";
      context.lineWidth = 1;
      context.beginPath();
      for (let index = 0; index <= gridSize; index += 1) {
        const point = index * cell;
        context.moveTo(point, 0);
        context.lineTo(point, canvasSize);
        context.moveTo(0, point);
        context.lineTo(canvasSize, point);
      }
      context.stroke();
    }
  }, [currentGrid, gridSize, showGrid]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(redraw);
    return () => window.cancelAnimationFrame(frame);
  }, [redraw]);

  const saveHistory = useCallback(() => {
    setHistory((current) => [
      ...current.slice(-29),
      {
        frames: cloneFrames(frames),
        frameIndex,
        gridSize,
      },
    ]);
  }, [frameIndex, frames, gridSize]);

  const pointFromEvent = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(
        ((event.clientX - rect.left) / rect.width) * gridSize,
      );
      const y = Math.floor(
        ((event.clientY - rect.top) / rect.height) * gridSize,
      );
      if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return null;
      return { x, y };
    },
    [gridSize],
  );

  const paintCell = useCallback(
    (x: number, y: number) => {
      const replacement = tool === "erase" ? "" : color;
      setFrames((current) =>
        current.map((frame, index) => {
          if (index !== frameIndex) return frame;
          const next = cloneGrid(frame);
          const coordinates = new Set<string>([`${x}:${y}`]);
          if (mirrorX) coordinates.add(`${gridSize - 1 - x}:${y}`);
          if (mirrorY) coordinates.add(`${x}:${gridSize - 1 - y}`);
          if (mirrorX && mirrorY)
            coordinates.add(`${gridSize - 1 - x}:${gridSize - 1 - y}`);
          coordinates.forEach((coordinate) => {
            const [targetX, targetY] = coordinate.split(":").map(Number);
            next[targetY][targetX] = replacement;
          });
          return next;
        }),
      );
    },
    [color, frameIndex, gridSize, mirrorX, mirrorY, tool],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const point = pointFromEvent(event);
      if (!point) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      saveHistory();
      if (tool === "fill") {
        setFrames((current) =>
          current.map((frame, index) =>
            index === frameIndex
              ? floodFill(frame, point.x, point.y, color)
              : frame,
          ),
        );
        return;
      }
      drawingRef.current = true;
      paintCell(point.x, point.y);
    },
    [color, frameIndex, paintCell, pointFromEvent, saveHistory, tool],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || tool === "fill") return;
      const point = pointFromEvent(event);
      if (point) paintCell(point.x, point.y);
    },
    [paintCell, pointFromEvent, tool],
  );

  const stopDrawing = useCallback(() => {
    drawingRef.current = false;
  }, []);

  const changeGridSize = useCallback(
    (size: GridSize) => {
      saveHistory();
      setGridSize(size);
      setFrames((current) => current.map((frame) => resizeGrid(frame, size)));
    },
    [saveHistory],
  );

  const undo = useCallback(() => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFrames(cloneFrames(previous.frames));
    setFrameIndex(previous.frameIndex);
    setGridSize(previous.gridSize);
    setHistory((current) => current.slice(0, -1));
  }, [history]);

  const clearFrame = useCallback(() => {
    saveHistory();
    setFrames((current) =>
      current.map((frame, index) =>
        index === frameIndex ? createEmptyGrid(gridSize) : frame,
      ),
    );
  }, [frameIndex, gridSize, saveHistory]);

  const addFrame = useCallback(() => {
    saveHistory();
    setFrames((current) => [...current, createEmptyGrid(gridSize)]);
    setFrameIndex(frames.length);
  }, [frames.length, gridSize, saveHistory]);

  const duplicateFrame = useCallback(() => {
    saveHistory();
    setFrames((current) => [...current, cloneGrid(current[frameIndex])]);
    setFrameIndex(frames.length);
  }, [frameIndex, frames.length, saveHistory]);

  const deleteFrame = useCallback(() => {
    if (frames.length <= 1) return;
    saveHistory();
    setFrames((current) => current.filter((_, index) => index !== frameIndex));
    setFrameIndex((current) =>
      Math.max(0, Math.min(current - 1, frames.length - 2)),
    );
  }, [frameIndex, frames.length, saveHistory]);

  const createExportCanvas = useCallback(
    (grid: Grid, forceOpaque = false) => {
      const contentSize = gridSize * exportScale;
      const canvas = document.createElement("canvas");
      canvas.width = contentSize + exportPadding * 2;
      canvas.height = contentSize + exportPadding * 2;
      const context = canvas.getContext("2d");
      if (!context) return canvas;
      context.imageSmoothingEnabled = false;
      if (opaqueBackground || forceOpaque) {
        context.fillStyle = /^#[\da-f]{6}$/i.test(exportBackground)
          ? exportBackground
          : "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      grid.forEach((row, y) =>
        row.forEach((cellColor, x) => {
          if (!cellColor) return;
          context.fillStyle = cellColor;
          context.fillRect(
            exportPadding + x * exportScale,
            exportPadding + y * exportScale,
            exportScale,
            exportScale,
          );
        }),
      );
      return canvas;
    },
    [exportBackground, exportPadding, exportScale, gridSize, opaqueBackground],
  );

  const exportArtwork = useCallback(async () => {
    setExporting(true);
    setError("");
    try {
      const baseName = outputName.trim() || "pixel-art";
      if (format === "gif") {
        const bytes = encodeGif(
          frames,
          gridSize,
          exportScale,
          exportPadding,
          gifDelay,
          exportBackground,
          !opaqueBackground,
        );
        downloadBlob(
          new Blob([bytes.buffer as ArrayBuffer], { type: "image/gif" }),
          `${baseName}.gif`,
        );
      } else {
        const canvas = createExportCanvas(currentGrid, format === "jpeg");
        downloadCanvas(canvas, {
          baseName,
          format,
          quality: format === "png" ? undefined : 0.94,
        });
      }
    } catch {
      setError(
        isEn
          ? "The artwork could not be exported."
          : "Не удалось экспортировать рисунок.",
      );
    } finally {
      setExporting(false);
    }
  }, [
    createExportCanvas,
    currentGrid,
    exportBackground,
    exportPadding,
    exportScale,
    format,
    frames,
    gifDelay,
    gridSize,
    isEn,
    opaqueBackground,
    outputName,
  ]);

  const tools: Array<{
    value: Tool;
    Icon: typeof PencilSimple;
    en: string;
    ru: string;
  }> = [
    { value: "draw", Icon: PencilSimple, en: "Draw", ru: "Рисовать" },
    { value: "erase", Icon: Eraser, en: "Erase", ru: "Стереть" },
    { value: "fill", Icon: PaintBucket, en: "Fill", ru: "Заливка" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            className="min-h-11 min-w-11"
            onClick={() => setError("")}
            aria-label={isEn ? "Dismiss" : "Закрыть"}
          >
            <X size={18} className="mx-auto" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
      <Card className="p-3 sm:p-4">
        <div className="tool-short-landscape-square mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-inner">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="block size-full cursor-crosshair touch-none"
            style={{ imageRendering: "pixelated" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
            aria-label={isEn ? "Pixel art canvas" : "Холст пиксель-арта"}
          />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2">
          {tools.map(({ value, Icon, en, ru }) => (
            <button
              key={value}
              type="button"
              aria-pressed={tool === value}
              onClick={() => setTool(value)}
              className={cn(
                "flex min-h-12 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-2 text-sm font-semibold",
                tool === value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
              )}
            >
              <Icon size={19} />{" "}
              <span className="hidden min-[390px]:inline">
                {isEn ? en : ru}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pixel-color">{isEn ? "Color" : "Цвет"}</Label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="pixel-color"
                type="color"
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent p-1"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pixel-grid-size">
              {isEn ? "Canvas size" : "Размер сетки"}
            </Label>
            <select
              id="pixel-grid-size"
              className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              value={gridSize}
              onChange={(event) =>
                changeGridSize(Number(event.target.value) as GridSize)
              }
            >
              {GRID_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} × {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          size="lg"
          className="mt-4 min-h-12 w-full"
          onClick={() => void exportArtwork()}
          disabled={exporting}
        >
          <Download size={20} weight="bold" />
          {exporting
            ? isEn
              ? "Exporting…"
              : "Экспорт…"
            : isEn
              ? `Export ${format.toUpperCase()}`
              : `Экспортировать ${format.toUpperCase()}`}
        </Button>
      </Card>
      </div>

      <AdvancedSettings
        className="mt-4"
        title={isEn ? "Drawing and export options" : "Рисование и экспорт"}
        description={
          isEn
            ? "Mirrors, grid, frames, GIF, scale, format and padding"
            : "Зеркала, сетка, кадры, GIF, масштаб, формат и отступ"
        }
      >
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-[var(--color-primary)]"
                checked={mirrorX}
                onChange={(event) => setMirrorX(event.target.checked)}
              />
              {isEn ? "Mirror X" : "Зеркало X"}
            </label>
            <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-[var(--color-primary)]"
                checked={mirrorY}
                onChange={(event) => setMirrorY(event.target.checked)}
              />
              {isEn ? "Mirror Y" : "Зеркало Y"}
            </label>
            <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-[var(--color-primary)]"
                checked={showGrid}
                onChange={(event) => setShowGrid(event.target.checked)}
              />
              {isEn ? "Show grid" : "Показывать сетку"}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              onClick={undo}
              disabled={history.length === 0}
            >
              <ArrowCounterClockwise size={18} /> {isEn ? "Undo" : "Отменить"}
            </Button>
            <Button variant="outline" className="min-h-11" onClick={clearFrame}>
              <Trash size={18} /> {isEn ? "Clear frame" : "Очистить кадр"}
            </Button>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {isEn ? "Animation frames" : "Кадры анимации"}
              </h3>
              <span className="text-xs text-[var(--color-text-muted)]">
                {frameIndex + 1}/{frames.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {frames.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  style={{ minWidth: 44 }}
                  className={cn(
                    "min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-semibold",
                    frameIndex === index
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)]",
                  )}
                  onClick={() => setFrameIndex(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="min-h-11 px-2"
                onClick={addFrame}
              >
                <Plus size={17} />{" "}
                <span className="hidden sm:inline">
                  {isEn ? "Add" : "Добавить"}
                </span>
              </Button>
              <Button
                variant="outline"
                className="min-h-11 px-2"
                onClick={duplicateFrame}
              >
                <Copy size={17} />{" "}
                <span className="hidden sm:inline">
                  {isEn ? "Duplicate" : "Копия"}
                </span>
              </Button>
              <Button
                variant="outline"
                className="min-h-11 px-2"
                onClick={deleteFrame}
                disabled={frames.length <= 1}
              >
                <Trash size={17} />{" "}
                <span className="hidden sm:inline">
                  {isEn ? "Delete" : "Удалить"}
                </span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[var(--color-border-subtle)] pt-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pixel-format">{isEn ? "Format" : "Формат"}</Label>
              <select
                id="pixel-format"
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as ExportFormat)
                }
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
                <option value="gif">GIF</option>
              </select>
            </div>
            <div>
              <Label htmlFor="pixel-scale">
                {isEn ? "Export scale" : "Масштаб экспорта"}
              </Label>
              <select
                id="pixel-scale"
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                value={exportScale}
                onChange={(event) => setExportScale(Number(event.target.value))}
              >
                {EXPORT_SCALES.map((scale) => (
                  <option key={scale} value={scale}>
                    {scale}px / pixel
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pixel-padding">
                {isEn ? "Padding (px)" : "Отступ (px)"}
              </Label>
              <Input
                id="pixel-padding"
                className="mt-1.5 h-11"
                type="number"
                min={0}
                max={256}
                value={exportPadding}
                onChange={(event) =>
                  setExportPadding(
                    Math.max(0, Math.min(256, Number(event.target.value) || 0)),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="pixel-name">
                {isEn ? "Filename" : "Имя файла"}
              </Label>
              <Input
                id="pixel-name"
                className="mt-1.5 h-11"
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
              />
            </div>
            {format === "gif" ? (
              <div>
                <Label htmlFor="pixel-delay">
                  {isEn ? "Frame delay" : "Задержка кадра"}
                </Label>
                <select
                  id="pixel-delay"
                  className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                  value={gifDelay}
                  onChange={(event) => setGifDelay(Number(event.target.value))}
                >
                  {GIF_DELAYS.map((delay) => (
                    <option key={delay} value={delay}>
                      {delay} ms
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-[var(--color-primary)]"
              checked={opaqueBackground}
              onChange={(event) => setOpaqueBackground(event.target.checked)}
            />
            {isEn ? "Opaque export background" : "Непрозрачный фон экспорта"}
          </label>
          {opaqueBackground || format === "jpeg" ? (
            <div>
              <Label>{isEn ? "Export background" : "Фон экспорта"}</Label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="color"
                  className="h-11 w-16 rounded border border-[var(--color-border)] bg-transparent p-1"
                  value={exportBackground}
                  onChange={(event) => setExportBackground(event.target.value)}
                  aria-label={
                    isEn ? "Export background color" : "Цвет фона экспорта"
                  }
                />
                <Input
                  className="h-11 font-mono"
                  value={exportBackground}
                  onChange={(event) => setExportBackground(event.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>
      </AdvancedSettings>
    </div>
  );
}
