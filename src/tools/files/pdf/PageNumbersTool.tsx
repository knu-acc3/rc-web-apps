"use client";

import { ListOrdered } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { fontFor } from "./lib/client";
import type { Anchor } from "./lib/geometry";
import { mmToPt } from "./lib/geometry";
import type { Job } from "./lib/jobs";
import { pageLabel, pageNumberPlan, type NumberFormat } from "./lib/labels";
import type { PageNumberOptions } from "./lib/pdf-ops";
import { Caption, PositionPicker, PrimaryButton, workerJob } from "./ui/bits";
import { ChipChoice } from "@/ui/chip-choice";
import { FilePanel } from "./ui/FilePanel";
import { PdfPreview, usePagePreview } from "./ui/PdfPreview";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";
import { Controls, Summary, Workspace } from "./ui/Workspace";

export type NumberPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

const T = {
  ru: {
    position: "Где",
    positions: { "bottom-center": "Снизу по центру", "bottom-right": "Снизу справа", "bottom-left": "Снизу слева", "top-center": "Сверху по центру", "top-right": "Сверху справа", "top-left": "Сверху слева" } as Record<NumberPosition, string>,
    format: "Вид",
    start: "Начать с",
    size: "Размер",
    skipFirst: "Не ставить номер на первой странице",
    preview: "Предпросмотр страницы с номером",
    go: "Пронумеровать страницы",
    sample: (a: string, b: string) => `Первые номера: ${a}${b ? `, ${b}` : ""}…`,
  },
  en: {
    position: "Where",
    positions: { "bottom-center": "Bottom centre", "bottom-right": "Bottom right", "bottom-left": "Bottom left", "top-center": "Top centre", "top-right": "Top right", "top-left": "Top left" } as Record<NumberPosition, string>,
    format: "Style",
    start: "Start at",
    size: "Size",
    skipFirst: "No number on the first page",
    preview: "Preview of a numbered page",
    go: "Add page numbers",
    sample: (a: string, b: string) => `First numbers: ${a}${b ? `, ${b}` : ""}…`,
  },
} as const;

const FORMATS: NumberFormat[] = ["n", "n-of-total", "page-n-of-total", "dash-n"];
const POSITIONS: NumberPosition[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];

export default function PageNumbersTool({
  locale,
  position: pos0 = "bottom-center",
  format: fmt0 = "n",
  skipFirst: skip0 = false,
  start: start0 = 1,
}: {
  locale: Locale;
  position?: NumberPosition;
  format?: NumberFormat;
  skipFirst?: boolean;
  start?: number;
}) {
  const t = T[locale];
  const id = useId();
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [position, setPosition] = useState<NumberPosition>(pos0);
  const [format, setFormat] = useState<NumberFormat>(fmt0);
  const [start, setStart] = useState(Math.max(0, Math.floor(start0)));
  const [size, setSize] = useState(11);
  const [skipFirst, setSkipFirst] = useState(skip0);
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;
  const count = file?.pages ?? 0;

  const options: PageNumberOptions = { position: position as Anchor, format, locale, start, skipFirst, size, margin: mmToPt(10), color: [0, 0, 0] };
  const plan = count ? pageNumberPlan(count, options) : [];
  const labels = plan.filter((x): x is string => !!x);
  const previewPage = skipFirst && count > 1 ? 1 : 0;

  const buildJob = async (preview?: number): Promise<Job | null> => {
    if (!file) return null;
    return { type: "page-numbers", source: { bytes: file.bytes!.slice(0), password: file.password }, options, font: await fontFor(labels.join(" ")), preview };
  };
  const preview = usePagePreview(locale, file ? () => buildJob(previewPage) : null, file?.id ?? "", JSON.stringify([options, previewPage]));

  async function apply() {
    setResult(null);
    const out = await job.start(async (ctx) => workerJob((await buildJob())!, ctx));
    if (out && file) setResult([{ name: `${baseName(file.name)}-numbered.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const change = <V,>(set: (v: V) => void) => (v: V) => {
    set(v);
    setResult(null);
  };

  const controls = (
    <Controls>
      <div>
        <Caption>{t.position}</Caption>
        <PositionPicker label={t.position} value={position} options={POSITIONS} onChange={change(setPosition)} names={t.positions} />
      </div>
      <div>
        <Caption>{t.format}</Caption>
        <ChipChoice layout="wrap" label={t.format} value={format} onChange={change(setFormat)} options={FORMATS.map((f) => ({ value: f, label: pageLabel(f, 1, count || 10, locale) }))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label={t.start} htmlFor={`${id}-s`}>
          <NumberInput id={`${id}-s`} locale={locale} value={start} onChange={(v) => change(setStart)(v ?? 1)} min={0} max={9999} />
        </Field>
        <Field label={t.size} htmlFor={`${id}-z`}>
          <NumberInput id={`${id}-z`} locale={locale} value={size} onChange={(v) => change(setSize)(v ?? 11)} min={6} max={36} suffix="pt" />
        </Field>
      </div>
      <Switch label={t.skipFirst} checked={skipFirst} onChange={(e) => change(setSkipFirst)(e.target.checked)} />
    </Controls>
  );

  return (
    <div className="flex flex-col gap-4">
      {!file ? (
        <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      ) : (
        <Workspace
          files={<FilePanel locale={locale} pdf={pdf} disabled={job.running} />}
          preview={<PdfPreview locale={locale} preview={preview} original={{ doc: file.doc, index: previewPage }} label={t.preview} />}
          controls={controls}
          action={
            <>
              {labels.length > 0 && <Summary>{t.sample(labels[0], labels[1] ?? "")}</Summary>}
              <PrimaryButton disabled={job.running} done={!!result} onClick={apply}>
                <ListOrdered aria-hidden />
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
