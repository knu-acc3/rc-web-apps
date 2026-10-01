"use client";

import { Scissors } from "lucide-react";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Field } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { toggleSelection } from "./lib/order";
import { chunkPages, evenPages, formatPageRanges, oddPages, segmentPages } from "./lib/ranges";
import { Caption, PrimaryButton, workerJob } from "./ui/bits";
import { ChipChoice } from "@/ui/chip-choice";
import { FilePanel } from "./ui/FilePanel";
import { PageGrid, type GridPage } from "./ui/PageGrid";
import { RangeField, resolveRange } from "./ui/RangeField";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { S, filesCount } from "./ui/strings";
import { useJob, type Job } from "./ui/use-job";
import { usePdfFiles, type PdfFile } from "./ui/use-pdf-files";
import { Controls, Workspace } from "./ui/Workspace";

export type SplitMode = "each" | "ranges" | "chunks" | "odd" | "even" | "select";

const T = {
  ru: {
    how: "Как разделить",
    modes: {
      each: "По одной странице",
      ranges: "По диапазонам",
      chunks: "Каждые N страниц",
      odd: "Нечётные",
      even: "Чётные",
      select: "Выбрать вручную",
    } as Record<SplitMode, string>,
    every: "Страниц в файле",
    rangesLabel: "Диапазоны (каждый — отдельный файл)",
    selectHint: "Выберите страницы для нового файла",
    will: (n: number) => `Получится ${filesCount("ru", n)}`,
    split: "Разделить PDF",
    zip: "страницы.zip",
  },
  en: {
    how: "How to split",
    modes: {
      each: "One page per file",
      ranges: "By ranges",
      chunks: "Every N pages",
      odd: "Odd pages",
      even: "Even pages",
      select: "Pick by hand",
    } as Record<SplitMode, string>,
    every: "Pages per file",
    rangesLabel: "Ranges (each becomes a file)",
    selectHint: "Choose pages for the new file",
    will: (n: number) => `You will get ${filesCount("en", n)}`,
    split: "Split PDF",
    zip: "pages.zip",
  },
} as const;

export default function SplitTool({ locale, mode = "each", chunk = 2 }: { locale: Locale; mode?: SplitMode; chunk?: number }) {
  const pdf = usePdfFiles();
  const job = useJob(locale);
  const file = pdf.ready[0] ?? null;
  const files = <FilePanel locale={locale} pdf={pdf} disabled={job.running} />;
  return (
    <div className="flex flex-col gap-4">
      {/* Keyed by file: ranges and selection never leak into a newly opened file. */}
      {file ? <SplitBody key={file.id} locale={locale} mode0={mode} chunk0={chunk} file={file} job={job} onClear={pdf.clear} files={files} /> : files}
    </div>
  );
}

