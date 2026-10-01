"use client";

import { Stamp, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { fontFor } from "./lib/client";
import type { Anchor } from "./lib/geometry";
import type { Job } from "./lib/jobs";
import type { ImageStamp, RGB, TextWatermark } from "./lib/pdf-ops";
import { Caption, PositionPicker, PrimaryButton, ValueSlider, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { PdfPreview, usePagePreview } from "./ui/PdfPreview";
import { RangeField, resolveRange } from "./ui/RangeField";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";
import { Controls, Workspace } from "./ui/Workspace";

const T = {
  ru: {
    kind: "Водяной знак",
    kinds: { text: "Текст", image: "Картинка" },
    text: "Текст водяного знака",
    size: "Размер",
    opacity: "Прозрачность",
    angle: "Наклон",
    position: "Где",
    color: "Цвет",
    custom: "Свой цвет",
    colors: { "#c62828": "Красный", "#6b7280": "Серый", "#1d4ed8": "Синий", "#111111": "Чёрный" } as Record<string, string>,
    positions: {
      "top-left": "Сверху слева",
      "top-center": "Сверху по центру",
      "top-right": "Сверху справа",
      "middle-left": "Слева по центру",
      center: "По центру",
      "middle-right": "Справа по центру",
      "bottom-left": "Снизу слева",
      "bottom-center": "Снизу по центру",
      "bottom-right": "Снизу справа",
    } as Record<Anchor, string>,
    tile: "Замостить всю страницу",
    width: "Ширина",
    dropImage: "Перетащите логотип или штамп (PNG, JPG) или нажмите, чтобы выбрать",
    dropHint: "PNG с прозрачным фоном выглядит лучше всего",
    removeImage: "Убрать картинку",
    preview: "Предпросмотр страницы с водяным знаком",
    go: "Добавить водяной знак",
    all: "все",
  },
  en: {
    kind: "Watermark",
    kinds: { text: "Text", image: "Image" },
    text: "Watermark text",
    size: "Size",
    opacity: "Opacity",
    angle: "Angle",
    position: "Where",
    color: "Colour",
    custom: "Custom colour",
    colors: { "#c62828": "Red", "#6b7280": "Grey", "#1d4ed8": "Blue", "#111111": "Black" } as Record<string, string>,
    positions: {
      "top-left": "Top left",
      "top-center": "Top centre",
      "top-right": "Top right",
      "middle-left": "Middle left",
      center: "Centre",
      "middle-right": "Middle right",
      "bottom-left": "Bottom left",
      "bottom-center": "Bottom centre",
      "bottom-right": "Bottom right",
    } as Record<Anchor, string>,
    tile: "Tile the whole page",
    width: "Width",
    dropImage: "Drop a logo or stamp (PNG, JPG) or click to choose",
    dropHint: "A PNG with a transparent background looks best",
    removeImage: "Remove image",
    preview: "Preview of a page with the watermark",
    go: "Add watermark",
    all: "all",
  },
} as const;

const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export type WatermarkPreset = "confidential" | "draft" | "sample" | "copy";
const PRESET_TEXT: Record<WatermarkPreset, { ru: string; en: string }> = {
  confidential: { ru: "КОНФИДЕНЦИАЛЬНО", en: "CONFIDENTIAL" },
  draft: { ru: "ЧЕРНОВИК", en: "DRAFT" },
  sample: { ru: "ОБРАЗЕЦ", en: "SAMPLE" },
  copy: { ru: "КОПИЯ", en: "COPY" },
};

const SWATCHES = ["#c62828", "#6b7280", "#1d4ed8", "#111111"] as const;
const ANCHORS: Anchor[] = ["top-left", "top-center", "top-right", "middle-left", "center", "middle-right", "bottom-left", "bottom-center", "bottom-right"];

export default function WatermarkTool({ locale, preset = "confidential" }: { locale: Locale; preset?: WatermarkPreset }) {
  const t = T[locale];
  const id = useId();
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState(PRESET_TEXT[preset][locale]);
  const [size, setSize] = useState(48);
  const [opacity, setOpacity] = useState(0.25);
  const [angle, setAngle] = useState(45);
  const [position, setPosition] = useState<Anchor>("center");
  const [tile, setTile] = useState(false);
  const [color, setColor] = useState("#c62828");
  const [image, setImage] = useState<{ file: File; bytes: ArrayBuffer; url: string } | null>(null);
  const [width, setWidth] = useState(30);
  const [range, setRange] = useState("");
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;
  const count = file?.pages ?? 0;
  const pages = resolveRange(range, Math.max(1, count));

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url);
  }, [image]);

  const anchor = tile ? "center" : position;
  const textWm: TextWatermark = { text, size, color: hexToRgb(color), opacity, angle, position: anchor, margin: 36, tile };
  const imageStamp: ImageStamp = { widthRatio: width / 100, opacity, angle: 0, position: anchor, margin: 36, tile };
  const ready = kind === "text" ? !!text.trim() : !!image;
  const previewIndex = pages.ok ? (pages.pages[0] ?? 1) - 1 : 0;

  const buildJob = async (preview?: number): Promise<Job | null> => {
    if (!file || !ready) return null;
    return {
      type: "watermark",
      source: { bytes: file.bytes!.slice(0), password: file.password },
      pages: preview !== undefined ? [preview] : pages.ok ? pages.pages.map((p) => p - 1) : [],
      text: kind === "text" ? textWm : undefined,
      image: kind === "image" && image ? { bytes: image.bytes.slice(0), stamp: imageStamp } : undefined,
      font: kind === "text" ? await fontFor(text) : null,
      preview,
    };
  };

  const previewKey = JSON.stringify([kind, textWm, imageStamp, image?.url ?? "", previewIndex]);
  const preview = usePagePreview(locale, file && ready ? () => buildJob(previewIndex) : null, file?.id ?? "", previewKey);

  async function apply() {
    setResult(null);
    const out = await job.start(async (ctx) => {
      const j = await buildJob();
      return workerJob(j!, ctx);
    });
    if (out && file) setResult([{ name: `${baseName(file.name)}-watermark.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const change = <V,>(set: (v: V) => void) => (v: V) => {
    set(v);
    setResult(null);
  };

  const controls = (
    <Controls>
      <Segmented fill label={t.kind} value={kind} onChange={change(setKind)} options={[{ value: "text", label: t.kinds.text }, { value: "image", label: t.kinds.image }]} />
      {kind === "text" ? (
        <Field label={t.text} htmlFor={`${id}-t`}>
          <Input id={`${id}-t`} size="lg" value={text} maxLength={120} onChange={(e) => change(setText)(e.target.value)} autoComplete="off" />
        </Field>
      ) : image ? (
        <div className="flex items-center gap-3 rounded-[1rem] bg-surface-2 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={image.url} alt="" className="size-14 rounded-[0.5rem] bg-surface object-contain" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{image.file.name}</span>
          <IconButton label={t.removeImage} icon={<X aria-hidden />} onClick={() => change(setImage)(null)} />
        </div>
      ) : (
        <Dropzone
          compact
          locale={locale}
          accept="image/png,image/jpeg,.png,.jpg,.jpeg"
          title={t.dropImage}
          hint={t.dropHint}
          onFiles={async ([f]) => {
            const bytes = await f.arrayBuffer();
            setImage({ file: f, bytes, url: URL.createObjectURL(f) });
            setResult(null);
          }}
        />
      )}

      {kind === "text" ? (
        <ValueSlider id={`${id}-s`} locale={locale} label={t.size} value={size} onChange={change(setSize)} min={12} max={200} step={2} suffix="pt" />
      ) : (
        <ValueSlider id={`${id}-w`} locale={locale} label={t.width} value={width} onChange={change(setWidth)} min={5} max={100} step={5} suffix="%" />
      )}
      <ValueSlider id={`${id}-o`} locale={locale} label={t.opacity} value={Math.round((1 - opacity) * 100)} onChange={(v) => change(setOpacity)(Math.max(0.05, 1 - v / 100))} min={0} max={95} step={5} suffix="%" />
      {kind === "text" && <ValueSlider id={`${id}-a`} locale={locale} label={t.angle} value={angle} onChange={change(setAngle)} min={-90} max={90} step={5} suffix="°" />}

      {kind === "text" && (
        <div>
          <Caption>{t.color}</Caption>
          <div role="group" aria-label={t.color} className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={color === c}
                aria-label={t.colors[c]}
                title={t.colors[c]}
                onClick={() => change(setColor)(c)}
                className={cn("size-10 rounded-full border border-line-strong transition-transform duration-150 motion-safe:active:scale-90", color === c && "ring-3 ring-accent ring-offset-2 ring-offset-surface")}
                style={{ background: c }}
              />
            ))}
            <label className={cn("relative size-10 cursor-pointer overflow-hidden rounded-full border border-line-strong", !(SWATCHES as readonly string[]).includes(color) && "ring-3 ring-accent ring-offset-2 ring-offset-surface")} title={t.custom} style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
              <span className="sr-only">{t.custom}</span>
              <input type="color" value={color} onChange={(e) => change(setColor)(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
            </label>
          </div>
        </div>
      )}

      <div>
        <Caption>{t.position}</Caption>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <PositionPicker label={t.position} value={position} options={ANCHORS} onChange={change(setPosition)} names={t.positions} disabled={tile} />
          <Switch label={t.tile} checked={tile} onChange={(e) => change(setTile)(e.target.checked)} />
        </div>
      </div>

      {count > 1 && <RangeField locale={locale} value={range} onChange={change(setRange)} result={pages} pageCount={count} placeholder={`${t.all} (1-${count})`} />}
    </Controls>
  );

  return (
    <div className="flex flex-col gap-4">
      {!file ? (
        <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      ) : (
        <Workspace
          files={<FilePanel locale={locale} pdf={pdf} disabled={job.running} />}
          preview={<PdfPreview locale={locale} preview={ready ? preview : null} original={{ doc: file.doc, index: previewIndex }} label={t.preview} />}
          controls={controls}
          action={
            <>
              <PrimaryButton disabled={!ready || !pages.ok || job.running} done={!!result} onClick={apply}>
                <Stamp aria-hidden />
                {t.go}
              </PrimaryButton>
              <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
              {result && (
                <ResultCard
                  locale={locale}
                  items={result}
                  onReset={() => {
                    setResult(null);
                    pdf.clear();
                    job.reset();
                  }}
                />
              )}
            </>
          }
        />
      )}
    </div>
  );
}
