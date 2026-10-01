/**
 * File type detection by magic bytes (file signatures).
 *
 * Pure functions: `detectBytes()` works on the first bytes of a file, `sniffFile()`
 * reads the needed parts of a Blob and adds details that need more data
 * (MP3/AAC behind an ID3 tag, GIF frame count, ISO 9660).
 *
 * Design rules (fixing bugs of the previous version):
 * - AAC in an ADTS stream (sync 0xFFF, layer 00) is NOT MP3.
 * - An unknown ISO-BMFF `ftyp` brand is reported as a generic ISO-BMFF container,
 *   never as "MP4 video" (Canon CR3 uses brand `crx `, HEIF uses `mif1` …).
 * - GIF/PNG/WebP are only "animated" when the data actually contains several frames.
 */

export type FileKind = "image" | "audio" | "video" | "archive" | "document" | "font" | "executable" | "text" | "data";

export interface Detected {
  /** Canonical extension without a dot, e.g. "mp4". */
  ext: string;
  mime: string;
  /** Human-readable format name (language neutral). */
  name: string;
  kind: FileKind;
  /** Other extensions commonly used for the same signature. */
  alt?: string[];
  /** Extra detail: brand, codec, version. */
  detail?: string;
  /** Animated image (GIF/APNG/WebP/AVIF sequence). Undefined = not applicable/unknown. */
  animated?: boolean;
  /** How reliable the match is: strong signature vs heuristic. */
  confidence: "high" | "medium" | "low";
}

