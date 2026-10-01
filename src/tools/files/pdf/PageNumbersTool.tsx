"use client";

import { ListOrdered } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Checkbox, Field, Input, Select } from "@/ui/field";
import { fontFor } from "./lib/client";
import type { Anchor } from "./lib/geometry";
import { mmToPt } from "./lib/geometry";
import type { Job } from "./lib/jobs";
import { pageLabel, pageNumberPlan, type NumberFormat } from "./lib/labels";
import type { PageNumberOptions } from "./lib/pdf-ops";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { PdfPreview, usePagePreview } from "./ui/PdfPreview";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";

export type NumberPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

const T = {
  ru: {
    position: "Где",
    positions: { "bottom-center": "Снизу по центру", "bottom-right": "Снизу справа", "bottom-left": "Снизу слева", "top-center": "Сверху по центру", "top-right": "Сверху справа", "top-left": "Сверху слева" } as Record<NumberPosition, string>,
    format: "Вид",
    start: "Начать с",
    size: "Размер",
    skipFirst: "Не ставить номер на первой странице (титульный лист)",
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
    skipFirst: "No number on the first page (title page)",
    preview: "Preview of a numbered page",
    go: "Add page numbers",
    sample: (a: string, b: string) => `First numbers: ${a}${b ? `, ${b}` : ""}…`,
  },
} as const;

const FORMATS: NumberFormat[] = ["n", "n-of-total", "page-n-of-total", "dash-n"];

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
  const [startText, setStartText] = useState(String(start0));
  const [size, setSize] = useState("11");
  const [skipFirst, setSkipFirst] = useState(skip0);
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;
  const count = file?.pages ?? 0;
  const start = Math.max(0, Math.floor(Number(startText) || 0));

  const options: PageNumberOptions = { position: position as Anchor, format, locale, start, skipFirst, size: Number(size), margin: mmToPt(10), color: [0, 0, 0] };
  const plan = count ? pageNumberPlan(count, options) : [];
  const labels = plan.filter((x): x is string => !!x);
  const previewPage = skipFirst && count > 1 ? 1 : 0;

  const buildJob = async (preview?: number): Promise<Job | null> => {
    if (!file) return null;
    return { type: "page-numbers", source: { bytes: file.bytes!.slice(0), password: file.password }, options, font: await fontFor(labels.join(" ")), preview };
  };
  const preview = usePagePreview(file ? () => buildJob(previewPage) : null, file?.id ?? "", JSON.stringify([options, previewPage]));

  async function apply() {
    setResult(null);
    const out = await job.start(async (ctx) => workerJob((await buildJob())!, ctx));
    if (out && file) setResult([{ name: `${baseName(file.name)}-numbered.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const reset = () => setResult(null);

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <OptionsRow>
                <Field label={t.position} htmlFor={`${id}-p`} className="w-48">
                  <Select
                    id={`${id}-p`}
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value as NumberPosition);
                      reset();
                    }}
                  >
                    {Object.entries(t.positions).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t.format} htmlFor={`${id}-f`} className="w-48">
                  <Select
                    id={`${id}-f`}
                    value={format}
                    onChange={(e) => {
                      setFormat(e.target.value as NumberFormat);
                      reset();
                    }}
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {pageLabel(f, 1, count || 10, locale)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t.start} htmlFor={`${id}-s`} className="w-24">
                  <Input
                    id={`${id}-s`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={startText}
                    onChange={(e) => {
                      setStartText(e.target.value);
                      reset();
                    }}
                  />
                </Field>
                <Field label={t.size} htmlFor={`${id}-z`} className="w-24">
                  <Select
                    id={`${id}-z`}
                    value={size}
                    onChange={(e) => {
                      setSize(e.target.value);
                      reset();
                    }}
                  >
                    {["9", "10", "11", "12", "14", "16"].map((v) => (
                      <option key={v} value={v}>
                        {v} pt
                      </option>
                    ))}
                  </Select>
                </Field>
              </OptionsRow>
              <Checkbox
                label={t.skipFirst}
                checked={skipFirst}
                onChange={(e) => {
                  setSkipFirst(e.target.checked);
                  reset();
                }}
              />
              {labels.length > 0 && <p className="tabular text-lg font-semibold text-fg">{t.sample(labels[0], labels[1] ?? "")}</p>}
            </div>
            <PdfPreview bytes={preview.bytes} busy={preview.busy} label={t.preview} />
          </div>
          <PrimaryButton disabled={job.running} onClick={apply}>
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
      )}
    </div>
  );
}
