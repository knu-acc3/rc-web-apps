"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  Scissors,
  Download,
  FileZip,
  FilePdf,
  X,
  Check,
  ImageSquare,
  ListNumbers,
  Trash,
  Stack,
  Lightning,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { PdfDropzone } from "@/src/components/ui/pdf-dropzone";
import { cn } from "@/src/lib/cn";
import {
  readFileAsArrayBuffer,
  downloadPdfBlob,
  formatFileSize,
  loadPdfDocument,
  renderPageToCanvas,
} from "@/src/utils/pdfHelpers";
import { downloadBlob } from "@/src/utils/exportHelpers";

type SplitMode = "extract" | "individual" | "ranges" | "everyN" | "remove";

interface SplitResult {
  label: string;
  data: Uint8Array;
  pageCount: number;
}

interface PlannedOutput {
  label: string;
  pages: number[]; // 1-based for display
  pageCount: number;
  estBytes: number;
}

function parseRanges(input: string, maxPage: number): number[][] | string {
  const trimmed = input.trim();
  if (!trimmed) return "empty";

  const groups: number[][] = [];
  for (const part of trimmed.split(",")) {
    const segment = part.trim();
    if (!segment) continue;
    const m = segment.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const start = parseInt(m[1], 10);
      const end = parseInt(m[2], 10);
      if (start < 1 || end < 1 || start > maxPage || end > maxPage)
        return "out_of_range";
      if (start > end) return "invalid";
      const pages: number[] = [];
      for (let p = start; p <= end; p++) pages.push(p - 1);
      groups.push(pages);
    } else if (/^\d+$/.test(segment)) {
      const num = parseInt(segment, 10);
      if (num < 1 || num > maxPage) return "out_of_range";
      groups.push([num - 1]);
    } else {
      return "invalid";
    }
  }
  return groups.length === 0 ? "empty" : groups;
}

function parseRemovePages(input: string, maxPage: number): number[] | string {
  const trimmed = input.trim();
  if (!trimmed) return "empty";
  const toRemove = new Set<number>();
  for (const part of trimmed.split(",")) {
    const segment = part.trim();
    if (!segment) continue;
    const m = segment.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const start = parseInt(m[1], 10);
      const end = parseInt(m[2], 10);
      if (start < 1 || end < 1 || start > maxPage || end > maxPage)
        return "out_of_range";
      if (start > end) return "invalid";
      for (let p = start; p <= end; p++) toRemove.add(p);
    } else if (/^\d+$/.test(segment)) {
      const num = parseInt(segment, 10);
      if (num < 1 || num > maxPage) return "out_of_range";
      toRemove.add(num);
    } else {
      return "invalid";
    }
  }
  if (toRemove.size === 0) return "empty";
  if (toRemove.size === maxPage) return "all_removed";
  const keep: number[] = [];
  for (let p = 1; p <= maxPage; p++) if (!toRemove.has(p)) keep.push(p - 1);
  return keep;
}

/** Parse a single pages-list string (used for extract & remove): "1,3-5" → 1-based pages set. */
function parsePagesList(input: string, maxPage: number): Set<number> | string {
  const trimmed = input.trim();
  if (!trimmed) return "empty";
  const result = new Set<number>();
  for (const part of trimmed.split(",")) {
    const segment = part.trim();
    if (!segment) continue;
    const m = segment.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const start = parseInt(m[1], 10);
      const end = parseInt(m[2], 10);
      if (start < 1 || end < 1 || start > maxPage || end > maxPage)
        return "out_of_range";
      if (start > end) return "invalid";
      for (let p = start; p <= end; p++) result.add(p);
    } else if (/^\d+$/.test(segment)) {
      const num = parseInt(segment, 10);
      if (num < 1 || num > maxPage) return "out_of_range";
      result.add(num);
    } else {
      return "invalid";
    }
  }
  return result.size === 0 ? "empty" : result;
}

/** Convert a sorted set of 1-based page numbers into compact "1-3, 5, 7-9" form */
function pagesToRangeString(pages: number[]): string {
  if (pages.length === 0) return "";
  const sorted = [...pages].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      parts.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = sorted[i];
      prev = sorted[i];
    }
  }
  parts.push(start === prev ? `${start}` : `${start}-${prev}`);
  return parts.join(", ");
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

