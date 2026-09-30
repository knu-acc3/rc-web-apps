/** Main-thread side of the pdf-lib worker: run a job with progress and cancellation. */
import type { Job, JobResult, WorkerMessage } from "./jobs";
import type { PdfErrorCode } from "./pdf-ops";

export class JobError extends Error {
  constructor(
    public code: PdfErrorCode | "generic" | "cancelled",
    message: string,
  ) {
    super(message);
    this.name = "JobError";
  }
}

/** ArrayBuffers inside the job, deduplicated, for transfer. */
function transferables(job: Job): ArrayBuffer[] {
  const out = new Set<ArrayBuffer>();
  const walk = (v: unknown) => {
    if (v instanceof ArrayBuffer) out.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(job);
  return [...out];
}

/**
 * Run a job in a fresh worker. Buffers in the job are TRANSFERRED (detached) —
 * pass copies (`buf.slice(0)`) of anything you still need.
 */
export function runPdfJob(job: Job, opts: { onProgress?: (p: number) => void; signal?: AbortSignal } = {}): Promise<JobResult> {
  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) return reject(new JobError("cancelled", "cancelled"));
    const worker = new Worker(new URL("./pdf.worker.ts", import.meta.url), { type: "module" });
    const finish = () => {
      worker.terminate();
      opts.signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      finish();
      reject(new JobError("cancelled", "cancelled"));
    };
    opts.signal?.addEventListener("abort", onAbort);
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const m = e.data;
      if (m.type === "progress") opts.onProgress?.(m.value);
      else if (m.type === "codec") {
        // Worker without OffscreenCanvas: encode/decode this one image on the page.
        import("./main-codec")
          .then((c) => c.handleCodecRequest(m.request))
          .then((result) => {
            const transfer = result instanceof ArrayBuffer ? [result] : [result.bytes];
            worker.postMessage({ type: "codec-result", id: m.id, result }, transfer);
          })
          .catch((err: unknown) => worker.postMessage({ type: "codec-result", id: m.id, error: err instanceof Error ? err.message : String(err) }));
      } else if (m.type === "done") {
        finish();
        resolve(m.result);
      } else {
        finish();
        reject(new JobError(m.code, m.message));
      }
    };
    worker.onerror = (e) => {
      finish();
      reject(new JobError("generic", e.message || "worker error"));
    };
    worker.postMessage(job, transferables(job));
  });
}

/* ───────────── Unicode font for stamping ───────────── */

let fontPromise: Promise<ArrayBuffer> | null = null;

/** Noto Sans (self-hosted, OFL) — fetched once, only when text is not plain Latin. */
export function loadUnicodeFont(): Promise<ArrayBuffer> {
  fontPromise ??= fetch("/vendor/pdf/fonts/NotoSans-Regular.ttf")
    .then((r) => {
      if (!r.ok) throw new Error(`font ${r.status}`);
      return r.arrayBuffer();
    })
    .catch((e) => {
      fontPromise = null;
      throw e;
    });
  return fontPromise;
}

const WIN_ANSI = /^[\x20-\x7e -ÿ–—‘’‚“”„†‡•…‰‹›€™ŒœŠšŸŽžƒˆ˜]*$/;

/** Font bytes (a copy, ready to transfer) when `text` needs more than Latin-1, otherwise null. */
export async function fontFor(text: string): Promise<ArrayBuffer | null> {
  if (WIN_ANSI.test(text)) return null;
  return (await loadUnicodeFont()).slice(0);
}
