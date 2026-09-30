"use client";

import { FileArchive } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Checkbox, Field, Input, Select } from "@/ui/field";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { useJob } from "@/sections/video/ui/hooks";
import { JobProgress } from "@/sections/video/ui/Progress";
import { ResultCard } from "@/sections/video/ui/ResultCard";
import { UI } from "@/sections/video/ui/strings";
import { DEFAULT_RENAME, regexError, renameAll, type CaseMode, type RenameError, type RenameOptions, type SpaceMode } from "./lib/rename";
import { buildZip } from "./lib/zip-client";

const T = {
  ru: {
    drop: "Перетащите файлы сюда или нажмите, чтобы выбрать",
    pattern: "Шаблон имени",
    patternHint: "{name} — исходное имя, {n} — номер, {n:3} — номер с нулями (001), {date} и {time} — дата и время изменения файла. Расширение сохраняется.",
    find: "Найти",
    replace: "Заменить на",
    regex: "Регулярное выражение",
    start: "Нумерация с",
    caseLabel: "Регистр",
    keep: "Как есть",
    lower: "строчные",
    upper: "ПРОПИСНЫЕ",
    title: "Каждое Слово",
    spaces: "Пробелы",
    spKeep: "оставить",
    spDash: "заменить на -",
    spUnder: "заменить на _",
    spRemove: "удалить",
    translit: "Транслитерация (Привет → Privet)",
    sort: "Порядок",
    added: "как добавлены",
    byName: "по имени",
    byDate: "по дате",
    files: ["файл", "файла", "файлов"],
    old: "Было",
    now: "Станет",
    errors: { empty: "пустое имя", illegal: "недопустимые символы", reserved: "зарезервированное имя Windows", duplicate: "повторяется", long: "слишком длинное" } as Record<RenameError, string>,
    fix: "Исправьте имена с ошибками, чтобы скачать архив.",
    run: "Скачать ZIP с новыми именами",
    note: "Браузер не может переименовать файлы прямо на диске, поэтому переименованные копии скачиваются в ZIP-архиве без сжатия.",
    clear: "Очистить",
  },
  en: {
    drop: "Drop files here or click to choose",
    pattern: "Name pattern",
    patternHint: "{name} — original name, {n} — number, {n:3} — zero-padded number (001), {date} and {time} — file modification date and time. The extension is kept.",
    find: "Find",
    replace: "Replace with",
    regex: "Regular expression",
    start: "Start numbering at",
    caseLabel: "Case",
    keep: "Keep",
    lower: "lowercase",
    upper: "UPPERCASE",
    title: "Title Case",
    spaces: "Spaces",
    spKeep: "keep",
    spDash: "replace with -",
    spUnder: "replace with _",
    spRemove: "remove",
    translit: "Transliterate Cyrillic (Привет → Privet)",
    sort: "Order",
    added: "as added",
    byName: "by name",
    byDate: "by date",
    files: ["file", "files"],
    old: "Before",
    now: "After",
    errors: { empty: "empty name", illegal: "illegal characters", reserved: "reserved Windows name", duplicate: "duplicate", long: "too long" } as Record<RenameError, string>,
    fix: "Fix the names with errors to download the archive.",
    run: "Download ZIP with new names",
    note: "Browsers can't rename files directly on disk, so the renamed copies are downloaded in an uncompressed ZIP archive.",
    clear: "Clear",
  },
} as const;

let seq = 0;

