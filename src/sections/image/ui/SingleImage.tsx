"use client";

import { Download, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Notice, Panel } from "@/ui/panel";
import { isAbort } from "../engine/client";
import { IMAGE_ACCEPT } from "../engine/detect";
import { prepareFile, type Prepared } from "../engine/source";
import { ProgressBar } from "./controls";
import { errorText, S } from "./strings";

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

/** Export state: run an async job with progress + cancel, then download. */
export function useExport() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [last, setLast] = useState<{ size: number; name: string } | null>(null);
  const ac = useRef<AbortController | null>(null);
  useEffect(() => () => ac.current?.abort(), []);
  const run = useCallback(async (job: (signal: AbortSignal, onProgress: (v: number) => void) => Promise<{ blob: Blob; name: string } | null>) => {
    ac.current?.abort();
    const c = new AbortController();
    ac.current = c;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const out = await job(c.signal, setProgress);
      if (out && !c.signal.aborted) {
        downloadBlob(out.blob, out.name);
        setLast({ size: out.blob.size, name: out.name });
      }
    } catch (e) {
      if (!isAbort(e)) setError(e);
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
 * Layout for single-image editors: dropzone until a file is loaded, then the
 * stage (focal point) with a result line and one primary Download button.
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
}: {
  locale: Locale;
  file: ReturnType<typeof useSingleFile>;
  options?: ReactNode;
  stage: ReactNode;
  /** Big result figure (e.g. "1080 × 1080 px"). */
  figure: ReactNode;
  onExport: () => void;
  exp: ReturnType<typeof useExport>;
  exportLabel?: string;
  extra?: ReactNode;
  more?: ReactNode;
}) {
  const t = S(locale);
  if (!file.prepared) {
    return (
      <div className="flex flex-col gap-3">
        <Dropzone onFiles={(f) => f[0] && file.load(f[0])} accept={IMAGE_ACCEPT} title={t.dropOne} hint={t.dropHint} className="min-h-64" />
        {file.loading && (
          <p className="flex items-center gap-2 text-sm text-fg-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t.reading}
          </p>
        )}
        {file.error ? <Notice tone="err">{errorText(locale, file.error)}</Notice> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {options && (
        <div className="rounded-[12px] border border-line bg-surface">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3 px-4 py-3">{options}</div>
          {more && (
            <details className="border-t border-line">
              <summary className="cursor-pointer px-4 py-2.5 text-sm text-fg-2 hover:text-fg">{locale === "ru" ? "Дополнительно" : "More options"}</summary>
              <div className="grid gap-4 px-4 pb-4 pt-1 sm:grid-cols-2">{more}</div>
            </details>
          )}
        </div>
      )}
      <Panel className="overflow-hidden">
        <div className="p-3 sm:p-4">{stage}</div>
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0" aria-live="polite">
            <div className="tabular text-2xl font-semibold tracking-tight text-fg">{figure}</div>
            <p className="truncate text-sm text-fg-3">
              {file.prepared.file.name}
              {exp.last ? ` · ${exp.last.name} — ${formatBytes(locale, exp.last.size)}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={file.reset}>
              <X aria-hidden />
              {t.remove}
            </Button>
            {exp.busy ? (
              <Button variant="secondary" size="lg" onClick={exp.cancel}>
                <Loader2 className="animate-spin" aria-hidden />
                {t.cancel} · {Math.round(exp.progress * 100)} %
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={onExport}>
                <Download aria-hidden />
                {exportLabel ?? t.download}
              </Button>
            )}
          </div>
        </div>
        {exp.busy && <ProgressBar value={exp.progress} className="rounded-none" />}
        {(exp.error || extra || file.prepared.animated) && (
          <div className="flex flex-col gap-1 border-t border-line px-4 py-2.5 text-[13px]">
            {file.prepared.animated && <p className="text-warn">{t.animatedWarn}</p>}
            {exp.error ? <p className="text-err" role="alert">{errorText(locale, exp.error)}</p> : null}
            {extra}
          </div>
        )}
      </Panel>
      <Dropzone onFiles={(f) => f[0] && file.load(f[0])} accept={IMAGE_ACCEPT} compact title={t.dropOne} />
    </div>
  );
}
