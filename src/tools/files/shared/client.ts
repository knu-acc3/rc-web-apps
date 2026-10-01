/**
 * Main-thread API of the media engine.
 *
 * Primary path: mediabunny + WebCodecs in a Web Worker (fast, hardware accelerated,
 * stream copy when only the container changes). Fallback: ffmpeg.wasm, loaded lazily
 * only when the browser lacks a codec or cannot read the container.
 * Every call takes an AbortSignal; aborting terminates the worker / ffmpeg.
 */
import { decodeWav } from "@/tools/files/audio/lib/wav";
import { abortError, runFfmpeg } from "./ffmpeg";
import type { AudioOps, LoadedInfo } from "./ops-audio";
import type { FramesSpec } from "./ops-image";
import type { ClipCheck } from "./ops-video";
import type { AudioTarget, FallbackReason, JobResult, JobSpec, MediaInfo, VideoTarget } from "./spec";

export type Stage = "prepare" | "download" | "work";

export interface Hooks {
  signal: AbortSignal;
  onProgress?: (p: number) => void;
  onStage?: (s: Stage, engine: "webcodecs" | "ffmpeg") => void;
  /** ffmpeg core download progress (0…1). */
  onDownload?: (p: number) => void;
}

class EngineError extends Error {
  constructor(public code: string, public fallback?: FallbackReason, message?: string) {
    super(message ?? code);
  }
}

type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  onProgress?: (p: number) => void;
  onItem?: (index: number, data: unknown) => void;
};

/** A dedicated media worker. One per job (or per editor session). */
class MediaWorker {
  private w: Worker;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private dead = false;

  constructor() {
    this.w = new Worker(new URL("./media.worker.ts", import.meta.url), { type: "module" });
    this.w.onmessage = (e: MessageEvent) => {
      const m = e.data as { id: number; kind: string; value?: unknown; index?: number; data?: unknown; code?: string; fallback?: FallbackReason; message?: string };
      const p = this.pending.get(m.id);
      if (!p) return;
      if (m.kind === "progress") p.onProgress?.(m.value as number);
      else if (m.kind === "item") p.onItem?.(m.index!, m.data);
      else {
        this.pending.delete(m.id);
        if (m.kind === "done") p.resolve(m.value);
        else p.reject(new EngineError(m.code ?? "FAILED", m.fallback, m.message));
      }
    };
    this.w.onerror = (e) => {
      e.preventDefault?.();
      this.failAll(new EngineError("WORKER_CRASH", undefined, e.message));
    };
  }

  call<T>(op: string, args: Record<string, unknown>, opts: { onProgress?: (p: number) => void; onItem?: (i: number, d: unknown) => void; transfer?: Transferable[] } = {}): Promise<T> {
    if (this.dead) return Promise.reject(abortError());
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress: opts.onProgress, onItem: opts.onItem });
      this.w.postMessage({ id, op, args }, opts.transfer ?? []);
    });
  }

  private failAll(err: unknown) {
    for (const p of this.pending.values()) p.reject(err);
    this.pending.clear();
  }

  terminate(): void {
    if (this.dead) return;
    this.dead = true;
    this.w.terminate();
    this.failAll(abortError());
  }
}

/** Run `fn` with a fresh worker that is terminated when done or aborted. */
async function withWorker<T>(signal: AbortSignal, fn: (w: MediaWorker) => Promise<T>): Promise<T> {
  if (signal.aborted) throw abortError();
  const w = new MediaWorker();
  const onAbort = () => w.terminate();
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    return await fn(w);
  } catch (e) {
    if (signal.aborted) throw abortError();
    throw e;
  } finally {
    signal.removeEventListener("abort", onAbort);
    w.terminate();
  }
}

const EMPTY_INFO: MediaInfo = { readable: false, container: null, mime: null, duration: null, video: null, audio: null };

/** Read container/codec information (fast; reads only headers). */
export async function probeMedia(file: Blob, signal: AbortSignal): Promise<MediaInfo> {
  try {
    return await withWorker(signal, (w) => w.call<MediaInfo>("probe", { file }));
  } catch (e) {
    if (signal.aborted) throw e;
    return EMPTY_INFO;
  }
}

