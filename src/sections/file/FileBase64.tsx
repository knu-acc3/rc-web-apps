"use client";

import { Download } from "lucide-react";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Checkbox, Textarea } from "@/ui/field";
import { Badge, Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { Tabs } from "@/ui/tabs";
import { base64ToBytes, parseBase64, wrapLines } from "./lib/b64";
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
    preview: "Показано начало: {n} из {total}. Кнопки копируют и скачивают весь текст.",
    input: "Вставьте Base64 или data:URI",
    placeholder: "data:image/png;base64,iVBORw0KGgo… или просто iVBORw0KGgo…",
    invalid: "Это не Base64: допустимы буквы A–Z, a–z, цифры, + / (или - _) и = в конце.",
    type: "Тип",
    unknown: "Неизвестный формат",
    save: "Скачать файл",
    grows: "Base64 увеличивает размер примерно на треть: {a} → {b}.",
    other: "Другой файл",
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
    type: "Type",
    unknown: "Unknown format",
    save: "Download file",
    grows: "Base64 makes data about a third larger: {a} → {b}.",
    other: "Another file",
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

  if (!file) return <Dropzone onFiles={(fs) => fs[0] && setFile(fs[0])} title={t.drop} />;
  const shown = output.length > PREVIEW ? output.slice(0, PREVIEW) + "…" : output;
  const opts: { value: Fmt; label: string }[] = [
    { value: "b64", label: "Base64" },
    { value: "uri", label: "Data URI" },
    ...(isImage ? ([{ value: "css", label: "CSS" }, { value: "html", label: "HTML <img>" }] as const) : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm text-fg-2">
          <span className="font-medium text-fg">{file.name}</span> · {t.grows.replace("{a}", formatBytes(locale, file.size)).replace("{b}", formatBytes(locale, Math.ceil(file.size / 3) * 4))}
        </div>
        <label className="cursor-pointer text-sm text-accent hover:underline">
          {t.other}
          <input type="file" className="sr-only" onChange={(e) => (e.target.files?.[0] && setFile(e.target.files[0]), (e.target.value = ""))} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label={t.format} value={fmt} onChange={setFmt} size="sm" options={opts} />
        {fmt === "b64" && <Checkbox label={t.wrap} checked={wrap} onChange={(e) => setWrap(e.target.checked)} />}
      </div>
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5">
          <span className="tabular text-sm text-fg-2">{formatBytes(locale, output.length)}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => downloadText(output, `${file.name}.base64.txt`)} disabled={!output}>
              <Download aria-hidden />
              <span className="hidden sm:inline">{t.download}</span>
            </Button>
            <CopyButton value={() => output} label={t.copy} copiedLabel={t.copied} variant="primary" />
          </div>
        </div>
        <textarea readOnly value={shown} aria-label="Base64" spellCheck={false} className="block h-64 w-full resize-y bg-transparent px-3 py-2 font-mono text-[13px] break-all text-fg focus:outline-none" />
      </Panel>
      {output.length > PREVIEW && <p className="text-[13px] text-fg-3">{t.preview.replace("{n}", formatBytes(locale, PREVIEW)).replace("{total}", formatBytes(locale, output.length))}</p>}
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
    <div className="flex flex-col gap-3">
      <label htmlFor={`${id}-in`} className="text-sm font-medium text-fg-2">
        {t.input}
      </label>
      <Textarea id={`${id}-in`} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.placeholder} className="h-40 break-all" />
      {decoded?.error && <Notice tone="err">{t.invalid}</Notice>}
      {decoded && !decoded.error && (
        <Panel className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div aria-live="polite">
              <div className="text-xl font-semibold text-fg">{decoded.det?.name ?? t.unknown}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge>{formatBytes(locale, decoded.blob.size)}</Badge>
                <Badge>{decoded.mime}</Badge>
              </div>
            </div>
            <Button variant="primary" onClick={() => downloadBlob(decoded.blob, `decoded.${ext}`)}>
              <Download aria-hidden />
              {t.save}
            </Button>
          </div>
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img ref={img} alt="" className="max-h-72 w-auto max-w-full self-start rounded-[8px] bg-[repeating-conic-gradient(#8882_0_25%,transparent_0_50%)] bg-[length:16px_16px]" />
          )}
        </Panel>
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
