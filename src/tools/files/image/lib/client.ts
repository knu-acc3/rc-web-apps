/**
 * Main-thread side of the image engine: a small worker pool with progress,
 * cancellation (terminates the busy worker) and error propagation (a crashed
 * worker rejects its job and is replaced). Falls back to running the same
 * handler on the main thread when workers or OffscreenCanvas are missing.
 */
import type { JobRequest, WorkerIn, WorkerOut } from "./types";

interface RunOptions {
  signal?: AbortSignal;
  onProgress?: (value: number) => void;
  transfer?: Transferable[];
  /** Prefer the worker that processed this source last (decode cache locality). */
  affinity?: string;
}

interface Job {
  id: number;
  req: JobRequest;
  opts: RunOptions;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  onAbort?: () => void;
}

interface Slot {
  worker: Worker;
  job: Job | null;
  last?: string;
}

class AbortedError extends Error {
  constructor() {
    super("Aborted");
    this.name = "AbortError";
  }
}

export const isAbort = (e: unknown) => e instanceof Error && e.name === "AbortError";

let nextId = 1;

class Engine {
  private slots: Slot[] = [];
  private queue: Job[] = [];
  private mode: Promise<"worker" | "main"> | null = null;
  private size: number;

  constructor() {
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 2 : 2;
    this.size = cores >= 4 ? 2 : 1;
  }

  private spawn(): Worker {
    return new Worker(new URL("./image.worker.ts", import.meta.url), { type: "module" });
  }

  private detect(): Promise<"worker" | "main"> {
    if (this.mode) return this.mode;
    this.mode = new Promise((resolve) => {
      if (typeof Worker === "undefined") return resolve("main");
      let w: Worker;
      try {
        w = this.spawn();
      } catch {
        return resolve("main");
      }
      const timer = setTimeout(() => {
        w.terminate();
        resolve("main");
      }, 8000);
      w.onmessage = (e: MessageEvent<WorkerOut>) => {
        if (e.data.kind !== "ready") return;
        clearTimeout(timer);
        if (!e.data.offscreen) {
          w.terminate();
          return resolve("main");
        }
        this.slots.push(this.wire({ worker: w, job: null }));
        resolve("worker");
      };
      w.onerror = () => {
        clearTimeout(timer);
        w.terminate();
        resolve("main");
      };
    });
    return this.mode;
  }

  private wire(slot: Slot): Slot {
    slot.worker.onmessage = (e: MessageEvent<WorkerOut>) => {
      const msg = e.data;
      const job = slot.job;
      if (!job || msg.id !== job.id) return;
      if (msg.kind === "progress") job.opts.onProgress?.(msg.value);
      else if (msg.kind === "done") this.finish(slot, () => job.resolve(msg.result));
      else if (msg.kind === "error") this.finish(slot, () => job.reject(new Error(msg.message)));
    };
    const crash = () => {
      const job = slot.job;
      this.replace(slot);
      job?.reject(new Error("WORKER_CRASHED"));
    };
    slot.worker.onerror = crash;
    slot.worker.onmessageerror = crash;
    return slot;
  }

  private finish(slot: Slot, settle: () => void) {
    const job = slot.job;
    if (job?.onAbort) job.opts.signal?.removeEventListener("abort", job.onAbort);
    slot.job = null;
    settle();
    this.pump();
  }

  /** Terminate a slot's worker (e.g. after cancel/crash) and start a fresh one. */
  private replace(slot: Slot) {
    slot.worker.terminate();
    slot.job = null;
    slot.last = undefined;
    try {
      slot.worker = this.spawn();
      this.wire(slot);
    } catch {
      this.slots = this.slots.filter((s) => s !== slot);
    }
    queueMicrotask(() => this.pump());
  }

  private pump() {
    while (this.queue.length) {
      let free = this.slots.filter((s) => !s.job);
      if (!free.length && this.slots.length < this.size) {
        try {
          this.slots.push(this.wire({ worker: this.spawn(), job: null }));
        } catch {
          /* pool stays smaller */
        }
        free = this.slots.filter((s) => !s.job);
      }
      if (!free.length) return;
      const job = this.queue.shift()!;
      const slot = free.find((s) => job.opts.affinity && s.last === job.opts.affinity) ?? free[0];
      slot.job = job;
      slot.last = job.opts.affinity;
      const msg: WorkerIn = { id: job.id, req: job.req };
      try {
        slot.worker.postMessage(msg, job.opts.transfer ?? []);
      } catch (e) {
        slot.job = null;
        job.reject(e);
      }
    }
  }

  async run<T>(req: JobRequest, opts: RunOptions = {}): Promise<T> {
    if (opts.signal?.aborted) throw new AbortedError();
    const mode = await this.detect();
    if (mode === "main") return this.runMain<T>(req, opts);
    return new Promise<T>((resolve, reject) => {
      const job: Job = { id: nextId++, req, opts, resolve: resolve as (v: unknown) => void, reject };
      if (opts.signal) {
        job.onAbort = () => {
          const qi = this.queue.indexOf(job);
          if (qi >= 0) this.queue.splice(qi, 1);
          const slot = this.slots.find((s) => s.job === job);
          if (slot) this.replace(slot);
          reject(new AbortedError());
        };
        opts.signal.addEventListener("abort", job.onAbort, { once: true });
      }
      this.queue.push(job);
      this.pump();
    });
  }

  private async runMain<T>(req: JobRequest, opts: RunOptions): Promise<T> {
    const { handle } = await import("./handler");
    const { result } = await handle(req, { progress: (v) => opts.onProgress?.(v), signal: opts.signal });
    if (opts.signal?.aborted) throw new AbortedError();
    return result as T;
  }

  /** Cancel queued jobs and stop all workers. */
  dispose() {
    for (const j of this.queue) j.reject(new AbortedError());
    this.queue = [];
    for (const s of this.slots) {
      s.job?.reject(new AbortedError());
      s.worker.terminate();
    }
    this.slots = [];
    this.mode = null;
  }
}

let engine: Engine | null = null;
let refs = 0;
let disposeTimer: ReturnType<typeof setTimeout> | null = null;

/** Get the shared engine; call `releaseEngine()` on unmount. */
export function acquireEngine(): Engine {
  refs++;
  if (disposeTimer) {
    clearTimeout(disposeTimer);
    disposeTimer = null;
  }
  if (!engine) engine = new Engine();
  return engine;
}

export function releaseEngine() {
  refs = Math.max(0, refs - 1);
  if (refs === 0 && engine) {
    // short grace period so StrictMode double-mounts don't restart workers
    disposeTimer = setTimeout(() => {
      if (refs === 0) {
        engine?.dispose();
        engine = null;
      }
    }, 1500);
  }
}

export type { Engine };
