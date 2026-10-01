/** Main-thread helpers that run jobs for prepared files, with decode fallbacks. */
import type { Engine } from "./client";
import { materialize, type Prepared } from "./source";
import type { JobRequest, Op, OutputSpec, PixelsResult, PreviewResult, ProcessResult, Src } from "./types";

interface JobOpts {
  signal?: AbortSignal;
  onProgress?: (v: number) => void;
  svgWidth?: number;
  assets?: Record<string, ImageBitmap>;
}

const needsMain = (e: unknown) => e instanceof Error && (e.message === "DECODE_FAILED" || e.message === "NEEDS_MAIN");

async function withSource<T>(engine: Engine, p: Prepared, make: (src: Src) => JobRequest, opts: JobOpts): Promise<T> {
  let m = await materialize(p, { svgWidth: opts.svgWidth });
  try {
    return await engine.run<T>(make(m.src), { signal: opts.signal, onProgress: opts.onProgress, transfer: m.transfer, affinity: p.id });
  } catch (e) {
    if (!needsMain(e) || p.format === "svg") throw e;
    m = await materialize(p, { forceMain: true });
    return engine.run<T>(make(m.src), { signal: opts.signal, onProgress: opts.onProgress, transfer: m.transfer, affinity: p.id });
  }
}

export function processFile(engine: Engine, p: Prepared, ops: Op[], out: OutputSpec, opts: JobOpts = {}): Promise<ProcessResult> {
  return withSource<ProcessResult>(engine, p, (src) => ({ type: "process", src, ops, out, assets: opts.assets }), opts);
}

export function previewFile(engine: Engine, p: Prepared, maxSide: number, opts: JobOpts & { ops?: Op[] } = {}): Promise<PreviewResult> {
  return withSource<PreviewResult>(engine, p, (src) => ({ type: "preview", src, maxSide, ops: opts.ops, assets: opts.assets }), opts);
}

export function pixelsOf(engine: Engine, p: Prepared, maxSide: number, opts: JobOpts = {}): Promise<PixelsResult> {
  return withSource<PixelsResult>(engine, p, (src) => ({ type: "pixels", src, maxSide }), opts);
}

export function toBlob(r: ProcessResult): Blob {
  return new Blob([r.bytes], { type: r.mime });
}
