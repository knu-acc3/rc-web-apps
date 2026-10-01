/**
 * Job handler: decode → transform → encode. Runs inside the Web Worker, or on
 * the main thread as a fallback when OffscreenCanvas is unavailable.
 */
import type { Pica } from "pica";
import { FORMAT_META } from "./detect";
import { canvasBlob, canvasHasAlpha, encodeCanvas, finishBytes, OUT_MIME } from "./encode";
import { decodeGifFrames, parseGif, shownDelay } from "./gif-decode";
import { extractExifSegment } from "./jpeg";
import { medianCut } from "./palette";
import { ctx2d, makeCanvas, paintBlank, releaseCanvas, resampleCanvas, runOps, type Env, type RunInfo } from "./pipeline";
import { fitToSize } from "./target-size";
import type { AnyCanvas, GifFramesResult, InfoResult, JobRequest, Op, OutFormat, PixelsResult, PreviewResult, ProcessResult, Src, TileResult } from "./types";

function cloneCanvas(env: Env, c: AnyCanvas): AnyCanvas {
  const out = makeCanvas(env, c.width, c.height);
  ctx2d(out).drawImage(c, 0, 0);
  return out;
}

interface HandlerCtx {
  progress(v: number): void;
  signal?: AbortSignal;
}

interface Handled {
  result: unknown;
  transfer: Transferable[];
}

const inWorker = typeof document === "undefined";

function createCanvas(w: number, h: number): AnyCanvas {
  if (inWorker || typeof document === "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

let picaPromise: Promise<Pica> | null = null;
function getPica(): Promise<Pica> {
  if (!picaPromise) {
    picaPromise = import("pica/pica_main").then((m) => {
      const factory = (m as unknown as { default: (o?: object) => Pica }).default;
      return factory({ features: ["js", "wasm"] });
    });
  }
  return picaPromise;
}

function makeEnv(scale = 1, assets?: Record<string, ImageBitmap>): Env {
  return {
    create: createCanvas,
    scale,
    assets,
    async resample(src, dw, dh) {
      const p = await getPica();
      const dst = createCanvas(dw, dh);
      const down = dw < src.width;
      await p.resize(src, dst, down ? { filter: "mks2013", unsharpAmount: 60, unsharpRadius: 0.6, unsharpThreshold: 2 } : { filter: "mks2013" });
      return dst;
    },
  };
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

/* ───────────── decoding ───────────── */

async function bitmapFromBlob(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch (e) {
    // older engines reject the enum value; retry with defaults
    if (e instanceof TypeError) return createImageBitmap(blob);
    throw e;
  }
}

async function decodeTiff(blob: Blob, env: Env): Promise<AnyCanvas> {
  const mod = await import("utif2");
  const UTIF = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
  const buf = await blob.arrayBuffer();
  const ifds = UTIF.decode(buf);
  const page = ifds.find((i) => i.t256 && i.t257) ?? ifds[0];
  if (!page) throw new Error("DECODE_FAILED");
  UTIF.decodeImage(buf, page);
  const w = page.width;
  const h = page.height;
  if (!w || !h) throw new Error("DECODE_FAILED");
  const rgba = UTIF.toRGBA8(page);
  const c = makeCanvas(env, w, h);
  ctx2d(c).putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer as ArrayBuffer, rgba.byteOffset, w * h * 4), w, h), 0, 0);
  return c;
}

async function wasmDecode(blob: Blob, format: string, env: Env): Promise<AnyCanvas | null> {
  const buf = await blob.arrayBuffer();
  let img: ImageData | null = null;
  try {
    if (format === "avif") img = await (await import("@jsquash/avif/decode")).default(buf);
    else if (format === "webp") img = await (await import("@jsquash/webp/decode")).default(buf);
    else if (format === "jpg") img = await (await import("@jsquash/jpeg/decode")).default(buf);
    else if (format === "png") img = await (await import("@jsquash/png/decode")).default(buf);
  } catch {
    img = null;
  }
  if (!img) return null;
  const c = makeCanvas(env, img.width, img.height);
  ctx2d(c).putImageData(img, 0, 0);
  return c;
}

