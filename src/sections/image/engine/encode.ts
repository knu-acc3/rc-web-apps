/**
 * Encoders. Browser encoders first (fast), but the returned blob type is
 * ALWAYS checked — Safari silently returns PNG for WebP/AVIF — with WebAssembly
 * fallbacks (@jsquash: MozJPEG, libwebp, libavif, OxiPNG) and gifenc for GIF.
 */
import { setPngDpi, writeIco } from "./container";
import { insertExifSegment, setJpegDpi } from "./jpeg";
import { ctx2d, makeCanvas, resampleCanvas, type Env } from "./pipeline";
import type { AnyCanvas, OutFormat, OutputSpec } from "./types";

export const OUT_MIME: Record<OutFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  ico: "image/x-icon",
};

interface Encoded {
  bytes: Uint8Array;
  encoder: string;
}

type RawImage = { data: Uint8ClampedArray; width: number; height: number; colorSpace?: string };

export async function canvasBlob(c: AnyCanvas, type: string, quality?: number): Promise<Blob | null> {
  if ("convertToBlob" in c) {
    try {
      return await c.convertToBlob({ type, quality });
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => (c as HTMLCanvasElement).toBlob(resolve, type, quality));
}

const pixels = (c: AnyCanvas): RawImage => ctx2d(c).getImageData(0, 0, c.width, c.height);

/** Paint `color` behind existing pixels (in place) — JPEG has no alpha. */
function flatten(c: AnyCanvas, color: string) {
  const ctx = ctx2d(c);
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.restore();
}

export function canvasHasAlpha(c: AnyCanvas): boolean {
  const ctx = ctx2d(c);
  // scan in horizontal bands to keep memory low on huge images
  const band = Math.max(1, Math.floor(4_000_000 / Math.max(1, c.width)));
  for (let y = 0; y < c.height; y += band) {
    const h = Math.min(band, c.height - y);
    const d = ctx.getImageData(0, y, c.width, h).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
  }
  return false;
}

async function jsquashJpeg(img: RawImage, quality: number): Promise<Uint8Array> {
  const { default: encode } = await import("@jsquash/jpeg/encode");
  return new Uint8Array(await encode(img as ImageData, { quality, progressive: true, optimize_coding: true }));
}

async function jsquashWebp(img: RawImage, quality: number): Promise<Uint8Array> {
  const { default: encode } = await import("@jsquash/webp/encode");
  return new Uint8Array(await encode(img as ImageData, { quality, method: 4 }));
}

async function jsquashAvif(img: RawImage, quality: number): Promise<Uint8Array> {
  const { encodeAvif } = await import("./codecs");
  return encodeAvif(img, quality, img.width * img.height > 8e6 ? 8 : 6);
}

async function oxipng(png: Uint8Array, level = 2): Promise<Uint8Array> {
  const { optimisePng } = await import("./codecs");
  return optimisePng(png, level);
}

/** Reduce a canvas to at most `colors` colours (in place), like pngquant. */
async function quantizeCanvas(c: AnyCanvas, colors: number) {
  const { quantize, applyPalette } = await import("gifenc");
  const ctx = ctx2d(c);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  let alpha = false;
  for (let i = 3; i < d.length; i += 4)
    if (d[i] < 255) {
      alpha = true;
      break;
    }
  const format = alpha ? "rgba4444" : "rgb565";
  const palette = quantize(d, Math.max(2, Math.min(256, colors)), { format });
  const index = applyPalette(d, palette, format);
  for (let i = 0; i < index.length; i++) {
    const p = palette[index[i]];
    d[i * 4] = p[0];
    d[i * 4 + 1] = p[1];
    d[i * 4 + 2] = p[2];
    if (alpha) d[i * 4 + 3] = p[3] ?? 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** GIF (single frame) with 256-colour palette and 1-bit transparency. */
async function encodeGifFrame(c: AnyCanvas): Promise<Uint8Array> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const img = pixels(c);
  const d = img.data;
  let alpha = false;
  for (let i = 3; i < d.length; i += 4)
    if (d[i] < 128) {
      alpha = true;
      break;
    }
  const format = alpha ? "rgba4444" : "rgb565";
  const palette = quantize(d, 256, { format, oneBitAlpha: alpha, clearAlpha: alpha });
  const index = applyPalette(d, palette, format);
  const gif = GIFEncoder();
  const ti = alpha ? palette.findIndex((p) => p[3] === 0) : -1;
  gif.writeFrame(index, c.width, c.height, { palette, transparent: ti >= 0, transparentIndex: Math.max(0, ti) });
  gif.finish();
  return gif.bytes();
}

async function toBytes(b: Blob): Promise<Uint8Array> {
  return new Uint8Array(await b.arrayBuffer());
}

/**
 * Encode a canvas. The canvas may be modified (JPEG flattening, PNG colour
 * reduction) — callers pass a canvas they own.
 */
export async function encodeCanvas(c: AnyCanvas, out: OutputSpec, env: Env, quality = out.quality): Promise<Encoded> {
  const q = Math.max(1, Math.min(100, Math.round(quality)));
  switch (out.format) {
    case "jpg": {
      flatten(c, out.background || "#ffffff");
      let bytes: Uint8Array | null = null;
      let encoder = "browser";
      if (out.best) {
        try {
          bytes = await jsquashJpeg(pixels(c), q);
          encoder = "MozJPEG";
        } catch {
          bytes = null;
        }
      }
      if (!bytes) {
        const blob = await canvasBlob(c, "image/jpeg", q / 100);
        if (blob && blob.type === "image/jpeg") bytes = await toBytes(blob);
        else {
          bytes = await jsquashJpeg(pixels(c), q);
          encoder = "MozJPEG";
        }
      }
      return { bytes, encoder };
    }
    case "png": {
      const reduce = out.pngColors && out.pngColors >= 2 && out.pngColors <= 256;
      if (reduce) await quantizeCanvas(c, out.pngColors!);
      const blob = await canvasBlob(c, "image/png");
      if (!blob) throw new Error("ENCODE_FAILED");
      let bytes = await toBytes(blob);
      let encoder = "browser";
      if (out.best || reduce) {
        try {
          bytes = await oxipng(bytes, 2);
          encoder = "OxiPNG";
        } catch {
          /* keep the browser PNG */
        }
      }
      return { bytes, encoder };
    }
    case "webp": {
      const blob = await canvasBlob(c, "image/webp", q / 100);
      if (blob && blob.type === "image/webp") return { bytes: await toBytes(blob), encoder: "browser" };
      return { bytes: await jsquashWebp(pixels(c), q), encoder: "libwebp" };
    }
    case "avif": {
      const blob = await canvasBlob(c, "image/avif", q / 100);
      if (blob && blob.type === "image/avif") return { bytes: await toBytes(blob), encoder: "browser" };
      return { bytes: await jsquashAvif(pixels(c), q), encoder: "libavif" };
    }
    case "gif":
      return { bytes: await encodeGifFrame(c), encoder: "gifenc" };
    case "ico": {
      const sizes = [...new Set((out.icoSizes?.length ? out.icoSizes : [16, 32, 48]).filter((n) => n >= 1 && n <= 256))].sort((a, b) => a - b);
      const images = [];
      for (const size of sizes) {
        // fit inside a square, transparent padding
        const k = Math.min(size / c.width, size / c.height);
        const w = Math.max(1, Math.round(c.width * k));
        const h = Math.max(1, Math.round(c.height * k));
        const scaled = await resampleCanvas(env, c, w, h);
        const sq = makeCanvas(env, size, size);
        ctx2d(sq).drawImage(scaled, Math.round((size - w) / 2), Math.round((size - h) / 2));
        const blob = await canvasBlob(sq, "image/png");
        if (!blob) throw new Error("ENCODE_FAILED");
        images.push({ width: size, height: size, png: await toBytes(blob) });
      }
      return { bytes: writeIco(images), encoder: "ICO" };
    }
  }
}

/** Post-processing on encoded bytes: DPI and EXIF copy. */
export function finishBytes(bytes: Uint8Array, out: OutputSpec, exifSegment: Uint8Array | null): Uint8Array {
  let b = bytes;
  if (out.format === "jpg") {
    if (exifSegment && out.keepExif) {
      try {
        b = insertExifSegment(b, exifSegment);
      } catch {
        /* keep without EXIF */
      }
    }
    if (out.dpi) b = setJpegDpi(b, out.dpi);
  } else if (out.format === "png" && out.dpi) {
    b = setPngDpi(b, out.dpi);
  }
  return b;
}
