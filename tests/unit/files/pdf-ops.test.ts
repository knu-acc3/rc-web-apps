import { readFileSync } from "node:fs";
import { join } from "node:path";
import { crc32, deflateSync } from "node:zlib";
import { PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream, StandardFonts, degrees } from "@cantoo/pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { copyPagesInto } from "@/tools/files/pdf/lib/copy";
import { PAPER } from "@/tools/files/pdf/lib/geometry";
import { classifyImage, collectGarbage, optimizeLossless, recompressImages, unpredictPng, type ImageCodec } from "@/tools/files/pdf/lib/optimize";
import { PdfError, openPdf, pageGeometry, pageLabel, pageNumberPlan, readForm, readInfo } from "@/tools/files/pdf/lib/pdf-ops";
import { runJob } from "@/tools/files/pdf/lib/run";
import { chunkPages } from "@/tools/files/pdf/lib/ranges";

const FONT = readFileSync(join(process.cwd(), "src/tools/files/pdf/data/NotoSans-Regular.ttf"));
const STD_FONTS = join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/").replace(/\\/g, "/");

/** A PDF whose pages say "Doc <tag> page <n>" and have distinct sizes. */
async function makePdf(tag: string, n: number, opts: { rotate?: number[]; title?: string; objectStreams?: boolean } = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= n; i++) {
    const page = doc.addPage([400 + i * 10, 600]);
    page.drawText(`Doc ${tag} page ${i}`, { x: 40, y: 500, size: 18, font });
    if (opts.rotate?.[i - 1]) page.setRotation(degrees(opts.rotate[i - 1]));
  }
  if (opts.title) {
    doc.setTitle(opts.title);
    doc.setProducer("Original Producer 1.0");
  }
  return doc.save({ useObjectStreams: opts.objectStreams ?? false });
}

const buf = (u: Uint8Array) => u.slice().buffer;

async function pdfText(bytes: Uint8Array, password?: string): Promise<string[]> {
  const doc = await getDocument({ data: bytes.slice(), password, standardFontDataUrl: STD_FONTS }).promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    out.push(tc.items.map((it) => ("str" in it ? it.str : "")).join(""));
  }
  await doc.loadingTask.destroy();
  return out;
}

describe("assemble (merge / split / extract)", () => {
  it("merges files in a custom page order, including repeats", async () => {
    const a = await makePdf("A", 3);
    const b = await makePdf("B", 2);
    const r = await runJob({
      type: "assemble",
      sources: [{ bytes: buf(a) }, { bytes: buf(b) }],
      outputs: [
        {
          name: "m.pdf",
          pages: [
            { src: 1, index: 1 },
            { src: 0, index: 0 },
            { src: 0, index: 2, rotate: 90 },
            { src: 1, index: 0 },
            { src: 0, index: 0 },
          ],
        },
      ],
    });
    const bytes = r.files[0].bytes;
    expect(await pdfText(bytes)).toEqual(["Doc B page 2", "Doc A page 1", "Doc A page 3", "Doc B page 1", "Doc A page 1"]);
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();
    expect(pages.map((p) => p.getWidth())).toEqual([420, 410, 430, 410, 410]);
    expect(pages[2].getRotation().angle).toBe(90);
    // The repeated page is a separate page object.
    expect(new Set(pages.map((p) => p.ref.toString())).size).toBe(5);
  });

  it("splits into chunks", async () => {
    const a = await makePdf("S", 5);
    const outputs = chunkPages(5, 2).map((g, i) => ({ name: `part-${i + 1}.pdf`, pages: g.map((p) => ({ src: 0, index: p - 1 })) }));
    const r = await runJob({ type: "assemble", sources: [{ bytes: buf(a) }], outputs, keepInfo: true });
    expect(r.files.map((f) => f.name)).toEqual(["part-1.pdf", "part-2.pdf", "part-3.pdf"]);
    expect(await pdfText(r.files[1].bytes)).toEqual(["Doc S page 3", "Doc S page 4"]);
    expect(await pdfText(r.files[2].bytes)).toEqual(["Doc S page 5"]);
  });

  it("keeps document info on single-file operations", async () => {
    const a = await makePdf("I", 2, { title: "Отчёт за 2025 год" });
    const r = await runJob({ type: "assemble", sources: [{ bytes: buf(a) }], outputs: [{ name: "x.pdf", pages: [{ src: 0, index: 1 }] }], keepInfo: true });
    const doc = await PDFDocument.load(r.files[0].bytes, { updateMetadata: false });
    expect(doc.getTitle()).toBe("Отчёт за 2025 год");
  });

  it("does not drag excluded pages into the output through links", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    for (let i = 1; i <= 3; i++) src.addPage([300, 300]).drawText(`P${i}`, { x: 20, y: 20, size: 12, font });
    const [p1, , p3] = src.getPages();
    const link = src.context.obj({ Type: "Annot", Subtype: "Link", Rect: [0, 0, 50, 50], Dest: [p3.ref, "Fit"], P: p1.ref });
    p1.node.set(PDFName.of("Annots"), src.context.obj([src.context.register(link)]));
    const loaded = await PDFDocument.load(await src.save());
    const out = await PDFDocument.create();
    const [copy] = await copyPagesInto(out, loaded, [0]);
    out.addPage(copy);
    const pageDicts = out.context.enumerateIndirectObjects().filter(([, o]) => o instanceof PDFDict && o.lookup(PDFName.of("Type")) === PDFName.of("Page"));
    expect(pageDicts).toHaveLength(1);
    const annot = copy.node.lookup(PDFName.of("Annots"));
    expect(annot).toBeDefined();
  });
});

