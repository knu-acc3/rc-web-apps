"use client";

import { Download, FileText, FolderDown, FolderOpen } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes, formatDate } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Select } from "@/ui/field";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { useJob } from "@/sections/video/ui/hooks";
import { JobProgress } from "@/sections/video/ui/Progress";
import { sniffFile } from "./lib/magic";
import { ZipWorker, type ZipEntryInfo } from "./lib/zip-client";

const T = {
  ru: {
    drop: "Перетащите ZIP-архив сюда или нажмите, чтобы выбрать",
    hint: "Также открываются DOCX, XLSX, EPUB, JAR, APK — это тоже ZIP",
    change: "Открыть другой архив",
    encoding: "Кодировка имён",
    auto: "Автоматически",
    files: ["файл", "файла", "файлов"],
    packed: "в архиве",
    all: "Распаковать всё в папку",
    allFallback: "Скачать все файлы",
    allNote: "Этот браузер не умеет сохранять в папку: файлы скачаются по одному (браузер может спросить разрешение на несколько загрузок).",
    pick: "Выберите файл в списке, чтобы посмотреть и скачать его",
    download: "Скачать",
    preview: "Просмотр",
    noPreview: "Предпросмотр недоступен для этого типа файла.",
    rar: "Это архив {f}. Он не поддерживается: в браузере можно распаковать только ZIP.",
    notZip: "Это не ZIP-архив.",
    encrypted: "Архив защищён паролем. Зашифрованные ZIP-архивы не поддерживаются.",
    corrupt: "Архив повреждён или недокачан.",
    tooBig: "Файл в архиве больше 2 ГБ — браузер не сможет распаковать его в память. Распакуйте архив программой на компьютере.",
    done: "Готово: файлы сохранены в выбранную папку.",
  },
  en: {
    drop: "Drop a ZIP archive here or click to choose",
    hint: "DOCX, XLSX, EPUB, JAR and APK open too — they are ZIP files",
    change: "Open another archive",
    encoding: "File name encoding",
    auto: "Automatic",
    files: ["file", "files"],
    packed: "packed",
    all: "Extract all to a folder",
    allFallback: "Download all files",
    allNote: "This browser can't save into a folder: files will be downloaded one by one (the browser may ask to allow multiple downloads).",
    pick: "Choose a file in the list to preview and download it",
    download: "Download",
    preview: "Preview",
    noPreview: "No preview for this file type.",
    rar: "This is a {f} archive. It isn't supported: only ZIP can be extracted in the browser.",
    notZip: "This is not a ZIP archive.",
    encrypted: "The archive is password-protected. Encrypted ZIP archives are not supported.",
    corrupt: "The archive is damaged or incomplete.",
    tooBig: "This file in the archive is over 2 GB — a browser can't unpack it into memory. Use an archiver on your computer.",
    done: "Done: files saved to the chosen folder.",
  },
} as const;

type DirHandle = { getDirectoryHandle(n: string, o: { create: boolean }): Promise<DirHandle>; getFileHandle(n: string, o: { create: boolean }): Promise<{ createWritable(): Promise<{ write(b: Blob): Promise<void>; close(): Promise<void> }> }> };
const noop = () => () => {};
const TEXT = /\.(txt|md|csv|tsv|json|xml|html?|css|js|ts|ini|cfg|conf|log|yml|yaml|toml|srt|vtt|sql|py|java|c|cpp|h|sh|bat|ps1|svg)$/i;
const IMAGE = /\.(png|jpe?g|gif|webp|avif|bmp|ico|svg)$/i;

