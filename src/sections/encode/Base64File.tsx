"use client";

import { Download, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { copyText, downloadBlob } from "@/lib/clipboard";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useWorkerClient } from "@/sections/code/kit/hooks";
import { isCancelled } from "@/sections/code/kit/worker-client";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Switch } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { extFor } from "./b64file";

const T = {
  ru: {
    drop: "Перетащите изображение или любой файл",
    dropHint: "Файл кодируется частями в браузере и никуда не загружается",
    dataUri: "Data URI (data:…;base64,)",
    urlSafe: "URL-safe",
    result: "Base64",
    input: "Base64 или data URI",
    placeholder: "data:image/png;base64,iVBORw0KGgo… или просто iVBORw0KGgo…",
    working: "Обработка…",
    cancel: "Отменить",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    downloadTxt: "Скачать .txt",
    big: "Результат большой, поэтому показано только начало — скопируйте или скачайте его целиком.",
    file: "Файл",
    preview: "Предпросмотр",
    error: "Это не Base64",
    css: "Для CSS",
    img: "Для <img>",
  },
  en: {
    drop: "Drop an image or any file",
    dropHint: "The file is encoded in chunks in your browser and never uploaded",
    dataUri: "Data URI (data:…;base64,)",
    urlSafe: "URL-safe",
    result: "Base64",
    input: "Base64 or data URI",
    placeholder: "data:image/png;base64,iVBORw0KGgo… or just iVBORw0KGgo…",
    working: "Processing…",
    cancel: "Cancel",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    downloadTxt: "Download .txt",
    big: "The result is large, so only the beginning is shown — copy or download the whole thing.",
    file: "File",
    preview: "Preview",
    error: "This is not Base64",
    css: "For CSS",
    img: "For <img>",
  },
} as const;

const PREVIEW_MAX = 256 * 1024;
const PREVIEWABLE = /^(image\/(png|jpeg|gif|webp|avif|svg\+xml|x-icon|bmp)|audio\/|video\/)/;
const newWorker = () => new Worker(new URL("./encode.worker.ts", import.meta.url), { type: "module" });

function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    const timer = setTimeout(() => setUrl(u), 0);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(u);
      setUrl(null);
    };
  }, [blob]);
  return url;
}

export default function Base64File({ locale, mode }: { locale: Locale; mode: "encode" | "decode" }) {
  return mode === "encode" ? <Encoder locale={locale} /> : <Decoder locale={locale} />;
}

