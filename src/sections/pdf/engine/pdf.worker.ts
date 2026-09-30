/// <reference lib="webworker" />
/**
 * pdf-lib worker: every document operation of the PDF section runs here so
 * large files never freeze the page. One worker per job; the page terminates
 * it to cancel. Image encoding uses OffscreenCanvas; browsers without it in
 * workers (Safari < 16.4) get it done by the page through "codec" messages.
 */
import { browserCodec, convertImage, remoteCodec, remoteConvert, type CallMain } from "./browser-env";
import type { Job, WorkerMessage } from "./jobs";
import { PdfError } from "./pdf-ops";
import { runJob } from "./run";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (msg: WorkerMessage, transfer: Transferable[] = []) => scope.postMessage(msg, transfer);

let seq = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
const callMain: CallMain = (req, transfer) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    post({ type: "codec", id, request: req }, transfer);
  });

const offscreen = typeof OffscreenCanvas !== "undefined";

async function run(job: Job) {
  try {
    let last = 0;
    const env = offscreen ? { codec: browserCodec, convertImage } : { codec: remoteCodec(callMain), convertImage: remoteConvert(callMain) };
    const result = await runJob(job, env, (value) => {
      const now = Date.now();
      if (value >= 1 || now - last > 80) {
        last = now;
        post({ type: "progress", value });
      }
    });
    post(
      { type: "done", result },
      result.files.map((f) => f.bytes.buffer as ArrayBuffer),
    );
  } catch (err) {
    if (err instanceof PdfError) post({ type: "error", code: err.code, message: err.message });
    else post({ type: "error", code: "generic", message: err instanceof Error ? err.message : String(err) });
  }
}

scope.onmessage = (e: MessageEvent<Job | { type: "codec-result"; id: number; result?: unknown; error?: string }>) => {
  const m = e.data;
  if (m.type === "codec-result") {
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (!p) return;
    if (m.error !== undefined) p.reject(new Error(m.error));
    else p.resolve(m.result);
    return;
  }
  void run(m);
};
