"use client";

import { useState, useCallback } from "react";
import { Download, FileText } from "@phosphor-icons/react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { PdfDropzone, PdfPreview } from "@/src/components/ui/pdf-dropzone";
import {
  readFileAsArrayBuffer,
  downloadPdfBlob,
  formatFileSize,
} from "@/src/utils/pdfHelpers";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { PDFDocument, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { useLanguage } from "@/src/i18n/LanguageContext";
import {
  assertSafeDocxArchive,
  DOCX_ARCHIVE_LIMITS,
} from "@/src/lib/docxSecurity";

const PAGE_SIZES = {
  A4: { w: 595.28, h: 841.89 },
  Letter: { w: 612, h: 792 },
  Legal: { w: 612, h: 1008 },
} as const;
type PageSize = keyof typeof PAGE_SIZES;
const MARGIN = 50;
const UNICODE_FONT_URL = "/fonts/NotoSans-Regular.ttf";

let unicodeFontPromise: Promise<ArrayBuffer> | null = null;

function loadUnicodeFont(): Promise<ArrayBuffer> {
  unicodeFontPromise ??= fetch(UNICODE_FONT_URL, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok)
        throw new Error(`Unable to load Unicode font (${response.status})`);
      return response.arrayBuffer();
    })
    .catch((error: unknown) => {
      unicodeFontPromise = null;
      throw error;
    });
  return unicodeFontPromise;
}

