"use client";

import { CheckCircle2, Download, FileArchive, Loader2, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button, IconButton } from "@/ui/button";
import { Notice, Panel } from "@/ui/panel";
import { S } from "./strings";
import type { JobState } from "./use-job";

export interface OutputItem {
  name: string;
  blob: Blob;
}

const LIST_LIMIT = 60;

/** Progress bar with a cancel button, or the error of the last run. */
export function JobStatus({ locale, state, onCancel }: { locale: Locale; state: JobState; onCancel?: () => void }) {
  const t = S[locale];
  if (state.status === "running") {
    const pct = Math.round(state.progress * 100);
    return (
      <div className="flex items-center gap-3 rounded-[1rem] bg-surface-2 px-4 py-3">
        <Loader2 className="size-4 shrink-0 animate-spin text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2 text-sm text-fg-2">
            <span className="truncate">{state.label ?? t.processing}</span>
            <span className="tabular">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t.processing}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {onCancel && (
          <Button size="sm" variant="text" onClick={onCancel}>
            <X aria-hidden />
            {t.cancel}
          </Button>
        )}
      </div>
    );
  }
  if (state.status === "error") return <Notice tone="err">{state.message}</Notice>;
  return null;
}

async function zipAndDownload(items: readonly OutputItem[], zipName: string) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const used = new Set<string>();
  for (const it of items) {
    let name = it.name;
    for (let k = 2; used.has(name); k++) name = it.name.replace(/(\.[^.]+)?$/, `-${k}$1`);
    used.add(name);
    zip.file(name, it.blob);
  }
  // PDFs and images are already compressed: STORE is fast and not bigger.
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  downloadBlob(blob, zipName);
}

/**
 * Result card: one or many output files with sizes (before → after when the
 * original size is known), individual downloads and an optional ZIP.
 */
export function ResultCard({
  locale,
  items,
  originalSize,
  zipName,
  notice,
  onReset,
  children,
  emphasizeSize,
}: {
  locale: Locale;
  items: readonly OutputItem[];
  originalSize?: number;
  /** Show the size reduction in large type (compression). */
  emphasizeSize?: boolean;
  zipName?: string;
  notice?: ReactNode;
  onReset?: () => void;
  children?: ReactNode;
}) {
  const t = S[locale];
  const [zipping, setZipping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = items.reduce((s, x) => s + x.blob.size, 0);
  const single = items.length === 1 ? items[0] : null;
  const delta = originalSize ? (total - originalSize) / originalSize : null;

  // On a phone the card appears below the fold: bring it into view.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  return (
    <Panel ref={ref} className="flex flex-col gap-4 p-4 motion-safe:animate-[menu-in_220ms_ease-out] sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-ok" aria-hidden />
        <div className="min-w-0" aria-live="polite">
          {emphasizeSize && delta !== null && delta < 0 && (
            <p className="tabular text-4xl font-bold tracking-tight text-ok">
              −{formatNumber(locale, Math.abs(delta) * 100, { maximumFractionDigits: delta > -0.1 ? 1 : 0 })}%
            </p>
          )}
          <p className="truncate font-semibold text-fg" title={single?.name}>
            {single ? single.name : `${t.result}: ${formatNumber(locale, items.length)} ${locale === "ru" ? pluralFiles(items.length) : items.length === 1 ? "file" : "files"}`}
          </p>
          <p className="tabular text-sm text-fg-2">
            {originalSize ? (
              <>
                {t.before} {formatBytes(locale, originalSize)} → {t.after} {formatBytes(locale, total)}
                {delta !== null && Math.abs(delta) >= 0.001 && (
                  <span className={delta < 0 ? "font-medium text-ok" : "text-fg-3"}>
                    {" "}
                    ({delta < 0 ? "−" : "+"}
                    {formatNumber(locale, Math.abs(delta) * 100, { maximumFractionDigits: 1 })}%)
                  </span>
                )}
              </>
            ) : (
              formatBytes(locale, total)
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {single ? (
          <Button variant="filled" size="lg" className="min-w-48 flex-1" onClick={() => downloadBlob(single.blob, single.name)}>
            <Download aria-hidden />
            {t.download}
          </Button>
        ) : (
          <Button
            variant="filled"
            size="lg"
            className="min-w-48 flex-1"
            disabled={zipping}
            onClick={async () => {
              setZipping(true);
              try {
                await zipAndDownload(items, zipName ?? "files.zip");
              } finally {
                setZipping(false);
              }
            }}
          >
            {zipping ? <Loader2 className="animate-spin" aria-hidden /> : <FileArchive aria-hidden />}
            {zipping ? t.zipping : t.downloadZip}
          </Button>
        )}
        {onReset && (
          <Button variant="text" size="lg" onClick={onReset}>
            <RotateCcw aria-hidden />
            {t.startOver}
          </Button>
        )}
      </div>
      {notice && <p className="rounded-[1rem] bg-surface-2 px-3.5 py-2.5 text-sm text-fg-2">{notice}</p>}
      {children}
      {!single && (
        <ul className="max-h-80 overflow-y-auto rounded-[1rem] bg-surface-2 py-1">
          {items.slice(0, LIST_LIMIT).map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-0.5 pr-1 pl-3.5">
              <span className="min-w-0 truncate text-sm text-fg" title={it.name}>
                {it.name}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="tabular text-xs text-fg-3">{formatBytes(locale, it.blob.size)}</span>
                <IconButton size="sm" label={`${t.download}: ${it.name}`} icon={<Download aria-hidden />} onClick={() => downloadBlob(it.blob, it.name)} />
              </span>
            </li>
          ))}
          {items.length > LIST_LIMIT && <li className="px-3.5 py-2 text-sm text-fg-3">{t.andMore(items.length - LIST_LIMIT)}</li>}
        </ul>
      )}
    </Panel>
  );
}

function pluralFiles(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "файл";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "файла";
  return "файлов";
}

/* ───────────── file names ───────────── */

export function baseName(name: string): string {
  const b = name.replace(/\.[^./\\]+$/, "").trim();
  return b || "document";
}

export const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: "application/pdf" });
