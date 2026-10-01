"use client";

import { Download, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { cellsOf, layoutsFor, placeCells, type Layout } from "./lib/collage";
import { IMAGE_ACCEPT } from "./lib/detect";
import { roundRectPath } from "./lib/pipeline";
import type { OutFormat } from "./lib/types";
import { checker, ColorField, RangeField } from "./ui/controls";
import { encodeMainCanvas } from "./ui/encodeMain";
import { OUT_LABEL } from "./ui/format";
import { FrameStrip } from "./ui/FrameStrip";
import { useEngine } from "./ui/hooks";
import { OptionsBar, ToolColumns } from "./ui/OptionsBar";
import { errorText, S } from "./ui/strings";
import { useImageList, type ListImage } from "./ui/useImageList";
import { RestoringPlaceholder, WorkspaceBar } from "./ui/Workspace";

const T = {
  ru: {
    layout: "Раскладка",
    ratio: "Формат",
    gap: "Промежуток",
    pad: "Поля",
    radius: "Скругление",
    bg: "Фон",
    width: "Ширина",
    format: "Файл",
    download: "Скачать коллаж",
    photos: "Фото коллажа",
    need: "Добавьте от 2 до 9 фото",
    max: "В коллаже до 9 фото — лишние не добавлены",
    layoutN: (i: number) => `Раскладка ${i}`,
  },
  en: {
    layout: "Layout",
    ratio: "Shape",
    gap: "Spacing",
    pad: "Margin",
    radius: "Corner radius",
    bg: "Background",
    width: "Width",
    format: "File",
    download: "Download collage",
    photos: "Collage photos",
    need: "Add 2 to 9 photos",
    max: "A collage holds up to 9 photos — extra ones were not added",
    layoutN: (i: number) => `Layout ${i}`,
  },
} as const;

const RATIOS = [
  { value: "1:1", r: 1 },
  { value: "4:5", r: 4 / 5 },
  { value: "3:2", r: 3 / 2 },
  { value: "16:9", r: 16 / 9 },
  { value: "9:16", r: 9 / 16 },
] as const;
const WIDTHS = [1080, 1600, 2048];

function drawCollage(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  layout: Layout,
  items: ListImage[],
  o: { gap: number; pad: number; radius: number; bg: string },
) {
  const unit = Math.min(W, H) / 100;
  ctx.fillStyle = o.bg;
  ctx.fillRect(0, 0, W, H);
  const rects = placeCells(layout, W, H, Math.round(o.gap * unit), Math.round(o.pad * unit));
  rects.forEach((r, i) => {
    const b = items[i]?.bitmap;
    if (!b) return;
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, r.x, r.y, r.w, r.h, (Math.min(r.w, r.h) / 2) * (o.radius / 100));
    ctx.clip();
    const k = Math.max(r.w / b.width, r.h / b.height);
    const dw = b.width * k;
    const dh = b.height * k;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(b, r.x + (r.w - dw) / 2, r.y + (r.h - dh) / 2, dw, dh);
    ctx.restore();
  });
}

function LayoutIcon({ layout }: { layout: Layout }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      {cellsOf(layout).map((c, i) => (
        <rect key={i} x={1 + c.x * 22 + 0.6} y={1 + c.y * 22 + 0.6} width={c.w * 22 - 1.2} height={c.h * 22 - 1.2} rx={1} fill="currentColor" opacity={0.85} />
      ))}
    </svg>
  );
}

