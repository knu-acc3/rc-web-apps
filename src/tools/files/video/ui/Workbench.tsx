"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Fold } from "@/ui/fold";
import { Notice, Panel } from "@/ui/panel";
import { FilePicker, MediaFacts } from "./FilePicker";
import type { Probe } from "./hooks";
import { useWebCodecs } from "./hooks";
import { UI } from "./strings";

/**
 * Layout for single-file media tools, built around one focal point: the file and its preview on the left (on top on
 * phones), one card with the file, the few settings and the one filled main action on the right; progress replaces
 * the button while working, the result card appears under it.
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
  if (!file) return <FilePicker locale={locale} file={null} onFile={onFile} accept={accept} kind={kind} />;
  return (
    <div className={cn("grid items-start gap-4", preview && "lg:grid-cols-[minmax(0,3fr)_minmax(21rem,2fr)] lg:gap-6")}>
      {preview && <div className="flex min-w-0 flex-col gap-3">{preview}</div>}
      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <FilePicker locale={locale} file={file} onFile={onFile} accept={accept} kind={kind} disabled={busy}>
            {probe && (
              <Fold variant="inline" title={t.fileInfo} className="text-sm">
                <MediaFacts locale={locale} probe={probe} />
              </Fold>
            )}
          </FilePicker>
          {webcodecs === false && <Notice tone="warn">{t.noWebCodecs}</Notice>}
          {warning}
          {options && <div className="flex min-w-0 flex-col gap-5">{options}</div>}
          {action && !result && !busy && (
            <Button variant="filled" size="xl" fullWidth onClick={action.onClick} disabled={action.disabled}>
              {action.icon}
              <span className="truncate">{action.label}</span>
            </Button>
          )}
          {status}
        </Panel>
        {result}
      </div>
    </div>
  );
}
