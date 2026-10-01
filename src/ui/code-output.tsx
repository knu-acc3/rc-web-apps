"use client";

import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { downloadText } from "@/lib/clipboard";
import { buttonClass } from "./button";
import { CopyButton } from "./copy-button";

/** Read-only code/text output with copy and optional download. */
export function CodeOutput({
  value,
  title,
  filename,
  mime,
  labels,
  className,
  minRows = 6,
  extraActions,
}: {
  value: string;
  title?: ReactNode;
  filename?: string;
  mime?: string;
  labels: { copy: string; copied: string; download: string };
  className?: string;
  minRows?: number;
  extraActions?: ReactNode;
}) {
  return (
    <div className={cn("panel flex min-w-0 flex-col overflow-hidden", className)}>
      <div className="flex min-h-12 items-center justify-between gap-2 border-b border-line py-1.5 pl-4 pr-2">
        <div className="min-w-0 truncate text-sm font-semibold text-fg">{title}</div>
        <div className="flex items-center gap-1">
          {extraActions}
          {filename && (
            <button
              type="button"
              className={buttonClass("ghost", "sm")}
              onClick={() => downloadText(value, filename, mime)}
              disabled={!value}
              title={labels.download}
            >
              <Download aria-hidden />
              <span className="max-sm:sr-only">{labels.download}</span>
            </button>
          )}
          <CopyButton value={value} label={labels.copy} copiedLabel={labels.copied} variant="secondary" compact />
        </div>
      </div>
      <textarea
        readOnly
        value={value}
        rows={minRows}
        spellCheck={false}
        aria-label={typeof title === "string" ? title : labels.copy}
        className="min-h-32 w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-fg focus:outline-none"
      />
    </div>
  );
}
