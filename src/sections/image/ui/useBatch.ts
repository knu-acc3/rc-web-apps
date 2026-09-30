"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { downloadBlob } from "@/lib/clipboard";
import { isAbort, type Engine } from "../engine/client";
import { prepareFile, type Prepared } from "../engine/source";
import { useEngine } from "./hooks";

export interface BatchResult {
  blob: Blob;
  url: string;
  name: string;
  width: number;
  height: number;
  keptOriginal?: boolean;
  missedTarget?: boolean;
  limited?: boolean;
  quality?: number;
  scale?: number;
  encoder?: string;
  lossless?: boolean;
}

export type ItemStatus = "reading" | "queued" | "working" | "done" | "error";

export interface BatchItem {
  key: string;
  file: File;
  prepared?: Prepared;
  status: ItemStatus;
  progress: number;
  error?: unknown;
  result?: BatchResult;
}

export interface RunOutput {
  blob: Blob;
  name: string;
  width: number;
  height: number;
  meta?: Omit<BatchResult, "blob" | "url" | "name" | "width" | "height">;
}

export interface RunCtx {
  engine: Engine;
  signal: AbortSignal;
  onProgress: (v: number) => void;
}

export type Runner = (p: Prepared, ctx: RunCtx) => Promise<RunOutput>;

let keySeq = 0;

/**
 * Batch processing state: files → prepared → queued → processed with the
 * current settings. Re-runs everything (cancelling in-flight jobs) when
 * `settingsKey` changes; revokes object URLs and cancels on unmount.
 */
