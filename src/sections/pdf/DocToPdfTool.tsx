"use client";

import { Download, FileCode, FileSpreadsheet, FileText, FileType, Image as ImageIcon, RefreshCw, Sliders, Trash2, Eye } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Select } from "@/ui/field";
import { type PaperId } from "./engine/geometry";
import { loadUnicodeFont } from "./engine/client";
import { parseDocument, parsePlainText, renderDocToPdf, type DocBlock } from "./engine/doc-to-pdf";
import { OptionsRow } from "./ui/bits";
import { baseName, pdfBlob } from "./ui/Result";

const ACCEPT =
  ".docx,.doc,.rtf,.odt,.txt,.md,.markdown,.html,.htm,.csv,.tsv,.json,.log,.xml,.png,.jpg,.jpeg,.webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/rtf,application/vnd.oasis.opendocument.text,text/plain,text/markdown,text/html,text/csv,application/json,image/jpeg,image/png,image/webp";

const T = {
  ru: {
    dropTitle: "Перетащите любой документ или нажмите для выбора",
    dropHint: "Word (.docx, .doc), OpenOffice (.odt), RTF, Markdown, HTML, TXT, CSV, сканы и фото",
    manualTab: "Вставить текст вручную",
    uploadTab: "Загрузить файл",
    pastePlaceholder: "Вставьте сюда любой текст или разметку для перевода в PDF...",
    convertBtn: "Конвертировать в PDF",
    downloadBtn: "Скачать готовый PDF",
    converting: "Генерация PDF документа...",
    paperSize: "Размер страницы",
    orient: "Ориентация",
    margins: "Поля",
    fontSize: "Размер шрифта",
    pageNumbers: "Нумерация страниц",
    papers: { a4: "A4 (210 × 297 мм)", letter: "Letter (США)", a5: "A5 (148 × 210 мм)", a3: "A3 (297 × 420 мм)" } as Record<string, string>,
    orients: { portrait: "Книжная (вертикально)", landscape: "Альбомная (горизонтально)" },
    marginsList: { "10": "Узкие (10 мм)", "15": "Обычные (15 мм)", "20": "Широкие (20 мм)" } as Record<string, string>,
    fontSizes: { "10": "Мелкий (10 pt)", "11": "Стандарт (11 pt)", "12": "Средний (12 pt)", "14": "Крупный (14 pt)" } as Record<string, string>,
    successTitle: "PDF документ успешно создан!",
    stats: (pages: number, bytes: number) => `${pages} ${pages === 1 ? "страница" : pages < 5 ? "страницы" : "страниц"} · ${(bytes / 1024).toFixed(1)} КБ`,
    reset: "Загрузить другой документ",
    previewBtn: "Открыть предпросмотр",
    fileLabel: "Исходный файл",
  },
  en: {
    dropTitle: "Drop any document here or click to browse",
    dropHint: "Word (.docx, .doc), OpenOffice (.odt), RTF, Markdown, HTML, TXT, CSV, scans and photos",
    manualTab: "Paste text manually",
    uploadTab: "Upload file",
    pastePlaceholder: "Paste any text or markdown here to convert into PDF...",
    convertBtn: "Convert to PDF",
    downloadBtn: "Download PDF file",
    converting: "Generating PDF document...",
    paperSize: "Paper size",
    orient: "Orientation",
    margins: "Margins",
    fontSize: "Font size",
    pageNumbers: "Page numbering",
    papers: { a4: "A4 (210 × 297 mm)", letter: "US Letter", a5: "A5 (148 × 210 mm)", a3: "A3 (297 × 420 mm)" } as Record<string, string>,
    orients: { portrait: "Portrait", landscape: "Landscape" },
    marginsList: { "10": "Narrow (10 mm)", "15": "Normal (15 mm)", "20": "Wide (20 mm)" } as Record<string, string>,
    fontSizes: { "10": "Small (10 pt)", "11": "Standard (11 pt)", "12": "Medium (12 pt)", "14": "Large (14 pt)" } as Record<string, string>,
    successTitle: "PDF document generated successfully!",
    stats: (pages: number, bytes: number) => `${pages} ${pages === 1 ? "page" : "pages"} · ${(bytes / 1024).toFixed(1)} KB`,
    reset: "Upload another document",
    previewBtn: "Open preview",
    fileLabel: "Source file",
  },
} as const;

function fileIcon(name: string) {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "docx" || ext === "doc" || ext === "odt" || ext === "rtf") return <FileText className="size-5 text-neutral-800 dark:text-neutral-200" />;
  if (ext === "csv" || ext === "tsv") return <FileSpreadsheet className="size-5 text-neutral-800 dark:text-neutral-200" />;
  if (ext === "html" || ext === "json" || ext === "md") return <FileCode className="size-5 text-neutral-800 dark:text-neutral-200" />;
  if (/^(png|jpg|jpeg|webp|avif)$/.test(ext ?? "")) return <ImageIcon className="size-5 text-neutral-800 dark:text-neutral-200" />;
  return <FileType className="size-5 text-neutral-800 dark:text-neutral-200" />;
}

