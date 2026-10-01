import { describe, expect, it } from "vitest";
import { GIFEncoder } from "gifenc";
import { countGifFrames, detectFormat, isAnimatedWebp, isApng } from "@/tools/files/image/lib/detect";
import { applyAspect, centeredAspectRect, dragHandle, largestInscribed, mmToPx, planResize, rotatedBounds } from "@/tools/files/image/lib/geometry";
import { fitToSize, nextScale, searchQuality } from "@/tools/files/image/lib/target-size";
import {
  composeOrientation,
  extractExifSegment,
  insertExifSegment,
  opsToOrientation,
  orientationToOps,
  parseJpeg,
  readExifOrientation,
  readJfifDensity,
  setExifOrientation,
  setJpegDpi,
  stripJpegMetadata,
  transformJpegLossless,
} from "@/tools/files/image/lib/jpeg";
import {
  crc32,
  makePngChunk,
  pngChunks,
  readIcoDirectory,
  readPngDpi,
  setPngDpi,
  stripPngMetadata,
  stripWebpMetadata,
  writeIco,
} from "@/tools/files/image/lib/container";
import { decodeGifFrames, gifInfo, lzwDecode } from "@/tools/files/image/lib/gif-decode";
import { medianCut, normalizeHex, rgbToHex, rgbToHsl } from "@/tools/files/image/lib/palette";
import { applyFilter, gaussianBlur } from "@/tools/files/image/lib/filters";

const bytes = (...xs: (number | string)[]) => {
  const out: number[] = [];
  for (const x of xs) {
    if (typeof x === "number") out.push(x);
    else for (const ch of x) out.push(ch.charCodeAt(0));
  }
  return new Uint8Array(out);
};
const cat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const seg = (marker: number, payload: Uint8Array) => cat(bytes(0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 255), payload);

/* ───────────── detection ───────────── */

describe("detectFormat (magic bytes)", () => {
  const cases: [string, Uint8Array, string | null][] = [
    ["jpeg", bytes(0xff, 0xd8, 0xff, 0xe0, 0, 16), "jpg"],
    ["png", bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13), "png"],
    ["gif89a", bytes("GIF89a", 1, 0, 1, 0), "gif"],
    ["gif87a", bytes("GIF87a", 1, 0, 1, 0), "gif"],
    ["webp", bytes("RIFF", 0, 0, 0, 0, "WEBPVP8 "), "webp"],
    ["avif", bytes(0, 0, 0, 0x1c, "ftypavif", 0, 0, 0, 0, "mif1miaf"), "avif"],
    ["avif via compatible brand", bytes(0, 0, 0, 0x20, "ftypmif1", 0, 0, 0, 0, "mif1avifmiaf"), "avif"],
    ["heic", bytes(0, 0, 0, 0x18, "ftypheic", 0, 0, 0, 0, "mif1heic"), "heic"],
    ["heif mif1", bytes(0, 0, 0, 0x14, "ftypmif1", 0, 0, 0, 0, "mif1"), "heic"],
    ["bmp", cat(bytes("BM"), new Uint8Array(30)), "bmp"],
    ["ico", bytes(0, 0, 1, 0, 1, 0, 16, 16), "ico"],
    ["cur", bytes(0, 0, 2, 0, 1, 0, 16, 16), "cur"],
    ["tiff LE", bytes("II", 0x2a, 0, 8, 0, 0, 0), "tiff"],
    ["tiff BE", bytes("MM", 0, 0x2a, 0, 0, 0, 8), "tiff"],
    ["svg", bytes('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>'), "svg"],
    ["svg with BOM", bytes(0xef, 0xbb, 0xbf, "<svg width='1'/>"), "svg"],
    ["pdf", bytes("%PDF-1.7"), "pdf"],
    ["jxl", bytes(0xff, 0x0a, 0, 0), "jxl"],
    ["text is not an image", bytes("hello world"), null],
    ["html is not svg", bytes("<html><body></body></html>"), null],
  ];
  for (const [name, b, want] of cases) it(name, () => expect(detectFormat(b)).toBe(want));

  it("an image renamed to .png is detected by content", () => {
    // JPEG bytes regardless of name/MIME
    expect(detectFormat(bytes(0xff, 0xd8, 0xff, 0xdb, 0, 67))).toBe("jpg");
  });
});

