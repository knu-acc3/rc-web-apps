"use client";

import { Scissors } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { chunkPages, evenPages, formatPageRanges, oddPages, segmentPages } from "./engine/ranges";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { PageGrid, toggleSelection, type GridPage } from "./ui/PageGrid";
import { RangeField, resolveRange } from "./ui/RangeField";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { S, filesCount } from "./ui/strings";
import { useJob, type Job } from "./ui/use-job";
import { usePdfFiles, type PdfFile } from "./ui/use-pdf-files";

export type SplitMode = "each" | "ranges" | "chunks" | "odd" | "even" | "select";

const T = {
  ru: {
    how: "Как разделить",
    modes: {
      each: "Каждую страницу в отдельный файл",
      ranges: "По диапазонам страниц",
      chunks: "Каждые N страниц",
      odd: "Только нечётные страницы",
      even: "Только чётные страницы",
      select: "Выбрать страницы вручную",
    } as Record<SplitMode, string>,
    every: "Страниц в файле",
    rangesLabel: "Диапазоны (каждый — отдельный файл)",
    selectHint: "Нажмите на страницы ниже, которые нужно сохранить в новый файл",
    will: (n: number) => `Получится ${filesCount("ru", n)}`,
    split: "Разделить PDF",
    zip: "страницы.zip",
  },
  en: {
    how: "How to split",
    modes: {
      each: "Every page into its own file",
      ranges: "By page ranges",
      chunks: "Every N pages",
      odd: "Odd pages only",
      even: "Even pages only",
      select: "Pick pages by hand",
    } as Record<SplitMode, string>,
    every: "Pages per file",
    rangesLabel: "Ranges (each becomes a file)",
    selectHint: "Click the pages below that should go into the new file",
    will: (n: number) => `You will get ${filesCount("en", n)}`,
    split: "Split PDF",
    zip: "pages.zip",
  },
} as const;

export default function SplitTool({ locale, mode = "each", chunk = 2 }: { locale: Locale; mode?: SplitMode; chunk?: number }) {
  const pdf = usePdfFiles();
  const job = useJob(locale);
  const file = pdf.ready[0] ?? null;
  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {/* Keyed by file: ranges and selection never leak into a newly opened file. */}
      {file && <SplitBody key={file.id} locale={locale} mode0={mode} chunk0={chunk} file={file} job={job} onClear={pdf.clear} />}
    </div>
  );
}

function SplitBody({ locale, mode0, chunk0, file, job, onClear }: { locale: Locale; mode0: SplitMode; chunk0: number; file: PdfFile; job: Job; onClear: () => void }) {
  const t = T[locale];
  const s = S[locale];
  const id = useId();
  const [mode, setMode] = useState<SplitMode>(mode0);
  const [chunkText, setChunkText] = useState(String(chunk0));
  const [ranges, setRanges] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);
  const [result, setResult] = useState<OutputItem[] | null>(null);

  const count = file.pages;
  const pages: GridPage[] = useMemo(() => Array.from({ length: file.pages }, (_, index) => ({ key: String(index), file: file.id, index, rotate: 0 })), [file]);

  const rangeResult = resolveRange(ranges, Math.max(1, count), false);
  const chunk = Math.max(1, Math.floor(Number(chunkText) || 0));

  const groups: number[][] = !file
    ? []
    : mode === "each"
      ? chunkPages(count, 1)
      : mode === "chunks"
        ? chunkText.trim()
          ? chunkPages(count, chunk)
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
    <>
      <OptionsRow>
        <Field label={t.how} htmlFor={`${id}-m`} className="w-full sm:w-72">
          <Select
            id={`${id}-m`}
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as SplitMode);
              setResult(null);
            }}
          >
            {(Object.keys(t.modes) as SplitMode[]).map((m) => (
              <option key={m} value={m}>
                {t.modes[m]}
              </option>
            ))}
          </Select>
        </Field>
        {mode === "chunks" && (
          <Field label={t.every} htmlFor={`${id}-n`} className="w-32">
            <Input id={`${id}-n`} type="number" min={1} max={count} inputMode="numeric" value={chunkText} onChange={(e) => setChunkText(e.target.value)} />
          </Field>
        )}
        {mode === "ranges" && (
          <RangeField locale={locale} label={t.rangesLabel} value={ranges} onChange={setRanges} result={rangeResult} pageCount={count} placeholder="1-3, 4-6, 7-" className="w-full sm:w-80" />
        )}
      </OptionsRow>

      <div className="rounded-[12px] bg-surface-2 px-4 py-3">
        <p className="text-xl font-semibold text-fg">{valid.length ? t.will(valid.length) : mode === "select" ? t.selectHint : "—"}</p>
        {summary && <p className="tabular mt-0.5 truncate text-sm text-fg-3">{summary}</p>}
      </div>

      {mode === "select" && (
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
      )}

      <PrimaryButton disabled={!valid.length || job.running} onClick={split}>
        <Scissors aria-hidden />
        {t.split}
      </PrimaryButton>
      <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
      {result && (
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
      )}
    </>
  );
}