export default function Unzip({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const canDir = useSyncExternalStore(noop, () => "showDirectoryPicker" in window, () => false);
  const [file, setFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState("auto");
  const [problem, setProblem] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ path: string; blob: Blob; text: string | null } | null>(null);
  const open = useJob<ZipEntryInfo[]>();
  const all = useJob<number>();
  const worker = useRef<ZipWorker | null>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  async function load(f: File, enc: string) {
    setFile(f);
    setSelected(null);
    setProblem(null);
    all.reset();
    worker.current?.terminate();
    worker.current = null;
    const det = await sniffFile(f).catch(() => null);
    if (det && det.kind === "archive" && det.ext !== "zip") {
      setProblem(t.rar.replace("{f}", det.name));
      open.reset();
      return;
    }
    if (det && det.ext !== "zip" && !["docx", "xlsx", "pptx", "odt", "ods", "odp", "epub", "jar", "apk"].includes(det.ext)) {
      setProblem(t.notZip);
      open.reset();
      return;
    }
    const w = new ZipWorker();
    worker.current = w;
    await open.run(async (hooks) => {
      hooks.signal.addEventListener("abort", () => w.terminate(), { once: true });
      try {
        const list = await w.open(f, enc);
        return list.filter((e) => !e.dir).sort((a, b) => a.path.localeCompare(b.path));
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === "ENCRYPTED") setProblem(t.encrypted);
        else if (msg === "CORRUPT") setProblem(t.corrupt);
        throw e;
      }
    });
  }

  async function pick(path: string) {
    const w = worker.current;
    if (!w) return;
    let blob: Blob;
    try {
      blob = await w.extract(path);
    } catch (e) {
      const msg = (e as Error).message;
      setProblem(msg === "TOO_BIG" ? t.tooBig : msg === "ENCRYPTED" ? t.encrypted : t.corrupt);
      return;
    }
    let text: string | null = null;
    if (TEXT.test(path) && !/\.svg$/i.test(path)) text = new TextDecoder().decode(await blob.slice(0, 64 * 1024).arrayBuffer());
    setSelected({ path, blob, text });
  }

  // Image preview object URL
  useEffect(() => {
    if (!selected || !IMAGE.test(selected.path) || !img.current) return;
    const url = URL.createObjectURL(selected.blob);
    img.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [selected]);

  const entries = open.status === "done" ? (open.result ?? []) : [];
  const total = entries.reduce((s, e) => s + e.size, 0);

  async function extractAll() {
    const w = worker.current;
    if (!w || !entries.length) return;
    let dir: DirHandle | null = null;
    if (canDir) {
      try {
        dir = (await (window as unknown as { showDirectoryPicker(o: { mode: string }): Promise<DirHandle> }).showDirectoryPicker({ mode: "readwrite" })) as DirHandle;
      } catch {
        return; // user cancelled the picker
      }
    }
    await all.run(async (hooks) => {
      let i = 0;
      for (const e of entries) {
        if (hooks.signal.aborted) throw new DOMException("Cancelled", "AbortError");
        const blob = await w.extract(e.path);
        const parts = e.path.split("/").filter((p) => p && p !== "." && p !== "..");
        const name = parts.pop() ?? "file";
        if (dir) {
          let d = dir;
          for (const p of parts) d = await d.getDirectoryHandle(p, { create: true });
          const fh = await d.getFileHandle(name, { create: true });
          const ws = await fh.createWritable();
          await ws.write(blob);
          await ws.close();
        } else {
          downloadBlob(blob, name);
          await new Promise((r) => setTimeout(r, 350));
        }
        hooks.onProgress?.(++i / entries.length);
      }
      return i;
    });
  }

  if (!file)
    return <Dropzone onFiles={(fs) => fs[0] && load(fs[0], encoding)} title={t.drop} hint={t.hint} />;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title={
            <span className="flex items-center gap-2">
              <FolderOpen className="size-4 text-accent" aria-hidden />
              <span className="truncate">{file.name}</span>
            </span>
          }
          actions={
            <label className="cursor-pointer">
              <span className="text-sm text-accent hover:underline">{t.change}</span>
              <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && load(e.target.files[0], encoding)} />
            </label>
          }
        />
        {entries.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-3 text-sm text-fg-2" aria-live="polite">
            <span className="text-lg font-semibold text-fg">{count(locale, entries.length, t.files)}</span>
            <span className="tabular">
              {formatBytes(locale, total)} · {formatBytes(locale, file.size)} {t.packed}
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3 px-4 py-3">
          <Field label={t.encoding} htmlFor={`${id}-e`} className="w-52">
            <Select
              id={`${id}-e`}
              size="sm"
              value={encoding}
              onChange={(e) => {
                setEncoding(e.target.value);
                void load(file, e.target.value);
              }}
            >
              <option value="auto">{t.auto}</option>
              <option value="utf-8">UTF-8</option>
              <option value="ibm866">CP866 (DOS)</option>
              <option value="windows-1251">Windows-1251</option>
            </Select>
          </Field>
          {entries.length > 0 && (
            <Button variant="primary" onClick={extractAll} disabled={all.running}>
              <FolderDown aria-hidden />
              {canDir ? t.all : t.allFallback}
            </Button>
          )}
        </div>
      </Panel>
      {problem && <Notice tone="err">{problem}</Notice>}
      {!problem && <JobProgress job={open} locale={locale} onCancel={open.cancel} />}
      <JobProgress job={all} locale={locale} onCancel={all.cancel} />
      {all.status === "done" && canDir && <Notice tone="ok">{t.done}</Notice>}
      {!canDir && entries.length > 0 && <p className="-mt-2 text-[0.8125rem] text-fg-3">{t.allNote}</p>}

      {entries.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel className="max-h-[28rem] overflow-auto">
            <ul className="divide-y divide-line">
              {entries.map((e) => (
                <li key={e.path}>
                  <button
                    type="button"
                    onClick={() => pick(e.path)}
                    className={cn("flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-surface-2", selected?.path === e.path && "bg-accent-soft")}
                  >
                    <FileText className="size-4 shrink-0 text-fg-3" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-fg" title={e.path}>
                      {e.path}
                    </span>
                    <span className="tabular shrink-0 text-fg-3">{formatBytes(locale, e.size)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="flex min-h-40 flex-col gap-3 p-4">
            {!selected ? (
              <p className="m-auto text-center text-sm text-fg-3">{t.pick}</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-fg" title={selected.path}>
                      {selected.path.split("/").pop()}
                    </div>
                    <div className="text-sm text-fg-3">
                      {formatBytes(locale, selected.blob.size)}
                      {entries.find((x) => x.path === selected.path)?.date ? ` · ${formatDate(locale, new Date(entries.find((x) => x.path === selected.path)!.date), { dateStyle: "medium", timeStyle: "short" })}` : ""}
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => downloadBlob(selected.blob, selected.path.split("/").pop() ?? "file")}>
                    <Download aria-hidden />
                    {t.download}
                  </Button>
                </div>
                {IMAGE.test(selected.path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img ref={img} alt={selected.path} className="max-h-80 w-auto max-w-full self-center rounded-[0.5rem]" />
                ) : selected.text !== null ? (
                  <pre className="max-h-80 overflow-auto rounded-[0.5rem] bg-surface-2 p-3 font-mono text-[0.8125rem] whitespace-pre-wrap break-words text-fg">{selected.text}</pre>
                ) : (
                  <p className="text-sm text-fg-3">{t.noPreview}</p>
                )}
              </>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
