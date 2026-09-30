"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs of local files */
import { Download } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber, plural } from "@/i18n/format";
import { downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Switch } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { base64Length, bytesToBase64, svgToDataUri } from "../engine/base64";
import { detectFormat, FORMAT_META, IMAGE_ACCEPT, type SniffedFormat } from "../engine/detect";
import { baseName, displayable } from "../engine/source";
import { checker } from "../ui/controls";
import { errorText, S } from "../ui/strings";

const T = {
  ru: {
    as: "Вывести как",
    dataUri: "Data URI",
    raw: "Base64",
    css: "CSS",
    html: "HTML",
    md: "Markdown",
    svgUrl: "Для SVG: URL-кодирование вместо Base64 (обычно короче)",
    detected: "Формат по содержимому",
    mismatch: (ext: string, real: string) => `Расширение .${ext}, но на самом деле это ${real} — в Data URI указан настоящий тип`,
    length: (n: number) => `${formatNumber("ru", n)} ${plural("ru", n, ["символ", "символа", "символов"])}`,
    truncated: "Показано начало строки — целиком её дают кнопки «Копировать» и «Скачать»",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать .txt",
    notImage: "Файл не распознан как изображение",
    output: "Результат",
  },
  en: {
    as: "Output as",
    dataUri: "Data URI",
    raw: "Base64",
    css: "CSS",
    html: "HTML",
    md: "Markdown",
    svgUrl: "For SVG: URL-encoding instead of Base64 (usually shorter)",
    detected: "Detected format",
    mismatch: (ext: string, real: string) => `The extension is .${ext}, but it is really ${real} — the Data URI uses the real type`,
    length: (n: number) => `${formatNumber("en", n)} ${plural("en", n, ["character", "characters"])}`,
    truncated: "Only the beginning is shown — Copy and Download give the full string",
    copy: "Copy",
    copied: "Copied",
    download: "Download .txt",
    notImage: "The file isn't recognised as an image",
    output: "Result",
  },
} as const;

type Kind = "uri" | "raw" | "css" | "html" | "md";
const PREVIEW_LIMIT = 20_000;

export default function ToBase64({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<{ b64: string; format: SniffedFormat | null; svgText?: string; bytes: number } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [kind, setKind] = useState<Kind>("uri");
  const [svgUrl, setSvgUrl] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    let alive = true;
    let made: string | null = null;
    (async () => {
      try {
        const buf = new Uint8Array(await file.arrayBuffer());
        const format = detectFormat(buf.subarray(0, 4096));
        const svgText = format === "svg" ? new TextDecoder().decode(buf) : undefined;
        const b64 = bytesToBase64(buf);
        if (!alive) return;
        setData({ b64, format, svgText, bytes: buf.length });
        if (format && displayable(format)) {
          made = URL.createObjectURL(new Blob([buf], { type: FORMAT_META[format].mime }));
          setUrl(made);
        }
      } catch (e) {
        if (alive) setError(e);
      }
    })();
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
      setUrl(null);
      setDims(null);
    };
  }, [file]);

  const mime = data?.format ? FORMAT_META[data.format].mime : file?.type || "application/octet-stream";
  const uri = data ? (data.format === "svg" && svgUrl && data.svgText ? svgToDataUri(data.svgText) : `data:${mime};base64,${data.b64}`) : "";
  const alt = file ? baseName(file.name) : "";
  const value = useMemo(() => {
    if (!data) return "";
    switch (kind) {
      case "uri":
        return uri;
      case "raw":
        return data.b64;
      case "css":
        return `background-image: url("${uri}");`;
      case "html":
        return `<img src="${uri}" alt="${alt.replace(/"/g, "&quot;")}"${dims ? ` width="${dims.w}" height="${dims.h}"` : ""}>`;
      case "md":
        return `![${alt.replace(/[[\]]/g, "")}](${uri})`;
    }
  }, [data, kind, uri, alt, dims]);

  const ext = file?.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  const realExt = data?.format ? FORMAT_META[data.format].ext : null;
  const mismatch =
    ext &&
    realExt &&
    ext !== realExt &&
    !(realExt === "jpg" && ["jpeg", "jfif", "jpe", "pjpeg", "pjp"].includes(ext)) &&
    !(realExt === "tiff" && ext === "tif") &&
    !(realExt === "heic" && ext === "heif");
  const shown = value.length > PREVIEW_LIMIT ? `${value.slice(0, PREVIEW_LIMIT)}…` : value;

  if (!file || !data) {
    return (
      <div className="flex flex-col gap-3">
        <Dropzone
          onFiles={(f) => {
            setError(null);
            setData(null);
            setFile(f[0] ?? null);
          }}
          accept={IMAGE_ACCEPT}
          title={s.dropOne}
          hint={s.dropHint}
          className="min-h-64"
        />
        {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-[12px] border border-line bg-surface px-4 py-3">
        <Segmented
          wrap
          label={t.as}
          value={kind}
          onChange={setKind}
          options={[
            { value: "uri", label: t.dataUri },
            { value: "raw", label: t.raw },
            { value: "css", label: t.css },
            { value: "html", label: t.html },
            { value: "md", label: t.md },
          ]}
        />
        {data.format === "svg" && kind !== "raw" && <Switch label={t.svgUrl} checked={svgUrl} onChange={(e) => setSvgUrl(e.target.checked)} />}
      </div>
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          {url && (
            <div className={`flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-line ${checker}`}>
              <img
                src={url}
                alt={alt}
                className="max-h-full max-w-full object-contain"
                onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              />
            </div>
          )}
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="tabular text-2xl font-semibold tracking-tight text-fg">
              {formatBytes(locale, value.length)} <span className="text-base font-normal text-fg-3">{t.length(value.length)}</span>
            </p>
            <p className="tabular text-sm text-fg-2">
              {file.name} · {formatBytes(locale, data.bytes)} → +
              {formatNumber(locale, ((base64Length(data.bytes) - data.bytes) / Math.max(1, data.bytes)) * 100, { maximumFractionDigits: 0 })} %
              {dims ? ` · ${dims.w}×${dims.h}` : ""}
            </p>
            <p className="text-sm text-fg-2">
              {t.detected}: <span className="font-medium text-fg">{data.format ? FORMAT_META[data.format].label : "—"}</span> ({mime})
            </p>
            {!data.format && <p className="text-sm text-warn">{t.notImage}</p>}
            {mismatch && <p className="text-sm text-warn">{t.mismatch(ext!, FORMAT_META[data.format!].label)}</p>}
          </div>
        </div>
        <div className="border-t border-line">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5">
            <label htmlFor={`${id}-out`} className="text-sm font-semibold text-fg">
              {t.output}
            </label>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => downloadText(value, `${alt || "image"}-base64.txt`)}>
                <Download aria-hidden />
                <span className="hidden sm:inline">{t.download}</span>
              </Button>
              <CopyButton value={() => value} label={t.copy} copiedLabel={t.copied} variant="primary" />
            </div>
          </div>
          <textarea
            id={`${id}-out`}
            readOnly
            value={shown}
            rows={6}
            spellCheck={false}
            className="block min-h-32 w-full resize-y border-t border-line bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed text-fg-2 focus:outline-none"
          />
          {value.length > PREVIEW_LIMIT && <p className="border-t border-line px-3 py-2 text-[13px] text-fg-3">{t.truncated}</p>}
        </div>
      </Panel>
      <Dropzone
        onFiles={(f) => {
          setError(null);
          setData(null);
          setFile(f[0] ?? null);
        }}
        accept={IMAGE_ACCEPT}
        compact
        title={s.dropOne}
      />
    </div>
  );
}
