import type { Engine } from "../lib/client";
import { OUT_MIME } from "../lib/encode";
import type { OutFormat, ProcessResult } from "../lib/types";

/**
 * Encode a main-thread canvas. Browser encoder first — but the blob type is
 * checked (Safari returns PNG for WebP) — otherwise the worker encodes the
 * pixels with the WebAssembly codecs.
 */
export async function encodeMainCanvas(engine: Engine, canvas: HTMLCanvasElement, format: OutFormat, quality: number, background = "#FFFFFF"): Promise<Blob> {
  const mime = OUT_MIME[format];
  if (format === "jpg" || format === "png" || format === "webp") {
    if (format === "jpg") {
      const ctx = canvas.getContext("2d")!;
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, quality / 100));
    if (blob && blob.type === mime) return blob;
  }
  const img = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  const buf = img.data.buffer as ArrayBuffer;
  const r = await engine.run<ProcessResult>(
    { type: "encode-rgba", rgba: buf, width: canvas.width, height: canvas.height, out: { format, quality, background } },
    { transfer: [buf] },
  );
  return new Blob([r.bytes], { type: r.mime });
}