describe("in-place operations", () => {
  it("rotates selected pages relative to their current rotation", async () => {
    const a = await makePdf("R", 3, { rotate: [0, 90, 0] });
    const r = await runJob({ type: "rotate", source: { bytes: buf(a) }, rotations: [0, 1].map((index) => ({ index, delta: 90 })) });
    const doc = await PDFDocument.load(r.files[0].bytes);
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([90, 180, 0]);
  });

  it("drops stale object streams of the loaded file when saving", async () => {
    const a = await makePdf("G", 4, { objectStreams: true });
    const r = await runJob({ type: "rotate", source: { bytes: buf(a) }, rotations: [{ index: 0, delta: 180 }] });
    const doc = await PDFDocument.load(r.files[0].bytes);
    const objStm = doc.context.enumerateIndirectObjects().filter(([, o]) => o instanceof PDFRawStream && o.dict.lookup(PDFName.of("Type")) === PDFName.of("ObjStm"));
    // Only the freshly written object streams may exist — never the old ones duplicated.
    expect(r.files[0].bytes.length).toBeLessThan(a.length * 1.3);
    expect(objStm.length).toBeLessThanOrEqual(2);
  });

  it("n-up: 5 A4 pages 4 per sheet → 2 portrait sheets", async () => {
    const d = await PDFDocument.create();
    for (let i = 0; i < 5; i++) d.addPage([...PAPER.a4]);
    const r = await runJob({ type: "nup", source: { bytes: buf(await d.save()) }, options: { n: 4, sheet: "a4", orientation: "auto", margin: 0, gap: 0, order: "rows", border: false } });
    const doc = await PDFDocument.load(r.files[0].bytes);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getWidth()).toBeCloseTo(PAPER.a4[0]);
  });

  it("n-up: 2 per sheet gives landscape sheets and keeps the text", async () => {
    const a = await makePdf("N", 3);
    const r = await runJob({ type: "nup", source: { bytes: buf(a) }, options: { n: 2, sheet: "a4", orientation: "auto", margin: 10, gap: 5, order: "rows", border: true } });
    const doc = await PDFDocument.load(r.files[0].bytes);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getWidth()).toBeGreaterThan(doc.getPage(0).getHeight());
    expect(await pdfText(r.files[0].bytes)).toEqual(["Doc N page 1Doc N page 2", "Doc N page 3"]);
  });
});

