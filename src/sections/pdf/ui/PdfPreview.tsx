"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { runPdfJob } from "../engine/client";
import type { Job } from "../engine/jobs";

/**
 * Real preview: runs the tool's job on ONE page in the worker (debounced) and
 * returns the resulting one-page PDF. What you see is exactly what will be
 * saved. `scope` identifies the file: a preview of a previous file is never
 * shown for a new one, and results of outdated settings are dropped.
 */
export function usePagePreview(build: (() => Promise<Job | null>) | null, scope: string, key: string, delay = 350): { bytes: Uint8Array | null; busy: boolean } {
  const [state, setState] = useState<{ scope: string; bytes: Uint8Array | null }>({ scope: "", bytes: null });
  const [busy, setBusy] = useState<string | null>(null);
  const buildRef = useRef(build);
  useEffect(() => {
    buildRef.current = build;
  });

  useEffect(() => {
    if (!buildRef.current) return;
    const ctrl = new AbortController();
    const tag = `${scope}|${key}`;
    const timer = setTimeout(async () => {
      try {
        const job = await buildRef.current?.();
        if (!job || ctrl.signal.aborted) return;
        setBusy(tag);
        const r = await runPdfJob(job, { signal: ctrl.signal });
        if (!ctrl.signal.aborted) setState({ scope, bytes: r.files[0]?.bytes ?? null });
      } catch {
        // Preview failures are silent; the real run reports errors.
      } finally {
        if (!ctrl.signal.aborted) setBusy(null);
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [scope, key, delay]);

  return { bytes: build && state.scope === scope ? state.bytes : null, busy: busy === `${scope}|${key}` };
}

/** Renders page 1 of a small PDF into a canvas. */
export function PdfPreview({ bytes, label, busy, className }: { bytes: Uint8Array | null; label: string; busy?: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!bytes) return;
    let live = true;
    let destroy: (() => Promise<void>) | null = null;
    (async () => {
      const m = await import("../engine/pdfjs");
      m.acquirePdfjs();
      destroy = async () => m.releasePdfjs();
      const doc = await m.openDocument(bytes.slice().buffer);
      const release = destroy;
      destroy = async () => {
        await doc.loadingTask.destroy();
        await release();
      };
      if (!live) return;
      const page = await doc.getPage(1);
      const target = canvasRef.current;
      if (!live || !target) return;
      const vp = page.getViewport({ scale: 1 });
      const box = target.parentElement?.clientWidth || 480;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = Math.min(3, (box * dpr) / Math.max(vp.width, vp.height * 0.8));
      const c = await m.renderPage(page, scale);
      if (live) {
        target.width = c.width;
        target.height = c.height;
        target.getContext("2d")?.drawImage(c, 0, 0);
      }
      m.releaseCanvas(c);
      page.cleanup();
    })()
      .catch(() => {})
      .finally(() => {
        void destroy?.().catch(() => {});
      });
    return () => {
      live = false;
    };
  }, [bytes]);

  return (
    <div className={cn("relative flex min-h-48 items-center justify-center rounded-[12px] bg-surface-2 p-3", className)}>
      <canvas ref={canvasRef} role="img" aria-label={label} className={cn("h-auto max-h-[70vh] w-auto max-w-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.12)]", !bytes && "hidden")} />
      {(busy || !bytes) && <Loader2 className="absolute top-3 right-3 size-4 animate-spin text-fg-3" aria-hidden />}
    </div>
  );
}
