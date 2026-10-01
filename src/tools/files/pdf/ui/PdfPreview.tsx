"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { runPdfJob, warmPdfWorker } from "../lib/client";
import type { Job } from "../lib/jobs";
import { PageView } from "./PageView";
import { S, errorText } from "./strings";

export interface PagePreview {
  /** File the preview belongs to. */
  scope: string;
  bytes: Uint8Array | null;
  busy: boolean;
  /** Message of the last failed preview (null when fine). */
  error: string | null;
  retry: () => void;
}

/**
 * Real preview: runs the tool's job on ONE page in the worker (debounced) and
 * returns the resulting one-page PDF. What you see is exactly what will be
 * saved. `scope` identifies the file: a preview of a previous file is never
 * shown for a new one, and results of outdated settings are dropped. A failure
 * is reported (with a retry), never left as an endless spinner.
 */
export function usePagePreview(locale: Locale, build: (() => Promise<Job | null>) | null, scope: string, key: string, delay = 300): PagePreview {
  const [state, setState] = useState<{ scope: string; bytes: Uint8Array | null }>({ scope: "", bytes: null });
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ tag: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const buildRef = useRef(build);
  useEffect(() => {
    buildRef.current = build;
  });

  useEffect(() => {
    if (!buildRef.current) return;
    warmPdfWorker(); // starts loading pdf-lib during the debounce
    const ctrl = new AbortController();
    const tag = `${scope}|${key}|${attempt}`;
    const timer = setTimeout(async () => {
      try {
        const job = await buildRef.current?.();
        if (!job || ctrl.signal.aborted) return;
        setBusy(tag);
        const r = await runPdfJob(job, { signal: ctrl.signal, keepWorker: true });
        if (!ctrl.signal.aborted) {
          setState({ scope, bytes: r.files[0]?.bytes ?? null });
          setFailed(null);
        }
      } catch (e) {
        if (!ctrl.signal.aborted) setFailed({ tag, message: errorText(locale, e) });
      } finally {
        if (!ctrl.signal.aborted) setBusy(null);
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [scope, key, delay, attempt, locale]);

  const tag = `${scope}|${key}|${attempt}`;
  return {
    scope,
    bytes: build && state.scope === scope ? state.bytes : null,
    busy: busy === tag,
    error: build && failed?.tag === tag ? failed.message : null,
    retry: () => setAttempt((a) => a + 1),
  };
}

/**
 * Opens the small result PDF (one page) with pdf.js. Until the next result of the
 * same file is open, the previous one stays — so the picture never falls back to
 * the original page between two previews.
 */
function useResultDoc(bytes: Uint8Array | null, scope: string): { doc: PDFDocumentProxy | null; failed: boolean } {
  const [state, setState] = useState<{ scope: string; doc: PDFDocumentProxy | null; failed: Uint8Array | null }>({ scope: "", doc: null, failed: null });
  const docRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!bytes) return;
    let live = true;
    (async () => {
      const m = await import("../lib/pdfjs");
      const doc = await m.openDocument(bytes.slice().buffer);
      if (!live) {
        void doc.loadingTask.destroy().catch(() => {});
        return;
      }
      const old = docRef.current;
      docRef.current = doc;
      setState({ scope, doc, failed: null });
      // The old document may still be drawing for a moment; it is tiny, destroy it a bit later.
      if (old) setTimeout(() => void old.loadingTask.destroy().catch(() => {}), 2000);
    })().catch(() => {
      if (live) setState((s) => ({ ...s, failed: bytes }));
    });
    return () => {
      live = false;
    };
  }, [bytes, scope]);

  // Keep the pdf.js worker for as long as the preview is on screen; destroy the last document on unmount.
  useEffect(() => {
    let gone = false;
    let release: (() => void) | null = null;
    void import("../lib/pdfjs").then((m) => {
      if (gone) return;
      m.acquirePdfjs();
      release = m.releasePdfjs;
    });
    return () => {
      gone = true;
      void docRef.current?.loadingTask.destroy().catch(() => {});
      docRef.current = null;
      release?.();
    };
  }, []);

  return { doc: bytes && state.scope === scope ? state.doc : null, failed: !!bytes && state.failed === bytes };
}

/**
 * Page preview of a tool: the original page right away (`original`), then the
 * processed one-page result (`preview.bytes`) as soon as it is ready.
 */
export function PdfPreview({
  locale,
  preview,
  original,
  label,
  className,
}: {
  locale: Locale;
  preview: PagePreview | null;
  original: { doc: PDFDocumentProxy | null; index: number };
  label: string;
  className?: string;
}) {
  const t = S[locale];
  const result = useResultDoc(preview?.bytes ?? null, preview?.scope ?? "");
  const showResult = !!result.doc;
  const error = preview?.error ?? (result.failed ? t.previewFailed : null);
  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-2 rounded-[1.25rem] bg-surface-2 p-3 sm:p-4", className)}>
      <PageView
        locale={locale}
        doc={showResult ? result.doc : original.doc}
        index={showResult ? 0 : original.index}
        label={label}
        fit="contain"
        keepStale
        busy={!!preview?.busy}
      />
      {error && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-err" role="alert">
          <span>{error}</span>
          <Button size="sm" variant="text" onClick={preview?.retry}>
            <RotateCw aria-hidden />
            {t.retry}
          </Button>
        </div>
      )}
    </div>
  );
}
