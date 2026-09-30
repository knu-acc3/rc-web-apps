/**
 * Lazy ffmpeg.wasm fallback (single-thread core, self-hosted under /vendor/media/,
 * copied there by scripts/vendor-media.mjs). Loaded only when WebCodecs cannot do a job.
 *
 * - Cancellation works at every stage, including while the core is downloading or
 *   compiling: the fetch is aborted and the ffmpeg worker is terminated.
 * - Inputs are mounted with WORKERFS (no copy of the file into WebAssembly memory).
 */
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { buildArgs, parseProbe, type FfInput } from "./ffargs";
import { TARGET_MIME, type JobResult, type JobSpec } from "./spec";
import { parseFfmpegTime } from "./time";

const BASE = "/vendor/media/";
/** Size of ffmpeg-core.wasm 0.12.10 (used when the server sends no Content-Length). */
export const FFMPEG_CORE_BYTES = 32_232_419;

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

export function abortError(): DOMException {
  return new DOMException("Cancelled", "AbortError");
}

export function isAbort(err: unknown): boolean {
  return (err as { name?: string })?.name === "AbortError" || (err as Error)?.message === "called FFmpeg.terminate()";
}

/** Terminate the ffmpeg worker (frees its memory). The next job loads it again (from the HTTP cache). */
export function disposeFfmpeg(): void {
  instance?.terminate();
  instance = null;
  loading = null;
}

async function fetchBlobUrl(url: string, type: string, signal: AbortSignal, onProgress?: (f: number) => void, expected = 0): Promise<string> {
  const res = await fetch(url, { signal });
  if (!res.ok || !res.body) throw new Error(`FFMPEG_ASSET_${res.status}`);
  const total = Number(res.headers.get("content-length")) || expected;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.byteLength;
    if (total) onProgress?.(Math.min(0.99, got / total));
  }
  return URL.createObjectURL(new Blob(chunks as BlobPart[], { type }));
}

/** Load (or reuse) the ffmpeg instance. `onProgress` reports the core download (0…1). */
export async function loadFfmpeg(signal: AbortSignal, onProgress?: (f: number) => void): Promise<FFmpeg> {
  if (signal.aborted) throw abortError();
  if (instance?.loaded) return instance;
  if (!loading) {
    loading = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ff = new FFmpeg();
      instance = ff;
      const origin = window.location.origin;
      const wasmURL = await fetchBlobUrl(`${BASE}ffmpeg-core.wasm`, "application/wasm", signal, onProgress, FFMPEG_CORE_BYTES);
      try {
        await ff.load({
          classWorkerURL: new URL(`${BASE}worker.js`, origin).href,
          coreURL: new URL(`${BASE}ffmpeg-core.js`, origin).href,
          wasmURL,
        });
      } finally {
        URL.revokeObjectURL(wasmURL);
      }
      return ff;
    })().catch((err) => {
      disposeFfmpeg();
      throw err;
    });
  }
  const onAbort = () => disposeFfmpeg();
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    return await loading;
  } catch (err) {
    if (signal.aborted) throw abortError();
    throw err;
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

export interface FfRunOptions {
  signal: AbortSignal;
  /** Overall progress 0…1 (download is not included; see onDownload). */
  onProgress?: (f: number) => void;
  onDownload?: (f: number) => void;
  /** Known input duration in seconds (improves progress); parsed from the log otherwise. */
  duration?: number | null;
  input?: Omit<FfInput, "path">;
}

async function probeCodecs(ff: FFmpeg, path: string): Promise<Partial<FfInput>> {
  try {
    const out = "/probe.txt";
    const code = await ff.ffprobe(["-v", "error", "-show_entries", "stream=codec_name,codec_type", "-of", "csv=p=0", path, "-o", out]);
    if (code !== 0) return {};
    const text = await ff.readFile(out, "utf8");
    await ff.deleteFile(out).catch(() => undefined);
    return typeof text === "string" ? parseProbe(text) : {};
  } catch {
    return {};
  }
}

/**
 * Run a job with ffmpeg. The input Blob is mounted read-only; the output is read
 * back from memory. Throws AbortError on cancel and Error("FFMPEG_EXIT_n") on failure.
 */
export async function runFfmpeg(file: Blob, fileName: string, spec: JobSpec, opts: FfRunOptions): Promise<JobResult> {
  const { signal } = opts;
  const ff = await loadFfmpeg(signal, opts.onDownload);
  if (signal.aborted) throw abortError();
  const { FFFSType } = await import("@ffmpeg/ffmpeg");

  const ext = (/\.([a-z0-9]{1,5})$/i.exec(fileName)?.[1] ?? "bin").toLowerCase();
  const dir = `/in${Date.now().toString(36)}`;
  const inName = `input.${ext}`;
  const outPath = `/output.${spec.target === "aac" ? "aac" : spec.target}`;

  const clip = spec.trim ? spec.trim.end - spec.trim.start : null;
  let duration = clip ?? opts.duration ?? null;
  if (spec.speed && duration) duration /= spec.speed.factor;
  const log: string[] = [];
  const onLog = ({ message }: { message: string }) => {
    if (log.length > 200) log.shift();
    log.push(message);
    if (!duration) {
      const d = parseFfmpegTime(message, "Duration");
      if (d) duration = spec.speed ? d / spec.speed.factor : d;
    }
    const t = parseFfmpegTime(message, "time");
    if (t !== null && duration) opts.onProgress?.(Math.min(0.99, t / duration));
  };
  const onAbort = () => disposeFfmpeg();
  signal.addEventListener("abort", onAbort, { once: true });
  ff.on("log", onLog);
  try {
    await ff.createDir(dir);
    await ff.mount(FFFSType.WORKERFS, { blobs: [{ name: inName, data: file }] }, dir);
    const path = `${dir}/${inName}`;
    let input: FfInput = { ...opts.input, path };
    // Containers the browser can't read (FLV, AVI, MTS…): ask ffprobe for the codecs so
    // H.264/AAC can be copied instead of re-encoded.
    if (!input.videoCodec && !input.audioCodec) input = { ...input, ...(await probeCodecs(ff, path)) };
    const args = buildArgs(input, spec, outPath);
    const code = await ff.exec(args);
    if (signal.aborted) throw abortError();
    if (code !== 0) {
      const tail = log.slice(-6).join("\n");
      throw Object.assign(new Error(`FFMPEG_EXIT_${code}`), { detail: tail });
    }
    const data = await ff.readFile(outPath);
    if (typeof data === "string") throw new Error("FFMPEG_BAD_OUTPUT");
    const blob = new Blob([data as BlobPart], { type: TARGET_MIME[spec.target] });
    const copied = args.includes("copy");
    const allCopied = args.join(" ").includes("-c copy");
    const codecs = [input.videoCodec, input.audioCodec].filter((x): x is string => !!x);
    return { blob, mode: allCopied ? "copy" : copied ? "mixed" : "transcode", engine: "ffmpeg", duration: duration ?? undefined, codecs: allCopied ? codecs : undefined };
  } catch (err) {
    if (signal.aborted || isAbort(err)) throw abortError();
    throw err;
  } finally {
    signal.removeEventListener("abort", onAbort);
    if (instance === ff) {
      ff.off("log", onLog);
      await Promise.allSettled([ff.deleteFile(outPath), ff.unmount(dir)]);
      await Promise.allSettled([ff.deleteDir(dir)]);
    }
  }
}