export function useBatch({ runner, settingsKey, concurrency = 2, delay = 350 }: { runner: Runner; settingsKey: string; concurrency?: number; delay?: number }) {
  const getEngine = useEngine();
  const [items, setItems] = useState<BatchItem[]>([]);
  const itemsRef = useRef<BatchItem[]>([]);
  const runnerRef = useRef(runner);
  const running = useRef(new Map<string, AbortController>());
  const gen = useRef(new Map<string, number>());
  const mounted = useRef(true);
  const pumpRef = useRef<() => void>(() => {});

  useEffect(() => {
    runnerRef.current = runner;
  });

  const commit = useCallback((fn: (list: BatchItem[]) => BatchItem[]) => {
    itemsRef.current = fn(itemsRef.current);
    if (mounted.current) setItems(itemsRef.current);
  }, []);

  const patch = useCallback((key: string, p: Partial<BatchItem>) => commit((list) => list.map((it) => (it.key === key ? { ...it, ...p } : it))), [commit]);

  const priority = useRef<string | null>(null);
  const pump = useCallback(() => {
    if (!mounted.current) return;
    // the file on screen first, then the rest in list order
    const list = [...itemsRef.current].sort((a, b) => Number(b.key === priority.current) - Number(a.key === priority.current));
    for (const it of list) {
      if (running.current.size >= concurrency) return;
      if (it.status !== "queued" || !it.prepared || running.current.has(it.key)) continue;
      const ac = new AbortController();
      running.current.set(it.key, ac);
      const myGen = (gen.current.get(it.key) ?? 0) + 1;
      gen.current.set(it.key, myGen);
      patch(it.key, { status: "working", progress: 0, error: undefined });
      let engine: Engine;
      try {
        engine = getEngine();
      } catch {
        running.current.delete(it.key);
        patch(it.key, { status: "queued" });
        return;
      }
      const prepared = it.prepared;
      runnerRef
        .current(prepared, {
          engine,
          signal: ac.signal,
          onProgress: (v) => {
            if (gen.current.get(it.key) === myGen) patch(it.key, { progress: v });
          },
        })
        .then((out) => {
          if (gen.current.get(it.key) !== myGen || !mounted.current) return;
          const prev = itemsRef.current.find((x) => x.key === it.key)?.result;
          if (prev) URL.revokeObjectURL(prev.url);
          const url = URL.createObjectURL(out.blob);
          patch(it.key, { status: "done", progress: 1, result: { blob: out.blob, url, name: out.name, width: out.width, height: out.height, ...out.meta } });
        })
        .catch((e) => {
          if (gen.current.get(it.key) !== myGen || !mounted.current) return;
          if (isAbort(e)) return;
          patch(it.key, { status: "error", error: e });
        })
        .finally(() => {
          if (running.current.get(it.key) === ac) running.current.delete(it.key);
          queueMicrotask(() => pumpRef.current());
        });
    }
  }, [concurrency, getEngine, patch]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const addFiles = useCallback(
    (files: File[]) => {
      const fresh: BatchItem[] = files.map((file) => ({ key: `f${keySeq++}`, file, status: "reading", progress: 0 }));
      commit((list) => [...list, ...fresh]);
      for (const it of fresh) {
        prepareFile(it.file)
          .then((prepared) => {
            patch(it.key, { prepared, status: "queued" });
            pump();
          })
          .catch((e) => patch(it.key, { status: "error", error: e }));
      }
    },
    [commit, patch, pump],
  );

  const abort = (key: string) => {
    const ac = running.current.get(key);
    if (ac) {
      ac.abort();
      running.current.delete(key);
    }
    gen.current.set(key, (gen.current.get(key) ?? 0) + 1);
  };

  const remove = useCallback(
    (key: string) => {
      abort(key);
      const it = itemsRef.current.find((x) => x.key === key);
      if (it?.result) URL.revokeObjectURL(it.result.url);
      commit((list) => list.filter((x) => x.key !== key));
      pump();
    },
    [commit, pump],
  );

  const clear = useCallback(() => {
    for (const it of itemsRef.current) {
      abort(it.key);
      if (it.result) URL.revokeObjectURL(it.result.url);
    }
    commit(() => []);
  }, [commit]);

  /** Cancel everything that hasn't finished (keeps finished results). */
  const cancelAll = useCallback(() => {
    for (const it of itemsRef.current) if (it.status === "working" || it.status === "queued") abort(it.key);
    commit((list) =>
      list.map((it) =>
        it.status === "working" || it.status === "queued"
          ? { ...it, status: it.result ? "done" : "error", error: it.result ? undefined : new Error("CANCELLED") }
          : it,
      ),
    );
  }, [commit]);

  const retry = useCallback(
    (key: string) => {
      const it = itemsRef.current.find((x) => x.key === key);
      if (!it?.prepared) return;
      patch(key, { status: "queued", error: undefined });
      pump();
    },
    [patch, pump],
  );

  // Re-run everything when settings change (debounced).
  const firstKey = useRef(settingsKey);
  useEffect(() => {
    if (settingsKey === firstKey.current) return;
    firstKey.current = settingsKey;
    const t = setTimeout(() => {
      for (const it of itemsRef.current) {
        if (!it.prepared) continue;
        abort(it.key);
      }
      commit((list) => list.map((it) => (it.prepared && it.status !== "reading" ? { ...it, status: "queued", progress: 0, error: undefined } : it)));
      pump();
    }, delay);
    return () => clearTimeout(t);
  }, [settingsKey, delay, commit, pump]);

  useEffect(() => {
    mounted.current = true;
    const run = running.current;
    return () => {
      mounted.current = false;
      for (const ac of run.values()) ac.abort();
      run.clear();
      for (const it of itemsRef.current) if (it.result) URL.revokeObjectURL(it.result.url);
    };
  }, []);

  const busy = items.some((i) => i.status === "working" || i.status === "queued" || i.status === "reading");
  const prioritize = useCallback((key: string | null) => {
    priority.current = key;
  }, []);

  return { items, addFiles, remove, clear, cancelAll, retry, busy, prioritize };
}

/** Make file names unique inside a ZIP: "a.jpg", "a (2).jpg"… */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((n) => {
    const k = n.toLowerCase();
    const c = seen.get(k) ?? 0;
    seen.set(k, c + 1);
    if (!c) return n;
    const dot = n.lastIndexOf(".");
    return dot > 0 ? `${n.slice(0, dot)} (${c + 1})${n.slice(dot)}` : `${n} (${c + 1})`;
  });
}

/** Pack blobs into a ZIP (stored, images are already compressed) and download it. */
export async function downloadZip(files: { name: string; blob: Blob }[], zipName: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const names = uniqueNames(files.map((f) => f.name));
  files.forEach((f, i) => zip.file(names[i], f.blob, { binary: true }));
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  downloadBlob(blob, zipName);
}
