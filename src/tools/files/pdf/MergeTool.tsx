"use client";

import { ArrowLeft, ArrowRight, Combine, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button, IconButton } from "@/ui/button";
import { Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { moveItem, shiftSelected, toggleSelection } from "./lib/order";
import type { PageRef } from "./lib/pdf-ops";
import { parsePageRanges } from "./lib/ranges";
import { PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { PageGrid, type GridPage } from "./ui/PageGrid";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { S, filesCount, pagesCount, rangeErrorText } from "./ui/strings";
import { useJob } from "./ui/use-job";
import { usePdfFiles, type PdfFile } from "./ui/use-pdf-files";
import { Controls, Summary, Workspace } from "./ui/Workspace";

const T = {
  ru: {
    pagesOf: "Страницы",
    all: "все",
    merge: (n: number) => `Объединить ${filesCount("ru", n)}`,
    mergePages: (n: number) => `Объединить ${pagesCount("ru", n)}`,
    needTwo: "Добавьте ещё один PDF или выберите страницы",
    waiting: "Дождитесь загрузки, введите пароли или уберите повреждённые файлы",
    mode: "Что объединять",
    pageMode: "Страницы",
    fileMode: "Файлы",
    total: (n: number) => `В новом файле: ${pagesCount("ru", n)}`,
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
    needTwo: "Add one more PDF or pick pages",
    waiting: "Wait for the files to load, enter passwords or remove damaged files",
    mode: "What to merge",
    pageMode: "Pages",
    fileMode: "Files",
    total: (n: number) => `${pagesCount("en", n)} in the new file`,
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
  const setMode = (m: "files" | "pages") => {
    if (m === "files") setArrangement(null);
    else commit(keyed(filePlan.flatMap((x) => (x.pages ? x.pages.map((n) => ({ file: x.file.id, index: n - 1 })) : []))));
    setSelected(new Set());
  };

  const files = (
    <FilePanel
      locale={locale}
      pdf={pdf}
      multiple
      disabled={job.running}
      renderExtra={
        gridPages
          ? undefined
          : (f) => {
              if (f.status !== "ready") return null;
              const err = filePlan.find((x) => x.file.id === f.id)?.error;
              return (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 sm:pl-[3.25rem]">
                  <label htmlFor={`rng-${f.id}`} className="shrink-0 text-sm text-fg-2">
                    {t.pagesOf}
                  </label>
                  <Input
                    id={`rng-${f.id}`}
                    size="sm"
                    className="w-auto min-w-0 flex-1 basis-32 sm:max-w-56"
                    placeholder={`${t.all} (1-${f.pages})`}
                    value={ranges[f.id] ?? ""}
                    onChange={(e) => {
                      setRanges((r) => ({ ...r, [f.id]: e.target.value }));
                      setResult(null);
                    }}
                    aria-invalid={!!err}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {err && (
                    <span className="basis-full text-sm text-err" role="alert">
                      {err}
                    </span>
                  )}
                </div>
              );
            }
      }
    />
  );

  if (!pdf.files.length) return <div className="flex flex-col gap-4">{files}</div>;

  const modeSwitch =
    pdf.ready.length > 0 ? (
      <Segmented
        label={t.mode}
        value={gridPages ? "pages" : "files"}
        onChange={setMode}
        options={[
          { value: "files", label: t.fileMode },
          { value: "pages", label: t.pageMode },
        ]}
      />
    ) : null;

  const controls = gridPages ? (
    <Controls>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fg-2">{t.selected(selected.size)}</span>
        <div className="flex flex-wrap items-center gap-1">
          <IconButton variant="tonal" label={s.rotateLeft} icon={<RotateCcw aria-hidden />} disabled={!selected.size} onClick={() => rotateSelected(-90)} />
          <IconButton variant="tonal" label={s.rotateRight} icon={<RotateCw aria-hidden />} disabled={!selected.size} onClick={() => rotateSelected(90)} />
          <IconButton variant="tonal" label={s.moveLeft} icon={<ArrowLeft aria-hidden />} disabled={!selected.size} onClick={() => commit(shiftSelected(gridPages, selected, -1) as GridPage[])} />
          <IconButton variant="tonal" label={s.moveRight} icon={<ArrowRight aria-hidden />} disabled={!selected.size} onClick={() => commit(shiftSelected(gridPages, selected, 1) as GridPage[])} />
          <IconButton variant="tonal" label={s.deletePage} icon={<Trash2 aria-hidden />} disabled={!selected.size} onClick={deleteSelected} />
        </div>
        <Button size="sm" variant="text" className="self-start" onClick={() => setSelected(selected.size ? new Set() : new Set(gridPages.map((p) => p.key)))}>
          {selected.size ? s.selectNone : t.selectAll}
        </Button>
      </div>
    </Controls>
  ) : null;

  return (
    <Workspace
      files={
        <div className="flex flex-col gap-3">
          {modeSwitch}
          {files}
        </div>
      }
      controls={controls}
      previewFirst={false}
      stickyAction={!!gridPages}
      preview={
        gridPages ? (
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
          />
        ) : undefined
      }
      action={
        <Panel className="flex flex-col gap-3 p-3 max-lg:shadow-elev-3 sm:p-4">
          {pdf.allReady && plan.length > 0 && <Summary size="md">{t.total(plan.length)}</Summary>}
          <PrimaryButton disabled={blocked || tooFew || !plan.length || job.running} done={!!result} onClick={merge}>
            <Combine aria-hidden />
            {gridPages ? t.mergePages(plan.length) : t.merge(pdf.files.length)}
          </PrimaryButton>
          {!pdf.allReady && pdf.files.some((f) => f.status !== "loading") && <p className="text-sm text-fg-3">{t.waiting}</p>}
          {pdf.allReady && tooFew && <p className="text-sm text-fg-3">{t.needTwo}</p>}
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
        </Panel>
      }
      result={
        result && (
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
        )
      }
    />
  );
}
