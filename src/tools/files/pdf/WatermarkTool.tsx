"use client";

import { Stamp, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Select } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { fontFor } from "./lib/client";
import type { Anchor } from "./lib/geometry";
import type { Job } from "./lib/jobs";
import type { ImageStamp, RGB, TextWatermark } from "./lib/pdf-ops";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { PdfPreview, usePagePreview } from "./ui/PdfPreview";
import { RangeField, resolveRange } from "./ui/RangeField";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";

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
    positions: {
      center: "По центру",
      tile: "Замостить всю страницу",
      "top-left": "Сверху слева",
      "top-center": "Сверху по центру",
      "top-right": "Сверху справа",
      "bottom-left": "Снизу слева",
      "bottom-center": "Снизу по центру",
      "bottom-right": "Снизу справа",
    } as Record<string, string>,
    width: "Ширина",
    dropImage: "Перетащите логотип или штамп (PNG или JPG)",
    dropHint: "PNG с прозрачным фоном выглядит лучше всего",
    removeImage: "Убрать картинку",
    preview: "Предпросмотр первой страницы с водяным знаком",
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
    positions: {
      center: "Centre",
      tile: "Tile the whole page",
      "top-left": "Top left",
      "top-center": "Top centre",
      "top-right": "Top right",
      "bottom-left": "Bottom left",
      "bottom-center": "Bottom centre",
      "bottom-right": "Bottom right",
    } as Record<string, string>,
    width: "Width",
    dropImage: "Drop a logo or stamp (PNG or JPG)",
    dropHint: "A PNG with a transparent background looks best",
    removeImage: "Remove image",
    preview: "Preview of the first page with the watermark",
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

export default function WatermarkTool({ locale, preset = "confidential" }: { locale: Locale; preset?: WatermarkPreset }) {
  const t = T[locale];
  const id = useId();
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState(PRESET_TEXT[preset][locale]);
  const [size, setSize] = useState("48");
  const [opacity, setOpacity] = useState("0.25");
  const [angle, setAngle] = useState("45");
  const [position, setPosition] = useState("center");
  const [color, setColor] = useState("#c62828");
  const [image, setImage] = useState<{ file: File; bytes: ArrayBuffer; url: string } | null>(null);
  const [width, setWidth] = useState("0.3");
  const [range, setRange] = useState("");
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;
  const count = file?.pages ?? 0;
  const pages = resolveRange(range, Math.max(1, count));

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url);
  }, [image]);

  const tile = position === "tile";
  const anchor = (tile ? "center" : position) as Anchor;
  const textWm: TextWatermark = { text, size: Number(size), color: hexToRgb(color), opacity: Number(opacity), angle: Number(angle), position: anchor, margin: 36, tile };
  const imageStamp: ImageStamp = { widthRatio: Number(width), opacity: Number(opacity), angle: kind === "image" ? 0 : Number(angle), position: anchor, margin: 36, tile };
  const ready = kind === "text" ? !!text.trim() : !!image;

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

  const previewKey = JSON.stringify([kind, textWm, imageStamp, image?.url ?? ""]);
  const preview = usePagePreview(file && ready ? () => buildJob(pages.ok ? (pages.pages[0] ?? 1) - 1 : 0) : null, file?.id ?? "", previewKey);

  async function apply() {
    setResult(null);
    const out = await job.start(async (ctx) => {
      const j = await buildJob();
      return workerJob(j!, ctx);
    });
    if (out && file) setResult([{ name: `${baseName(file.name)}-watermark.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <Segmented label={t.kind} value={kind} onChange={change(setKind)} options={[{ value: "text", label: t.kinds.text }, { value: "image", label: t.kinds.image }]} />
              {kind === "text" ? (
                <Field label={t.text} htmlFor={`${id}-t`}>
                  <Input id={`${id}-t`} size="lg" value={text} maxLength={120} onChange={(e) => change(setText)(e.target.value)} autoComplete="off" />
                </Field>
              ) : image ? (
                <div className="flex items-center gap-3 rounded-[0.625rem] border border-line bg-surface p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={image.url} alt="" className="size-14 rounded-[0.375rem] bg-surface-2 object-contain" />
                  <span className="min-w-0 flex-1 truncate text-sm">{image.file.name}</span>
                  <Button size="icon-sm" variant="ghost" aria-label={t.removeImage} onClick={() => setImage(null)}>
                    <X />
                  </Button>
                </div>
              ) : (
                <Dropzone
                  compact
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
              <OptionsRow>
                {kind === "text" ? (
                  <Field label={t.size} htmlFor={`${id}-s`} className="w-24">
                    <Select id={`${id}-s`} value={size} onChange={(e) => change(setSize)(e.target.value)}>
                      {["24", "36", "48", "60", "72", "96", "120"].map((v) => (
                        <option key={v} value={v}>
                          {v} pt
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <Field label={t.width} htmlFor={`${id}-w`} className="w-24">
                    <Select id={`${id}-w`} value={width} onChange={(e) => change(setWidth)(e.target.value)}>
                      {["0.15", "0.3", "0.5", "0.8"].map((v) => (
                        <option key={v} value={v}>
                          {Number(v) * 100}%
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field label={t.opacity} htmlFor={`${id}-o`} className="w-24">
                  <Select id={`${id}-o`} value={opacity} onChange={(e) => change(setOpacity)(e.target.value)}>
                    {["0.1", "0.25", "0.5", "0.75", "1"].map((v) => (
                      <option key={v} value={v}>
                        {Math.round((1 - Number(v)) * 100)}%
                      </option>
                    ))}
                  </Select>
                </Field>
                {kind === "text" && (
                  <Field label={t.angle} htmlFor={`${id}-a`} className="w-24">
                    <Select id={`${id}-a`} value={angle} onChange={(e) => change(setAngle)(e.target.value)}>
                      {["0", "30", "45", "60", "90", "-45"].map((v) => (
                        <option key={v} value={v}>
                          {v}°
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field label={t.position} htmlFor={`${id}-p`} className="w-48">
                  <Select id={`${id}-p`} value={position} onChange={(e) => change(setPosition)(e.target.value)}>
                    {Object.entries(t.positions).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                {kind === "text" && (
                  <Field label={t.color} htmlFor={`${id}-c`} className="w-16">
                    <input id={`${id}-c`} type="color" value={color} onChange={(e) => change(setColor)(e.target.value)} className="h-10 w-full cursor-pointer rounded-[0.5rem] border border-line bg-surface p-1" />
                  </Field>
                )}
                <RangeField locale={locale} value={range} onChange={change(setRange)} result={pages} pageCount={count} placeholder={`${t.all} (1-${count})`} size="sm" className="w-full sm:w-56" />
              </OptionsRow>
            </div>
            <PdfPreview bytes={preview.bytes} busy={preview.busy} label={t.preview} />
          </div>
          <PrimaryButton disabled={!ready || !pages.ok || job.running} onClick={apply}>
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
      )}
    </div>
  );
}