/** Jobs the ffmpeg fallback can do. */
function ffmpegInput(info?: MediaInfo | null) {
  return {
    videoCodec: info?.video?.codec ?? undefined,
    audioCodec: info?.audio?.codec ?? undefined,
    hasVideo: info ? !!info.video || !info.readable : undefined,
    sampleRate: info?.audio?.sampleRate,
  };
}

async function fallbackToFfmpeg(file: File | Blob, name: string, spec: JobSpec, hooks: Hooks, info?: MediaInfo | null): Promise<JobResult> {
  hooks.onStage?.("download", "ffmpeg");
  hooks.onProgress?.(0);
  return runFfmpeg(file, name, spec, {
    signal: hooks.signal,
    onProgress: (p) => hooks.onProgress?.(p),
    onDownload: (p) => {
      hooks.onDownload?.(p);
      if (p >= 0.99) hooks.onStage?.("work", "ffmpeg");
    },
    duration: info?.duration ?? null,
    input: ffmpegInput(info),
  });
}

function fileName(f: Blob, fallback = "input.bin"): string {
  return (f as File).name || fallback;
}

/**
 * Convert / remux / trim / resize / rotate / compress / extract audio / change speed / GIF.
 * Tries WebCodecs first and falls back to ffmpeg automatically.
 */
export async function runJob(file: Blob, spec: JobSpec, hooks: Hooks, info?: MediaInfo | null): Promise<JobResult> {
  hooks.onStage?.("prepare", "webcodecs");
  const op = spec.target === "gif" ? "gif" : spec.speed && spec.speed.factor !== 1 ? "speed" : "convert";
  try {
    return await withWorker(hooks.signal, (w) => {
      hooks.onStage?.("work", "webcodecs");
      const args = op === "gif" ? { file, gif: spec.gif, range: spec.trim } : { file, spec };
      return w.call<JobResult>(op, args, { onProgress: hooks.onProgress });
    });
  } catch (e) {
    if (hooks.signal.aborted) throw abortError();
    if (e instanceof EngineError && (e.fallback || e.code === "WORKER_CRASH")) return fallbackToFfmpeg(file, fileName(file), spec, hooks, info);
    throw e;
  }
}

/** Animated GIF → MP4/WebM (ImageDecoder), ffmpeg as fallback. */
export async function runGifToVideo(file: Blob, target: VideoTarget, maxWidth: number, hooks: Hooks): Promise<JobResult> {
  hooks.onStage?.("work", "webcodecs");
  try {
    return await withWorker(hooks.signal, (w) => w.call<JobResult>("gifToVideo", { file, target, maxWidth }, { onProgress: hooks.onProgress }));
  } catch (e) {
    if (hooks.signal.aborted) throw abortError();
    if (e instanceof EngineError && e.fallback) {
      return fallbackToFfmpeg(file, fileName(file, "input.gif"), { target, video: { width: maxWidth, forceTranscode: true } }, hooks, { ...EMPTY_INFO, readable: false });
    }
    throw e;
  }
}

export async function runFrames(file: Blob, spec: FramesSpec, hooks: Hooks): Promise<{ images: { name: string; blob: Blob; time: number }[]; zip: Blob }> {
  return withWorker(hooks.signal, (w) => w.call("frames", { file, spec }, { onProgress: hooks.onProgress }));
}

export async function checkMerge(files: Blob[], signal: AbortSignal): Promise<ClipCheck> {
  return withWorker(signal, (w) => w.call<ClipCheck>("mergeCheck", { files }));
}

export async function runMerge(files: Blob[], reencode: boolean, hooks: Hooks): Promise<JobResult> {
  return withWorker(hooks.signal, (w) => w.call<JobResult>("merge", { files, reencode }, { onProgress: hooks.onProgress }));
}

/**
 * Timeline thumbnails, streamed as they are decoded. Resolves with the video size.
 * Returns null if the file can't be decoded with WebCodecs.
 */
export async function loadThumbs(
  file: Blob,
  count: number,
  height: number,
  onItem: (index: number, bmp: ImageBitmap, time: number) => void,
  signal: AbortSignal,
): Promise<{ duration: number; width: number; height: number } | null> {
  try {
    return await withWorker(signal, (w) =>
      w.call("thumbs", { file, count, height }, { onItem: (i, d) => { const x = d as { bmp: ImageBitmap; time: number }; onItem(i, x.bmp, x.time); } }),
    );
  } catch (e) {
    if (signal.aborted) throw e;
    return null;
  }
}

