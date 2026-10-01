"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs of local files */
import { AlertTriangle, Download, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/clipboard";
import { Button, IconButton } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Panel } from "@/ui/panel";
import { IMAGE_ACCEPT } from "../lib/detect";
import { previewFile } from "../lib/run";
import { displayable, type Prepared } from "../lib/source";
import { wsSelect } from "../../shared/workspace";
import { CompareSlider } from "./CompareSlider";
import { checker, ProgressBar, replaceDrop } from "./controls";
import type { HandoffId } from "./handoff-targets";
import { useEngine } from "./hooks";
import { OptionsBar, ToolColumns } from "./OptionsBar";
import { errorText, filesCount, S } from "./strings";
import { downloadZip, type BatchItem, type BatchResult, type useBatch } from "./useBatch";
import { useWorkspace } from "./useWorkspace";
import { NextMenu, RestoringPlaceholder, WorkspaceBar } from "./Workspace";

type Batch = ReturnType<typeof useBatch>;

/** URL to show the original: the file itself when the browser can display it, else a worker preview. */
function useOriginalUrl(p: Prepared | undefined, maxSide = 2048): string | null {
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
        const r = await previewFile(getEngine(), p, maxSide, {
          signal: ac.signal,
        });
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
 * Batch tool layout with one focal point: the selected result (before/after, size in large type, one Download
 * button). From `lg` the settings card sits on the left (sticky) and the result on the right; on phones the photo
 * comes first. The file list below stays quiet. Files are kept in the tab's workspace for the next photo tool.
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
  self,
}: {
  locale: Locale;
  batch: Batch;
  /** The main options (stacked in the settings card); a function gets the selected file. */
  options?: ReactNode | ((sel: BatchItem | undefined) => ReactNode);
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
  /** This tool in the "Next" menu (left out of it). */
  self?: HandoffId;
}) {
  const t = S(locale);
  const { items } = batch;
  const [selKey, setSelKey] = useState<string | null>(null);
  const sel = items.find((i) => i.key === selKey) ?? items[0];
  const selectedKey = sel?.key ?? null;
  const { prioritize } = batch;
  useEffect(() => prioritize(selectedKey), [prioritize, selectedKey]);
  const selIndex = sel ? items.indexOf(sel) : -1;
  useEffect(() => {
    if (selIndex >= 0) wsSelect(selIndex);
  }, [selIndex]);
  const origUrl = useOriginalUrl(compare && !stage ? sel?.prepared : undefined);
  const done = items.filter((i) => i.result);
  const totalIn = done.reduce((n, i) => n + i.file.size, 0);
  const totalOut = done.reduce((n, i) => n + (i.result?.blob.size ?? 0), 0);
  const [zipping, setZipping] = useState(false);

  const add = (files: File[]) => {
    if (single) batch.clear();
    batch.addFiles(single ? files.slice(0, 1) : files);
  };
  const ws = useWorkspace({
    files: items.map((i) => i.file),
    mode: "sync",
    accept,
    restore: (files) => batch.addFiles(single ? files.slice(0, 1) : files),
  });
  const bar = (
    <WorkspaceBar
      locale={locale}
      count={ws.restored}
      onStartOver={() => {
        ws.startOver();
        batch.clear();
      }}
    />
  );

  const statusText = !items.length ? "" : batch.busy ? t.working : `${t.done}: ${filesCount(locale, done.length)}`;
  const optionsNode = typeof options === "function" ? options(sel) : options;
  const side = optionsNode ? (
    <OptionsBar more={more} locale={locale}>
      {optionsNode}
    </OptionsBar>
  ) : undefined;

  if (!items.length) {
    return (
      <ToolColumns side={side}>
        {ws.restoring ? (
          <RestoringPlaceholder locale={locale} className="lg:min-h-80" />
        ) : (
          <Dropzone
            onFiles={add}
            accept={accept}
            multiple={!single}
            title={single ? t.dropOne : t.dropMany}
            hint={dropHint ?? t.dropHint}
            locale={locale}
            className="lg:min-h-80"
          />
        )}
      </ToolColumns>
    );
  }

  const r = sel?.result;
  const extraNode = sel && extra ? extra(sel) : null;
  const hasNotes =
    sel &&
    (sel.prepared?.animated ||
      r?.keptOriginal ||
      r?.limited ||
      r?.missedTarget ||
      (sizeFocus && r && !r.keptOriginal && r.blob.size > sel.file.size * 1.02) ||
      extraNode);
  return (
    <div className="flex flex-col gap-4">
      {bar}
      <ToolColumns
        side={side}
        rest={
          <>
            {items.length > 1 && (
              <Panel className="flex min-w-0 flex-col gap-1 p-2 sm:p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
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
                    variant="tonal"
                    size="sm"
                    disabled={!done.length || zipping}
                    loading={zipping}
                    onClick={async () => {
                      setZipping(true);
                      try {
                        await downloadZip(
                          done.map((i) => ({
                            name: i.result!.name,
                            blob: i.result!.blob,
                          })),
                          zipName,
                        );
                      } finally {
                        setZipping(false);
                      }
                    }}
                  >
                    {!zipping && <Download aria-hidden />}
                    {zipping ? t.zipping : t.downloadAll}
                  </Button>
                </div>
                <ul className="flex flex-col gap-0.5">
                  {items.map((it) => (
                    <li
                      key={it.key}
                      className={cn(
                        "flex items-center gap-1 rounded-[0.875rem] pr-1 transition-colors",
                        it === sel ? "bg-accent-container/60" : "hover:bg-surface-2",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelKey(it.key)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-[0.875rem] px-2 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-accent"
                        aria-pressed={it === sel}
                        aria-label={it.file.name}
                      >
                        <span className={cn("flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[0.625rem]", checker)}>
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
                        <IconButton
                          size="sm"
                          label={`${t.download}: ${it.result.name}`}
                          icon={<Download aria-hidden />}
                          onClick={() => downloadBlob(it.result!.blob, it.result!.name)}
                        />
                      )}
                      <IconButton size="sm" label={`${t.removeFile}: ${it.file.name}`} icon={<X aria-hidden />} onClick={() => batch.remove(it.key)} />
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Dropzone
                onFiles={add}
                accept={accept}
                multiple={!single}
                compact={!single}
                title={single ? t.dropOne : t.addMore}
                locale={locale}
                className={cn("flex-1", single && replaceDrop)}
              />
              <Button variant="text" size="sm" className="self-end sm:self-center" onClick={batch.clear}>
                {t.clear}
              </Button>
            </div>
          </>
        }
      >
        {sel && (
          <Panel className="flex min-w-0 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
            {stage ? (
              stage(sel)
            ) : r && compare && origUrl ? (
              <CompareSlider before={origUrl} after={r.url} locale={locale} beforeLabel={t.original} afterLabel={t.result} />
            ) : r ? (
              <div className={cn("flex justify-center rounded-[1rem]", checker)}>
                <img src={r.url} alt={t.result} className="block h-auto max-h-[64vh] w-auto max-w-full object-contain" />
              </div>
            ) : (
              <div className={cn("flex min-h-56 flex-col items-center justify-center gap-3 rounded-[1rem] text-sm text-fg-2", checker)}>
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
            {sel.status === "working" && sel.result && <ProgressBar value={sel.progress} />}
            <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0" aria-live="polite">
                {r ? (
                  <>
                    {stat ? (
                      stat(sel, r)
                    ) : (
                      <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                        {formatBytes(locale, r.blob.size)}{" "}
                        <span className={cn("text-lg", r.blob.size <= sel.file.size ? "text-ok" : "text-warn")}>
                          {delta(locale, sel.file.size, r.blob.size)}
                        </span>
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
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
                {batch.busy && (
                  <Button variant="text" size="sm" onClick={batch.cancelAll}>
                    {t.cancel}
                  </Button>
                )}
                <NextMenu
                  locale={locale}
                  self={self}
                  disabled={!done.length}
                  getFiles={() =>
                    done.map(
                      (i) =>
                        new File([i.result!.blob], i.result!.name, {
                          type: i.result!.blob.type,
                          lastModified: Date.now(),
                        }),
                    )
                  }
                />
                <Button variant="filled" size="lg" className="flex-1 sm:flex-none" disabled={!r} onClick={() => r && downloadBlob(r.blob, r.name)}>
                  <Download aria-hidden />
                  {t.download}
                </Button>
              </div>
            </div>
            {hasNotes && (
              <div className="flex flex-col gap-1 px-1">
                <Notes it={sel} locale={locale} grewNote={sizeFocus} />
                {extraNode}
              </div>
            )}
          </Panel>
        )}
      </ToolColumns>
    </div>
  );
}
