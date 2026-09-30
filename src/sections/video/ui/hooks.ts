"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { sniffFile, type Detected } from "@/sections/file/lib/magic";
import { probeMedia, type Hooks, type Stage } from "../engine/client";
import { isAbort } from "../engine/ffmpeg";
import type { MediaInfo } from "../engine/spec";

/**
 * Attach a Blob to a media/img element via an object URL that is revoked when the
 * blob changes or the component unmounts. Returns a ref callback for the element.
 */
export function useBlobSrc<E extends HTMLMediaElement | HTMLImageElement>(blob: Blob | null | undefined) {
  const el = useRef<E | null>(null);
  useAttachBlob(el, blob);
  return el;
}

/** Same as useBlobSrc for an element ref owned by the caller. */
export function useAttachBlob(el: RefObject<HTMLMediaElement | HTMLImageElement | null>, blob: Blob | null | undefined) {
  useEffect(() => {
    const node = el.current;
    if (!node || !blob) return;
    const url = URL.createObjectURL(blob);
    node.setAttribute("src", url);
    return () => {
      node.removeAttribute("src");
      if ("load" in node) (node as HTMLMediaElement).load();
      URL.revokeObjectURL(url);
    };
  }, [el, blob]);
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
  const [state, setState] = useState<{ file: File | null; info: MediaInfo | null; detected: Detected | null }>({ file: null, info: null, detected: null });
  useEffect(() => {
    if (!file) return;
    const c = new AbortController();
    Promise.all([probeMedia(file, c.signal).catch(() => null), sniffFile(file).catch(() => null)]).then(([info, detected]) => {
      if (!c.signal.aborted) setState({ file, info, detected });
    });
    return () => c.abort();
  }, [file]);
  // Derived: results belong to the current file only.
  if (!file) return { info: null, detected: null, loading: false };
  if (state.file !== file) return { info: null, detected: null, loading: true };
  return { info: state.info, detected: state.detected, loading: false };
}

const noop = () => () => {};

/** Whether the browser has WebCodecs (null during SSR/hydration). */
export function useWebCodecs(): boolean | null {
  return useSyncExternalStore(
    noop,
    () => "VideoEncoder" in window && "AudioDecoder" in window,
    () => null,
  );
}
