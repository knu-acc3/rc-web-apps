"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Field, Select, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { centeredAspectRect, type Rect } from "../engine/geometry";
import { baseName, materialize } from "../engine/source";
import type { OutFormat, TileResult } from "../engine/types";
import { DEFAULT_QUALITY, LOSSY, sameFormat } from "../ui/format";
import { useEngine } from "../ui/hooks";
import { ImageStage } from "../ui/ImageStage";
import { usePreviewBitmap } from "../ui/LiveStage";
import { SingleImageShell, useExport, useSingleFile } from "../ui/SingleImage";

const T = {
  ru: {
    mode: "Как разрезать",
    grid: "Сетка",
    carousel: "Карусель Instagram",
    rows: "Строк",
    cols: "Столбцов",
    presets: "Шаблон",
    slides: "Слайдов",
    slide: "Слайд",
    igOrder: "Нумерация для сетки профиля Instagram (публиковать с №1)",
    parts: ["часть", "части", "частей"],
    download: "Скачать части (ZIP)",
    carouselHint: "Фото обрезается по центру под общий формат ленты и делится на слайды одинакового размера",
  },
  en: {
    mode: "Split into",
    grid: "Grid",
    carousel: "Instagram carousel",
    rows: "Rows",
    cols: "Columns",
    presets: "Template",
    slides: "Slides",
    slide: "Slide",
    igOrder: "Number for the Instagram profile grid (post #1 first)",
    parts: ["part", "parts"],
    download: "Download parts (ZIP)",
    carouselHint: "The photo is centre-cropped to the strip shape and cut into equal slides",
  },
} as const;

const GRID_PRESETS = ["2x1", "1x2", "2x2", "3x3", "1x3", "3x1"];
const SLIDE_SIZES = [
  { value: "1080x1350", w: 1080, h: 1350 },
  { value: "1080x1080", w: 1080, h: 1080 },
] as const;

