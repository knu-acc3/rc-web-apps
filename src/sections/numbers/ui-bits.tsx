"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";

/**
 * Quiet click-to-copy value: looks like text, shows a small copy icon on hover/focus.
 * Used for secondary results so the screen has no rows of buttons.
 */
export function CopyText({ value, children, label, copiedLabel, className }: { value: string; children?: ReactNode; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <button
      type="button"
      title={label}
      aria-label={`${label}: ${value}`}
      onClick={async () => {
        if (!value || !(await copyText(value))) return;
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
      }}
      className={cn("group inline-flex max-w-full items-baseline gap-1.5 rounded-[0.375rem] text-left text-fg transition-colors hover:text-accent", className)}
    >
      <span className="min-w-0 break-words">{children ?? value}</span>
      {copied ? (
        <Check className="size-3.5 shrink-0 translate-y-0.5 text-ok" aria-hidden />
      ) : (
        <Copy className="size-3.5 shrink-0 translate-y-0.5 text-fg-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
}

/** Quiet list of secondary results: label on the left (or above on phones), value on the right. */
export function Details({ rows, label, copiedLabel }: { rows: { key: string; label: string; value: string; view?: ReactNode; lang?: string; mono?: boolean }[]; label: string; copiedLabel: string }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map((r) => (
        <div key={r.key} className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-4">
          <dt className="text-sm text-fg-3">{r.label}</dt>
          <dd lang={r.lang} className={cn("min-w-0 text-[0.9375rem]", r.mono && "font-mono")}>
            {r.value ? (
              <CopyText value={r.value} label={label} copiedLabel={copiedLabel}>
                {r.view}
              </CopyText>
            ) : (
              <span className="text-fg-3">{r.view ?? "—"}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
