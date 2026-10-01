"use client";

import { Download, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button, IconButton } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Notice, Panel } from "@/ui/panel";
import { isAbort } from "../lib/client";
import { IMAGE_ACCEPT } from "../lib/detect";
import { prepareFile, type Prepared } from "../lib/source";
import { ProgressBar, replaceDrop } from "./controls";
import type { HandoffId } from "./handoff-targets";
import { OptionsBar, ToolColumns } from "./OptionsBar";
import { errorText, S } from "./strings";
import { useWorkspace } from "./useWorkspace";
import { NextMenu, RestoringPlaceholder, WorkspaceBar } from "./Workspace";

/** A single dropped/pasted file, prepared (format sniffed). */
export function useSingleFile() {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  const load = useCallback(async (file: File) => {
    const my = ++seq.current;
    setError(null);
    setLoading(true);
    try {
      const p = await prepareFile(file);
      if (my === seq.current) setPrepared(p);
    } catch (e) {
      if (my === seq.current) {
        setPrepared(null);
        setError(e);
      }
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, []);
  const reset = useCallback(() => {
    seq.current++;
    setPrepared(null);
    setError(null);
  }, []);
  return { prepared, error, loading, load, reset };
}

type ExportJob = (signal: AbortSignal, onProgress: (v: number) => void) => Promise<{ blob: Blob; name: string } | null>;

/**
 * Export state: run an async job with progress + cancel, then download. With `{ download: false }` the result is only
 * returned (the "Next" menu hands it to another tool).
 */
export function useExport() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [last, setLast] = useState<{ size: number; name: string } | null>(null);
  const ac = useRef<AbortController | null>(null);
  useEffect(() => () => ac.current?.abort(), []);
  const run = useCallback(async (job: ExportJob, opts: { download?: boolean } = {}): Promise<{ blob: Blob; name: string } | null> => {
    ac.current?.abort();
    const c = new AbortController();
    ac.current = c;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const out = await job(c.signal, setProgress);
      if (!out || c.signal.aborted) return null;
      if (opts.download !== false) {
        downloadBlob(out.blob, out.name);
        setLast({ size: out.blob.size, name: out.name });
      }
      return out;
    } catch (e) {
      if (!isAbort(e)) setError(e);
      return null;
    } finally {
      if (ac.current === c) {
        setBusy(false);
        ac.current = null;
      }
    }
  }, []);
  const cancel = useCallback(() => {
    ac.current?.abort();
    ac.current = null;
    setBusy(false);
  }, []);
  return { busy, progress, error, last, run, cancel };
}

/**
 * Layout for single-image editors: drop zone until a file is loaded, then — from `lg` — the settings card on the left
 * and the stage (focal point) with the result line and one filled Download button on the right (first on phones).
 * Opened files are added to the tab's workspace (never removed), so the next photo tool can open them too.
 */
export function SingleImageShell({
  locale,
  file,
  options,
  stage,
  figure,
  onExport,
  exp,
  exportLabel,
  extra,
  more,
  next = false,
  self,
}: {
  locale: Locale;
  file: ReturnType<typeof useSingleFile>;
  options?: ReactNode;
  stage: ReactNode;
  /** Big result figure (e.g. "1080 × 1080 px"). */
  figure: ReactNode;
  /** Export; with `download = false` it only returns the result (for the "Next" menu). */
  onExport: (download?: boolean) => Promise<{ blob: Blob; name: string } | null> | null | void;
  exp: ReturnType<typeof useExport>;
  exportLabel?: string;
  extra?: ReactNode;
  more?: ReactNode;
  /** Offer "Next ▾" (hand the result to another photo tool). */
  next?: boolean;
  self?: HandoffId;
}) {
  const t = S(locale);
  const { load } = file;
  const ws = useWorkspace({
    files: file.prepared ? [file.prepared.file] : [],
    mode: "append",
    accept: IMAGE_ACCEPT,
    restore: (files, sel) => void load(files[sel] ?? files[0]),
  });

  if (!file.prepared) {
    return (
      <div className="flex flex-col gap-3">
        {ws.restoring || file.loading ? (
          <RestoringPlaceholder locale={locale} text={ws.restoring ? undefined : t.reading} />
        ) : (
          <Dropzone onFiles={(f) => f[0] && load(f[0])} accept={IMAGE_ACCEPT} title={t.dropOne} hint={t.dropHint} locale={locale} />
        )}
        {file.error ? <Notice tone="err">{errorText(locale, file.error)}</Notice> : null}
      </div>
    );
  }
  const side = options ? (
    <OptionsBar more={more} locale={locale}>
      {options}
    </OptionsBar>
  ) : undefined;
  return (
    <div className="flex flex-col gap-4">
      <WorkspaceBar
        locale={locale}
        count={ws.restored}
        onStartOver={() => {
          ws.startOver();
          file.reset();
        }}
      />
      <ToolColumns
        side={side}
        rest={<Dropzone onFiles={(f) => f[0] && load(f[0])} accept={IMAGE_ACCEPT} title={t.dropOne} locale={locale} className={replaceDrop} />}
      >
        <Panel className="flex min-w-0 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
          {stage}
          {exp.busy && <ProgressBar value={exp.progress} />}
          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0" aria-live="polite">
              <div className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{figure}</div>
              <p className="truncate text-sm text-fg-3">
                {file.prepared.file.name}
                {exp.last ? ` · ${exp.last.name} — ${formatBytes(locale, exp.last.size)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
              <IconButton label={t.remove} icon={<X aria-hidden />} onClick={file.reset} />
              {next && (
                <NextMenu
                  locale={locale}
                  self={self}
                  disabled={exp.busy}
                  getFiles={async () => {
                    const out = await onExport(false);
                    return out ? [new File([out.blob], out.name, { type: out.blob.type, lastModified: Date.now() })] : null;
                  }}
                />
              )}
              {exp.busy ? (
                <Button variant="tonal" size="lg" className="flex-1 sm:flex-none" onClick={exp.cancel}>
                  <Loader2 className="animate-spin" aria-hidden />
                  {t.cancel} · {Math.round(exp.progress * 100)} %
                </Button>
              ) : (
                <Button variant="filled" size="lg" className="flex-1 sm:flex-none" onClick={() => void onExport()}>
                  <Download aria-hidden />
                  {exportLabel ?? t.download}
                </Button>
              )}
            </div>
          </div>
          {(exp.error || extra || file.prepared.animated) && (
            <div className="flex flex-col gap-1 px-1 text-[0.8125rem]">
              {file.prepared.animated && <p className="text-warn">{t.animatedWarn}</p>}
              {exp.error ? (
                <p className="text-err" role="alert">
                  {errorText(locale, exp.error)}
                </p>
              ) : null}
              {extra}
            </div>
          )}
        </Panel>
      </ToolColumns>
    </div>
  );
}