export default function BatchRename({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [files, setFiles] = useState<{ id: number; file: File }[]>([]);
  const [o, setO] = useState<RenameOptions>({ ...DEFAULT_RENAME, pattern: "{name}" });
  const [order, setOrder] = useState<"added" | "name" | "date">("added");
  const job = useJob<Blob>();
  const set = (patch: Partial<RenameOptions>) => {
    job.reset();
    setO((x) => ({ ...x, ...patch }));
  };

  const sorted = useMemo(() => {
    const list = [...files];
    if (order === "name") list.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true }));
    if (order === "date") list.sort((a, b) => a.file.lastModified - b.file.lastModified);
    return list;
  }, [files, order]);
  const results = useMemo(() => renameAll(sorted.map((f) => ({ name: f.file.name, lastModified: f.file.lastModified })), o), [sorted, o]);
  const reErr = regexError(o.find, o.regex);
  const bad = results.filter((r) => r.error).length;

  const run = () => {
    if (!sorted.length || bad || reErr) return;
    void job.run((hooks) =>
      buildZip(
        sorted.map((f, i) => ({ path: results[i].name, file: f.file, date: f.file.lastModified })),
        0,
        hooks.signal,
        hooks.onProgress,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        multiple
        onFiles={(fs) => {
          job.reset();
          setFiles((l) => [...l, ...fs.map((file) => ({ id: ++seq, file }))]);
        }}
        title={t.drop}
        compact={files.length > 0}
      />
      {files.length > 0 && (
        <>
          <Field label={t.pattern} htmlFor={`${id}-p`} hint={t.patternHint}>
            <Input id={`${id}-p`} value={o.pattern} onChange={(e) => set({ pattern: e.target.value })} size="lg" className="font-mono" spellCheck={false} autoComplete="off" />
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t.find} htmlFor={`${id}-f`} error={reErr ?? undefined} className="w-44">
              <Input id={`${id}-f`} size="sm" value={o.find} onChange={(e) => set({ find: e.target.value })} aria-invalid={!!reErr} className="font-mono" />
            </Field>
            <Field label={t.replace} htmlFor={`${id}-r`} className="w-44">
              <Input id={`${id}-r`} size="sm" value={o.replace} onChange={(e) => set({ replace: e.target.value })} className="font-mono" />
            </Field>
            <Checkbox label={t.regex} checked={o.regex} onChange={(e) => set({ regex: e.target.checked })} className="pb-1.5" />
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-fg-3 hover:text-fg">
              {t.caseLabel}, {t.spaces.toLowerCase()}, {locale === "ru" ? "транслитерация, нумерация, порядок" : "transliteration, numbering, order"}
            </summary>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <Field label={t.caseLabel} htmlFor={`${id}-c`} className="w-40">
                <Select id={`${id}-c`} size="sm" value={o.caseMode} onChange={(e) => set({ caseMode: e.target.value as CaseMode })}>
                  <option value="keep">{t.keep}</option>
                  <option value="lower">{t.lower}</option>
                  <option value="upper">{t.upper}</option>
                  <option value="title">{t.title}</option>
                </Select>
              </Field>
              <Field label={t.spaces} htmlFor={`${id}-s`} className="w-44">
                <Select id={`${id}-s`} size="sm" value={o.spaces} onChange={(e) => set({ spaces: e.target.value as SpaceMode })}>
                  <option value="keep">{t.spKeep}</option>
                  <option value="-">{t.spDash}</option>
                  <option value="_">{t.spUnder}</option>
                  <option value="remove">{t.spRemove}</option>
                </Select>
              </Field>
              <Field label={t.start} htmlFor={`${id}-n`} className="w-28">
                <Input id={`${id}-n`} size="sm" inputMode="numeric" value={String(o.start)} onChange={(e) => set({ start: Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0) })} className="tabular" />
              </Field>
              <Field label={t.sort} htmlFor={`${id}-o`} className="w-40">
                <Select id={`${id}-o`} size="sm" value={order} onChange={(e) => (setOrder(e.target.value as typeof order), job.reset())}>
                  <option value="added">{t.added}</option>
                  <option value="name">{t.byName}</option>
                  <option value="date">{t.byDate}</option>
                </Select>
              </Field>
              <Checkbox label={t.translit} checked={o.translit} onChange={(e) => set({ translit: e.target.checked })} className="pb-1.5" />
            </div>
          </details>

          <Panel>
            <PanelHeader
              title={count(locale, files.length, t.files)}
              actions={
                <Button size="sm" variant="ghost" onClick={() => (setFiles([]), job.reset())}>
                  {t.clear}
                </Button>
              }
            />
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-2 text-left text-fg-2">
                  <tr>
                    <th className="px-4 py-2 font-medium">{t.old}</th>
                    <th className="px-4 py-2 font-medium">{t.now}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sorted.map((f, i) => {
                    const r = results[i];
                    return (
                      <tr key={f.id}>
                        <td className="max-w-0 truncate px-4 py-1.5 text-fg-3" title={f.file.name}>
                          {f.file.name}
                        </td>
                        <td className={cn("max-w-0 px-4 py-1.5", r.error ? "text-err" : r.name !== f.file.name ? "font-medium text-fg" : "text-fg-2")} title={r.name}>
                          <span className="block truncate">{r.name}</span>
                          {r.error && <span className="text-[12px]">{t.errors[r.error]}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
          {bad > 0 && <Notice tone="warn">{t.fix}</Notice>}
          {job.status !== "done" && (
            <Button variant="primary" size="lg" onClick={run} disabled={job.running || bad > 0 || !!reErr} className="w-full sm:w-auto sm:self-start">
              <FileArchive aria-hidden />
              {t.run}
            </Button>
          )}
          <p className="-mt-2 text-[13px] text-fg-3">{t.note}</p>
          <JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />
          {job.status === "done" && job.result && <ResultCard blob={job.result} name="renamed.zip" locale={locale} kind="file" onReset={job.reset} resetLabel={UI[locale].edit} />}
        </>
      )}
    </div>
  );
}
