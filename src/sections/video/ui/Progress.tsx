"use client";

import { X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Notice } from "@/ui/panel";
import type { JobState } from "./hooks";
import { errorText, UI } from "./strings";

/** Accessible determinate progress bar. */
export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}%`}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Stage text + progress bar + cancel button for a running job; error/cancel notices otherwise. */
export function JobProgress<R>({ job, locale, onCancel, onRetry }: { job: JobState<R>; locale: Locale; onCancel: () => void; onRetry?: () => void }) {
  const t = UI[locale];
  if (job.status === "running") {
    const downloading = job.stage === "download";
    const value = downloading ? job.download : job.progress;
    const text = job.stage === "prepare" ? t.preparing : downloading ? t.downloadingEngine : job.engine === "ffmpeg" ? t.ffmpegWork : t.processing;
    return (
      <div className="flex flex-col gap-2 rounded-[10px] bg-surface-2 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-sm font-medium text-fg-2">
            {text}
            {job.stage !== "prepare" && <span className="tabular text-fg-3"> · {formatNumber(locale, Math.round(value * 100))}%</span>}
          </span>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X aria-hidden />
            {t.cancel}
          </Button>
        </div>
        <ProgressBar value={value} label={t.progress} className="bg-surface!" />
      </div>
    );
  }
  if (job.status === "error")
    return (
      <Notice tone="err" className="flex flex-wrap items-center justify-between gap-2">
        <span>{errorText(locale, job.error)}</span>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            {t.retry}
          </Button>
        )}
      </Notice>
    );
  if (job.status === "cancelled") return <Notice>{t.cancelled}</Notice>;
  return null;
}