describe("stamping", () => {
  it("numbers pages in Russian with an embedded font (text stays extractable)", async () => {
    const a = await makePdf("P", 3, { rotate: [0, 90, 0] });
    const r = await runJob({
      type: "page-numbers",
      source: { bytes: buf(a) },
      font: buf(FONT),
      options: { position: "bottom-center", format: "page-n-of-total", locale: "ru", start: 1, skipFirst: false, size: 11, margin: 28, color: [0, 0, 0] },
    });
    const text = await pdfText(r.files[0].bytes);
    expect(text[0]).toContain("Страница 1 из 3");
    expect(text[1]).toContain("Страница 2 из 3");
    expect(r.files[0].bytes.length).toBeLessThan(a.length + 60_000); // subset, not the whole 570 KB font
  });

  it("plans GOST-style numbering: title page counted but not numbered", () => {
    expect(pageNumberPlan(4, { format: "n", locale: "ru", start: 2, skipFirst: true })).toEqual([null, "2", "3", "4"]);
    expect(pageNumberPlan(3, { format: "n-of-total", locale: "en", start: 1, skipFirst: false })).toEqual(["1 / 3", "2 / 3", "3 / 3"]);
    expect(pageLabel("page-n-of-total", 2, 9, "en")).toBe("Page 2 of 9");
  });

  it("previews one page with its real label", async () => {
    const a = await makePdf("V", 3);
    const r = await runJob({
      type: "page-numbers",
      source: { bytes: buf(a) },
      preview: 2,
      options: { position: "top-right", format: "n-of-total", locale: "en", start: 1, skipFirst: false, size: 11, margin: 28, color: [0, 0, 0] },
    });
    const text = await pdfText(r.files[0].bytes);
    expect(text).toHaveLength(1);
    expect(text[0]).toContain("3 / 3");
  });

  it("stamps a vector text watermark (not an image) that respects /Rotate", async () => {
    const a = await makePdf("W", 2, { rotate: [0, 270] });
    const r = await runJob({
      type: "watermark",
      source: { bytes: buf(a) },
      pages: [0, 1],
      font: buf(FONT),
      text: { text: "КОНФИДЕНЦИАЛЬНО", size: 40, color: [0.8, 0, 0], opacity: 0.3, angle: 45, position: "center", margin: 20, tile: false },
    });
    const text = await pdfText(r.files[0].bytes);
    expect(text[1]).toContain("КОНФИДЕНЦИАЛЬНО");
    const doc = await PDFDocument.load(r.files[0].bytes);
    const xobj = doc.getPage(0).node.Resources()?.lookup(PDFName.of("XObject"));
    expect(!xobj || (xobj as PDFDict).keys().length === 0).toBe(true);
  });

  it("requires a font for Cyrillic text instead of producing garbage", async () => {
    const a = await makePdf("F", 1);
    await expect(
      runJob({ type: "watermark", source: { bytes: buf(a) }, pages: [0], text: { text: "ОБРАЗЕЦ", size: 40, color: [0, 0, 0], opacity: 1, angle: 0, position: "center", margin: 0, tile: false } }),
    ).rejects.toMatchObject({ code: "font-required" });
  });
});

describe("encryption", () => {
  it("really encrypts (AES-256), verifies, and unlocks with the password", async () => {
    const a = await makePdf("E", 2);
    const r = await runJob({
      type: "protect",
      source: { bytes: buf(a) },
      options: { userPassword: "пароль-123", ownerPassword: "owner-secret", allowPrinting: true, allowCopying: false, allowModifying: false, allowAnnotating: false },
    });
    const enc = r.files[0].bytes;
    expect(new TextDecoder("latin1").decode(enc)).toMatch(/\/Encrypt/);
    await expect(pdfText(enc)).rejects.toMatchObject({ name: "PasswordException" });
    expect(await pdfText(enc, "пароль-123")).toEqual(["Doc E page 1", "Doc E page 2"]);
    await expect(openPdf(enc)).rejects.toMatchObject({ code: "password-required" });
    await expect(openPdf(enc, "wrong")).rejects.toMatchObject({ code: "password-incorrect" });

    const u = await runJob({ type: "unlock", source: { bytes: buf(enc), password: "пароль-123" } });
    expect(await pdfText(u.files[0].bytes)).toEqual(["Doc E page 1", "Doc E page 2"]);
    const plain = await PDFDocument.load(u.files[0].bytes);
    expect(plain.isEncrypted).toBe(false);
  });

  it("merges an encrypted file once its password is given", async () => {
    const enc = (await runJob({ type: "protect", source: { bytes: buf(await makePdf("X", 1)) }, options: { userPassword: "1", ownerPassword: "2", allowPrinting: true, allowCopying: true, allowModifying: true, allowAnnotating: true } })).files[0].bytes;
    const plain = await makePdf("Y", 1);
    await expect(runJob({ type: "assemble", sources: [{ bytes: buf(enc) }, { bytes: buf(plain) }], outputs: [{ name: "m", pages: [{ src: 0, index: 0 }] }] })).rejects.toBeInstanceOf(PdfError);
    const ok = await runJob({
      type: "assemble",
      sources: [{ bytes: buf(enc), password: "1" }, { bytes: buf(plain) }],
      outputs: [{ name: "m", pages: [{ src: 0, index: 0 }, { src: 1, index: 0 }] }],
    });
    expect(await pdfText(ok.files[0].bytes)).toEqual(["Doc X page 1", "Doc Y page 1"]);
  });
});