function gifFixture(frames: number, w = 4, h = 3): Uint8Array {
  const gif = GIFEncoder();
  const palette = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 255],
  ];
  for (let f = 0; f < frames; f++) {
    const index = new Uint8Array(w * h).map((_, i) => (i + f) % 4);
    gif.writeFrame(index, w, h, { palette, delay: 100 * (f + 1) });
  }
  gif.finish();
  return gif.bytes();
}

describe("animation detection", () => {
  it("counts GIF frames", () => {
    expect(countGifFrames(gifFixture(1))).toBe(1);
    expect(countGifFrames(gifFixture(3))).toBe(3);
  });
  it("detects animated WebP via VP8X flag", () => {
    const vp8x = bytes("VP8X", 10, 0, 0, 0, 0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(isAnimatedWebp(cat(bytes("RIFF", 0, 0, 0, 0, "WEBP"), vp8x))).toBe(true);
    const still = bytes("VP8X", 10, 0, 0, 0, 0x10, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(isAnimatedWebp(cat(bytes("RIFF", 0, 0, 0, 0, "WEBP"), still, bytes("VP8 ", 0, 0, 0, 0)))).toBe(false);
  });
  it("detects APNG (acTL before IDAT)", () => {
    const sig = bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a);
    const ihdr = makePngChunk("IHDR", new Uint8Array(13));
    expect(isApng(cat(sig, ihdr, makePngChunk("acTL", new Uint8Array(8)), makePngChunk("IDAT", new Uint8Array(2))))).toBe(true);
    expect(isApng(cat(sig, ihdr, makePngChunk("IDAT", new Uint8Array(2))))).toBe(false);
  });
});

/* ───────────── resize math ───────────── */

describe("planResize", () => {
  it("keeps the aspect ratio when only the width is given", () => {
    const p = planResize(4000, 3000, { mode: "box", width: 800 });
    expect([p.w, p.h]).toEqual([800, 600]);
  });
  it("keeps the aspect ratio when only the height is given", () => {
    const p = planResize(4000, 3000, { mode: "box", height: 300 });
    expect([p.w, p.h]).toEqual([400, 300]);
  });
  it("never upscales by default (max width bug)", () => {
    const p = planResize(640, 480, { mode: "box", width: 1920 });
    expect([p.w, p.h, p.limited, p.changed]).toEqual([640, 480, true, false]);
  });
  it("upscales only when allowed", () => {
    const p = planResize(640, 480, { mode: "box", width: 1920, allowUpscale: true });
    expect([p.w, p.h]).toEqual([1920, 1440]);
  });
  it("contain fits inside the box", () => {
    const p = planResize(3000, 2000, { mode: "box", width: 1000, height: 1000, fit: "contain" });
    expect([p.w, p.h]).toEqual([1000, 667]);
  });
  it("cover fills the box exactly and crops the centre", () => {
    const p = planResize(4000, 3000, { mode: "box", width: 1080, height: 1080, fit: "cover" });
    expect([p.w, p.h]).toEqual([1080, 1080]);
    expect(p.sw).toBe(3000);
    expect(p.sh).toBe(3000);
    expect(p.sx).toBe(500);
    expect(p.sy).toBe(0);
  });
  it("cover without upscaling keeps the target aspect at source resolution", () => {
    const p = planResize(800, 600, { mode: "box", width: 1080, height: 1920, fit: "cover" });
    expect(p.limited).toBe(true);
    expect(p.h).toBe(600);
    expect(p.w).toBe(338); // 1080/1920 × 600
    expect(p.w / p.h).toBeCloseTo(1080 / 1920, 2);
  });
  it("pad keeps the exact canvas and centres the image", () => {
    const p = planResize(2000, 1000, { mode: "box", width: 1000, height: 1000, fit: "pad" });
    expect([p.w, p.h, p.dw, p.dh, p.dx, p.dy]).toEqual([1000, 1000, 1000, 500, 0, 250]);
  });
  it("stretch ignores the aspect ratio", () => {
    const p = planResize(2000, 1000, { mode: "box", width: 500, height: 500, fit: "stretch" });
    expect([p.w, p.h]).toEqual([500, 500]);
  });
  it("percent and long side", () => {
    expect(planResize(4000, 3000, { mode: "percent", percent: 25 })).toMatchObject({ w: 1000, h: 750 });
    expect(planResize(3000, 4000, { mode: "long", long: 2000 })).toMatchObject({ w: 1500, h: 2000 });
    expect(planResize(300, 400, { mode: "long", long: 2000 })).toMatchObject({ w: 300, h: 400, limited: true });
  });
  it("converts millimetres at 300 dpi", () => {
    expect([mmToPx(35, 300), mmToPx(45, 300)]).toEqual([413, 531]);
    expect([mmToPx(30, 300), mmToPx(40, 300)]).toEqual([354, 472]);
    expect([mmToPx(210, 300), mmToPx(297, 300)]).toEqual([2480, 3508]);
  });
});

describe("crop geometry", () => {
  it("centred aspect rect", () => {
    expect(centeredAspectRect(4000, 3000, 1)).toEqual({ x: 500, y: 0, w: 3000, h: 3000 });
    expect(centeredAspectRect(1000, 1000, 16 / 9)).toEqual({ x: 0, y: 218.75, w: 1000, h: 562.5 });
  });
  it("corner drag keeps the aspect exactly even when pushed past the edge", () => {
    const r = dragHandle({ x: 100, y: 100, w: 400, h: 300 }, "se", 5000, 5000, 1000, 800, 4 / 3);
    expect(r.w / r.h).toBeCloseTo(4 / 3, 9);
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
    expect(r.x + r.w).toBeLessThanOrEqual(1000 + 1e-9);
    expect(r.y + r.h).toBeLessThanOrEqual(800 + 1e-9);
  });
  it("north-west drag anchors the south-east corner", () => {
    const r = dragHandle({ x: 200, y: 200, w: 300, h: 300 }, "nw", -1000, -50, 1000, 800, 1);
    expect(r.x + r.w).toBeCloseTo(500);
    expect(r.y + r.h).toBeCloseTo(500);
    expect(r.w).toBeCloseTo(r.h);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
  });
  it("side drag with aspect grows around the centre and stays inside", () => {
    const r = dragHandle({ x: 400, y: 350, w: 160, h: 90 }, "e", 2000, 0, 1000, 800, 16 / 9);
    expect(r.w / r.h).toBeCloseTo(16 / 9, 9);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.y + r.h).toBeLessThanOrEqual(800 + 1e-9);
    expect(r.x + r.w).toBeLessThanOrEqual(1000 + 1e-9);
  });
  it("free drag clamps at the image edge", () => {
    const r = dragHandle({ x: 10, y: 10, w: 100, h: 100 }, "w", -500, 0, 1000, 800, null);
    expect(r).toEqual({ x: 0, y: 10, w: 110, h: 100 });
  });
  it("applyAspect keeps the area centre", () => {
    const r = applyAspect({ x: 0, y: 0, w: 1000, h: 1000 }, 16 / 9, 1000, 1000);
    expect(r.w / r.h).toBeCloseTo(16 / 9, 6);
    expect(r.w).toBeLessThanOrEqual(1000);
  });
});

