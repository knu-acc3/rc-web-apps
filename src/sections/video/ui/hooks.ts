"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sniffFile, type Detected } from "@/sections/file/lib/magic";
import { probeMedia, type Hooks, type Stage } from "../engine/client";
import { isAbort } from "../engine/ffmpeg";
import type { MediaInfo } from "../engine/spec";

/** Object URL for a Blob, revoked when the blob changes or the component unmounts. */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

export type JobStatus = "idle" | "running" | "done" | "error" | "cancelled";

export interface JobState<R> {
  status: JobStatus;
  progress: number;
  stage: Stage;
  engine: "webcodecs" | "ffmpeg";
  download: number;
  result: R | null;
  error: unknown;
}

const INITIAL: JobState<never> = { status: "idle", progress: 0, stage: "prepare", engine: "webcodecs", download: 0, result: null, error: null };

/**
 * Runs one cancellable job at a time. The job receives engine hooks (signal,
 * progress, stage). Unmounting aborts a running job.
 */
export function useJob<R>() {
  const [state, setState] = useState<JobState<R>>(INITIAL);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => () => ctrl.current?.abort(), []);

  const run = useCallback(async (fn: (hooks: Hooks) => Promise<R>): Promise<R | null> => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState({ ...INITIAL, status: "running" });
    let lastPaint = 0;
    const hooks: Hooks = {
      signal: c.signal,
      onProgress: (p) => {
        // Throttle React updates to ~10 per second.
        const now = performance.now();
        if (now - lastPaint < 100 && p < 1) return;
        lastPaint = now;
        if (!c.signal.aborted) setState((s) => ({ ...s, progress: Math.max(0, Math.min(1, p)) }));
      },
      onStage: (stage, engine) => !c.signal.aborted && setState((s) => ({ ...s, stage, engine, progress: stage === "download" ? 0 : s.progress })),
      onDownload: (d) => !c.signal.aborted && setState((s) => ({ ...s, download: d })),
    };
    try {
      const result = await fn(hooks);
      if (c.signal.aborted) return null;
      setState((s) => ({ ...s, status: "done", progress: 1, result }));
      return result;
    } catch (error) {
      if (c.signal.aborted || isAbort(error)) {
        setState((s) => ({ ...s, status: "cancelled" }));
        return null;
      }
      console.error(error);
      setState((s) => ({ ...s, status: "error", error }));
      return null;
    } finally {
      if (ctrl.current === c) ctrl.current = null;
    }
  }, []);

  const cancel = useCallback(() => ctrl.current?.abort(), []);
  const reset = useCallback(() => {
    ctrl.current?.abort();
    setState(INITIAL);
  }, []);

  return { ...state, run, cancel, reset, running: state.status === "running" };
}

export interface Probe {
  info: MediaInfo | null;
  detected: Detected | null;
  loading: boolean;
}

/** Container/codec information and magic-byte type of a file (read in a worker). */
export function useProbe(file: File | null): Probe {
  const [state, setState] = useState<Probe>({ info: null, detected: null, loading: false });
  useEffect(() => {
    if (!file) {
      setState({ info: null, detected: null, loading: false });
      return;
    }
    const c = new AbortController();
    setState({ info: null, detected: null, loading: true });
    Promise.all([probeMedia(file, c.signal), sniffFile(file).catch(() => null)])
      .then(([info, detected]) => !c.signal.aborted && setState({ info, detected, loading: false }))
      .catch(() => !c.signal.aborted && setState({ info: null, detected: null, loading: false }));
    return () => c.abort();
  }, [file]);
  return state;
}

/** Whether the browser has WebCodecs (read after mount; SSR-safe). */
export function useWebCodecs(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    setOk(typeof window !== "undefined" && "VideoEncoder" in window && "AudioDecoder" in window);
  }, []);
  return ok;
}
