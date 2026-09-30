/// <reference lib="webworker" />
/**
 * pdf-lib worker: every document operation of the PDF section runs here so
 * large files never freeze the page. One worker per job; the page terminates
 * it to cancel.
 */
import { browserCodec, convertImage } from "./browser-env";
import type { Job, WorkerMessage } from "./jobs";
import { PdfError } from "./pdf-ops";
import { runJob } from "./run";

const post = (msg: WorkerMessage, transfer: Transferable[] = []) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, transfer);

self.onmessage = async (e: MessageEvent<Job>) => {
  try {
    let last = 0;
    const result = await runJob(e.data, { codec: browserCodec, convertImage }, (value) => {
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
};
