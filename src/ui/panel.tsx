import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Material 3 card — the main building block of tool UIs. "elevated" (default): white with a soft shadow, no border;
 * "filled"/"inset": a tonal block; "outlined": a hairline. A card inside a card automatically becomes a tonal inset
 * (`.panel .panel` in globals.css), so borders never nest.
 */
export function Panel({ className, variant = "elevated", ...props }: ComponentProps<"div"> & { variant?: "elevated" | "filled" | "outlined" | "inset" }) {
  return <div className={cn("panel", variant !== "elevated" && `panel-${variant}`, className)} {...props} />;
}

export function PanelHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-12 items-center justify-between gap-3 border-b border-line px-4 py-2 sm:px-5", className)}>
      <div className="min-w-0 truncate text-sm font-semibold text-fg">{title}</div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/** Large result value with a caption. */
export function Stat({
  label,
  value,
  sub,
  className,
  size = "lg",
  action,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
  action?: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 rounded-[1rem] bg-surface-2 px-4 py-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[0.8125rem] font-medium text-fg-2">{label}</div>
        {action}
      </div>
      <div
        className={cn(
          "tabular mt-1 break-words font-semibold tracking-tight text-fg",
          size === "xl" ? "text-4xl sm:text-5xl" : size === "lg" ? "text-2xl sm:text-3xl" : "text-xl",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-sm text-fg-3">{sub}</div>}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "accent" | "ok" | "warn" | "err" }) {
  const tones = {
    neutral: "bg-surface-2 text-fg-2",
    accent: "bg-accent-soft text-accent",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    err: "bg-err-soft text-err",
  } as const;
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.8125rem] font-medium", tones[tone], className)}
      {...props}
    />
  );
}

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-[0.375rem] border border-line bg-surface px-1.5 font-sans text-xs font-medium text-fg-2",
        className,
      )}
      {...props}
    />
  );
}

export function Notice({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"div"> & { tone?: "neutral" | "ok" | "warn" | "err" }) {
  const tones = {
    neutral: "bg-surface-2 text-fg-2",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    err: "bg-err-soft text-err",
  } as const;
  return <div role={tone === "err" ? "alert" : undefined} className={cn("rounded-[1rem] px-4 py-3 text-sm", tones[tone], className)} {...props} />;
}