export default function Collage({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = S(locale);
  const getEngine = useEngine();
  const list = useImageList(2048, 9);
  const [layoutId, setLayoutId] = useState<string>("");
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]["value"]>("1:1");
  const [gap, setGap] = useState(1.5);
  const [pad, setPad] = useState(1.5);
  const [radius, setRadius] = useState(0);
  const [bg, setBg] = useState("#FFFFFF");
  const [width, setWidth] = useState(2048);
  const [format, setFormat] = useState<OutFormat>("jpg");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [overflow, setOverflow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const n = Math.min(9, list.items.length);
  const layouts = useMemo(() => layoutsFor(Math.max(2, n)), [n]);
  const layout = layouts.find((l) => l.id === layoutId) ?? layouts[0];
  const r = RATIOS.find((x) => x.value === ratio)!.r;
  const H = Math.round(width / r);
  const opts = { gap, pad, radius, bg };
  const optsKey = JSON.stringify(opts);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !layout || n < 1) return;
    const pw = 900;
    const ph = Math.round(pw / r);
    c.width = pw;
    c.height = ph;
    drawCollage(c.getContext("2d")!, pw, ph, layout, list.items, JSON.parse(optsKey));
  }, [layout, list.items, r, optsKey, n]);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = H;
      drawCollage(c.getContext("2d")!, width, H, layout, list.items, opts);
      const blob = await encodeMainCanvas(getEngine(), c, format, 90, bg);
      c.width = c.height = 1;
      downloadBlob(blob, `collage-${width}x${H}.${format}`);
      setLast(blob.size);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const add = (files: File[]) => {
    setOverflow(list.items.length + files.length > 9);
    list.add(files);
  };

  const bar = (
    <WorkspaceBar
      locale={locale}
      count={list.ws.restored}
      onStartOver={() => {
        list.ws.startOver();
        list.clear();
      }}
    />
  );

  if (!list.items.length) {
    return (
      <div className="flex flex-col gap-3">
        {list.ws.restoring || list.loading ? (
          <RestoringPlaceholder locale={locale} text={list.ws.restoring ? undefined : s.reading} />
        ) : (
          <Dropzone onFiles={add} accept={IMAGE_ACCEPT} multiple title={s.dropMany} hint={t.need} locale={locale} />
        )}
      </div>
    );
  }

  const side = (
    <OptionsBar
      locale={locale}
      more={
        <>
          <RangeField label={t.pad} value={pad} onChange={setPad} min={0} max={10} step={0.5} unit="%" locale={locale} />
          <RangeField label={t.radius} value={radius} onChange={setRadius} min={0} max={100} unit="%" locale={locale} />
          <ColorField label={t.bg} value={bg} onChange={setBg} locale={locale} />
          <Field label={t.width}>
            <Segmented
              label={t.width}
              value={String(width)}
              onChange={(v) => setWidth(Number(v))}
              options={WIDTHS.map((w) => ({ value: String(w), label: `${w} px` }))}
            />
          </Field>
          <Field label={t.format}>
            <Segmented
              label={t.format}
              value={format}
              onChange={setFormat}
              options={(["jpg", "png", "webp"] as const).map((f) => ({ value: f, label: OUT_LABEL[f] }))}
            />
          </Field>
        </>
      }
    >
      <Field label={t.layout}>
        <div role="radiogroup" aria-label={t.layout} className="flex flex-wrap gap-2">
          {layouts.map((l, i) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={l === layout}
              aria-label={t.layoutN(i + 1)}
              title={t.layoutN(i + 1)}
              onClick={() => setLayoutId(l.id)}
              className="chip min-h-11 px-2.5"
            >
              <LayoutIcon layout={l} />
            </button>
          ))}
        </div>
      </Field>
      <Field label={t.ratio}>
        <Segmented label={t.ratio} value={ratio} onChange={setRatio} options={RATIOS.map((x) => ({ value: x.value, label: x.value }))} />
      </Field>
      <RangeField label={t.gap} value={gap} onChange={setGap} min={0} max={8} step={0.5} unit="%" locale={locale} />
    </OptionsBar>
  );

  return (
    <div className="flex flex-col gap-4">
      {bar}
      <ToolColumns
        side={side}
        rest={
          <>
            <FrameStrip items={list.items} onMove={list.move} onRemove={list.remove} onAdd={add} locale={locale} label={t.photos} />
            {overflow && <Notice tone="warn">{t.max}</Notice>}
            {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
            {list.errors.length > 0 && <Notice tone="warn">{errorText(locale, list.errors[list.errors.length - 1])}</Notice>}
          </>
        }
      >
        <Panel className="flex min-w-0 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
          <div className={`flex justify-center rounded-[1rem] p-3 sm:p-4 ${checker}`}>
            <canvas ref={canvasRef} role="img" aria-label={t.photos} className="block h-auto max-h-[62vh] w-auto max-w-full rounded-[0.25rem] shadow-elev-1" />
          </div>
          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                {width} × {H} px
              </p>
              <p className="text-sm text-fg-3">{last ? `${format.toUpperCase()} · ${formatBytes(locale, last)}` : n < 2 ? t.need : format.toUpperCase()}</p>
            </div>
            <Button variant="filled" size="lg" onClick={download} disabled={busy || n < 2}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
              {t.download}
            </Button>
          </div>
        </Panel>
      </ToolColumns>
    </div>
  );
}
