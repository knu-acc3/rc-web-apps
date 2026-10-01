/**
 * Honest PDF size reduction.
 *  - collectGarbage(): drop objects nothing refers to (pdf-lib otherwise re-writes
 *    old object/xref streams and orphaned objects of loaded files).
 *  - optimizeLossless(): strip private editor data and page thumbnails, Flate-compress
 *    uncompressed streams, merge byte-identical streams, garbage-collect. What is
 *    shown on screen and printed does not change.
 *  - recompressImages(): re-encode embedded raster images (JPEG, 8-bit Flate RGB/Gray)
 *    as JPEG at a chosen quality and maximum size, updating /Width and /Height.
 *    Text and vector graphics are untouched. An image is replaced only if the new
 *    version is smaller.
 */
import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, PDFRef, PDFStream, decodePDFRawStream, type PDFDocument, type PDFObject } from "@cantoo/pdf-lib";

const N = (s: string) => PDFName.of(s);

/* ───────────── garbage collection ───────────── */

export function collectGarbage(doc: PDFDocument): number {
  const ctx = doc.context;
  const seen = new Set<PDFRef>();
  const stack: PDFObject[] = [];
  if (ctx.trailerInfo.Root) stack.push(ctx.trailerInfo.Root);
  if (ctx.trailerInfo.Info) stack.push(ctx.trailerInfo.Info);
  if (ctx.trailerInfo.Encrypt) stack.push(ctx.trailerInfo.Encrypt);
  while (stack.length) {
    const o = stack.pop()!;
    if (o instanceof PDFRef) {
      if (seen.has(o)) continue;
      seen.add(o);
      const v = ctx.lookup(o);
      if (v) stack.push(v);
    } else if (o instanceof PDFDict) {
      for (const [, v] of o.entries()) stack.push(v);
    } else if (o instanceof PDFArray) {
      for (let i = 0; i < o.size(); i++) stack.push(o.get(i));
    } else if (o instanceof PDFStream) {
      stack.push(o.dict);
    }
  }
  let removed = 0;
  for (const [ref] of ctx.enumerateIndirectObjects()) {
    if (!seen.has(ref)) {
      ctx.delete(ref);
      removed++;
    }
  }
  return removed;
}

/* ───────────── helpers ───────────── */

function fnv1a(bytes: Uint8Array): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function dictKey(d: PDFDict): string {
  return d
    .entries()
    .filter(([k]) => k !== N("Length"))
    .map(([k, v]) => `${k.toString()} ${v.toString()}`)
    .sort()
    .join(" ");
}