/* ───────────── audio editor session ───────────── */

async function decodeInBrowser(file: Blob): Promise<{ channels: Float32Array[]; sampleRate: number } | null> {
  const Ctx = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!Ctx) return null;
  try {
    const ctx = new Ctx(2, 1, 48000);
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    const channels = Array.from({ length: Math.min(2, buf.numberOfChannels) }, (_, i) => buf.getChannelData(i).slice());
    return { channels, sampleRate: buf.sampleRate };
  } catch {
    return null;
  }
}

/**
 * Decoded audio kept in a worker for the audio editors (trim, volume, speed,
 * reverse, merge). Decoding order: WebCodecs → browser decodeAudioData → ffmpeg.
 */
export class AudioSession {
  private w: MediaWorker | null = null;
  private files = new Map<string, Blob>();
  private loaded = new Set<string>();

  private worker(): MediaWorker {
    this.w ??= new MediaWorker();
    return this.w;
  }

  async load(key: string, file: Blob, hooks: Hooks): Promise<LoadedInfo> {
    this.files.set(key, file);
    const { signal } = hooks;
    if (signal.aborted) throw abortError();
    const onAbort = () => this.reset();
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      try {
        const info = await this.worker().call<LoadedInfo>("pcmLoad", { key, file }, { onProgress: hooks.onProgress });
        this.loaded.add(key);
        return info;
      } catch (e) {
        if (signal.aborted) throw abortError();
        if (!(e instanceof EngineError) || !e.fallback) throw e;
      }
      let pcm = await decodeInBrowser(file);
      if (!pcm) {
        const res = await fallbackToFfmpeg(file, fileName(file), { target: "wav" }, hooks, null);
        pcm = decodeWav(new Uint8Array(await res.blob.arrayBuffer()));
      }
      const info = await this.worker().call<LoadedInfo>("pcmPut", { key, channels: pcm.channels, sampleRate: pcm.sampleRate }, { transfer: pcm.channels.map((c) => c.buffer) });
      this.loaded.add(key);
      return info;
    } catch (e) {
      if (signal.aborted) throw abortError();
      throw e;
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  }

  drop(key: string): void {
    this.files.delete(key);
    if (this.loaded.delete(key)) void this.w?.call("pcmDrop", { key }).catch(() => undefined);
  }

  async peaks(key: string, from: number, to: number, buckets: number): Promise<Float32Array> {
    return this.worker().call<Float32Array>("pcmPeaks", { key, from, to, buckets });
  }

  /** Render the edit and encode; returns the file blob. */
  async render(keys: string[], ops: AudioOps, target: AudioTarget, bitrate: number, hooks: Hooks, crossfade = 0): Promise<JobResult> {
    const { signal } = hooks;
    // Reload anything lost after a cancel (the worker is terminated on cancel).
    for (const k of keys) if (!this.loaded.has(k)) {
      const f = this.files.get(k);
      if (!f) throw new EngineError("NO_SESSION");
      await this.load(k, f, { signal, onProgress: (p) => hooks.onProgress?.(p * 0.3) });
    }
    const onAbort = () => this.reset();
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      hooks.onStage?.("work", "webcodecs");
      const res = await this.worker().call<{ blob?: Blob; wav?: Blob; duration: number }>("pcmRender", { keys, ops, target, bitrate, crossfade }, { onProgress: hooks.onProgress });
      if (res.blob) return { blob: res.blob, mode: "transcode", engine: "webcodecs", duration: res.duration };
      const out = await fallbackToFfmpeg(res.wav!, "render.wav", { target, audio: { bitrate } }, hooks, { ...EMPTY_INFO, readable: true, audio: { codec: "pcm-s16", canDecode: true, bitrate: null, sampleRate: 0, channels: 0 } });
      return { ...out, duration: res.duration };
    } catch (e) {
      if (signal.aborted) throw abortError();
      throw e;
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  }

  /** Terminate the worker (e.g. on cancel); decoded audio is reloaded on demand. */
  reset(): void {
    this.w?.terminate();
    this.w = null;
    this.loaded.clear();
  }

  dispose(): void {
    this.reset();
    this.files.clear();
  }
}
