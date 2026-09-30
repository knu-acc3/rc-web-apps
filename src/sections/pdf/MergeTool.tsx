"use client";

import { Combine, LayoutGrid, List, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Input } from "@/ui/field";
import { Notice } from "@/ui/panel";
import type { PageRef } from "./engine/pdf-ops";
import { parsePageRanges } from "./engine/ranges";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { PageGrid, moveItem, toggleSelection, type GridPage } from "./ui/PageGrid";
import { ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { JobStatus } from "./ui/Result";
import { S, filesCount, pagesCount, rangeErrorText } from "./ui/strings";
import { useJob } from "./ui/use-job";
import { usePdfFiles, type PdfFile } from "./ui/use-pdf-files";

const T = {
  ru: {
    pagesOf: "Страницы",
    all: "все",
    merge: (n: number) => `Объединить ${filesCount("ru", n)}`,
    mergePages: (n: number) => `Объединить ${pagesCount("ru", n)}`,
    needTwo: "Добавьте ещё хотя бы один PDF или выберите страницы одного файла",
    waiting: "Дождитесь загрузки файлов, введите пароли или уберите повреждённые файлы",
    pageMode: "Упорядочить страницы",
    fileMode: "К списку файлов",
    selected: (n: number) => `Выбрано: ${n}`,
    selectAll: "Выбрать все",
    fileLetter: (l: string, name: string) => `файл ${l} (${name})`,
    formsNote: "Интерактивные поля форм после объединения могут перестать работать — заполните и «сплющьте» их заранее.",
  },
  en: {
    pagesOf: "Pages",
    all: "all",
    merge: (n: number) => `Merge ${filesCount("en", n)}`,
    mergePages: (n: number) => `Merge ${pagesCount("en", n)}`,
    needTwo: "Add at least one more PDF or pick pages of a single file",
    waiting: "Wait for the files to load, enter passwords or remove damaged files",
    pageMode: "Arrange pages",
    fileMode: "Back to the file list",
    selected: (n: number) => `Selected: ${n}`,
    selectAll: "Select all",
    fileLetter: (l: string, name: string) => `file ${l} (${name})`,
    formsNote: "Interactive form fields may stop working after merging — fill and flatten them first.",
  },
} as const;

const letter = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : `F${i + 1}`);

interface Arrangement {
  pages: GridPage[];
  /** Files already present when the arrangement was last edited. */
  known: string[];
}

