"use client";

import { Eraser, FileText, FolderOpen } from "lucide-react";
import { useMemo, useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/ui/button";
import { countsLabel, KIT_T, textStats } from "./labels";

/**
 * Plain-textarea code editor with a labelled header, optional actions
 * (open file, sample, clear) and a footer with line / character counts.
 * No syntax highlighting on purpose: it stays fast on multi-megabyte input.
 */
export function CodeEditor({
  id,
  locale,
  label,
  value,
  onChange,
  placeholder,
  rows = 12,
  readOnly = false,
  invalid = false,
  wrap = false,
  sample,
  fileAccept,
  maxFileBytes = 50 * 1024 * 1024,
  onFileError,
  actions,
  footer,
  className,
  describedBy,
}: {
  id: string;
  locale: Locale;
  label: ReactNode;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  invalid?: boolean;
  /** Soft-wrap long lines (off by default for code). */
  wrap?: boolean;
  /** Text inserted by the "Sample" button (button hidden when undefined). */
  sample?: string;
  /** Show an "Open file" button accepting these types, e.g. ".json,application/json". */
  fileAccept?: string;
  maxFileBytes?: number;
  onFileError?: (message: string) => void;
  /** Extra header actions (rendered before the built-in ones). */
  actions?: ReactNode;
  /** Extra footer content (right side). */
  footer?: ReactNode;
  className?: string;
  describedBy?: string;
}) {
  const t = KIT_T[locale];
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = useMemo(() => textStats(value), [value]);
  const editable = !readOnly && !!onChange;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-[0.75rem] border bg-surface transition-colors duration-150 focus-within:border-accent",
        invalid ? "border-err" : "border-line",
        className,
      )}
    >
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-1.5">
        <label htmlFor={id} className="min-w-0 truncate text-sm font-semibold text-fg">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-1">
          {actions}
          {editable && fileAccept !== undefined && (
            <>
              <button type="button" className={buttonClass("ghost", "sm")} onClick={() => fileRef.current?.click()}>
                <FolderOpen aria-hidden />
                <span className="max-sm:sr-only">{t.openFile}</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={fileAccept || undefined}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  if (f.size > maxFileBytes) {
                    onFileError?.(t.fileTooBig);
                    return;
                  }
                  onChange?.(await f.text());
                }}
              />
            </>
          )}
          {editable && sample !== undefined && (
            <button type="button" className={buttonClass("ghost", "sm")} onClick={() => onChange?.(sample)}>
              <FileText aria-hidden />
              <span className="max-sm:sr-only">{t.sample}</span>
            </button>
          )}
          {editable && (
            <button type="button" className={buttonClass("ghost", "sm")} onClick={() => onChange?.("")} disabled={!value}>
              <Eraser aria-hidden />
              <span className="max-sm:sr-only">{t.clear}</span>
            </button>
          )}
        </div>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!editable}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        wrap={wrap ? "soft" : "off"}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="min-h-32 w-full resize-y bg-transparent px-3 py-2.5 font-mono text-sm leading-relaxed text-fg placeholder:text-fg-3 focus:outline-none"
      />
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-1 text-[0.8125rem] text-fg-3">
        <span className="tabular">{countsLabel(locale, stats.lines, stats.chars)}</span>
        {footer}
      </div>
    </div>
  );
}
