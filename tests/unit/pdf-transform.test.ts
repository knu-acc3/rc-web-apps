import { PDFDict, PDFDocument, PDFName, StandardFonts, degrees } from "@cantoo/pdf-lib";
import { join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { PAPER } from "@/sections/pdf/engine/geometry";
import { runJob } from "@/sections/pdf/engine/run";
import { cropRect, resizePlacement, targetSize } from "@/sections/pdf/engine/transform";

const STD_FONTS = join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/").replace(/\\/g, "/");

async function makePdf(pages: { size: [number, number]; rotate?: number }[]): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  pages.forEach((p, i) => {
    const page = doc.addPage(p.size);
    page.drawText(`Page ${i + 1}`, { x: 40, y: 50, size: 20, font });
    page.drawRectangle({ x: 10, y: 10, width: 30, height: 30, color: { type: "RGB", red: 1, green: 0, blue: 0 } as never });
    if (p.rotate) page.setRotation(degrees(p.rotate));
  });
  return (await doc.save()).slice().buffer;
}

async function inspect(bytes: Uint8Array) {
  const doc = await getDocument({ data: bytes.slice(), standardFontDataUrl: STD_FONTS }).promise;
  const out: { view: number[]; rotate: number; text: string; tx: number[] }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const item = tc.items.find((x) => "str" in x && x.str.trim()) as { str: string; transform: number[] } | undefined;
    out.push({ view: page.view, rotate: page.rotate, text: item?.str ?? "", tx: item?.transform ?? [] });
  }
  return out;
}

describe("pdf transforms", () => {
  it("mirrors the page horizontally and keeps the text", async () => {
    const src = await makePdf([{ size: [400, 600] }]);
    const r = await runJob({ type: "transform", source: { bytes: src }, op: { kind: "flip", axis: "h" } });
    const [p] = await inspect(r.files[0].bytes);
    expect(p.text).toBe("Page 1");
    expect(p.tx[0]).toBeLessThan(0); // mirrored text matrix
    expect(p.tx[4]).toBeCloseTo(400 - 40, 0);
  });

  it("mirrors vertically", async () => {
    const src = await makePdf([{ size: [400, 600] }]);
    const r = await runJob({ type: "transform", source: { bytes: src }, op: { kind: "flip", axis: "v" } });
    const [p] = await inspect(r.files[0].bytes);
    expect(p.tx[3]).toBeLessThan(0);
    expect(p.tx[5]).toBeCloseTo(600 - 50, 0);
  });

  it("makes pages grayscale with a blend overlay, text stays text", async () => {
    const src = await makePdf([{ size: [400, 600] }, { size: [300, 300] }]);
    const r = await runJob({ type: "transform", source: { bytes: src }, op: { kind: "gray" } });
    const doc = await PDFDocument.load(r.files[0].bytes);
    expect(doc.getPageCount()).toBe(2);
    const gs = doc.getPage(0).node.Resources()!.lookup(PDFName.of("ExtGState"), PDFDict);
    const modes = gs.values().map((v) => (doc.context.lookup(v, PDFDict).get(PDFName.of("BM")) as PDFName | undefined)?.asString());
    expect(modes).toContain("/Saturation");
    expect((await inspect(r.files[0].bytes))[1].text).toBe("Page 2");
  });

  it("crops margins as the page is displayed", async () => {
    const src = await makePdf([{ size: [400, 600] }]);
    const r = await runJob({ type: "transform", source: { bytes: src }, op: { kind: "crop", margins: [100, 20, 30, 10] } });
    const [p] = await inspect(r.files[0].bytes);
    expect(p.view).toEqual([10, 30, 380, 500]);
  });

  it("crops a rotated page in visual terms", async () => {
    const src = await makePdf([{ size: [400, 600], rotate: 90 }]);
    // Displayed 600 wide × 400 tall; cut 50 from the displayed top.
    const r = await runJob({ type: "transform", source: { bytes: src }, op: { kind: "crop", margins: [50, 0, 0, 0] } });
    const [p] = await inspect(r.files[0].bytes);
    const w = p.view[2] - p.view[0];
    const h = p.view[3] - p.view[1];
    expect(p.rotate).toBe(90);
    // With /Rotate 90 the displayed top is the user-space left edge.
    expect([w, h]).toEqual([350, 600]);
    expect(p.view[0]).toBe(50);
  });

  it("auto-crop boxes are fractions of the displayed page", () => {
    expect(cropRect(400, 600, [0, 0, 0, 0], [0.1, 0.25, 0.9, 0.75])).toEqual({ x: 40, y: 150, width: 320, height: 300 });
  });

  it("resizes any page to A4 and centres the content", async () => {
    const src = await makePdf([{ size: [612, 792] }, { size: [800, 500] }, { size: [300, 400], rotate: 90 }]);
    const r = await runJob({ type: "transform", source: { bytes: src }, op: { kind: "resize", paper: "a4", orientation: "auto", margin: 0, scale: true } });
    const pages = await inspect(r.files[0].bytes);
    const [w, h] = PAPER.a4;
    expect(pages[0].view.map((v) => Math.round(v))).toEqual([0, 0, Math.round(w), Math.round(h)]);
    expect(pages[1].view.map((v) => Math.round(v))).toEqual([0, 0, Math.round(h), Math.round(w)]); // landscape source → landscape A4
    expect(pages[2].rotate).toBe(0);
    expect(pages[2].view.map((v) => Math.round(v))).toEqual([0, 0, Math.round(h), Math.round(w)]); // displayed 400×300 → landscape
    expect(pages.every((p) => p.text.startsWith("Page"))).toBe(true);
  });

  it("places pages without scaling when asked", () => {
    expect(resizePlacement({ width: 100, height: 100 }, { width: 200, height: 300 }, 0, false)).toEqual({ s: 1, tx: 50, ty: 100 });
    expect(targetSize("a4", "portrait", { width: 900, height: 100 })).toEqual({ width: PAPER.a4[0], height: PAPER.a4[1] });
  });

  it("previews one page", async () => {
    const src = await makePdf([{ size: [400, 600] }, { size: [300, 300] }]);
    const r = await runJob({ type: "transform", source: { bytes: src }, op: { kind: "invert" }, preview: 1 });
    const doc = await PDFDocument.load(r.files[0].bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getSize()).toEqual({ width: 300, height: 300 });
  });
});
