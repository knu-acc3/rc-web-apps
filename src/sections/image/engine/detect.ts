/**
 * Image format detection from file bytes (magic numbers) — never trust the
 * extension or the declared MIME type.
 */

export type SniffedFormat = "jpg" | "png" | "gif" | "webp" | "avif" | "heic" | "bmp" | "ico" | "cur" | "tiff" | "svg" | "jxl" | "psd" | "pdf";

export interface FormatMeta {
  mime: string;
  ext: string;
  label: string;
}

export const FORMAT_META: Record<SniffedFormat, FormatMeta> = {
  jpg: { mime: "image/jpeg", ext: "jpg", label: "JPEG" },
  png: { mime: "image/png", ext: "png", label: "PNG" },
  gif: { mime: "image/gif", ext: "gif", label: "GIF" },
  webp: { mime: "image/webp", ext: "webp", label: "WebP" },
  avif: { mime: "image/avif", ext: "avif", label: "AVIF" },
  heic: { mime: "image/heic", ext: "heic", label: "HEIC" },
  bmp: { mime: "image/bmp", ext: "bmp", label: "BMP" },
  ico: { mime: "image/x-icon", ext: "ico", label: "ICO" },
  cur: { mime: "image/x-icon", ext: "cur", label: "CUR" },
  tiff: { mime: "image/tiff", ext: "tiff", label: "TIFF" },
  svg: { mime: "image/svg+xml", ext: "svg", label: "SVG" },
  jxl: { mime: "image/jxl", ext: "jxl", label: "JPEG XL" },
  psd: { mime: "image/vnd.adobe.photoshop", ext: "psd", label: "PSD" },
  pdf: { mime: "application/pdf", ext: "pdf", label: "PDF" },
};

const ascii = (b: Uint8Array, off: number, len: number) => {
  let s = "";
  for (let i = 0; i < len && off + i < b.length; i++) s += String.fromCharCode(b[off + i]);
  return s;
};

const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs"]);

/** Brands of an ISO-BMFF `ftyp` box (major + compatible). */
function ftypBrands(b: Uint8Array): string[] | null {
  if (b.length < 16 || ascii(b, 4, 4) !== "ftyp") return null;
  const size = u32be(b, 0);
  const end = Math.min(b.length, size >= 16 ? size : 16);
  const out = [ascii(b, 8, 4)];
  for (let o = 16; o + 4 <= end; o += 4) out.push(ascii(b, o, 4));
  return out;
}

/**
 * Detect the image format from the first bytes of a file (at least 64 bytes
 * recommended; 1 KB lets SVG detection skip long XML prologs).
 */
export function detectFormat(b: Uint8Array): SniffedFormat | null {
  if (b.length < 4) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG" && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  const head6 = ascii(b, 0, 6);
  if (head6 === "GIF87a" || head6 === "GIF89a") return "gif";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "webp";
  const brands = ftypBrands(b);
  if (brands) {
    if (brands.includes("avif") || brands.includes("avis")) return "avif";
    if (brands.some((x) => HEIC_BRANDS.has(x))) return "heic";
    if (brands.includes("mif1") || brands.includes("msf1")) return "heic";
  }
  if (b[0] === 0x42 && b[1] === 0x4d && b.length >= 26) return "bmp";
  if (b[0] === 0 && b[1] === 0 && (b[2] === 1 || b[2] === 2) && b[3] === 0 && b.length >= 6 && (b[4] | (b[5] << 8)) > 0) return b[2] === 1 ? "ico" : "cur";
  if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 0x2a)) return "tiff";
  if ((b[0] === 0xff && b[1] === 0x0a) || (u32be(b, 0) === 0x0c && ascii(b, 4, 4) === "JXL ")) return "jxl";
  if (ascii(b, 0, 4) === "8BPS") return "psd";
  if (ascii(b, 0, 5) === "%PDF-") return "pdf";
  if (looksLikeSvg(b)) return "svg";
  return null;
}

function looksLikeSvg(b: Uint8Array): boolean {
  let start = 0;
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) start = 3; // UTF-8 BOM
  const text = ascii(b, start, Math.min(b.length - start, 4096));
  const t = text.trimStart();
  if (!t.startsWith("<")) return false;
  return /<svg[\s>]/i.test(t);
}

/* ───────────── animation checks ───────────── */

/** Number of frames in a GIF (walks the block structure, no decoding). */
export function countGifFrames(b: Uint8Array, stopAt = Infinity): number {
  if (b.length < 13 || ascii(b, 0, 3) !== "GIF") return 0;
  let p = 13;
  const flags = b[10];
  if (flags & 0x80) p += 3 * (1 << ((flags & 7) + 1));
  let frames = 0;
  while (p < b.length) {
    const block = b[p++];
    if (block === 0x3b) break; // trailer
    if (block === 0x21) {
      p++; // label
      while (p < b.length && b[p] !== 0) p += b[p] + 1;
      p++;
    } else if (block === 0x2c) {
      frames++;
      if (frames >= stopAt) return frames;
      const f = b[p + 8];
      p += 9;
      if (f & 0x80) p += 3 * (1 << ((f & 7) + 1));
      p++; // LZW min code size
      while (p < b.length && b[p] !== 0) p += b[p] + 1;
      p++;
    } else break;
  }
  return frames;
}

/** True when a WebP file is animated (VP8X animation flag or ANIM chunk). */
export function isAnimatedWebp(b: Uint8Array): boolean {
  if (ascii(b, 0, 4) !== "RIFF" || ascii(b, 8, 4) !== "WEBP") return false;
  let p = 12;
  while (p + 8 <= b.length) {
    const type = ascii(b, p, 4);
    const size = b[p + 4] | (b[p + 5] << 8) | (b[p + 6] << 16) | (b[p + 7] << 24);
    if (type === "VP8X" && b[p + 8] & 0x02) return true;
    if (type === "ANIM" || type === "ANMF") return true;
    if (type === "VP8 " || type === "VP8L") return false;
    p += 8 + size + (size & 1);
  }
  return false;
}

/** True for APNG (animated PNG): an acTL chunk before the first IDAT. */
export function isApng(b: Uint8Array): boolean {
  let p = 8;
  while (p + 8 <= b.length) {
    const len = u32be(b, p);
    const type = ascii(b, p + 4, 4);
    if (type === "acTL") return true;
    if (type === "IDAT") return false;
    p += 12 + len;
  }
  return false;
}

/** Whether an image file is animated (GIF with >1 frame, animated WebP, APNG, AVIF sequence). */
export function isAnimated(b: Uint8Array, format: SniffedFormat | null): boolean {
  if (format === "gif") return countGifFrames(b, 2) > 1;
  if (format === "webp") return isAnimatedWebp(b);
  if (format === "png") return isApng(b);
  if (format === "avif") return (ftypBrands(b) ?? []).includes("avis");
  return false;
}

/** Formats this section can decode (with the help of lazy decoders). */
export const DECODABLE = new Set<SniffedFormat>(["jpg", "png", "gif", "webp", "avif", "heic", "bmp", "ico", "cur", "tiff", "svg"]);

/** `accept` attribute for image inputs (HEIC/TIFF often have no MIME on Windows). */
export const IMAGE_ACCEPT = "image/*,.heic,.heif,.avif,.tif,.tiff,.jfif,.pjpeg,.pjp,.ico,.cur,.bmp,.svg,.webp";