/** Replace references in every object according to `map`. */
function remapRefs(doc: PDFDocument, map: Map<PDFRef, PDFRef>) {
  const visit = (o: PDFObject, seen: Set<PDFObject>) => {
    if (seen.has(o)) return;
    if (o instanceof PDFDict) {
      seen.add(o);
      for (const [k, v] of o.entries()) {
        if (v instanceof PDFRef) {
          const r = map.get(v);
          if (r) o.set(k, r);
        } else visit(v, seen);
      }
    } else if (o instanceof PDFArray) {
      seen.add(o);
      for (let i = 0; i < o.size(); i++) {
        const v = o.get(i);
        if (v instanceof PDFRef) {
          const r = map.get(v);
          if (r) o.set(i, r);
        } else visit(v, seen);
      }
    } else if (o instanceof PDFStream) {
      visit(o.dict, seen);
    }
  };
  const seen = new Set<PDFObject>();
  for (const [, obj] of doc.context.enumerateIndirectObjects()) visit(obj, seen);
  const t = doc.context.trailerInfo;
  if (t.Root instanceof PDFRef && map.has(t.Root)) t.Root = map.get(t.Root)!;
  if (t.Info instanceof PDFRef && map.has(t.Info)) t.Info = map.get(t.Info)!;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* ───────────── lossless ───────────── */

interface LosslessStats {
  removedObjects: number;
  compressedStreams: number;
  mergedDuplicates: number;
  strippedPrivateData: number;
}

const DEDUPE_DICT_TYPES = new Set(["/Font", "/FontDescriptor", "/ExtGState"]);

export async function optimizeLossless(doc: PDFDocument, onProgress?: (p: number) => void): Promise<LosslessStats> {
  await doc.flush();
  const stats: LosslessStats = { removedObjects: collectGarbage(doc), compressedStreams: 0, mergedDuplicates: 0, strippedPrivateData: 0 };
  const ctx = doc.context;

  // 1. Private application data (Illustrator/Photoshop /PieceInfo) and embedded page thumbnails.
  for (const [, obj] of ctx.enumerateIndirectObjects()) {
    const d = obj instanceof PDFStream ? obj.dict : obj instanceof PDFDict ? obj : null;
    if (!d) continue;
    if (d.has(N("PieceInfo"))) {
      d.delete(N("PieceInfo"));
      stats.strippedPrivateData++;
    }
    if (d.lookup(N("Type")) === N("Page") && d.has(N("Thumb"))) {
      d.delete(N("Thumb"));
      stats.strippedPrivateData++;
    }
  }
  onProgress?.(0.15);

  // 2. Flate-compress streams stored without any filter.
  const objects = ctx.enumerateIndirectObjects();
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i][1];
    if (!(obj instanceof PDFRawStream) || obj.dict.has(N("Filter"))) continue;
    const type = obj.dict.lookup(N("Type"));
    if (type === N("Metadata") || type === N("XRef") || type === N("ObjStm")) continue;
    if (obj.contents.length < 64) continue;
    const packed = await deflate(obj.contents);
    if (packed.length < obj.contents.length * 0.95) {
      obj.dict.set(N("Filter"), N("FlateDecode"));
      obj.dict.delete(N("DecodeParms"));
      obj.updateContents(packed);
      stats.compressedStreams++;
    }
    if (i % 200 === 0) onProgress?.(0.15 + (0.5 * i) / objects.length);
  }

  // 3. Merge byte-identical streams (repeated logos, fonts embedded twice), then
  //    identical font/graphics-state dictionaries that now point to the same streams.
  for (let pass = 0; pass < 4; pass++) {
    const map = new Map<PDFRef, PDFRef>();
    const buckets = new Map<string, { ref: PDFRef; obj: PDFObject }[]>();
    for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
      let key: string | null = null;
      if (obj instanceof PDFRawStream) {
        key = `s${obj.contents.length}:${fnv1a(obj.contents)}:${dictKey(obj.dict)}`;
      } else if (obj instanceof PDFDict && !(obj instanceof PDFStream)) {
        const t = obj.lookup(N("Type"));
        if (t instanceof PDFName && DEDUPE_DICT_TYPES.has(t.toString())) key = `d:${dictKey(obj)}`;
      }
      if (!key) continue;
      const list = buckets.get(key);
      if (!list) {
        buckets.set(key, [{ ref, obj }]);
        continue;
      }
      const twin = list.find((x) => !(obj instanceof PDFRawStream) || sameBytes((x.obj as PDFRawStream).contents, obj.contents));
      if (twin) map.set(ref, twin.ref);
      else list.push({ ref, obj });
    }
    if (!map.size) break;
    remapRefs(doc, map);
    stats.mergedDuplicates += map.size;
  }
  onProgress?.(0.85);

  stats.removedObjects += collectGarbage(doc);
  onProgress?.(1);
  return stats;
}

/* ───────────── image recompression ───────────── */

export interface Bitmap {
  width: number;
  height: number;
  close?: () => void;
}

export interface ImageCodec<B extends Bitmap = Bitmap> {
  decodeJpeg(bytes: Uint8Array): Promise<B>;
  fromPixels(rgba: Uint8ClampedArray, width: number, height: number): Promise<B>;
  encodeJpeg(src: B, width: number, height: number, quality: number): Promise<Uint8Array>;
}

type ImageSkipReason = "not-image" | "mask" | "bits" | "decode" | "colorspace" | "filter" | "small" | "huge" | "used-as-mask";

interface ImageCandidate {
  kind: "jpeg" | "flate";
  width: number;
  height: number;
  components: 1 | 3;
  predictor: number;
}