/** Grid cells in source px (edges rounded so tiles cover the image exactly). */
export function gridRects(w: number, h: number, rows: number, cols: number): Rect[] {
  const out: Rect[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x0 = Math.round((c * w) / cols);
      const x1 = Math.round(((c + 1) * w) / cols);
      const y0 = Math.round((r * h) / rows);
      const y1 = Math.round(((r + 1) * h) / rows);
      out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
  return out;
}

export default function Split({ locale, initialMode = "grid", rows: r0 = 3, cols: c0 = 3 }: { locale: Locale; initialMode?: "grid" | "carousel"; rows?: number; cols?: number }) {
  const t = T[locale];
  const id = useId();
  const getEngine = useEngine();
  const file = useSingleFile();
  const exp = useExport();
  const { bitmap, info } = usePreviewBitmap(file.prepared ?? undefined, 1600);
  const [mode, setMode] = useState<"grid" | "carousel">(initialMode);
  const [rows, setRows] = useState(r0);
  const [cols, setCols] = useState(c0);
  const [slides, setSlides] = useState(3);
  const [slideSize, setSlideSize] = useState<(typeof SLIDE_SIZES)[number]["value"]>("1080x1350");
  const [igOrder, setIgOrder] = useState(false);
  const W = info?.srcWidth ?? 0;
  const H = info?.srcHeight ?? 0;
  const ss = SLIDE_SIZES.find((x) => x.value === slideSize)!;

  let rects: Rect[] = [];
  let strip: Rect | null = null;
  if (W && H) {
    if (mode === "grid") rects = gridRects(W, H, rows, cols);
    else {
      strip = centeredAspectRect(W, H, (slides * ss.w) / ss.h);
      const s0 = strip;
      rects = Array.from({ length: slides }, (_, i) => ({ x: s0.x + (i * s0.w) / slides, y: s0.y, w: s0.w / slides, h: s0.h }));
    }
  }
  const n = rects.length;
  // posting order: Instagram shows the newest post first, so the bottom-right tile goes first
  const order = (i: number) => (mode === "grid" && igOrder ? n - i : i + 1);

  const doExport = () => {
    const p = file.prepared;
    if (!p || !n) return;
    exp.run(async (signal, onProgress) => {
      const fmt: OutFormat = sameFormat(p.format);
      const m = await materialize(p);
      const tiles = await getEngine().run<TileResult[]>(
        { type: "tiles", src: m.src, rects, out: { format: fmt, quality: LOSSY.has(fmt) ? 92 : DEFAULT_QUALITY[fmt], background: "#FFFFFF" }, size: mode === "carousel" ? { w: ss.w, h: ss.h } : undefined },
        { signal, onProgress, transfer: m.transfer },
      );
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const base = baseName(p.file.name);
      const pad = String(n).length;
      tiles.forEach((tile, i) => {
        const num = String(order(i)).padStart(Math.max(2, pad), "0");
        const where = mode === "grid" ? `-r${Math.floor(i / cols) + 1}c${(i % cols) + 1}` : "";
        zip.file(`${base}-${num}${where}.${fmt}`, tile.bytes);
      });
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      return { blob, name: `${base}-${mode === "grid" ? `${rows}x${cols}` : `carousel-${slides}`}.zip` };
    });
  };

  const options = (
    <>
      <Segmented label={t.mode} value={mode} onChange={setMode} options={[{ value: "grid", label: t.grid }, { value: "carousel", label: t.carousel }]} />
      {mode === "grid" ? (
        <>
          <Field label={t.presets}>
            <Segmented
              label={t.presets}
              value={`${rows}x${cols}`}
              onChange={(v) => {
                const [r, c] = v.split("x").map(Number);
                setRows(r);
                setCols(c);
              }}
              options={GRID_PRESETS.map((g) => ({ value: g, label: g.replace("x", "×") }))}
            />
          </Field>
          <Field label={t.rows} htmlFor={`${id}-r`} className="w-24">
            <Select id={`${id}-r`} value={rows} onChange={(e) => setRows(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.cols} htmlFor={`${id}-c`} className="w-24">
            <Select id={`${id}-c`} value={cols} onChange={(e) => setCols(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
        </>
      ) : (
        <>
          <Field label={t.slides} htmlFor={`${id}-s`} className="w-24">
            <Select id={`${id}-s`} value={slides} onChange={(e) => setSlides(Number(e.target.value))}>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.slide}>
            <Segmented label={t.slide} value={slideSize} onChange={setSlideSize} options={SLIDE_SIZES.map((x) => ({ value: x.value, label: `${x.w}×${x.h}` }))} />
          </Field>
        </>
      )}
    </>
  );

  return (
    <SingleImageShell
      locale={locale}
      file={file}
      options={options}
      more={mode === "grid" ? <Switch label={t.igOrder} checked={igOrder} onChange={(e) => setIgOrder(e.target.checked)} /> : undefined}
      exp={exp}
      onExport={doExport}
      exportLabel={t.download}
      figure={`${n} ${plural(locale, n, t.parts)}${n ? ` · ${mode === "grid" ? `${rects[0].w}×${rects[0].h}` : `${ss.w}×${ss.h}`} px` : ""}`}
      extra={mode === "carousel" ? <p className="text-fg-3">{t.carouselHint}</p> : undefined}
      stage={
        <ImageStage bitmap={bitmap} srcWidth={W} locale={locale}>
          {(f) => (
            <div className="absolute inset-0 overflow-hidden" aria-hidden>
              {strip && <div className="absolute shadow-[0_0_0_9999px_rgb(0_0_0/0.5)]" style={{ left: strip.x * f, top: strip.y * f, width: strip.w * f, height: strip.h * f }} />}
              {rects.map((r, i) => (
                <div key={i} className="absolute flex items-center justify-center border border-white/80 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.35)]" style={{ left: r.x * f, top: r.y * f, width: r.w * f, height: r.h * f }}>
                  <span className="rounded bg-black/60 px-1.5 text-xs font-semibold text-white">{order(i)}</span>
                </div>
              ))}
            </div>
          )}
        </ImageStage>
      }
    />
  );
}
