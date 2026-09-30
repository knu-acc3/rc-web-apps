"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  GitMerge,
  Download,
  X,
  FilePdf,
  DotsSixVertical,
  Plus,
  TrashSimple,
  ImageSquare,
  CaretUp,
  CaretDown,
  CheckCircle,
  Warning,
  MagnifyingGlassPlus,
  BookmarksSimple,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  PdfDropzone,
  type PdfDropzoneHandle,
} from "@/src/components/ui/pdf-dropzone";
import { cn } from "@/src/lib/cn";
import {
  readFileAsArrayBuffer,
  downloadPdfBlob,
  formatFileSize,
  loadPdfDocument,
  renderPageToCanvas,
  loadUnicodeFontBytes,
} from "@/src/utils/pdfHelpers";
import type { PDFFont, PDFPage, PDFPageDrawTextOptions } from "pdf-lib";

interface PdfFileEntry {
  id: string;
  file: File;
  data: ArrayBuffer;
  pageCount: number;
  pageRange: string;
  thumbnail: string | null;
}

type PdfVersion = "1.4" | "1.5" | "1.7";

interface OutputMeta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

let entryId = 0;

function parsePageRanges(input: string, maxPages: number): number[] {
  const trimmed = input.trim();
  if (!trimmed) return Array.from({ length: maxPages }, (_, i) => i);

  const indices = new Set<number>();
  for (const part of trimmed.split(",")) {
    const range = part.trim();
    if (!range) continue;
    const m = range.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const start = Math.max(1, parseInt(m[1], 10));
      const end = Math.min(maxPages, parseInt(m[2], 10));
      for (let p = start; p <= end; p++) indices.add(p - 1);
    } else if (/^\d+$/.test(range)) {
      const p = parseInt(range, 10);
      if (p >= 1 && p <= maxPages) indices.add(p - 1);
    }
  }
  return indices.size === 0
    ? Array.from({ length: maxPages }, (_, i) => i)
    : [...indices].sort((a, b) => a - b);
}

function isValidRange(
  input: string,
  maxPages: number,
): { ok: boolean; selected: number } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, selected: maxPages };
  const parts = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { ok: false, selected: 0 };
  let valid = true;
  let count = 0;
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const s = parseInt(m[1], 10);
      const e = parseInt(m[2], 10);
      if (s < 1 || e > maxPages || s > e) {
        valid = false;
        break;
      }
      count += e - s + 1;
    } else if (/^\d+$/.test(p)) {
      const n = parseInt(p, 10);
      if (n < 1 || n > maxPages) {
        valid = false;
        break;
      }
      count += 1;
    } else {
      valid = false;
      break;
    }
  }
  return { ok: valid, selected: valid ? count : 0 };
}

async function renderThumbnail(data: ArrayBuffer): Promise<string | null> {
  try {
    const doc = await loadPdfDocument(data.slice(0));
    const canvas = await renderPageToCanvas(doc, 1, 0.35);
    const url = canvas.toDataURL("image/jpeg", 0.7);
    doc.destroy();
    return url;
  } catch {
    return null;
  }
}

async function renderLargeThumbnail(data: ArrayBuffer): Promise<string | null> {
  try {
    const doc = await loadPdfDocument(data.slice(0));
    const canvas = await renderPageToCanvas(doc, 1, 1.5);
    const url = canvas.toDataURL("image/jpeg", 0.85);
    doc.destroy();
    return url;
  } catch {
    return null;
  }
}

function pluralPages(n: number, isEn: boolean): string {
  if (isEn) return n === 1 ? "page" : "pages";
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "страниц";
  if (last === 1) return "страница";
  if (last >= 2 && last <= 4) return "страницы";
  return "страниц";
}

// Sanitize a file name to a clean bookmark/TOC label (drop .pdf, trim)
function fileNameLabel(name: string): string {
  return name.replace(/\.pdf$/i, "").trim() || name;
}

