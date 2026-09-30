import type { ReactNode } from "react";
import {
  CheckCircle,
  CircleNotch,
  File,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";

export type ToolFileStatus = "queued" | "processing" | "success" | "error";

export interface ToolFileRowProps {
  file?: Pick<File, "name" | "size" | "type">;
  name?: string;
  size?: number;
  type?: string;
  secondary?: ReactNode;
  previewUrl?: string;
  previewLabel?: string;
  icon?: ReactNode;
  status?: ToolFileStatus;
  statusLabel?: ReactNode;
  progress?: number;
  error?: ReactNode;
  actions?: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}

function formatBytes(bytes?: number) {
  if (bytes === undefined) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function FileStatusIcon({ status }: { status: ToolFileStatus }) {
  if (status === "processing") {
    return (
      <CircleNotch
        size={18}
        className="animate-spin text-[var(--color-primary)]"
        aria-hidden="true"
      />
    );
  }
  if (status === "success") {
    return (
      <CheckCircle
        size={18}
        weight="fill"
        className="text-[var(--color-success)]"
        aria-hidden="true"
      />
    );
  }
  if (status === "error") {
    return (
      <WarningCircle
        size={18}
        weight="fill"
        className="text-[var(--color-danger)]"
        aria-hidden="true"
      />
    );
  }
  return (
    <File
      size={18}
      className="text-[var(--color-text-muted)]"
      aria-hidden="true"
    />
  );
}

/** Open list row for uploaded/processed files; intended inside a role=list container. */
export function ToolFileRow({
  file,
  name,
  size,
  type,
  secondary,
  previewUrl,
  previewLabel,
  icon,
  status = "queued",
  statusLabel,
  progress,
  error,
  actions,
  onRemove,
  removeLabel = "Remove file",
  className,
}: ToolFileRowProps) {
  const displayName = name ?? file?.name ?? "File";
  const displaySize = size ?? file?.size;
  const displayType = type ?? file?.type;
  const displaySizeLabel = formatBytes(displaySize);
  const normalizedProgress =
    progress === undefined ? undefined : Math.max(0, Math.min(100, progress));

  return (
    <div
      role="listitem"
      data-status={status}
      className={cn(
        "flex min-w-0 items-center gap-3 border-b border-[var(--color-border-subtle)] py-3 last:border-b-0",
        className,
      )}
    >
      {previewUrl ? (
        <span
          role={previewLabel ? "img" : undefined}
          aria-label={previewLabel}
          aria-hidden={previewLabel ? undefined : true}
          className="h-14 w-14 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(previewUrl)})` }}
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] [&>svg]:h-6 [&>svg]:w-6">
          {icon ?? <File size={24} aria-hidden="true" />}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-[var(--color-text)]">
            {displayName}
          </span>
          <span aria-live="polite" className="shrink-0">
            <FileStatusIcon status={status} />
          </span>
        </div>
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--color-text-muted)]">
          {displaySizeLabel ? <span>{displaySizeLabel}</span> : null}
          {displayType ? <span className="truncate">{displayType}</span> : null}
          {statusLabel ? <span>{statusLabel}</span> : null}
          {secondary ? <span>{secondary}</span> : null}
        </div>
        {normalizedProgress !== undefined ? (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={normalizedProgress}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
          >
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="mt-1 text-xs font-medium text-[var(--color-danger)]"
          >
            {error}
          </div>
        ) : null}
      </div>

      {actions || onRemove ? (
        <div className="flex shrink-0 items-center gap-1 [&_button]:min-h-11 [&_button]:min-w-11">
          {actions}
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label={removeLabel}
              title={removeLabel}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              <Trash size={18} />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
