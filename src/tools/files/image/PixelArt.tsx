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
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/clipboard";
import { Button, IconButton } from "@/ui/button";
import { Field, Select } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { indexFrame } from "./lib/pixel-gif";
import { ColorField, NumberField } from "./ui/controls";
import { encodeMainCanvas } from "./ui/encodeMain";
import { useEngine } from "./ui/hooks";
import { errorText } from "./ui/strings";

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
    <IconButton
      key={v}
      label={label}
      icon={<Icon aria-hidden />}
      selected={tool === v}
      variant={tool === v ? "filled" : "standard"}
      onClick={() => setTool(v)}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-wrap items-end gap-x-6 gap-y-4 p-4 sm:p-5">
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
          className="w-full max-w-[13rem]"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-sm font-medium text-fg-2">{t.recent}</span>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={t.useColor(c)}
                aria-pressed={c === color}
                title={c}
                onClick={() => setColor(c)}
                className={cn(
                  "size-9 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)] transition-transform hover:scale-110 pointer-coarse:size-10",
                  c === color && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4 p-3 sm:p-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            role="application"
            aria-label={t.canvas}
            className="mx-auto block aspect-square w-full max-w-[min(44rem,72vh)] cursor-crosshair touch-none rounded-[1rem] shadow-elev-1 [image-rendering:pixelated] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
          <div className="flex flex-col gap-4">
            <Field label={t.size} htmlFor={`${id}-size`}>
              <Select id={`${id}-size`} value={size} onChange={(e) => changeSize(Number(e.target.value))}>
                {SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n} × {n}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex flex-wrap gap-1">
              <IconButton label={t.undo} icon={<Undo2 aria-hidden />} onClick={doUndo} disabled={!undo.length} />
              <IconButton label={t.redo} icon={<Redo2 aria-hidden />} onClick={doRedo} disabled={!redo.length} />
              <IconButton label={t.mirrorX} icon={<FlipHorizontal2 aria-hidden />} selected={mirrorX} onClick={() => setMirrorX((x) => !x)} />
              <IconButton label={t.mirrorY} icon={<FlipVertical2 aria-hidden />} selected={mirrorY} onClick={() => setMirrorY((x) => !x)} />
              <IconButton label={t.grid} icon={<Grid3x3 aria-hidden />} selected={grid} onClick={() => setGrid((x) => !x)} />
              <IconButton
                label={t.clear}
                icon={<Trash2 aria-hidden />}
                onClick={() => {
                  pushHistory();
                  setFrames((fs) => fs.map((f, i) => (i === cur ? new Uint32Array(size * size) : f)));
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.frames}</span>
              <div role="radiogroup" aria-label={t.frames} className="flex flex-wrap gap-1.5">
                {frames.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={i === cur}
                    aria-label={t.frame(i + 1)}
                    onClick={() => setCur(i)}
                    className="chip tabular min-w-10 justify-center px-2"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <IconButton
                  size="sm"
                  label={t.addFrame}
                  icon={<Plus aria-hidden />}
                  onClick={() => {
                    pushHistory();
                    setFrames((fs) => [...fs, new Uint32Array(size * size)]);
                    setCur(frames.length);
                  }}
                />
                <IconButton
                  size="sm"
                  label={t.dupFrame}
                  icon={<Copy aria-hidden />}
                  onClick={() => {
                    pushHistory();
                    setFrames((fs) => [...fs.slice(0, cur + 1), fs[cur].slice(), ...fs.slice(cur + 1)]);
                    setCur(cur + 1);
                  }}
                />
                <IconButton
                  size="sm"
                  label={t.delFrame}
                  icon={<Trash2 aria-hidden />}
                  disabled={frames.length < 2}
                  onClick={() => {
                    pushHistory();
                    setFrames((fs) => fs.filter((_, i) => i !== cur));
                    setCur(Math.max(0, cur - 1));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t.format}>
              <Segmented
                label={t.format}
                value={format}
                onChange={setFormat}
                options={(["png", "jpg", "webp", "gif"] as const).map((f) => ({ value: f, label: f.toUpperCase() }))}
              />
            </Field>
            <NumberField label={t.scale} value={scale} onChange={setScale} min={1} max={32} stepper locale={locale} className="w-40" />
          </div>
          <Button variant="filled" size="lg" onClick={exportArt} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            {t.download} {format.toUpperCase()} · {size * Math.max(1, Math.min(32, scale ?? 16)) + 2 * (padding ?? 0)} px
          </Button>
        </div>
        <Fold variant="inline" title={locale === "ru" ? "Дополнительно" : "More options"} bodyClassName="grid gap-4 px-1 pb-1 sm:grid-cols-2">
          <NumberField label={t.padding} value={padding} onChange={setPadding} min={0} max={256} suffix="px" locale={locale} />
          <Field label={t.bg}>
            <Segmented
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
          {format === "gif" && (
            <NumberField
              label={t.delay}
              value={delay}
              onChange={setDelay}
              min={20}
              max={10000}
              step={50}
              suffix={locale === "ru" ? "мс" : "ms"}
              stepper
              locale={locale}
            />
          )}
          {format === "gif" && <p className="text-sm text-fg-3 sm:col-span-2">{t.gifNote}</p>}
        </Fold>
      </Panel>
      {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
    </div>
  );
}