const ascii = (b: Uint8Array, start: number, len: number): string => {
  let s = "";
  for (let i = start; i < start + len && i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
};

const eq = (b: Uint8Array, offset: number, sig: readonly number[]): boolean => {
  if (b.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (b[offset + i] !== sig[i]) return false;
  return true;
};

const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const u32le = (b: Uint8Array, o: number) => b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + ((b[o + 3] << 24) >>> 0);
const u16le = (b: Uint8Array, o: number) => b[o] + (b[o + 1] << 8);

function d(ext: string, mime: string, name: string, kind: FileKind, extra: Partial<Detected> = {}): Detected {
  return { ext, mime, name, kind, confidence: "high", ...extra };
}

/* ───────────── ID3 / MPEG audio / ADTS ───────────── */

/** Size of an ID3v2 tag at `offset` (header + body + optional footer) or 0. */
export function id3Size(b: Uint8Array, offset = 0): number {
  if (!(b[offset] === 0x49 && b[offset + 1] === 0x44 && b[offset + 2] === 0x33)) return 0;
  if (b.length < offset + 10) return 0;
  const flags = b[offset + 5];
  const size = ((b[offset + 6] & 0x7f) << 21) | ((b[offset + 7] & 0x7f) << 14) | ((b[offset + 8] & 0x7f) << 7) | (b[offset + 9] & 0x7f);
  return 10 + size + (flags & 0x10 ? 10 : 0);
}

/** ADTS (AAC) frame header: 12-bit sync 0xFFF and layer bits 00. */
export function isAdtsHeader(b: Uint8Array, o = 0): boolean {
  if (b.length < o + 7) return false;
  if (b[o] !== 0xff || (b[o + 1] & 0xf6) !== 0xf0) return false;
  const sfIndex = (b[o + 2] >> 2) & 0x0f;
  if (sfIndex > 12) return false;
  const frameLen = ((b[o + 3] & 0x03) << 11) | (b[o + 4] << 3) | (b[o + 5] >> 5);
  return frameLen >= 7;
}

/** MPEG-1/2/2.5 audio frame header (layers I–III). Returns the layer (1–3) or 0. */
export function mpegAudioLayer(b: Uint8Array, o = 0): number {
  if (b.length < o + 4) return 0;
  if (b[o] !== 0xff || (b[o + 1] & 0xe0) !== 0xe0) return 0;
  const version = (b[o + 1] >> 3) & 0x03; // 01 = reserved
  const layerBits = (b[o + 1] >> 1) & 0x03; // 00 = reserved (that is ADTS territory)
  const bitrate = (b[o + 2] >> 4) & 0x0f;
  const sampleRate = (b[o + 2] >> 2) & 0x03;
  if (version === 1 || layerBits === 0 || bitrate === 0x0f || sampleRate === 3) return 0;
  return 4 - layerBits;
}

function audioStreamAt(b: Uint8Array, o: number, afterId3: boolean): Detected | null {
  if (isAdtsHeader(b, o)) return d("aac", "audio/aac", "AAC (ADTS)", "audio", { detail: afterId3 ? "ID3 + ADTS" : "ADTS" });
  const layer = mpegAudioLayer(b, o);
  if (layer === 3) return d("mp3", "audio/mpeg", "MP3 (MPEG audio layer III)", "audio", { detail: afterId3 ? "ID3v2" : undefined });
  if (layer === 2) return d("mp2", "audio/mpeg", "MP2 (MPEG audio layer II)", "audio", { alt: ["mpa"] });
  if (layer === 1) return d("mp1", "audio/mpeg", "MPEG audio layer I", "audio");
  if (eq(b, o, [0x66, 0x4c, 0x61, 0x43])) return d("flac", "audio/flac", "FLAC", "audio", { detail: afterId3 ? "ID3 + FLAC" : undefined });
  return null;
}

/* ───────────── ISO BMFF (MP4, MOV, HEIF, AVIF, 3GP, CR3 …) ───────────── */

function isoBmff(b: Uint8Array): Detected | null {
  const box = ascii(b, 4, 4);
  if (box !== "ftyp") {
    // Old QuickTime files may start with other top-level atoms.
    const sz = u32be(b, 0);
    // Printable text has a huge first word (≥ 0x20202020), real atoms are small or 1 (64-bit size).
    if (["moov", "mdat", "wide", "free", "skip", "pnot"].includes(box) && (sz === 1 || (sz >= 8 && sz < 0x20000000))) {
      return d("mov", "video/quicktime", "QuickTime (MOV)", "video", { confidence: "medium", detail: `atom ${box}` });
    }
    return null;
  }
  const size = Math.min(u32be(b, 0), b.length, 256);
  const major = ascii(b, 8, 4);
  const compat: string[] = [];
  for (let o = 16; o + 4 <= size; o += 4) compat.push(ascii(b, o, 4));
  const brands = [major, ...compat];
  const has = (...xs: string[]) => brands.some((x) => xs.includes(x));
  const detail = `ftyp ${major.trim() || "?"}`;

  if (major === "crx ") return d("cr3", "image/x-canon-cr3", "Canon RAW 3 (CR3)", "image", { detail });
  if (major === "avif" || major === "avis" || (major === "mif1" && has("avif")) || (major === "msf1" && has("avis")))
    return d("avif", major === "avis" || major === "msf1" ? "image/avif-sequence" : "image/avif", "AVIF", "image", { detail, animated: major === "avis" || major === "msf1" });
  if (["heic", "heix", "heim", "heis", "hevc", "hevx"].includes(major))
    return d("heic", major.startsWith("hev") ? "image/heic-sequence" : "image/heic", "HEIC (HEIF)", "image", { alt: ["heif"], detail, animated: major.startsWith("hev") });
  if (major === "mif1" || major === "msf1") return d("heif", "image/heif", "HEIF", "image", { alt: ["heic"], detail, animated: major === "msf1" });
  if (major === "qt  ") return d("mov", "video/quicktime", "QuickTime (MOV)", "video", { detail });
  if (["M4A ", "M4B ", "M4P "].includes(major))
    return d(major === "M4B " ? "m4b" : "m4a", "audio/mp4", major === "M4B " ? "MPEG-4 audiobook (M4B)" : "MPEG-4 audio (M4A)", "audio", { detail });
  if (["M4V ", "M4VH", "M4VP"].includes(major)) return d("m4v", "video/x-m4v", "MPEG-4 video (M4V)", "video", { alt: ["mp4"], detail });
  if (/^3g2[a-c]$/.test(major)) return d("3g2", "video/3gpp2", "3GPP2 (3G2)", "video", { detail });
  if (/^3g[gps][0-9]$/.test(major) || /^3gp[0-9]$/.test(major)) return d("3gp", "video/3gpp", "3GPP (3GP)", "video", { detail });
  if (major === "F4V " || major === "F4P ") return d("f4v", "video/x-f4v", "Flash MP4 video (F4V)", "video", { detail });
  if (major === "F4A " || major === "F4B ") return d("f4a", "audio/mp4", "Flash MP4 audio (F4A)", "audio", { detail });
  if (["isom", "iso2", "iso3", "iso4", "iso5", "iso6", "iso7", "iso8", "iso9", "mp41", "mp42", "mp71", "avc1", "dash", "mmp4", "MSNV", "XAVC", "NDAS", "cmfc", "cmf2"].includes(major))
    return d("mp4", "video/mp4", "MPEG-4 Part 14 (MP4)", "video", { detail, alt: ["m4v"] });
  if (major === "jp2 " || major === "jpx ") return d("jp2", "image/jp2", "JPEG 2000", "image", { detail });
  // Unknown brand: an ISO-BMFF container, but we don't pretend it is an MP4 video.
  return d("", "application/octet-stream", "ISO BMFF container", "data", { detail: `unknown brand "${major.trim()}"`, confidence: "low" });
}

/* ───────────── Matroska / WebM ───────────── */

function ebml(b: Uint8Array): Detected {
  // DocType element id 0x4282 followed by a size byte and the ASCII doc type.
  for (let i = 4; i < Math.min(b.length - 3, 128); i++) {
    if (b[i] === 0x42 && b[i + 1] === 0x82) {
      const len = b[i + 2] & 0x7f;
      const type = ascii(b, i + 3, Math.min(len, 16));
      if (type === "webm") return d("webm", "video/webm", "WebM", "video");
      if (type === "matroska") return d("mkv", "video/x-matroska", "Matroska (MKV)", "video", { alt: ["mka", "mk3d"] });
    }
  }
  return d("mkv", "video/x-matroska", "Matroska / EBML", "video", { confidence: "medium" });
}

/* ───────────── Ogg ───────────── */

function ogg(b: Uint8Array): Detected {
  // First page: 27-byte header + segment table; first packet identifies the codec.
  const segs = b[26] ?? 0;
  const p = 27 + segs;
  if (eq(b, p, [0x01, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73])) return d("ogg", "audio/ogg", "Ogg Vorbis", "audio", { alt: ["oga"], detail: "Vorbis" });
  if (ascii(b, p, 8) === "OpusHead") return d("opus", "audio/ogg", "Ogg Opus", "audio", { alt: ["ogg"], detail: "Opus" });
  if (eq(b, p, [0x80, 0x74, 0x68, 0x65, 0x6f, 0x72, 0x61])) return d("ogv", "video/ogg", "Ogg Theora", "video", { detail: "Theora" });
  if (ascii(b, p, 8) === "Speex   ") return d("spx", "audio/ogg", "Ogg Speex", "audio", { detail: "Speex" });
  if (eq(b, p, [0x7f, 0x46, 0x4c, 0x41, 0x43])) return d("oga", "audio/ogg", "Ogg FLAC", "audio", { detail: "FLAC" });
  return d("ogg", "application/ogg", "Ogg", "audio", { confidence: "medium" });
}

/* ───────────── ZIP-based formats ───────────── */

function zipFamily(b: Uint8Array): Detected {
  const head = ascii(b, 0, Math.min(b.length, 8192));
  const firstName = ascii(b, 30, u16le(b, 26));
  if (firstName === "mimetype") {
    const m = ascii(b, 38, 80);
    if (m.startsWith("application/epub+zip")) return d("epub", "application/epub+zip", "EPUB e-book", "document");
    if (m.startsWith("application/vnd.oasis.opendocument.text")) return d("odt", "application/vnd.oasis.opendocument.text", "OpenDocument Text", "document");
    if (m.startsWith("application/vnd.oasis.opendocument.spreadsheet")) return d("ods", "application/vnd.oasis.opendocument.spreadsheet", "OpenDocument Spreadsheet", "document");
    if (m.startsWith("application/vnd.oasis.opendocument.presentation")) return d("odp", "application/vnd.oasis.opendocument.presentation", "OpenDocument Presentation", "document");
  }
  if (head.includes("word/")) return d("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Microsoft Word (DOCX)", "document", { confidence: "medium" });
  if (head.includes("xl/")) return d("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Microsoft Excel (XLSX)", "document", { confidence: "medium" });
  if (head.includes("ppt/")) return d("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "Microsoft PowerPoint (PPTX)", "document", { confidence: "medium" });
  if (head.includes("AndroidManifest.xml")) return d("apk", "application/vnd.android.package-archive", "Android package (APK)", "executable", { confidence: "medium" });
  if (head.includes("META-INF/MANIFEST.MF")) return d("jar", "application/java-archive", "Java archive (JAR)", "executable", { confidence: "medium" });
  return d("zip", "application/zip", "ZIP archive", "archive");
}

/* ───────────── PNG / WebP / GIF animation ───────────── */

function pngAnimated(b: Uint8Array): boolean | undefined {
  let o = 8;
  while (o + 8 <= b.length) {
    const len = u32be(b, o);
    const type = ascii(b, o + 4, 4);
    if (type === "acTL") return true;
    if (type === "IDAT" || type === "IEND") return false;
    o += 12 + len;
  }
  return undefined;
}

/**
 * Count image frames in a GIF (stops at `max`). Returns null when the data ends
 * before the trailer was reached (count is then a lower bound, see `complete`).
 */
export function gifFrameCount(b: Uint8Array, max = Infinity): { frames: number; complete: boolean } {
  if (b.length < 13 || ascii(b, 0, 3) !== "GIF") return { frames: 0, complete: false };
  let o = 13;
  const flags = b[10];
  if (flags & 0x80) o += 3 * (1 << ((flags & 0x07) + 1));
  let frames = 0;
  const skipSubBlocks = () => {
    while (o < b.length) {
      const n = b[o];
      o += 1;
      if (n === 0) return true;
      o += n;
    }
    return false;
  };
  while (o < b.length) {
    const tag = b[o];
    if (tag === 0x3b) return { frames, complete: true };
    if (tag === 0x21) {
      o += 2;
      if (!skipSubBlocks()) break;
    } else if (tag === 0x2c) {
      frames++;
      if (frames >= max) return { frames, complete: false };
      if (o + 10 > b.length) break;
      const lf = b[o + 9];
      o += 10;
      if (lf & 0x80) o += 3 * (1 << ((lf & 0x07) + 1));
      o += 1; // LZW minimum code size
      if (!skipSubBlocks()) break;
    } else {
      break; // corrupt data
    }
  }
  return { frames, complete: false };
}

/* ───────────── text ───────────── */

function looksLikeText(b: Uint8Array): Detected | null {
  if (eq(b, 0, [0xef, 0xbb, 0xbf])) return d("txt", "text/plain", "Text (UTF-8 with BOM)", "text", { confidence: "medium" });
  if (eq(b, 0, [0xff, 0xfe]) || eq(b, 0, [0xfe, 0xff])) return d("txt", "text/plain", "Text (UTF-16)", "text", { confidence: "medium" });
  const n = Math.min(b.length, 4096);
  if (n === 0) return null;
  let control = 0;
  for (let i = 0; i < n; i++) {
    const c = b[i];
    if (c === 0) return null;
    if (c < 9 || (c > 13 && c < 32)) control++;
  }
  if (control / n > 0.02) return null;
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(b.subarray(0, n));
  } catch {
    // may be cut in the middle of a multibyte char or be a legacy 8-bit encoding
    text = ascii(b, 0, n);
  }
  const t = text.trimStart();
  const low = t.slice(0, 512).toLowerCase();
  if (low.startsWith("<svg") || (low.startsWith("<?xml") && low.includes("<svg"))) return d("svg", "image/svg+xml", "SVG", "image", { confidence: "medium" });
  if (low.startsWith("<!doctype html") || low.startsWith("<html")) return d("html", "text/html", "HTML", "text", { confidence: "medium" });
  if (low.startsWith("<?xml")) return d("xml", "application/xml", "XML", "text", { confidence: "medium" });
  if (low.startsWith("begin:vcalendar")) return d("ics", "text/calendar", "iCalendar", "text");
  if (low.startsWith("begin:vcard")) return d("vcf", "text/vcard", "vCard", "text");
  if (low.startsWith("-----begin ")) return d("pem", "application/x-pem-file", "PEM (certificate / key)", "text");
  if (t.startsWith("#!")) return d("sh", "text/x-shellscript", "Script (shebang)", "text", { confidence: "medium" });
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      if (b.length <= n) JSON.parse(text);
      return d("json", "application/json", "JSON", "text", { confidence: b.length <= n ? "medium" : "low" });
    } catch {
      /* not JSON */
    }
  }
  return d("txt", "text/plain", "Plain text", "text", { confidence: "low" });
}

