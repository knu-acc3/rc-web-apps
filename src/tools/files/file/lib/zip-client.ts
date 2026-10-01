/** Main-thread wrapper for zip.worker.ts (one worker per open archive / build). */
import type { ZipEntryInfo } from "./zip.worker";

export type { ZipEntryInfo };

export class ZipWorker {
  private w: Worker;
  private seq = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void; onProgress?: (p: number) => void }>();

  constructor() {
    this.w = new Worker(new URL("./zip.worker.ts", import.meta.url), { type: "module" });
    this.w.onmessage = (e: MessageEvent<{ id: number; progress?: number; done?: unknown; error?: string }>) => {
      const p = this.pending.get(e.data.id);
      if (!p) return;
      if (e.data.progress !== undefined) p.onProgress?.(e.data.progress);
      else {
        this.pending.delete(e.data.id);
        if (e.data.error) p.reject(new Error(e.data.error));
        else p.resolve(e.data.done);
      }
    };
    this.w.onerror = (e) => {
      e.preventDefault?.();
      for (const p of this.pending.values()) p.reject(new Error("WORKER_CRASH"));
      this.pending.clear();
    };
  }

  private call<T>(msg: Record<string, unknown>, onProgress?: (p: number) => void): Promise<T> {
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
      this.w.postMessage({ id, ...msg });
    });
  }

  build(entries: { path: string; file: Blob; date: number }[], level: number, onProgress?: (p: number) => void): Promise<Blob> {
    return this.call<Blob>({ op: "build", entries, level }, onProgress);
  }
  open(file: Blob, encoding: string): Promise<ZipEntryInfo[]> {
    return this.call<ZipEntryInfo[]>({ op: "open", file, encoding });
  }
  extract(path: string, onProgress?: (p: number) => void): Promise<Blob> {
    return this.call<Blob>({ op: "extract", path }, onProgress);
  }
  terminate(): void {
    this.w.terminate();
    for (const p of this.pending.values()) p.reject(new DOMException("Cancelled", "AbortError"));
    this.pending.clear();
  }
}

/** Build a ZIP in a fresh worker; aborting terminates it. */
export async function buildZip(entries: { path: string; file: Blob; date: number }[], level: number, signal: AbortSignal, onProgress?: (p: number) => void): Promise<Blob> {
  const w = new ZipWorker();
  const onAbort = () => w.terminate();
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    return await w.build(entries, level, onProgress);
  } finally {
    signal.removeEventListener("abort", onAbort);
    w.terminate();
  }
}
