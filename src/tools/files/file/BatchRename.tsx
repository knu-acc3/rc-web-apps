"use client";

import { FileArchive, Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Switch } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { NumberInput } from "@/ui/number-input";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { useJob } from "@/tools/files/video/ui/hooks";
import { JobProgress } from "@/tools/files/video/ui/Progress";
import { ResultCard } from "@/tools/files/video/ui/ResultCard";
import { Setting } from "@/tools/files/video/ui/options";
import { UI } from "@/tools/files/video/ui/strings";
import { DEFAULT_RENAME, regexError, renameAll, type RenameError, type RenameOptions } from "./lib/rename";
import { buildZip } from "./lib/zip-client";

const T = {
  ru: {
    drop: "Перетащите файлы сюда или нажмите, чтобы выбрать",
    pattern: "Шаблон имени",
    patternHint: "Расширение сохраняется",
    tokens: "Вставить в шаблон",
    tokenTitles: { "{name}": "Исходное имя", "{n}": "Номер", "{n:3}": "Номер с нулями: 001", "{date}": "Дата изменения файла", "{time}": "Время изменения файла" } as Record<string, string>,
    more: "Регистр, пробелы, порядок, нумерация",
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
    spKeep: "Оставить",
    spDash: "Заменить на -",
    spUnder: "Заменить на _",
    spRemove: "Удалить",
    translit: "Транслитерация (Привет → Privet)",
    sort: "Порядок",
    added: "Как добавлены",
    byName: "По имени",
    byDate: "По дате",
    files: ["файл", "файла", "файлов"],
    old: "Было",
    now: "Станет",
    errors: { empty: "пустое имя", illegal: "недопустимые символы", reserved: "зарезервированное имя Windows", duplicate: "повторяется", long: "слишком длинное" } as Record<RenameError, string>,
    fix: "Исправьте имена с ошибками, чтобы скачать архив.",
    run: "Скачать ZIP",
    note: "Браузер не может переименовать файлы на диске — копии с новыми именами скачаются в ZIP.",
    clear: "Очистить",
  },
  en: {
    drop: "Drop files here or click to choose",
    pattern: "Name pattern",
    patternHint: "The extension is kept",
    tokens: "Insert into the pattern",
    tokenTitles: { "{name}": "Original name", "{n}": "Number", "{n:3}": "Zero-padded number: 001", "{date}": "File modification date", "{time}": "File modification time" } as Record<string, string>,
    more: "Case, spaces, order, numbering",
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
    spKeep: "Keep",
    spDash: "Replace with -",
    spUnder: "Replace with _",
    spRemove: "Remove",
    translit: "Transliterate Cyrillic (Привет → Privet)",
    sort: "Order",
    added: "As added",
    byName: "By name",
    byDate: "By date",
    files: ["file", "files"],
    old: "Before",
    now: "After",
    errors: { empty: "empty name", illegal: "illegal characters", reserved: "reserved Windows name", duplicate: "duplicate", long: "too long" } as Record<RenameError, string>,
    fix: "Fix the names with errors to download the archive.",
    run: "Download ZIP",
    note: "Browsers can't rename files on disk — copies with the new names download as a ZIP.",
    clear: "Clear",
  },
} as const;

