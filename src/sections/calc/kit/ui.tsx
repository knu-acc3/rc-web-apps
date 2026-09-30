"use client";

/**
 * Shared calculator layout for the calc, finance and health sections.
 * Design rule: ONE focal point — the primary inputs and one prominent result card.
 *
 *   <CalcGrid
 *     inputs={<>
 *       <NumField size="lg" …/>             primary inputs (1–3)
 *       <OptionsRow>…</OptionsRow>           at most one quiet row of secondary options
 *       <Advanced title=…>…</Advanced>       rarely used inputs, collapsed
 *     </>}
 *     result={<ResultMain label value sub rows={…} actions={<ToolActions …/>} />}
 *   />
 *   <Explain …/>, tables, charts            below, visually quiet
 *
 * Every calculator: live results (no Calculate button), inputs parsed with `field()` from ./num,
 * output formatted with ./fmt, state in the URL via `useQueryState`, `aria-live` only on ResultMain.
 */

import { Info, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";

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
          <span aria-hidden className={cn("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-3", size === "lg" ? "text-base" : "text-sm")}>
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
  return <div className={cn("grid items-end gap-3 min-[480px]:grid-cols-2", className)}>{children}</div>;
}

/** The single quiet row of secondary options (small segmented controls / selects). */
export function OptionsRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2.5", className)}>{children}</div>;
}

/** Compact select with a visible inline label, for OptionsRow. */
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
  options: readonly Option<T>[];
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[13px] text-fg-3">
        {label}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} size="sm" className="min-w-0">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

/** Compact segmented control for OptionsRow (label is announced, optionally shown). */
export function InlineToggle<T extends string>({
  label,
  value,
  onChange,
  options,
  showLabel = false,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: ReactNode; title?: string }[];
  showLabel?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {showLabel && <span className="text-[13px] text-fg-3">{label}</span>}
      <Segmented size="sm" label={label} value={value} onChange={onChange} options={options} />
    </div>
  );
}

/** Rarely used inputs, collapsed by default. */
export function Advanced({ title, children, open }: { title: ReactNode; children: ReactNode; open?: boolean }) {
  return (
    <details className="group border-t border-line pt-3" open={open || undefined}>
      <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg">
        <span aria-hidden className="inline-block transition-transform duration-150 group-open:rotate-90">
          ›
        </span>
        {title}
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}

/* ───────────── Layout ───────────── */

/** Inputs on the left, the result card on the right (stacked on mobile: inputs first). */
export function CalcGrid({ inputs, result, className }: { inputs: ReactNode; result: ReactNode; className?: string }) {
  return (
    <div className={cn("grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6", className)}>
      <Panel className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">{inputs}</Panel>
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">{result}</div>
    </div>
  );
}

/** Vertical stack for the whole tool (grid, then quiet details below). */
export function Stack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-col gap-6", className)}>{children}</div>;
}

/* ───────────── Results ───────────── */

export interface ResultRow {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}

/**
 * The focal result card: big value (the only aria-live element), one line of context,
 * a few quiet secondary rows and quiet actions.
 */
export function ResultMain({
  label,
  value,
  sub,
  rows,
  actions,
  children,
  className,
  size = "lg",
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  rows?: ResultRow[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div className={cn("min-w-0 rounded-[12px] bg-accent-soft p-5 sm:p-6", className)}>
      <div className="text-sm font-medium text-fg-2">{label}</div>
      <div
        aria-live="polite"
        aria-atomic="true"
        className={cn("tabular mt-1 break-words font-bold tracking-tight text-fg", size === "lg" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl")}
      >
        {value}
      </div>
      {sub && <div className="mt-2 text-[15px] text-fg-2">{sub}</div>}
      {children}
      {rows && rows.length > 0 && (
        <dl className="mt-4 divide-y divide-[color-mix(in_oklab,var(--accent)_14%,transparent)] border-t border-[color-mix(in_oklab,var(--accent)_14%,transparent)]">
          {rows.map((r, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="min-w-0 text-sm text-fg-2">
                {r.label}
                {r.hint && <span className="block text-[12px] text-fg-3">{r.hint}</span>}
              </dt>
              <dd className="tabular shrink-0 text-right text-[15px] font-semibold text-fg">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
}

/** Label/value list of secondary results, placed below the grid (quiet). */
export function ResultRows({ rows, title, className }: { rows: ResultRow[]; title?: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0", className)}>
      {title && <h2 className="mb-2 text-base font-semibold text-fg">{title}</h2>}
      <dl className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className="min-w-0 text-[15px] text-fg-2">
              {r.label}
              {r.hint && <span className="block text-[13px] text-fg-3">{r.hint}</span>}
            </dt>
            <dd className="tabular shrink-0 text-right font-semibold text-fg">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Formula + assumptions ("Как считается") — quiet, below the tool. */
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
    <section className={cn("min-w-0", className)}>
      <h2 className="text-base font-semibold text-fg">{title ?? K[locale].how}</h2>
      {formula && formula.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-[10px] border border-line bg-surface px-4 py-3 font-mono text-[13px] leading-relaxed text-fg sm:text-sm">
          {formula.map((l, i) => (
            <div key={i} className="whitespace-pre">
              {l}
            </div>
          ))}
        </div>
      )}
      {notes && notes.length > 0 && (
        <ul className="mt-3 max-w-[75ch] list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg-2">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
      {children}
    </section>
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
  highlight,
  align,
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
  /** Index of a row to highlight. */
  highlight?: number;
  /** Per-column alignment, overrides `alignRight`. */
  align?: ("left" | "right")[];
}) {
  const al = (j: number) => (align ? (align[j] === "right" ? "text-right" : undefined) : alignRight && j > 0 ? "text-right" : undefined);
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
            <tr key={i} className={highlight === i ? "bg-accent-soft" : undefined}>
              {r.map((c, j) => (
                <td key={j} className={cn("tabular whitespace-nowrap", al(j), highlight === i && "font-semibold")}>
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

/** Quiet "Link to this result" + "Reset" (+ extra buttons as children). Put it in ResultMain `actions`. */
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
    <div className={cn("-ml-2 flex flex-wrap items-center gap-1", className)}>
      {children}
      {shareUrl && <CopyButton value={shareUrl} label={t.copyLink} copiedLabel={t.linkCopied} variant="ghost" size="sm" />}
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

/** Small label chips (e.g. «Неделя 12 · 2-й триместр»). */
export function InlineFacts({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <div className={cn("mt-3 flex flex-wrap gap-2", className)}>
      {items.map((x, i) => (
        <span key={i} className="inline-flex items-center rounded-full bg-surface px-3 py-1 text-[13px] font-medium text-fg-2">
          {x}
        </span>
      ))}
    </div>
  );
}

/** Section heading for quiet content below the tool. */
export function SubHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-fg">{children}</h2>
      {aside}
    </div>
  );
}

