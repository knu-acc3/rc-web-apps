"use client";

import {
  Copy,
  Download,
  Eraser,
  FlipHorizontal2,
  FlipVertical2,
  Grid3x3,
  Loader2,
  PaintBucket,
  Pencil,
  Pipette,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  Settings2,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Field, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { indexFrame } from "../engine/pixel-gif";
import { ColorField, NumberField } from "../ui/controls";
import { encodeMainCanvas } from "../ui/encodeMain";
import { useEngine } from "../ui/hooks";
import { errorText } from "../ui/strings";

type Tool = "pencil" | "eraser" | "fill" | "picker";
type Frame = Uint32Array; // 0 = transparent, else 0x1RRGGBB

const T = {
  ru: {
    tools: "Инструмент",
    pencil: "Карандаш (B)",
    eraser: "Ластик (E)",
    fill: "Заливка (G)",
    picker: "Пипетка (I)",
    color: "Цвет",
    recent: "Недавние цвета",
    useColor: (c: string) => `Выбрать цвет ${c}`,
    size: "Сетка",
    undo: "Отменить (Ctrl+Z)",
    redo: "Вернуть (Ctrl+Y)",
    clear: "Очистить кадр",
    mirrorX: "Зеркально по горизонтали",
    mirrorY: "Зеркально по вертикали",
    grid: "Показывать сетку",
    frames: "Кадры",
    frame: (i: number) => `Кадр ${i}`,
    addFrame: "Добавить кадр",
    dupFrame: "Дублировать кадр",
    delFrame: "Удалить кадр",
    canvas: "Холст для рисования. Стрелки — перемещение, пробел или Enter — применить инструмент",
    format: "Формат",
    scale: "Пикселей на клетку",
    padding: "Поля",
    bg: "Фон",
    transparent: "Прозрачный",
    solid: "Цвет",
    bgColor: "Цвет фона",
    delay: "Задержка кадра GIF",
    download: "Скачать",
    gifNote: "GIF: все кадры по очереди; если цветов больше 256, палитра подбирается автоматически",
  },
  en: {
    tools: "Tool",
    pencil: "Pencil (B)",
    eraser: "Eraser (E)",
    fill: "Fill (G)",
    picker: "Eyedropper (I)",
    color: "Colour",
    recent: "Recent colours",
    useColor: (c: string) => `Use colour ${c}`,
    size: "Grid",
    undo: "Undo (Ctrl+Z)",
    redo: "Redo (Ctrl+Y)",
    clear: "Clear frame",
    mirrorX: "Mirror horizontally",
    mirrorY: "Mirror vertically",
    grid: "Show grid",
    frames: "Frames",
    frame: (i: number) => `Frame ${i}`,
    addFrame: "Add frame",
    dupFrame: "Duplicate frame",
    delFrame: "Delete frame",
    canvas: "Drawing canvas. Arrow keys move, Space or Enter applies the tool",
    format: "Format",
    scale: "Pixels per cell",
    padding: "Padding",
    bg: "Background",
    transparent: "Transparent",
    solid: "Colour",
    bgColor: "Background colour",
    delay: "GIF frame delay",
    download: "Download",
    gifNote: "GIF: all frames in order; with more than 256 colours the palette is chosen automatically",
  },
} as const;

const SIZES = [8, 16, 24, 32, 48, 64];
const VIEW = 512;

const hexToCell = (hex: string) => 0x1000000 | parseInt(hex.slice(1), 16);
const cellToHex = (v: number) => `#${(v & 0xffffff).toString(16).padStart(6, "0").toUpperCase()}`;

function resample(f: Frame, from: number, to: number): Frame {
  const out = new Uint32Array(to * to);
  for (let y = 0; y < to; y++) for (let x = 0; x < to; x++) out[y * to + x] = f[Math.floor((y * from) / to) * from + Math.floor((x * from) / to)];
  return out;
}

function flood(f: Frame, n: number, x0: number, y0: number, v: number): Frame {
  const out = f.slice();
  const target = out[y0 * n + x0];
  if (target === v) return out;
  const stack = [y0 * n + x0];
  while (stack.length) {
    const i = stack.pop()!;
    if (out[i] !== target) continue;
    out[i] = v;
    const x = i % n;
    const y = (i - x) / n;
    if (x > 0) stack.push(i - 1);
    if (x < n - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - n);
    if (y < n - 1) stack.push(i + n);
  }
  return out;
}

interface Snap {
  frames: Frame[];
  cur: number;
  size: number;
}

export default function PixelArt({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const getEngine = useEngine();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(16);
  const [frames, setFrames] = useState<Frame[]>(() => [new Uint32Array(16 * 16)]);
  const [cur, setCur] = useState(0);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#1F2937");
  const [recent, setRecent] = useState<string[]>(["#1F2937", "#FFFFFF", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"]);
  const [mirrorX, setMirrorX] = useState(false);
  const [mirrorY, setMirrorY] = useState(false);
  const [grid, setGrid] = useState(true);
  const [undo, setUndo] = useState<Snap[]>([]);
  const [redo, setRedo] = useState<Snap[]>([]);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [format, setFormat] = useState<"png" | "jpg" | "webp" | "gif">("png");
  const [scale, setScale] = useState<number | null>(16);
  const [padding, setPadding] = useState<number | null>(0);
  const [bgKind, setBgKind] = useState<"transparent" | "color">("transparent");
  const [bg, setBg] = useState("#FFFFFF");
  const [delay, setDelay] = useState<number | null>(200);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const drawing = useRef(false);
  const frame = frames[cur] ?? frames[0];

  const snapshot = useCallback((): Snap => ({ frames: frames.map((f) => f.slice()), cur, size }), [frames, cur, size]);
  const pushHistory = useCallback(() => {
    setUndo((u) => [...u.slice(-49), snapshot()]);
    setRedo([]);
  }, [snapshot]);
  const restore = (s: Snap) => {
    setFrames(s.frames);
    setCur(s.cur);
    setSize(s.size);
  };
  const doUndo = () => {
    const last = undo[undo.length - 1];
    if (!last) return;
    setRedo((r) => [...r, snapshot()]);
    setUndo((u) => u.slice(0, -1));
    restore(last);
  };
  const doRedo = () => {
    const last = redo[redo.length - 1];
    if (!last) return;
    setUndo((u) => [...u, snapshot()]);
    setRedo((r) => r.slice(0, -1));
    restore(last);
  };

  const remember = (hex: string) => setRecent((r) => [hex, ...r.filter((x) => x !== hex)].slice(0, 16));

  const apply = useCallback(
    (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      if (tool === "picker") {
        const v = frame[y * size + x];
        if (v) {
          const hex = cellToHex(v);
          setColor(hex);
          remember(hex);
        }
        return;
      }
      const v = tool === "eraser" ? 0 : hexToCell(color);
      setFrames((fs) =>
        fs.map((f, i) => {
          if (i !== cur) return f;
          if (tool === "fill") return flood(f, size, x, y, v);
          const next = f.slice();
          const pts = new Set([`${x},${y}`]);
          if (mirrorX) pts.add(`${size - 1 - x},${y}`);
          if (mirrorY) pts.add(`${x},${size - 1 - y}`);
          if (mirrorX && mirrorY) pts.add(`${size - 1 - x},${size - 1 - y}`);
          for (const p of pts) {
            const [px, py] = p.split(",").map(Number);
            next[py * size + px] = v;
          }
          return next;
        }),
      );
    },
    [tool, frame, size, color, cur, mirrorX, mirrorY],
  );

  // render
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = VIEW;
    c.height = VIEW;
    const ctx = c.getContext("2d")!;
    const cell = VIEW / size;
    const chk = Math.max(4, cell / 2);
    for (let y = 0; y < VIEW; y += chk)
      for (let x = 0; x < VIEW; x += chk) {
        ctx.fillStyle = ((x + y) / chk) % 2 === 0 ? "#ffffff" : "#e5e7eb";
        ctx.fillRect(x, y, chk, chk);
      }
    for (let i = 0; i < frame.length; i++) {
      const v = frame[i];
      if (!v) continue;
      ctx.fillStyle = cellToHex(v);
      ctx.fillRect((i % size) * cell, Math.floor(i / size) * cell, Math.ceil(cell), Math.ceil(cell));
    }
    if (grid) {
      ctx.strokeStyle = "rgba(15,23,42,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= size; i++) {
        const p = Math.round(i * cell) + 0.5;
        ctx.moveTo(p, 0);
        ctx.lineTo(p, VIEW);
        ctx.moveTo(0, p);
        ctx.lineTo(VIEW, p);
      }
      ctx.stroke();
    }
    if (cursor) {
      ctx.strokeStyle = "#2952ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(cursor.x * cell + 1, cursor.y * cell + 1, cell - 2, cell - 2);
    }
  }, [frame, size, grid, cursor]);

  const cellAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * size), y: Math.floor(((e.clientY - r.top) / r.height) * size) };
  };

  const changeSize = (n: number) => {
    pushHistory();
    setFrames((fs) => fs.map((f) => resample(f, size, n)));
    setSize(n);
    setCursor(null);
  };

  const renderFrame = (f: Frame, sc: number, pad: number, withBg: boolean) => {
    const W = size * sc + pad * 2;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = W;
    const ctx = c.getContext("2d")!;
    if (withBg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, W);
    }
    for (let i = 0; i < f.length; i++) {
      if (!f[i]) continue;
      ctx.fillStyle = cellToHex(f[i]);
      ctx.fillRect(pad + (i % size) * sc, pad + Math.floor(i / size) * sc, sc, sc);
    }
    return c;
  };

  async function exportArt() {
    setBusy(true);
    setError(null);
    try {
      const sc = Math.max(1, Math.min(32, scale ?? 16));
      const pad = Math.max(0, Math.min(256, padding ?? 0));
      const withBg = bgKind === "color" || format === "jpg";
      if (format === "gif") {
        const { GIFEncoder } = await import("gifenc");
        const gif = GIFEncoder();
        for (const f of frames) {
          const c = renderFrame(f, sc, pad, withBg);
          const px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
          const { index, palette, transparentIndex } = await indexFrame(px);
          gif.writeFrame(index, c.width, c.height, {
            palette,
            delay: Math.max(20, delay ?? 200),
            repeat: 0,
            transparent: transparentIndex >= 0,
            transparentIndex: Math.max(0, transparentIndex),
            dispose: transparentIndex >= 0 ? 2 : -1,
          });
        }
        gif.finish();
        downloadBlob(new Blob([gif.bytes() as BlobPart], { type: "image/gif" }), `pixel-art-${size}x${size}.gif`);
      } else {
        const c = renderFrame(frame, sc, pad, withBg);
        const blob = await encodeMainCanvas(getEngine(), c, format, 95, bg);
        downloadBlob(blob, `pixel-art-${size}x${size}.${format}`);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const toolBtn = (v: Tool, Icon: typeof Pencil, label: string) => (
    <Button
      key={v}
      variant={tool === v ? "primary" : "outline"}
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={tool === v}
      onClick={() => setTool(v)}
    >
      <Icon aria-hidden />
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-[0.75rem] border border-line bg-surface px-4 py-3">
        <div role="group" aria-label={t.tools} className="flex gap-1.5">
          {toolBtn("pencil", Pencil, t.pencil)}
          {toolBtn("eraser", Eraser, t.eraser)}
          {toolBtn("fill", PaintBucket, t.fill)}
          {toolBtn("picker", Pipette, t.picker)}
        </div>
        <ColorField
          label={t.color}
          value={color}
          onChange={(c) => {
            setColor(c);
            remember(c);
          }}
          locale={locale}
          className="w-44"
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg-2">{t.recent}</span>
          <div className="flex flex-wrap gap-1">
            {recent.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={t.useColor(c)}
                title={c}
                onClick={() => setColor(c)}
                className={cn("size-6 rounded-[0.3125rem] border", c === color ? "border-accent ring-2 ring-accent/40" : "border-line")}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="grid gap-4 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_13.75rem]">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            role="application"
            aria-label={t.canvas}
            className="mx-auto block aspect-square w-full max-w-[35rem] cursor-crosshair touch-none rounded-[0.5rem] border border-line [image-rendering:pixelated]"
            onPointerDown={(e) => {
              const p = cellAt(e);
              e.currentTarget.setPointerCapture(e.pointerId);
              if (tool !== "picker") pushHistory();
              drawing.current = tool === "pencil" || tool === "eraser";
              if (tool !== "picker" && tool !== "eraser") remember(color);
              apply(p.x, p.y);
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const p = cellAt(e);
              apply(p.x, p.y);
            }}
            onPointerUp={() => (drawing.current = false)}
            onPointerCancel={() => (drawing.current = false)}
            onFocus={() => setCursor((c) => c ?? { x: Math.floor(size / 2), y: Math.floor(size / 2) })}
            onBlur={() => setCursor(null)}
            onKeyDown={(e) => {
              const k = e.key.toLowerCase();
              if ((e.ctrlKey || e.metaKey) && k === "z") {
                e.preventDefault();
                if (e.shiftKey) doRedo();
                else doUndo();
                return;
              }
              if ((e.ctrlKey || e.metaKey) && k === "y") {
                e.preventDefault();
                doRedo();
                return;
              }
              if (k === "b") return setTool("pencil");
              if (k === "e") return setTool("eraser");
              if (k === "g") return setTool("fill");
              if (k === "i") return setTool("picker");
              const c = cursor ?? { x: 0, y: 0 };
              const d =
                e.key === "ArrowLeft" ? [-1, 0] : e.key === "ArrowRight" ? [1, 0] : e.key === "ArrowUp" ? [0, -1] : e.key === "ArrowDown" ? [0, 1] : null;
              if (d) {
                e.preventDefault();
                const next = { x: Math.max(0, Math.min(size - 1, c.x + d[0])), y: Math.max(0, Math.min(size - 1, c.y + d[1])) };
                setCursor(next);
                if (e.shiftKey && (tool === "pencil" || tool === "eraser")) apply(next.x, next.y);
              } else if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                if (tool !== "picker") pushHistory();
                apply(c.x, c.y);
              }
            }}
          />
          <div className="flex flex-col gap-3">
            <Field label={t.size} htmlFor={`${id}-size`}>
              <Select id={`${id}-size`} value={size} onChange={(e) => changeSize(Number(e.target.value))}>
                {SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n} × {n}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="outline" size="icon" aria-label={t.undo} title={t.undo} onClick={doUndo} disabled={!undo.length}>
                <Undo2 aria-hidden />
              </Button>
              <Button variant="outline" size="icon" aria-label={t.redo} title={t.redo} onClick={doRedo} disabled={!redo.length}>
                <Redo2 aria-hidden />
              </Button>
              <Button
                variant={mirrorX ? "primary" : "outline"}
                size="icon"
                aria-label={t.mirrorX}
                title={t.mirrorX}
                aria-pressed={mirrorX}
                onClick={() => setMirrorX((x) => !x)}
              >
                <FlipHorizontal2 aria-hidden />
              </Button>
              <Button
                variant={mirrorY ? "primary" : "outline"}
                size="icon"
                aria-label={t.mirrorY}
                title={t.mirrorY}
                aria-pressed={mirrorY}
                onClick={() => setMirrorY((x) => !x)}
              >
                <FlipVertical2 aria-hidden />
              </Button>
              <Button
                variant={grid ? "primary" : "outline"}
                size="icon"
                aria-label={t.grid}
                title={t.grid}
                aria-pressed={grid}
                onClick={() => setGrid((x) => !x)}
              >
                <Grid3x3 aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={t.clear}
                title={t.clear}
                onClick={() => {
                  pushHistory();
                  setFrames((fs) => fs.map((f, i) => (i === cur ? new Uint32Array(size * size) : f)));
                }}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.frames}</span>
              <div role="radiogroup" aria-label={t.frames} className="flex flex-wrap gap-1">
                {frames.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={i === cur}
                    aria-label={t.frame(i + 1)}
                    onClick={() => setCur(i)}
                    className={cn(
                      "h-8 min-w-8 rounded-[0.375rem] border px-2 text-sm font-medium",
                      i === cur ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-2",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.addFrame}
                  title={t.addFrame}
                  onClick={() => {
                    pushHistory();
                    setFrames((fs) => [...fs, new Uint32Array(size * size)]);
                    setCur(frames.length);
                  }}
                >
                  <Plus aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.dupFrame}
                  title={t.dupFrame}
                  onClick={() => {
                    pushHistory();
                    setFrames((fs) => [...fs.slice(0, cur + 1), fs[cur].slice(), ...fs.slice(cur + 1)]);
                    setCur(cur + 1);
                  }}
                >
                  <Copy aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.delFrame}
                  title={t.delFrame}
                  disabled={frames.length < 2}
                  onClick={() => {
                    pushHistory();
                    setFrames((fs) => fs.filter((_, i) => i !== cur));
                    setCur(Math.max(0, cur - 1));
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t.format}>
              <Segmented
                wrap
                label={t.format}
                value={format}
                onChange={setFormat}
                options={(["png", "jpg", "webp", "gif"] as const).map((f) => ({ value: f, label: f.toUpperCase() }))}
              />
            </Field>
            <NumberField label={t.scale} value={scale} onChange={setScale} min={1} max={32} className="w-32" />
          </div>
          <Button variant="primary" size="lg" onClick={exportArt} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            {t.download} {format.toUpperCase()} · {size * Math.max(1, Math.min(32, scale ?? 16)) + 2 * (padding ?? 0)} px
          </Button>
        </div>
        <details className="border-t border-line">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-fg-2 hover:text-fg">
            <Settings2 className="size-4" aria-hidden />
            {locale === "ru" ? "Дополнительно" : "More options"}
          </summary>
          <div className="grid gap-4 px-4 pb-4 pt-1 sm:grid-cols-2">
            <NumberField label={t.padding} value={padding} onChange={setPadding} min={0} max={256} suffix="px" />
            <Field label={t.bg}>
              <Segmented
                wrap
                label={t.bg}
                value={bgKind}
                onChange={setBgKind}
                options={[
                  { value: "transparent", label: t.transparent },
                  { value: "color", label: t.solid },
                ]}
              />
            </Field>
            {(bgKind === "color" || format === "jpg") && <ColorField label={t.bgColor} value={bg} onChange={setBg} locale={locale} />}
            {format === "gif" && <NumberField label={t.delay} value={delay} onChange={setDelay} min={20} max={10000} suffix={locale === "ru" ? "мс" : "ms"} />}
            {format === "gif" && <p className="text-sm text-fg-3 sm:col-span-2">{t.gifNote}</p>}
          </div>
        </details>
      </Panel>
      {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
    </div>
  );
}
