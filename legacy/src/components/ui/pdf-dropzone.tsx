"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useId,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  UploadSimple,
  ClipboardText,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";
import { loadPdfDocument } from "@/src/utils/pdfHelpers";

export interface PdfDropzoneHandle {
  reset: () => void;
  openFileDialog: () => void;
}

export interface PdfDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  maxSizeMB?: number;
  disabled?: boolean;
  compact?: boolean;
  icon?: React.ReactNode;
  label?: string;
  labelEn?: string;
  supportPaste?: boolean;
}

export const PdfDropzone = forwardRef<PdfDropzoneHandle, PdfDropzoneProps>(
  function PdfDropzone(
    {
      onFilesSelected,
      accept,
      multiple = false,
      maxSizeMB,
      disabled = false,
      compact = false,
      icon,
      label,
      labelEn,
      supportPaste = true,
    },
    ref,
  ) {
    const { locale } = useLanguage();
    const isEn = locale === "en";
    const [dragging, setDragging] = useState(false);
    const [rejectionMessage, setRejectionMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hintId = useId();

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      openFileDialog: () => {
        fileInputRef.current?.click();
      },
    }));

    const acceptMimes = useMemo(
      () => accept.split(",").map((s) => s.trim()),
      [accept],
    );

    const filterFiles = useCallback(
      (files: File[]): File[] => {
        let valid = files.filter((f) => {
          if (acceptMimes.includes(f.type)) return true;
          if (
            acceptMimes.some(
              (a) =>
                a.endsWith("/*") && f.type.startsWith(a.replace("/*", "/")),
            )
          )
            return true;
          const ext = "." + f.name.split(".").pop()?.toLowerCase();
          if (acceptMimes.includes(ext)) return true;
          return false;
        });
        if (maxSizeMB) {
          valid = valid.filter((f) => f.size <= maxSizeMB * 1024 * 1024);
        }
        if (!multiple && valid.length > 1) valid = [valid[0]];
        return valid;
      },
      [acceptMimes, maxSizeMB, multiple],
    );

    const handleFiles = useCallback(
      (files: File[]) => {
        if (disabled) return;
        const valid = filterFiles(files);
        if (valid.length > 0) {
          setRejectionMessage(
            valid.length < files.length
              ? isEn
                ? `${files.length - valid.length} file(s) skipped because type or size is not supported.`
                : `${files.length - valid.length} файл(ов) пропущено: тип или размер не поддерживается.`
              : "",
          );
          onFilesSelected(valid);
          return;
        }

        if (files.length > 0) {
          setRejectionMessage(
            maxSizeMB
              ? isEn
                ? `Unsupported file type or file is larger than ${maxSizeMB} MB.`
                : `Неподдерживаемый тип файла или размер больше ${maxSizeMB} МБ.`
              : isEn
                ? "Unsupported file type."
                : "Неподдерживаемый тип файла.",
          );
        }
      },
      [disabled, filterFiles, isEn, maxSizeMB, onFilesSelected],
    );

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        handleFiles(Array.from(e.dataTransfer.files));
      },
      [handleFiles],
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragging(true);
      },
      [disabled],
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
    }, []);

    const handleFileInput = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      [handleFiles],
    );

    const fileKind = useMemo(() => {
      const lower = accept.toLowerCase();
      if (lower.includes("pdf")) return "PDF";
      if (lower.includes("docx") || lower.includes("wordprocessingml"))
        return "DOCX";
      if (
        lower.includes("image") ||
        lower.includes(".jpg") ||
        lower.includes(".jpeg") ||
        lower.includes(".png") ||
        lower.includes(".webp")
      ) {
        return isEn ? "images" : "изображения";
      }
      return isEn ? "files" : "файлы";
    }, [accept, isEn]);

    const defaultLabel = isEn ? "Upload file" : "Загрузите файл";
    const dragLabel = isEn ? "Drop file here" : "Отпустите файл здесь";
    const displayLabel = dragging
      ? dragLabel
      : isEn
        ? labelEn || label || defaultLabel
        : label || defaultLabel;
    const hintItems = [
      fileKind,
      maxSizeMB
        ? isEn
          ? `up to ${maxSizeMB} MB`
          : `до ${maxSizeMB} МБ`
        : null,
      isEn ? "local processing" : "локально",
      supportPaste ? "Ctrl+V" : null,
    ].filter(Boolean);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      },
      [disabled],
    );

    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={displayLabel}
        aria-describedby={hintId}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "rounded-[var(--radius-lg)] border-2 border-dashed text-center transition-colors",
          compact ? "p-4" : "p-6 sm:p-8",
          dragging
            ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]/30",
          disabled ? "cursor-default opacity-50" : "cursor-pointer",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          data-file-paste-target={supportPaste ? "true" : undefined}
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          style={{ display: "none" }}
        />

        <div className="mb-2 flex justify-center">
          {icon || (
            <UploadSimple
              size={compact ? 32 : 48}
              className={
                dragging
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              }
            />
          )}
        </div>

        <div className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
          {displayLabel}
        </div>

        <div
          id={hintId}
          className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]"
        >
          {hintItems.map((item) => (
            <span
              key={item}
              className="inline-flex min-h-6 items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 font-medium"
            >
              {item === "Ctrl+V" && <ClipboardText size={13} />}
              {item}
            </span>
          ))}
        </div>

        {rejectionMessage && (
          <div
            className="mt-2 text-xs font-medium text-[var(--color-danger)]"
            role="status"
          >
            {rejectionMessage}
          </div>
        )}
      </div>
    );
  },
);

