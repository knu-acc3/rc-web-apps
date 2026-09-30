"use client";

import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/ui/copy-button";
import { Badge } from "@/ui/panel";

export interface CodeCardProps {
  locale: Locale;
  code: number;
  name: string;
  /** Translated name / short meaning. */
  label: string;
  classLabel: string;
  statusLabel: string;
  official: boolean;
  example: string;
  exampleTitle: string;
}

const tone = (code: number) => (code >= 500 ? "text-err" : code >= 400 ? "text-warn" : code >= 300 ? "text-accent" : code >= 200 ? "text-ok" : "text-fg-2");

const T = {
  ru: { copy: "Копировать", copied: "Скопировано" },
  en: { copy: "Copy", copied: "Copied" },
} as const;

/** Focal card of a status code page: the code itself and a raw response example. */
export default function CodeCard({ locale, code, name, label, classLabel, statusLabel, official, example, exampleTitle }: CodeCardProps) {
  const t = T[locale];
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div className="flex flex-col justify-center rounded-[12px] bg-surface-2 px-5 py-5">
        <div className={cn("font-mono text-6xl font-bold tracking-tight", tone(code))}>{code}</div>
        <div className="mt-2 text-lg font-semibold text-fg">{name}</div>
        <div className="text-[15px] text-fg-2">{label}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{classLabel}</Badge>
          <Badge tone={official ? "ok" : "warn"}>{statusLabel}</Badge>
        </div>
      </div>
      <figure className="flex min-w-0 flex-col overflow-hidden rounded-[12px] border border-line bg-surface">
        <figcaption className="flex min-h-11 items-center justify-between gap-2 border-b border-line px-4 py-1.5">
          <span className="text-sm font-semibold text-fg-2">{exampleTitle}</span>
          <CopyButton value={example} label={t.copy} copiedLabel={t.copied} variant="ghost" />
        </figcaption>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-fg">
          <code>{example}</code>
        </pre>
      </figure>
    </div>
  );
}