/** Decode a source to a canvas we own. */
async function decodeSrc(src: Src, env: Env): Promise<AnyCanvas> {
  if (src.kind === "blank") {
    const c = makeCanvas(env, src.w, src.h);
    paintBlank(ctx2d(c), c.width, c.height, src.background, src.gradient);
    return c;
  }
  if (src.kind === "bitmap") {
    const c = makeCanvas(env, src.bitmap.width, src.bitmap.height);
    ctx2d(c).drawImage(src.bitmap, 0, 0);
    return c;
  }
  if (src.format === "tiff") return decodeTiff(src.blob, env);
  let bmp: ImageBitmap | null = null;
  try {
    bmp = await bitmapFromBlob(src.blob);
  } catch {
    bmp = null;
  }
  if (bmp) {
    const c = makeCanvas(env, bmp.width, bmp.height);
    ctx2d(c).drawImage(bmp, 0, 0);
    bmp.close();
    return c;
  }
  const viaWasm = await wasmDecode(src.blob, src.format, env);
  if (viaWasm) return viaWasm;
  // HEIC and exotic files are decoded on the main thread by the client.
  throw new Error(src.format === "heic" ? "NEEDS_MAIN" : "DECODE_FAILED");
}

/* ───────────── process ───────────── */

const EXT: Record<OutFormat, string> = { jpg: "jpg", png: "png", webp: "webp", avif: "avif", gif: "gif", ico: "ico" };

async function processJob(req: Extract<JobRequest, { type: "process" }>, hc: HandlerCtx): Promise<Handled> {
  const { src, out } = req;
  const env = makeEnv(1, req.assets);
  hc.progress(0.05);
  const decoded = await decodeSrc(src, env);
  const srcW = decoded.width;
  const srcH = decoded.height;
  checkAbort(hc.signal);
  hc.progress(0.25);
  const info: RunInfo = { limited: false };
  const canvas = await runOps(env, decoded, req.ops, info);
  if (canvas !== decoded) releaseCanvas(decoded);
  checkAbort(hc.signal);
  hc.progress(0.5);

  let exifSeg: Uint8Array | null = null;
  if (out.keepExif && out.format === "jpg" && src.kind === "blob" && src.format === "jpg") {
    try {
      exifSeg = extractExifSegment(new Uint8Array(await src.blob.slice(0, 1 << 20).arrayBuffer()));
    } catch {
      exifSeg = null;
    }
  }

  let bytes: Uint8Array;
  let encoder: string;
  let quality: number | undefined;
  let scale: number | undefined;
  let missedTarget = false;
  let width = canvas.width;
  let height = canvas.height;

  const canTarget = out.targetBytes && (out.format === "jpg" || out.format === "webp" || out.format === "avif");
  if (canTarget) {
    const base = canvas;
    let cache: { scale: number; c: AnyCanvas } | null = null;
    let tries = 0;
    const fit = await fitToSize(
      async (sc, q) => {
        checkAbort(hc.signal);
        let c = base;
        if (sc < 0.999) {
          if (!cache || cache.scale !== sc) {
            if (cache) releaseCanvas(cache.c);
            cache = { scale: sc, c: await resampleCanvas(env, base, base.width * sc, base.height * sc) };
          }
          c = cache.c;
        }
        const enc = await encodeCanvas(c, out, env, q);
        const b = finishBytes(enc.bytes, out, exifSeg);
        tries++;
        hc.progress(Math.min(0.95, 0.5 + tries * 0.05));
        return { size: b.length, value: { b, encoder: enc.encoder, w: c.width, h: c.height } };
      },
      out.targetBytes!,
      { allowDownscale: out.allowDownscale !== false, srcPixels: base.width * base.height, signal: hc.signal },
    );
    bytes = fit.result.value.b;
    encoder = fit.result.value.encoder;
    width = fit.result.value.w;
    height = fit.result.value.h;
    quality = fit.quality;
    scale = fit.scale;
    missedTarget = !fit.fits;
    const cached = cache as { scale: number; c: AnyCanvas } | null;
    if (cached) releaseCanvas(cached.c);
  } else {
    const enc = await encodeCanvas(canvas, out, env);
    bytes = finishBytes(enc.bytes, out, exifSeg);
    encoder = enc.encoder;
  }
  releaseCanvas(canvas);

  if (out.format === "ico") {
    const sizes = out.icoSizes?.length ? out.icoSizes : [16, 32, 48];
    width = height = Math.min(256, Math.max(...sizes));
  }
  const result: ProcessResult = {
    bytes: bytes.buffer.byteLength === bytes.byteLength ? (bytes.buffer as ArrayBuffer) : (bytes.slice().buffer as ArrayBuffer),
    mime: OUT_MIME[out.format],
    ext: EXT[out.format],
    width,
    height,
    srcWidth: srcW,
    srcHeight: srcH,
    quality,
    scale,
    missedTarget,
    encoder,
    limited: info.limited,
  };

  // Never return a bigger file than the original when nothing else changed.
  if (
    out.keepSmaller &&
    src.kind === "blob" &&
    FORMAT_META[src.format]?.mime === result.mime &&
    width === srcW &&
    height === srcH &&
    src.blob.size <= bytes.length
  ) {
    const orig = await src.blob.arrayBuffer();
    return { result: { ...result, bytes: orig, keptOriginal: true, encoder: undefined }, transfer: [orig] };
  }
  hc.progress(1);
  return { result, transfer: [result.bytes] };
}

