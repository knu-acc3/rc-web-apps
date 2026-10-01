import { describe, expect, it } from "vitest";
import { detectBytes, extensionMatches, extOf, gifFrameCount, id3Size, isAdtsHeader, mpegAudioLayer, sniffFile } from "@/tools/files/file/lib/magic";

const bytes = (...parts: (number[] | string)[]) => {
  const out: number[] = [];
  for (const p of parts) {
    if (typeof p === "string") for (const ch of p) out.push(ch.charCodeAt(0));
    else out.push(...p);
  }
  return new Uint8Array(out);
};
const pad = (b: Uint8Array, n: number) => {
  const out = new Uint8Array(Math.max(n, b.length));
  out.set(b);
  return out;
};
const be32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const ftyp = (major: string, ...compat: string[]) => pad(bytes(be32(16 + compat.length * 4), "ftyp", major, [0, 0, 0, 0], ...compat), 64);

// Minimal GIF: header, 1×1 logical screen with 2-colour global table, N image blocks, trailer.
function gif(frames: number): Uint8Array {
  const head = bytes("GIF89a", [1, 0, 1, 0, 0x80, 0, 0], [0, 0, 0, 255, 255, 255]);
  const frame = bytes([0x21, 0xf9, 4, 0, 10, 0, 0, 0], [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0], [2, 2, 0x44, 0x01, 0]);
  const parts = [head];
  for (let i = 0; i < frames; i++) parts.push(frame);
  parts.push(bytes([0x3b]));
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

describe("magic bytes: images", () => {
  it("detects JPEG, PNG and BMP", () => {
    expect(detectBytes(bytes([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    const png = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], be32(13), "IHDR", new Array(17).fill(0), be32(0), "IDAT");
    const p = detectBytes(png)!;
    expect(p.ext).toBe("png");
    expect(p.animated).toBe(false);
    expect(detectBytes(pad(bytes("BM", new Array(12).fill(0), [40, 0, 0, 0]), 32))?.ext).toBe("bmp");
  });
  it("recognises APNG by its acTL chunk", () => {
    const apng = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], be32(13), "IHDR", new Array(17).fill(0), be32(8), "acTL", new Array(12).fill(0));
    const d = detectBytes(apng)!;
    expect(d.animated).toBe(true);
    expect(d.mime).toBe("image/apng");
  });
  it("only calls a GIF animated when it has several frames", () => {
    expect(gifFrameCount(gif(1))).toEqual({ frames: 1, complete: true });
    expect(gifFrameCount(gif(3))).toEqual({ frames: 3, complete: true });
    expect(detectBytes(gif(1))?.animated).toBe(false);
    expect(detectBytes(gif(2))?.animated).toBe(true);
  });
  it("reads the WebP animation flag", () => {
    const anim = bytes("RIFF", [0, 0, 0, 0], "WEBP", "VP8X", [10, 0, 0, 0], [0x02, 0, 0, 0]);
    const still = bytes("RIFF", [0, 0, 0, 0], "WEBP", "VP8 ", [10, 0, 0, 0]);
    expect(detectBytes(anim)?.animated).toBe(true);
    expect(detectBytes(still)?.animated).toBe(false);
  });
});

describe("magic bytes: ISO BMFF brands", () => {
  it("maps known brands", () => {
    expect(detectBytes(ftyp("isom", "isom", "avc1"))?.ext).toBe("mp4");
    expect(detectBytes(ftyp("mp42"))?.kind).toBe("video");
    expect(detectBytes(ftyp("qt  "))?.ext).toBe("mov");
    expect(detectBytes(ftyp("M4A ", "M4A ", "mp42"))).toMatchObject({ ext: "m4a", kind: "audio" });
    expect(detectBytes(ftyp("3gp5"))?.ext).toBe("3gp");
    expect(detectBytes(ftyp("heic", "mif1", "heic"))?.ext).toBe("heic");
    expect(detectBytes(ftyp("avif", "avif", "mif1"))?.ext).toBe("avif");
    expect(detectBytes(ftyp("mif1", "mif1", "avif"))?.ext).toBe("avif");
  });
  it("does not turn Canon CR3 or unknown brands into MP4 video", () => {
    expect(detectBytes(ftyp("crx ", "crx ", "isom"))).toMatchObject({ ext: "cr3", kind: "image" });
    const unknown = detectBytes(ftyp("zzzz"))!;
    expect(unknown.kind).toBe("data");
    expect(unknown.ext).not.toBe("mp4");
  });
});

describe("magic bytes: audio streams", () => {
  const adts = [0xff, 0xf1, 0x50, 0x80, 0x02, 0x1f, 0xfc];
  const mp3 = [0xff, 0xfb, 0x90, 0x64];
  it("tells ADTS AAC apart from MP3", () => {
    expect(isAdtsHeader(bytes(adts))).toBe(true);
    expect(mpegAudioLayer(bytes(adts))).toBe(0);
    expect(mpegAudioLayer(bytes(mp3))).toBe(3);
    expect(isAdtsHeader(bytes(mp3))).toBe(false);
    expect(detectBytes(pad(bytes(adts), 64))?.ext).toBe("aac");
    expect(detectBytes(pad(bytes(mp3), 64))?.ext).toBe("mp3");
  });
  it("looks behind an ID3 tag", () => {
    const tag = bytes("ID3", [4, 0, 0, 0, 0, 0, 10], new Array(10).fill(0));
    expect(id3Size(tag)).toBe(20);
    const withAac = new Uint8Array([...tag, ...adts, 0, 0, 0]);
    const withMp3 = new Uint8Array([...tag, ...mp3, 0, 0, 0]);
    expect(detectBytes(withAac)?.ext).toBe("aac");
    expect(detectBytes(withMp3)?.ext).toBe("mp3");
  });
  it("detects containers", () => {
    expect(detectBytes(bytes("RIFF", [0, 0, 0, 0], "WAVE", "fmt "))?.ext).toBe("wav");
    expect(detectBytes(bytes("RIFF", [0, 0, 0, 0], "AVI LIST"))?.ext).toBe("avi");
    expect(detectBytes(bytes("fLaC", [0, 0, 0, 34]))?.ext).toBe("flac");
    expect(detectBytes(bytes("FORM", [0, 0, 0, 0], "AIFF"))?.ext).toBe("aiff");
    const oggHead = (packet: number[] | string) => bytes("OggS", [0, 2], new Array(20).fill(0), [1, 30], packet);
    expect(detectBytes(oggHead("OpusHead"))?.ext).toBe("opus");
    expect(detectBytes(oggHead([1, ..."vorbis".split("").map((c) => c.charCodeAt(0))]))?.ext).toBe("ogg");
    expect(detectBytes(bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0x82, 0x84], "webm"))?.ext).toBe("webm");
    expect(detectBytes(bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x88], "matroska"))?.ext).toBe("mkv");
    expect(detectBytes(bytes("FLV", [1, 5]))?.ext).toBe("flv");
  });
  it("needs three sync bytes for MPEG-TS", () => {
    const ts = new Uint8Array(400);
    ts[0] = ts[188] = ts[376] = 0x47;
    expect(detectBytes(ts)?.ext).toBe("ts");
    // A text file starting with "G" is not a transport stream.
    expect(detectBytes(bytes("Good morning"))?.kind).toBe("text");
  });
});