/** Deterministic keys: file, page and occurrence (a page may be listed twice). */
function keyed(list: { file: string; index: number }[]): GridPage[] {
  const seen = new Map<string, number>();
  return list.map(({ file, index }) => {
    const base = `${file}:${index}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { key: `${base}:${n}`, file, index, rotate: 0 };
  });
}

const filePages = (f: PdfFile) => keyed(Array.from({ length: f.pages }, (_, index) => ({ file: f.id, index })));

export default function MergeTool({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = S[locale];
  const pdf = usePdfFiles({ multiple: true });
  const job = useJob(locale);
  const [ranges, setRanges] = useState<Record<string, string>>({});
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);
  const [result, setResult] = useState<OutputItem[] | null>(null);

  const byId = useMemo(() => new Map(pdf.files.map((f) => [f.id, f])), [pdf.files]);
  const letterOf = useMemo(() => new Map(pdf.files.map((f, i) => [f.id, letter(i)])), [pdf.files]);

  // Page mode: keep the user's arrangement, drop pages of removed files, append newly added files.
  let gridPages: GridPage[] | null = null;
  if (arrangement) {
    const ready = new Set(pdf.ready.map((f) => f.id));
    const kept = arrangement.pages.filter((p) => ready.has(p.file));
    const fresh = pdf.ready.filter((f) => !arrangement.known.includes(f.id)).flatMap(filePages);
    gridPages = [...kept, ...fresh];
  }

  const commit = (pages: GridPage[]) => {
    setArrangement({ pages, known: pdf.ready.map((f) => f.id) });
    setResult(null);
  };

  // File mode: pages of every file by its range (order kept, repeats allowed).
  const filePlan = useMemo(() => {
    const out: { file: PdfFile; pages: number[] | null; error: string | null }[] = [];
    for (const f of pdf.files) {
      if (f.status !== "ready") {
        out.push({ file: f, pages: null, error: null });
        continue;
      }
      const text = ranges[f.id] ?? "";
      if (!text.trim()) {
        out.push({ file: f, pages: Array.from({ length: f.pages }, (_, i) => i + 1), error: null });
        continue;
      }
      const r = parsePageRanges(text, f.pages);
      out.push(r.ok ? { file: f, pages: r.pages, error: null } : { file: f, pages: null, error: rangeErrorText(locale, r.error, f.pages) });
    }
    return out;
  }, [pdf.files, ranges, locale]);

  const sourceIds = pdf.ready.map((f) => f.id);
  const plan: PageRef[] = gridPages
    ? gridPages.map((p) => ({ src: sourceIds.indexOf(p.file), index: p.index, rotate: p.rotate }))
    : filePlan.flatMap((x) => (x.pages ? x.pages.map((n) => ({ src: sourceIds.indexOf(x.file.id), index: n - 1 })) : []));
  const blocked = !pdf.allReady || (!gridPages && filePlan.some((x) => x.error));
  const tooFew = !gridPages && pdf.files.length < 2 && !(ranges[pdf.files[0]?.id ?? ""] ?? "").trim();

  async function merge() {
    setResult(null);
    const files = pdf.ready;
    const out = await job.start((ctx) =>
      workerJob(
        {
          type: "assemble",
          sources: files.map((f) => ({ bytes: f.bytes!.slice(0), password: f.password })),
          outputs: [{ name: "merged.pdf", pages: plan }],
          keepInfo: files.length === 1,
        },
        ctx,
      ),
    );
    if (out) setResult([{ name: `${baseName(files[0].name)}-merged.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const rotateSelected = (delta: number) => gridPages && commit(gridPages.map((p) => (selected.has(p.key) ? { ...p, rotate: (p.rotate + delta + 360) % 360 } : p)));
  const deleteSelected = () => {
    if (!gridPages) return;
    commit(gridPages.filter((p) => !selected.has(p.key)));
    setSelected(new Set());
  };

  return (
    <div className="flex flex-col gap-4">
      <FilePanel
        locale={locale}
        pdf={pdf}
        multiple
        disabled={job.running}
        renderExtra={
          gridPages
            ? undefined
            : (f) =>
                f.status === "ready" ? (
                  <div className="mt-2 flex items-center gap-2 pl-12">
                    <label htmlFor={`rng-${f.id}`} className="shrink-0 text-sm text-fg-3">
                      {t.pagesOf}
                    </label>
                    <Input
                      id={`rng-${f.id}`}
                      size="sm"
                      className="max-w-56"
                      placeholder={`${t.all} (1-${f.pages})`}
                      value={ranges[f.id] ?? ""}
                      onChange={(e) => {
                        setRanges((r) => ({ ...r, [f.id]: e.target.value }));
                        setResult(null);
                      }}
                      aria-invalid={!!filePlan.find((x) => x.file.id === f.id)?.error}
                      autoComplete="off"
                    />
                    {filePlan.find((x) => x.file.id === f.id)?.error && (
                      <span className="text-sm text-err" role="alert">
                        {filePlan.find((x) => x.file.id === f.id)?.error}
                      </span>
                    )}
                  </div>
                ) : null
        }
      />

      {pdf.files.length > 0 && (
        <>
          {gridPages && (
            <PageGrid
              locale={locale}
              pages={gridPages}
              thumbsOf={(id) => byId.get(id)?.thumbs ?? null}
              label={(p) => `${letterOf.get(p.file)}·${p.index + 1}`}
              describe={(p, i) => `${i + 1}: ${s.page} ${p.index + 1}, ${t.fileLetter(letterOf.get(p.file) ?? "", byId.get(p.file)?.name ?? "")}`}
              selected={selected}
              onToggle={(key, extend) => setSelected((prev) => toggleSelection(prev, gridPages.map((p) => p.key), key, extend, anchor))}
              onMove={(from, to) => commit(moveItem(gridPages, from, to))}
              onRotate={(key, d) => commit(gridPages.map((p) => (p.key === key ? { ...p, rotate: (p.rotate + d + 360) % 360 } : p)))}
              onDelete={(key) => commit(gridPages.filter((p) => p.key !== key))}
              toolbar={
                <OptionsRow className="items-center! gap-x-2!">
                  <span className="text-sm text-fg-2">{t.selected(selected.size)}</span>
                  <Button size="sm" variant="ghost" disabled={!selected.size} onClick={() => rotateSelected(-90)} aria-label={s.rotateLeft} title={s.rotateLeft}>
                    <RotateCcw aria-hidden />
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!selected.size} onClick={() => rotateSelected(90)} aria-label={s.rotateRight} title={s.rotateRight}>
                    <RotateCw aria-hidden />
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!selected.size} onClick={deleteSelected} aria-label={s.deletePage} title={s.deletePage}>
                    <Trash2 aria-hidden />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(selected.size ? new Set() : new Set(gridPages.map((p) => p.key)))}>
                    {selected.size ? s.selectNone : t.selectAll}
                  </Button>
                </OptionsRow>
              }
            />
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryButton disabled={blocked || tooFew || !plan.length || job.running} onClick={merge}>
              <Combine aria-hidden />
              {gridPages ? t.mergePages(plan.length) : t.merge(pdf.files.length)}
            </PrimaryButton>
            {pdf.ready.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (gridPages) setArrangement(null);
                  else commit(keyed(filePlan.flatMap((x) => (x.pages ? x.pages.map((n) => ({ file: x.file.id, index: n - 1 })) : []))));
                  setSelected(new Set());
                }}
              >
                {gridPages ? <List aria-hidden /> : <LayoutGrid aria-hidden />}
                {gridPages ? t.fileMode : t.pageMode}
              </Button>
            )}
          </div>
          {!pdf.allReady && pdf.files.some((f) => f.status !== "loading") && <p className="text-sm text-fg-3">{t.waiting}</p>}
          {pdf.allReady && tooFew && <p className="text-sm text-fg-3">{t.needTwo}</p>}
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              notice={t.formsNote}
              onReset={() => {
                setResult(null);
                setArrangement(null);
                setRanges({});
                pdf.clear();
                job.reset();
              }}
            />
          )}
          {!result && pdf.files.length > 0 && job.state.status === "idle" && pdf.files.some((f) => f.status === "error") && <Notice tone="warn">{s.invalid}</Notice>}
        </>
      )}
    </div>
  );
}
