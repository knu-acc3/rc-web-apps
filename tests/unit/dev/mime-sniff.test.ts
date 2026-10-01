import { describe, expect, it } from "vitest";
import { hexPreview, sniff, zipNames } from "@/tools/dev/mime/lib/sniff";

const bytes = (...parts: (number[] | string)[]) => {
  const out: number[] = [];
  for (const p of parts) {
    if (typeof p === "string") for (const ch of p) out.push(ch.charCodeAt(0));
    else out.push(...p);
  }
  return new Uint8Array(out);
};
const u16 = (n: number) => [n & 255, (n >> 8) & 255];
const u32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];

/** Minimal ZIP local file header (stored). */
function zipEntry(name: string, data = ""): number[] {
  return [...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...Array.from(name, (c) => c.charCodeAt(0)), ...Array.from(data, (c) => c.charCodeAt(0))];
}

describe("magic byte sniffing", () => {
  it("images", () => {
    expect(sniff(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [0, 0, 0, 13], "IHDR"))?.ext).toBe("png");
    expect(sniff(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [0, 0, 0, 13], "IHDR", [0, 0, 0, 8], "acTL", [0, 0, 0, 0], "IDAT"))?.ext).toBe("apng");
    expect(sniff(bytes([0xff, 0xd8, 0xff, 0xe0, 0, 16], "JFIF"))?.mime).toBe("image/jpeg");
    expect(sniff(bytes("GIF89a", [1, 0, 1, 0]))?.ext).toBe("gif");
    expect(sniff(bytes("RIFF", u32(100), "WEBPVP8 "))?.ext).toBe("webp");
    expect(sniff(bytes([0, 0, 0, 0x1c], "ftypavif", [0, 0, 0, 0], "avifmif1miaf"))?.ext).toBe("avif");
    expect(sniff(bytes([0, 0, 0, 0x18], "ftypheic", [0, 0, 0, 0], "mif1heic"))?.ext).toBe("heic");
    expect(sniff(bytes("II*", [0], [8, 0, 0, 0], "CR", [2, 0]))?.ext).toBe("cr2");
  });

  it("documents and ZIP containers", () => {
    expect(sniff(bytes("%PDF-1.7\n"))?.mime).toBe("application/pdf");
    const docx = new Uint8Array([...zipEntry("[Content_Types].xml", "<Types/>"), ...zipEntry("_rels/.rels", "x"), ...zipEntry("word/document.xml", "<w:document/>")]);
    expect(sniff(docx)?.ext).toBe("docx");
    const xlsx = new Uint8Array([...zipEntry("[Content_Types].xml", "<Types/>"), ...zipEntry("xl/workbook.xml", "<x/>")]);
    expect(sniff(xlsx)?.ext).toBe("xlsx");
    const epub = new Uint8Array([...zipEntry("mimetype", "application/epub+zip"), ...zipEntry("META-INF/container.xml", "<c/>")]);
    expect(sniff(epub)?.ext).toBe("epub");
    expect(zipNames(epub).mimetype).toBe("application/epub+zip");
    const apk = new Uint8Array([...zipEntry("AndroidManifest.xml", "x"), ...zipEntry("classes.dex", "dex\n")]);
    expect(sniff(apk)?.ext).toBe("apk");
    const jar = new Uint8Array([...zipEntry("META-INF/MANIFEST.MF", "Manifest-Version: 1.0")]);
    expect(sniff(jar)?.ext).toBe("jar");
    expect(sniff(new Uint8Array(zipEntry("readme.txt", "hi")))?.ext).toBe("zip");
    expect(sniff(bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))?.confidence).toBe("medium");
  });

  it("archives, binaries and media", () => {
    expect(sniff(bytes([0x1f, 0x8b, 8, 0]))?.mime).toBe("application/gzip");
    expect(sniff(bytes([0x28, 0xb5, 0x2f, 0xfd]))?.ext).toBe("zst");
    expect(sniff(bytes("7z", [0xbc, 0xaf, 0x27, 0x1c]))?.ext).toBe("7z");
    expect(sniff(bytes("Rar!", [0x1a, 7, 1, 0]))?.ext).toBe("rar");
    const tar = new Uint8Array(512);
    tar.set(bytes("ustar"), 257);
    tar[0] = 0x61;
    expect(sniff(tar)?.ext).toBe("tar");
    expect(sniff(bytes([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]))?.mime).toBe("application/wasm");
    expect(sniff(bytes("MZ", [0x90, 0]))?.ext).toBe("exe");
    expect(sniff(bytes([0x7f], "ELF", [2, 1, 1]))?.ext).toBe("so");
    expect(sniff(bytes([0xca, 0xfe, 0xba, 0xbe, 0, 0, 0, 0x41]))?.ext).toBe("class");
    expect(sniff(bytes([0, 0, 0, 0x20], "ftypisom", [0, 0, 2, 0], "isomiso2avc1mp41"))?.ext).toBe("mp4");
    expect(sniff(bytes([0, 0, 0, 0x14], "ftypqt  ", [0, 0, 0, 0], "qt  "))?.ext).toBe("mov");
    expect(sniff(bytes("RIFF", u32(100), "WAVEfmt "))?.mime).toBe("audio/wav");
    expect(sniff(bytes("OggS", [0, 2], [0, 0, 0, 0, 0, 0, 0, 0], [1, 2, 3, 4], [0, 0, 0, 0], [0, 0, 0, 0], [1, 19], "OpusHead"))?.ext).toBe("opus");
    expect(sniff(bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 1], "B", [0x82, 0x84], "webm"))?.ext).toBe("webm");
    expect(sniff(bytes("ID3", [4, 0, 0]))?.ext).toBe("mp3");
    expect(sniff(bytes([0xff, 0xf1, 0x50, 0x80]))?.ext).toBe("aac");
    expect(sniff(bytes("fLaC", [0, 0, 0, 0x22]))?.ext).toBe("flac");
    expect(sniff(bytes("wOF2", [0, 1, 0, 0]))?.mime).toBe("font/woff2");
    expect(sniff(bytes("SQLite format 3", [0]))?.ext).toBe("sqlite");
  });

  it("text formats", () => {
    expect(sniff(bytes('{"a": 1, "b": [true, null]}'))?.ext).toBe("json");
    expect(sniff(bytes('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"/>'))?.ext).toBe("svg");
    expect(sniff(bytes("<!DOCTYPE html><html><head>"))?.ext).toBe("html");
    expect(sniff(bytes("BEGIN:VCARD\r\nVERSION:3.0\r\n"))?.ext).toBe("vcf");
    expect(sniff(bytes("#!/usr/bin/env python3\nprint(1)\n"))?.ext).toBe("py");
    expect(sniff(bytes("Просто текст").length ? new TextEncoder().encode("Просто текст") : new Uint8Array())?.ext).toBe("txt");
  });

  it("unknown binary", () => {
    expect(sniff(bytes([0, 0x13, 0x37, 0, 0xaa, 0x55]))).toBeNull();
    expect(sniff(new Uint8Array())).toBeNull();
    expect(hexPreview(bytes([0x89, 0x50, 0x4e, 0x47]))).toBe("89 50 4E 47");
  });
});
