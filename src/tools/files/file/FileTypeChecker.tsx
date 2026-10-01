"use client";

import { AlertTriangle, CheckCircle2, Hash, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatDate, formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Badge, Panel } from "@/ui/panel";
import { probeMedia } from "@/tools/files/shared/client";
import { formatTime } from "@/tools/files/shared/time";
import { useJob } from "@/tools/files/video/ui/hooks";
import { JobProgress } from "@/tools/files/video/ui/Progress";
import { extensionMatches, extOf, sniffFile, type Detected } from "./lib/magic";

const T = {
  ru: {
    drop: "Перетащите файлы сюда или нажмите, чтобы выбрать",
    hint: "Файл читается локально: для определения типа хватает первых килобайт",
    unknown: "Неизвестный формат",
    unknownHint: "Сигнатура не распознана. Это могут быть зашифрованные или сырые данные либо редкий формат.",
    kinds: { image: "изображение", audio: "аудио", video: "видео", archive: "архив", document: "документ", font: "шрифт", executable: "программа", text: "текст", data: "данные" } as Record<string, string>,
    ext: "Расширение",
    none: "нет",
    mismatch: "Расширение не соответствует содержимому — настоящий формат: .{e}",
    match: "Расширение соответствует содержимому",
    mime: "MIME по данным браузера",
    mimeReal: "MIME по содержимому",
    size: "Размер",
    bytes: "байт",
    modified: "Изменён",
    created: "Дату создания браузер не сообщает — только дату изменения.",
    dims: "Размер изображения",
    animated: "Анимация",
    yes: "да",
    no: "нет",
    duration: "Длительность",
    detail: "Подробности",
    hex: "Первые байты (hex)",
    hash: "Посчитать MD5, SHA-1 и SHA-256",
    remove: "Убрать",
    conf: { high: "точно", medium: "вероятно", low: "предположительно" } as Record<string, string>,
  },
  en: {
    drop: "Drop files here or click to choose",
    hint: "Files are read locally: the first kilobytes are enough to detect the type",
    unknown: "Unknown format",
    unknownHint: "The signature wasn't recognised. It may be encrypted or raw data, or a rare format.",
    kinds: { image: "image", audio: "audio", video: "video", archive: "archive", document: "document", font: "font", executable: "program", text: "text", data: "data" } as Record<string, string>,
    ext: "Extension",
    none: "none",
    mismatch: "The extension doesn't match the content — the real format is .{e}",
    match: "The extension matches the content",
    mime: "MIME reported by the browser",
    mimeReal: "MIME by content",
    size: "Size",
    bytes: "bytes",
    modified: "Modified",
    created: "Browsers don't expose the creation date — only the modification date.",
    dims: "Image size",
    animated: "Animated",
    yes: "yes",
    no: "no",
    duration: "Duration",
    detail: "Details",
    hex: "First bytes (hex)",
    hash: "Calculate MD5, SHA-1 and SHA-256",
    remove: "Remove",
    conf: { high: "certain", medium: "likely", low: "possibly" } as Record<string, string>,
  },
} as const;

interface Info {
  detected: Detected | null;
  hex: string;
  dims?: { w: number; h: number };
  duration?: number | null;
}

async function inspect(file: File, signal: AbortSignal): Promise<Info> {
  const [detected, head] = await Promise.all([sniffFile(file), file.slice(0, 128).arrayBuffer()]);
  const bytes = new Uint8Array(head);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join(" ")
    .replace(/((?:\S\S ){16})/g, "$1\n")
    .trim();
  const info: Info = { detected, hex };
  if (detected?.kind === "image" && typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      info.dims = { w: bmp.width, h: bmp.height };
      bmp.close();
    } catch {
      /* format not decodable by the browser */
    }
  }
  if (detected?.kind === "audio" || detected?.kind === "video") {
    const m = await probeMedia(file, signal).catch(() => null);
    info.duration = m?.duration ?? null;
    if (m?.video) info.dims = { w: m.video.width, h: m.video.height };
  }
  return info;
}

