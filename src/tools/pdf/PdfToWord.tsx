"use client";

import { useState, useCallback, useRef } from "react";
import {
  Download,
  FileText,
  FilePdf,
  X,
  StopCircle,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PdfDropzone } from "@/src/components/ui/pdf-dropzone";
import { cn } from "@/src/lib/cn";
import {
  readFileAsArrayBuffer,
  loadPdfDocument,
  formatFileSize,
} from "@/src/utils/pdfHelpers";
import { downloadBlob } from "@/src/utils/exportHelpers";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";

interface TextItem {
  str: string;
  transform: number[];
  hasEOL?: boolean;
}

type LineSpacing = "single" | "1.15" | "1.5" | "double";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parsePageRange(input: string, total: number): number[] {
  if (!input.trim()) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>();
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const s = Math.max(1, parseInt(m[1], 10));
      const e = Math.min(total, parseInt(m[2], 10));
      for (let i = s; i <= e; i++) pages.add(i);
    } else if (/^\d+$/.test(trimmed)) {
      const n = parseInt(trimmed, 10);
      if (n >= 1 && n <= total) pages.add(n);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

function extractParagraphs(
  items: TextItem[],
  preserveBreaks: boolean,
): string[] {
  if (items.length === 0) return [];
  if (!preserveBreaks) {
    // Naive: join everything, split on double-spaces as paragraph hint
    const all = items
      .map((i) => i.str)
      .join(" ")
      .trim();
    return all
      .split(/\s{2,}|\n\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Use Y coord to detect line breaks; consolidate consecutive non-empty lines into paragraphs.
  const lines: string[] = [];
  let prevY: number | null = null;
  let lineParts: string[] = [];
  const flushLine = () => {
    if (lineParts.length > 0) {
      const line = lineParts.join(" ").replace(/\s+/g, " ").trim();
      if (line) lines.push(line);
      lineParts = [];
    }
  };
  for (const item of items) {
    const y = item.transform?.[5] ?? 0;
    if (prevY !== null && Math.abs(prevY - y) > 2) flushLine();
    if (item.str.trim() || lineParts.length > 0) lineParts.push(item.str);
    if (item.hasEOL) flushLine();
    prevY = y;
  }
  flushLine();
  // Group lines into paragraphs: blank line = paragraph break. Since we drop blank lines,
  // use simpler heuristic: 1+ contiguous non-empty lines = 1 paragraph if they look continuous
  // (no double-spacing detected). For simplicity, each line becomes its own paragraph.
  return lines;
}

const SPACING_VALUES: Record<LineSpacing, string> = {
  single: "240",
  "1.15": "276",
  "1.5": "360",
  double: "480",
};

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

function buildDocumentXml(
  paragraphs: string[],
  fontSizePt: number,
  spacing: LineSpacing,
): string {
  // OOXML uses half-points for sz: 22 = 11pt, 24 = 12pt
  const sz = fontSizePt * 2;
  const lineSpacing = SPACING_VALUES[spacing];
  const body = paragraphs
    .map(
      (p) =>
        `    <w:p><w:pPr><w:spacing w:line="${lineSpacing}" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:sz w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${escapeXml(p)}</w:t></w:r></w:p>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${body}
  </w:body>
</w:document>`;
}

export default function PdfToWord() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [pageRange, setPageRange] = useState("");
  const [preserveBreaks, setPreserveBreaks] = useState(true);
  const [fontSize, setFontSize] = useState(11);
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("1.15");
  const [outputName, setOutputName] = useState("converted");
  const [avgCharsPerPage, setAvgCharsPerPage] = useState(0);
  const cancelRef = useRef(false);

  const doConvert = useCallback(
    async (buffer: ArrayBuffer) => {
      setConverting(true);
      setProgress(0);
      setError("");
      setResult(null);
      setPageCount(0);
      setWordCount(0);
      setParagraphCount(0);
      setAvgCharsPerPage(0);
      cancelRef.current = false;

      try {
        const doc = await loadPdfDocument(buffer.slice(0));
        const total = doc.numPages;
        setPageCount(total);
        const targets = parsePageRange(pageRange, total);

        const allParagraphs: string[] = [];
        let totalChars = 0;
        for (let i = 0; i < targets.length; i++) {
          if (cancelRef.current) break;
          const pageNum = targets[i];
          const page = await doc.getPage(pageNum);
          const content = await page.getTextContent();
          const items = content.items as TextItem[];
          const paragraphs = extractParagraphs(items, preserveBreaks);
          allParagraphs.push(...paragraphs);
          if (paragraphs.length > 0) {
            // Add blank paragraph between pages for visual separation
            allParagraphs.push("");
          }
          totalChars += paragraphs.reduce((s, p) => s + p.length, 0);
          setProgress(Math.round(((i + 1) / targets.length) * 100));
        }

        doc.destroy();

        if (cancelRef.current) {
          setConverting(false);
          return;
        }

        const totalWords = allParagraphs.reduce((sum, p) => {
          const words = p.trim().split(/\s+/).filter(Boolean);
          return sum + words.length;
        }, 0);
        setWordCount(totalWords);
        setParagraphCount(allParagraphs.filter((p) => p.length > 0).length);
        setAvgCharsPerPage(
          targets.length > 0 ? Math.round(totalChars / targets.length) : 0,
        );

        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
        zip.file("_rels/.rels", RELS_XML);
        zip.file("word/_rels/document.xml.rels", DOCUMENT_RELS_XML);
        zip.file(
          "word/document.xml",
          buildDocumentXml(allParagraphs, fontSize, lineSpacing),
        );

        const blob = await zip.generateAsync({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        setResult(blob);
      } catch {
        setError(
          isEn
            ? "Failed to convert PDF to DOCX. The file may be corrupted or password-protected."
            : "Не удалось конвертировать PDF в DOCX. Файл может быть повреждён или защищён паролем.",
        );
      } finally {
        setConverting(false);
      }
    },
    [isEn, pageRange, preserveBreaks, fontSize, lineSpacing],
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
        await doConvert(buffer);
      } catch {
        setError(
          isEn ? "Failed to read the PDF." : "Не удалось прочитать PDF.",
        );
      }
    },
    [isEn, doConvert],
  );

  const handleReConvert = useCallback(async () => {
    if (!pdfData) return;
    await doConvert(pdfData);
  }, [pdfData, doConvert]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const handleDownload = () => {
    if (!result) return;
    const name = (outputName.trim() || "converted").replace(/\.docx$/i, "");
    downloadBlob(result, `${name}.docx`);
  };

  const handleReset = useCallback(() => {
    cancelRef.current = true;
    setFile(null);
    setPdfData(null);
    setResult(null);
    setError("");
    setPageCount(0);
    setWordCount(0);
    setParagraphCount(0);
    setProgress(0);
    setPageRange("");
    setPreserveBreaks(true);
    setFontSize(11);
    setLineSpacing("1.15");
    setOutputName("converted");
    setAvgCharsPerPage(0);
  }, []);

  const isLikelyImageOnly = wordCount > 0 && avgCharsPerPage < 50;

  const fontSizeOptions = [10, 11, 12, 14];
  const spacingOptions: { value: LineSpacing; label: string }[] = [
    { value: "single", label: isEn ? "Single" : "Одинарный" },
    { value: "1.15", label: "1.15" },
    { value: "1.5", label: "1.5" },
    { value: "double", label: isEn ? "Double" : "Двойной" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-3 flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <Warning size={16} className="mt-0.5 shrink-0" weight="fill" />
        <span>
          {isEn
            ? "Text only — images, tables and complex layout are not preserved."
            : "Только текст — изображения, таблицы и сложная вёрстка не сохраняются."}
        </span>
      </div>

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
          className="mt-3 flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
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

      {file && (
        <Card className="mt-4 p-4 sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <FilePdf
              size={24}
              className="shrink-0 text-[var(--color-danger)]"
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={converting}
            >
              <X size={14} />
              <span className="hidden sm:inline">
                {isEn ? "New file" : "Новый"}
              </span>
            </Button>
          </div>

          {/* Actions */}
          <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
            {converting ? (
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-[var(--color-danger)] text-[var(--color-danger)] gap-1.5"
              >
                <StopCircle size={18} />
                {isEn ? "Cancel" : "Отменить"}
              </Button>
            ) : result ? (
              <>
                <Button
                  onClick={handleDownload}
                  data-primary-action="pdf-to-word"
                  data-primary-state="result"
                  className="tool-primary-action sm:order-1"
                >
                  <Download size={18} />
                  {isEn ? "Download .docx" : "Скачать .docx"}
                </Button>
                <Button
                  onClick={handleReConvert}
                  variant="outline"
                  className="gap-1.5 sm:order-2"
                >
                  <FileText size={18} />
                  {isEn ? "Apply settings" : "Применить настройки"}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleReConvert}
                data-primary-action="pdf-to-word"
                data-primary-state="ready"
                className="tool-primary-action gap-1.5"
              >
                <FileText size={18} />
                {isEn ? "Convert to DOCX" : "Конвертировать в DOCX"}
              </Button>
            )}
          </div>

          <AdvancedSettings
            title={isEn ? "Advanced settings" : "Расширенные настройки"}
            description={
              isEn
                ? "Page range, line breaks, font, spacing and filename"
                : "Страницы, переносы, шрифт, интервал и имя файла"
            }
            className="mt-4"
          >
            {/* Options grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label
                  htmlFor="ptw-range"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                >
                  {isEn ? "Page range" : "Диапазон страниц"}
                </Label>
                <Input
                  id="ptw-range"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder={
                    isEn ? `All (1-${pageCount})` : `Все (1-${pageCount})`
                  }
                  disabled={converting}
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
                    disabled={converting}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <span className="text-xs">
                    {isEn ? "Preserve line breaks" : "Разрывы строк"}
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Font size" : "Размер шрифта"}
                </Label>
                <div role="radiogroup" className="flex flex-wrap gap-1">
                  {fontSizeOptions.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      role="radio"
                      aria-checked={fontSize === sz}
                      onClick={() => setFontSize(sz)}
                      disabled={converting}
                      className={cn(
                        "min-h-8 rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-semibold transition-colors tabular-nums",
                        fontSize === sz
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      {sz}pt
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Line spacing" : "Межстрочный"}
                </Label>
                <div role="radiogroup" className="flex flex-wrap gap-1">
                  {spacingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={lineSpacing === opt.value}
                      onClick={() => setLineSpacing(opt.value)}
                      disabled={converting}
                      className={cn(
                        "min-h-8 rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-semibold transition-colors",
                        lineSpacing === opt.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Label
                htmlFor="ptw-outname"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
              >
                {isEn ? "Output filename" : "Имя файла"}
              </Label>
              <div className="flex">
                <Input
                  id="ptw-outname"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  placeholder="converted"
                  className="rounded-r-none"
                  disabled={converting}
                />
                <span className="flex items-center rounded-r-[var(--radius-md)] border border-l-0 border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-muted)]">
                  .docx
                </span>
              </div>
            </div>
          </AdvancedSettings>

          {converting && (
            <div
              className="mt-3"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)] tabular-nums">
                <span>{isEn ? "Converting…" : "Конвертация…"}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "var(--color-primary)",
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {result && (
        <>
          {isLikelyImageOnly && (
            <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] p-3 text-sm text-[color-mix(in_oklab,var(--color-warning)_70%,black)]">
              <Warning size={18} className="mt-0.5 shrink-0" weight="fill" />
              <span>
                {isEn
                  ? `Very little text extracted (avg ${avgCharsPerPage} chars/page). This looks like a scanned or image-only PDF — DOCX will be mostly empty. Use an OCR tool instead.`
                  : `Извлечено мало текста (в среднем ${avgCharsPerPage} симв./стр.). PDF выглядит как сканированный — DOCX будет почти пустым. Нужен OCR.`}
              </span>
            </div>
          )}

          <div
            role="status"
            className="mt-4 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)]/20 bg-[color-mix(in_oklab,var(--color-success)_8%,transparent)] p-2 text-xs text-[var(--color-success)]"
          >
            <CheckCircle size={14} weight="fill" />
            <span>
              {isEn
                ? `DOCX ready · ${wordCount.toLocaleString("en-US")} words · ${formatFileSize(result.size, isEn)}`
                : `DOCX готов · ${wordCount.toLocaleString("ru-RU")} слов · ${formatFileSize(result.size, isEn)}`}
            </span>
          </div>
        </>
      )}

      <output aria-live="polite" className="sr-only">
        {result
          ? isEn
            ? `DOCX ready: ${wordCount} words in ${paragraphCount} paragraphs.`
            : `DOCX готов: ${wordCount} слов в ${paragraphCount} абзацах.`
          : ""}
      </output>
    </div>
  );
}
