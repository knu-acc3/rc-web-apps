/**
 * Worker side of the section worker protocol (see ./worker-client).
 *
 *   // fmt.worker.ts
 *   import { serve, WorkerFail } from "../code/kit/worker-host";
 *   serve({
 *     async format(p: { text: string }, ctx) {
 *       ctx.progress(0.5);
 *       if (bad) throw new WorkerFail("Unexpected token", { line: 3, col: 7 });
 *       return out;
 *     },
 *   });
 */

/** Throw from a handler to send a structured error (message + data) to the main thread. */
export class WorkerFail extends Error {
  readonly data?: unknown;
  constructor(message: string, data?: unknown) {
    super(message);
    this.name = "WorkerFail";
    this.data = data;
  }
}

/** Wrap a handler result to transfer (not copy) buffers back to the main thread. */
export class Transfer<T> {
  constructor(
    readonly value: T,
    readonly list: Transferable[],
  ) {}
}

interface HandlerContext {
  /** Report progress (0…1). Throttle calls yourself for tight loops. */
  progress(value: number, info?: unknown): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (payload: any, ctx: HandlerContext) => unknown;

interface Scope {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent) => void) | null;
}

export function serve(handlers: Record<string, Handler>): void {
  const scope = globalThis as unknown as Scope;
  scope.onmessage = async (e: MessageEvent<{ id: number; op: string; payload: unknown }>) => {
    const { id, op, payload } = e.data;
    const ctx: HandlerContext = {
      progress(value, info) {
        scope.postMessage({ id, type: "progress", value, info });
      },
    };
    try {
      const h = handlers[op];
      if (!h) throw new Error(`Unknown operation: ${op}`);
      const result = await h(payload, ctx);
      if (result instanceof Transfer) scope.postMessage({ id, type: "result", result: result.value }, result.list);
      else scope.postMessage({ id, type: "result", result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const data = err instanceof WorkerFail ? err.data : undefined;
      scope.postMessage({ id, type: "error", message, data });
    }
  };
}
