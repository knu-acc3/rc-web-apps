/**
 * Lossless JPEG metadata surgery: segment parsing, EXIF/XMP/IPTC stripping
 * (the ICC profile is kept), JFIF density (DPI), EXIF orientation.
 * The entropy-coded image data is copied byte for byte — pixels never change.
 */

export interface JpegSegment {
  marker: number;
  /** Offset of the 0xFF marker byte. */
  start: number;
  /** Offset after the segment (for SOS: after the entropy-coded data). */
  end: number;
  /** Payload start/end (after the 2-byte length). */
  dataStart: number;
  dataEnd: number;
}

export interface ParsedJpeg {
  segments: JpegSegment[];
  /** Offset right after EOI (bytes after it are a trailer, e.g. MPF images). */
  eoiEnd: number;
}

const APP0 = 0xe0;
const APP1 = 0xe1;
const APP2 = 0xe2;
const APP12 = 0xec;
const APP13 = 0xed;
const COM = 0xfe;
const SOS = 0xda;
const EOI = 0xd9;

const standalone = (m: number) => m === 0x01 || (m >= 0xd0 && m <= 0xd7);

export function isJpeg(b: Uint8Array): boolean {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

/**
 * Parse all segments (markers after SOI up to and including EOI).
 * `headerOnly` stops at the first SOS (enough for EXIF lookups on a file prefix).
 */
export function parseJpeg(b: Uint8Array, headerOnly = false): ParsedJpeg {
  if (!isJpeg(b)) throw new Error("Not a JPEG file");
  const segments: JpegSegment[] = [];
  let p = 2;
  while (p < b.length) {
    // skip fill bytes
    if (b[p] !== 0xff) throw new Error("Corrupt JPEG: marker expected");
    while (b[p] === 0xff && p < b.length) p++;
    const marker = b[p];
    const start = p - 1;
    p++;
    if (marker === EOI) {
      segments.push({ marker, start, end: p, dataStart: p, dataEnd: p });
      return { segments, eoiEnd: p };
    }
    if (standalone(marker)) {
      segments.push({ marker, start, end: p, dataStart: p, dataEnd: p });
      continue;
    }
    if (p + 2 > b.length) throw new Error("Corrupt JPEG: truncated segment");
    const len = (b[p] << 8) | b[p + 1];
    const dataStart = p + 2;
    const dataEnd = p + len;
    if (dataEnd > b.length) throw new Error("Corrupt JPEG: segment exceeds file");
    p = dataEnd;
    if (marker === SOS && headerOnly) {
      segments.push({ marker, start, end: p, dataStart, dataEnd });
      return { segments, eoiEnd: b.length };
    }
    if (marker === SOS) {
      // entropy-coded data up to the next real marker
      while (p < b.length) {
        if (b[p] === 0xff && p + 1 < b.length) {
          const n = b[p + 1];
          if (n === 0x00 || (n >= 0xd0 && n <= 0xd7) || n === 0xff) {
            p += n === 0xff ? 1 : 2;
            continue;
          }
          break;
        }
        p++;
      }
    }
    segments.push({ marker, start, end: p, dataStart, dataEnd });
  }
  // no EOI: accept truncated files as-is
  return { segments, eoiEnd: b.length };
}

const startsWith = (b: Uint8Array, off: number, sig: string) => {
  for (let i = 0; i < sig.length; i++) if (b[off + i] !== sig.charCodeAt(i)) return false;
  return true;
};

function isExifSeg(b: Uint8Array, s: JpegSegment) {
  return s.marker === APP1 && startsWith(b, s.dataStart, "Exif\0");
}
function isIccSeg(b: Uint8Array, s: JpegSegment) {
  return s.marker === APP2 && startsWith(b, s.dataStart, "ICC_PROFILE\0");
}
function isJfifSeg(b: Uint8Array, s: JpegSegment) {
  return s.marker === APP0 && startsWith(b, s.dataStart, "JFIF\0");
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export interface StripReport {
  removed: string[];
  bytesBefore: number;
  bytesAfter: number;
}

/**
 * Remove metadata from a JPEG without re-encoding: APP1 (EXIF, XMP), APP13
 * (IPTC/Photoshop), APP12, COM comments, non-ICC APP2 (FlashPix/MPF) and any
 * trailer after EOI (e.g. extra MPF images with their own EXIF).
 * Keeps JFIF, the ICC colour profile (APP2), Adobe APP14 and all image data.
 */
export function stripJpegMetadata(b: Uint8Array): { bytes: Uint8Array; report: StripReport } {
  const { segments, eoiEnd } = parseJpeg(b);
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  const removed = new Set<string>();
  for (const s of segments) {
    let drop = false;
    if (s.marker === APP1) {
      drop = true;
      removed.add(isExifSeg(b, s) ? "EXIF" : startsWith(b, s.dataStart, "http://ns.adobe.com/xap") ? "XMP" : "APP1");
    } else if (s.marker === APP13) {
      drop = true;
      removed.add("IPTC");
    } else if (s.marker === APP12) {
      drop = true;
      removed.add("APP12");
    } else if (s.marker === COM) {
      drop = true;
      removed.add("COM");
    } else if (s.marker === APP2 && !isIccSeg(b, s)) {
      drop = true;
      removed.add(startsWith(b, s.dataStart, "MPF\0") ? "MPF" : "APP2");
    } else if (s.marker >= 0xe3 && s.marker <= 0xef && s.marker !== 0xee) {
      // APP3–APP15 except APP14 (Adobe colour transform, needed for decoding)
      drop = true;
      removed.add(`APP${s.marker - 0xe0}`);
    }
    if (!drop) parts.push(b.subarray(s.start, s.end));
  }
  if (eoiEnd < b.length) removed.add("trailer");
  const bytes = concat(parts);
  return { bytes, report: { removed: [...removed], bytesBefore: b.length, bytesAfter: bytes.length } };
}

/* ───────────── JFIF density (DPI) ───────────── */

export interface Density {
  unit: "none" | "dpi" | "dpcm";
  x: number;
  y: number;
}

export function readJfifDensity(b: Uint8Array): Density | null {
  const { segments } = parseJpeg(b);
  const s = segments.find((x) => isJfifSeg(b, x));
  if (!s || s.dataEnd - s.dataStart < 12) return null;
  const d = s.dataStart;
  const unit = b[d + 7];
  return { unit: unit === 1 ? "dpi" : unit === 2 ? "dpcm" : "none", x: (b[d + 8] << 8) | b[d + 9], y: (b[d + 10] << 8) | b[d + 11] };
}

function jfifSegment(dpi: number): Uint8Array {
  const d = Math.max(1, Math.min(65535, Math.round(dpi)));
  // FFE0, len 16, "JFIF\0", v1.01, unit 1, X, Y, thumb 0×0
  return new Uint8Array([0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 1, d >> 8, d & 255, d >> 8, d & 255, 0, 0]);
}

/** Set the DPI of a JPEG without re-encoding (JFIF APP0 + EXIF X/YResolution when present). */
export function setJpegDpi(b: Uint8Array, dpi: number): Uint8Array {
  const { segments } = parseJpeg(b);
  const d = Math.max(1, Math.min(65535, Math.round(dpi)));
  const jfif = segments.find((x) => isJfifSeg(b, x));
  let out: Uint8Array;
  if (jfif && jfif.dataEnd - jfif.dataStart >= 12) {
    out = b.slice();
    const p = jfif.dataStart;
    out[p + 7] = 1;
    out[p + 8] = d >> 8;
    out[p + 9] = d & 255;
    out[p + 10] = d >> 8;
    out[p + 11] = d & 255;
  } else {
    out = concat([b.subarray(0, 2), jfifSegment(d), b.subarray(2)]);
  }
  return patchExifResolution(out, d);
}

/* ───────────── EXIF (TIFF structure inside APP1) ───────────── */

interface TiffView {
  /** offset of the TIFF header in the file */
  base: number;
  le: boolean;
  seg: JpegSegment;
}

function exifView(b: Uint8Array, segments: JpegSegment[]): TiffView | null {
  const seg = segments.find((s) => isExifSeg(b, s));
  if (!seg) return null;
  const base = seg.dataStart + 6;
  if (base + 8 > seg.dataEnd) return null;
  const le = b[base] === 0x49;
  return { base, le, seg };
}

const rd16 = (b: Uint8Array, o: number, le: boolean) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
const rd32 = (b: Uint8Array, o: number, le: boolean) =>
  (le ? b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24) : (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
function wr16(b: Uint8Array, o: number, v: number, le: boolean) {
  if (le) {
    b[o] = v & 255;
    b[o + 1] = (v >> 8) & 255;
  } else {
    b[o] = (v >> 8) & 255;
    b[o + 1] = v & 255;
  }
}
function wr32(b: Uint8Array, o: number, v: number, le: boolean) {
  if (le) {
    b[o] = v & 255;
    b[o + 1] = (v >>> 8) & 255;
    b[o + 2] = (v >>> 16) & 255;
    b[o + 3] = (v >>> 24) & 255;
  } else {
    b[o] = (v >>> 24) & 255;
    b[o + 1] = (v >>> 16) & 255;
    b[o + 2] = (v >>> 8) & 255;
    b[o + 3] = v & 255;
  }
}

interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  /** absolute offset of the 12-byte entry */
  at: number;
}

function readIfd0(b: Uint8Array, v: TiffView): { entries: IfdEntry[]; ifdAt: number } | null {
  const ifd = v.base + rd32(b, v.base + 4, v.le);
  if (ifd + 2 > v.seg.dataEnd) return null;
  const n = rd16(b, ifd, v.le);
  if (ifd + 2 + n * 12 + 4 > v.seg.dataEnd) return null;
  const entries: IfdEntry[] = [];
  for (let i = 0; i < n; i++) {
    const at = ifd + 2 + i * 12;
    entries.push({ tag: rd16(b, at, v.le), type: rd16(b, at + 2, v.le), count: rd32(b, at + 4, v.le), at });
  }
  return { entries, ifdAt: ifd };
}

/** EXIF orientation 1–8 (1 when absent). */
export function readExifOrientation(b: Uint8Array): number {
  const { segments } = parseJpeg(b, true);
  const v = exifView(b, segments);
  if (!v) return 1;
  const ifd = readIfd0(b, v);
  const e = ifd?.entries.find((x) => x.tag === 0x0112);
  if (!e) return 1;
  const val = rd16(b, e.at + 8, v.le);
  return val >= 1 && val <= 8 ? val : 1;
}

function patchExifResolution(b: Uint8Array, dpi: number): Uint8Array {
  const { segments } = parseJpeg(b);
  const v = exifView(b, segments);
  if (!v) return b;
  const ifd = readIfd0(b, v);
  if (!ifd) return b;
  for (const e of ifd.entries) {
    if ((e.tag === 0x011a || e.tag === 0x011b) && e.type === 5 && e.count === 1) {
      const off = v.base + rd32(b, e.at + 8, v.le);
      if (off + 8 <= v.seg.dataEnd) {
        wr32(b, off, dpi, v.le);
        wr32(b, off + 4, 1, v.le);
      }
    } else if (e.tag === 0x0128 && e.type === 3) {
      wr16(b, e.at + 8, 2, v.le); // inches
    }
  }
  return b;
}

/** A minimal EXIF APP1 segment containing only the Orientation tag. */
function minimalExif(orientation: number): Uint8Array {
  // "Exif\0\0" + TIFF header (II) + IFD0 with 1 entry + next IFD 0
  const payload = new Uint8Array(6 + 8 + 2 + 12 + 4);
  payload.set([0x45, 0x78, 0x69, 0x66, 0, 0], 0);
  const t = 6;
  payload.set([0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0], t);
  wr16(payload, t + 8, 1, true);
  wr16(payload, t + 10, 0x0112, true);
  wr16(payload, t + 12, 3, true);
  wr32(payload, t + 14, 1, true);
  wr16(payload, t + 18, orientation, true);
  wr32(payload, t + 22, 0, true);
  const len = payload.length + 2;
  return concat([new Uint8Array([0xff, APP1, len >> 8, len & 255]), payload]);
}

/**
 * Set the EXIF orientation flag without touching pixel data.
 * - existing tag → patched in place;
 * - EXIF without the tag → IFD0 is rewritten (appended) with the extra entry;
 * - no EXIF → a minimal EXIF segment is inserted.
 */
export function setExifOrientation(b: Uint8Array, orientation: number): Uint8Array {
  const { segments } = parseJpeg(b);
  const v = exifView(b, segments);
  if (!v) {
    const afterSoi = segments[0] && isJfifSeg(b, segments[0]) ? segments[0].end : 2;
    return concat([b.subarray(0, afterSoi), minimalExif(orientation), b.subarray(afterSoi)]);
  }
  const ifd = readIfd0(b, v);
  if (!ifd) throw new Error("Corrupt EXIF block");
  const existing = ifd.entries.find((e) => e.tag === 0x0112);
  if (existing) {
    const out = b.slice();
    wr16(out, existing.at + 2, 3, v.le);
    wr32(out, existing.at + 4, 1, v.le);
    wr16(out, existing.at + 8, orientation, v.le);
    wr16(out, existing.at + 10, 0, v.le);
    return out;
  }
  // Append a new IFD0 (N+1 entries, sorted) at the end of the TIFF block; all
  // other offsets stay valid because no existing byte moves.
  const n = ifd.entries.length;
  const tiffLen = v.seg.dataEnd - v.base;
  const pad = tiffLen & 1;
  const newIfdOff = tiffLen + pad;
  const block = new Uint8Array(pad + 2 + (n + 1) * 12 + 4);
  wr16(block, pad, n + 1, v.le);
  const raw = ifd.entries.map((e) => b.subarray(e.at, e.at + 12));
  const orient = new Uint8Array(12);
  wr16(orient, 0, 0x0112, v.le);
  wr16(orient, 2, 3, v.le);
  wr32(orient, 4, 1, v.le);
  wr16(orient, 8, orientation, v.le);
  const all = [...raw.map((x, i) => ({ tag: ifd.entries[i].tag, bytes: x })), { tag: 0x0112, bytes: orient }].sort((a, c) => a.tag - c.tag);
  all.forEach((e, i) => block.set(e.bytes, pad + 2 + i * 12));
  block.set(b.subarray(ifd.ifdAt + 2 + n * 12, ifd.ifdAt + 2 + n * 12 + 4), pad + 2 + (n + 1) * 12);
  const newSegLen = v.seg.dataEnd - v.seg.dataStart + 2 + block.length;
  if (newSegLen > 0xffff) throw new Error("EXIF block too large");
  const head = b.slice(v.seg.start, v.seg.dataEnd);
  head[2] = newSegLen >> 8;
  head[3] = newSegLen & 255;
  wr32(head, v.base - v.seg.start + 4, newIfdOff, v.le);
  return concat([b.subarray(0, v.seg.start), head, block, b.subarray(v.seg.end)]);
}

/** The raw EXIF APP1 segment (including marker), or null. */
export function extractExifSegment(b: Uint8Array): Uint8Array | null {
  const { segments } = parseJpeg(b, true);
  const s = segments.find((x) => isExifSeg(b, x));
  return s ? b.slice(s.start, s.end) : null;
}

/**
 * Insert an EXIF APP1 segment (from another JPEG) into a freshly encoded JPEG,
 * replacing any existing one; orientation is reset to 1 because the pixels are
 * already upright.
 */
export function insertExifSegment(b: Uint8Array, exifSeg: Uint8Array): Uint8Array {
  const { segments } = parseJpeg(b);
  const kept = segments.filter((s) => !isExifSeg(b, s));
  const jfif = kept[0] && isJfifSeg(b, kept[0]) ? kept[0] : null;
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  if (jfif) parts.push(b.subarray(jfif.start, jfif.end));
  parts.push(exifSeg);
  for (const s of kept) if (s !== jfif) parts.push(b.subarray(s.start, s.end));
  const merged = concat(parts);
  return readExifOrientation(merged) !== 1 ? setExifOrientation(merged, 1) : merged;
}

/* ───────────── orientation algebra ───────────── */

/**
 * EXIF orientation as "flip horizontally (f), then rotate clockwise k×90°".
 * Index = orientation value 1–8.
 */
const ORIENT: [number, number][] = [
  [0, 0], // (unused 0)
  [0, 0], // 1 normal
  [1, 0], // 2 mirror horizontal
  [0, 2], // 3 rotate 180
  [1, 2], // 4 mirror vertical
  [1, 3], // 5 transpose
  [0, 1], // 6 rotate 90 CW
  [1, 1], // 7 transverse
  [0, 3], // 8 rotate 270 CW
];

export function orientationToOps(o: number): { flip: boolean; rot: number } {
  const [f, k] = ORIENT[o] ?? ORIENT[1];
  return { flip: !!f, rot: k };
}

export function opsToOrientation(flip: boolean, rot: number): number {
  const k = ((rot % 4) + 4) % 4;
  for (let o = 1; o <= 8; o++) if (ORIENT[o][0] === (flip ? 1 : 0) && ORIENT[o][1] === k) return o;
  return 1;
}

/**
 * Orientation after applying a user transform (flip horizontally, then rotate
 * clockwise `rot`×90°) on top of the current orientation.
 */
export function composeOrientation(current: number, flip: boolean, rot: number): number {
  const c = orientationToOps(current);
  // U ∘ T where flip∘rot(k) = rot(−k)∘flip
  const f = c.flip !== flip;
  const k = flip ? rot - c.rot : rot + c.rot;
  return opsToOrientation(f, k);
}

/** Lossless JPEG rotate/flip by rewriting the EXIF orientation flag. */
export function transformJpegLossless(b: Uint8Array, flip: boolean, rot: number): Uint8Array {
  const next = composeOrientation(readExifOrientation(b), flip, rot);
  return setExifOrientation(b, next);
}
