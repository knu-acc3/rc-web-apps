/**
 * Frame-level operations (run inside media.worker.ts): timeline thumbnails,
 * frame export, video → GIF with real palettes, GIF → video.
 */
import type * as MB from "mediabunny";
import { gifDelays, gifSize, gifTimestamps, paletteSampleIndices, subsampleRgba } from "./gif";
import { loadGifenc } from "./gifenc";
import { FallbackError, JobError, mediabunny, openInput, outputFormat, pickVideoCodec, quality } from "./mb";
import { even, type GifSpec, type JobResult, type VideoTarget } from "./spec";

type Progress = (p: number) => void;

async function openVideo(file: Blob): Promise<{ mb: typeof MB; input: MB.Input; track: MB.InputVideoTrack; duration: number }> {
  const mb = await mediabunny();
  const input = openInput(mb, file);
  if (!(await input.canRead())) {
    input.dispose();
    throw new FallbackError("container");
  }
  const track = await input.getPrimaryVideoTrack();
  if (!track) {
    input.dispose();
    throw new JobError("NO_VIDEO");
  }
  if (!(await track.canDecode())) {
    input.dispose();
    throw new FallbackError("decode");
  }
  const duration = await input.computeDuration([track]);
  return { mb, input, track, duration };
}

type Canvas2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function ctx2d(canvas: OffscreenCanvas | HTMLCanvasElement): Canvas2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as Canvas2D | null;
  if (!ctx) throw new JobError("NO_CANVAS");
  return ctx;
}

/** Evenly spaced thumbnails (ImageBitmaps) for a timeline, streamed through `onItem`. */
export async function thumbsOp(file: Blob, count: number, height: number, onItem: (i: number, bmp: ImageBitmap, time: number) => void): Promise<{ duration: number; width: number; height: number }> {
  const { mb, input, track, duration } = await openVideo(file);
  try {
    const first = await track.getFirstTimestamp();
    const times = Array.from({ length: count }, (_, i) => first + ((i + 0.5) * duration) / count);
    const sink = new mb.CanvasSink(track, { height, fit: "contain", poolSize: 2 });
    let i = 0;
    for await (const wc of sink.canvasesAtTimestamps(times)) {
      if (wc) onItem(i, await createImageBitmap(wc.canvas), times[i]);
      i++;
    }
    return { duration, width: await track.getDisplayWidth(), height: await track.getDisplayHeight() };
  } finally {
    input.dispose();
  }
}

/** A single frame at `time` (for previews when the browser can't play the file). */
export async function frameOp(file: Blob, time: number, height: number): Promise<ImageBitmap | null> {
  const { mb, input, track } = await openVideo(file);
  try {
    const sink = new mb.CanvasSink(track, { height, fit: "contain" });
    const wc = await sink.getCanvas(time);
    return wc ? await createImageBitmap(wc.canvas) : null;
  } finally {
    input.dispose();
  }
}

export interface FramesSpec {
  times: number[];
  format: "png" | "jpeg" | "webp";
  quality: number;
  width?: number;
  baseName: string;
}

/** Export frames as images; returns the images and a ZIP (store, no recompression). */
export async function framesOp(file: Blob, spec: FramesSpec, progress: Progress): Promise<{ images: { name: string; blob: Blob; time: number }[]; zip: Blob }> {
  const { mb, input, track } = await openVideo(file);
  try {
    const sink = new mb.CanvasSink(track, { width: spec.width, poolSize: 2 });
    const images: { name: string; blob: Blob; time: number }[] = [];
    const ext = spec.format === "jpeg" ? "jpg" : spec.format;
    const pad = String(spec.times.length).length;
    let i = 0;
    for await (const wc of sink.canvasesAtTimestamps(spec.times)) {
      const t = spec.times[i];
      if (wc) {
        const c = wc.canvas as OffscreenCanvas;
        const blob = await c.convertToBlob({ type: `image/${spec.format}`, quality: spec.format === "png" ? undefined : spec.quality });
        const ms = Math.round(t * 1000);
        const stamp = `${String(Math.floor(ms / 60000)).padStart(2, "0")}-${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}-${String(ms % 1000).padStart(3, "0")}`;
        images.push({ name: `${spec.baseName}_${String(i + 1).padStart(pad, "0")}_${stamp}.${ext}`, blob, time: t });
      }
      i++;
      progress((i / spec.times.length) * 0.9);
    }
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const im of images) zip.file(im.name, im.blob);
    const out = await zip.generateAsync({ type: "blob", compression: "STORE" }, (m) => progress(0.9 + (m.percent / 100) * 0.1));
    return { images, zip: out };
  } finally {
    input.dispose();
  }
}

