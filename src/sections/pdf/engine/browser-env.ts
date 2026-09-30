/**
 * Browser/worker implementations of image decoding and encoding
 * (createImageBitmap + OffscreenCanvas). Used only inside pdf.worker.ts.
 */
import { readJpegInfo, stripJpegOrientation } from "./image-info";
import type { ImageCodec } from "./optimize";
import type { PreparedImage } from "./pdf-ops";

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/** Downscale in halving steps for a smoother result than one big jump. */
function drawScaled(src: CanvasImageSource & { width: number; height: number }, w: number, h: number): OffscreenCanvas {
  let cur: CanvasImageSource = src;
  let cw = src.width;
  let ch = src.height;
  while (cw / 2 >= w && ch / 2 >= h) {
    const nw = Math.max(w, Math.floor(cw / 2));
    const nh = Math.max(h, Math.floor(ch / 2));
    const step = new OffscreenCanvas(nw, nh);
    const sctx = step.getContext("2d")!;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(cur, 0, 0, nw, nh);
    cur = step;
    cw = nw;
    ch = nh;
  }
  const out = new OffscreenCanvas(w, h);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(cur, 0, 0, w, h);
  return out;
}

export const browserCodec: ImageCodec<ImageBitmap> = {
  async decodeJpeg(bytes) {
    // PDF viewers ignore EXIF orientation and embedded ICC profiles, so the decoder must too.
    return createImageBitmap(new Blob([stripJpegOrientation(bytes) as BlobPart], { type: "image/jpeg" }), { colorSpaceConversion: "none" });
  },
  async fromPixels(rgba, width, height) {
    return createImageBitmap(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height));
  },
  async encodeJpeg(src, width, height, quality) {
    const canvas = drawScaled(src, width, height);
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    canvas.width = canvas.height = 1;
    return blobBytes(blob);
  },
};

/** WebP / AVIF / GIF / BMP / HEIC → JPEG (opaque) or PNG (with transparency). */
export async function convertImage(bytes: Uint8Array, kind: string): Promise<PreparedImage> {
  if (kind === "heic") {
    const { heicTo } = await import("heic-to/next");
    const jpeg = await blobBytes(await heicTo({ blob: new Blob([bytes as BlobPart], { type: "image/heic" }), type: "image/jpeg", quality: 0.92 }));
    const info = readJpegInfo(jpeg);
    if (!info) throw new Error("heic");
    return { kind: "jpeg", bytes: jpeg, pxWidth: info.width, pxHeight: info.height, dpiX: null, dpiY: null, orientation: info.orientation };
  }
  const bitmap = await createImageBitmap(new Blob([bytes as BlobPart]));
  try {
    const { width, height } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;
    let alpha = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        alpha = true;
        break;
      }
    }
    let out: Blob;
    if (alpha) {
      out = await canvas.convertToBlob({ type: "image/png" });
    } else {
      out = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
    }
    canvas.width = canvas.height = 1;
    return { kind: alpha ? "png" : "jpeg", bytes: await blobBytes(out), pxWidth: width, pxHeight: height, dpiX: null, dpiY: null, orientation: 1 };
  } finally {
    bitmap.close();
  }
}

/* ───────────── fallback: ask the page to do the canvas work ───────────── */

export type CallMain = (req: import("./main-codec").CodecRequest, transfer: Transferable[]) => Promise<unknown>;

interface RemoteBitmap {
  width: number;
  height: number;
  jpeg?: Uint8Array;
  rgba?: Uint8ClampedArray;
}

/** Codec for workers without OffscreenCanvas (Safari < 16.4): each image is re-encoded by the page. */
export function remoteCodec(call: CallMain): ImageCodec<RemoteBitmap> {
  return {
    async decodeJpeg(bytes) {
      return { width: 0, height: 0, jpeg: bytes };
    },
    async fromPixels(rgba, width, height) {
      return { width, height, rgba };
    },
    async encodeJpeg(src, targetW, targetH, quality) {
      const data = (src.jpeg ? src.jpeg.slice() : src.rgba!.slice()).buffer as ArrayBuffer;
      const out = (await call({ op: "recode", kind: src.jpeg ? "jpeg" : "rgba", data, width: src.width, height: src.height, targetW, targetH, quality }, [data])) as ArrayBuffer;
      return new Uint8Array(out);
    },
  };
}

export function remoteConvert(call: CallMain) {
  return async (bytes: Uint8Array, kind: string): Promise<PreparedImage> => {
    const data = bytes.slice().buffer as ArrayBuffer;
    const r = (await call({ op: "convert", kind, data }, [data])) as import("./main-codec").ConvertResult;
    return { kind: r.kind, bytes: new Uint8Array(r.bytes), pxWidth: r.pxWidth, pxHeight: r.pxHeight, dpiX: null, dpiY: null, orientation: r.orientation };
  };
}