export default function MergePdf() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [files, setFiles] = useState<PdfFileEntry[]>([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");
  const [outputName, setOutputName] = useState("merged");
  const [compress, setCompress] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(
    null,
  );
  const dropzoneRef = useRef<PdfDropzoneHandle>(null);

  // Preview modal
  const [peekId, setPeekId] = useState<string | null>(null);
  const [peekUrl, setPeekUrl] = useState<string | null>(null);
  const peekFile = files.find((f) => f.id === peekId) || null;

  // Output options (advanced)
  const [pdfVersion, setPdfVersion] = useState<PdfVersion>("1.7");
  const [meta, setMeta] = useState<OutputMeta>({
    title: "",
    author: "",
    subject: "",
    keywords: "",
  });

  // Bookmarks / TOC
  const [insertBookmarks, setInsertBookmarks] = useState(true);
  const [insertToc, setInsertToc] = useState(false);

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setError("");
      setResult(null);

      const newEntries: PdfFileEntry[] = [];
      for (const file of selectedFiles) {
        try {
          const data = await readFileAsArrayBuffer(file);
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(data, { ignoreEncryption: true });
          const pageCount = doc.getPageCount();
          newEntries.push({
            id: `pdf_${++entryId}`,
            file,
            data,
            pageCount,
            pageRange: "",
            thumbnail: null,
          });
        } catch {
          setError(
            isEn
              ? `Failed to read "${file.name}". Make sure it is a valid PDF.`
              : `Не удалось прочитать "${file.name}". Убедитесь, что это корректный PDF.`,
          );
        }
      }

      if (newEntries.length === 0) return;
      setFiles((prev) => [...prev, ...newEntries]);

      // Render thumbnails asynchronously, one by one (don't block UI)
      for (const entry of newEntries) {
        const thumb = await renderThumbnail(entry.data);
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, thumbnail: thumb } : f)),
        );
      }
    },
    [isEn],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setResult(null);
  }, []);

  const moveFile = useCallback((id: string, direction: -1 | 1) => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx < 0) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setResult(null);
  }, []);

  const reorderTo = useCallback(
    (srcId: string, targetId: string, position: "before" | "after") => {
      setFiles((prev) => {
        const srcIdx = prev.findIndex((f) => f.id === srcId);
        const tgtIdx = prev.findIndex((f) => f.id === targetId);
        if (srcIdx < 0 || tgtIdx < 0 || srcId === targetId) return prev;
        const next = [...prev];
        const [moved] = next.splice(srcIdx, 1);
        const insertAt = next.findIndex((f) => f.id === targetId);
        const finalIdx = position === "after" ? insertAt + 1 : insertAt;
        next.splice(finalIdx, 0, moved);
        return next;
      });
      setResult(null);
    },
    [],
  );

  const updatePageRange = useCallback((id: string, value: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, pageRange: value } : f)),
    );
    setResult(null);
  }, []);

  // Open preview modal & render large thumb on demand
  const openPeek = useCallback(
    async (id: string) => {
      const entry = files.find((f) => f.id === id);
      if (!entry) return;
      setPeekId(id);
      setPeekUrl(null);
      const url = await renderLargeThumbnail(entry.data);
      // Only set if the peek wasn't closed/changed in the meantime
      setPeekId((current) => {
        if (current === id) setPeekUrl(url);
        return current;
      });
    },
    [files],
  );

  const closePeek = useCallback(() => {
    setPeekId(null);
    setPeekUrl(null);
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return;
    setMerging(true);
    setError("");
    setProgress(0);
    setResult(null);

    try {
      const pdfLib = await import("pdf-lib");
      const { PDFDocument, PDFName, PDFHexString, StandardFonts, PDFArray } =
        pdfLib;
      const merged = await PDFDocument.create();

      // Set PDF version via header
      try {
        const PDFHeader = (await import("pdf-lib/cjs/core/document/PDFHeader"))
          .default;
        const [maj, min] = pdfVersion.split(".").map((n) => parseInt(n, 10));
        merged.context.header = PDFHeader.forVersion(maj, min);
      } catch {
        // Fallback: try ESM path; if both fail, skip — file still saves fine with default version.
        try {
          const mod = (await import("pdf-lib")) as typeof import("pdf-lib") & {
            PDFHeader?: {
              forVersion?: (major: number, minor: number) => unknown;
            };
          };
          if (mod.PDFHeader?.forVersion) {
            const [maj, min] = pdfVersion
              .split(".")
              .map((n) => parseInt(n, 10));
            merged.context.header = mod.PDFHeader.forVersion(maj, min);
          }
        } catch {
          /* noop */
        }
      }

      // Track where each source's first merged page lands (1-based) for TOC/bookmarks
      const sourceStartPages: { name: string; page: number }[] = [];

      // If TOC requested, reserve approximate space — we will prepend it AFTER copying.
      // (We collect data first, then build TOC, then prepend.)

      let runningOffset = 0; // tracks pages added so far (excluding TOC)
      for (let i = 0; i < files.length; i++) {
        const entry = files[i];
        const source = await PDFDocument.load(entry.data, {
          ignoreEncryption: true,
        });
        const indices = parsePageRanges(entry.pageRange, source.getPageCount());
        if (indices.length === 0) continue;

        sourceStartPages.push({
          name: fileNameLabel(entry.file.name),
          page: runningOffset + 1,
        });

        const pages = await merged.copyPages(source, indices);
        for (const page of pages) merged.addPage(page);
        runningOffset += pages.length;
        setProgress(Math.round(((i + 1) / files.length) * 90));
      }

      // ---------- TOC page (optional) ----------
      let tocPageCount = 0;
      if (insertToc && sourceStartPages.length > 0) {
        let font: PDFFont | null = null;
        let fontBold: PDFFont | null = null;
        try {
          const fontkitModule = await import("@pdf-lib/fontkit");
          const fontkit = fontkitModule.default || fontkitModule;
          merged.registerFontkit(fontkit);
          const fontBytes = await loadUnicodeFontBytes();
          font = await merged.embedFont(fontBytes, { subset: true });
          fontBold = font;
        } catch {
          font = await merged.embedFont(StandardFonts.Helvetica);
          fontBold = await merged.embedFont(StandardFonts.HelveticaBold);
        }

        const safeDrawText = (page: PDFPage, text: string, options: PDFPageDrawTextOptions) => {
          try {
            page.drawText(text, options);
          } catch {
            try {
              const ascii = text
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\x20-\x7E]/g, "?");
              page.drawText(ascii, options);
            } catch {
              // ignore if unrenderable
            }
          }
        };

        const safeWidthOfText = (f: PDFFont | null, text: string, size: number) => {
          if (!f) return text.length * size * 0.55;
          try {
            return f.widthOfTextAtSize(text, size);
          } catch {
            return text.length * size * 0.55;
          }
        };

        const pageWidth = 595.28; // A4
        const pageHeight = 841.89;
        const marginX = 56;
        const marginTop = 72;
        const marginBottom = 56;
        const titleSize = 20;
        const lineSize = 11;
        const lineGap = 18;

        const usableHeight = pageHeight - marginTop - marginBottom;
        const linesPerPage = Math.max(
          1,
          Math.floor(usableHeight / lineGap) - 3,
        );

        tocPageCount = Math.ceil(sourceStartPages.length / linesPerPage);

        // After we insert tocPageCount pages at the front, every entry's page shifts by tocPageCount.
        const adjustedEntries = sourceStartPages.map((e) => ({
          name: e.name,
          page: e.page + tocPageCount,
        }));

        // Build TOC pages and insert them at the front (index 0).
        for (let pageIdx = 0; pageIdx < tocPageCount; pageIdx++) {
          const tocPage = merged.insertPage(pageIdx, [pageWidth, pageHeight]);

          // Title (only on first TOC page)
          if (pageIdx === 0) {
            const title = isEn ? "Contents" : "Содержание";
            safeDrawText(tocPage, title, {
              x: marginX,
              y: pageHeight - marginTop,
              size: titleSize,
              font: fontBold ?? undefined,
            });
          }

          const startEntry = pageIdx * linesPerPage;
          const endEntry = Math.min(
            startEntry + linesPerPage,
            adjustedEntries.length,
          );
          let y =
            pageHeight - marginTop - (pageIdx === 0 ? titleSize + 28 : 12);

          for (let j = startEntry; j < endEntry; j++) {
            const entry = adjustedEntries[j];
            const pageStr = String(entry.page);
            // Width budgeting — truncate name if too long
            const pageStrWidth = safeWidthOfText(font, pageStr, lineSize);
            const maxNameWidth = pageWidth - marginX * 2 - pageStrWidth - 18;
            let name = entry.name;
            let nameWidth = safeWidthOfText(font, name, lineSize);
            if (nameWidth > maxNameWidth) {
              while (
                name.length > 1 &&
                safeWidthOfText(font, name + "…", lineSize) > maxNameWidth
              ) {
                name = name.slice(0, -1);
              }
              name = name + "…";
              nameWidth = safeWidthOfText(font, name, lineSize);
            }

            // Dot leaders
            const dotStart = marginX + nameWidth + 6;
            const dotEnd = pageWidth - marginX - pageStrWidth - 6;
            const dotWidth = safeWidthOfText(font, ".", lineSize);
            const dotCount = Math.max(
              0,
              Math.floor((dotEnd - dotStart) / Math.max(dotWidth, 1)),
            );
            const dots = ".".repeat(dotCount);

            safeDrawText(tocPage, name, {
              x: marginX,
              y,
              size: lineSize,
              font: font ?? undefined,
            });
            if (dotCount > 0) {
              safeDrawText(tocPage, dots, {
                x: dotStart,
                y,
                size: lineSize,
                font: font ?? undefined,
                opacity: 0.5,
              });
            }
            safeDrawText(tocPage, pageStr, {
              x: pageWidth - marginX - pageStrWidth,
              y,
              size: lineSize,
              font: font ?? undefined,
            });
            y -= lineGap;
          }
        }
      }

      // ---------- Outlines / bookmarks ----------
      if (insertBookmarks && sourceStartPages.length > 0) {
        try {
          const adjustedEntries = sourceStartPages.map((e) => ({
            name: e.name,
            page: e.page + tocPageCount, // shift by TOC pages added at front
          }));

          const pages = merged.getPages();
          const context = merged.context;

          // Build outline item refs first (so siblings can reference each other)
          const itemRefs = adjustedEntries.map(() => context.nextRef());

          // Outlines root ref
          const outlinesRef = context.nextRef();

          // pdf-lib's `context.obj({...})` overload uses `Record<string, never>` in its
          // typings, so we cast LiteralObjects through `unknown` to satisfy strict TS.
          type LiteralObj = Parameters<typeof context.obj>[0];

          // Create each outline item dict
          for (let i = 0; i < adjustedEntries.length; i++) {
            const { name, page } = adjustedEntries[i];
            const pageRef = context.getObjectRef(pages[page - 1].node);
            if (!pageRef) continue;

            const dest = context.obj([
              pageRef,
              PDFName.of("Fit"),
            ] as unknown as LiteralObj);

            const item: Record<string, unknown> = {
              Title: PDFHexString.fromText(name),
              Parent: outlinesRef,
              Dest: dest,
            };
            if (i > 0) item.Prev = itemRefs[i - 1];
            if (i < adjustedEntries.length - 1) item.Next = itemRefs[i + 1];

            const itemDict = context.obj(item as unknown as LiteralObj);
            context.assign(itemRefs[i], itemDict);
          }

          // Create outlines root dict
          const outlinesLiteral: Record<string, unknown> = {
            Type: PDFName.of("Outlines"),
            First: itemRefs[0],
            Last: itemRefs[itemRefs.length - 1],
            Count: adjustedEntries.length,
          };
          const outlinesDict = context.obj(
            outlinesLiteral as unknown as LiteralObj,
          );
          context.assign(outlinesRef, outlinesDict);

          // Wire up catalog
          merged.catalog.set(PDFName.of("Outlines"), outlinesRef);
          merged.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
        } catch {
          // Outline insertion is best-effort; failures don't affect merge.
        }
      }

      // ---------- Metadata ----------
      if (meta.title.trim()) merged.setTitle(meta.title.trim());
      if (meta.author.trim()) merged.setAuthor(meta.author.trim());
      if (meta.subject.trim()) merged.setSubject(meta.subject.trim());
      if (meta.keywords.trim()) {
        merged.setKeywords(
          meta.keywords
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }
      merged.setProducer("ulti-tools.com");
      merged.setCreator("ulti-tools.com / MergePdf");

      setProgress(95);
      const pdfBytes = await merged.save({ useObjectStreams: compress });
      setProgress(100);
      // Silence unused warning for PDFArray import used only for narrowing edge cases.
      void PDFArray;
      setResult(pdfBytes);
    } catch {
      setError(
        isEn
          ? "An error occurred while merging PDFs. Please try again."
          : "Произошла ошибка при объединении PDF. Попробуйте ещё раз.",
      );
    } finally {
      setMerging(false);
    }
  }, [files, isEn, compress, pdfVersion, meta, insertBookmarks, insertToc]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const name = (outputName.trim() || "merged").replace(/\.pdf$/i, "");
    downloadPdfBlob(result, `${name}.pdf`);
  }, [result, outputName]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setResult(null);
    setError("");
    setProgress(0);
    setOutputName("merged");
    setMeta({ title: "", author: "", subject: "", keywords: "" });
    setPdfVersion("1.7");
    setInsertBookmarks(true);
    setInsertToc(false);
    setCompress(true);
    dropzoneRef.current?.reset();
  }, []);

  const handleAddMore = useCallback(() => {
    dropzoneRef.current?.openFileDialog();
  }, []);

  // Keyboard reorder
  const handleRowKey = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault();
        moveFile(id, -1);
      } else if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault();
        moveFile(id, 1);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          removeFile(id);
        }
      }
    },
    [moveFile, removeFile],
  );

  // Cancel DnD if drop happens outside any row
  useEffect(() => {
    const onDragEnd = () => {
      setDragId(null);
      setDragOverId(null);
      setDropPosition(null);
    };
    window.addEventListener("dragend", onDragEnd);
    return () => window.removeEventListener("dragend", onDragEnd);
  }, []);

  const totalPages = files.reduce((s, f) => s + f.pageCount, 0);
  const selectedPages = files.reduce(
    (s, f) => s + parsePageRanges(f.pageRange, f.pageCount).length,
    0,
  );
  const totalSize = files.reduce((s, f) => s + f.file.size, 0);
  const estimatedSize = Math.round(
    totalSize *
      (selectedPages / Math.max(totalPages, 1)) *
      (compress ? 0.85 : 1),
  );
  const hasInvalidRange = files.some(
    (f) => !isValidRange(f.pageRange, f.pageCount).ok,
  );
  const ready = files.length >= 2 && !hasInvalidRange && selectedPages > 0;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PdfDropzone
        ref={dropzoneRef}
        accept="application/pdf,.pdf"
        multiple
        maxSizeMB={100}
        onFilesSelected={handleFilesSelected}
        supportPaste={false}
      />

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

      {files.length > 0 && (
        <Card className="mt-3 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">
              {isEn ? "Files to merge" : "Файлы для объединения"} (
              {files.length})
            </div>
            <Button
              variant="outline"
              onClick={handleAddMore}
              className="gap-1.5"
            >
              <Plus size={14} weight="bold" />
              {isEn ? "Add more" : "Добавить ещё"}
            </Button>
          </div>

          <ul
            className="flex flex-col gap-2"
            aria-label={isEn ? "PDF files" : "PDF файлы"}
          >
            {files.map((entry, idx) => {
              const validation = isValidRange(entry.pageRange, entry.pageCount);
              const isDragging = dragId === entry.id;
              const isDragOver = dragOverId === entry.id && dragId !== entry.id;
              return (
                <li key={entry.id} className="relative">
                  {isDragOver && dropPosition === "before" && (
                    <div className="absolute -top-1 left-0 right-0 z-10 h-0.5 rounded-full bg-[var(--color-primary)]" />
                  )}
                  <div
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => {
                      setDragId(entry.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", entry.id);
                    }}
                    onDragOver={(e) => {
                      if (!dragId || dragId === entry.id) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mid = rect.top + rect.height / 2;
                      setDragOverId(entry.id);
                      setDropPosition(e.clientY < mid ? "before" : "after");
                    }}
                    onDragLeave={(e) => {
                      // Only clear if leaving the element itself, not entering a child
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        if (dragOverId === entry.id) {
                          setDragOverId(null);
                          setDropPosition(null);
                        }
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const src =
                        e.dataTransfer.getData("text/plain") || dragId;
                      if (src && src !== entry.id && dropPosition) {
                        reorderTo(src, entry.id, dropPosition);
                      }
                      setDragId(null);
                      setDragOverId(null);
                      setDropPosition(null);
                    }}
                    onKeyDown={(e) => handleRowKey(e, entry.id)}
                    aria-label={
                      isEn
                        ? `${entry.file.name}, ${entry.pageCount} pages, position ${idx + 1} of ${files.length}. Alt+Up/Down to reorder, Ctrl+Backspace to remove.`
                        : `${entry.file.name}, ${entry.pageCount} страниц, позиция ${idx + 1} из ${files.length}. Alt+Up/Down для перестановки, Ctrl+Backspace для удаления.`
                    }
                    className={`flex flex-col gap-3 rounded-[var(--radius-md)] border bg-[var(--color-surface-muted)]/60 p-3 transition-all sm:flex-row sm:items-center focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] ${
                      isDragging ? "opacity-40 scale-[0.99]" : "opacity-100"
                    } ${isDragOver ? "border-[var(--color-primary)]/50" : "border-transparent"}`}
                  >
                    {/* Drag handle + position + thumbnail */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="cursor-grab touch-none text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:cursor-grabbing"
                        aria-hidden
                        title={
                          isEn ? "Drag to reorder" : "Перетащите для сортировки"
                        }
                      >
                        <DotsSixVertical size={18} weight="bold" />
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface)] text-xs font-bold tabular-nums text-[var(--color-text-muted)]">
                        {idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPeek(entry.id);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        draggable={false}
                        className="group relative flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                        aria-label={
                          isEn
                            ? "Preview first page"
                            : "Предпросмотр первой страницы"
                        }
                      >
                        {entry.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.thumbnail}
                            alt=""
                            className="h-full w-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <ImageSquare
                            size={20}
                            className="text-[var(--color-text-muted)]/40"
                          />
                        )}
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                          <MagnifyingGlassPlus
                            size={14}
                            weight="bold"
                            className="text-white"
                          />
                        </span>
                      </button>
                    </div>

                    {/* Filename + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <FilePdf
                          size={14}
                          className="shrink-0 text-[var(--color-danger)]"
                        />
                        <span className="truncate" title={entry.file.name}>
                          {entry.file.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--color-text-muted)]">
                        <span className="tabular-nums">
                          {formatFileSize(entry.file.size, isEn)}
                        </span>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">
                          {entry.pageCount} {pluralPages(entry.pageCount, isEn)}
                        </span>
                        {entry.pageRange.trim() && validation.ok && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="tabular-nums text-[var(--color-primary)]">
                              {isEn
                                ? `${validation.selected} selected`
                                : `выбрано ${validation.selected}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(entry.id)}
                      className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                      aria-label={isEn ? "Remove" : "Удалить"}
                    >
                      <TrashSimple size={18} />
                    </Button>
                  </div>
                  {isDragOver && dropPosition === "after" && (
                    <div className="absolute -bottom-1 left-0 right-0 z-10 h-0.5 rounded-full bg-[var(--color-primary)]" />
                  )}
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {!result && (
              <Button
                size="lg"
                onClick={handleMerge}
                disabled={!ready || merging}
                data-primary-action="merge-pdf"
                data-primary-state="input"
                className="tool-primary-action w-full gap-1.5 sm:w-auto"
              >
                <GitMerge size={18} />
                {merging
                  ? isEn
                    ? "Merging…"
                    : "Объединение…"
                  : isEn
                    ? `Merge ${files.length} PDFs`
                    : `Объединить ${files.length} PDF`}
              </Button>
            )}
          </div>

          <AdvancedSettings
            title={isEn ? "Merge options" : "Дополнительные настройки"}
            description={
              isEn
                ? "Page ranges, filename, metadata and navigation"
                : "Страницы, имя файла, метаданные и навигация"
            }
            className="mt-4"
          >
            <div className="mb-4 grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Pages and order" : "Страницы и порядок"}
              </div>
              {files.map((entry, idx) => {
                const validation = isValidRange(
                  entry.pageRange,
                  entry.pageCount,
                );
                return (
                  <div
                    key={entry.id}
                    className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:grid-cols-[1fr_180px_auto] sm:items-center"
                  >
                    <div className="min-w-0 truncate text-sm font-medium">
                      {entry.file.name}
                    </div>
                    <div>
                      <Input
                        value={entry.pageRange}
                        onChange={(event) =>
                          updatePageRange(entry.id, event.target.value)
                        }
                        placeholder={
                          isEn
                            ? `All pages (1-${entry.pageCount})`
                            : `Все страницы (1-${entry.pageCount})`
                        }
                        aria-label={
                          isEn
                            ? `Pages from ${entry.file.name}`
                            : `Страницы из ${entry.file.name}`
                        }
                        aria-invalid={!validation.ok}
                        className={cn(
                          !validation.ok && "border-[var(--color-danger)]/60",
                        )}
                      />
                      {!validation.ok && (
                        <div className="mt-1 text-xs text-[var(--color-danger)]">
                          {isEn
                            ? "Check the page range"
                            : "Проверьте диапазон страниц"}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveFile(entry.id, -1)}
                        disabled={idx === 0}
                        aria-label={isEn ? "Move up" : "Выше"}
                      >
                        <CaretUp size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveFile(entry.id, 1)}
                        disabled={idx === files.length - 1}
                        aria-label={isEn ? "Move down" : "Ниже"}
                      >
                        <CaretDown size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-2.5 text-center">
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Files" : "Файлов"}
                </div>
                <div className="text-lg font-bold tabular-nums">
                  {files.length}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-2.5 text-center">
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Pages" : "Страниц"}
                </div>
                <div className="text-lg font-bold tabular-nums">
                  {selectedPages !== totalPages ? (
                    <>
                      <span className="text-[var(--color-primary)]">
                        {selectedPages}
                      </span>
                      <span className="text-sm font-normal text-[var(--color-text-muted)]">
                        {" "}
                        / {totalPages}
                      </span>
                    </>
                  ) : (
                    totalPages
                  )}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-2.5 text-center">
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Source size" : "Исходный"}
                </div>
                <div className="text-lg font-bold tabular-nums">
                  {formatFileSize(totalSize, isEn)}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-2.5 text-center">
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-primary)]">
                  {isEn ? "~ Output" : "~ Результат"}
                </div>
                <div className="text-lg font-bold tabular-nums text-[var(--color-primary)]">
                  {formatFileSize(estimatedSize, isEn)}
                </div>
              </div>
            </div>

            {/* Output options */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="merge-output-name"
                  className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]"
                >
                  {isEn ? "Output filename" : "Имя файла"}
                </label>
                <div className="flex items-stretch">
                  <Input
                    id="merge-output-name"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    placeholder="merged"
                    className="rounded-r-none"
                  />
                  <span className="flex items-center rounded-r-[var(--radius-md)] border border-l-0 border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-muted)]">
                    .pdf
                  </span>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-muted)]">
                <input
                  type="checkbox"
                  checked={compress}
                  onChange={(e) => setCompress(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <span>{isEn ? "Compress output" : "Сжать результат"}</span>
              </label>
            </div>

            <div className="mt-4 grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 p-3 sm:p-4">
              {/* PDF version */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="merge-pdf-version"
                    className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]"
                  >
                    {isEn ? "PDF version" : "Версия PDF"}
                  </label>
                  <Select
                    value={pdfVersion}
                    onValueChange={(v) => setPdfVersion(v as PdfVersion)}
                  >
                    <SelectTrigger
                      id="merge-pdf-version"
                      className="h-11 text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.4">
                        {isEn ? "1.4 (Acrobat 5+)" : "1.4 (Acrobat 5+)"}
                      </SelectItem>
                      <SelectItem value="1.5">
                        {isEn ? "1.5 (Acrobat 6+)" : "1.5 (Acrobat 6+)"}
                      </SelectItem>
                      <SelectItem value="1.7">
                        {isEn
                          ? "1.7 (Acrobat 8+) — default"
                          : "1.7 (Acrobat 8+) — по умолчанию"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Document metadata" : "Метаданные документа"}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="meta-title"
                      className="mb-1 block text-[11px] text-[var(--color-text-muted)]"
                    >
                      {isEn ? "Title" : "Заголовок"}
                    </label>
                    <Input
                      id="meta-title"
                      value={meta.title}
                      onChange={(e) =>
                        setMeta((m) => ({ ...m, title: e.target.value }))
                      }
                      placeholder={isEn ? "Combined report" : "Сводный отчёт"}
                      className="h-11 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="meta-author"
                      className="mb-1 block text-[11px] text-[var(--color-text-muted)]"
                    >
                      {isEn ? "Author" : "Автор"}
                    </label>
                    <Input
                      id="meta-author"
                      value={meta.author}
                      onChange={(e) =>
                        setMeta((m) => ({ ...m, author: e.target.value }))
                      }
                      placeholder={isEn ? "Your name" : "Ваше имя"}
                      className="h-11 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="meta-subject"
                      className="mb-1 block text-[11px] text-[var(--color-text-muted)]"
                    >
                      {isEn ? "Subject" : "Тема"}
                    </label>
                    <Input
                      id="meta-subject"
                      value={meta.subject}
                      onChange={(e) =>
                        setMeta((m) => ({ ...m, subject: e.target.value }))
                      }
                      placeholder={
                        isEn ? "What this PDF is about" : "О чём этот PDF"
                      }
                      className="h-11 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="meta-keywords"
                      className="mb-1 block text-[11px] text-[var(--color-text-muted)]"
                    >
                      {isEn
                        ? "Keywords (comma-separated)"
                        : "Ключевые слова (через запятую)"}
                    </label>
                    <Input
                      id="meta-keywords"
                      value={meta.keywords}
                      onChange={(e) =>
                        setMeta((m) => ({ ...m, keywords: e.target.value }))
                      }
                      placeholder={
                        isEn ? "report, q4, finance" : "отчёт, q4, финансы"
                      }
                      className="h-11 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Bookmarks / TOC */}
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <BookmarksSimple size={12} />
                  {isEn ? "Navigation" : "Навигация"}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm transition-colors hover:bg-[var(--color-surface-muted)]/50">
                    <input
                      type="checkbox"
                      checked={insertBookmarks}
                      onChange={(e) => setInsertBookmarks(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                    />
                    <div>
                      <div className="font-medium">
                        {isEn ? "Add bookmarks" : "Добавить закладки"}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {isEn
                          ? "Each file becomes a top-level bookmark in the PDF outline panel."
                          : "Каждый файл становится закладкой верхнего уровня в панели PDF."}
                      </div>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm transition-colors hover:bg-[var(--color-surface-muted)]/50">
                    <input
                      type="checkbox"
                      checked={insertToc}
                      onChange={(e) => setInsertToc(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                    />
                    <div>
                      <div className="font-medium">
                        {isEn
                          ? "Prepend table of contents"
                          : "Добавить оглавление"}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {isEn
                          ? "Inserts a visible TOC page at the start with file names and starting page numbers."
                          : "Вставляет страницу с оглавлением в начале документа: имена файлов и номера начальных страниц."}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={merging}
                className="text-[var(--color-danger)]"
              >
                <X size={16} />
                {isEn ? "Clear all files" : "Очистить все файлы"}
              </Button>
            </div>
          </AdvancedSettings>

          {!ready && files.length >= 2 && hasInvalidRange && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-danger)]">
              <Warning size={14} />
              {isEn
                ? "Fix invalid page ranges above to merge."
                : "Исправьте неверные диапазоны страниц."}
            </div>
          )}

          {merging && (
            <div
              className="mt-3"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "var(--color-primary)",
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                {progress}%
              </div>
            </div>
          )}
        </Card>
      )}

      {result && (
        <Card className="mt-4 p-4 sm:p-5">
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle
                size={18}
                weight="fill"
                className="text-[var(--color-success)]"
              />
              {isEn ? "Merged PDF ready" : "PDF готов"}
              <span className="text-xs font-normal text-[var(--color-text-muted)]">
                ({formatFileSize(result.byteLength, isEn)})
              </span>
            </div>
            <Button
              size="lg"
              onClick={handleDownload}
              data-primary-action="merge-pdf"
              data-primary-state="result"
              className="tool-primary-action w-full gap-1.5 sm:w-auto"
            >
              <Download size={18} />
              {isEn ? "Download" : "Скачать"}
            </Button>
          </div>
        </Card>
      )}

      {/* Page preview modal */}
      <Dialog
        open={peekId !== null}
        onOpenChange={(open) => {
          if (!open) closePeek();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8" title={peekFile?.file.name}>
              {peekFile?.file.name || (isEn ? "Preview" : "Предпросмотр")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[70vh] min-h-[300px] items-center justify-center overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]/40 p-2">
            {peekUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={peekUrl}
                alt={
                  isEn ? "First page preview" : "Предпросмотр первой страницы"
                }
                className="max-h-full max-w-full rounded shadow-sm"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
                {isEn ? "Rendering…" : "Загрузка…"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <output aria-live="polite" className="sr-only">
        {result
          ? isEn
            ? `Merged ${files.length} PDFs into ${selectedPages} pages, ${formatFileSize(result.byteLength, isEn)}.`
            : `Объединено ${files.length} PDF в ${selectedPages} страниц, ${formatFileSize(result.byteLength, isEn)}.`
          : ""}
      </output>
    </div>
  );
}