function SplitBody({ locale, mode0, chunk0, file, job, onClear, files }: { locale: Locale; mode0: SplitMode; chunk0: number; file: PdfFile; job: Job; onClear: () => void; files: ReactNode }) {
  const t = T[locale];
  const s = S[locale];
  const id = useId();
  const [mode, setMode] = useState<SplitMode>(mode0);
  const [chunk, setChunk] = useState<number | null>(Math.max(1, Math.floor(chunk0)));
  const [ranges, setRanges] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);
  const [result, setResult] = useState<OutputItem[] | null>(null);

  const count = file.pages;
  const pages: GridPage[] = useMemo(() => Array.from({ length: file.pages }, (_, index) => ({ key: String(index), file: file.id, index, rotate: 0 })), [file]);

  const rangeResult = resolveRange(ranges, Math.max(1, count), false);

  const groups: number[][] = !file
    ? []
    : mode === "each"
      ? chunkPages(count, 1)
      : mode === "chunks"
        ? chunk
          ? chunkPages(count, Math.max(1, chunk))
          : []
        : mode === "odd"
          ? [oddPages(count)]
          : mode === "even"
            ? [evenPages(count)]
            : mode === "select"
              ? selected.size
                ? [
                    [...selected]
                      .map(Number)
                      .sort((a, b) => a - b)
                      .map((i) => i + 1),
                  ]
                : []
              : rangeResult.ok
                ? rangeResult.segments.map(segmentPages)
                : [];
  const valid = groups.filter((g) => g.length);

  async function split() {
    if (!file) return;
    setResult(null);
    const base = baseName(file.name);
    const pad = String(count).length;
    const name = (g: number[], i: number) => {
      if (mode === "each") return `${base}-page-${String(g[0]).padStart(pad, "0")}.pdf`;
      if (mode === "odd") return `${base}-odd-pages.pdf`;
      if (mode === "even") return `${base}-even-pages.pdf`;
      if (mode === "select") return `${base}-selected.pdf`;
      if (mode === "chunks") return `${base}-part-${String(i + 1).padStart(String(valid.length).length, "0")}.pdf`;
      return g.length === 1 ? `${base}-page-${g[0]}.pdf` : `${base}-pages-${g[0]}-${g[g.length - 1]}.pdf`;
    };
    const out = await job.start((ctx) =>
      workerJob(
        {
          type: "assemble",
          sources: [{ bytes: file.bytes!.slice(0), password: file.password }],
          outputs: valid.map((g, i) => ({ name: name(g, i), pages: g.map((p) => ({ src: 0, index: p - 1 })) })),
          keepInfo: true,
        },
        ctx,
      ),
    );
    if (out) setResult(out.files.map((f) => ({ name: f.name, blob: pdfBlob(f.bytes) })));
  }

  const summary = valid.length
    ? valid
        .slice(0, 8)
        .map((g) => formatPageRanges(g))
        .join(" · ") + (valid.length > 8 ? ` · ${s.andMore(valid.length - 8)}` : "")
    : "";

  return (
    <Workspace
      files={files}
      controls={
        <Controls>
          <div>
            <Caption>{t.how}</Caption>
            <ChipChoice
            layout="wrap"
              label={t.how}
              value={mode}
              onChange={(m) => {
                setMode(m);
                setResult(null);
              }}
              options={(Object.keys(t.modes) as SplitMode[]).map((m) => ({ value: m, label: t.modes[m] }))}
            />
          </div>
          {mode === "chunks" && (
            <Field label={t.every} htmlFor={`${id}-n`}>
              <NumberInput id={`${id}-n`} locale={locale} value={chunk} onChange={setChunk} min={1} max={Math.max(1, count)} className="max-w-48" />
            </Field>
          )}
          {mode === "ranges" && <RangeField locale={locale} label={t.rangesLabel} value={ranges} onChange={setRanges} result={rangeResult} pageCount={count} placeholder="1-3, 4-6, 7-" />}
        </Controls>
      }
      previewFirst={false}
      stickyAction={mode === "select"}
      preview={
        mode === "select" ? (
          <PageGrid
            locale={locale}
            pages={pages}
            thumbsOf={() => file.thumbs}
            label={(p) => formatNumber(locale, p.index + 1)}
            selected={selected}
            onToggle={(key, extend) =>
              setSelected((prev) =>
                toggleSelection(
                  prev,
                  pages.map((p) => p.key),
                  key,
                  extend,
                  anchor,
                ),
              )
            }
          />
        ) : undefined
      }
      action={
        <Panel className="flex flex-col gap-3 p-3 max-lg:shadow-elev-3 sm:p-4">
          <div aria-live="polite">
            <p className="text-lg font-semibold text-fg">{valid.length ? t.will(valid.length) : mode === "select" ? t.selectHint : "—"}</p>
            {summary && <p className="tabular mt-0.5 truncate text-sm text-fg-3">{summary}</p>}
          </div>
          <PrimaryButton disabled={!valid.length || job.running} done={!!result} onClick={split}>
            <Scissors aria-hidden />
            {t.split}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
        </Panel>
      }
      result={
        result && (
          <ResultCard
            locale={locale}
            items={result}
            zipName={`${baseName(file.name)}-${t.zip}`}
            onReset={() => {
              setResult(null);
              setSelected(new Set());
              onClear();
              job.reset();
            }}
          />
        )
      }
    />
  );
}
