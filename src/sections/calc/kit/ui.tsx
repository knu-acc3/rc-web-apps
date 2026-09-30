"use client";

/**
 * Shared calculator layout for the calc, finance and health sections.
 *
 *   <CalcGrid inputs={…fields…} results={<><ResultMain …/><ResultRows …/></>} />
 *   <Explain title=… formula={[…]} notes={[…]} />
 *
 * Every calculator: live results (no Calculate button), inputs parsed with
 * `field()` from ./num, output formatted with ./fmt, state in the URL via
 * `useQueryState` from ./url-state, `aria-live` only on <ResultMain>.
 */

import { Info, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";

const K = {
  ru: {
    reset: "Сбросить",
    copyLink: "Ссылка на расчёт",
    linkCopied: "Ссылка скопирована",
    how: "Как считается",
    medical: "Расчёт носит справочный характер и не заменяет консультацию врача. При сомнениях о здоровье обратитесь к специалисту.",
    finance: "Расчёт ориентировочный: фактические условия банка, округления и налоги могут отличаться. Сверяйте итоговые суммы с договором.",
  },
  en: {
    reset: "Reset",
    copyLink: "Link to this result",
    linkCopied: "Link copied",
    how: "How it is calculated",
    medical: "For information only — this is not medical advice. If you have health concerns, talk to a qualified professional.",
    finance: "This is an estimate: actual bank terms, rounding and taxes may differ. Check the final figures against your contract.",
  },
} as const;

/* ───────────── Inputs ───────────── */

export function NumField({
  id,
  label,
  value,
  onChange,
  suffix,
  hint,
  error,
  placeholder,
  inputMode = "decimal",
  aside,
  size = "md",
  className,
  disabled,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  /** Unit shown inside the field on the right: "₸", "%", "лет"… */
  suffix?: string;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
  aside?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} aside={aside} className={className}>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          placeholder={placeholder}
          size={size}
          disabled={disabled}
          className="tabular"
          style={suffix ? { paddingRight: `calc(20px + ${Math.max(1, suffix.length)}ch)` } : undefined}
        />
        {suffix && (
          <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-3">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  hint,
  className,
  size = "md",
}: {
  id: string;
  label: ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: readonly Option<T>[];
  hint?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint} className={className}>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} size={size}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/** Two inputs side by side (stacks below 480px). */
export function FieldRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 min-[480px]:grid-cols-2", className)}>{children}</div>;
}

/* ───────────── Layout ───────────── */

/** Inputs panel on the left, results on the right (stacked on mobile). */
export function CalcGrid({ inputs, results, className }: { inputs: ReactNode; results: ReactNode; className?: string }) {
  return (
    <div className={cn("grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]", className)}>
      <Panel className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">{inputs}</Panel>
      <div className="flex min-w-0 flex-col gap-4">{results}</div>
    </div>
  );
}

/** Vertical stack for full-width tools (tables, charts, explanations under the grid). */
export function Stack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-col gap-4", className)}>{children}</div>;
}

/* ───────────── Results ───────────── */