async function toBitmap(c: AnyCanvas): Promise<ImageBitmap> {
  if ("transferToImageBitmap" in c) return (c as OffscreenCanvas).transferToImageBitmap();
  return createImageBitmap(c);
}

/* ───────────── dispatcher ───────────── */

export async function handle(req: JobRequest, hc: HandlerCtx): Promise<Handled> {
  switch (req.type) {
    case "process":
      return processJob(req, hc);

    case "preview": {
      const env = makeEnv(1, req.assets);
      const full = await decodeSrc(req.src, env);
      const srcWidth = full.width;
      const srcHeight = full.height;
      const k = Math.min(1, req.maxSide / Math.max(srcWidth, srcHeight));
      const small = k < 1 ? await resampleCanvas(env, full, srcWidth * k, srcHeight * k) : full;
      if (small !== full) releaseCanvas(full);
      const scale = small.width / srcWidth;
      const envS = makeEnv(scale, req.assets);
      const outC = req.ops?.length ? await runOps(envS, small, req.ops) : small;
      const result: PreviewResult = {
        bitmap: await toBitmap(outC),
        srcWidth,
        srcHeight,
        width: Math.round(outC.width / scale),
        height: Math.round(outC.height / scale),
        scale,
      };
      return { result, transfer: [result.bitmap] };
    }

    case "info": {
      const env = makeEnv();
      const c = await decodeSrc(req.src, env);
      const result: InfoResult = { width: c.width, height: c.height, alpha: canvasHasAlpha(c) };
      releaseCanvas(c);
      return { result, transfer: [] };
    }

    case "pixels":
    case "palette": {
      // plain canvas downscale (no sharpening halos that would add fake colours)
      const env: Env = { ...makeEnv(), resample: undefined };
      const full = await decodeSrc(req.src, env);
      const maxSide = req.type === "pixels" ? req.maxSide : 480;
      const k = Math.min(1, maxSide / Math.max(full.width, full.height));
      const small = k < 1 ? await resampleCanvas(env, full, full.width * k, full.height * k) : full;
      const img = ctx2d(small).getImageData(0, 0, small.width, small.height);
      const srcWidth = full.width;
      const srcHeight = full.height;
      if (small !== full) releaseCanvas(small);
      releaseCanvas(full);
      if (req.type === "palette") return { result: medianCut(img.data, req.count).filter((c, i) => i === 0 || c.share >= 0.005), transfer: [] };
      const result: PixelsResult = { rgba: img.data.buffer as ArrayBuffer, width: img.width, height: img.height, srcWidth, srcHeight };
      return { result, transfer: [result.rgba] };
    }

    case "gif-encode": {
      const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
      const env = makeEnv();
      const W = Math.max(1, Math.round(req.width));
      const H = Math.max(1, Math.round(req.height));
      const transparent = req.background === "transparent";
      const gif = GIFEncoder();
      const c = makeCanvas(env, W, H);
      const ctx = ctx2d(c);
      req.frames.forEach((bmp, i) => {
        checkAbort(hc.signal);
        ctx.clearRect(0, 0, W, H);
        if (!transparent) {
          ctx.fillStyle = req.background;
          ctx.fillRect(0, 0, W, H);
        }
        const k = req.fit === "cover" ? Math.max(W / bmp.width, H / bmp.height) : Math.min(W / bmp.width, H / bmp.height);
        const dw = bmp.width * k;
        const dh = bmp.height * k;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bmp, (W - dw) / 2, (H - dh) / 2, dw, dh);
        const d = ctx.getImageData(0, 0, W, H).data;
        const format = transparent ? "rgba4444" : "rgb565";
        const palette = quantize(d, 256, transparent ? { format, oneBitAlpha: true, clearAlpha: true } : { format });
        const index = applyPalette(d, palette, format);
        const ti = transparent ? palette.findIndex((p) => p[3] === 0) : -1;
        gif.writeFrame(index, W, H, {
          palette,
          delay: req.delays?.[i] ?? req.delay,
          repeat: req.loop,
          transparent: ti >= 0,
          transparentIndex: Math.max(0, ti),
          dispose: transparent ? 2 : -1,
        });
        bmp.close();
        hc.progress((i + 1) / req.frames.length);
      });
      gif.finish();
      const bytes = gif.bytes();
      const buf = bytes.buffer.byteLength === bytes.byteLength ? bytes.buffer : bytes.slice().buffer;
      return { result: buf, transfer: [buf as ArrayBuffer] };
    }

    case "gif-frames": {
      const bytes = new Uint8Array(req.bytes);
      const { header, frames } = parseGif(bytes);
      const env = makeEnv();
      const c = makeCanvas(env, header.width, header.height);
      const ctx = ctx2d(c);
      const want = req.indices ? new Set(req.indices) : null;
      const out: GifFramesResult = { width: header.width, height: header.height, loop: header.loop, frames: [] };
      const transfer: ArrayBuffer[] = [];
      for (const f of decodeGifFrames(bytes)) {
        checkAbort(hc.signal);
        if (!want || want.has(f.index)) {
          ctx.putImageData(new ImageData(f.rgba, header.width, header.height), 0, 0);
          const blob = await canvasBlob(c, "image/png");
          if (!blob) throw new Error("ENCODE_FAILED");
          const png = await blob.arrayBuffer();
          transfer.push(png);
          out.frames.push({ index: f.index, delay: f.delay, shownDelay: shownDelay(f.delay), png });
        }
        hc.progress((f.index + 1) / frames.length);
      }
      return { result: out, transfer };
    }

    case "tiles": {
      const env = makeEnv();
      const full = await decodeSrc(req.src, env);
      const tiles: TileResult[] = [];
      for (let i = 0; i < req.rects.length; i++) {
        checkAbort(hc.signal);
        const ops: Op[] = [{ t: "crop", rect: req.rects[i] }];
        if (req.size) ops.push({ t: "size", w: req.size.w, h: req.size.h });
        const c = await runOps(env, full, ops);
        const enc = await encodeCanvas(c === full ? cloneCanvas(env, full) : c, req.out, env);
        const bytes = finishBytes(enc.bytes, req.out, null);
        const buf = bytes.slice().buffer as ArrayBuffer;
        tiles.push({ bytes: buf, width: c.width, height: c.height });
        if (c !== full) releaseCanvas(c);
        hc.progress((i + 1) / req.rects.length);
      }
      releaseCanvas(full);
      return { result: tiles, transfer: tiles.map((t) => t.bytes) };
    }

    case "encode-rgba": {
      const env = makeEnv();
      const c = makeCanvas(env, req.width, req.height);
      ctx2d(c).putImageData(new ImageData(new Uint8ClampedArray(req.rgba), req.width, req.height), 0, 0);
      const enc = await encodeCanvas(c, req.out, env);
      const bytes = finishBytes(enc.bytes, req.out, null);
      const buf = bytes.slice().buffer as ArrayBuffer;
      return {
        result: { bytes: buf, mime: OUT_MIME[req.out.format], ext: EXT[req.out.format], width: c.width, height: c.height, encoder: enc.encoder },
        transfer: [buf],
      };
    }
  }
}