describe("rotation geometry", () => {
  it("rotated bounds", () => {
    const b = rotatedBounds(100, 50, 90);
    expect(b.w).toBeCloseTo(50);
    expect(b.h).toBeCloseTo(100);
  });
  it("largest inscribed rectangle", () => {
    const sq = largestInscribed(100, 100, 45);
    expect(sq.w).toBeCloseTo(70.7107, 3);
    expect(sq.h).toBeCloseTo(70.7107, 3);
    const none = largestInscribed(400, 300, 0);
    expect(none.w).toBeCloseTo(400);
    expect(none.h).toBeCloseTo(300);
    const small = largestInscribed(400, 300, 5);
    expect(small.w).toBeLessThan(400);
    expect(small.h).toBeLessThan(300);
    // the rectangle's corners must lie inside the rotated source
    const a = (5 * Math.PI) / 180;
    for (const [sx, sy] of [
      [1, 1],
      [-1, 1],
    ]) {
      const x = (sx * small.w) / 2;
      const y = (sy * small.h) / 2;
      const u = x * Math.cos(a) + y * Math.sin(a);
      const v = -x * Math.sin(a) + y * Math.cos(a);
      expect(Math.abs(u)).toBeLessThanOrEqual(200 + 1e-6);
      expect(Math.abs(v)).toBeLessThanOrEqual(150 + 1e-6);
    }
  });
});

