"use client";

import { useState, useCallback, useRef } from "react";
import {
  Download,
  FileText,
  X,
  Warning,
  StopCircle,
  TextT,
  MagnifyingGlass,
  CheckCircle,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { PdfDropzone, PdfPreview } from "@/src/components/ui/pdf-dropzone";
import SmartCopy from "@/src/components/SmartCopy";
import { cn } from "@/src/lib/cn";
import {
  readFileAsArrayBuffer,
  loadPdfDocument,
  formatFileSize,
} from "@/src/utils/pdfHelpers";
import { downloadBlob } from "@/src/utils/exportHelpers";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";

type OutputFormat = "plain" | "markdown" | "json";

interface TextItem {
  str: string;
  transform: number[];
  hasEOL?: boolean;
}

interface PageText {
  pageNumber: number;
  text: string;
  itemCount: number;
}

function parsePageRange(input: string, total: number): number[] {
  const trimmed = input.trim();
  if (!trimmed) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>();
  for (const part of trimmed.split(",")) {
    const range = part.trim();
    if (!range) continue;
    const m = range.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const s = Math.max(1, parseInt(m[1], 10));
      const e = Math.min(total, parseInt(m[2], 10));
      for (let i = s; i <= e; i++) pages.add(i);
    } else {
      const n = parseInt(range, 10);
      if (n >= 1 && n <= total) pages.add(n);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

function extractPageText(items: TextItem[], preserveBreaks: boolean): string {
  if (items.length === 0) return "";
  if (!preserveBreaks) {
    return items.map((it) => it.str).join(" ");
  }
  // Use Y coordinate from transform matrix to detect line breaks
  const parts: string[] = [];
  let prevY: number | null = null;
  let lineParts: string[] = [];
  const flushLine = () => {
    if (lineParts.length > 0) {
      parts.push(lineParts.join(" ").replace(/\s+/g, " ").trim());
      lineParts = [];
    }
  };
  for (const item of items) {
    const y = item.transform?.[5] ?? 0;
    if (prevY !== null && Math.abs(prevY - y) > 2) {
      flushLine();
    }
    if (item.str.trim() || lineParts.length > 0) lineParts.push(item.str);
    if (item.hasEOL) {
      flushLine();
    }
    prevY = y;
  }
  flushLine();
  return parts.filter((p) => p.length > 0).join("\n");
}

function formatOutput(pages: PageText[], format: OutputFormat): string {
  if (format === "plain") {
    return pages.map((p) => p.text).join("\n\n");
  }
  if (format === "markdown") {
    return pages
      .map((p) => `## Page ${p.pageNumber}\n\n${p.text}`)
      .join("\n\n---\n\n");
  }
  // json
  return JSON.stringify(
    {
      totalPages: pages.length,
      pages: pages.map((p) => ({ page: p.pageNumber, text: p.text })),
    },
    null,
    2,
  );
}

export default function PdfToText() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<PageText[]>([]);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<OutputFormat>("plain");
  const [preserveBreaks, setPreserveBreaks] = useState(true);
  const [pageRangeInput, setPageRangeInput] = useState("");
  const [outputName, setOutputName] = useState("extracted");
  const cancelRef = useRef(false);

  const handleExtract = useCallback(
    async (buffer: ArrayBuffer, requestedRange?: string) => {
      setExtracting(true);
      setProgress(0);
      setPages([]);
      setError("");
      cancelRef.current = false;
      try {
        const doc = await loadPdfDocument(buffer.slice(0));
        const total = doc.numPages;
        setPageCount(total);
        const targets = parsePageRange(requestedRange || pageRangeInput, total);

        const out: PageText[] = [];
        for (let i = 0; i < targets.length; i++) {
          if (cancelRef.current) break;
          const pageNum = targets[i];
          const page = await doc.getPage(pageNum);
          const content = await page.getTextContent();
          const items = content.items as TextItem[];
          const text = extractPageText(items, preserveBreaks);
          out.push({ pageNumber: pageNum, text, itemCount: items.length });
          setProgress(Math.round(((i + 1) / targets.length) * 100));
        }
        setPages(out);
        doc.destroy();
      } catch {
        setError(
          isEn
            ? "Failed to extract text from this PDF. The file may be corrupted or password-protected."
            : "Не удалось извлечь текст. Файл может быть повреждён или защищён паролем.",
        );
      } finally {
        setExtracting(false);
      }
    },
    [isEn, pageRangeInput, preserveBreaks],
  );

  const handleFile = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      setFile(f);
      setOutputName(f.name.replace(/\.pdf$/i, ""));
      try {
        const buffer = await readFileAsArrayBuffer(f);
        setPdfData(buffer);
        await handleExtract(buffer);
      } catch {
        setError(
          isEn ? "Failed to read the PDF." : "Не удалось прочитать PDF.",
        );
      }
    },
    [isEn, handleExtract],
  );

  const handleReExtract = useCallback(async () => {
    if (!pdfData) return;
    await handleExtract(pdfData);
  }, [pdfData, handleExtract]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const handleReset = useCallback(() => {
    cancelRef.current = true;
    setFile(null);
    setPdfData(null);
    setPages([]);
    setError("");
    setProgress(0);
    setPageCount(0);
    setFormat("plain");
    setPreserveBreaks(true);
    setPageRangeInput("");
    setOutputName("extracted");
  }, []);

  const fullText = pages.length > 0 ? formatOutput(pages, format) : "";

  const handleDownload = () => {
    if (!fullText) return;
    const ext =
      format === "markdown" ? "md" : format === "json" ? "json" : "txt";
    const mime =
      format === "json"
        ? "application/json"
        : format === "markdown"
          ? "text/markdown"
          : "text/plain";
    const blob = new Blob([fullText], { type: `${mime};charset=utf-8` });
    const name = (outputName.trim() || "extracted").replace(
      /\.(txt|md|json)$/i,
      "",
    );
    downloadBlob(blob, `${name}.${ext}`);
  };

  const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
  // OCR detection: if avg chars/page < 50, likely image-only PDF
  const totalChars = pages.reduce((s, p) => s + p.text.length, 0);
  const avgCharsPerPage = pages.length > 0 ? totalChars / pages.length : 0;
  const isLikelyImageOnly = pages.length > 0 && avgCharsPerPage < 50;

  const formatOptions: { value: OutputFormat; label: string; ext: string }[] = [
    { value: "plain", label: isEn ? "Plain text" : "Текст", ext: ".txt" },
    { value: "markdown", label: "Markdown", ext: ".md" },
    { value: "json", label: "JSON", ext: ".json" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      {!file && (
        <PdfDropzone
          accept="application/pdf,.pdf"
          maxSizeMB={100}
          onFilesSelected={handleFile}
          supportPaste={false}
        />
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label={isEn ? "Dismiss" : "Закрыть"}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {extracting && (
        <Card className="mt-4 p-4 sm:p-6">
          <div className="mb-2 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
            <span>
              {isEn
                ? `Extracting text… ${progress}%`
                : `Извлечение текста… ${progress}%`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-[var(--color-danger)]"
            >
              <StopCircle size={14} />
              {isEn ? "Cancel" : "Отмена"}
            </Button>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "var(--color-primary)",
              }}
            />
          </div>
        </Card>
      )}

      {file && pdfData && !extracting && (
        <Card className="mt-4 p-4 sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <FileText
              size={24}
              className="shrink-0 text-[var(--color-primary)]"
            />
            <div className="min-w-0 flex-1">
              <div
                className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold"
                title={file.name}
              >
                {file.name}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {formatFileSize(file.size, isEn)}
                {pageCount > 0 && (
                  <>
                    {" · "}
                    {pageCount} {isEn ? "pages" : "стр."}
                  </>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X size={14} />
              <span className="hidden sm:inline">
                {isEn ? "New file" : "Новый"}
              </span>
            </Button>
          </div>
        </Card>
      )}

      {pages.length > 0 && (
        <>
          {isLikelyImageOnly && (
            <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] p-3 text-sm text-[color-mix(in_oklab,var(--color-warning)_70%,black)]">
              <Warning size={18} className="mt-0.5 shrink-0" weight="fill" />
              <span>
                {isEn
                  ? `Very little text extracted (avg ${Math.round(avgCharsPerPage)} chars/page). This looks like a scanned or image-only PDF — you'll need an OCR tool to extract its content.`
                  : `Извлечено мало текста (в среднем ${Math.round(avgCharsPerPage)} симв./стр.). Похоже на отсканированный или картинный PDF — для извлечения нужен OCR.`}
              </span>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="order-1 md:col-span-12">
              <Card className="p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <MagnifyingGlass size={14} />
                    {isEn ? "Extracted text" : "Извлечённый текст"}
                    <span className="text-xs font-normal text-[var(--color-text-muted)]">
                      (
                      {format === "plain"
                        ? ".txt"
                        : format === "markdown"
                          ? ".md"
                          : ".json"}
                      )
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SmartCopy text={fullText} variant="icon" />
                    <Button
                      className="tool-primary-action"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download size={16} />
                      {isEn ? "Download" : "Скачать"}
                    </Button>
                  </div>
                </div>

                <AdvancedSettings
                  title={isEn ? "Advanced settings" : "Расширенные настройки"}
                  description={
                    isEn
                      ? "Output format, page range and line breaks"
                      : "Формат, диапазон страниц и переносы строк"
                  }
                  className="mt-4"
                >
                  {/* Options */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                        {isEn ? "Output format" : "Формат"}
                      </Label>
                      <div
                        role="radiogroup"
                        className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5"
                      >
                        {formatOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={format === opt.value}
                            onClick={() => setFormat(opt.value)}
                            className={cn(
                              "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-semibold transition-colors min-h-9",
                              format === opt.value
                                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="ptt-range"
                        className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                      >
                        {isEn ? "Page range" : "Диапазон"}
                      </Label>
                      <Input
                        id="ptt-range"
                        value={pageRangeInput}
                        onChange={(e) => setPageRangeInput(e.target.value)}
                        placeholder={isEn ? "All pages" : "Все страницы"}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                        {isEn ? "Layout" : "Раскладка"}
                      </Label>
                      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-3 text-sm">
                        <input
                          type="checkbox"
                          checked={preserveBreaks}
                          onChange={(e) => setPreserveBreaks(e.target.checked)}
                          className="h-4 w-4 accent-[var(--color-primary)]"
                        />
                        <span className="text-xs">
                          {isEn ? "Preserve line breaks" : "Разрывы строк"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      onClick={handleReExtract}
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                    >
                      <TextT size={14} />
                      {isEn ? "Apply settings" : "Применить настройки"}
                    </Button>
                  </div>
                </AdvancedSettings>
                <Textarea
                  rows={18}
                  value={fullText}
                  readOnly
                  className={cn(
                    "text-xs leading-relaxed",
                    format === "json" ? "font-mono" : "font-mono",
                  )}
                />
                <AdvancedSettings
                  title={isEn ? "Filename" : "Имя файла"}
                  className="mt-3"
                >
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <Label
                        htmlFor="ptt-outname"
                        className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                      >
                        {isEn ? "Filename" : "Имя файла"}
                      </Label>
                      <div className="flex">
                        <Input
                          id="ptt-outname"
                          value={outputName}
                          onChange={(e) => setOutputName(e.target.value)}
                          placeholder="extracted"
                          className="rounded-r-none h-8 text-xs"
                        />
                        <span className="flex items-center rounded-r-[var(--radius-md)] border border-l-0 border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-muted)] tabular-nums">
                          {format === "plain"
                            ? ".txt"
                            : format === "markdown"
                              ? ".md"
                              : ".json"}
                        </span>
                      </div>
                    </div>
                  </div>
                </AdvancedSettings>
              </Card>
            </div>
            <AdvancedSettings
              title={isEn ? "Show source PDF" : "Показать исходный PDF"}
              className="order-2 md:col-span-12"
            >
              <PdfPreview pdfData={pdfData} maxHeight={500} />
            </AdvancedSettings>
          </div>

          <div
            role="status"
            className="mt-4 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)]/20 bg-[color-mix(in_oklab,var(--color-success)_8%,transparent)] p-2 text-xs text-[var(--color-success)]"
          >
            <CheckCircle size={14} weight="fill" />
            <span>
              {isEn
                ? `Extracted ${pages.length} ${pages.length === 1 ? "page" : "pages"} · ${wordCount.toLocaleString("en-US")} words`
                : `Извлечено ${pages.length} стр. · ${wordCount.toLocaleString("ru-RU")} слов`}
            </span>
          </div>
        </>
      )}

      <output aria-live="polite" className="sr-only">
        {pages.length > 0
          ? isEn
            ? `Extraction complete: ${pages.length} pages, ${wordCount} words.`
            : `Готово: ${pages.length} страниц, ${wordCount} слов.`
          : ""}
      </output>
    </div>
  );
}
