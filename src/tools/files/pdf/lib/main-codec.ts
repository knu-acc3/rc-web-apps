/**
 * Main-thread image codec: used when the pdf-lib worker has no OffscreenCanvas
 * (Safari before 16.4). The worker asks the page to decode/encode single
 * images; everything else still runs in the worker.
 */
import { readJpegInfo, stripJpegOrientation } from "./image-info";

/** @public — referenced as import("./main-codec").CodecRequest */
export type CodecRequest =
  | { op: "recode"; kind: "jpeg" | "rgba"; data: ArrayBuffer; width: number; height: number; targetW: number; targetH: number; quality: number }
  | { op: "convert"; kind: string; data: ArrayBuffer };

/** @public — referenced as import("./main-codec").ConvertResult */
export interface ConvertResult {
  kind: "jpeg" | "png";
  bytes: ArrayBuffer;
  pxWidth: number;
  pxHeight: number;
  orientation: number;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), type, q));

function drawScaled(src: CanvasImageSource & { width: number; height: number }, w: number, h: number): HTMLCanvasElement {
  let cur: CanvasImageSource = src;
  let cw = src.width;
  let ch = src.height;
  const temps: HTMLCanvasElement[] = [];
  while (cw / 2 >= w && ch / 2 >= h) {
    const step = canvas(Math.max(w, Math.floor(cw / 2)), Math.max(h, Math.floor(ch / 2)));
    const g = step.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.drawImage(cur, 0, 0, step.width, step.height);
    temps.push(step);
    cur = step;
    cw = step.width;
    ch = step.height;
  }
  const out = canvas(w, h);
  const g = out.getContext("2d")!;
  g.imageSmoothingQuality = "high";
  g.fillStyle = "#fff";
  g.fillRect(0, 0, w, h);
  g.drawImage(cur, 0, 0, w, h);
  for (const t of temps) t.width = t.height = 1;
  return out;
}

export async function handleCodecRequest(req: CodecRequest): Promise<ArrayBuffer | ConvertResult> {
  if (req.op === "recode") {
    let src: CanvasImageSource & { width: number; height: number };
    let release = () => {};
    if (req.kind === "jpeg") {
      const bmp = await createImageBitmap(new Blob([stripJpegOrientation(new Uint8Array(req.data)) as BlobPart], { type: "image/jpeg" }), { colorSpaceConversion: "none" });
      src = bmp;
      release = () => bmp.close();
    } else {
      const c = canvas(req.width, req.height);
      c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(req.data), req.width, req.height), 0, 0);
      src = c;
      release = () => {
        c.width = c.height = 1;
      };
    }
    try {
      const out = drawScaled(src, req.targetW, req.targetH);
      const blob = await toBlob(out, "image/jpeg", req.quality);
      out.width = out.height = 1;
      return blob.arrayBuffer();
    } finally {
      release();
    }
  }

  if (req.kind === "heic") {
    const { heicTo } = await import("heic-to");
    const jpeg = new Uint8Array(await (await heicTo({ blob: new Blob([req.data], { type: "image/heic" }), type: "image/jpeg", quality: 0.92 })).arrayBuffer());
    const info = readJpegInfo(jpeg);
    if (!info) throw new Error("heic");
    return { kind: "jpeg", bytes: jpeg.buffer as ArrayBuffer, pxWidth: info.width, pxHeight: info.height, orientation: info.orientation };
  }
  const bmp = await createImageBitmap(new Blob([req.data]));
  const c = canvas(bmp.width, bmp.height);
  try {
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.drawImage(bmp, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let alpha = false;
    for (let i = 3; i < d.length; i += 4)
      if (d[i] < 255) {
        alpha = true;
        break;
      }
    const blob = alpha ? await toBlob(c, "image/png") : await toBlob(c, "image/jpeg", 0.92);
    return { kind: alpha ? "png" : "jpeg", bytes: await blob.arrayBuffer(), pxWidth: bmp.width, pxHeight: bmp.height, orientation: 1 };
  } finally {
    bmp.close();
    c.width = c.height = 1;
  }
}
