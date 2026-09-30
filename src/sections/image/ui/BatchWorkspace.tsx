"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs of local files */
import { AlertTriangle, Download, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Panel } from "@/ui/panel";
import { IMAGE_ACCEPT } from "../engine/detect";
import { previewFile } from "../engine/run";
import { displayable, type Prepared } from "../engine/source";
import { CompareSlider } from "./CompareSlider";
import { OptionsBar } from "./OptionsBar";
import { checker, ProgressBar } from "./controls";
import { useEngine } from "./hooks";
import { errorText, filesCount, S } from "./strings";
import { downloadZip, type BatchItem, type BatchResult, type useBatch } from "./useBatch";

type Batch = ReturnType<typeof useBatch>;

/** URL to show the original: the file itself when the browser can display it, else a worker preview. */
export function useOriginalUrl(p: Prepared | undefined, maxSide = 2048): string | null {
  const getEngine = useEngine();
  const direct = useMemo(() => (p && displayable(p.format) ? URL.createObjectURL(p.file) : null), [p]);
  useEffect(
    () => () => {
      if (direct) URL.revokeObjectURL(direct);
    },
    [direct],
  );
  const [made, setMade] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    if (!p || displayable(p.format)) return;
    let alive = true;
    let url: string | null = null;
    const ac = new AbortController();
    (async () => {
      try {
        const r = await previewFile(getEngine(), p, maxSide, { signal: ac.signal });
        const c = document.createElement("canvas");
        c.width = r.bitmap.width;
        c.height = r.bitmap.height;
        c.getContext("2d")?.drawImage(r.bitmap, 0, 0);
        r.bitmap.close();
        const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.9));
        c.width = c.height = 1;
        if (!alive || !blob) return;
        url = URL.createObjectURL(blob);
        setMade({ id: p.id, url });
      } catch {
        /* no preview */
      }
    })();
    return () => {
      alive = false;
      ac.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [p, maxSide, getEngine]);
  return direct ?? (made && p && made.id === p.id ? made.url : null);
}

function delta(locale: Locale, before: number, after: number) {
  const pct = before ? ((after - before) / before) * 100 : 0;
  if (Math.abs(pct) < 0.05) return "0 %";
  const sign = pct < 0 ? "−" : "+";
  return `${sign}${formatNumber(locale, Math.abs(pct), { maximumFractionDigits: Math.abs(pct) < 10 ? 1 : 0 })} %`;
}

function StatusLine({ it, locale }: { it: BatchItem; locale: Locale }) {
  const t = S(locale);
  if (it.status === "error") return <span className="text-err">{errorText(locale, it.error)}</span>;
  if (it.status === "reading") return <span>{t.reading}</span>;
  if (it.status === "queued" && !it.result) return <span>{t.queued}</span>;
  if (it.status === "working" && !it.result) return <span>{`${t.working} ${Math.round(it.progress * 100)} %`}</span>;
  if (!it.result) return null;
  const r = it.result;
  return (
    <span className="tabular">
      {formatBytes(locale, it.file.size)} → <span className="font-medium text-fg">{formatBytes(locale, r.blob.size)}</span>{" "}
      <span className={r.blob.size <= it.file.size ? "text-ok" : "text-warn"}>{delta(locale, it.file.size, r.blob.size)}</span>
      <span className="text-fg-3">
        {" "}
        · {r.width}×{r.height}
      </span>
    </span>
  );
}

function Notes({ it, locale, grewNote }: { it: BatchItem; locale: Locale; grewNote?: boolean }) {
  const t = S(locale);
  const notes: string[] = [];
  if (it.prepared?.animated) notes.push(t.animatedWarn);
  if (it.result?.keptOriginal) notes.push(t.keptOriginal);
  if (it.result?.limited) notes.push(t.limitedWarn);
  if (it.result?.missedTarget) notes.push(t.missedTarget);
  if (it.result && !it.result.keptOriginal && it.result.blob.size > it.file.size * 1.02 && grewNote) notes.push(t.grewNote);
  if (!notes.length) return null;
  return (
    <ul className="flex flex-col gap-1 text-[0.8125rem] text-warn">
      {notes.map((n) => (
        <li key={n} className="flex items-start gap-1.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {n}
        </li>
      ))}
    </ul>
  );
}