function colorComponents(cs: PDFObject | undefined, doc: PDFDocument): 1 | 3 | null {
  const c = cs instanceof PDFRef ? doc.context.lookup(cs) : cs;
  if (c === N("DeviceRGB") || c === N("CalRGB")) return 3;
  if (c === N("DeviceGray") || c === N("CalGray")) return 1;
  if (c instanceof PDFArray && c.size() >= 1) {
    const kind = c.lookup(0);
    if (kind === N("CalRGB")) return 3;
    if (kind === N("CalGray")) return 1;
    if (kind === N("ICCBased")) {
      const icc = c.lookup(1);
      const n = icc instanceof PDFStream ? icc.dict.lookup(N("N")) : undefined;
      if (n instanceof PDFNumber) return n.asNumber() === 3 ? 3 : n.asNumber() === 1 ? 1 : null;
    }
  }
  return null;
}

/** Decide whether an image XObject can be safely re-encoded as JPEG. */
export function classifyImage(stream: PDFRawStream, doc: PDFDocument): ImageCandidate | ImageSkipReason {
  const d = stream.dict;
  if (d.lookup(N("Subtype")) !== N("Image")) return "not-image";
  const im = d.lookup(N("ImageMask"));
  if (im && im.toString() === "true") return "mask";
  if (d.lookup(N("Mask")) instanceof PDFArray) return "mask"; // colour-key masking breaks with lossy data
  if (d.has(N("Decode"))) return "decode";
  const bpc = d.lookup(N("BitsPerComponent"));
  const width = d.lookup(N("Width"));
  const height = d.lookup(N("Height"));
  if (!(width instanceof PDFNumber) || !(height instanceof PDFNumber)) return "not-image";
  const comps = colorComponents(d.get(N("ColorSpace")), doc);
  if (!comps) return "colorspace";
  let filter = d.lookup(N("Filter"));
  let parms = d.lookup(N("DecodeParms"));
  if (filter instanceof PDFArray) {
    if (filter.size() !== 1) return "filter";
    filter = filter.lookup(0);
    parms = parms instanceof PDFArray ? parms.lookup(0) : parms;
  }
  const w = width.asNumber();
  const h = height.asNumber();
  if (w * h > 40_000_000) return "huge";
  if (w * h < 64 * 64 || stream.contents.length < 8 * 1024) return "small";
  if (filter === N("DCTDecode")) {
    if (bpc instanceof PDFNumber && bpc.asNumber() !== 8) return "bits";
    return { kind: "jpeg", width: w, height: h, components: comps, predictor: 1 };
  }
  if (filter === N("FlateDecode")) {
    if (!(bpc instanceof PDFNumber) || bpc.asNumber() !== 8) return "bits";
    let predictor = 1;
    if (parms instanceof PDFDict) {
      const p = parms.lookup(N("Predictor"));
      predictor = p instanceof PDFNumber ? p.asNumber() : 1;
      const colors = parms.lookup(N("Colors"));
      const columns = parms.lookup(N("Columns"));
      if (predictor >= 10 && ((colors instanceof PDFNumber && colors.asNumber() !== comps) || (columns instanceof PDFNumber && columns.asNumber() !== w))) return "filter";
    }
    if (predictor !== 1 && predictor < 10) return "filter"; // TIFF predictor: not worth supporting
    return { kind: "flate", width: w, height: h, components: comps, predictor };
  }
  return "filter";
}

/** Undo PNG row predictors (Predictor ≥ 10) for 8-bit samples. */
export function unpredictPng(data: Uint8Array, bpp: number, rowLen: number): Uint8Array {
  const rows = Math.floor(data.length / (rowLen + 1));
  const out = new Uint8Array(rows * rowLen);
  let prev = new Uint8Array(rowLen);
  for (let r = 0; r < rows; r++) {
    const filter = data[r * (rowLen + 1)];
    const src = data.subarray(r * (rowLen + 1) + 1, (r + 1) * (rowLen + 1));
    const cur = out.subarray(r * rowLen, (r + 1) * rowLen);
    for (let i = 0; i < rowLen; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = src[i];
      switch (filter) {
        case 1:
          v += a;
          break;
        case 2:
          v += b;
          break;
        case 3:
          v += (a + b) >> 1;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
      }
      cur[i] = v & 0xff;
    }
    prev = cur;
  }
  return out;
}

