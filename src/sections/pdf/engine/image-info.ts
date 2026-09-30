/**
 * Minimal header readers for JPEG and PNG: pixel size, resolution (DPI) and
 * EXIF orientation. Used to embed images in a PDF without re-encoding while
 * still giving pages the correct physical size and orientation.
 */

export interface ImageInfo {
  format: "jpeg" | "png";
  width: number;
  height: number;
  /** Declared resolution, if the file has one. */
  dpiX: number | null;
  dpiY: number | null;
  /** EXIF orientation 1–8 (JPEG only; 1 when absent). */
  orientation: number;
  /** JPEG colour components (1 gray, 3 RGB/YCbCr, 4 CMYK). */
  components?: number;
  /** PNG with an alpha channel or tRNS chunk. */
  alpha?: boolean;
}

export function sniffImage(b: Uint8Array): "jpeg" | "png" | "gif" | "webp" | "bmp" | "heic" | "avif" | "tiff" | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  if (b[0] === 0x42 && b[1] === 0x4d) return "bmp";
  if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[3] === 0x2a)) return "tiff";
  const ascii = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "webp";
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (brand === "avif" || brand === "avis") return "avif";
    if (/^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(brand)) return "heic";
  }
  return null;
}

const u16be = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];

export function readJpegInfo(b: Uint8Array): ImageInfo | null {
  if (!(b[0] === 0xff && b[1] === 0xd8)) return null;
  let o = 2;
  let width = 0;
  let height = 0;
  let components = 3;
  let jfif: { x: number; y: number } | null = null;
  let exif: { x: number | null; y: number | null; orientation: number } | null = null;
  while (o + 4 <= b.length) {
    if (b[o] !== 0xff) {
      o++;
      continue;
    }
    const marker = b[o + 1];
    if (marker === 0xff) {
      o++;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      o += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const len = u16be(b, o + 2);
    const seg = o + 4;
    if (marker === 0xe0 && len >= 14 && b[seg] === 0x4a && b[seg + 1] === 0x46 && b[seg + 2] === 0x49 && b[seg + 3] === 0x46 && b[seg + 4] === 0) {
      const units = b[seg + 7];
      const dx = u16be(b, seg + 8);
      const dy = u16be(b, seg + 10);
      if (units === 1 && dx && dy) jfif = { x: dx, y: dy };
      else if (units === 2 && dx && dy) jfif = { x: dx * 2.54, y: dy * 2.54 };
    } else if (marker === 0xe1 && len >= 16 && b[seg] === 0x45 && b[seg + 1] === 0x78 && b[seg + 2] === 0x69 && b[seg + 3] === 0x66) {
      exif = readExif(b.subarray(seg + 6, o + 2 + len));
    } else if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      height = u16be(b, seg + 1);
      width = u16be(b, seg + 3);
      components = b[seg + 5];
    }
    o += 2 + len;
  }
  if (!width || !height) return null;
  const dpiX = jfif?.x ?? exif?.x ?? null;
  const dpiY = jfif?.y ?? exif?.y ?? null;
  return { format: "jpeg", width, height, dpiX, dpiY, orientation: exif?.orientation ?? 1, components };
}

/** Parse the TIFF structure inside an APP1 Exif segment (IFD0 only). */
function readExif(t: Uint8Array): { x: number | null; y: number | null; orientation: number } | null {
  if (t.length < 8) return null;
  const le = t[0] === 0x49 && t[1] === 0x49;
  if (!le && !(t[0] === 0x4d && t[1] === 0x4d)) return null;
  const u16 = (o: number) => (le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]);
  const u32 = (o: number) => (le ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16)) + t[o + 3] * 0x1000000 : t[o] * 0x1000000 + ((t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3]));
  const ifd = u32(4);
  if (ifd + 2 > t.length) return null;
  const count = u16(ifd);
  let orientation = 1;
  let xres: number | null = null;
  let yres: number | null = null;
  let unit = 2;
  const rational = (off: number) => (off + 8 <= t.length && u32(off + 4) ? u32(off) / u32(off + 4) : null);
  for (let i = 0; i < count; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > t.length) break;
    const tag = u16(e);
    if (tag === 0x0112) orientation = u16(e + 8);
    else if (tag === 0x011a) xres = rational(u32(e + 8));
    else if (tag === 0x011b) yres = rational(u32(e + 8));
    else if (tag === 0x0128) unit = u16(e + 8);
  }
  if (orientation < 1 || orientation > 8) orientation = 1;
  const k = unit === 3 ? 2.54 : unit === 2 ? 1 : 0;
  return { x: xres && k ? xres * k : null, y: yres && k ? yres * k : null, orientation };
}

export function readPngInfo(b: Uint8Array): ImageInfo | null {
  if (!(b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)) return null;
  let o = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  let alpha = false;
  let dpiX: number | null = null;
  let dpiY: number | null = null;
  while (o + 8 <= b.length) {
    const len = u32be(b, o);
    const type = String.fromCharCode(b[o + 4], b[o + 5], b[o + 6], b[o + 7]);
    const d = o + 8;
    if (type === "IHDR") {
      width = u32be(b, d);
      height = u32be(b, d + 4);
      colorType = b[d + 9];
      alpha = colorType === 4 || colorType === 6;
    } else if (type === "pHYs" && b[d + 8] === 1) {
      dpiX = u32be(b, d) * 0.0254;
      dpiY = u32be(b, d + 4) * 0.0254;
    } else if (type === "tRNS") {
      alpha = true;
    } else if (type === "IDAT" || type === "IEND") {
      break;
    }
    o = d + len + 4;
  }
  if (!width || !height) return null;
  return { format: "png", width, height, dpiX, dpiY, orientation: 1, alpha };
}

export function readImageInfo(b: Uint8Array): ImageInfo | null {
  return readJpegInfo(b) ?? readPngInfo(b);
}