/* ───────────── target size ───────────── */

describe("target-size search", () => {
  // monotonic synthetic encoder: size grows with quality and pixel count
  const model = (scale: number, q: number) => Math.round(200_000 * scale * scale * (0.2 + (q / 100) ** 2));

  it("finds the highest quality that fits", async () => {
    const target = 100_000;
    const res = await searchQuality(async (q) => ({ size: model(1, q), value: q }), target, { min: 5, max: 92 });
    expect(res.fits).toBe(true);
    expect(model(1, res.quality)).toBeLessThanOrEqual(target);
    expect(model(1, res.quality + 1)).toBeGreaterThan(target);
    expect(res.tries).toBeLessThanOrEqual(9);
  });
  it("returns max quality immediately when it already fits", async () => {
    const res = await searchQuality(async (q) => ({ size: 10, value: q }), 1000);
    expect(res).toMatchObject({ quality: 92, fits: true, tries: 1 });
  });
  it("reports failure when even the minimum is too big", async () => {
    const res = await searchQuality(async (q) => ({ size: 5000 + q, value: q }), 1000, { min: 10, max: 90 });
    expect(res).toMatchObject({ quality: 10, fits: false, tries: 2 });
  });
  it("downscales when quality alone is not enough and never exceeds the target", async () => {
    const target = 20_000;
    const res = await fitToSize(async (s, q) => ({ size: model(s, q), value: [s, q] }), target, {});
    expect(res.fits).toBe(true);
    expect(res.scale).toBeLessThan(1);
    expect(res.result.size).toBeLessThanOrEqual(target);
  });
  it("nextScale shrinks proportionally to √(target/size)", () => {
    expect(nextScale(1, 400_000, 100_000)).toBeCloseTo(0.46, 2);
    expect(nextScale(1, 101_000, 100_000)).toBeCloseTo(0.9, 5);
  });
});

/* ───────────── JPEG surgery ───────────── */

function tiffIfd(entries: [number, number, number, number][], le = true): Uint8Array {
  // TIFF header + IFD0 with SHORT/LONG inline values
  const n = entries.length;
  const b = new Uint8Array(8 + 2 + n * 12 + 4);
  const dv = new DataView(b.buffer);
  b.set(le ? bytes("II", 0x2a, 0) : bytes("MM", 0, 0x2a));
  dv.setUint32(4, 8, le);
  dv.setUint16(8, n, le);
  entries.forEach(([tag, type, count, value], i) => {
    const o = 10 + i * 12;
    dv.setUint16(o, tag, le);
    dv.setUint16(o + 2, type, le);
    dv.setUint32(o + 4, count, le);
    if (type === 3) dv.setUint16(o + 8, value, le);
    else dv.setUint32(o + 8, value, le);
  });
  return b;
}

const JFIF = seg(0xe0, bytes("JFIF", 0, 1, 1, 0, 0, 1, 0, 1, 0, 0));
const ICC = seg(0xe2, bytes("ICC_PROFILE", 0, 1, 1, "fakeprofile"));
const XMP = seg(0xe1, bytes("http://ns.adobe.com/xap/1.0/", 0, "<x:xmpmeta/>"));
const IPTC = seg(0xed, bytes("Photoshop 3.0", 0, "8BIM"));
const COMMENT = seg(0xfe, bytes("secret comment"));
const DQT = seg(0xdb, cat(bytes(0), new Uint8Array(64).fill(1)));
const SOF = seg(0xc0, bytes(8, 0, 1, 0, 1, 1, 1, 0x11, 0));
const SOS_HDR = seg(0xda, bytes(1, 1, 0, 0, 63, 0));
// entropy data with byte stuffing (FF 00) and a restart marker (FF D0)
const SCAN = bytes(0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56, 0x78);
const EOI = bytes(0xff, 0xd9);

function jpegFixture(exif: Uint8Array | null, extra: Uint8Array[] = [], trailer = new Uint8Array(0)) {
  return cat(
    bytes(0xff, 0xd8),
    JFIF,
    ...(exif ? [seg(0xe1, cat(bytes("Exif", 0, 0), exif))] : []),
    ICC,
    XMP,
    IPTC,
    COMMENT,
    ...extra,
    DQT,
    SOF,
    SOS_HDR,
    SCAN,
    EOI,
    trailer,
  );
}

