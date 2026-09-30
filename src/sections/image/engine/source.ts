/**
 * Main-thread source preparation: sniff the real format, detect animation,
 * rasterise SVG (needs <img>) and decode HEIC where the worker can't.
 */
import { countGifFrames, detectFormat, FORMAT_META, isAnimated, type SniffedFormat } from "./detect";
import type { Src } from "./types";

export interface Prepared {
  id: string;
  file: File;
  format: SniffedFormat;
  animated: boolean;
  /** GIF frame count (when known). */
  frames?: number;
  /** SVG intrinsic size (before rasterisation). */
  svgSize?: { w: number; h: number };
}

export class PrepareError extends Error {
  constructor(
    public code: "UNSUPPORTED" | "PDF" | "PSD" | "JXL" | "DECODE_FAILED" | "SVG_INVALID" | "EMPTY",
    message = code,
  ) {
    super(message);
  }
}

let idCounter = 0;
/** Stable-per-session id (not user-facing randomness). */
export const newId = () => `s${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export async function readHead(file: Blob, n = 65536): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, n).arrayBuffer());
}

/* ───────────── SVG ───────────── */

function parseLength(v: string | null): number | null {
  if (!v) return null;
  const m = /^\s*([\d.]+)\s*(px)?\s*$/i.exec(v);
  return m ? parseFloat(m[1]) : null;
}

/** Intrinsic size of an SVG document (width/height attributes or viewBox). */
export function svgIntrinsicSize(doc: Document): { w: number; h: number; hasViewBox: boolean } {
  const root = doc.documentElement;
  const vb = (root.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  const hasViewBox = vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0;
  let w = parseLength(root.getAttribute("width"));
  let h = parseLength(root.getAttribute("height"));
  if (hasViewBox) {
    if (w && !h) h = (w * vb[3]) / vb[2];
    if (h && !w) w = (h * vb[2]) / vb[3];
    if (!w || !h) {
      w = vb[2];
      h = vb[3];
    }
  }
  return { w: w || 300, h: h || 150, hasViewBox };
}

/**
 * Rasterise SVG text at `width` px (height follows the aspect ratio). Rendering
 * happens through an <img>, so scripts never run and external files never load.
 */
export async function rasterizeSvg(text: string, width?: number): Promise<{ bitmap: ImageBitmap; intrinsic: { w: number; h: number } }> {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  if (doc.getElementsByTagName("parsererror").length || doc.documentElement.nodeName.toLowerCase() !== "svg") throw new PrepareError("SVG_INVALID");
  const size = svgIntrinsicSize(doc);
  const root = doc.documentElement;
  if (!size.hasViewBox) root.setAttribute("viewBox", `0 0 ${size.w} ${size.h}`);
  const k = width ? width / size.w : size.w < 1024 && !root.getAttribute("width") ? 1024 / size.w : 1;
  const W = Math.max(1, Math.min(16384, Math.round(size.w * k)));
  const H = Math.max(1, Math.min(16384, Math.round(size.h * k)));
  root.setAttribute("width", String(W));
  root.setAttribute("height", String(H));
  if (!root.getAttribute("preserveAspectRatio")) root.setAttribute("preserveAspectRatio", "xMidYMid meet");
  const blob = new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) throw new PrepareError("DECODE_FAILED");
    ctx.drawImage(img, 0, 0, W, H);
    const bitmap = await createImageBitmap(c);
    c.width = c.height = 1;
    return { bitmap, intrinsic: { w: size.w, h: size.h } };
  } catch (e) {
    if (e instanceof PrepareError) throw e;
    throw new PrepareError("DECODE_FAILED");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ───────────── HEIC & <img> fallback ───────────── */

async function decodeViaImg(blob: Blob): Promise<ImageBitmap> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** HEIC: native decoding (Safari 17+) first, libheif (heic-to) otherwise. */
export async function decodeHeic(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob);
  } catch {
    /* not supported natively */
  }
  const { heicTo } = await import("heic-to");
  return heicTo({ blob, type: "bitmap" });
}

/** Decode on the main thread through <img> or libheif (fallback when the worker can't). */
export async function decodeOnMain(p: Prepared): Promise<Src> {
  const bitmap = p.format === "heic" ? await decodeHeic(p.file) : await decodeViaImg(p.file);
  return { kind: "bitmap", bitmap, format: p.format, id: p.id };
}

/* ───────────── prepare (cheap) & materialize (just in time) ───────────── */

/** Sniff format and animation. Cheap: nothing is decoded here. */
export async function prepareFile(file: File): Promise<Prepared> {
  if (!file.size) throw new PrepareError("EMPTY");
  const head = await readHead(file);
  const format = detectFormat(head);
  if (!format) throw new PrepareError("UNSUPPORTED");
  if (format === "pdf") throw new PrepareError("PDF");
  if (format === "psd") throw new PrepareError("PSD");
  if (format === "jxl") throw new PrepareError("JXL");
  const id = newId();
  if (format === "svg") {
    const doc = new DOMParser().parseFromString(await file.text(), "image/svg+xml");
    if (doc.getElementsByTagName("parsererror").length || doc.documentElement.nodeName.toLowerCase() !== "svg") throw new PrepareError("SVG_INVALID");
    const s = svgIntrinsicSize(doc);
    return { id, file, format, animated: false, svgSize: { w: s.w, h: s.h } };
  }
  let frames: number | undefined;
  let animated = false;
  if (format === "gif") {
    const all = file.size <= 64 << 20 ? new Uint8Array(await file.arrayBuffer()) : head;
    frames = countGifFrames(all);
    animated = frames > 1;
  } else animated = isAnimated(head, format);
  return { id, file, format, animated, frames };
}

export interface Materialized {
  src: Src;
  transfer: Transferable[];
}

/**
 * Build the job source right before running it: SVG is rasterised and HEIC
 * decoded on the main thread (the bitmap is transferred to the worker); other
 * formats go to the worker as a Blob and are decoded there.
 */
export async function materialize(p: Prepared, opts: { svgWidth?: number; forceMain?: boolean } = {}): Promise<Materialized> {
  if (p.format === "svg") {
    const { bitmap } = await rasterizeSvg(await p.file.text(), opts.svgWidth);
    return { src: { kind: "bitmap", bitmap, format: p.format, id: p.id }, transfer: [bitmap] };
  }
  if (p.format === "heic" || opts.forceMain) {
    const src = await decodeOnMain(p);
    return { src, transfer: src.kind === "bitmap" ? [src.bitmap] : [] };
  }
  return { src: { kind: "blob", blob: p.file, format: p.format, id: p.id }, transfer: [] };
}

/** Browser can show this format directly in <img>. */
export function displayable(format: SniffedFormat): boolean {
  return ["jpg", "png", "gif", "webp", "avif", "bmp", "ico", "cur", "svg"].includes(format);
}

export function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "image";
}

export function formatLabel(format: SniffedFormat): string {
  return FORMAT_META[format]?.label ?? format.toUpperCase();
}