/* ───────────── main table ───────────── */

/** Detect a file type from its first bytes (4–64 KB recommended). */
export function detectBytes(b: Uint8Array): Detected | null {
  if (b.length < 2) return null;
  const a4 = ascii(b, 0, 4);

  // Images
  if (eq(b, 0, [0xff, 0xd8, 0xff])) return d("jpg", "image/jpeg", "JPEG", "image", { alt: ["jpeg", "jfif"] });
  if (eq(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    const anim = pngAnimated(b);
    return anim ? d("png", "image/apng", "APNG (animated PNG)", "image", { alt: ["apng"], animated: true }) : d("png", "image/png", "PNG", "image", { animated: anim === false ? false : undefined });
  }
  if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") {
    const fc = gifFrameCount(b, 2);
    return d("gif", "image/gif", "GIF", "image", { detail: ascii(b, 0, 6), animated: fc.frames >= 2 ? true : fc.complete ? false : undefined });
  }
  if (a4 === "RIFF" && ascii(b, 8, 4) === "WEBP") {
    const chunk = ascii(b, 12, 4);
    const animated = chunk === "VP8X" ? (b[20] & 0x02) !== 0 : false;
    return d("webp", "image/webp", "WebP", "image", { detail: chunk.trim(), animated });
  }
  if (eq(b, 0, [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a]) || eq(b, 0, [0xff, 0x0a]))
    return d("jxl", "image/jxl", "JPEG XL", "image");
  if (eq(b, 0, [0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a])) return d("jp2", "image/jp2", "JPEG 2000", "image", { alt: ["j2k", "jpf"] });
  if (a4 === "8BPS") return d("psd", "image/vnd.adobe.photoshop", b[5] === 2 ? "Photoshop large document (PSB)" : "Photoshop (PSD)", "image");
  if (a4 === "qoif") return d("qoi", "image/qoi", "QOI", "image");
  if (eq(b, 0, [0x76, 0x2f, 0x31, 0x01])) return d("exr", "image/x-exr", "OpenEXR", "image");
  if (ascii(b, 0, 10) === "#?RADIANCE" || ascii(b, 0, 6) === "#?RGBE") return d("hdr", "image/vnd.radiance", "Radiance HDR", "image");
  if (a4 === "DDS ") return d("dds", "image/vnd-ms.dds", "DirectDraw Surface (DDS)", "image");
  if (ascii(b, 0, 15) === "FUJIFILMCCD-RAW") return d("raf", "image/x-fuji-raf", "Fujifilm RAW (RAF)", "image");
  if (eq(b, 0, [0x49, 0x49, 0x2a, 0x00]) || eq(b, 0, [0x4d, 0x4d, 0x00, 0x2a])) {
    if (ascii(b, 8, 2) === "CR") return d("cr2", "image/x-canon-cr2", "Canon RAW 2 (CR2)", "image");
    return d("tif", "image/tiff", "TIFF", "image", { alt: ["tiff", "dng", "nef", "arw"], detail: "TIFF-based (camera RAW formats such as DNG, NEF, ARW use it too)", confidence: "medium" });
  }
  if (eq(b, 0, [0x49, 0x49, 0x52, 0x4f]) || eq(b, 0, [0x49, 0x49, 0x52, 0x53])) return d("orf", "image/x-olympus-orf", "Olympus RAW (ORF)", "image");
  if (eq(b, 0, [0x49, 0x49, 0x55, 0x00])) return d("rw2", "image/x-panasonic-rw2", "Panasonic RAW (RW2)", "image");
  if (eq(b, 0, [0x00, 0x00, 0x01, 0x00]) && b[4] > 0 && b[5] === 0) return d("ico", "image/x-icon", "Windows icon (ICO)", "image", { detail: `${u16le(b, 4)} image(s)` });
  if (eq(b, 0, [0x00, 0x00, 0x02, 0x00]) && b[4] > 0 && b[5] === 0) return d("cur", "image/x-win-bitmap", "Windows cursor (CUR)", "image");
  if (ascii(b, 0, 2) === "BM" && b.length >= 18 && [12, 40, 52, 56, 64, 108, 124].includes(u32le(b, 14))) return d("bmp", "image/bmp", "BMP", "image", { alt: ["dib"] });

  // Containers with sub-detection
  const iso = b.length >= 12 ? isoBmff(b) : null;
  if (iso) return iso;
  if (eq(b, 0, [0x1a, 0x45, 0xdf, 0xa3])) return ebml(b);
  if (a4 === "OggS") return ogg(b);
  if (a4 === "RIFF") {
    const form = ascii(b, 8, 4);
    if (form === "WAVE") return d("wav", "audio/wav", "WAVE audio (WAV)", "audio");
    if (form === "AVI ") return d("avi", "video/x-msvideo", "AVI", "video");
    if (form === "RMID") return d("rmi", "audio/mid", "RIFF MIDI", "audio");
    if (form === "ACON") return d("ani", "application/x-navi-animation", "Animated cursor (ANI)", "image");
    if (form === "CDXA") return d("dat", "video/mpeg", "Video CD (CDXA)", "video");
    return d("riff", "application/octet-stream", `RIFF (${form.trim()})`, "data", { confidence: "low" });
  }
  if (a4 === "RF64") return d("wav", "audio/wav", "RF64 WAVE (large WAV)", "audio");
  if (a4 === "FORM") {
    const form = ascii(b, 8, 4);
    if (form === "AIFF") return d("aiff", "audio/aiff", "AIFF", "audio", { alt: ["aif"] });
    if (form === "AIFC") return d("aifc", "audio/aiff", "AIFF-C", "audio", { alt: ["aif"] });
    if (form === "DJVU" || form === "DJVM") return d("djvu", "image/vnd.djvu", "DjVu", "document");
  }
  if (ascii(b, 0, 8) === "AT&TFORM") return d("djvu", "image/vnd.djvu", "DjVu", "document");

  // Audio
  const id3 = id3Size(b);
  if (id3 > 0) {
    if (id3 + 4 <= b.length) {
      const s = audioStreamAt(b, id3, true);
      if (s) return s;
    }
    return d("mp3", "audio/mpeg", "MP3 (ID3-tagged audio)", "audio", { detail: "ID3v2; stream after the tag not checked", confidence: "medium" });
  }
  if (a4 === "fLaC") return d("flac", "audio/flac", "FLAC", "audio");
  if (a4 === "caff") return d("caf", "audio/x-caf", "Core Audio Format (CAF)", "audio");
  if (a4 === "MThd") return d("mid", "audio/midi", "MIDI", "audio", { alt: ["midi"] });
  if (ascii(b, 0, 9) === "#!AMR-WB\n") return d("awb", "audio/amr-wb", "AMR-WB", "audio");
  if (ascii(b, 0, 6) === "#!AMR\n") return d("amr", "audio/amr", "AMR", "audio");
  if (a4 === "MAC ") return d("ape", "audio/x-ape", "Monkey's Audio (APE)", "audio");
  if (a4 === "wvpk") return d("wv", "audio/x-wavpack", "WavPack", "audio");
  if (a4 === ".snd") return d("au", "audio/basic", "Sun/NeXT audio (AU)", "audio", { alt: ["snd"] });
  if (eq(b, 0, [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9, 0x00, 0xaa, 0x00, 0x62, 0xce, 0x6c]))
    return d("wmv", "video/x-ms-asf", "ASF (WMV / WMA)", "video", { alt: ["wma", "asf"], detail: "Windows Media container" });
  if (eq(b, 0, [0x0b, 0x77])) return d("ac3", "audio/ac3", "Dolby Digital (AC-3)", "audio", { confidence: "medium" });
  if (eq(b, 0, [0x7f, 0xfe, 0x80, 0x01])) return d("dts", "audio/vnd.dts", "DTS", "audio");

  // Video
  if (ascii(b, 0, 3) === "FLV" && b[3] === 1) return d("flv", "video/x-flv", "Flash Video (FLV)", "video");
  if (eq(b, 0, [0x00, 0x00, 0x01, 0xba])) return d("mpg", "video/mpeg", "MPEG program stream", "video", { alt: ["mpeg", "vob"] });
  if (eq(b, 0, [0x00, 0x00, 0x01, 0xb3])) return d("mpg", "video/mpeg", "MPEG video stream", "video", { alt: ["m1v", "m2v"] });
  if (b.length >= 377 && b[0] === 0x47 && b[188] === 0x47 && b[376] === 0x47) return d("ts", "video/mp2t", "MPEG transport stream (TS)", "video", { alt: ["mts", "m2t"] });
  if (b.length >= 197 && b[4] === 0x47 && b[196] === 0x47) return d("m2ts", "video/mp2t", "BDAV MPEG-2 TS (M2TS / MTS)", "video", { alt: ["mts"] });
  if (a4 === ".RMF") return d("rm", "application/vnd.rn-realmedia", "RealMedia", "video", { alt: ["rmvb"] });
  if (["FWS", "CWS", "ZWS"].includes(ascii(b, 0, 3))) return d("swf", "application/x-shockwave-flash", "Flash (SWF)", "executable");

  // Archives
  if (eq(b, 0, [0x50, 0x4b, 0x03, 0x04])) return zipFamily(b);
  if (eq(b, 0, [0x50, 0x4b, 0x05, 0x06])) return d("zip", "application/zip", "ZIP archive (empty)", "archive");
  if (eq(b, 0, [0x50, 0x4b, 0x07, 0x08])) return d("zip", "application/zip", "ZIP archive (spanned)", "archive");
  if (eq(b, 0, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00])) return d("rar", "application/vnd.rar", "RAR archive", "archive", { detail: "RAR 5" });
  if (eq(b, 0, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00])) return d("rar", "application/vnd.rar", "RAR archive", "archive", { detail: "RAR 1.5–4" });
  if (eq(b, 0, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return d("7z", "application/x-7z-compressed", "7-Zip archive", "archive");
  if (eq(b, 0, [0x1f, 0x8b])) return d("gz", "application/gzip", "GZIP", "archive", { alt: ["tgz"] });
  if (ascii(b, 0, 3) === "BZh" && b[3] >= 0x31 && b[3] <= 0x39) return d("bz2", "application/x-bzip2", "BZIP2", "archive");
  if (eq(b, 0, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])) return d("xz", "application/x-xz", "XZ", "archive");
  if (eq(b, 0, [0x28, 0xb5, 0x2f, 0xfd])) return d("zst", "application/zstd", "Zstandard", "archive");
  if (eq(b, 0, [0x04, 0x22, 0x4d, 0x18])) return d("lz4", "application/x-lz4", "LZ4", "archive");
  if (a4 === "MSCF") return d("cab", "application/vnd.ms-cab-compressed", "Microsoft Cabinet (CAB)", "archive");
  if (ascii(b, 257, 5) === "ustar") return d("tar", "application/x-tar", "TAR archive", "archive");
  for (const o of [0x8001, 0x8801, 0x9001]) if (ascii(b, o, 5) === "CD001") return d("iso", "application/x-iso9660-image", "ISO 9660 disc image", "archive");

  // Documents & data
  if (ascii(b, 0, 5) === "%PDF-") return d("pdf", "application/pdf", "PDF", "document", { detail: `version ${ascii(b, 5, 3)}` });
  if (eq(b, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
    return d("doc", "application/x-ole-storage", "Microsoft Office 97–2003 / OLE2", "document", { alt: ["xls", "ppt", "msg", "msi"], detail: "OLE2 compound file", confidence: "medium" });
  if (ascii(b, 0, 5) === "{\\rtf") return d("rtf", "application/rtf", "Rich Text Format (RTF)", "document");
  if (ascii(b, 0, 4) === "%!PS") return d("ps", "application/postscript", "PostScript", "document", { alt: ["eps"] });
  if (ascii(b, 0, 16) === "SQLite format 3\0") return d("sqlite", "application/vnd.sqlite3", "SQLite database", "data", { alt: ["db"] });
  if (ascii(b, 0, 11) === "d8:announce") return d("torrent", "application/x-bittorrent", "BitTorrent file", "data");
  if (eq(b, 0, [0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00])) return d("lnk", "application/x-ms-shortcut", "Windows shortcut (LNK)", "data");

  // Fonts
  if (eq(b, 0, [0x00, 0x01, 0x00, 0x00, 0x00])) return d("ttf", "font/ttf", "TrueType font", "font");
  if (a4 === "OTTO") return d("otf", "font/otf", "OpenType font (CFF)", "font");
  if (a4 === "wOFF") return d("woff", "font/woff", "WOFF font", "font");
  if (a4 === "wOF2") return d("woff2", "font/woff2", "WOFF2 font", "font");
  if (a4 === "ttcf") return d("ttc", "font/collection", "TrueType collection", "font");

  // Executables
  if (ascii(b, 0, 2) === "MZ") {
    const pe = b.length >= 64 ? u32le(b, 60) : 0;
    if (pe > 0 && pe + 24 <= b.length && ascii(b, pe, 4) === "PE\0\0") {
      const characteristics = u16le(b, pe + 22);
      return (characteristics & 0x2000) !== 0
        ? d("dll", "application/vnd.microsoft.portable-executable", "Windows library (DLL)", "executable")
        : d("exe", "application/vnd.microsoft.portable-executable", "Windows program (EXE)", "executable");
    }
    return d("exe", "application/x-msdownload", "DOS/Windows executable", "executable", { confidence: "medium" });
  }
  if (eq(b, 0, [0x7f, 0x45, 0x4c, 0x46])) return d("elf", "application/x-elf", "ELF executable (Linux/Unix)", "executable", { alt: ["so", "o"] });
  if ([0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe].includes(u32be(b, 0))) return d("macho", "application/x-mach-binary", "Mach-O executable (macOS)", "executable");
  if (eq(b, 0, [0xca, 0xfe, 0xba, 0xbe])) {
    // Java class files have a major version ≥ 45 at bytes 6–7; Mach-O fat binaries have a small arch count.
    const second = u32be(b, 4);
    return second < 40
      ? d("macho", "application/x-mach-binary", "Mach-O universal binary (macOS)", "executable")
      : d("class", "application/java-vm", "Java class file", "executable");
  }
  if (eq(b, 0, [0x00, 0x61, 0x73, 0x6d])) return d("wasm", "application/wasm", "WebAssembly module", "executable");
  if (eq(b, 0, [0x64, 0x65, 0x78, 0x0a])) return d("dex", "application/octet-stream", "Android Dalvik executable (DEX)", "executable");

  // Bare audio frames (no ID3): check after all strong signatures to avoid false positives.
  const bare = audioStreamAt(b, 0, false);
  if (bare) {
    // A single matching 2-byte sync is weak evidence; accept it with medium confidence.
    return { ...bare, confidence: "medium" };
  }

  return looksLikeText(b);
}

/** How many bytes `sniffFile` reads first. ISO 9660 needs ~36 KB. */
const SNIFF_BYTES = 40 * 1024;

/**
 * Detect the type of a Blob/File. Reads the head, looks behind ID3 tags and counts
 * GIF frames (reading up to `gifLimit` bytes).
 */
export async function sniffFile(blob: Blob, opts: { gifLimit?: number } = {}): Promise<Detected | null> {
  const head = new Uint8Array(await blob.slice(0, SNIFF_BYTES).arrayBuffer());
  let res = detectBytes(head);
  const tag = id3Size(head);
  if (tag > 0 && tag + 4 > head.length && tag < blob.size) {
    const after = new Uint8Array(await blob.slice(tag, tag + 16).arrayBuffer());
    res = audioStreamAt(after, 0, true) ?? res;
  }
  if (res?.ext === "gif" && res.animated === undefined) {
    const limit = opts.gifLimit ?? 16 * 1024 * 1024;
    const bytes = new Uint8Array(await blob.slice(0, Math.min(blob.size, limit)).arrayBuffer());
    const fc = gifFrameCount(bytes, 2);
    res = { ...res, animated: fc.frames >= 2 ? true : fc.complete ? false : undefined };
  }
  return res;
}

/** Extension of a file name in lower case without the dot ("" if none). */
export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 && i < name.length - 1 ? name.slice(i + 1).toLowerCase() : "";
}

/** Whether a file name's extension agrees with the detected type. */
export function extensionMatches(name: string, det: Detected): boolean {
  const e = extOf(name);
  if (!det.ext) return true;
  if (e === det.ext || det.alt?.includes(e)) return true;
  const synonyms: Record<string, string[]> = {
    jpg: ["jpeg", "jpe", "jfif"],
    tif: ["tiff"],
    mp4: ["m4v", "mp4v"],
    mov: ["qt"],
    mkv: ["mka", "mks"],
    ogg: ["oga", "ogx"],
    opus: ["ogg"],
    aiff: ["aif"],
    mpg: ["mpeg", "mpe", "m1v", "m2v"],
    ts: ["mts", "m2ts", "tsv"],
    m2ts: ["mts", "ts"],
    htm: ["html"],
    html: ["htm"],
    txt: ["text", "log", "md", "csv", "tsv", "ini", "cfg", "conf", "srt", "vtt", "yml", "yaml", "toml", "js", "ts", "css", "py", "java", "c", "cpp", "h", "json", "xml", "svg", "sql"],
  };
  return synonyms[det.ext]?.includes(e) ?? false;
}