const indexOfSeq = (hay: Uint8Array, needle: Uint8Array) => {
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
};

describe("JPEG metadata (lossless)", () => {
  const exif = tiffIfd([
    [0x010f, 2, 4, 0x00414243], // Make (inline)
    [0x0112, 3, 1, 6], // Orientation = 6
  ]);

  it("parses segments through stuffed entropy data up to EOI", () => {
    const f = jpegFixture(exif);
    const { segments, eoiEnd } = parseJpeg(f);
    expect(segments.map((s) => s.marker.toString(16))).toEqual(["e0", "e1", "e2", "e1", "ed", "fe", "db", "c0", "da", "d9"]);
    expect(eoiEnd).toBe(f.length);
  });

  it("keeps the photo upright: orientation survives stripping as a minimal EXIF block", () => {
    const f = jpegFixture(exif); // orientation 6 + Make
    const { bytes: out } = stripJpegMetadata(f);
    expect(readExifOrientation(out)).toBe(6);
    expect(indexOfSeq(out, bytes(0x43, 0x42, 0x41))).toBe(-1); // Make is gone
    expect(extractExifSegment(out)!.length).toBeLessThan(40);
  });

  it("strips APP1 (EXIF/XMP), APP13, comments and trailers; keeps JFIF, ICC and image data", () => {
    const trailer = bytes(0xff, 0xd8, 0xff, 0xe1, 0, 4, 1, 2); // e.g. an MPF secondary image
    const exif = tiffIfd([
      [0x010f, 2, 4, 0x00414243],
      [0x0112, 3, 1, 1],
    ]);
    const f = jpegFixture(exif, [], trailer);
    const { bytes: out, report } = stripJpegMetadata(f);
    expect(report.removed.sort()).toEqual(["COM", "EXIF", "IPTC", "XMP", "trailer"].sort());
    const markers = parseJpeg(out).segments.map((s) => s.marker.toString(16));
    expect(markers).toEqual(["e0", "e2", "db", "c0", "da", "d9"]);
    expect(indexOfSeq(out, ICC)).toBeGreaterThan(0);
    expect(indexOfSeq(out, cat(SOS_HDR, SCAN, EOI))).toBe(out.length - SOS_HDR.length - SCAN.length - EOI.length);
    expect(indexOfSeq(out, bytes("secret"))).toBe(-1);
    expect(out.length).toBe(f.length - seg(0xe1, cat(bytes("Exif", 0, 0), exif)).length - XMP.length - IPTC.length - COMMENT.length - trailer.length);
  });

  it("reads and patches an existing orientation in place", () => {
    const f = jpegFixture(exif);
    expect(readExifOrientation(f)).toBe(6);
    const g = setExifOrientation(f, 3);
    expect(g.length).toBe(f.length);
    expect(readExifOrientation(g)).toBe(3);
  });

  it("adds an orientation tag to an EXIF block that has none (IFD0 rewritten, Make kept)", () => {
    const noOrient = tiffIfd([[0x010f, 2, 4, 0x00414243]]);
    const f = jpegFixture(noOrient);
    expect(readExifOrientation(f)).toBe(1);
    const g = setExifOrientation(f, 8);
    expect(readExifOrientation(g)).toBe(8);
    expect(indexOfSeq(g, cat(SOS_HDR, SCAN, EOI))).toBeGreaterThan(0);
    const seg2 = extractExifSegment(g)!;
    expect(indexOfSeq(seg2, bytes(0x0f, 0x01, 2, 0, 4, 0, 0, 0, 0x43, 0x42, 0x41, 0))).toBeGreaterThan(0);
  });

  it("inserts a minimal EXIF block when there is none", () => {
    const f = jpegFixture(null);
    const g = setExifOrientation(f, 6);
    expect(readExifOrientation(g)).toBe(6);
    expect(parseJpeg(g).segments[0].marker).toBe(0xe0);
    expect(parseJpeg(g).segments[1].marker).toBe(0xe1);
  });

  it("big-endian EXIF works too", () => {
    const f = jpegFixture(tiffIfd([[0x0112, 3, 1, 8]], false));
    expect(readExifOrientation(f)).toBe(8);
    expect(readExifOrientation(setExifOrientation(f, 2))).toBe(2);
  });

  it("sets JFIF density (DPI) without touching the scan", () => {
    const f = jpegFixture(exif);
    const g = setJpegDpi(f, 300);
    expect(readJfifDensity(g)).toEqual({ unit: "dpi", x: 300, y: 300 });
    expect(g.length).toBe(f.length);
    const noJfif = cat(bytes(0xff, 0xd8), DQT, SOF, SOS_HDR, SCAN, EOI);
    const h = setJpegDpi(noJfif, 72);
    expect(readJfifDensity(h)).toEqual({ unit: "dpi", x: 72, y: 72 });
  });

  it("insertExifSegment copies EXIF into a new JPEG with orientation reset", () => {
    const src = jpegFixture(exif);
    const s = extractExifSegment(src)!;
    const fresh = cat(bytes(0xff, 0xd8), JFIF, DQT, SOF, SOS_HDR, SCAN, EOI);
    const out = insertExifSegment(fresh, s);
    expect(readExifOrientation(out)).toBe(1);
    expect(parseJpeg(out).segments.map((x) => x.marker)).toContain(0xe1);
  });
});

