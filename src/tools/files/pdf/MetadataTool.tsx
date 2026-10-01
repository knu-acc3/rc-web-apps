"use client";

import { Eraser, Loader2, Save } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Input, Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { runPdfJob } from "./lib/client";
import type { DocInfo, MetaFields } from "./lib/pdf-ops";
import { PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { errorText, pagesCount } from "./ui/strings";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";
import { Controls, Workspace } from "./ui/Workspace";

const FIELDS = ["title", "author", "subject", "keywords", "creator", "producer"] as const;

const T = {
  ru: {
    labels: { title: "Заголовок (Title)", author: "Автор (Author)", subject: "Тема (Subject)", keywords: "Ключевые слова (Keywords)", creator: "Программа-создатель (Creator)", producer: "PDF-библиотека (Producer)", created: "Создан", modified: "Изменён" },
    reading: "Чтение метаданных…",
    facts: (v: string, pages: string, xmp: boolean) => `PDF ${v} · ${pages} · XMP-метаданные: ${xmp ? "есть" : "нет"}`,
    removeXmp: "Удалить XMP-метаданные (Acrobat может показывать из них старые значения)",
    clear: "Очистить все поля",
    save: "Сохранить метаданные",
    empty: "пусто",
  },
  en: {
    labels: { title: "Title", author: "Author", subject: "Subject", keywords: "Keywords", creator: "Creator (application)", producer: "Producer (PDF library)", created: "Created", modified: "Modified" },
    reading: "Reading metadata…",
    facts: (v: string, pages: string, xmp: boolean) => `PDF ${v} · ${pages} · XMP metadata: ${xmp ? "yes" : "no"}`,
    removeXmp: "Remove XMP metadata (otherwise Acrobat may keep showing old values)",
    clear: "Clear all fields",
    save: "Save metadata",
    empty: "empty",
  },
} as const;

/** ISO → value for <input type="datetime-local"> in the user's time zone. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : "");

export default function MetadataTool({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const file = pdf.ready[0] ?? null;
  const [loaded, setLoaded] = useState<{ file: string; info: DocInfo } | { file: string; error: string } | null>(null);
  const [meta, setMeta] = useState<MetaFields | null>(null);
  const [removeXmp, setRemoveXmp] = useState(true);
  const [result, setResult] = useState<OutputItem[] | null>(null);

  // Read metadata as soon as a file is open (without letting the library rewrite it).
  useEffect(() => {
    if (!file?.bytes) return;
    const ctrl = new AbortController();
    runPdfJob({ type: "info", source: { bytes: file.bytes.slice(0), password: file.password } }, { signal: ctrl.signal })
      .then((r) => {
        if (ctrl.signal.aborted || !r.info) return;
        setLoaded({ file: file.id, info: r.info });
        setMeta({ ...r.info, created: toLocalInput(r.info.created), modified: toLocalInput(r.info.modified) });
        setResult(null);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setLoaded({ file: file.id, error: errorText(locale, e) });
      });
    return () => ctrl.abort();
  }, [file, locale]);

  const current = loaded && file && loaded.file === file.id ? loaded : null;
  const info = current && "info" in current ? current.info : null;

  async function save() {
    if (!file || !meta) return;
    setResult(null);
    const payload: MetaFields = { ...meta, created: fromLocalInput(meta.created), modified: fromLocalInput(meta.modified) };
    const out = await job.start((ctx) => workerJob({ type: "set-info", source: { bytes: file.bytes!.slice(0), password: file.password }, meta: payload, removeXmp: removeXmp && !!info?.hasXmp }, ctx));
    if (out) setResult([{ name: `${baseName(file.name)}.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const set = (k: keyof MetaFields, v: string) => {
    setMeta((m) => (m ? { ...m, [k]: v } : m));
    setResult(null);
  };

  const files = <FilePanel locale={locale} pdf={pdf} disabled={job.running} />;
  if (!info || !meta) {
    return (
      <div className="flex flex-col gap-4">
        {files}
        {file && !current && (
          <p className="flex items-center gap-2 text-sm text-fg-3" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t.reading}
          </p>
        )}
        {current && "error" in current && <Notice tone="err">{current.error}</Notice>}
      </div>
    );
  }

  return (
    <Workspace
      files={files}
      controls={
        <Controls>
          <p className="text-sm text-fg-3">{t.facts(info.version, pagesCount(locale, info.pageCount), info.hasXmp)}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((k) => (
              <Field key={k} label={t.labels[k]} htmlFor={`${id}-${k}`} className={k === "title" ? "sm:col-span-2" : undefined}>
                <Input id={`${id}-${k}`} size={k === "title" ? "lg" : "md"} value={meta[k]} placeholder={t.empty} onChange={(e) => set(k, e.target.value)} autoComplete="off" />
              </Field>
            ))}
            <Field label={t.labels.created} htmlFor={`${id}-c`}>
              <Input id={`${id}-c`} type="datetime-local" value={meta.created} onChange={(e) => set("created", e.target.value)} />
            </Field>
            <Field label={t.labels.modified} htmlFor={`${id}-m`}>
              <Input id={`${id}-m`} type="datetime-local" value={meta.modified} onChange={(e) => set("modified", e.target.value)} />
            </Field>
          </div>
          <Button variant="text" className="self-start" onClick={() => setMeta({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "", created: "", modified: "" })}>
            <Eraser aria-hidden />
            {t.clear}
          </Button>
        </Controls>
      }
      action={
        <>
          {info.hasXmp && <Switch label={t.removeXmp} checked={removeXmp} onChange={(e) => setRemoveXmp(e.target.checked)} />}
          <PrimaryButton disabled={job.running} done={!!result} onClick={save}>
            <Save aria-hidden />
            {t.save}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
        </>
      }
      result={
        result && (
          <ResultCard
            locale={locale}
            items={result}
            onReset={() => {
              setResult(null);
              pdf.clear();
              job.reset();
            }}
          />
        )
      }
    />
  );
}
