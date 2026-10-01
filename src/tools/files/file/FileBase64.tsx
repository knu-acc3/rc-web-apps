"use client";

import { Download, File as FileIcon, FolderOpen } from "lucide-react";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { Button, buttonClass } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Switch, Textarea } from "@/ui/field";
import { Badge, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { Tabs } from "@/ui/tabs";
import { base64ToBytes, parseBase64, wrapLines } from "./lib/b64";
import { Setting } from "@/tools/files/video/ui/options";
import { detectBytes } from "./lib/magic";

const T = {
  ru: {
    tabs: "Направление",
    encode: "Файл → Base64",
    decode: "Base64 → файл",
    drop: "Перетащите файл сюда или нажмите, чтобы выбрать",
    format: "Формат",
    wrap: "Переносить строки по 76 символов (MIME)",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать .txt",
    preview: "Показано начало: {n} из {total}. Копируется и скачивается весь текст.",
    input: "Вставьте Base64 или data:URI",
    placeholder: "data:image/png;base64,iVBORw0KGgo… или просто iVBORw0KGgo…",
    invalid: "Это не Base64: допустимы буквы A–Z, a–z, цифры, + / (или - _) и = в конце.",
    unknown: "Неизвестный формат",
    save: "Скачать файл",
    other: "Другой файл",
    result: "Результат",
  },
  en: {
    tabs: "Direction",
    encode: "File → Base64",
    decode: "Base64 → file",
    drop: "Drop a file here or click to choose",
    format: "Format",
    wrap: "Wrap lines at 76 characters (MIME)",
    copy: "Copy",
    copied: "Copied",
    download: "Download .txt",
    preview: "Showing the beginning: {n} of {total}. The buttons copy and download the full text.",
    input: "Paste Base64 or a data: URI",
    placeholder: "data:image/png;base64,iVBORw0KGgo… or just iVBORw0KGgo…",
    invalid: "This isn't Base64: only A–Z, a–z, digits, + / (or - _) and trailing = are allowed.",
    unknown: "Unknown format",
    save: "Download file",
    other: "Another file",
    result: "Result",
  },
} as const;

const PREVIEW = 100_000;
type Fmt = "b64" | "uri" | "css" | "html";

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function Encoder({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<{ file: File; url: string } | null>(null);
  const [fmt, setFmt] = useState<Fmt>("b64");
  const [wrap, setWrap] = useState(false);
  useEffect(() => {
    if (!file) return;
    let alive = true;
    readDataUrl(file).then((url) => alive && setDataUrl({ file, url }));
    return () => {
      alive = false;
    };
  }, [file]);
  const url = dataUrl && dataUrl.file === file ? dataUrl.url : null;
  const isImage = !!file?.type.startsWith("image/");
  const output = useMemo(() => {
    if (!url) return "";
    const b64 = url.slice(url.indexOf(",") + 1);
    const uri = url.startsWith("data:;") ? `data:application/octet-stream;${url.slice(6)}` : url;
    if (fmt === "b64") return wrap ? wrapLines(b64) : b64;
    if (fmt === "uri") return uri;
    if (fmt === "css") return `background-image: url("${uri}");`;
    return `<img src="${uri}" alt="">`;
  }, [url, fmt, wrap]);

  if (!file) return <Dropzone onFiles={(fs) => fs[0] && setFile(fs[0])} locale={locale} title={t.drop} />;
  const shown = output.length > PREVIEW ? output.slice(0, PREVIEW) + "…" : output;
  const opts: { value: Fmt; label: string }[] = [
    { value: "b64", label: "Base64" },
    { value: "uri", label: "Data URI" },
    ...(isImage ? ([{ value: "css", label: "CSS" }, { value: "html", label: "HTML <img>" }] as const) : []),
  ];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
      <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[0.875rem] bg-accent-container text-on-accent-container">
            <FileIcon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-fg" title={file.name}>
              {file.name}
            </div>
            <div className="tabular text-sm text-fg-3">
              {formatBytes(locale, file.size)} → {formatBytes(locale, Math.ceil(file.size / 3) * 4)}
            </div>
          </div>
          <label title={t.other} className={buttonClass("tonal", "sm", "cursor-pointer focus-within:outline-2 focus-within:outline-accent")}>
            <FolderOpen aria-hidden />
            <span className="max-sm:sr-only">{t.other}</span>
            <input type="file" className="sr-only" onChange={(e) => (e.target.files?.[0] && setFile(e.target.files[0]), (e.target.value = ""))} />
          </label>
        </div>
        <Setting label={t.format}>
          <Segmented label={t.format} value={fmt} onChange={setFmt} options={opts} />
        </Setting>
        {fmt === "b64" && <Switch label={t.wrap} checked={wrap} onChange={(e) => setWrap(e.target.checked)} />}
        <div className="flex flex-col gap-2">
          <CopyButton value={() => output} label={t.copy} copiedLabel={t.copied} variant="primary" size="md" className="h-14! w-full text-lg! [--btn-r:1.75rem]! [&_svg]:size-6!" />
          <Button variant="outlined" onClick={() => downloadText(output, `${file.name}.base64.txt`)} disabled={!output}>
            <Download aria-hidden />
            {t.download}
          </Button>
        </div>
      </Panel>
      <Panel className="flex min-w-0 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <span className="text-sm font-medium text-fg-2">{t.result}</span>
          <span className="tabular text-sm text-fg-3">{formatBytes(locale, output.length)}</span>
        </div>
        <textarea readOnly value={shown} aria-label={t.result} spellCheck={false} className="block h-64 w-full resize-y bg-transparent px-4 py-3 font-mono text-[0.8125rem] break-all text-fg focus:outline-none lg:h-96" />
        {output.length > PREVIEW && <p className="border-t border-line px-4 py-2 text-[0.8125rem] text-fg-3">{t.preview.replace("{n}", formatBytes(locale, PREVIEW)).replace("{total}", formatBytes(locale, output.length))}</p>}
      </Panel>
    </div>
  );
}

function Decoder({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("");
  const deferred = useDeferredValue(text);
  const img = useRef<HTMLImageElement>(null);
  const decoded = useMemo(() => {
    if (!deferred.trim()) return null;
    const p = parseBase64(deferred);
    if (!p) return { error: true as const };
    try {
      const bytes = base64ToBytes(p.data);
      const det = detectBytes(bytes.subarray(0, 64 * 1024));
      const mime = p.mime || det?.mime || "application/octet-stream";
      return { error: false as const, blob: new Blob([bytes as BlobPart], { type: mime }), det, mime };
    } catch {
      return { error: true as const };
    }
  }, [deferred]);
  const isImage = !!decoded && !decoded.error && decoded.mime.startsWith("image/");
  useEffect(() => {
    if (!decoded || decoded.error || !isImage || !img.current) return;
    const url = URL.createObjectURL(decoded.blob);
    img.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [decoded, isImage]);
  const ext = decoded && !decoded.error ? decoded.det?.ext || "bin" : "bin";

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
      <Field label={t.input} htmlFor={`${id}-in`} error={decoded?.error ? t.invalid : undefined}>
        <Textarea id={`${id}-in`} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} className="h-48 break-all lg:h-72" />
      </Field>
      {decoded && !decoded.error ? (
        <Panel className="flex min-w-0 flex-col gap-4 p-4 motion-safe:animate-[menu-in_240ms_var(--ease-emph)] sm:p-5">
          <div aria-live="polite">
            <div className="text-2xl font-bold tracking-tight text-fg">{decoded.det?.name ?? t.unknown}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge>{formatBytes(locale, decoded.blob.size)}</Badge>
              <Badge>{decoded.mime}</Badge>
            </div>
          </div>
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img ref={img} alt="" className="max-h-72 w-auto max-w-full self-start rounded-[0.75rem] bg-[repeating-conic-gradient(#8882_0_25%,transparent_0_50%)] bg-[length:16px_16px]" />
          )}
          <Button variant="filled" size="xl" fullWidth onClick={() => downloadBlob(decoded.blob, `decoded.${ext}`)}>
            <Download aria-hidden />
            {t.save}
          </Button>
        </Panel>
      ) : (
        <div className="hidden lg:block" />
      )}
    </div>
  );
}

export default function FileBase64({ locale, mode: mode0 = "encode" }: { locale: Locale; mode?: "encode" | "decode" }) {
  const t = T[locale];
  const [mode, setMode] = useState<"encode" | "decode">(mode0);
  return (
    <div className="flex flex-col gap-4">
      <Tabs label={t.tabs} value={mode} onChange={setMode} items={[{ value: "encode", label: t.encode }, { value: "decode", label: t.decode }]} />
      {mode === "encode" ? <Encoder locale={locale} /> : <Decoder locale={locale} />}
    </div>
  );
}
