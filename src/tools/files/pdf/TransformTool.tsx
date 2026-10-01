"use client";

import { Contrast, Crop, FlipHorizontal2, FlipVertical2, Maximize2, ScanLine, SunMoon } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Input, Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { mmToPt, type PaperId } from "./lib/geometry";
import type { Job } from "./lib/jobs";
import type { FracBox, TransformOp } from "./lib/transform";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { PdfPreview, usePagePreview } from "./ui/PdfPreview";
import { RangeField, resolveRange } from "./ui/RangeField";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles, type PdfFile } from "./ui/use-pdf-files";

export type TransformKind = "flip" | "gray" | "invert" | "crop" | "resize";

const T = {
  ru: {
    pages: "Страницы",
    pagesPh: "Все страницы",
    preview: "Предпросмотр результата",
    axis: "Отразить",
    axes: { h: "Слева направо", v: "Сверху вниз" },
    go: { flip: "Отразить PDF", gray: "Сделать чёрно-белым", invert: "Инвертировать цвета", crop: "Обрезать PDF", resize: "Изменить размер" },
    suffix: { flip: "mirrored", gray: "grayscale", invert: "inverted", crop: "cropped", resize: "resized" },
    margins: "Отрезать с краёв, мм",
    top: "Сверху",
    right: "Справа",
    bottom: "Снизу",
    left: "Слева",
    same: "Одинаково со всех сторон",
    auto: "Обрезать белые поля автоматически",
    autoBusy: "Ищем белые поля…",
    autoDone: (n: number) => `Белые поля найдены на страницах: ${n}. Можно сохранять.`,
    autoNone: "Белых полей не нашлось — страницы уже обрезаны по содержимому.",
    manual: "Вернуться к ручным полям",
    paper: "Формат листа",
    orientation: "Ориентация",
    orientations: { auto: "Как у страницы", portrait: "Книжная", landscape: "Альбомная" },
    margin: "Поля, мм",
    scale: "Вписать содержимое в лист",
    grayNote: "Текст останется текстом: его можно выделять и искать. Цвета убираются наложением, поэтому файл почти не вырастет.",
    invertNote: "Белый фон станет чёрным, чёрный текст — белым. Удобно читать PDF ночью; для печати не подходит.",
  },
  en: {
    pages: "Pages",
    pagesPh: "All pages",
    preview: "Result preview",
    axis: "Mirror",
    axes: { h: "Left to right", v: "Top to bottom" },
    go: { flip: "Mirror PDF", gray: "Make black and white", invert: "Invert colours", crop: "Crop PDF", resize: "Resize pages" },
    suffix: { flip: "mirrored", gray: "grayscale", invert: "inverted", crop: "cropped", resize: "resized" },
    margins: "Cut from the edges, mm",
    top: "Top",
    right: "Right",
    bottom: "Bottom",
    left: "Left",
    same: "Same on all sides",
    auto: "Trim white margins automatically",
    autoBusy: "Looking for white margins…",
    autoDone: (n: number) => `White margins found on ${n} pages. Ready to save.`,
    autoNone: "No white margins found — the pages are already trimmed to their content.",
    manual: "Back to manual margins",
    paper: "Paper size",
    orientation: "Orientation",
    orientations: { auto: "Same as page", portrait: "Portrait", landscape: "Landscape" },
    margin: "Margins, mm",
    scale: "Fit the content to the sheet",
    grayNote: "Text stays text: you can still select and search it. Colour is removed with an overlay, so the file barely grows.",
    invertNote: "White background turns black and black text white. Nice for reading at night; not for printing.",
  },
} as const;

const PAPERS: { id: PaperId; label: string }[] = [
  { id: "a4", label: "A4" },
  { id: "a5", label: "A5" },
  { id: "a3", label: "A3" },
  { id: "letter", label: "Letter" },
  { id: "legal", label: "Legal" },
];

const ICON = { flip: FlipVertical2, gray: Contrast, invert: SunMoon, crop: Crop, resize: Maximize2 } as const;