function Encoder({ locale }: { locale: Locale }) {
  const t = T[locale];
  const client = useWorkerClient(newWorker);
  const [file, setFile] = useState<File | null>(null);
  const [dataUri, setDataUri] = useState(true);
  const [urlSafe, setUrlSafe] = useState(false);
  const [out, setOut] = useState<{ blob: Blob; head: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const preview = useObjectUrl(file && PREVIEWABLE.test(file.type) ? file : null);

  async function run(f: File, uri = dataUri, safe = urlSafe) {
    setFile(f);
    setOut(null);
    setProgress(0);
    try {
      const blob = await client.run<Blob>("fileToBase64", { file: f, dataUri: uri, urlSafe: safe }, { onProgress: (v) => setProgress(v) });
      setOut({ blob, head: await blob.slice(0, PREVIEW_MAX).text() });
    } catch (e) {
      if (!isCancelled(e)) throw e;
    } finally {
      setProgress(null);
    }
  }

  const copy = async (what: string) => {
    if (!out) return;
    const full = await out.blob.text();
    const text = what === "css" ? `url("${full}")` : what === "img" ? `<img src="${full}" alt="">` : full;
    if (await copyText(text)) setCopied(what);
  };

  return (
    <Panel className="p-4 sm:p-6">
      <Dropzone onFiles={(f) => run(f[0])} title={t.drop} hint={t.dropHint} compact={!!file} />
      {file && (
        <div className="mt-4 flex items-center gap-3">
          {preview && file.type.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={file.name} className="size-16 shrink-0 rounded-[8px] border border-line object-contain" />
          )}
          <div className="min-w-0 text-sm">
            <div className="truncate font-medium text-fg">{file.name}</div>
            <div className="text-fg-3">
              {file.type || "application/octet-stream"} · {formatBytes(locale, file.size)}
              {out && ` → ${formatBytes(locale, out.blob.size)}`}
            </div>
          </div>
        </div>
      )}
      {progress !== null && (
        <div className="mt-4 flex items-center gap-2">
          <progress className="h-1.5 w-full accent-[var(--accent)]" max={1} value={progress} aria-label={t.working} />
          <Button size="sm" variant="ghost" onClick={() => client.cancel()}>
            <X aria-hidden />
            {t.cancel}
          </Button>
        </div>
      )}
      {out && (
        <div className="mt-4 rounded-[10px] bg-surface-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-fg-2">{t.result}</span>
            <div className="flex flex-wrap items-center gap-1">
              {dataUri && file?.type.startsWith("image/") && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => copy("img")}>
                    {copied === "img" ? t.copied : t.img}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copy("css")}>
                    {copied === "css" ? t.copied : t.css}
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => downloadBlob(out.blob, `${file?.name ?? "file"}.base64.txt`)}>
                <Download aria-hidden />
                <span className="hidden sm:inline">{t.downloadTxt}</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => copy("raw")}>
                {copied === "raw" ? t.copied : t.copy}
              </Button>
            </div>
          </div>
          <pre className="mt-2 max-h-48 overflow-auto font-mono text-[13px] break-all whitespace-pre-wrap text-fg">{out.head}</pre>
          {out.blob.size > PREVIEW_MAX && <p className="mt-2 text-[13px] text-fg-3">{t.big}</p>}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2">
        <Switch
          label={t.dataUri}
          checked={dataUri}
          onChange={(e) => {
            setDataUri(e.target.checked);
            if (file) void run(file, e.target.checked, urlSafe);
          }}
        />
        <Switch
          label={t.urlSafe}
          checked={urlSafe}
          onChange={(e) => {
            setUrlSafe(e.target.checked);
            if (file) void run(file, dataUri, e.target.checked);
          }}
        />
      </div>
    </Panel>
  );
}

function Decoder({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const client = useWorkerClient(newWorker);
  const [text, setText] = useState("");
  const [res, setRes] = useState<{ blob: Blob; mime?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useObjectUrl(res && res.mime && PREVIEWABLE.test(res.mime) ? res.blob : null);

  useEffect(() => {
    if (!text.trim()) return;
    let alive = true;
    const timer = setTimeout(() => {
      setBusy(true);
      client
        .run<{ blob: Blob; mime?: string }>("base64ToFile", { text })
        .then(
          (r) => {
            if (!alive) return;
            setRes(r);
            setError(null);
          },
          (e) => {
            if (!alive || isCancelled(e)) return;
            setRes(null);
            setError(t.error);
          },
        )
        .finally(() => alive && setBusy(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [text, client, t.error]);

  const shownRes = text.trim() ? res : null;
  const shownError = text.trim() ? error : null;

  return (
    <Panel className="p-4 sm:p-6">
      <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={text} onChange={setText} placeholder={t.placeholder} rows={5} wrap fileAccept=".txt,text/plain" />
      {shownError && (
        <Notice tone="err" className="mt-3">
          {shownError}
        </Notice>
      )}
      {shownRes && (
        <div className={`mt-4 rounded-[10px] bg-surface-2 p-4 ${busy ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-fg-2">
              <span className="font-medium">{t.file}:</span> {shownRes.mime} · {formatBytes(locale, shownRes.blob.size)}
            </span>
            <Button variant="primary" size="sm" onClick={() => downloadBlob(shownRes.blob, `decoded.${extFor(shownRes.mime)}`)}>
              <Download aria-hidden />
              {t.download}
            </Button>
          </div>
          {preview && shownRes.mime?.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={t.preview} className="mt-3 max-h-80 max-w-full rounded-[8px] border border-line bg-[repeating-conic-gradient(#8883_0_25%,transparent_0_50%)] bg-[length:16px_16px] object-contain" />
          )}
          {preview && shownRes.mime?.startsWith("audio/") && <audio src={preview} controls className="mt-3 w-full" />}
          {preview && shownRes.mime?.startsWith("video/") && <video src={preview} controls className="mt-3 max-h-80 w-full" />}
        </div>
      )}
    </Panel>
  );
}