export default function DocToPdfTool({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();

  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [paper, setPaper] = useState<PaperId>("a4");
  const [orient, setOrient] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState<string>("15");
  const [fontSize, setFontSize] = useState<string>("11");
  const [pageNumbers, setPageNumbers] = useState(true);

  // Output
  const [pdfResult, setPdfResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
    size: number;
    pagesEstimate: number;
  } | null>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (pdfResult?.url) URL.revokeObjectURL(pdfResult.url);
    };
  }, [pdfResult]);

  async function handleConvert(sourceFile?: File, sourceText?: string) {
    const curFile = sourceFile ?? file;
    const curText = sourceText ?? textInput;

    if (!curFile && !curText.trim()) return;

    setLoading(true);
    setError(null);
    setPdfResult(null);

    try {
      let blocks: DocBlock[] = [];
      let docTitle = "document";

      if (activeTab === "file" && curFile) {
        docTitle = baseName(curFile.name);
        const bytes = await curFile.arrayBuffer();
        const res = await parseDocument({ name: curFile.name, bytes });
        blocks = res.blocks;
      } else {
        docTitle = "document";
        blocks = parsePlainText(curText);
      }

      if (blocks.length === 0) {
        throw new Error(locale === "ru" ? "Документ пуст или не содержит читаемого текста" : "Document is empty or contains no readable text");
      }

      // Load unicode font (NotoSans with Cyrillic)
      const fontBytes = await loadUnicodeFont();

      const pdfBytes = await renderDocToPdf(blocks, {
        title: docTitle,
        paper,
        orientation: orient,
        marginMm: Number(margin),
        fontSize: Number(fontSize),
        lineSpacing: 1.35,
        showPageNumbers: pageNumbers,
        locale,
        fontBytes,
      });

      const blob = pdfBlob(pdfBytes);
      const url = URL.createObjectURL(blob);
      const finalName = `${docTitle}.pdf`;

      // Approximate pages count based on doc-to-pdf output
      setPdfResult({
        blob,
        url,
        filename: finalName,
        size: pdfBytes.length,
        pagesEstimate: Math.max(1, Math.round(blocks.length / 5)),
      });
    } catch (err) {
      console.error("PDF conversion error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleFileDrop(files: File[]) {
    if (!files.length) return;
    const selected = files[0];
    setFile(selected);
    setError(null);
    void handleConvert(selected);
  }

  function handleReset() {
    setFile(null);
    setTextInput("");
    setPdfResult(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tab Switcher */}
      <div className="flex w-fit rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab("file");
            setError(null);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "file"
              ? "bg-white text-neutral-950 shadow-xs dark:bg-neutral-900 dark:text-white"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          }`}
        >
          {t.uploadTab}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("text");
            setError(null);
          }}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "text"
              ? "bg-white text-neutral-950 shadow-xs dark:bg-neutral-900 dark:text-white"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          }`}
        >
          {t.manualTab}
        </button>
      </div>

      {/* Main Input Area */}
      {!pdfResult && (
        <>
          {activeTab === "file" ? (
            <div className="flex flex-col gap-3">
              <Dropzone onFiles={handleFileDrop} accept={ACCEPT} title={t.dropTitle} hint={t.dropHint} />

              {file && (
                <div className="flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-xs dark:bg-neutral-800">
                      {fileIcon(file.name)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">{file.name}</span>
                      <span className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} КБ</span>
                    </div>
                  </div>
                  <Button size="icon-sm" variant="ghost" onClick={handleReset} title="Удалить">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t.pastePlaceholder}
                rows={9}
                className="w-full rounded-2xl border border-neutral-200 bg-white p-4 font-mono text-sm leading-relaxed text-neutral-900 outline-none transition focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white dark:focus:ring-white"
              />
            </div>
          )}

          {/* Settings Options Row */}
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-neutral-700 dark:text-neutral-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Параметры PDF
              </span>
            </div>

            <OptionsRow>
              <Field label={t.paperSize} htmlFor={`${id}-paper`} className="w-48">
                <Select id={`${id}-paper`} value={paper} onChange={(e) => setPaper(e.target.value as PaperId)}>
                  {Object.entries(t.papers).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.orient} htmlFor={`${id}-orient`} className="w-44">
                <Select id={`${id}-orient`} value={orient} onChange={(e) => setOrient(e.target.value as typeof orient)}>
                  {Object.entries(t.orients).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.margins} htmlFor={`${id}-margin`} className="w-40">
                <Select id={`${id}-margin`} value={margin} onChange={(e) => setMargin(e.target.value)}>
                  {Object.entries(t.marginsList).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t.fontSize} htmlFor={`${id}-fs`} className="w-40">
                <Select id={`${id}-fs`} value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
                  {Object.entries(t.fontSizes).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>

              <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={pageNumbers}
                  onChange={(e) => setPageNumbers(e.target.checked)}
                  className="size-4 rounded-sm accent-neutral-950 dark:accent-white"
                />
                <span>{t.pageNumbers}</span>
              </label>
            </OptionsRow>
          </div>

          {/* Action Button */}
          <Button
            variant="primary"
            size="lg"
            disabled={loading || (activeTab === "file" && !file) || (activeTab === "text" && !textInput.trim())}
            onClick={() => handleConvert()}
            className="w-full sm:w-auto sm:min-w-64"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 animate-spin" />
                <span>{t.converting}</span>
              </div>
            ) : (
              <span>{t.convertBtn}</span>
            )}
          </Button>
        </>
      )}

      {/* Error Notice */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* Result Card */}
      {pdfResult && (
        <div className="flex flex-col gap-5 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
              <FileText className="size-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-neutral-950 dark:text-white">{t.successTitle}</span>
              <span className="text-xs font-semibold text-neutral-500">
                {pdfResult.filename} · {(pdfResult.size / 1024).toFixed(1)} КБ
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => downloadBlob(pdfResult.blob, pdfResult.filename)}
              className="flex-1 sm:flex-initial sm:min-w-56"
            >
              <Download className="size-4" />
              <span>{t.downloadBtn}</span>
            </Button>

            <a
              href={pdfResult.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Eye className="size-4" />
              <span>{t.previewBtn}</span>
            </a>

            <Button variant="ghost" size="lg" onClick={handleReset}>
              <RefreshCw className="size-4" />
              <span>{t.reset}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
