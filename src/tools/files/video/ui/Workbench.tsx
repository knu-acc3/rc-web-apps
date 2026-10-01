"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Notice } from "@/ui/panel";
import { FilePicker, MediaFacts } from "./FilePicker";
import type { Probe } from "./hooks";
import { useWebCodecs } from "./hooks";
import { UI } from "./strings";

/**
 * Layout for single-file media tools, built around one focal point:
 * file → preview → one quiet row of options → one primary action → progress/result.
 */
export function Workbench({
  locale,
  kind,
  accept,
  file,
  onFile,
  probe,
  busy,
  preview,
  options,
  action,
  status,
  result,
  warning,
}: {
  locale: Locale;
  kind: "video" | "audio";
  accept: string;
  file: File | null;
  onFile: (f: File) => void;
  probe?: Probe;
  busy: boolean;
  preview?: ReactNode;
  options?: ReactNode;
  action?: { label: string; onClick: () => void; disabled?: boolean; icon?: ReactNode };
  status?: ReactNode;
  result?: ReactNode;
  warning?: ReactNode;
}) {
  const t = UI[locale];
  const webcodecs = useWebCodecs();
  return (
    <div className="flex flex-col gap-4">
      {!file ? (
        <FilePicker locale={locale} file={null} onFile={onFile} accept={accept} kind={kind} />
      ) : (
        <>
          {preview}
          <FilePicker locale={locale} file={file} onFile={onFile} accept={accept} kind={kind} disabled={busy}>
            {probe && (
              <details className="group text-sm">
                <summary className="inline-flex cursor-pointer items-center gap-1 text-fg-3 hover:text-fg">
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                  {t.detected}, {t.codecs.toLowerCase()}
                </summary>
                <div className="mt-2">
                  <MediaFacts locale={locale} probe={probe} />
                </div>
              </details>
            )}
          </FilePicker>
          {webcodecs === false && <Notice tone="warn">{t.noWebCodecs}</Notice>}
          {warning}
          {options && <div className="flex flex-wrap items-end gap-3">{options}</div>}
          {action && !result && (
            <Button variant="primary" size="lg" onClick={action.onClick} disabled={busy || action.disabled} className="w-full sm:w-auto sm:self-start">
              {action.icon}
              {action.label}
            </Button>
          )}
          {status}
          {result}
        </>
      )}
    </div>
  );
}