describe("EXIF orientation algebra", () => {
  // apply (flip, then rotate CW k×90) to a point in centred coords
  const apply = (o: number, [x, y]: [number, number]): [number, number] => {
    const { flip, rot } = orientationToOps(o);
    let p: [number, number] = flip ? [-x, y] : [x, y];
    for (let i = 0; i < rot; i++) p = [-p[1], p[0]];
    return p;
  };
  const P: [number, number] = [2, 1];

  it("round-trips all 8 values", () => {
    for (let o = 1; o <= 8; o++) {
      const { flip, rot } = orientationToOps(o);
      expect(opsToOrientation(flip, rot)).toBe(o);
    }
  });
  it("matches the EXIF definitions (6 = 90° CW, 5 = transpose, 7 = transverse)", () => {
    expect(apply(6, [1, 0])).toEqual([-0, 1]);
    expect(apply(5, P)).toEqual([1, 2]); // transpose (x,y) → (y,x)
    expect(apply(7, P)).toEqual([-1, -2]); // transverse
    expect(apply(3, P)).toEqual([-2, -1]);
  });
  it("composition equals applying the transforms in sequence", () => {
    for (let o = 1; o <= 8; o++)
      for (const flip of [false, true])
        for (let k = 0; k < 4; k++) {
          const composed = composeOrientation(o, flip, k);
          let q = apply(o, P);
          if (flip) q = [-q[0], q[1]];
          for (let i = 0; i < k; i++) q = [-q[1], q[0]];
          const r = apply(composed, P);
          expect([r[0] + 0, r[1] + 0]).toEqual([q[0] + 0, q[1] + 0]);
        }
  });
  it("lossless rotate of a JPEG only changes the flag", () => {
    const f = jpegFixture(tiffIfd([[0x0112, 3, 1, 1]]));
    const r90 = transformJpegLossless(f, false, 1);
    expect(readExifOrientation(r90)).toBe(6);
    expect(readExifOrientation(transformJpegLossless(r90, false, 1))).toBe(3);
    expect(readExifOrientation(transformJpegLossless(f, true, 0))).toBe(2);
    expect(r90.length).toBe(f.length);
  });
});

/* ───────────── PNG / WebP / ICO ───────────── */

const PNG_SIG = bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a);
const pngFixture = (...chunks: Uint8Array[]) =>
  cat(
    PNG_SIG,
    makePngChunk("IHDR", bytes(0, 0, 0, 2, 0, 0, 0, 2, 8, 6, 0, 0, 0)),
    ...chunks,
    makePngChunk("IDAT", bytes(1, 2, 3)),
    makePngChunk("IEND", new Uint8Array(0)),
  );