describe("metadata and forms", () => {
  it("reads metadata without altering it and writes changes", async () => {
    const a = await makePdf("M", 1, { title: "Old title" });
    const info = await runJob({ type: "info", source: { bytes: buf(a) } });
    expect(info.info).toMatchObject({ title: "Old title", producer: "Original Producer 1.0", pageCount: 1 });
    const r = await runJob({
      type: "set-info",
      source: { bytes: buf(a) },
      removeXmp: true,
      meta: { title: "Новый заголовок", author: "Иванов И. И.", subject: "", keywords: "отчёт, 2025", creator: "", producer: "", created: "2024-01-02T03:04:05.000Z", modified: "" },
    });
    expect(r.info).toMatchObject({ title: "Новый заголовок", author: "Иванов И. И.", keywords: "отчёт, 2025", producer: "", created: "2024-01-02T03:04:05.000Z" });
  });

  it("fills a form with Cyrillic values and flattens it", async () => {
    const d = await PDFDocument.create();
    const page = d.addPage([400, 400]);
    const form = d.getForm();
    form.createTextField("name").addToPage(page, { x: 20, y: 300, width: 300, height: 30 });
    form.createCheckBox("agree").addToPage(page, { x: 20, y: 250, width: 20, height: 20 });
    const dd = form.createDropdown("city");
    dd.addOptions(["Алматы", "Астана"]);
    dd.addToPage(page, { x: 20, y: 200, width: 200, height: 30 });
    const src = await d.save();
    const fields = readForm(await PDFDocument.load(src));
    expect(fields.map((f) => [f.name, f.type])).toEqual([
      ["name", "text"],
      ["agree", "checkbox"],
      ["city", "dropdown"],
    ]);
    const r = await runJob({ type: "fill-form", source: { bytes: buf(src) }, values: { name: "Айгерим Сапарова", agree: true, city: "Астана" }, flatten: true, font: buf(FONT) });
    const out = await PDFDocument.load(r.files[0].bytes);
    expect(out.getForm().getFields()).toHaveLength(0);
    expect((await pdfText(r.files[0].bytes))[0]).toContain("Айгерим Сапарова");
  });
});

