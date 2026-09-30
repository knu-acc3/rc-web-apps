"use client";

import { useEffect, useRef, useState } from "react";
import { isCancelled, WorkerClient } from "./worker-client";

/**
 * A WorkerClient bound to the component lifetime. The Worker itself is created
 * lazily on the first `run()` (never during render) and terminated on unmount.
 *
 * The factory MUST contain the literal `new Worker(new URL("./x.worker.ts", import.meta.url), { type: "module" })`
 * so the bundler can see and emit the worker chunk.
 */
export function useWorkerClient(factory: () => Worker): WorkerClient {
  const [client] = useState(() => new WorkerClient(factory));
  useEffect(() => () => client.dispose(), [client]);
  return client;
}

export interface LiveState<R> {
  /** Result for the current key (undefined while pending or on error). */
  value: R | undefined;
  /** Error for the current key. */
  error: unknown;
  /** The task for the current key has not settled yet. */
  pending: boolean;
  /** Last settled result for ANY key — show it dimmed while pending to avoid flicker. */
  stale: R | undefined;
}

/**
 * Run an async task (usually a worker job) whenever `key` changes, debounced.
 * `key` is compared with Object.is: pass a string (e.g. `${mode}|${text}`) or a memoized object.
 * Pass `task = null` to skip (e.g. empty input). Cancelled jobs (superseded by a newer key) are ignored.
 * `pending` is derived during render, so no setState happens synchronously inside effects.
 */
export function useLiveTask<R>(key: unknown, task: (() => Promise<R>) | null, delay = 200): LiveState<R> {
  const [state, setState] = useState<{ key: unknown; value?: R; error?: unknown; ok: boolean } | null>(null);
  const taskRef = useRef(task);
  useEffect(() => {
    taskRef.current = task;
  });
  const hasTask = task !== null;
  useEffect(() => {
    const fn = taskRef.current;
    if (!fn) return;
    let alive = true;
    const timer = setTimeout(() => {
      fn().then(
        (value) => {
          if (alive) setState({ key, value, ok: true });
        },
        (error) => {
          if (alive && !isCancelled(error)) setState({ key, error, ok: false });
        },
      );
    }, delay);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [key, delay, hasTask]);

  const current = hasTask && state !== null && Object.is(state.key, key);
  return {
    value: current && state.ok ? state.value : undefined,
    error: current && !state.ok ? state.error : undefined,
    pending: hasTask && !current,
    stale: state?.ok ? state.value : undefined,
  };
}

/** Debounce a fast-changing value (e.g. textarea text) for cheap-but-not-free main-thread work. */
export function useDebounced<T>(value: T, delay = 150): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