describe("magic bytes: documents, archives, executables, text", () => {
  it("detects common signatures", () => {
    expect(detectBytes(bytes("%PDF-1.7\n"))).toMatchObject({ ext: "pdf", kind: "document" });
    expect(detectBytes(bytes([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]))?.ext).toBe("7z");
    expect(detectBytes(bytes("Rar!", [0x1a, 0x07, 0x01, 0x00]))?.ext).toBe("rar");
    expect(detectBytes(bytes([0x1f, 0x8b, 8, 0]))?.ext).toBe("gz");
    expect(detectBytes(bytes("wOF2", [0, 1, 0, 0]))?.ext).toBe("woff2");
    expect(detectBytes(bytes([0x7f, 0x45, 0x4c, 0x46, 2, 1]))?.ext).toBe("elf");
    expect(detectBytes(bytes("SQLite format 3", [0]))?.ext).toBe("sqlite");
  });
  it("detects ZIP and Office documents", () => {
    const local = (name: string) => bytes("PK", [3, 4], new Array(22).fill(0), [name.length, 0, 0, 0], name);
    expect(detectBytes(local("readme.txt"))?.ext).toBe("zip");
    const docx = new Uint8Array([...local("[Content_Types].xml"), ...local("word/document.xml")]);
    expect(detectBytes(docx)?.ext).toBe("docx");
    const epub = bytes("PK", [3, 4], new Array(22).fill(0), [8, 0, 0, 0], "mimetype", "application/epub+zip");
    expect(detectBytes(epub)?.ext).toBe("epub");
  });
  it("detects PE executables", () => {
    const pe = new Uint8Array(256);
    pe.set(bytes("MZ"), 0);
    pe[60] = 128;
    pe.set(bytes("PE", [0, 0]), 128);
    expect(detectBytes(pe)?.ext).toBe("exe");
    pe[128 + 23] = 0x20; // IMAGE_FILE_DLL
    expect(detectBytes(pe)?.ext).toBe("dll");
  });
  it("falls back to text heuristics", () => {
    const enc = new TextEncoder();
    expect(detectBytes(enc.encode('{"a": 1}'))?.ext).toBe("json");
    expect(detectBytes(enc.encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))?.ext).toBe("svg");
    expect(detectBytes(enc.encode("Привет, мир"))?.ext).toBe("txt");
    expect(detectBytes(bytes([0, 1, 2, 3, 250, 251, 252]))).toBeNull();
  });
});

describe("sniffFile and extensions", () => {
  it("reads a Blob and counts GIF frames beyond the head", async () => {
    const d = await sniffFile(new Blob([gif(2) as BlobPart]));
    expect(d?.animated).toBe(true);
  });
  it("checks extension agreement", () => {
    expect(extOf("Photo.JPEG")).toBe("jpeg");
    expect(extOf("noext")).toBe("");
    expect(extOf(".hidden")).toBe("");
    const jpg = detectBytes(bytes([0xff, 0xd8, 0xff, 0xe0]))!;
    expect(extensionMatches("a.jpeg", jpg)).toBe(true);
    expect(extensionMatches("a.png", jpg)).toBe(false);
  });
});