const TOKENS = ["{name}", "{n}", "{n:3}", "{date}", "{time}"];
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

  const insert = (token: string) => set({ pattern: o.pattern + token });
  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        multiple
        locale={locale}
        onFiles={(fs) => {
          job.reset();
          setFiles((l) => [...l, ...fs.map((file) => ({ id: ++seq, file }))]);
        }}
        title={t.drop}
        compact={files.length > 0}
      />
      {files.length > 0 && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <div className="flex min-w-0 flex-col gap-4">
            <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
              <Field label={t.pattern} htmlFor={`${id}-p`} hint={t.patternHint}>
                <Input id={`${id}-p`} value={o.pattern} onChange={(e) => set({ pattern: e.target.value })} size="lg" className="font-mono" spellCheck={false} autoComplete="off" />
                <div className="flex flex-wrap gap-2" role="group" aria-label={t.tokens}>
                  {TOKENS.map((k) => (
                    <button key={k} type="button" className="chip font-mono" title={t.tokenTitles[k]} onClick={() => insert(k)}>
                      <Plus className="size-3.5" aria-hidden />
                      {k}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.find} htmlFor={`${id}-f`} error={reErr ?? undefined}>
                  <Input id={`${id}-f`} value={o.find} onChange={(e) => set({ find: e.target.value })} aria-invalid={!!reErr} className="font-mono" />
                </Field>
                <Field label={t.replace} htmlFor={`${id}-r`}>
                  <Input id={`${id}-r`} value={o.replace} onChange={(e) => set({ replace: e.target.value })} className="font-mono" />
                </Field>
              </div>
              <Switch label={t.regex} checked={o.regex} onChange={(e) => set({ regex: e.target.checked })} className="-mt-2" />
              <Fold variant="inline" title={t.more} className="text-sm">
                <div className="flex flex-col gap-5">
                  <Setting label={t.caseLabel}>
                    <Segmented
                      label={t.caseLabel}
                      size="sm"
                      value={o.caseMode}
                      onChange={(x) => set({ caseMode: x })}
                      options={[
                        { value: "keep", label: t.keep },
                        { value: "lower", label: t.lower },
                        { value: "upper", label: t.upper },
                        { value: "title", label: t.title },
                      ]}
                    />
                  </Setting>
                  <Setting label={t.spaces}>
                    <Segmented
                      label={t.spaces}
                      size="sm"
                      value={o.spaces}
                      onChange={(x) => set({ spaces: x })}
                      options={[
                        { value: "keep", label: t.spKeep },
                        { value: "-", label: "→ -", title: t.spDash },
                        { value: "_", label: "→ _", title: t.spUnder },
                        { value: "remove", label: t.spRemove },
                      ]}
                    />
                  </Setting>
                  <Setting label={t.sort}>
                    <Segmented
                      label={t.sort}
                      size="sm"
                      value={order}
                      onChange={(x) => (setOrder(x), job.reset())}
                      options={[
                        { value: "added", label: t.added },
                        { value: "name", label: t.byName },
                        { value: "date", label: t.byDate },
                      ]}
                    />
                  </Setting>
                  <Field label={t.start} htmlFor={`${id}-n`}>
                    <NumberInput id={`${id}-n`} locale={locale} value={o.start} min={0} max={999999} onChange={(v) => set({ start: Math.max(0, Math.round(v ?? 0)) })} className="max-w-48" />
                  </Field>
                  <Switch label={t.translit} checked={o.translit} onChange={(e) => set({ translit: e.target.checked })} />
                </div>
              </Fold>
              {bad > 0 && <Notice tone="warn">{t.fix}</Notice>}
              {job.status !== "done" && !job.running && (
                <Button variant="filled" size="xl" fullWidth onClick={run} disabled={bad > 0 || !!reErr}>
                  <FileArchive aria-hidden />
                  <span className="truncate">{t.run}</span>
                </Button>
              )}
              <p className="-mt-2 text-[0.8125rem] text-fg-3">{t.note}</p>
              <JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />
            </Panel>
            {job.status === "done" && job.result && <ResultCard blob={job.result} name="renamed.zip" locale={locale} kind="file" onReset={job.reset} resetLabel={UI[locale].edit} />}
          </div>

          <Panel className="min-w-0 overflow-hidden">
            <PanelHeader
              title={count(locale, files.length, t.files)}
              actions={
                <Button size="sm" variant="text" onClick={() => (setFiles([]), job.reset())}>
                  {t.clear}
                </Button>
              }
            />
            <div className="max-h-[32rem] overflow-auto">
              <table className="w-full table-fixed text-sm">
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
                        <td className="truncate px-4 py-2 text-fg-3" title={f.file.name}>
                          {f.file.name}
                        </td>
                        <td className={cn("px-4 py-2", r.error ? "text-err" : r.name !== f.file.name ? "font-semibold text-fg" : "text-fg-2")} title={r.name}>
                          <span className="block truncate">{r.name}</span>
                          {r.error && <span className="text-[0.75rem]">{t.errors[r.error]}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
