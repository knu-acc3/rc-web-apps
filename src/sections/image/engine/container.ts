/**
 * Lossless chunk-level edits of PNG and WebP files (DPI, metadata removal)
 * and the ICO container writer.
 */

/* ───────────── CRC32 (PNG) ───────────── */

let CRC_TABLE: Uint32Array | null = null;
function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}

export function crc32(bytes: Uint8Array, start = 0, end = bytes.length, seed = 0xffffffff): number {
  const t = crcTable();
  let c = seed;
  for (let i = start; i < end; i++) c = t[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const put32be = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 24) & 255;
  b[o + 1] = (v >>> 16) & 255;
  b[o + 2] = (v >>> 8) & 255;
  b[o + 3] = v & 255;
};
const ascii = (b: Uint8Array, o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/* ───────────── PNG ───────────── */

export interface PngChunk {
  type: string;
  /** offset of the length field */
  start: number;
  /** offset after the CRC */
  end: number;
  dataStart: number;
  length: number;
}

export function isPng(b: Uint8Array): boolean {
  return b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
}

export function pngChunks(b: Uint8Array): PngChunk[] {
  if (!isPng(b)) throw new Error("Not a PNG file");
  const out: PngChunk[] = [];
  let p = 8;
  while (p + 12 <= b.length) {
    const length = u32be(b, p);
    const type = ascii(b, p + 4, 4);
    const end = p + 12 + length;
    if (end > b.length) throw new Error("Corrupt PNG: chunk exceeds file");
    out.push({ type, start: p, end, dataStart: p + 8, length });
    p = end;
    if (type === "IEND") break;
  }
  return out;
}

export function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  put32be(out, 0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  put32be(out, 8 + data.length, crc32(out, 4, 8 + data.length));
  return out;
}

/** DPI stored in pHYs (null when absent or unit is unknown). */
export function readPngDpi(b: Uint8Array): { x: number; y: number } | null {
  const c = pngChunks(b).find((x) => x.type === "pHYs");
  if (!c || c.length < 9) return null;
  if (b[c.dataStart + 8] !== 1) return null;
  const toDpi = (ppm: number) => {
    const v = ppm * 0.0254;
    return Math.abs(v - Math.round(v)) < 0.05 ? Math.round(v) : Math.round(v * 10) / 10;
  };
  return { x: toDpi(u32be(b, c.dataStart)), y: toDpi(u32be(b, c.dataStart + 4)) };
}

/** Set DPI by writing a pHYs chunk right after IHDR (replacing any existing one). */
export function setPngDpi(b: Uint8Array, dpi: number): Uint8Array {
  const chunks = pngChunks(b);
  const ppm = Math.max(1, Math.round(dpi / 0.0254));
  const data = new Uint8Array(9);
  put32be(data, 0, ppm);
  put32be(data, 4, ppm);
  data[8] = 1;
  const phys = makePngChunk("pHYs", data);
  const parts: Uint8Array[] = [b.subarray(0, 8)];
  for (const c of chunks) {
    if (c.type === "pHYs") continue;
    parts.push(b.subarray(c.start, c.end));
    if (c.type === "IHDR") parts.push(phys);
  }
  return concat(parts);
}

const PNG_META = new Set(["tEXt", "iTXt", "zTXt", "eXIf", "tIME", "dSIG"]);

/** Remove text/EXIF/time chunks from a PNG. Colour chunks (iCCP, sRGB, gAMA, cHRM) and pixels stay. */
export function stripPngMetadata(b: Uint8Array): { bytes: Uint8Array; removed: string[] } {
  const chunks = pngChunks(b);
  const removed = new Set<string>();
  const parts: Uint8Array[] = [b.subarray(0, 8)];
  for (const c of chunks) {
    if (PNG_META.has(c.type)) {
      removed.add(c.type);
      continue;
    }
    parts.push(b.subarray(c.start, c.end));
  }
  return { bytes: concat(parts), removed: [...removed] };
}

/** Read PNG IHDR (width, height, bit depth, colour type). */
export function readPngHeader(b: Uint8Array): { width: number; height: number; bitDepth: number; colorType: number } | null {
  if (!isPng(b) || b.length < 33) return null;
  return { width: u32be(b, 16), height: u32be(b, 20), bitDepth: b[24], colorType: b[25] };
}

/* ───────────── WebP (RIFF) ───────────── */

const u32le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const put32le = (b: Uint8Array, o: number, v: number) => {
  b[o] = v & 255;
  b[o + 1] = (v >>> 8) & 255;
  b[o + 2] = (v >>> 16) & 255;
  b[o + 3] = (v >>> 24) & 255;
};

export function isWebp(b: Uint8Array): boolean {
  return b.length > 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP";
}

/** Remove EXIF and XMP chunks from a WebP and clear the matching VP8X flags. */
export function stripWebpMetadata(b: Uint8Array): { bytes: Uint8Array; removed: string[] } {
  if (!isWebp(b)) throw new Error("Not a WebP file");
  const parts: Uint8Array[] = [];
  const removed: string[] = [];
  let p = 12;
  while (p + 8 <= b.length) {
    const type = ascii(b, p, 4);
    const size = u32le(b, p + 4);
    const end = Math.min(b.length, p + 8 + size + (size & 1));
    if (type === "EXIF" || type === "XMP ") {
      removed.push(type.trim());
    } else if (type === "VP8X") {
      const chunk = b.slice(p, end);
      chunk[8] &= ~(0x08 | 0x04);
      parts.push(chunk);
    } else parts.push(b.subarray(p, end));
    p = end;
  }
  const body = concat(parts);
  const out = new Uint8Array(12 + body.length);
  out.set(b.subarray(0, 12));
  put32le(out, 4, 4 + body.length);
  out.set(body, 12);
  return { bytes: out, removed };
}

/* ───────────── ICO ───────────── */

export interface IcoImage {
  width: number;
  height: number;
  /** PNG-encoded image */
  png: Uint8Array;
}

/**
 * Write a Windows .ico containing PNG-compressed images (supported since
 * Windows Vista and by every browser). Width/height 256 are stored as 0.
 */
export function writeIco(images: IcoImage[]): Uint8Array {
  if (!images.length) throw new Error("No images");
  if (images.length > 0xffff) throw new Error("Too many images");
  const sorted = [...images].sort((a, b) => a.width - b.width);
  const headerSize = 6 + sorted.length * 16;
  const total = headerSize + sorted.reduce((n, x) => n + x.png.length, 0);
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  v.setUint16(0, 0, true); // reserved
  v.setUint16(2, 1, true); // type 1 = icon
  v.setUint16(4, sorted.length, true);
  let offset = headerSize;
  sorted.forEach((img, i) => {
    if (img.width < 1 || img.height < 1 || img.width > 256 || img.height > 256) throw new Error("ICO images must be 1–256 px");
    const e = 6 + i * 16;
    out[e] = img.width >= 256 ? 0 : img.width;
    out[e + 1] = img.height >= 256 ? 0 : img.height;
    out[e + 2] = 0; // palette colours
    out[e + 3] = 0; // reserved
    v.setUint16(e + 4, 1, true); // colour planes
    v.setUint16(e + 6, 32, true); // bits per pixel
    v.setUint32(e + 8, img.png.length, true);
    v.setUint32(e + 12, offset, true);
    out.set(img.png, offset);
    offset += img.png.length;
  });
  return out;
}

/** Parse an ICO directory (for tests and ICO → PNG). */
export function readIcoDirectory(b: Uint8Array): { width: number; height: number; size: number; offset: number; bpp: number }[] {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (v.getUint16(0, true) !== 0 || ![1, 2].includes(v.getUint16(2, true))) throw new Error("Not an ICO file");
  const n = v.getUint16(4, true);
  const out = [];
  for (let i = 0; i < n; i++) {
    const e = 6 + i * 16;
    out.push({
      width: b[e] || 256,
      height: b[e + 1] || 256,
      bpp: v.getUint16(e + 6, true),
      size: v.getUint32(e + 8, true),
      offset: v.getUint32(e + 12, true),
    });
  }
  return out;
}
