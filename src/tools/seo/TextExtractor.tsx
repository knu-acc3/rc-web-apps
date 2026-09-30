"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  DownloadSimple,
  FileHtml,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useUrlFetcher } from "@/src/hooks/useUrlFetcher";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type OutputFormat = "text" | "markdown";

type PageMeta = {
  title: string;
  description: string;
  headings: Array<{ level: number; text: string }>;
};

function parsePageMeta(html: string): PageMeta {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  return {
    title: documentNode.querySelector("title")?.textContent?.trim() ?? "",
    description:
      documentNode
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim() ?? "",
    headings: [...documentNode.querySelectorAll("h1, h2, h3, h4, h5, h6")]
      .map((element) => ({
        level: Number(element.tagName.slice(1)),
        text: element.textContent?.trim() ?? "",
      }))
      .filter((heading) => heading.text)
      .slice(0, 40),
  };
}

function toBasicMarkdown(html: string) {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**")
    .replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, "*$1*")
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function validWebUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function downloadText(value: string, extension: "txt" | "md") {
  const mime =
    extension === "md"
      ? "text/markdown;charset=utf-8"
      : "text/plain;charset=utf-8";
  const url = URL.createObjectURL(new Blob([value], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `page-content.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function TextExtractor() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const { fetchUrl, extractText, loading, error: fetchError } = useUrlFetcher();
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawHtml, setRawHtml] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("text");
  const [result, setResult] = useState("");
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [localError, setLocalError] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const words = result.trim() ? result.trim().split(/\s+/).length : 0;
    return { words, characters: result.length };
  }, [result]);

  const renderResult = (html: string, format: OutputFormat) => {
    setRawHtml(html);
    setMeta(parsePageMeta(html));
    setResult(
      format === "markdown" ? toBasicMarkdown(html) : extractText(html),
    );
    setCopied(false);
  };

  const extractFromUrl = async () => {
    const normalized = sourceUrl.trim();
    if (!validWebUrl(normalized)) {
      setLocalError(
        isEn
          ? "Enter a full http or https URL."
          : "Введите полный URL с http или https.",
      );
      return;
    }
    setLocalError("");
    const html = await fetchUrl(normalized);
    if (html) renderResult(html, outputFormat);
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const changeFormat = (format: OutputFormat) => {
    setOutputFormat(format);
    if (rawHtml)
      setResult(
        format === "markdown" ? toBasicMarkdown(rawHtml) : extractText(rawHtml),
      );
    setCopied(false);
  };

  const uploadHtml = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const html = String(reader.result ?? "");
      setSourceUrl(file.name);
      setLocalError("");
      renderResult(html, outputFormat);
    };
    reader.onerror = () =>
      setLocalError(
        isEn
          ? "Could not read this HTML file."
          : "Не удалось прочитать HTML-файл.",
      );
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="page-text-url" className="text-sm font-semibold">
          {isEn ? "Page URL" : "URL страницы"}
        </Label>
        <Input
          id="page-text-url"
          value={sourceUrl}
          onChange={(event) => {
            setSourceUrl(event.target.value);
            setResult("");
            setRawHtml("");
            setMeta(null);
            setLocalError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !loading && !result)
              void extractFromUrl();
          }}
          placeholder="https://site.test/article"
          className="mt-2 h-12 text-base"
        />

        {localError || fetchError ? (
          <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
            {localError || fetchError}
          </p>
        ) : null}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          loading={loading}
          loadingLabel={isEn ? "Extracting…" : "Извлечение…"}
          onClick={() => (result ? void copyResult() : void extractFromUrl())}
          leadingIcon={
            result ? (
              copied ? (
                <Check size={20} weight="bold" />
              ) : (
                <Copy size={20} />
              )
            ) : (
              <MagnifyingGlass size={20} weight="bold" />
            )
          }
        >
          {result
            ? copied
              ? isEn
                ? "Text copied"
                : "Текст скопирован"
              : isEn
                ? "Copy extracted text"
                : "Скопировать текст"
            : isEn
              ? "Extract text"
              : "Извлечь текст"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={
            isEn ? "Input and output options" : "Параметры ввода и результата"
          }
          description={
            isEn
              ? "Local HTML, basic Markdown, metadata and downloads"
              : "Локальный HTML, базовый Markdown, метаданные и скачивание"
          }
        >
          <div className="grid grid-cols-2 gap-2">
            {(["text", "markdown"] as OutputFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => changeFormat(format)}
                aria-pressed={outputFormat === format}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-semibold",
                  outputFormat === format
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)]",
                )}
              >
                {format === "text"
                  ? isEn
                    ? "Plain text"
                    : "Обычный текст"
                  : "Markdown"}
              </button>
            ))}
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold hover:bg-[var(--color-surface-muted)]">
            <FileHtml size={20} />
            <span>
              {isEn ? "Open a local HTML file" : "Открыть локальный HTML-файл"}
            </span>
            <input
              type="file"
              data-file-paste-target="true"
              accept=".html,.htm,text/html"
              className="hidden"
              onChange={(event) => uploadHtml(event.target.files?.[0])}
            />
          </label>

          {result ? (
            <div className="mt-4 space-y-3">
              {meta?.title || meta?.description ? (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
                  {meta.title ? (
                    <p>
                      <span className="font-semibold">Title:</span> {meta.title}
                    </p>
                  ) : null}
                  {meta.description ? (
                    <p className="mt-1">
                      <span className="font-semibold">Description:</span>{" "}
                      {meta.description}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {meta?.headings.length ? (
                <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <summary className="min-h-11 cursor-pointer text-sm font-semibold">
                    {isEn
                      ? `Headings: ${meta.headings.length}`
                      : `Заголовки: ${meta.headings.length}`}
                  </summary>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-muted)]">
                    {meta.headings.map((heading, index) => (
                      <li
                        key={`${heading.level}-${heading.text}-${index}`}
                        style={{ paddingLeft: `${(heading.level - 1) * 10}px` }}
                      >
                        H{heading.level} · {heading.text}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => downloadText(result, "txt")}
                >
                  <DownloadSimple size={18} /> TXT
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => downloadText(result, "md")}
                >
                  <DownloadSimple size={18} /> Markdown
                </Button>
              </div>
            </div>
          ) : null}
        </AdvancedSettings>
      </section>

      {result ? (
        <section
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">
              {isEn ? "Extracted content" : "Извлечённый текст"}
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              {stats.words} {isEn ? "words" : "слов"} · {stats.characters}{" "}
              {isEn ? "characters" : "символов"}
            </span>
          </div>
          <Textarea
            value={result}
            readOnly
            rows={14}
            className="mt-3 min-h-72 resize-y bg-[var(--color-surface-muted)] font-mono text-sm"
          />
        </section>
      ) : null}
    </div>
  );
}