describe("PNG chunks", () => {
  it("CRC32 matches known values", () => {
    expect(crc32(bytes("IEND"))).toBe(0xae426082);
    expect(crc32(bytes("123456789"))).toBe(0xcbf43926);
  });
  it("sets and reads pHYs (DPI) right after IHDR", () => {
    const f = setPngDpi(pngFixture(), 300);
    expect(pngChunks(f).map((c) => c.type)).toEqual(["IHDR", "pHYs", "IDAT", "IEND"]);
    expect(readPngDpi(f)).toEqual({ x: 300, y: 300 });
    const again = setPngDpi(f, 72);
    expect(pngChunks(again).filter((c) => c.type === "pHYs")).toHaveLength(1);
    expect(readPngDpi(again)).toEqual({ x: 72, y: 72 });
  });
  it("strips text/EXIF/time chunks but keeps colour chunks", () => {
    const f = pngFixture(
      makePngChunk("iCCP", bytes("x", 0, 0, 1)),
      makePngChunk("tEXt", bytes("Author", 0, "me")),
      makePngChunk("eXIf", bytes("MM", 0, 42)),
      makePngChunk("tIME", new Uint8Array(7)),
    );
    const { bytes: out, removed } = stripPngMetadata(f);
    expect(removed.sort()).toEqual(["eXIf", "tEXt", "tIME"]);
    expect(pngChunks(out).map((c) => c.type)).toEqual(["IHDR", "iCCP", "IDAT", "IEND"]);
  });
});

describe("WebP metadata", () => {
  it("removes EXIF and XMP chunks and clears VP8X flags", () => {
    const vp8x = bytes("VP8X", 10, 0, 0, 0, 0x08 | 0x04 | 0x10, 0, 0, 0, 1, 0, 0, 1, 0, 0);
    const img = bytes("VP8L", 4, 0, 0, 0, 1, 2, 3, 4);
    const exif = bytes("EXIF", 3, 0, 0, 0, 1, 2, 3, 0);
    const xmp = bytes("XMP ", 2, 0, 0, 0, 9, 9);
    const body = cat(bytes("WEBP"), vp8x, img, exif, xmp);
    const file = cat(bytes("RIFF", body.length & 255, (body.length >> 8) & 255, 0, 0), body);
    const { bytes: out, removed } = stripWebpMetadata(file);
    expect(removed).toEqual(["EXIF", "XMP"]);
    expect(out[20]).toBe(0x10); // only alpha flag left
    const riffSize = out[4] | (out[5] << 8) | (out[6] << 16) | (out[7] << 24);
    expect(riffSize).toBe(out.length - 8);
    expect(out.length).toBe(12 + vp8x.length + img.length);
  });
});

describe("ICO writer", () => {
  it("writes a valid directory with PNG entries", () => {
    const png16 = new Uint8Array(40).fill(1);
    const png32 = new Uint8Array(70).fill(2);
    const png256 = new Uint8Array(100).fill(3);
    const ico = writeIco([
      { width: 32, height: 32, png: png32 },
      { width: 16, height: 16, png: png16 },
      { width: 256, height: 256, png: png256 },
    ]);
    expect(Array.from(ico.subarray(0, 6))).toEqual([0, 0, 1, 0, 3, 0]);
    const dir = readIcoDirectory(ico);
    expect(dir.map((d) => [d.width, d.height, d.size, d.bpp])).toEqual([
      [16, 16, 40, 32],
      [32, 32, 70, 32],
      [256, 256, 100, 32],
    ]);
    expect(ico[6 + 2 * 16]).toBe(0); // 256 stored as 0
    expect(dir[0].offset).toBe(6 + 3 * 16);
    expect(dir[1].offset).toBe(dir[0].offset + 40);
    expect(ico.length).toBe(6 + 48 + 40 + 70 + 100);
    expect(ico[dir[2].offset]).toBe(3);
  });
  it("rejects sizes above 256", () => {
    expect(() => writeIco([{ width: 512, height: 512, png: new Uint8Array(1) }])).toThrow();
  });
});

/* ───────────── GIF decoding ───────────── */

