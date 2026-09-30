"use client";

import {
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { cn } from "@/src/lib/cn";
import { useGlobalFilePaste } from "@/src/hooks/useGlobalFilePaste";

export type FileRejectionReason = "type" | "size" | "count";

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  currentFileCount?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  browseLabel?: ReactNode;
  ariaLabel?: string;
  icon?: ReactNode;
  error?: ReactNode;
  compact?: boolean;
  capture?: boolean | "user" | "environment";
  className?: string;
}

function acceptsFile(file: File, accept?: string) {
  if (!accept?.trim()) return true;
  const fileName = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .some((token) => {
      if (token.startsWith(".")) return fileName.endsWith(token);
      if (token.endsWith("/*")) return mime.startsWith(token.slice(0, -1));
      return mime === token;
    });
}

/** Keyboard-accessible click/drop target with shared type, size, and count validation. */
export function FileDropzone({
  onFiles,
  onReject,
  accept,
  multiple = false,
  maxFiles,
  currentFileCount = 0,
  maxSizeBytes,
  disabled = false,
  title = "Drop files here",
  description,
  browseLabel = "Choose files",
  ariaLabel,
  icon,
  error,
  compact = false,
  capture,
  className,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  useGlobalFilePaste({
    onFiles: (files) => processFiles(files),
    disabled,
  });

  const processFiles = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;

    const accepted: File[] = [];
    const rejected: FileRejection[] = [];
    for (const file of incoming) {
      if (!acceptsFile(file, accept)) {
        rejected.push({ file, reason: "type" });
      } else if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        rejected.push({ file, reason: "size" });
      } else {
        accepted.push(file);
      }
    }

    const totalLimit = multiple
      ? (maxFiles ?? Infinity)
      : Math.min(maxFiles ?? 1, 1);
    const available = Math.max(0, totalLimit - currentFileCount);
    const withinLimit = accepted.slice(0, available);
    for (const file of accepted.slice(available)) {
      rejected.push({ file, reason: "count" });
    }

    if (withinLimit.length > 0) onFiles(withinLimit);
    if (rejected.length > 0) onReject?.(rejected);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setDragging(true);
  };

  async function scanFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
    const items = dataTransfer.items;
    if (!items || items.length === 0) {
      return Array.from(dataTransfer.files);
    }

    const files: File[] = [];
    const entries: FileSystemEntry[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
        if (entry) {
          entries.push(entry);
        } else {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    }

    if (entries.length === 0) {
      return Array.from(dataTransfer.files);
    }

    async function readEntry(entry: FileSystemEntry): Promise<void> {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        await new Promise<void>((resolve) => {
          fileEntry.file(
            (file: File) => {
              files.push(file);
              resolve();
            },
            () => resolve(),
          );
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();
        const entriesInDir: FileSystemEntry[] = [];
        while (true) {
          const batch = await new Promise<FileSystemEntry[]>((resolve) => {
            dirReader.readEntries(
              (results) => resolve(Array.from(results)),
              () => resolve([]),
            );
          });
          if (batch.length === 0) break;
          entriesInDir.push(...batch);
        }
        for (const child of entriesInDir) {
          await readEntry(child);
        }
      }
    }

    for (const entry of entries) {
      await readEntry(entry);
    }

    return files.length > 0 ? files : Array.from(dataTransfer.files);
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const files = await scanFilesFromDataTransfer(event.dataTransfer);
    processFiles(files);
  };

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        data-file-paste-target="true"
        accept={accept}
        multiple={multiple}
        capture={capture}
        disabled={disabled}
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => {
          processFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={
          ariaLabel ??
          (typeof browseLabel === "string" ? browseLabel : undefined)
        }
        aria-disabled={disabled || undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group flex min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-strong)] bg-transparent px-4 py-6 text-center transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
          compact && "min-h-28 flex-row justify-start py-4 text-left",
          dragging &&
            "border-[var(--color-primary)] bg-[var(--color-primary-soft)]",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-[var(--color-danger)]/60",
          className,
        )}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] [&>svg]:h-6 [&>svg]:w-6">
          {icon ?? (
            <UploadSimple size={24} weight="duotone" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-base font-bold leading-snug text-[var(--color-text)]">
            {title}
          </span>
          {description ? (
            <span className="mt-1 block text-sm leading-relaxed text-[var(--color-text-muted)]">
              {description}
            </span>
          ) : null}
          <span className="mt-2 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-soft)]">
            {browseLabel}
          </span>
        </span>
      </div>
      {error ? (
        <div
          id={`${inputId}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-[var(--color-danger)]"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
