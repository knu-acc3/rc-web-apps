"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { errorText } from "./strings";

export type JobState =
  | { status: "idle" }
  | { status: "running"; progress: number; label?: string }
  | { status: "error"; message: string }
  | { status: "done" };

export interface JobContext {
  signal: AbortSignal;
  progress: (p: number, label?: string) => void;
}

const isCancel = (e: unknown) => (e as { code?: string; name?: string })?.code === "cancelled" || (e as { name?: string })?.name === "AbortError";

/** Long-running work with progress, cancellation and friendly errors. Aborts on unmount. */
export function useJob(locale: Locale) {
  const [state, setState] = useState<JobState>({ status: "idle" });
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => () => ctrlRef.current?.abort(), []);

  const start = useCallback(
    async <T>(fn: (ctx: JobContext) => Promise<T>): Promise<T | undefined> => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      setState({ status: "running", progress: 0 });
      try {
        const result = await fn({
          signal: ctrl.signal,
          progress: (p, label) => {
            if (!ctrl.signal.aborted) setState({ status: "running", progress: Math.max(0, Math.min(1, p)), label });
          },
        });
        if (ctrl.signal.aborted) return undefined;
        setState({ status: "done" });
        return result;
      } catch (e) {
        if (ctrl.signal.aborted || isCancel(e)) {
          if (ctrlRef.current === ctrl) setState({ status: "idle" });
          return undefined;
        }
        if (process.env.NODE_ENV !== "production") console.error(e);
        setState({ status: "error", message: errorText(locale, e) });
        return undefined;
      } finally {
        if (ctrlRef.current === ctrl) ctrlRef.current = null;
      }
    },
    [locale],
  );

  const cancel = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
    setState({ status: "idle" });
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, start, cancel, reset, running: state.status === "running" };
}

export type Job = ReturnType<typeof useJob>;
