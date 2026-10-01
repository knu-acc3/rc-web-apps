import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A titled block for code and results: a title row (title + actions) over the content. It is a Material card on the
 * page and turns into a tonal block without a border inside a Panel (`.panel .panel`), so surfaces never nest.
 * The same shape as CodeEditor and CodeOutput, so an input and its result sit side by side as twins.
 */
export function Pane({
  title,
  htmlFor,
  actions,
  footer,
  invalid = false,
  className,
  children,
  as: As = "div",
}: {
  title: ReactNode;
  /** Makes the title the label of this field. */
  htmlFor?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  invalid?: boolean;
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "figure";
}) {
  const Title = htmlFor ? "label" : "div";
  return (
    <As className={cn("panel flex min-w-0 flex-col overflow-hidden transition-shadow duration-150", invalid && "ring-2 ring-inset ring-err", className)}>
      <div className="flex min-h-[3.25rem] items-center justify-between gap-2 border-b border-line py-1.5 pl-4 pr-2">
        <Title htmlFor={htmlFor} className="min-w-0 truncate text-sm font-semibold text-fg">
          {title}
        </Title>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      {children}
      {footer && <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 pb-2 text-[0.8125rem] text-fg-3">{footer}</div>}
    </As>
  );
}

/**
 * A labelled control inside a row of options: "Отступ [Select]". Shrinks instead of overflowing on phones.
 * The caption labels a single field it wraps (or the one named by `htmlFor`); for a Segmented pass `group` — the
 * caption is then plain text and the Segmented carries its own aria-label.
 */
export function Opt({ label, htmlFor, group = false, children, className }: { label: ReactNode; htmlFor?: string; group?: boolean; children: ReactNode; className?: string }) {
  const cls = cn("flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1.5", className);
  if (group || htmlFor) {
    return (
      <div className={cls}>
        {htmlFor ? (
          <label htmlFor={htmlFor} className="shrink-0">
            {label}
          </label>
        ) : (
          <span aria-hidden className="shrink-0">
            {label}
          </span>
        )}
        {children}
      </div>
    );
  }
  return (
    <label className={cls}>
      <span className="shrink-0">{label}</span>
      {children}
    </label>
  );
}

/** The quiet row of secondary settings under a tool. */
export function OptionsRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2 empty:hidden", className)}>{children}</div>;
}