function Card({ file, locale, onRemove }: { file: File; locale: Locale; onRemove: () => void }) {
  const t = T[locale];
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    const c = new AbortController();
    inspect(file, c.signal)
      .then((i) => !c.signal.aborted && setInfo(i))
      .catch(() => undefined);
    return () => c.abort();
  }, [file]);
  const d = info?.detected ?? null;
  const ext = extOf(file.name);
  const ok = d ? extensionMatches(file.name, d) : true;
  const rows: [string, string][] = [];
  rows.push([t.size, `${formatBytes(locale, file.size)} (${formatNumber(locale, file.size)} ${t.bytes})`]);
  rows.push([t.ext, ext ? `.${ext}` : t.none]);
  if (d) rows.push([t.mimeReal, d.mime]);
  rows.push([t.mime, file.type || "—"]);
  if (info?.dims) rows.push([t.dims, `${info.dims.w} × ${info.dims.h}`]);
  if (d?.animated !== undefined) rows.push([t.animated, d.animated ? t.yes : t.no]);
  if (info?.duration) rows.push([t.duration, formatTime(info.duration, 1)]);
  if (d?.detail) rows.push([t.detail, d.detail]);
  rows.push([t.modified, formatDate(locale, new Date(file.lastModified), { dateStyle: "long", timeStyle: "medium" })]);

  return (
    <Panel className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-fg-3" title={file.name}>
            {file.name}
          </div>
          <div className="text-2xl font-semibold text-fg" aria-live="polite">
            {!info ? "…" : d ? d.name : t.unknown}
          </div>
          {d && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge tone="accent">{t.kinds[d.kind]}</Badge>
              {d.ext && <Badge>.{d.ext}</Badge>}
              <Badge>{t.conf[d.confidence]}</Badge>
            </div>
          )}
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onRemove} aria-label={`${t.remove}: ${file.name}`} title={t.remove}>
          <X aria-hidden />
        </Button>
      </div>
      {info && !d && <p className="text-sm text-fg-2">{t.unknownHint}</p>}
      {d && d.ext && (
        <p className={`flex items-center gap-1.5 text-sm ${ok ? "text-ok" : "text-warn"}`}>
          {ok ? <CheckCircle2 className="size-4" aria-hidden /> : <AlertTriangle className="size-4" aria-hidden />}
          {ok ? t.match : t.mismatch.replace("{e}", d.ext)}
        </p>
      )}
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-fg-3">{k}</dt>
            <dd className="min-w-0 break-words text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[0.8125rem] text-fg-3">{t.created}</p>
      {info && (
        <details className="text-sm">
          <summary className="cursor-pointer text-fg-3 hover:text-fg">{t.hex}</summary>
          <div className="mt-2 flex items-start gap-2">
            <pre className="min-w-0 flex-1 overflow-x-auto rounded-[0.5rem] bg-surface-2 p-3 font-mono text-[0.75rem] leading-relaxed text-fg">{info.hex}</pre>
            <CopyButton value={info.hex} showLabel={false} size="icon-sm" variant="ghost" label={locale === "ru" ? "Копировать" : "Copy"} copiedLabel={locale === "ru" ? "Скопировано" : "Copied"} />
          </div>
        </details>
      )}
      <Hashes file={file} locale={locale} />
    </Panel>
  );
}

function Hashes({ file, locale }: { file: File; locale: Locale }) {
  const t = T[locale];
  const job = useJob<{ md5: string; sha1: string; sha256: string }>();
  const run = () =>
    void job.run(
      (hooks) =>
        new Promise((resolve, reject) => {
          const w = new Worker(new URL("./lib/hash.worker.ts", import.meta.url), { type: "module" });
          const end = () => w.terminate();
          hooks.signal.addEventListener("abort", () => (end(), reject(new DOMException("Cancelled", "AbortError"))), { once: true });
          w.onmessage = (e: MessageEvent<{ progress?: number; done?: { md5: string; sha1: string; sha256: string }; error?: string }>) => {
            if (e.data.progress !== undefined) hooks.onProgress?.(e.data.progress);
            else {
              end();
              if (e.data.done) resolve(e.data.done);
              else reject(new Error(e.data.error));
            }
          };
          w.postMessage({ file });
        }),
    );
  if (job.status === "done" && job.result) {
    const r = job.result;
    return (
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
        {(
          [
            ["MD5", r.md5],
            ["SHA-1", r.sha1],
            ["SHA-256", r.sha256],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-fg-3">{k}</dt>
            <dd className="flex min-w-0 items-center gap-1">
              <code className="min-w-0 break-all font-mono text-[0.8125rem] text-fg">{v}</code>
              <CopyButton value={v} showLabel={false} size="icon-sm" variant="ghost" label={locale === "ru" ? "Копировать" : "Copy"} copiedLabel={locale === "ru" ? "Скопировано" : "Copied"} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {!job.running && (
        <Button variant="ghost" size="sm" className="self-start text-accent" onClick={run}>
          <Hash aria-hidden />
          {t.hash}
        </Button>
      )}
      <JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />
    </div>
  );
}

let seq = 0;

export default function FileTypeChecker({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [files, setFiles] = useState<{ id: number; file: File }[]>([]);
  return (
    <div className="flex flex-col gap-4">
      <Dropzone multiple onFiles={(fs) => setFiles((l) => [...fs.map((file) => ({ id: ++seq, file })), ...l])} title={t.drop} hint={t.hint} compact={files.length > 0} />
      {files.map((f) => (
        <Card key={f.id} file={f.file} locale={locale} onRemove={() => setFiles((l) => l.filter((x) => x.id !== f.id))} />
      ))}
    </div>
  );
}
