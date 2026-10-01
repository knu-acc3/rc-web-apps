"use client";

import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Pane } from "@/tools/dev/shared/Pane";
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
    <div className="grid gap-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="panel flex min-w-0 flex-col justify-center px-5 py-5">
        <div className={cn("font-mono text-6xl font-bold tracking-tight sm:text-7xl", tone(code))}>{code}</div>
        <div className="mt-2 text-lg font-semibold text-fg">{name}</div>
        <div className="text-[0.9375rem] text-fg-2">{label}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{classLabel}</Badge>
          <Badge tone={official ? "ok" : "warn"}>{statusLabel}</Badge>
        </div>
      </div>
      <Pane as="figure" title={exampleTitle} actions={<CopyButton value={example} label={t.copy} copiedLabel={t.copied} variant="secondary" compact />}>
        <pre className="max-w-full overflow-x-auto px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-fg">
          <code>{example}</code>
        </pre>
      </Pane>
    </div>
  );
}
