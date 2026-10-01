/**
 * Main-thread side of the section worker protocol.
 *
 * One WorkerClient = one lazily created Worker. Only one job runs at a time:
 * starting a new job while another is in flight terminates the worker (real
 * cancellation, also stops runaway regexes) and spawns a fresh one.
 *
 * Usage (inside a client component):
 *   const client = useWorkerClient(() => new Worker(new URL("./fmt.worker.ts", import.meta.url), { type: "module" }));
 *   const out = await client.run<string>("format", { text });
 *
 * The worker file must call `serve({...handlers})` from ./worker-host.
 */

class JobCancelled extends Error {
  constructor() {
    super("Job cancelled");
    this.name = "JobCancelled";
  }
}

export class JobTimeout extends Error {
  readonly ms: number;
  constructor(ms: number) {
    super(`Job timed out after ${ms} ms`);
    this.name = "JobTimeout";
    this.ms = ms;
  }
}

/** Error thrown inside a worker handler; `data` carries structured details (e.g. { line, col }). */
export class JobError extends Error {
  readonly data?: unknown;
  constructor(message: string, data?: unknown) {
    super(message);
    this.name = "JobError";
    this.data = data;
  }
}

export const isCancelled = (e: unknown): e is JobCancelled => e instanceof JobCancelled;

interface RunOptions {
  /** Terminate the worker and reject with JobTimeout after this many ms. */
  timeoutMs?: number;
  /** Transferable objects to move (not copy) into the worker. */
  transfer?: Transferable[];
  onProgress?: (value: number, info?: unknown) => void;
}

type Incoming =
  | { id: number; type: "result"; result: unknown }
  | { id: number; type: "error"; message: string; data?: unknown }
  | { id: number; type: "progress"; value: number; info?: unknown };

interface Pending {
  id: number;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  timer: ReturnType<typeof setTimeout> | null;
  onProgress?: RunOptions["onProgress"];
}

export class WorkerClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending: Pending | null = null;
  private readonly factory: () => Worker;

  constructor(factory: () => Worker) {
    this.factory = factory;
  }

  get busy(): boolean {
    return this.pending !== null;
  }

  run<R>(op: string, payload?: unknown, opts: RunOptions = {}): Promise<R> {
    if (this.pending) this.cancel();
    const w = this.ensure();
    const id = ++this.seq;
    return new Promise<R>((resolve, reject) => {
      const p: Pending = { id, resolve: resolve as (v: unknown) => void, reject, timer: null, onProgress: opts.onProgress };
      if (opts.timeoutMs && opts.timeoutMs > 0) {
        p.timer = setTimeout(() => {
          if (this.pending !== p) return;
          this.pending = null;
          this.kill();
          reject(new JobTimeout(opts.timeoutMs!));
        }, opts.timeoutMs);
      }
      this.pending = p;
      try {
        w.postMessage({ id, op, payload }, opts.transfer ?? []);
      } catch (e) {
        this.settle(p);
        reject(e);
      }
    });
  }

  /** Stop the running job (if any). The worker is terminated; the next run spawns a new one. */
  cancel(): void {
    const p = this.pending;
    if (!p) return;
    this.settle(p);
    this.kill();
    p.reject(new JobCancelled());
  }

  /** Cancel and release the worker. The client stays usable (a later run re-creates it). */
  dispose(): void {
    this.cancel();
    this.kill();
  }

  private settle(p: Pending) {
    if (p.timer) clearTimeout(p.timer);
    if (this.pending === p) this.pending = null;
  }

  private kill() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private ensure(): Worker {
    if (this.worker) return this.worker;
    const w = this.factory();
    w.onmessage = (e: MessageEvent<Incoming>) => {
      const msg = e.data;
      const p = this.pending;
      if (!p || msg.id !== p.id) return;
      if (msg.type === "progress") {
        p.onProgress?.(msg.value, msg.info);
        return;
      }
      this.settle(p);
      if (msg.type === "result") p.resolve(msg.result);
      else p.reject(new JobError(msg.message, msg.data));
    };
    w.onerror = (e: ErrorEvent) => {
      e.preventDefault();
      const p = this.pending;
      if (!p) return;
      this.settle(p);
      this.kill();
      p.reject(new JobError(e.message || "Worker failed"));
    };
    this.worker = w;
    return w;
  }
}
