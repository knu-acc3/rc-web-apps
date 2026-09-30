"use client";

import {
  ArrowRight,
  CheckCircle,
  DownloadSimple,
  FileAudio,
  FileImage,
  FilePdf,
  FileVideo,
  SpinnerGap,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  OUTPUT_FORMATS,
  OUTPUT_LABELS,
} from "@/src/lib/file-conversion/formats";
import type { ConversionFormat, ConversionJob, FileCategory } from "@/src/lib/file-conversion/types";

const iconByCategory = {
  image: FileImage,
  audio: FileAudio,
  video: FileVideo,
  pdf: FilePdf,
  unknown: WarningCircle,
};

const categoryLabel: Record<FileCategory, { ru: string; en: string }> = {
  image: { ru: "Изображение", en: "Image" },
  audio: { ru: "Аудио", en: "Audio" },
  video: { ru: "Видео", en: "Video" },
  pdf: { ru: "PDF", en: "PDF" },
  unknown: { ru: "Неизвестный файл", en: "Unknown file" },
};

function formatSize(bytes: number, isEn: boolean) {
  if (!Number.isFinite(bytes) || bytes <= 0) return isEn ? "0 B" : "0 Б";
  const units = isEn ? ["B", "KB", "MB", "GB"] : ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function Status({ job, isEn }: { job: ConversionJob; isEn: boolean }) {
  if (job.status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
        <SpinnerGap size={15} className="animate-spin" />
        {Math.round(job.progress * 100)}%
      </span>
    );
  }
  if (job.status === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-success)]">
        <CheckCircle size={15} weight="fill" /> {isEn ? "Ready" : "Готово"}
      </span>
    );
  }
  if (job.status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger)]">
        <WarningCircle size={15} /> {isEn ? "Error" : "Ошибка"}
      </span>
    );
  }
  if (job.status === "cancelled") return <span className="text-xs text-[var(--color-text-muted)]">{isEn ? "Cancelled" : "Отменено"}</span>;
  return <span className="text-xs font-semibold text-[var(--color-success)]">{isEn ? "Ready" : "Готов"}</span>;
}

export function ConversionQueue({
  jobs,
  isEn,
  onCancel,
  onDownload,
  onFormat,
  onRemove,
}: {
  jobs: ConversionJob[];
  isEn: boolean;
  onCancel: (id: string) => void;
  onDownload: (job: ConversionJob) => void;
  onFormat: (id: string, format: ConversionFormat) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="hidden grid-cols-[minmax(220px,1.4fr)_28px_minmax(130px,.65fr)_110px_100px_44px] items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-4 py-2 text-xs font-bold text-[var(--color-text-muted)] sm:grid">
        <span>{isEn ? "File" : "Файл"}</span><span />
        <span>{isEn ? "Output" : "Формат"}</span>
        <span>{isEn ? "Estimated" : "Примерно"}</span>
        <span>{isEn ? "Status" : "Статус"}</span><span />
      </div>
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {jobs.map((job) => {
          const Icon = iconByCategory[job.detected.category];
          const options = job.detected.category === "unknown" ? [] : OUTPUT_FORMATS[job.detected.category];
          return (
            <div key={job.id} className="px-3 py-3 sm:grid sm:grid-cols-[minmax(220px,1.4fr)_28px_minmax(130px,.65fr)_110px_100px_44px] sm:items-center sm:gap-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Icon size={22} weight="duotone" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold" title={job.detected.file.name}>{job.detected.file.name || "clipboard-file"}</span>
                  <span className="block text-xs text-[var(--color-text-muted)]">
                    {categoryLabel[job.detected.category][isEn ? "en" : "ru"]} · {formatSize(job.detected.file.size, isEn)}
                  </span>
                </span>
              </div>
              <ArrowRight className="hidden text-[var(--color-text-subtle)] sm:block" size={18} />
              <div className="mt-3 sm:mt-0">
                {options.length > 0 ? (
                  <Select value={job.outputFormat} onValueChange={(value) => onFormat(job.id, value as ConversionFormat)} disabled={job.status === "processing"}>
                    <SelectTrigger aria-label={isEn ? `Output format for ${job.detected.file.name}` : `Формат для ${job.detected.file.name}`} className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((format) => <SelectItem key={format} value={format}>{OUTPUT_LABELS[format]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <span className="text-sm text-[var(--color-danger)]">—</span>}
              </div>
              <div className="mt-2 flex items-center justify-between sm:mt-0 sm:block">
                <span className="text-xs text-[var(--color-text-muted)] sm:hidden">{isEn ? "Estimated" : "Примерно"}</span>
                <span className="text-sm font-semibold">
                  {job.result ? formatSize(job.result.blob.size, isEn) : job.estimatedSize ? `≈ ${formatSize(job.estimatedSize, isEn)}` : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between sm:mt-0 sm:block">
                <Status job={job} isEn={isEn} />
                {job.status === "processing" && (
                  <button type="button" className="ml-2 text-xs font-semibold text-[var(--color-danger)] underline sm:ml-0 sm:mt-1 sm:block" onClick={() => onCancel(job.id)}>
                    {isEn ? "Cancel" : "Отменить"}
                  </button>
                )}
              </div>
              <div className="mt-2 flex justify-end sm:mt-0">
                {job.status === "done" && job.result ? (
                  <Button size="icon-sm" variant="ghost" onClick={() => onDownload(job)} aria-label={isEn ? `Download ${job.result.fileName}` : `Скачать ${job.result.fileName}`}>
                    <DownloadSimple size={18} />
                  </Button>
                ) : (
                  <Button size="icon-sm" variant="ghost" onClick={() => onRemove(job.id)} disabled={job.status === "processing"} aria-label={isEn ? `Remove ${job.detected.file.name}` : `Удалить ${job.detected.file.name}`}>
                    <X size={18} />
                  </Button>
                )}
              </div>
              {(job.warning || job.error) && (
                <div className={`mt-2 text-xs sm:col-span-6 ${job.error ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]"}`} role={job.error ? "alert" : "status"}>
                  {job.error || job.warning}
                </div>
              )}
              {job.status === "processing" && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)] sm:col-span-6">
                  <div className="h-full rounded-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${Math.max(3, job.progress * 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