function toRgba(samples: Uint8Array, components: 1 | 3, pixels: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels * 4);
  for (let i = 0, j = 0; i < pixels; i++, j += 4) {
    if (components === 3) {
      out[j] = samples[i * 3];
      out[j + 1] = samples[i * 3 + 1];
      out[j + 2] = samples[i * 3 + 2];
    } else {
      out[j] = out[j + 1] = out[j + 2] = samples[i];
    }
    out[j + 3] = 255;
  }
  return out;
}

interface RecompressOptions {
  /** JPEG quality 0–1. */
  quality: number;
  /** Longest side in pixels after downscaling. */
  maxSide: number;
}

interface RecompressStats {
  images: number;
  changed: number;
  bytesBefore: number;
  bytesAfter: number;
}

export async function recompressImages<B extends Bitmap>(
  doc: PDFDocument,
  codec: ImageCodec<B>,
  opts: RecompressOptions,
  onProgress?: (p: number) => void,
  isCancelled?: () => boolean,
): Promise<RecompressStats> {
  const ctx = doc.context;
  // Images used as soft masks / stencil masks of other images stay untouched.
  const maskRefs = new Set<PDFRef>();
  const images: [PDFRef, PDFRawStream][] = [];
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream) || obj.dict.lookup(N("Subtype")) !== N("Image")) continue;
    images.push([ref, obj]);
    for (const k of ["SMask", "Mask"]) {
      const v = obj.dict.get(N(k));
      if (v instanceof PDFRef) maskRefs.add(v);
    }
  }
  const stats: RecompressStats = { images: images.length, changed: 0, bytesBefore: 0, bytesAfter: 0 };
  for (let i = 0; i < images.length; i++) {
    if (isCancelled?.()) break;
    const [ref, stream] = images[i];
    onProgress?.(i / images.length);
    if (maskRefs.has(ref)) continue;
    const c = classifyImage(stream, doc);
    if (typeof c === "string") continue;
    let bitmap: B | null = null;
    try {
      if (c.kind === "jpeg") {
        bitmap = await codec.decodeJpeg(stream.contents);
      } else {
        let samples = decodePDFRawStream(stream).decode();
        const rowLen = c.width * c.components;
        if (c.predictor >= 10) samples = unpredictPng(samples, c.components, rowLen);
        if (samples.length < rowLen * c.height) continue;
        bitmap = await codec.fromPixels(toRgba(samples, c.components, c.width * c.height), c.width, c.height);
      }
      const k = Math.min(1, opts.maxSide / Math.max(c.width, c.height));
      const w = Math.max(1, Math.round(c.width * k));
      const h = Math.max(1, Math.round(c.height * k));
      const jpeg = await codec.encodeJpeg(bitmap, w, h, opts.quality);
      if (jpeg.length >= stream.contents.length * 0.95) continue;
      const dict = stream.dict.clone(ctx);
      for (const key of ["Filter", "DecodeParms", "Length", "Decode", "ColorSpace", "BitsPerComponent", "Width", "Height"]) dict.delete(N(key));
      dict.set(N("Type"), N("XObject"));
      dict.set(N("Subtype"), N("Image"));
      dict.set(N("Width"), PDFNumber.of(w));
      dict.set(N("Height"), PDFNumber.of(h));
      dict.set(N("ColorSpace"), N("DeviceRGB"));
      dict.set(N("BitsPerComponent"), PDFNumber.of(8));
      dict.set(N("Filter"), N("DCTDecode"));
      stats.bytesBefore += stream.contents.length;
      stats.bytesAfter += jpeg.length;
      ctx.assign(ref, PDFRawStream.of(dict, jpeg));
      stats.changed++;
    } catch {
      // Undecodable image: keep the original.
    } finally {
      bitmap?.close?.();
    }
  }
  onProgress?.(1);
  return stats;
}
