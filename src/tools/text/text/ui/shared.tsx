"use client";

import { Eraser, FileUp } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { Select } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { graphemeCount } from "../lib/textOps";

export const TX = {
  ru: {
    input: "Исходный текст",
    output: "Результат",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    clear: "Очистить",
    open: "Открыть файл",
    chars: ["символ", "символа", "символов"],
    lines: ["строка", "строки", "строк"],
    words: ["слово", "слова", "слов"],
    options: "Настройки",
    more: "Дополнительные настройки",
    placeholder: "Вставьте или введите текст…",
  },
  en: {
    input: "Source text",
    output: "Result",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    clear: "Clear",
    open: "Open file",
    chars: ["character", "characters"],
    lines: ["line", "lines"],
    words: ["word", "words"],
    options: "Options",
    more: "More options",
    placeholder: "Paste or type your text…",
  },
} as const;

export function countLabel(locale: Locale, n: number, forms: readonly string[]): string {
  return `${formatNumber(locale, n)} ${plural(locale, n, forms)}`;
}

/** Debounce a fast-changing value (for heavy recomputation on long texts). */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Read a local text file (UTF-8) chosen by the user. */
export function FileOpenButton({ locale, onText, accept = ".txt,.md,.csv,.html,.htm,.json,.log,text/*" }: { locale: Locale; onText: (text: string, name: string) => void; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={buttonClass("ghost", "sm")} onClick={() => ref.current?.click()}>
        <FileUp aria-hidden />
        <span className="max-sm:sr-only">{TX[locale].open}</span>
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-label={TX[locale].open}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onText(await f.text(), f.name);
        }}
      />
    </>
  );
}

/** Labelled text input area with character count, clear and open-file actions. */
export function InputPanel({
  id,
  locale,
  value,
  onChange,
  label,
  rows = 10,
  placeholder,
  mono = false,
  actions,
  footer,
  allowFile = true,
  className,
  fieldClassName,
}: {
  id: string;
  locale: Locale;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
  actions?: ReactNode;
  footer?: ReactNode;
  allowFile?: boolean;
  className?: string;
  /** Extra classes of the textarea (e.g. a taller minimum height on desktop). */
  fieldClassName?: string;
}) {
  const t = TX[locale];
  const n = graphemeCount(value);
  return (
    <div className={cn("panel flex min-w-0 flex-col overflow-hidden", className)}>
      <div className="flex min-h-12 items-center justify-between gap-2 border-b border-line py-1.5 pr-2 pl-4">
        <label htmlFor={id} className="min-w-0 truncate text-sm font-semibold text-fg">
          {label ?? t.input}
        </label>
        <div className="flex items-center gap-1">
          <span className="tabular hidden text-[0.8125rem] text-fg-3 sm:inline">{countLabel(locale, n, t.chars)}</span>
          {actions}
          {allowFile && <FileOpenButton locale={locale} onText={(text) => onChange(text)} />}
          <button type="button" className={buttonClass("ghost", "sm")} onClick={() => onChange("")} disabled={!value} title={t.clear}>
            <Eraser aria-hidden />
            <span className="max-sm:sr-only">{t.clear}</span>
          </button>
        </div>
      </div>
      <textarea
        id={id}
        value={value}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder ?? t.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-h-40 w-full resize-y bg-transparent px-4 py-3 leading-relaxed text-fg placeholder:text-fg-3 focus:outline-none",
          mono ? "font-mono text-sm max-sm:text-base" : "text-base sm:text-[0.9375rem]",
          fieldClassName,
        )}
      />
      {footer}
    </div>
  );
}

export function OutputPanel({
  locale,
  value,
  title,
  filename = "text.txt",
  minRows = 10,
  extraActions,
  className,
}: {
  locale: Locale;
  value: string;
  title?: ReactNode;
  filename?: string;
  minRows?: number;
  extraActions?: ReactNode;
  className?: string;
}) {
  const t = TX[locale];
  return (
    <CodeOutput
      value={value}
      title={title ?? t.output}
      filename={filename}
      labels={{ copy: t.copy, copied: t.copied, download: t.download }}
      minRows={minRows}
      extraActions={extraActions}
      className={className}
    />
  );
}

/** Two panes side by side on desktop, stacked on mobile. */
export function TwoPane({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 lg:grid-cols-2", className)}>{children}</div>;
}

/** One quiet row of the most important options. */
export function OptionsBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm", className)}>{children}</div>;
}

/** Secondary options, collapsed by default so the tool has one focal point. */
export function MoreOptions({ locale, children, className }: { locale: Locale; children: ReactNode; className?: string }) {
  return (
    <Fold variant="inline" title={TX[locale].more} className={className} bodyClassName="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
      {children}
    </Fold>
  );
}

/** A labelled drop-down for options bars: the shared Material Select (tonal), sized to its longest option. */
export function InlineSelect<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1">
      <label htmlFor={id} className="text-sm text-fg-2">
        {label}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} size="sm" variant="tonal" className="min-w-0 max-w-full">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