/** Bounding box of non-white pixels of each page, as fractions, with a small padding. Null = blank page. */
async function findContentBoxes(file: PdfFile, onProgress: (p: number) => void, signal: AbortSignal): Promise<(FracBox | null)[]> {
  const m = await import("./lib/pdfjs");
  const out: (FracBox | null)[] = [];
  for (let i = 1; i <= file.pages; i++) {
    if (signal.aborted) throw new DOMException("aborted", "AbortError");
    const page = await file.doc!.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const canvas = await m.renderPage(page, Math.min(2, 600 / Math.max(vp.width, vp.height)));
    const { width: w, height: h } = canvas;
    const data = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4;
        if (data[k + 3] > 16 && Math.min(data[k], data[k + 1], data[k + 2]) < 235) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    m.releaseCanvas(canvas);
    page.cleanup();
    const pad = 0.015;
    out.push(x1 < 0 ? null : [Math.max(0, x0 / w - pad), Math.max(0, y0 / h - pad), Math.min(1, (x1 + 1) / w + pad), Math.min(1, (y1 + 1) / h + pad)]);
    onProgress(i / file.pages);
  }
  return out;
}

export default function TransformTool({ locale, kind, axis: axis0 = "h", paper: paper0 = "a4" }: { locale: Locale; kind: TransformKind; axis?: "h" | "v"; paper?: PaperId }) {
  const t = T[locale];
  const id = useId();
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [rangeText, setRangeText] = useState("");
  const [axis, setAxis] = useState<"h" | "v">(axis0);
  const [margins, setMargins] = useState<[string, string, string, string]>(["10", "10", "10", "10"]);
  const [same, setSame] = useState(true);
  const [boxes, setBoxes] = useState<{ file: string; boxes: (FracBox | null)[] } | null>(null);
  const [paper, setPaper] = useState<PaperId>(paper0);
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState("0");
  const [scale, setScale] = useState(true);
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;
  const count = file?.pages ?? 0;
  const range = resolveRange(rangeText, Math.max(1, count));
  const indices = range.ok ? range.pages.map((p) => p - 1) : [];
  const auto = boxes && file && boxes.file === file.id ? boxes.boxes : null;
  const mm = (v: string) => mmToPt(Math.max(0, Number(v.replace(",", ".")) || 0));

  const op: TransformOp =
    kind === "flip"
      ? { kind, axis }
      : kind === "crop"
        ? { kind, margins: [mm(margins[0]), mm(margins[1]), mm(margins[2]), mm(margins[3])], boxes: auto ?? undefined }
        : kind === "resize"
          ? { kind, paper, orientation, margin: mm(margin), scale }
          : { kind };

  const previewIndex = indices[0] ?? 0;
  const buildJob = (preview?: number): Job | null =>
    file ? { type: "transform", source: { bytes: file.bytes!.slice(0), password: file.password }, op, pages: rangeText.trim() ? indices : undefined, preview } : null;
  const preview = usePagePreview(file && range.ok ? async () => buildJob(previewIndex) : null, file?.id ?? "", JSON.stringify([op, previewIndex]));

  const reset = () => setResult(null);
  async function apply() {
    setResult(null);
    const out = await job.start(async (ctx) => workerJob(buildJob()!, ctx));
    if (out && file) setResult([{ name: `${baseName(file.name)}-${t.suffix[kind]}.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }
  async function detect() {
    if (!file?.doc) return;
    setResult(null);
    const found = await job.start(async (ctx) => {
      ctx.progress(0, t.autoBusy);
      return findContentBoxes(file, (p) => ctx.progress(p, t.autoBusy), ctx.signal);
    });
    if (found) {
      setBoxes({ file: file.id, boxes: found });
      job.reset();
    }
  }

  const setMargin4 = (i: number, v: string) => {
    reset();
    setMargins((m) => (same ? [v, v, v, v] : (m.map((x, k) => (k === i ? v : x)) as [string, string, string, string])));
  };
  const Icon = ICON[kind];
  const autoFound = auto ? auto.filter((b) => b && (b[0] > 0.02 || b[1] > 0.02 || b[2] < 0.98 || b[3] < 0.98)).length : 0;

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              {kind === "flip" && (
                <Field label={t.axis}>
                  <Segmented
                    label={t.axis}
                    value={axis}
                    onChange={(v) => {
                      setAxis(v);
                      reset();
                    }}
                    options={[
                      {
                        value: "h",
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <FlipVertical2 className="size-4" aria-hidden />
                            {t.axes.h}
                          </span>
                        ),
                      },
                      {
                        value: "v",
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <FlipHorizontal2 className="size-4" aria-hidden />
                            {t.axes.v}
                          </span>
                        ),
                      },
                    ]}
                  />
                </Field>
              )}

              {kind === "crop" &&
                (auto ? (
                  <div className="flex flex-col gap-3">
                    <Notice tone="ok">{autoFound ? t.autoDone(autoFound) : t.autoNone}</Notice>
                    <Button variant="outline" className="self-start" onClick={() => setBoxes(null)}>
                      {t.manual}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-fg-2">{t.margins}</span>
                    <OptionsRow>
                      {([t.top, t.right, t.bottom, t.left] as const).map((label, i) => (
                        <Field key={label} label={label} htmlFor={`${id}-m${i}`} className="w-20">
                          <Input id={`${id}-m${i}`} type="number" inputMode="decimal" min={0} value={margins[i]} onChange={(e) => setMargin4(i, e.target.value)} />
                        </Field>
                      ))}
                    </OptionsRow>
                    <Switch label={t.same} checked={same} onChange={(e) => setSame(e.target.checked)} />
                    <Button variant="outline" className="self-start" onClick={detect} disabled={job.running}>
                      <ScanLine aria-hidden />
                      {t.auto}
                    </Button>
                  </div>
                ))}

              {kind === "resize" && (
                <div className="flex flex-col gap-3">
                  <Field label={t.paper}>
                    <Segmented
                      wrap
                      label={t.paper}
                      value={paper}
                      onChange={(v) => {
                        setPaper(v);
                        reset();
                      }}
                      options={PAPERS.map((p) => ({ value: p.id, label: p.label }))}
                    />
                  </Field>
                  <Field label={t.orientation}>
                    <Segmented
                      wrap
                      label={t.orientation}
                      value={orientation}
                      onChange={(v) => {
                        setOrientation(v);
                        reset();
                      }}
                      options={(["auto", "portrait", "landscape"] as const).map((v) => ({ value: v, label: t.orientations[v] }))}
                    />
                  </Field>
                  <OptionsRow>
                    <Field label={t.margin} htmlFor={`${id}-mg`} className="w-24">
                      <Input
                        id={`${id}-mg`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={margin}
                        onChange={(e) => {
                          setMargin(e.target.value);
                          reset();
                        }}
                      />
                    </Field>
                    <Switch
                      label={t.scale}
                      checked={scale}
                      onChange={(e) => {
                        setScale(e.target.checked);
                        reset();
                      }}
                      className="pb-2"
                    />
                  </OptionsRow>
                </div>
              )}

              {kind === "gray" && <p className="text-sm text-fg-3">{t.grayNote}</p>}
              {kind === "invert" && <p className="text-sm text-fg-3">{t.invertNote}</p>}

              {count > 1 && (
                <RangeField
                  locale={locale}
                  label={t.pages}
                  value={rangeText}
                  onChange={(v) => {
                    setRangeText(v);
                    reset();
                  }}
                  result={range}
                  pageCount={count}
                  placeholder={t.pagesPh}
                  className="max-w-xs"
                />
              )}
            </div>
            <PdfPreview bytes={preview.bytes} busy={preview.busy} label={t.preview} />
          </div>
          <PrimaryButton disabled={job.running || !range.ok} onClick={apply}>
            <Icon aria-hidden />
            {t.go[kind]}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              onReset={() => {
                setResult(null);
                setBoxes(null);
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