describe("images → PDF", () => {
  function png(w: number, h: number): Uint8Array {
    const chunk = (type: string, data: Buffer) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length);
      const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(td) >>> 0);
      return Buffer.concat([len, td, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;
    ihdr[9] = 2; // RGB
    const raw = Buffer.alloc((w * 3 + 1) * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.writeUIntBE((((x * 7) & 255) << 16) | (((y * 5) & 255) << 8) | ((x ^ y) & 255), y * (w * 3 + 1) + 1 + x * 3, 3);
    const phys = Buffer.alloc(9);
    phys.writeUInt32BE(11811, 0); // 300 DPI
    phys.writeUInt32BE(11811, 4);
    phys[8] = 1;
    return new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("pHYs", phys), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
  }

  it("embeds PNG losslessly with its physical size (600 px at 300 DPI = 2 in)", async () => {
    const r = await runJob({ type: "images", images: [{ bytes: buf(png(600, 300)), name: "a.png" }], layout: { page: "fit-image", margin: 0 } });
    const doc = await PDFDocument.load(r.files[0].bytes);
    const p = doc.getPage(0);
    expect(p.getWidth()).toBeCloseTo(144, 1);
    expect(p.getHeight()).toBeCloseTo(72, 1);
    const img = doc.context.enumerateIndirectObjects().map(([, o]) => o).find((o) => o instanceof PDFRawStream && o.dict.lookup(PDFName.of("Subtype")) === PDFName.of("Image")) as PDFRawStream;
    expect(img.dict.lookup(PDFName.of("Filter"))).toBe(PDFName.of("FlateDecode"));
    expect((img.dict.lookup(PDFName.of("Width")) as PDFNumber).asNumber()).toBe(600);
  });

  it("rejects unsupported images without a converter", async () => {
    await expect(runJob({ type: "images", images: [{ bytes: buf(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 xxxx")), name: "a.webp" }], layout: { page: "a4" } })).rejects.toBeInstanceOf(PdfError);
  });

  it("recompresses a Flate RGB image to a smaller JPEG and updates /Width /Height", async () => {
    const src = await runJob({ type: "images", images: [{ bytes: buf(png(1200, 800)), name: "a.png" }], layout: { page: "a4" } });
    const doc = await PDFDocument.load(src.files[0].bytes);
    const [ref, stream] = doc.context.enumerateIndirectObjects().find(([, o]) => o instanceof PDFRawStream && o.dict.lookup(PDFName.of("Subtype")) === PDFName.of("Image")) as [unknown, PDFRawStream];
    expect(classifyImage(stream, doc)).toMatchObject({ kind: "flate", width: 1200, height: 800, components: 3 });
    const seen: { w: number; h: number }[] = [];
    const codec: ImageCodec = {
      decodeJpeg: async () => ({ width: 1, height: 1 }),
      fromPixels: async (rgba, width, height) => {
        expect(rgba.length).toBe(width * height * 4);
        return { width, height };
      },
      encodeJpeg: async (_b, w, h) => {
        seen.push({ w, h });
        return new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0xff, 0xd9]);
      },
    };
    const stats = await recompressImages(doc, codec, { quality: 0.6, maxSide: 600 });
    expect(stats.changed).toBe(1);
    expect(seen).toEqual([{ w: 600, h: 400 }]);
    const replaced = doc.context.lookup(ref as never) as PDFRawStream;
    expect(replaced.dict.lookup(PDFName.of("Filter"))).toBe(PDFName.of("DCTDecode"));
    expect((replaced.dict.lookup(PDFName.of("Width")) as PDFNumber).asNumber()).toBe(600);
    expect((replaced.dict.lookup(PDFName.of("Height")) as PDFNumber).asNumber()).toBe(400);
  });

  it("undoes PNG predictors", () => {
    // Two rows of 2 RGB pixels: row 0 "Sub", row 1 "Up".
    const data = new Uint8Array([1, 10, 20, 30, 5, 5, 5, 2, 1, 1, 1, 1, 1, 1]);
    expect(Array.from(unpredictPng(data, 3, 6))).toEqual([10, 20, 30, 15, 25, 35, 11, 21, 31, 16, 26, 36]);
  });
});

describe("lossless optimisation", () => {
  it("removes orphaned objects, compresses raw streams, merges duplicates and keeps the content", async () => {
    const d = await PDFDocument.create();
    const font = await d.embedFont(StandardFonts.Helvetica);
    d.addPage([300, 300]).drawText("Same", { x: 10, y: 10, size: 12, font });
    const big = new TextEncoder().encode("0 0 m 100 100 l S\n".repeat(400));
    // Orphan and two identical uncompressed streams used as XObjects.
    d.context.register(d.context.stream(new Uint8Array(5000)));
    const s1 = d.context.register(d.context.stream(big, { Type: "XObject", Subtype: "Form", BBox: [0, 0, 100, 100] }));
    const s2 = d.context.register(d.context.stream(big, { Type: "XObject", Subtype: "Form", BBox: [0, 0, 100, 100] }));
    const res = d.getPage(0).node.Resources()!;
    res.set(PDFName.of("XObject"), d.context.obj({ F1: s1, F2: s2 }));
    const bytes = await d.save({ useObjectStreams: false });

    const doc = await openPdf(bytes);
    const stats = await optimizeLossless(doc);
    expect(stats.mergedDuplicates).toBeGreaterThanOrEqual(1);
    expect(stats.compressedStreams).toBeGreaterThanOrEqual(1);
    expect(stats.removedObjects).toBeGreaterThanOrEqual(1);
    const out = await doc.save({ useObjectStreams: true });
    expect(out.length).toBeLessThan(bytes.length / 2);
    expect(await pdfText(out)).toEqual(["Same"]);
    // Saved with a classic xref table, the optimized file has nothing left to collect.
    expect(collectGarbage(await PDFDocument.load(await doc.save({ useObjectStreams: false })))).toBe(0);
  });

  it("reports page geometry with CropBox and rotation", async () => {
    const d = await PDFDocument.create();
    const p = d.addPage([600, 800]);
    p.setCropBox(50, 50, 500, 700);
    p.setRotation(degrees(90));
    expect(pageGeometry(p)).toMatchObject({ crop: { x: 50, y: 50, width: 500, height: 700 }, rotate: 90, width: 700, height: 500 });
    expect(readInfo(d).firstPage).toEqual({ width: 700, height: 500 });
  });
});
