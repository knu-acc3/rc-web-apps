/** Main-thread side of the pdf-lib worker: run a job with progress and cancellation. */
import type { Job, JobResult, WorkerMessage } from "./jobs";
import type { PdfErrorCode } from "./pdf-ops";

class JobError extends Error {
  constructor(
    public code: PdfErrorCode | "generic" | "cancelled" | "engine",
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

const spawn = () => new Worker(new URL("./pdf.worker.ts", import.meta.url), { type: "module" });

/** One idle, already started worker: previews reuse it instead of loading pdf-lib again for every change. */
let spare: Worker | null = null;
let spareTimer: ReturnType<typeof setTimeout> | undefined;
const SPARE_IDLE = 60_000;

function keepSpare(w: Worker) {
  if (spare) {
    w.terminate();
    return;
  }
  spare = w;
  clearTimeout(spareTimer);
  spareTimer = setTimeout(() => {
    spare?.terminate();
    spare = null;
  }, SPARE_IDLE);
}

/** Start a worker ahead of time, so the next job (e.g. the first preview) doesn't wait for pdf-lib to load. */
export function warmPdfWorker(): void {
  if (spare || typeof Worker === "undefined") return;
  try {
    const w = spawn();
    // A worker that fails to load is dropped, not handed to a job that would wait forever.
    w.addEventListener("error", () => {
      if (spare !== w) return;
      spare = null;
      w.terminate();
    });
    keepSpare(w);
  } catch {
    // The real job reports the failure.
  }
}

/**
 * Run a job in a worker (the warm spare when there is one). Buffers in the job
 * are TRANSFERRED (detached) — pass copies (`buf.slice(0)`) of anything you
 * still need. `keepWorker` returns the worker to the spare slot after success
 * (previews run many small jobs); cancelled or failed jobs always end their worker.
 */
export function runPdfJob(job: Job, opts: { onProgress?: (p: number) => void; signal?: AbortSignal; keepWorker?: boolean } = {}): Promise<JobResult> {
  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) return reject(new JobError("cancelled", "cancelled"));
    let worker: Worker;
    try {
      worker = spare ?? spawn();
      if (worker === spare) {
        spare = null;
        clearTimeout(spareTimer);
      }
    } catch (e) {
      return reject(new JobError("engine", String(e)));
    }
    const finish = (ok = false) => {
      opts.signal?.removeEventListener("abort", onAbort);
      worker.onmessage = null;
      worker.onerror = null;
      if (ok && opts.keepWorker) keepSpare(worker);
      else worker.terminate();
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
        finish(true);
        resolve(m.result);
      } else {
        finish();
        reject(new JobError(m.code, m.message));
      }
    };
    // A plain "error" event (no message) means the worker script itself didn't load: say so, not "bad file".
    worker.onerror = (e) => {
      finish();
      reject(new JobError(e instanceof ErrorEvent && e.message ? "generic" : "engine", e.message || "worker failed to start"));
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
