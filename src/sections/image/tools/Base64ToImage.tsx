"use client";

/* eslint-disable @next/next/no-img-element -- blob: URL of decoded data */
import { Download, FileText } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Base64Error, parseBase64Input } from "../engine/base64";
import { detectFormat, FORMAT_META, type SniffedFormat } from "../engine/detect";
import { displayable } from "../engine/source";
import { checker } from "../ui/controls";

const T = {
  ru: {
    input: "Base64 или Data URI",
    placeholder: "data:image/png;base64,iVBORw0KGgo… или просто iVBORw0KGgo…",
    fromFile: "Загрузить из .txt",
    empty: "Вставьте строку Base64 — картинка появится сразу",
    invalid: (at: number) => `Недопустимый символ в позиции ${at + 1}: в Base64 бывают только A–Z, a–z, 0–9, +, / и =`,
    badLength: "Строка обрезана: длина Base64 не может давать остаток 1 при делении на 4",
    notImage: (n: string) => `Декодировано ${n}, но это не изображение (сигнатура файла не распознана)`,
    detected: "Формат по содержимому",
    declared: (m: string) => `в Data URI указано ${m}`,
    noPreview: "Этот формат браузер не показывает, но файл можно скачать",
    download: "Скачать",
    decoded: "Декодированное изображение",
  },
  en: {
    input: "Base64 or Data URI",
    placeholder: "data:image/png;base64,iVBORw0KGgo… or just iVBORw0KGgo…",
    fromFile: "Load from .txt",
    empty: "Paste a Base64 string — the image appears instantly",
    invalid: (at: number) => `Invalid character at position ${at + 1}: Base64 only uses A–Z, a–z, 0–9, +, / and =`,
    badLength: "The string is truncated: a Base64 length can't leave a remainder of 1 when divided by 4",
    notImage: (n: string) => `Decoded ${n}, but it isn't an image (unknown file signature)`,
    detected: "Detected format",
    declared: (m: string) => `the Data URI says ${m}`,
    noPreview: "The browser can't display this format, but you can download the file",
    download: "Download",
    decoded: "Decoded image",
  },
} as const;

interface Decoded {
  bytes: Uint8Array;
  format: SniffedFormat | null;
  declared?: string;
}

export default function Base64ToImage({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Decoded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimsFor, setDims] = useState<{ url: string; w: number; h: number } | null>(null);

  // Parse after typing pauses; the textarea is uncontrolled so multi-MB pastes don't re-render.
  useEffect(() => {
    const h = setTimeout(() => {
      if (!text.trim()) {
        setResult(null);
        setError(null);
        return;
      }
      try {
        const { bytes, declared } = parseBase64Input(text);
        const format = detectFormat(bytes.subarray(0, 4096));
        setResult({ bytes, format, declared });
        setError(format ? null : t.notImage(formatBytes(locale, bytes.length)));
      } catch (e) {
        setResult(null);
        setError(e instanceof Base64Error ? (e.code === "INVALID" ? t.invalid(e.at ?? 0) : e.code === "BAD_LENGTH" ? t.badLength : null) : t.invalid(0));
      }
    }, 200);
    return () => clearTimeout(h);
  }, [text, t, locale]);

  const url = useMemo(
    () =>
      result?.format && displayable(result.format)
        ? URL.createObjectURL(new Blob([result.bytes as BlobPart], { type: FORMAT_META[result.format].mime }))
        : null,
    [result],
  );
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  const dims = dimsFor && dimsFor.url === url ? dimsFor : null;

  const meta = result?.format ? FORMAT_META[result.format] : null;
  const declaredMismatch = meta && result?.declared && result.declared.toLowerCase() !== meta.mime && !(meta.ext === "jpg" && /jpe?g/i.test(result.declared));

  return (
    <div className="flex flex-col gap-4">
      <Field
        label={t.input}
        htmlFor={`${id}-in`}
        aside={
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            <FileText aria-hidden />
            {t.fromFile}
          </Button>
        }
      >
        <textarea
          ref={taRef}
          id={`${id}-in`}
          defaultValue=""
          onInput={(e) => setText(e.currentTarget.value)}
          placeholder={t.placeholder}
          rows={6}
          spellCheck={false}
          className="control min-h-40 resize-y py-2.5 font-mono text-xs leading-relaxed"
          aria-invalid={!!error}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const v = await f.text();
            if (taRef.current) taRef.current.value = v.length > 200_000 ? `${v.slice(0, 200_000)}…` : v;
            setText(v);
          }}
        />
      </Field>

      {error && <Notice tone="err">{error}</Notice>}

      {result?.format && meta ? (
        <Panel className="overflow-hidden">
          <div className={`flex min-h-40 items-center justify-center p-3 ${checker}`}>
            {url ? (
              <img
                src={url}
                alt={t.decoded}
                className="block max-h-[60vh] max-w-full object-contain"
                onLoad={(e) => setDims({ url, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              />
            ) : (
              <p className="px-4 text-center text-sm text-fg-2">{t.noPreview}</p>
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              <p className="tabular text-2xl font-semibold tracking-tight text-fg">
                {meta.label}
                {dims ? ` · ${formatNumber(locale, dims.w)} × ${formatNumber(locale, dims.h)} px` : ""}
              </p>
              <p className="text-sm text-fg-3">
                {formatBytes(locale, result.bytes.length)} · {meta.mime}
                {declaredMismatch ? ` · ${t.declared(result.declared!)}` : ""}
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={() => downloadBlob(new Blob([result.bytes as BlobPart], { type: meta.mime }), `image.${meta.ext}`)}>
              <Download aria-hidden />
              {t.download} .{meta.ext}
            </Button>
          </div>
        </Panel>
      ) : (
        !error && <p className="text-sm text-fg-3">{t.empty}</p>
      )}
    </div>
  );
}
