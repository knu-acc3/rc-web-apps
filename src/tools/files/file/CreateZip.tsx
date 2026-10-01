"use client";

import { FileArchive, FolderPlus, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes } from "@/i18n/format";
import { Button, IconButton } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { useJob } from "@/tools/files/video/ui/hooks";
import { JobProgress } from "@/tools/files/video/ui/Progress";
import { ResultCard } from "@/tools/files/video/ui/ResultCard";
import { Setting } from "@/tools/files/video/ui/options";
import { UI } from "@/tools/files/video/ui/strings";
import { buildZip } from "./lib/zip-client";

const T = {
  ru: {
    drop: "Перетащите файлы или папки сюда или нажмите, чтобы выбрать",
    folder: "Добавить папку",
    files: ["файл", "файла", "файлов"],
    clear: "Очистить",
    name: "Имя архива",
    level: "Сжатие",
    store: "Без сжатия",
    fast: "Быстрое",
    normal: "Обычное",
    max: "Максимальное",
    run: "Создать ZIP",
    big: "Всего больше 1 ГБ: архив собирается в памяти браузера, на слабых устройствах её может не хватить.",
    hint: "Для фото, видео и архивов хватит «Без сжатия» — так быстрее всего",
    remove: "Убрать",
  },
  en: {
    drop: "Drop files or folders here or click to choose",
    folder: "Add folder",
    files: ["file", "files"],
    clear: "Clear",
    name: "Archive name",
    level: "Compression",
    store: "None",
    fast: "Fast",
    normal: "Normal",
    max: "Maximum",
    run: "Create ZIP",
    big: "Over 1 GB in total: the archive is built in browser memory, which low-memory devices may not have.",
    hint: "Photos, videos and archives are already compressed — “None” is fastest",
    remove: "Remove",
  },
} as const;

interface Entry {
  path: string;
  file: File;
}

type FsEntry = { isFile: boolean; isDirectory: boolean; name: string; fullPath: string };
type FsFile = FsEntry & { file(cb: (f: File) => void, err: (e: unknown) => void): void };
type FsDir = FsEntry & { createReader(): { readEntries(cb: (e: FsEntry[]) => void, err: (e: unknown) => void): void } };

async function walk(entry: FsEntry, prefix: string, out: Entry[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) => (entry as FsFile).file(res, rej));
    out.push({ path: prefix + entry.name, file });
    return;
  }
  if (!entry.isDirectory) return;
  const reader = (entry as FsDir).createReader();
  // readEntries returns results in batches until an empty batch.
  for (;;) {
    const batch = await new Promise<FsEntry[]>((res, rej) => reader.readEntries(res, rej));
    if (!batch.length) break;
    for (const e of batch) await walk(e, `${prefix}${entry.name}/`, out);
  }
}

const LEVELS = { store: 0, fast: 1, normal: 6, max: 9 } as const;

export default function CreateZip({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("archive");
  const [level, setLevel] = useState<keyof typeof LEVELS>("normal");
  const job = useJob<Blob>();
  const folderInput = useRef<HTMLInputElement>(null);
  const droppedDirs = useRef(new Set<string>());

  const add = (list: Entry[]) => {
    job.reset();
    setEntries((prev) => {
      const seen = new Set(prev.map((e) => e.path));
      return [...prev, ...list.filter((e) => !seen.has(e.path) && (seen.add(e.path), true))];
    });
  };

  // Folders dropped onto the page: read them through the (non-standard but universal) entries API.
  const onDropCapture = (e: DragEvent) => {
    const items = Array.from(e.dataTransfer?.items ?? []);
    const dirs = items.map((i) => (i.webkitGetAsEntry?.() ?? null) as FsEntry | null).filter((x): x is FsEntry => !!x && x.isDirectory);
    if (!dirs.length) return;
    dirs.forEach((d) => droppedDirs.current.add(d.name));
    void (async () => {
      const out: Entry[] = [];
      for (const d of dirs) await walk(d, "", out);
      add(out);
    })();
  };

  const total = entries.reduce((s, e) => s + e.file.size, 0);
  const run = () => {
    if (!entries.length) return;
    void job.run((hooks) =>
      buildZip(
        entries.map((e) => ({ path: e.path, file: e.file, date: e.file.lastModified })),
        LEVELS[level],
        hooks.signal,
        hooks.onProgress,
      ),
    );
  };
  const zipName = `${(name.trim() || "archive").replace(/\.zip$/i, "")}.zip`;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
      <div className="flex min-w-0 flex-col gap-3">
        <div onDropCapture={onDropCapture}>
          <Dropzone
            multiple
            locale={locale}
            onFiles={(fs) => {
              const dirs = droppedDirs.current;
              add(fs.filter((f) => !(dirs.has(f.name) && (f.size === 0 || !f.type) && dirs.delete(f.name))).map((file) => ({ path: file.webkitRelativePath || file.name, file })));
            }}
            title={t.drop}
            compact={entries.length > 0}
          />
        </div>
        <Button variant="tonal" size="sm" onClick={() => folderInput.current?.click()} className="self-start">
          <FolderPlus aria-hidden />
          {t.folder}
        </Button>
        <input
          ref={folderInput}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          multiple
          {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          onChange={(e) => {
            add(Array.from(e.target.files ?? []).map((file) => ({ path: file.webkitRelativePath || file.name, file })));
            e.target.value = "";
          }}
        />
        {entries.length > 0 && (
          <Panel>
            <ul className="max-h-80 divide-y divide-line overflow-auto">
              {entries.map((e) => (
                <li key={e.path} className="flex items-center gap-3 py-1.5 pl-4 pr-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-fg" title={e.path}>
                    {e.path}
                  </span>
                  <span className="tabular shrink-0 text-fg-3">{formatBytes(locale, e.file.size)}</span>
                  <IconButton size="sm" label={`${t.remove}: ${e.path}`} title={t.remove} icon={<X aria-hidden />} onClick={() => (setEntries((l) => l.filter((x) => x !== e)), job.reset())} disabled={job.running} />
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="text-2xl font-bold tracking-tight text-fg">{count(locale, entries.length, t.files)}</span>
            <span className="flex items-center gap-1">
              {entries.length > 0 && <span className="tabular text-fg-2">{formatBytes(locale, total)}</span>}
              {entries.length > 0 && (
                <Button size="sm" variant="text" onClick={() => (setEntries([]), job.reset())} disabled={job.running}>
                  {t.clear}
                </Button>
              )}
            </span>
          </div>
          <Field label={t.name} htmlFor={`${id}-n`}>
            <Input id={`${id}-n`} value={name} onChange={(e) => (setName(e.target.value), job.reset())} />
          </Field>
          <Setting label={t.level}>
            <Segmented
              label={t.level}
              value={level}
              onChange={(x) => (setLevel(x), job.reset())}
              options={[
                { value: "store", label: t.store },
                { value: "fast", label: t.fast },
                { value: "normal", label: t.normal },
                { value: "max", label: t.max },
              ]}
            />
            <p className="text-[0.8125rem] text-fg-3">{t.hint}</p>
          </Setting>
          {total > 1024 ** 3 && <Notice tone="warn">{t.big}</Notice>}
          {job.status !== "done" && !job.running && (
            <Button variant="filled" size="xl" fullWidth onClick={run} disabled={!entries.length}>
              <FileArchive aria-hidden />
              {t.run}
            </Button>
          )}
          <JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />
        </Panel>
        {job.status === "done" && job.result && <ResultCard blob={job.result} name={zipName} locale={locale} kind="file" inputSize={total} onReset={job.reset} resetLabel={UI[locale].edit} />}
      </div>
    </div>
  );
}