function splitLongWord(
  word: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const character of Array.from(word)) {
    const candidate = current + character;
    if (current && font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [""];
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let currentLine = "";

  for (const word of words) {
    if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      const chunks = splitLongWord(word, font, fontSize, maxWidth);
      lines.push(...chunks.slice(0, -1));
      currentLine = chunks.at(-1) ?? "";
      continue;
    }

    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push("");
  return lines;
}

export default function WordToPdf() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");
  const [paragraphCount, setParagraphCount] = useState(0);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [fontSize, setFontSize] = useState(12);
  const [lineSpacing, setLineSpacing] = useState<1 | 1.15 | 1.5 | 2>(1.15);
  const [outputName, setOutputName] = useState("");

  const handleFile = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;

      setFile(f);
      setError("");
      setResult(null);
      setConverting(true);
      setOutputName(f.name.replace(/\.docx$/i, ""));

      const PAGE = PAGE_SIZES[pageSize];
      const PAGE_WIDTH = PAGE.w;
      const PAGE_HEIGHT = PAGE.h;
      const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;
      const FONT_SIZE = fontSize;
      const LINE_HEIGHT = fontSize * 1.33 * lineSpacing;

      try {
        const buffer = await readFileAsArrayBuffer(f);

        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(buffer);
        assertSafeDocxArchive(zip.files, buffer.byteLength);

        const docXmlFile = zip.file("word/document.xml");
        if (!docXmlFile) {
          throw new Error("Invalid DOCX: word/document.xml not found");
        }

        const xmlBytes = await docXmlFile.async("uint8array");
        if (xmlBytes.byteLength > DOCX_ARCHIVE_LIMITS.maxDocumentXmlBytes) {
          throw new Error("DOCX document XML exceeds the safe size limit.");
        }
        const xmlContent = new TextDecoder("utf-8").decode(xmlBytes);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

        const paragraphs: string[] = [];
        const pElements = xmlDoc.getElementsByTagName("w:p");

        for (let i = 0; i < pElements.length; i++) {
          const wP = pElements[i];
          const tElements = wP.getElementsByTagName("w:t");
          const texts: string[] = [];
          for (let j = 0; j < tElements.length; j++) {
            texts.push(tElements[j].textContent ?? "");
          }
          paragraphs.push(texts.join(""));
        }

        setParagraphCount(paragraphs.length);
        const wc = paragraphs.reduce(
          (sum, p) => sum + (p.trim() ? p.trim().split(/\s+/).length : 0),
          0,
        );
        setWordCount(wc);

        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        const fontBytes = await loadUnicodeFont();
        const font = await pdfDoc.embedFont(fontBytes, { subset: true });

        let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        let yPos = PAGE_HEIGHT - MARGIN;
        let pageNum = 1;

        for (const para of paragraphs) {
          if (!para.trim()) {
            yPos -= LINE_HEIGHT;
            if (yPos < MARGIN) {
              page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              yPos = PAGE_HEIGHT - MARGIN;
              pageNum++;
            }
            continue;
          }

          const lines = wrapText(para, font, FONT_SIZE, USABLE_WIDTH);

          for (const line of lines) {
            if (yPos < MARGIN + LINE_HEIGHT) {
              page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              yPos = PAGE_HEIGHT - MARGIN;
              pageNum++;
            }

            page.drawText(line, {
              x: MARGIN,
              y: yPos,
              size: FONT_SIZE,
              font,
            });

            yPos -= LINE_HEIGHT;
          }

          yPos -= LINE_HEIGHT * 0.5;
        }

        setPdfPageCount(pageNum);

        const pdfBytes = await pdfDoc.save();
        setResult(pdfBytes);
      } catch {
        setError(
          isEn
            ? "Failed to convert DOCX to PDF. The file or the local Unicode font could not be read."
            : "Не удалось конвертировать DOCX в PDF. Не удалось прочитать файл или локальный Unicode-шрифт.",
        );
      } finally {
        setConverting(false);
      }
    },
    [isEn, pageSize, fontSize, lineSpacing],
  );

  const handleDownload = () => {
    if (!result) return;
    const baseName =
      outputName.trim() || file?.name.replace(/\.docx$/i, "") || "converted";
    downloadPdfBlob(result, `${baseName}.pdf`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {!file && (
        <>
          <PdfDropzone
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            maxSizeMB={50}
            onFilesSelected={handleFile}
            supportPaste={false}
          />

          <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] p-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text)]">
              {isEn ? "Note: " : "Обратите внимание: "}
            </span>
            {isEn
              ? "This browser-based converter preserves paragraphs and plain text. Complex nested tables, embedded graphics, and proprietary Word layout objects are converted as text."
              : "Данный конвертер в браузере сохраняет абзацы и текст. Сложные таблицы, графические объекты и разметка Word преобразуются в текстовом виде."}
          </div>
        </>
      )}

      {error && (
        <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {converting && (
        <Card className="mt-4 p-4 sm:p-6">
          <div className="mb-2 text-sm text-[var(--color-text-muted)]">
            {isEn ? "Converting DOCX to PDF..." : "Конвертация DOCX в PDF..."}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div
              className="h-full transition-all duration-300"
              style={{ width: "100%", background: "var(--color-primary)" }}
            />
          </div>
        </Card>
      )}

      {result && (
        <>
          <Card className="mt-4 p-4 sm:p-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold">
                  {isEn ? "Filename:" : "Имя файла:"}
                </span>
                <input
                  type="text"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  className="h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
                />
                <span className="text-sm text-[var(--color-text-muted)]">
                  .pdf
                </span>
              </div>
              <Button onClick={handleDownload} className="tool-primary-action">
                <Download size={18} />
                {isEn ? "Download PDF" : "Скачать PDF"}
              </Button>
            </div>
            <p className="mb-3 text-xs text-[var(--color-text-muted)]">
              {pdfPageCount} {isEn ? "pages" : "стр."} ·{" "}
              {wordCount.toLocaleString()} {isEn ? "words" : "слов"} ·{" "}
              {paragraphCount} {isEn ? "paragraphs" : "абзацев"} ·{" "}
              {file ? formatFileSize(file.size, isEn) : "—"}
            </p>
            <PdfPreview pdfData={result} maxHeight={550} />
          </Card>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setFile(null);
                setResult(null);
                setError("");
                setParagraphCount(0);
                setPdfPageCount(0);
                setWordCount(0);
                setOutputName("");
              }}
            >
              <FileText size={18} />
              {isEn ? "Upload another DOCX" : "Загрузить другой DOCX"}
            </Button>
          </div>
        </>
      )}

      {!file && (
        <AdvancedSettings
          title={isEn ? "Advanced settings" : "Расширенные настройки"}
          description={
            isEn
              ? "Page size, font size and line spacing"
              : "Размер страницы, шрифт и межстрочный интервал"
          }
          className="mb-3 mt-3"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <span className="font-semibold">
                {isEn ? "Page:" : "Страница:"}
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSize)}
                className="h-7 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"
              >
                {Object.keys(PAGE_SIZES).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="font-semibold">{isEn ? "Font:" : "Шрифт:"}</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="h-7 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"
              >
                {[10, 11, 12, 14, 16].map((s) => (
                  <option key={s} value={s}>
                    {s}pt
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="font-semibold">{isEn ? "Line:" : "Линии:"}</span>
              <select
                value={lineSpacing}
                onChange={(e) =>
                  setLineSpacing(
                    parseFloat(e.target.value) as 1 | 1.15 | 1.5 | 2,
                  )
                }
                className="h-7 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"
              >
                <option value={1}>Single</option>
                <option value={1.15}>1.15</option>
                <option value={1.5}>1.5</option>
                <option value={2}>Double</option>
              </select>
            </label>
          </div>
        </AdvancedSettings>
      )}
    </div>
  );
}
