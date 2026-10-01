"use client";

import { Download, File as FileIcon, FileImage, FileText, FolderDown, FolderInput, FolderOpen } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes, formatDate } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/clipboard";
import { Button, buttonClass } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { useJob } from "@/tools/files/video/ui/hooks";
import { JobProgress } from "@/tools/files/video/ui/Progress";
import { sniffFile } from "./lib/magic";
import { ZipWorker, type ZipEntryInfo } from "./lib/zip-client";

const T = {
  ru: {
    drop: "Перетащите ZIP-архив сюда или нажмите, чтобы выбрать",
    hint: "Также открываются DOCX, XLSX, EPUB, JAR, APK — это тоже ZIP",
    change: "Другой архив",
    encoding: "Кодировка имён",
    auto: "Автоматически",
    files: ["файл", "файла", "файлов"],
    packed: "в архиве",
    all: "Распаковать всё в папку",
    allFallback: "Скачать все файлы",
    allNote: "Файлы скачаются по одному — разрешите браузеру несколько загрузок.",
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
    change: "Another archive",
    encoding: "File name encoding",
    auto: "Automatic",
    files: ["file", "files"],
    packed: "packed",
    all: "Extract all to a folder",
    allFallback: "Download all files",
    allNote: "Files download one by one — allow multiple downloads if the browser asks.",
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

  // Phones: the preview sits under the list — bring it into view when a file is picked.
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = previewRef.current;
    if (!selected || !el || window.innerWidth >= 1024) return;
    el.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }, [selected]);

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

  if (!file) return <Dropzone onFiles={(fs) => fs[0] && load(fs[0], encoding)} locale={locale} title={t.drop} hint={t.hint} />;

  const selEntry = selected ? entries.find((x) => x.path === selected.path) : undefined;
  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[0.875rem] bg-accent-container text-on-accent-container">
            <FolderOpen className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1" aria-live="polite">
            <div className="truncate font-semibold text-fg" title={file.name}>
              {file.name}
            </div>
            <div className="tabular text-sm text-fg-3">
              {entries.length > 0 ? (
                <>
                  {count(locale, entries.length, t.files)} · {formatBytes(locale, total)}
                  <span className="max-sm:hidden">
                    {" "}
                    · {formatBytes(locale, file.size)} {t.packed}
                  </span>
                </>
              ) : (
                formatBytes(locale, file.size)
              )}
            </div>
          </div>
          <label title={t.change} className={buttonClass("tonal", "sm", "cursor-pointer focus-within:outline-2 focus-within:outline-accent")}>
            <FolderInput aria-hidden />
            <span className="max-sm:sr-only">{t.change}</span>
            <input type="file" className="sr-only" onChange={(e) => (e.target.files?.[0] && load(e.target.files[0], encoding), (e.target.value = ""))} />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {entries.length > 0 && (
            <Button variant="filled" size="xl" onClick={extractAll} disabled={all.running} className="max-sm:w-full">
              <FolderDown aria-hidden />
              <span className="truncate">{canDir ? t.all : t.allFallback}</span>
            </Button>
          )}
          <Field label={t.encoding} htmlFor={`${id}-e`} className="sm:ml-auto">
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
        </div>
        {!canDir && entries.length > 0 && <p className="-mt-1 text-[0.8125rem] text-fg-3">{t.allNote}</p>}
        <JobProgress job={all} locale={locale} onCancel={all.cancel} />
      </Panel>
      {problem && <Notice tone="err">{problem}</Notice>}
      {!problem && <JobProgress job={open} locale={locale} onCancel={open.cancel} />}
      {all.status === "done" && canDir && <Notice tone="ok">{t.done}</Notice>}

      {entries.length > 0 && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <Panel className="max-h-[32rem] overflow-auto py-1.5">
            <ul>
              {entries.map((e) => {
                const on = selected?.path === e.path;
                const Icon = IMAGE.test(e.path) ? FileImage : TEXT.test(e.path) ? FileText : FileIcon;
                return (
                  <li key={e.path} className="px-1.5">
                    <button
                      type="button"
                      onClick={() => pick(e.path)}
                      aria-current={on || undefined}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 rounded-[0.75rem] px-3 py-2 text-left text-sm transition-colors",
                        on ? "bg-accent-container text-on-accent-container" : "text-fg hover:bg-surface-2 active:bg-surface-3",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", on ? "" : "text-fg-3")} aria-hidden />
                      <span className="min-w-0 flex-1 truncate" title={e.path}>
                        {e.path}
                      </span>
                      <span className={cn("tabular shrink-0", on ? "" : "text-fg-3")}>{formatBytes(locale, e.size)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel ref={previewRef} className={cn("flex min-h-40 flex-col gap-4 p-4 sm:p-5 lg:sticky lg:top-20", !selected && "max-lg:hidden")}>
            {!selected ? (
              <p className="m-auto text-center text-sm text-fg-3">{t.pick}</p>
            ) : (
              <>
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-fg" title={selected.path}>
                    {selected.path.split("/").pop()}
                  </div>
                  <div className="tabular text-sm text-fg-3">
                    {formatBytes(locale, selected.blob.size)}
                    {selEntry?.date ? ` · ${formatDate(locale, new Date(selEntry.date), { dateStyle: "medium", timeStyle: "short" })}` : ""}
                  </div>
                </div>
                <Button variant="filled" size="lg" fullWidth onClick={() => downloadBlob(selected.blob, selected.path.split("/").pop() ?? "file")}>
                  <Download aria-hidden />
                  {t.download}
                </Button>
                {IMAGE.test(selected.path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img ref={img} alt={selected.path} className="max-h-80 w-auto max-w-full self-center rounded-[0.75rem]" />
                ) : selected.text !== null ? (
                  <pre className="max-h-80 overflow-auto rounded-[1rem] bg-surface-2 p-3 font-mono text-[0.8125rem] whitespace-pre-wrap break-words text-fg">{selected.text}</pre>
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
