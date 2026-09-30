"use client";

import { useRef, useState } from "react";
import { ClipboardText, LockKey, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";
import { UNIVERSAL_ACCEPT } from "@/src/lib/file-conversion/formats";

export function ConverterDropzone({
  compact,
  disabled,
  isEn,
  onFiles,
}: {
  compact: boolean;
  disabled: boolean;
  isEn: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={isEn ? "Add files to converter" : "Добавить файлы в конвертер"}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) onFiles(Array.from(event.dataTransfer.files));
      }}
      className={cn(
        "cursor-pointer rounded-[var(--radius-lg)] border-2 border-dashed text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]",
        compact ? "px-4 py-4" : "px-4 py-8 sm:py-10",
        dragging
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "border-[var(--color-border-strong)] bg-[var(--color-surface-muted)]/55 hover:border-[var(--color-primary)]",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={UNIVERSAL_ACCEPT}
        data-file-paste-target="true"
        data-file-paste-raw="true"
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <UploadSimple
        size={compact ? 30 : 46}
        weight="duotone"
        className="mx-auto text-[var(--color-primary)]"
      />
      <div className={cn("font-bold", compact ? "mt-2 text-sm" : "mt-3 text-base sm:text-lg")}>
        {isEn
          ? "Drop files here or paste with Ctrl+V"
          : "Перетащите файлы сюда или вставьте Ctrl+V"}
      </div>
      {!compact && (
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          {isEn ? "You can also choose files from your device" : "Также можно выбрать файлы с компьютера"}
        </div>
      )}
      <Button
        type="button"
        size={compact ? "sm" : "md"}
        className="mt-4"
        tabIndex={-1}
        disabled={disabled}
      >
        {isEn ? "Choose files" : "Выбрать файлы"}
      </Button>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1">
          <ClipboardText size={14} /> Ctrl+V
        </span>
        <span className="inline-flex items-center gap-1">
          <LockKey size={14} />
          {isEn ? "Files stay on your device" : "Файлы остаются на устройстве"}
        </span>
      </div>
    </div>
  );
}
