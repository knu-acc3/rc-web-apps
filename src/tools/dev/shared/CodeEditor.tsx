"use client";

import { Eraser, FileText, FolderOpen } from "lucide-react";
import { useMemo, useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/ui/button";
import { countsLabel, KIT_T, textStats } from "./labels";

/**
 * Plain-textarea code editor: the field is the card itself (no box inside a box). A title row with the label and
 * quiet actions (sample, open file, clear) sits above the text, line / character counts below it. Inside a Panel it
 * becomes a tonal block; focus draws an accent ring around the whole card.
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
        "panel flex min-w-0 flex-col overflow-hidden transition-shadow duration-150",
        invalid ? "ring-2 ring-inset ring-err" : "focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent",
        className,
      )}
    >
      <div className="flex min-h-[3.25rem] items-center justify-between gap-2 border-b border-line py-1.5 pl-4 pr-2">
        <label htmlFor={id} className="min-w-0 truncate text-sm font-semibold text-fg">
          {label}
        </label>
        <div className="flex shrink-0 items-center gap-0.5">
          {actions}
          {editable && sample !== undefined && (
            <Button variant="text" size="sm" className="px-3! max-sm:px-2.5!" title={t.sample} onClick={() => onChange?.(sample)}>
              <FileText aria-hidden />
              <span className="max-sm:sr-only">{t.sample}</span>
            </Button>
          )}
          {editable && fileAccept !== undefined && (
            <>
              <IconButton label={t.openFile} icon={<FolderOpen aria-hidden />} onClick={() => fileRef.current?.click()} />
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
          {editable && <IconButton label={t.clear} icon={<Eraser aria-hidden />} onClick={() => onChange?.("")} disabled={!value} />}
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
        className="min-h-32 w-full flex-1 resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-fg placeholder:text-fg-3 focus:outline-none max-sm:max-h-[60vh]"
      />
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 pb-2 text-[0.8125rem] text-fg-3">
        <span className="tabular">{countsLabel(locale, stats.lines, stats.chars)}</span>
        {footer}
      </div>
    </div>
  );
}