function pluralFiles(n: number, isEn: boolean): string {
  if (isEn) return n === 1 ? "file" : "files";
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "файлов";
  if (last === 1) return "файл";
  if (last >= 2 && last <= 4) return "файла";
  return "файлов";
}

const MAIN_MODES: {
  value: Extract<SplitMode, "extract" | "individual" | "remove">;
  en: string;
  ru: string;
  Icon: typeof Scissors;
}[] = [
  { value: "extract", en: "Extract", ru: "Извлечь", Icon: Lightning },
  { value: "individual", en: "Per page", ru: "По одной", Icon: FilePdf },
  { value: "remove", en: "Remove", ru: "Удалить", Icon: Trash },
];

export default function SplitPdf() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState<SplitMode>("extract");
  const [ranges, setRanges] = useState("");
  const [chunkSize, setChunkSize] = useState(2);
  const [splitting, setSplitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SplitResult[]>([]);
  const [error, setError] = useState("");
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const [renderedCount, setRenderedCount] = useState(0);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const renderAbortRef = useRef(false);
  const pdfjsDocRef = useRef<Awaited<
    ReturnType<typeof loadPdfDocument>
  > | null>(null);
  const renderingRef = useRef<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleFileSelected = useCallback(
    async (selectedFiles: File[]) => {
      const f = selectedFiles[0];
      if (!f) return;
      setError("");
      setResults([]);
      setRanges("");
      setThumbnails([]);
      setRenderedCount(0);
      setVisiblePages(new Set());
      renderAbortRef.current = false;
      renderingRef.current = new Set();

      try {
        const data = await readFileAsArrayBuffer(f);
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(data, { ignoreEncryption: true });
        const count = doc.getPageCount();
        setFile(f);
        setPdfData(data);
        setPageCount(count);
        setThumbnails(new Array(count).fill(null));

        // Pre-load the pdfjs document for lazy on-demand thumbnail rendering.
        if (pdfjsDocRef.current) {
          try {
            pdfjsDocRef.current.destroy();
          } catch {
            /* ignore */
          }
        }
        pdfjsDocRef.current = await loadPdfDocument(data.slice(0));
        toast.success(
          isEn
            ? `Loaded ${count} pages`
            : `Загружено ${count} ${pluralPages(count, false)}`,
        );
      } catch {
        setError(
          isEn
            ? "Failed to read the PDF. Make sure it is a valid file."
            : "Не удалось прочитать PDF. Убедитесь, что файл корректный.",
        );
      }
    },
    [isEn],
  );

  // Render a single thumbnail on demand
  const renderThumbnail = useCallback(async (pageNum: number) => {
    const doc = pdfjsDocRef.current;
    if (!doc || renderAbortRef.current) return;
    if (renderingRef.current.has(pageNum)) return;
    renderingRef.current.add(pageNum);
    try {
      const canvas = await renderPageToCanvas(doc, pageNum, 0.3);
      if (renderAbortRef.current) return;
      const url = canvas.toDataURL("image/jpeg", 0.65);
      setThumbnails((prev) => {
        if (prev[pageNum - 1]) return prev;
        const next = [...prev];
        next[pageNum - 1] = url;
        return next;
      });
      setRenderedCount((c) => c + 1);
    } catch {
      /* skip */
    } finally {
      renderingRef.current.delete(pageNum);
    }
  }, []);

  // Render thumbnails for visible (in-view) pages first; rest in background.
  useEffect(() => {
    if (!pdfjsDocRef.current || pageCount === 0) return;
    const pending = [...visiblePages].filter(
      (p) => p >= 1 && p <= pageCount && !thumbnails[p - 1],
    );
    pending.forEach((p) => renderThumbnail(p));
  }, [visiblePages, pageCount, thumbnails, renderThumbnail]);

  // Background fill: render thumbnails not yet rendered, sequentially.
  useEffect(() => {
    if (!pdfjsDocRef.current || pageCount === 0) return;
    let cancelled = false;
    (async () => {
      for (let i = 1; i <= pageCount; i++) {
        if (cancelled || renderAbortRef.current) return;
        if (thumbnails[i - 1]) continue;
        await renderThumbnail(i);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only kick off when pageCount changes (initial fill); also a no-op
    // if thumbnails already complete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  // Cleanup on unmount: abort thumbnail render loop
  useEffect(() => {
    return () => {
      renderAbortRef.current = true;
      if (pdfjsDocRef.current) {
        try {
          pdfjsDocRef.current.destroy();
        } catch {
          /* ignore */
        }
        pdfjsDocRef.current = null;
      }
    };
  }, []);

  // IntersectionObserver for lazy rendering: track which thumbnails are in view.
  useEffect(() => {
    if (typeof window === "undefined" || pageCount === 0) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const p = Number(entry.target.getAttribute("data-page"));
            if (!Number.isFinite(p)) continue;
            if (entry.isIntersecting) next.add(p);
          }
          return next;
        });
      },
      { rootMargin: "300px" },
    );
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [pageCount]);

  const observeThumb = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    observerRef.current?.observe(el);
  }, []);

  // Compute which 1-based pages are "active" (kept / output) in the current mode
  const activePages = useMemo<Set<number>>(() => {
    const s = new Set<number>();
    if (pageCount === 0) return s;
    if (splitMode === "individual") {
      for (let i = 1; i <= pageCount; i++) s.add(i);
      return s;
    }
    if (splitMode === "everyN") {
      for (let i = 1; i <= pageCount; i++) s.add(i);
      return s;
    }
    if (splitMode === "extract") {
      const parsed = parsePagesList(ranges, pageCount);
      if (parsed instanceof Set) return parsed;
      return s;
    }
    if (splitMode === "ranges") {
      const parsed = parseRanges(ranges, pageCount);
      if (typeof parsed !== "string") {
        for (const g of parsed) for (const idx of g) s.add(idx + 1);
      }
      return s;
    }
    if (splitMode === "remove") {
      const parsed = parseRemovePages(ranges, pageCount);
      if (typeof parsed !== "string") {
        for (const idx of parsed) s.add(idx + 1);
      } else if (parsed === "empty") {
        // Nothing removed yet → all kept
        for (let i = 1; i <= pageCount; i++) s.add(i);
      }
      return s;
    }
    return s;
  }, [splitMode, ranges, pageCount]);

  // Compute pages to remove (only used in remove mode for grid display)
  const removedPages = useMemo<Set<number>>(() => {
    if (splitMode !== "remove" || pageCount === 0) return new Set();
    const s = new Set<number>();
    for (let i = 1; i <= pageCount; i++) if (!activePages.has(i)) s.add(i);
    return s;
  }, [activePages, splitMode, pageCount]);

  const handleTogglePage = useCallback(
    (page: number) => {
      if (pageCount === 0) return;
      setResults([]);

      if (splitMode === "remove") {
        const next = new Set(removedPages);
        if (next.has(page)) next.delete(page);
        else next.add(page);
        setRanges(pagesToRangeString([...next]));
        return;
      }
      if (splitMode === "ranges" || splitMode === "extract") {
        const next = new Set(activePages);
        if (next.has(page)) next.delete(page);
        else next.add(page);
        setRanges(pagesToRangeString([...next]));
        return;
      }
      // individual or everyN: switch to extract so user can hand-pick
      setSplitMode("extract");
      setRanges(`${page}`);
    },
    [activePages, removedPages, splitMode, pageCount],
  );

  // Compute the planned output (used by preview + by handleSplit's serializer).
  const plannedOutput = useMemo<PlannedOutput[] | null>(() => {
    if (pageCount === 0 || !file) return null;
    const baseName = (file.name ?? "document").replace(/\.pdf$/i, "");
    const sourceSize = file.size;
    const perPageEst = Math.max(
      2_000,
      Math.round(sourceSize / Math.max(1, pageCount)),
    );

    const mk = (pages: number[], label: string): PlannedOutput => ({
      label,
      pages,
      pageCount: pages.length,
      estBytes: Math.max(2_500, pages.length * perPageEst),
    });

    if (splitMode === "individual") {
      const out: PlannedOutput[] = [];
      for (let i = 1; i <= pageCount; i++)
        out.push(mk([i], `${baseName}_page_${i}.pdf`));
      return out;
    }
    if (splitMode === "everyN") {
      const n = Math.max(
        1,
        Math.min(pageCount || 1, Math.floor(chunkSize) || 1),
      );
      const out: PlannedOutput[] = [];
      for (let start = 1; start <= pageCount; start += n) {
        const end = Math.min(start + n - 1, pageCount);
        const pages: number[] = [];
        for (let p = start; p <= end; p++) pages.push(p);
        const label =
          start === end
            ? `${baseName}_page_${start}.pdf`
            : `${baseName}_pp${start}-${end}.pdf`;
        out.push(mk(pages, label));
      }
      return out;
    }
    if (splitMode === "extract") {
      const parsed = parsePagesList(ranges, pageCount);
      if (!(parsed instanceof Set) || parsed.size === 0) return [];
      const sorted = [...parsed].sort((a, b) => a - b);
      const range = pagesToRangeString(sorted).replace(/,\s*/g, "_");
      return [mk(sorted, `${baseName}_extracted_${range}.pdf`)];
    }
    if (splitMode === "remove") {
      const parsed = parseRemovePages(ranges, pageCount);
      if (typeof parsed === "string") return [];
      const pages = parsed.map((p) => p + 1);
      return [mk(pages, `${baseName}_trimmed.pdf`)];
    }
    // ranges
    const parsed = parseRanges(ranges, pageCount);
    if (typeof parsed === "string") return [];
    return parsed.map((g) => {
      const pages = g.map((p) => p + 1);
      const first = pages[0];
      const last = pages[pages.length - 1];
      const label =
        first === last
          ? `${baseName}_page_${first}.pdf`
          : `${baseName}_pp${first}-${last}.pdf`;
      return mk(pages, label);
    });
  }, [splitMode, ranges, chunkSize, pageCount, file]);

  const handleSplit = useCallback(async () => {
    if (!pdfData || pageCount === 0 || !file) return;
    setSplitting(true);
    setError("");
    setProgress(0);
    setResults([]);

    try {
      // Validate inputs that require user-supplied ranges before touching pdf-lib.
      if (splitMode === "extract") {
        const parsed = parsePagesList(ranges, pageCount);
        if (typeof parsed === "string") {
          const messages: Record<string, { en: string; ru: string }> = {
            empty: {
              en: "Pick at least one page to extract.",
              ru: "Выберите хотя бы одну страницу.",
            },
            out_of_range: {
              en: `Page numbers must be between 1 and ${pageCount}.`,
              ru: `Номера страниц должны быть от 1 до ${pageCount}.`,
            },
            invalid: {
              en: "Enter valid page numbers or ranges.",
              ru: "Введите корректные номера страниц или диапазоны.",
            },
          };
          setError(isEn ? messages[parsed].en : messages[parsed].ru);
          setSplitting(false);
          return;
        }
      }
      if (splitMode === "ranges") {
        const parsed = parseRanges(ranges, pageCount);
        if (typeof parsed === "string") {
          const messages: Record<string, { en: string; ru: string }> = {
            empty: {
              en: "Please select page ranges.",
              ru: "Выберите диапазоны страниц.",
            },
            out_of_range: {
              en: `Page numbers must be between 1 and ${pageCount}.`,
              ru: `Номера страниц должны быть от 1 до ${pageCount}.`,
            },
            invalid: {
              en: "Enter valid page ranges.",
              ru: "Введите корректные диапазоны страниц.",
            },
          };
          setError(isEn ? messages[parsed].en : messages[parsed].ru);
          setSplitting(false);
          return;
        }
      }
      if (splitMode === "remove") {
        const parsed = parseRemovePages(ranges, pageCount);
        if (typeof parsed === "string") {
          const messages: Record<string, { en: string; ru: string }> = {
            empty: {
              en: "Please select pages to remove.",
              ru: "Выберите страницы для удаления.",
            },
            out_of_range: {
              en: `Page numbers must be between 1 and ${pageCount}.`,
              ru: `Номера страниц должны быть от 1 до ${pageCount}.`,
            },
            invalid: {
              en: "Enter valid page numbers or ranges.",
              ru: "Введите корректные номера страниц или диапазоны.",
            },
            all_removed: {
              en: "Cannot remove all pages from the document.",
              ru: "Нельзя удалить все страницы из документа.",
            },
          };
          setError(isEn ? messages[parsed].en : messages[parsed].ru);
          setSplitting(false);
          return;
        }
      }
      if (splitMode === "everyN") {
        const n = Math.floor(chunkSize);
        if (!Number.isFinite(n) || n < 1 || n > pageCount) {
          setError(
            isEn
              ? `Chunk size must be between 1 and ${pageCount}.`
              : `Размер чанка должен быть от 1 до ${pageCount}.`,
          );
          setSplitting(false);
          return;
        }
      }

      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(pdfData, {
        ignoreEncryption: true,
      });

      const plan = plannedOutput ?? [];
      if (plan.length === 0) {
        setError(isEn ? "Nothing to produce." : "Нечего создавать.");
        setSplitting(false);
        return;
      }

      const splitResults: SplitResult[] = [];
      for (let g = 0; g < plan.length; g++) {
        const item = plan[g];
        const newDoc = await PDFDocument.create();
        const indices = item.pages.map((p) => p - 1);
        const copiedPages = await newDoc.copyPages(source, indices);
        for (const page of copiedPages) newDoc.addPage(page);
        const bytes = await newDoc.save();
        splitResults.push({
          label: item.label,
          data: bytes,
          pageCount: item.pageCount,
        });
        setProgress(Math.round(((g + 1) / plan.length) * 100));
      }

      setResults(splitResults);
      toast.success(
        isEn
          ? `Created ${splitResults.length} ${pluralFiles(splitResults.length, true)}`
          : `Создано: ${splitResults.length} ${pluralFiles(splitResults.length, false)}`,
      );
    } catch {
      setError(
        isEn
          ? "An error occurred while splitting the PDF. Please try again."
          : "Произошла ошибка при разделении PDF. Попробуйте ещё раз.",
      );
    } finally {
      setSplitting(false);
    }
  }, [
    pdfData,
    pageCount,
    splitMode,
    ranges,
    chunkSize,
    file,
    isEn,
    plannedOutput,
  ]);

  const handleDownloadOne = useCallback((item: SplitResult) => {
    downloadPdfBlob(item.data, item.label);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;
    if (results.length === 1) {
      handleDownloadOne(results[0]);
      return;
    }
    try {
      const JSZipModule = (await import("jszip")).default;
      const zip = new JSZipModule();
      for (const item of results) zip.file(item.label, item.data);
      const blob = await zip.generateAsync({ type: "blob" });
      const baseName = (file?.name ?? "document").replace(/\.pdf$/i, "");
      downloadBlob(blob, `${baseName}_split.zip`);
      toast.success(isEn ? "ZIP downloaded" : "ZIP скачан");
    } catch {
      setError(
        isEn
          ? "Failed to create ZIP archive."
          : "Не удалось создать ZIP-архив.",
      );
    }
  }, [results, file, isEn, handleDownloadOne]);

  const handleReset = useCallback(() => {
    renderAbortRef.current = true;
    if (pdfjsDocRef.current) {
      try {
        pdfjsDocRef.current.destroy();
      } catch {
        /* ignore */
      }
      pdfjsDocRef.current = null;
    }
    setFile(null);
    setPdfData(null);
    setPageCount(0);
    setRanges("");
    setChunkSize(2);
    setResults([]);
    setError("");
    setProgress(0);
    setThumbnails([]);
    setRenderedCount(0);
    setVisiblePages(new Set());
    setSplitMode("extract");
    setTimeout(() => {
      renderAbortRef.current = false;
    }, 100);
  }, []);

  const outputCount = plannedOutput?.length ?? 0;

  const showRangesInput =
    splitMode === "ranges" || splitMode === "extract" || splitMode === "remove";

  return (
    <div className="mx-auto w-full max-w-4xl">
      {!file && (
        <PdfDropzone
          accept="application/pdf,.pdf"
          maxSizeMB={100}
          onFilesSelected={handleFileSelected}
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

      {file && pdfData && (
        <Card className="mt-3 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-3">
            <FilePdf size={32} className="text-[var(--color-danger)]" />
            <div className="min-w-0 flex-1">
              <div
                className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold"
                title={file.name}
              >
                {file.name}
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">
                {formatFileSize(file.size, isEn)} &bull; {pageCount}{" "}
                {pluralPages(pageCount, isEn)}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleReset}
              className="shrink-0"
            >
              <X size={16} />
              <span className="hidden sm:inline">
                {isEn ? "Change file" : "Сменить файл"}
              </span>
            </Button>
          </div>

          <div
            className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
            role="radiogroup"
            aria-label={isEn ? "Split mode" : "Режим разделения"}
          >
            {MAIN_MODES.map(({ value, en, ru, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={splitMode === value}
                onClick={() => {
                  setSplitMode(value);
                  setResults([]);
                  setRanges("");
                }}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-semibold transition-colors",
                  splitMode === value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                <Icon size={18} />
                {isEn ? en : ru}
              </button>
            ))}
          </div>

          {/* Visual page grid */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Pages" : "Страницы"}
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                {renderedCount < pageCount
                  ? isEn
                    ? `Rendering thumbnails… ${renderedCount}/${pageCount}`
                    : `Превью… ${renderedCount}/${pageCount}`
                  : isEn
                    ? splitMode === "individual" || splitMode === "everyN"
                      ? "All pages will be exported"
                      : "Tap to toggle"
                    : splitMode === "individual" || splitMode === "everyN"
                      ? "Все страницы будут экспортированы"
                      : "Нажмите, чтобы выбрать"}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              {Array.from({ length: pageCount }, (_, i) => {
                const pageNum = i + 1;
                const isActive = activePages.has(pageNum);
                const isRemoved =
                  splitMode === "remove" && removedPages.has(pageNum);
                const thumb = thumbnails[i];
                const interactive =
                  splitMode === "ranges" ||
                  splitMode === "extract" ||
                  splitMode === "remove";
                const isChosen = splitMode === "remove" ? isRemoved : isActive;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    data-page={pageNum}
                    ref={observeThumb}
                    onClick={() => handleTogglePage(pageNum)}
                    aria-pressed={interactive ? isChosen : undefined}
                    aria-label={
                      isEn
                        ? `Page ${pageNum}${isRemoved ? " (will be removed)" : isActive ? " (selected)" : ""}`
                        : `Страница ${pageNum}${isRemoved ? " (будет удалена)" : isActive ? " (выбрана)" : ""}`
                    }
                    className={cn(
                      "group relative aspect-[3/4] overflow-hidden rounded border-2 bg-[var(--color-surface-muted)] transition-all",
                      "cursor-pointer",
                      isRemoved && "border-[var(--color-danger)] opacity-40",
                      !isRemoved &&
                        interactive &&
                        isActive &&
                        splitMode !== "remove" &&
                        "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30",
                      !isRemoved &&
                        (!interactive || !isActive || splitMode === "remove") &&
                        "border-[var(--color-border)]",
                      interactive &&
                        splitMode !== "remove" &&
                        !isActive &&
                        "opacity-60",
                      "hover:border-[var(--color-primary)] hover:opacity-100",
                    )}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageSquare
                          size={20}
                          className="text-[var(--color-text-muted)]/40"
                        />
                      </div>
                    )}
                    <div className="absolute bottom-0.5 left-0.5 rounded bg-black/65 px-1 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums">
                      {pageNum}
                    </div>
                    {interactive &&
                      isActive &&
                      !isRemoved &&
                      splitMode !== "remove" && (
                        <div className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                          <Check size={10} weight="bold" />
                        </div>
                      )}
                    {isRemoved && (
                      <div className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-white">
                        <X size={10} weight="bold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {results.length === 0 && (
              <Button
                size="lg"
                onClick={handleSplit}
                disabled={
                  splitting ||
                  (showRangesInput && !ranges.trim()) ||
                  (plannedOutput?.length ?? 0) === 0
                }
                data-primary-action="split-pdf"
                data-primary-state="input"
                className="tool-primary-action w-full gap-1.5 sm:w-auto"
              >
                <Scissors size={18} />
                {splitting
                  ? isEn
                    ? "Processing…"
                    : "Обработка…"
                  : splitMode === "extract"
                    ? isEn
                      ? "Extract selected pages"
                      : "Извлечь выбранные страницы"
                    : splitMode === "remove"
                      ? isEn
                        ? "Remove selected pages"
                        : "Удалить выбранные страницы"
                      : isEn
                        ? `Split into ${outputCount} ${pluralFiles(outputCount, true)}`
                        : `Разделить на ${outputCount} ${pluralFiles(outputCount, false)}`}
              </Button>
            )}
          </div>

          <AdvancedSettings
            title={isEn ? "Advanced splitting" : "Дополнительные настройки"}
            description={
              isEn
                ? "Manual ranges or fixed-size chunks"
                : "Диапазоны вручную или части по N страниц"
            }
            className="mb-4"
          >
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setSplitMode("ranges");
                    setRanges("");
                    setResults([]);
                  }}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm font-semibold",
                    splitMode === "ranges"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)]",
                  )}
                >
                  <ListNumbers size={17} />
                  {isEn ? "Custom ranges" : "Свои диапазоны"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSplitMode("everyN");
                    setRanges("");
                    setResults([]);
                  }}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm font-semibold",
                    splitMode === "everyN"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)]",
                  )}
                >
                  <Stack size={17} />
                  {isEn ? "Every N pages" : "По N страниц"}
                </button>
              </div>

              {splitMode === "everyN" ? (
                <div>
                  <Label
                    htmlFor="chunk-size"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {isEn ? "Pages per file" : "Страниц в одном файле"}
                  </Label>
                  <Input
                    id="chunk-size"
                    type="number"
                    min={1}
                    max={pageCount || 1}
                    value={chunkSize}
                    onChange={(event) => {
                      const value = parseInt(event.target.value, 10);
                      setChunkSize(Number.isFinite(value) ? value : 1);
                      setResults([]);
                    }}
                  />
                </div>
              ) : showRangesInput ? (
                <div>
                  <Label
                    htmlFor="split-page-ranges"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {splitMode === "remove"
                      ? isEn
                        ? "Pages to remove"
                        : "Страницы для удаления"
                      : splitMode === "ranges"
                        ? isEn
                          ? "Output ranges"
                          : "Диапазоны результатов"
                        : isEn
                          ? "Pages to extract"
                          : "Страницы для извлечения"}
                  </Label>
                  <Input
                    id="split-page-ranges"
                    value={ranges}
                    onChange={(event) => {
                      setRanges(event.target.value);
                      setResults([]);
                    }}
                    placeholder={
                      isEn
                        ? "Page numbers or ranges"
                        : "Номера страниц или диапазоны"
                    }
                  />
                </div>
              ) : null}
            </div>
          </AdvancedSettings>

          {splitting && (
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

      {results.length > 0 && (
        <Card className="mt-4 p-4 sm:p-5">
          <div className="mb-3 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Check
                size={18}
                weight="fill"
                className="text-[var(--color-success)]"
              />
              {isEn ? "Split results" : "Результаты"} ({results.length})
            </div>
            <Button
              size="lg"
              onClick={() =>
                results.length === 1
                  ? handleDownloadOne(results[0])
                  : handleDownloadAll()
              }
              data-primary-action="split-pdf"
              data-primary-state="result"
              className="tool-primary-action w-full sm:w-auto"
            >
              {results.length === 1 ? (
                <Download size={18} />
              ) : (
                <FileZip size={18} />
              )}
              {results.length === 1
                ? isEn
                  ? "Download PDF"
                  : "Скачать PDF"
                : isEn
                  ? "Download ZIP"
                  : "Скачать ZIP"}
            </Button>
          </div>

          <ul className="flex flex-col gap-2">
            {results.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 transition-colors hover:bg-[var(--color-surface-muted)]/50"
              >
                <FilePdf
                  size={24}
                  className="shrink-0 text-[var(--color-danger)]"
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium"
                    title={item.label}
                  >
                    {item.label}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {formatFileSize(item.data.byteLength, isEn)} &bull;{" "}
                    {item.pageCount} {pluralPages(item.pageCount, isEn)}
                  </div>
                </div>
                {results.length > 1 && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDownloadOne(item)}
                    aria-label={
                      isEn ? `Download ${item.label}` : `Скачать ${item.label}`
                    }
                  >
                    <Download size={16} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <output aria-live="polite" className="sr-only">
        {results.length > 0
          ? isEn
            ? `Split complete: ${results.length} files generated.`
            : `Готово: создано ${results.length} файлов.`
          : ""}
      </output>
    </div>
  );
}