/** Video → animated GIF with a real 256-colour palette (global or per frame). */
export async function gifOp(file: Blob, spec: GifSpec, range: { start: number; end: number } | undefined, progress: Progress): Promise<JobResult> {
  const { mb, input, track, duration } = await openVideo(file);
  try {
    const gifenc = await loadGifenc();
    const start = range?.start ?? (await track.getFirstTimestamp());
    const end = range?.end ?? duration;
    const size = gifSize(await track.getDisplayWidth(), await track.getDisplayHeight(), spec.width);
    const times = gifTimestamps(start, end, spec.fps);
    const delays = gifDelays(spec.fps, times.length);
    const sink = new mb.CanvasSink(track, { width: size.width, height: size.height, fit: "fill", poolSize: 2 });

    let globalPalette: number[][] | undefined;
    if (spec.palette === "global") {
      // Pass 1: quantise a sample of frames together (subsampled for speed).
      const idx = paletteSampleIndices(times.length, 16);
      const perFrame = Math.max(1, Math.floor((size.width * size.height) / 40_000));
      const parts: Uint8Array[] = [];
      let n = 0;
      for await (const wc of sink.canvasesAtTimestamps(idx.map((i) => times[i]))) {
        if (!wc) continue;
        const data = ctx2d(wc.canvas).getImageData(0, 0, size.width, size.height).data;
        const sub = subsampleRgba(data, perFrame);
        parts.push(sub);
        n += sub.length;
        progress((parts.length / idx.length) * 0.1);
      }
      const all = new Uint8Array(n);
      let o = 0;
      for (const p of parts) {
        all.set(p, o);
        o += p.length;
      }
      globalPalette = gifenc.quantize(all, 256, { format: "rgb565" });
    }

    const enc = gifenc.GIFEncoder();
    let i = 0;
    const base = spec.palette === "global" ? 0.1 : 0;
    for await (const wc of sink.canvasesAtTimestamps(times)) {
      if (wc) {
        const data = ctx2d(wc.canvas).getImageData(0, 0, size.width, size.height).data;
        const palette = globalPalette ?? gifenc.quantize(data, 256, { format: "rgb565" });
        const index = gifenc.applyPalette(data, palette, "rgb565");
        enc.writeFrame(index, size.width, size.height, {
          palette: i === 0 || !globalPalette ? palette : undefined,
          delay: delays[i] * 10,
          repeat: spec.loop ? 0 : -1,
        });
      }
      i++;
      progress(base + (i / times.length) * (0.99 - base));
    }
    enc.finish();
    const bytes = enc.bytesView();
    return { blob: new Blob([bytes.slice()], { type: "image/gif" }), mode: "transcode", engine: "webcodecs", width: size.width, height: size.height, duration: end - start };
  } finally {
    input.dispose();
  }
}

/** Animated GIF/WebP/APNG → MP4/WebM using ImageDecoder (WebCodecs). */
export async function gifToVideoOp(file: Blob, target: VideoTarget, maxWidth: number, progress: Progress): Promise<JobResult> {
  if (typeof ImageDecoder === "undefined") throw new FallbackError("gif-input");
  const type = file.type || "image/gif";
  if (!(await ImageDecoder.isTypeSupported(type))) throw new FallbackError("gif-input");
  const mb = await mediabunny();
  const decoder = new ImageDecoder({ data: file.stream(), type });
  try {
    await decoder.tracks.ready;
    await decoder.completed;
    const track = decoder.tracks.selectedTrack;
    const frameCount = track?.frameCount ?? 1;
    const first = await decoder.decode({ frameIndex: 0 });
    const srcW = first.image.displayWidth;
    const srcH = first.image.displayHeight;
    const scale = Math.min(1, maxWidth / srcW);
    const W = even(srcW * scale);
    const H = even(srcH * scale);
    first.image.close();
    const codec = await pickVideoCodec(mb, target, W, H);
    if (!codec) throw new FallbackError("encode");
    const canvas = new OffscreenCanvas(W, H);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new JobError("NO_CANVAS");
    const format = outputFormat(mb, target);
    const output = new mb.Output({ format, target: new mb.BufferTarget() });
    const src = new mb.CanvasSource(canvas, { codec, quality: quality(mb, "high"), keyFrameInterval: 2 });
    output.addVideoTrack(src);
    await output.start();
    let t = 0;
    const loops = 1;
    for (let l = 0; l < loops; l++) {
      for (let i = 0; i < frameCount; i++) {
        const { image } = await decoder.decode({ frameIndex: i });
        // GIF frames already come composited; fill white behind transparency (H.264 has no alpha).
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(image, 0, 0, W, H);
        // Browsers treat delays < 20 ms as 100 ms; mirror that.
        let d = (image.duration ?? 100_000) / 1e6;
        if (!(d > 0.011)) d = 0.1;
        image.close();
        await src.add(t, d);
        t += d;
        progress((i + 1) / frameCount);
      }
    }
    src.close();
    await output.finalize();
    const buf = (output.target as MB.BufferTarget).buffer!;
    return { blob: new Blob([buf], { type: format.mimeType }), mode: "transcode", engine: "webcodecs", codecs: [codec], width: W, height: H, duration: t };
  } finally {
    decoder.close();
  }
}