interface PdfPreviewProps {
  pdfData: ArrayBuffer | Uint8Array | null;
  scale?: number;
  onPageCount?: (count: number) => void;
  maxHeight?: number;
}

type LoadedPdfDocument = Awaited<ReturnType<typeof loadPdfDocument>>;

type PdfDocumentState =
  | { status: "loading"; document: null }
  | { status: "ready"; document: LoadedPdfDocument }
  | { status: "error"; document: null };

interface PdfRenderTarget {
  document: LoadedPdfDocument;
  page: number;
  scale: number;
}

interface PdfPreviewSessionIdentity {
  source: PdfPreviewProps["pdfData"];
  key: number;
}

export function PdfPreview(props: PdfPreviewProps) {
  const { pdfData } = props;
  const [session, setSession] = useState<PdfPreviewSessionIdentity>(() => ({
    source: pdfData,
    key: 0,
  }));
  let sessionKey = session.key;

  if (session.source !== pdfData) {
    sessionKey += 1;
    setSession({ source: pdfData, key: sessionKey });
  }

  if (!pdfData) return null;

  return <PdfPreviewSession key={sessionKey} {...props} pdfData={pdfData} />;
}

type PdfPreviewSessionProps = Omit<PdfPreviewProps, "pdfData"> & {
  pdfData: ArrayBuffer | Uint8Array;
};

function PdfPreviewSession({
  pdfData,
  scale = 1.2,
  onPageCount,
  maxHeight = 500,
}: PdfPreviewSessionProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const renderGenerationRef = useRef(0);
  const onPageCountRef = useRef(onPageCount);
  const [page, setPage] = useState(1);
  const [documentState, setDocumentState] = useState<PdfDocumentState>({
    status: "loading",
    document: null,
  });
  const [renderedTarget, setRenderedTarget] = useState<PdfRenderTarget | null>(
    null,
  );
  const pdfDocument = documentState.document;
  const totalPages = pdfDocument?.numPages ?? 0;
  const activePage = pdfDocument ? Math.min(page, pdfDocument.numPages) : page;
  const loading =
    documentState.status === "loading" ||
    (documentState.status === "ready" &&
      (renderedTarget?.document !== pdfDocument ||
        renderedTarget.page !== activePage ||
        !Object.is(renderedTarget.scale, scale)));

  useEffect(() => {
    onPageCountRef.current = onPageCount;
  }, [onPageCount]);

  useEffect(() => {
    let disposed = false;
    let ownedDocument: LoadedPdfDocument | null = null;

    renderGenerationRef.current += 1;
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;

    const data =
      pdfData instanceof Uint8Array
        ? (pdfData.slice().buffer as ArrayBuffer)
        : pdfData.slice(0);

    void (async () => {
      try {
        const loadedDocument = await loadPdfDocument(data);
        if (disposed) {
          await loadedDocument.destroy();
          return;
        }
        ownedDocument = loadedDocument;
        setDocumentState({ status: "ready", document: loadedDocument });
        onPageCountRef.current?.(loadedDocument.numPages);
      } catch {
        if (!disposed) {
          setDocumentState({ status: "error", document: null });
        }
      }
    })();

    return () => {
      disposed = true;
      renderGenerationRef.current += 1;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      if (ownedDocument) {
        void ownedDocument.destroy();
      }
    };
  }, [pdfData]);

  useEffect(() => {
    if (!pdfDocument) return;

    let disposed = false;
    const generation = ++renderGenerationRef.current;
    const pageNumber = Math.min(page, pdfDocument.numPages);

    void (async () => {
      let renderTask: { cancel: () => void; promise: Promise<unknown> } | null =
        null;
      try {
        const pdfPage = await pdfDocument.getPage(pageNumber);
        if (disposed || generation !== renderGenerationRef.current) return;

        const viewport = pdfPage.getViewport({ scale });
        const rendered = document.createElement("canvas");
        rendered.width = Math.max(1, Math.round(viewport.width));
        rendered.height = Math.max(1, Math.round(viewport.height));
        const renderedContext = rendered.getContext("2d");
        if (!renderedContext) return;

        const task = pdfPage.render({
          canvasContext: renderedContext,
          viewport,
          canvas: rendered,
        } as Parameters<typeof pdfPage.render>[0]);
        renderTask = task;
        renderTaskRef.current = task;
        await task.promise;

        if (disposed || generation !== renderGenerationRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        const context = canvas.getContext("2d");
        context?.drawImage(rendered, 0, 0);
      } catch {
        // Cancelled and malformed preview renders are intentionally ignored.
      } finally {
        if (renderTaskRef.current === renderTask) renderTaskRef.current = null;
        if (!disposed && generation === renderGenerationRef.current) {
          setRenderedTarget({ document: pdfDocument, page: pageNumber, scale });
        }
      }
    })();

    return () => {
      disposed = true;
      renderGenerationRef.current += 1;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pdfDocument, page, scale]);

  return (
    <div className="text-center">
      <div
        className="relative flex min-h-[100px] items-center justify-center overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]"
        style={{ maxHeight }}
      >
        {loading && (
          <span className="absolute text-sm text-[var(--color-text-muted)]">
            {isEn ? "Rendering..." : "Рендеринг..."}
          </span>
        )}
        <canvas
          ref={canvasRef}
          className="block h-auto max-w-full rounded-md"
        />
      </div>
      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isEn ? "Previous PDF page" : "Предыдущая страница PDF"}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <CaretLeft size={16} />
          </Button>
          <span className="text-sm text-[var(--color-text-muted)]">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={isEn ? "Next PDF page" : "Следующая страница PDF"}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <CaretRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