/** The main answer. The only element with aria-live. */
export function ResultMain({
  label,
  value,
  sub,
  children,
  className,
  size = "lg",
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div className={cn("min-w-0 rounded-[12px] border border-line bg-surface p-4 sm:p-5", className)}>
      <div className="text-sm font-medium text-fg-2">{label}</div>
      <div
        aria-live="polite"
        aria-atomic="true"
        className={cn("tabular mt-1 break-words font-bold tracking-tight text-fg", size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl")}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[15px] text-fg-2">{sub}</div>}
      {children}
    </div>
  );
}

export interface ResultRow {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  strong?: boolean;
}

/** Label/value list of secondary results. */
export function ResultRows({ rows, title, className }: { rows: ResultRow[]; title?: ReactNode; className?: string }) {
  return (
    <Panel className={cn("min-w-0 overflow-hidden", className)}>
      {title && <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-fg">{title}</h2>}
      <dl className="divide-y divide-line">
        {rows.map((r, i) => (
          <div key={i} className={cn("flex items-baseline justify-between gap-4 px-4 py-2.5", r.strong && "bg-surface-2")}>
            <dt className="min-w-0 text-[15px] text-fg-2">
              {r.label}
              {r.hint && <span className="block text-[13px] text-fg-3">{r.hint}</span>}
            </dt>
            <dd className={cn("tabular shrink-0 text-right text-fg", r.strong ? "font-bold" : "font-semibold")}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/** Grid of small stat tiles. */
export function StatGrid({ items, className }: { items: { label: ReactNode; value: ReactNode; sub?: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("grid gap-3 min-[480px]:grid-cols-2", className)}>
      {items.map((s, i) => (
        <div key={i} className="min-w-0 rounded-[10px] border border-line bg-surface px-4 py-3">
          <div className="text-[13px] font-medium text-fg-2">{s.label}</div>
          <div className="tabular mt-0.5 break-words text-xl font-semibold text-fg">{s.value}</div>
          {s.sub && <div className="mt-0.5 text-[13px] text-fg-3">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/** Formula + assumptions panel ("Как считается"). */
export function Explain({
  locale,
  title,
  formula,
  notes,
  children,
  className,
}: {
  locale: Locale;
  title?: ReactNode;
  /** Formula lines, rendered monospace. */
  formula?: string[];
  /** Assumptions / constants, rendered as a bullet list. */
  notes?: ReactNode[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn("min-w-0 p-4 sm:p-5", className)}>
      <h2 className="text-base font-semibold text-fg">{title ?? K[locale].how}</h2>
      {formula && formula.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-[8px] bg-surface-2 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-fg sm:text-sm">
          {formula.map((l, i) => (
            <div key={i} className="whitespace-pre">
              {l}
            </div>
          ))}
        </div>
      )}
      {notes && notes.length > 0 && (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg-2">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
      {children}
    </Panel>
  );
}

/** Scrollable table in the site's .tbl style; header stays visible while scrolling. */
export function DataTable({
  head,
  rows,
  caption,
  maxHeight,
  foot,
  className,
  alignRight = true,
}: {
  head: ReactNode[];
  rows: ReactNode[][];
  caption?: string;
  /** e.g. 420 → scroll inside the table after 420px. */
  maxHeight?: number;
  foot?: ReactNode[];
  className?: string;
  /** Right-align every column except the first (numbers). */
  alignRight?: boolean;
}) {
  const al = (j: number) => (alignRight && j > 0 ? "text-right" : undefined);
  return (
    <div className={cn("tbl", className)} style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
      <table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className={maxHeight ? "sticky top-0 z-[1]" : undefined}>
          <tr>
            {head.map((h, j) => (
              <th key={j} scope="col" className={al(j)}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={cn("tabular whitespace-nowrap", al(j))}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr>
              {foot.map((c, j) => (
                <td key={j} className={cn("tabular whitespace-nowrap border-t border-line bg-surface-2 font-semibold", al(j))}>
                  {c}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/* ───────────── Actions & notices ───────────── */

/** "Link to this result" + "Reset" (+ any extra buttons passed as children). */
export function ToolActions({
  locale,
  onReset,
  shareUrl,
  children,
  className,
}: {
  locale: Locale;
  onReset?: () => void;
  shareUrl?: () => string;
  children?: ReactNode;
  className?: string;
}) {
  const t = K[locale];
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
      {shareUrl && <CopyButton value={shareUrl} label={t.copyLink} copiedLabel={t.linkCopied} variant="outline" size="sm" />}
      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw aria-hidden />
          {t.reset}
        </Button>
      )}
    </div>
  );
}

/** Standard disclaimers. `kind="medical"` is mandatory on every health page. */
export function Disclaimer({ locale, kind, children, className }: { locale: Locale; kind?: "medical" | "finance"; children?: ReactNode; className?: string }) {
  return (
    <Notice className={cn("flex items-start gap-2.5", className)}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children ?? (kind ? K[locale][kind] : null)}</span>
    </Notice>
  );
}

/** Small label/value chips row (e.g. «Неделя 12 · 2-й триместр»). */
export function InlineFacts({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <div className={cn("mt-3 flex flex-wrap gap-2", className)}>
      {items.map((x, i) => (
        <span key={i} className="inline-flex items-center rounded-full bg-surface-2 px-3 py-1 text-[13px] font-medium text-fg-2">
          {x}
        </span>
      ))}
    </div>
  );
}