/**
 * Batch tool layout with one focal point: the selected result (before/after,
 * size in large type, one Download button). Options sit in a single quiet row
 * above; extra options are collapsed; the file list below stays quiet.
 */
export function BatchWorkspace({
  locale,
  batch,
  options,
  more,
  zipName,
  compare = true,
  single = false,
  extra,
  accept = IMAGE_ACCEPT,
  dropHint,
  stage,
  stat,
  sizeFocus = false,
}: {
  locale: Locale;
  batch: Batch;
  /** One quiet row of the main options. */
  options?: ReactNode;
  /** Collapsed secondary options. */
  more?: ReactNode;
  zipName: string;
  compare?: boolean;
  /** Accept a single file only. */
  single?: boolean;
  /** Extra info under the focal result (e.g. lossless note). */
  extra?: (it: BatchItem) => ReactNode;
  accept?: string;
  dropHint?: ReactNode;
  /** Replace the before/after area (e.g. a live preview). */
  stage?: (it: BatchItem) => ReactNode;
  /** Replace the big result figure (default: file size and change). */
  stat?: (it: BatchItem, r: BatchResult) => ReactNode;
  /** The tool is about file size: explain when a result grows. */
  sizeFocus?: boolean;
}) {
  const t = S(locale);
  const { items } = batch;
  const [selKey, setSelKey] = useState<string | null>(null);
  const sel = items.find((i) => i.key === selKey) ?? items[0];
  const selectedKey = sel?.key ?? null;
  const { prioritize } = batch;
  useEffect(() => prioritize(selectedKey), [prioritize, selectedKey]);
  const origUrl = useOriginalUrl(compare && !stage ? sel?.prepared : undefined);
  const done = items.filter((i) => i.result);
  const totalIn = done.reduce((n, i) => n + i.file.size, 0);
  const totalOut = done.reduce((n, i) => n + (i.result?.blob.size ?? 0), 0);
  const [zipping, setZipping] = useState(false);

  const add = (files: File[]) => {
    if (single) batch.clear();
    batch.addFiles(single ? files.slice(0, 1) : files);
  };

  const statusText = !items.length ? "" : batch.busy ? t.working : `${t.done}: ${filesCount(locale, done.length)}`;

  if (!items.length) {
    return (
      <div className="flex flex-col gap-4">
        {options && (
          <OptionsBar more={more} locale={locale}>
            {options}
          </OptionsBar>
        )}
        <Dropzone onFiles={add} accept={accept} multiple={!single} title={single ? t.dropOne : t.dropMany} hint={dropHint ?? t.dropHint} />
      </div>
    );
  }

  const r = sel?.result;
  const extraNode = sel && extra ? extra(sel) : null;
  return (
    <div className="flex flex-col gap-4">
      {options && (
        <OptionsBar more={more} locale={locale}>
          {options}
        </OptionsBar>
      )}

      {sel && (
        <Panel className="overflow-hidden">
          <div className="p-3 sm:p-4">
            {stage ? (
              stage(sel)
            ) : r && compare && origUrl ? (
              <CompareSlider before={origUrl} after={r.url} locale={locale} beforeLabel={t.original} afterLabel={t.result} />
            ) : r ? (
              <div className={cn("flex max-h-[70vh] justify-center overflow-auto rounded-[0.625rem] border border-line", checker)}>
                <img src={r.url} alt={t.result} className="block h-auto max-w-full object-contain" />
              </div>
            ) : (
              <div className={cn("flex min-h-56 flex-col items-center justify-center gap-3 rounded-[0.625rem] border border-line text-sm text-fg-2", checker)}>
                {sel.status === "error" ? (
                  <span className="max-w-md px-4 text-center text-err">{errorText(locale, sel.error)}</span>
                ) : (
                  <>
                    <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
                    <span>
                      {sel.status === "working" ? `${t.working} ${Math.round(sel.progress * 100)} %` : sel.status === "reading" ? t.reading : t.queued}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0" aria-live="polite">
              {r ? (
                <>
                  {stat ? (
                    stat(sel, r)
                  ) : (
                    <p className="tabular text-2xl font-semibold tracking-tight text-fg">
                      {formatBytes(locale, r.blob.size)}{" "}
                      <span className={cn("text-lg", r.blob.size <= sel.file.size ? "text-ok" : "text-warn")}>{delta(locale, sel.file.size, r.blob.size)}</span>
                    </p>
                  )}
                  <p className="tabular truncate text-sm text-fg-3">
                    {r.name} · {r.width}×{r.height} · {t.original.toLowerCase()} {formatBytes(locale, sel.file.size)}
                  </p>
                </>
              ) : (
                <p className="truncate text-sm text-fg-2">{sel.file.name}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
              {batch.busy && (
                <Button variant="ghost" size="sm" onClick={batch.cancelAll}>
                  {t.cancel}
                </Button>
              )}
              <Button variant="primary" size="lg" className="flex-1 sm:flex-none" disabled={!r} onClick={() => r && downloadBlob(r.blob, r.name)}>
                <Download aria-hidden />
                {t.download}
              </Button>
            </div>
          </div>
          {(sel.prepared?.animated ||
            r?.keptOriginal ||
            r?.limited ||
            r?.missedTarget ||
            (sizeFocus && r && !r.keptOriginal && r.blob.size > sel.file.size * 1.02) ||
            extraNode) && (
            <div className="flex flex-col gap-1 border-t border-line px-4 py-2.5">
              <Notes it={sel} locale={locale} grewNote={sizeFocus} />
              {extraNode}
            </div>
          )}
          {sel.status === "working" && sel.result && <ProgressBar value={sel.progress} className="rounded-none" />}
        </Panel>
      )}

      {items.length > 1 && (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <p className="tabular text-sm text-fg-2">
              {statusText}
              {done.length > 0 && (
                <>
                  {" · "}
                  {formatBytes(locale, totalIn)} → {formatBytes(locale, totalOut)}{" "}
                  <span className={totalOut <= totalIn ? "text-ok" : "text-warn"}>{delta(locale, totalIn, totalOut)}</span>
                </>
              )}
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={!done.length || zipping}
              onClick={async () => {
                setZipping(true);
                try {
                  await downloadZip(
                    done.map((i) => ({ name: i.result!.name, blob: i.result!.blob })),
                    zipName,
                  );
                } finally {
                  setZipping(false);
                }
              }}
            >
              <Download aria-hidden />
              {zipping ? t.zipping : t.downloadAll}
            </Button>
          </div>
          <ul className="divide-y divide-line">
            {items.map((it) => (
              <li key={it.key} className={cn("flex items-center gap-3 px-3 py-2", it === sel && "bg-surface-2")}>
                <button
                  type="button"
                  onClick={() => setSelKey(it.key)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-pressed={it === sel}
                  aria-label={it.file.name}
                >
                  <span className={cn("flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[0.375rem] border border-line", checker)}>
                    {it.result ? (
                      <img src={it.result.url} alt="" className="size-full object-cover" />
                    ) : it.status === "error" ? (
                      <AlertTriangle className="size-4 text-err" aria-hidden />
                    ) : (
                      <Loader2 className="size-4 animate-spin text-fg-3" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{it.file.name}</span>
                    <span className="block truncate text-[0.8125rem] text-fg-3">
                      <StatusLine it={it} locale={locale} />
                    </span>
                    {it.status === "working" && <ProgressBar value={it.progress} className="mt-1" />}
                  </span>
                </button>
                {it.result && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${t.download}: ${it.result.name}`}
                    title={t.download}
                    onClick={() => downloadBlob(it.result!.blob, it.result!.name)}
                  >
                    <Download aria-hidden />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" aria-label={`${t.removeFile}: ${it.file.name}`} title={t.remove} onClick={() => batch.remove(it.key)}>
                  <X aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Dropzone onFiles={add} accept={accept} multiple={!single} compact title={single ? t.dropOne : t.addMore} className="flex-1" />
        <Button variant="ghost" size="sm" className="self-end sm:self-center" onClick={batch.clear}>
          {t.clear}
        </Button>
      </div>
    </div>
  );
}
