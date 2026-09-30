"use client";

import { Upload } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * File drop area. Accepts drag & drop, click-to-browse and Ctrl+V paste
 * (paste is handled only by the dropzone that currently has focus or, if none
 * does, by the first dropzone on the page).
 */
export function Dropzone({
  onFiles,
  accept,
  multiple = false,
  title,
  hint,
  className,
  compact = false,
  disabled = false,
  children,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title: ReactNode;
  hint?: ReactNode;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const id = useId();

  const emit = useCallback(
    (list: FileList | File[] | null | undefined) => {
      if (!list || disabled) return;
      const files = Array.from(list).filter((f) => matchesAccept(f, accept));
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
    [accept, disabled, multiple, onFiles],
  );

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const zones = document.querySelectorAll("[data-dropzone]");
      const active = document.activeElement?.closest("[data-dropzone]");
      const owner = active ?? zones[0];
      if (owner !== rootRef.current) return;
      e.preventDefault();
      emit(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [emit]);

  return (
    <div
      ref={rootRef}
      data-dropzone
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-labelledby={`${id}-title`}
      aria-disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        emit(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed text-center transition-colors duration-150",
        compact ? "min-h-24 px-4 py-4" : "min-h-44 px-6 py-8",
        over ? "border-accent bg-accent-soft" : "border-line-strong bg-surface hover:border-accent hover:bg-surface-2",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Upload className="size-5" aria-hidden />
      </span>
      <span id={`${id}-title`} className="text-[15px] font-medium text-fg">
        {title}
      </span>
      {hint && <span className="text-sm text-fg-3">{hint}</span>}
      {children}
      {/* Hidden (not sr-only): the zone itself is the control; .click() still opens the picker. */}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          emit(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const rules = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return rules.some((r) => {
    if (r.startsWith(".")) return name.endsWith(r);
    if (r.endsWith("/*")) return type.startsWith(r.slice(0, -1));
    return type === r;
  });
}