describe("GIF decoder", () => {
  it("round-trips frames encoded by gifenc", () => {
    const f = gifFixture(3, 5, 4);
    const info = gifInfo(f);
    expect(info).toMatchObject({ width: 5, height: 4, frames: 3, delays: [100, 200, 300], loop: 0 });
    const frames = [...decodeGifFrames(f)];
    expect(frames).toHaveLength(3);
    const pal = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 255],
    ];
    frames.forEach((fr, fi) => {
      for (let i = 0; i < 20; i++) {
        const want = pal[(i + fi) % 4];
        expect(Array.from(fr.rgba.subarray(i * 4, i * 4 + 4))).toEqual([...want, 255]);
      }
    });
  });
  it("LZW decodes a larger noisy frame exactly", () => {
    const w = 97;
    const h = 61;
    const index = new Uint8Array(w * h).map((_, i) => (i * 7919 + (i >> 3)) % 4);
    const gif = GIFEncoder();
    gif.writeFrame(index, w, h, {
      palette: [
        [0, 0, 0],
        [10, 20, 30],
        [200, 100, 50],
        [255, 255, 255],
      ],
    });
    gif.finish();
    const [fr] = [...decodeGifFrames(gif.bytes())];
    const pal = [0, 10, 200, 255];
    for (let i = 0; i < w * h; i++) expect(fr.rgba[i * 4]).toBe(pal[index[i]]);
    expect(lzwDecode(2, new Uint8Array(0), 4)).toEqual(new Uint8Array(4));
  });
});

/* ───────────── palette & colours ───────────── */

describe("median cut palette", () => {
  it("finds the dominant colours and their shares", () => {
    const px: number[] = [];
    const add = (r: number, g: number, b: number, n: number) => {
      for (let i = 0; i < n; i++) px.push(r, g, b, 255);
    };
    add(255, 0, 0, 600);
    add(0, 0, 255, 300);
    add(250, 250, 250, 100);
    for (let i = 0; i < 50; i++) px.push(0, 255, 0, 0); // transparent: ignored
    const pal = medianCut(new Uint8ClampedArray(px), 3);
    expect(pal.map((c) => rgbToHex(c.r, c.g, c.b))).toEqual(["#FF0000", "#0000FF", "#FAFAFA"]);
    expect(pal[0].share).toBeCloseTo(0.6, 5);
  });
  it("colour helpers", () => {
    expect(rgbToHsl(255, 0, 0)).toEqual([0, 100, 50]);
    expect(normalizeHex("#abc")).toBe("#AABBCC");
    expect(normalizeHex("12345")).toBeNull();
  });
});

/* ───────────── filters ───────────── */

const px = (...rgba: number[]) => ({ data: new Uint8ClampedArray(rgba), width: rgba.length / 4, height: 1 });

describe("pixel filters", () => {
  it("grayscale uses Rec. 709 luminance", () => {
    const p = px(255, 0, 0, 255);
    applyFilter(p, "grayscale", { amount: 100 });
    expect(Array.from(p.data)).toEqual([54, 54, 54, 255]);
  });
  it("invert and partial invert", () => {
    const p = px(0, 100, 255, 128);
    applyFilter(p, "invert", { amount: 100 });
    expect(Array.from(p.data)).toEqual([255, 155, 0, 128]);
  });
  it("sepia matches the W3C matrix", () => {
    const p = px(100, 100, 100, 255);
    applyFilter(p, "sepia", { amount: 100 });
    expect(Array.from(p.data)).toEqual([135, 120, 94, 255]);
  });
  it("posterize to 2 levels", () => {
    const p = px(10, 120, 200, 255);
    applyFilter(p, "posterize", { amount: 2 });
    expect(Array.from(p.data)).toEqual([0, 0, 255, 255]);
  });
  it("threshold black & white", () => {
    const p = px(200, 200, 200, 255, 20, 20, 20, 255);
    applyFilter(p, "black-and-white", { amount: 128 });
    expect(Array.from(p.data)).toEqual([255, 255, 255, 255, 0, 0, 0, 255]);
  });
  it("blur keeps a flat image flat and conserves brightness", () => {
    const w = 20;
    const h = 10;
    const flat = { data: new Uint8ClampedArray(w * h * 4).fill(120), width: w, height: h };
    gaussianBlur(flat, 4);
    expect(new Set(flat.data)).toEqual(new Set([120]));
    const stripe = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
    for (let i = 0; i < w * h; i++) {
      const v = i % w < w / 2 ? 0 : 200;
      stripe.data.set([v, v, v, 255], i * 4);
    }
    gaussianBlur(stripe, 2);
    const row = Array.from({ length: w }, (_, x) => stripe.data[x * 4]);
    expect(row[0]).toBeLessThan(10);
    expect(row[w - 1]).toBeGreaterThan(190);
    expect(row[w / 2 - 1]).toBeGreaterThan(40);
    expect(row[w / 2]).toBeLessThan(160);
  });
});
