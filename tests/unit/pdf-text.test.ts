import JSZip from "jszip";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { buildDocx, docxDocumentXml, pageParagraphs, sanitizeText, toMarkdown, toPlainText, type TextItemLike } from "@/sections/pdf/engine/text";

const item = (str: string, x: number, y: number, width: number, size = 10, hasEOL = false): TextItemLike => ({ str, transform: [size, 0, 0, size, x, y], width, height: size, hasEOL });

describe("sanitizeText", () => {
  it("removes control characters Word refuses, keeps newlines and tabs", () => {
    expect(sanitizeText("a\u0000b\u0007c\u000Bd\u001Fe\u0080f")).toBe("abcdef");
    expect(sanitizeText("line1\nline2\tx")).toBe("line1\nline2\tx");
    expect(sanitizeText("soft­hyphen")).toBe("softhyphen");
  });

  it("drops unpaired surrogates but keeps emoji", () => {
    expect(sanitizeText("x\uD800y")).toBe("xy");
    expect(sanitizeText("😀")).toBe("😀");
  });
});

describe("pageParagraphs", () => {
  it("joins fragments of one word without inserting spaces", () => {
    // "Привет" split into "При" + "вет" that touch; then a real gap before "мир".
    const items = [item("При", 10, 700, 17), item("вет", 27, 700, 18), item("мир", 50, 700, 18, 10, true)];
    expect(pageParagraphs(items)).toEqual([["Привет мир"]]);
  });

  it("breaks lines by hasEOL and baseline, paragraphs by larger gaps", () => {
    const items = [
      item("First line", 10, 700, 50, 10, true),
      item("second line", 10, 688, 55, 10, true),
      item("New paragraph", 10, 650, 60, 10, true),
    ];
    expect(pageParagraphs(items)).toEqual([["First line", "second line"], ["New paragraph"]]);
  });

  it("ignores marked-content entries and empty strings", () => {
    const items = [{ type: "beginMarkedContent" }, item("", 0, 0, 0, 10, true), item("Text", 10, 700, 20)];
    expect(pageParagraphs(items)).toEqual([["Text"]]);
  });
});

describe("outputs", () => {
  const pages = [[["Заголовок"], ["# not a heading", "1. not a list"]], [["Page two & <tags>"]]];

  it("plain text separates pages and paragraphs", () => {
    expect(toPlainText(pages)).toBe("Заголовок\n\n# not a heading\n1. not a list\n\n\nPage two & <tags>");
  });

  it("markdown escapes block markers and labels pages", () => {
    const md = toMarkdown(pages, (n) => `Страница ${n}`);
    expect(md).toContain("## Страница 1");
    expect(md).toContain("\\# not a heading");
    expect(md).toContain("1\\. not a list");
  });

  it("docx XML escapes entities and inserts page breaks", () => {
    const x = docxDocumentXml(pages);
    expect(x).toContain("Page two &amp; &lt;tags&gt;");
    expect(x).toContain('<w:br w:type="page"/>');
    expect(x).not.toMatch(/[\u0000-\u0008]/);
  });

  it("builds a zip with the required parts", async () => {
    const bytes = await buildDocx<Uint8Array>(new JSZip(), pages, "uint8array");
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(["[Content_Types].xml", "_rels/", "_rels/.rels", "word/", "word/_rels/", "word/_rels/document.xml.rels", "word/document.xml", "word/styles.xml"]);
    expect(await zip.file("word/document.xml")!.async("string")).toContain("Заголовок");
  });
});

describe("real pdf.js items", () => {
  it("extracts a generated page line by line", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([400, 400]);
    page.drawText("Hello world", { x: 20, y: 350, size: 14, font });
    page.drawText("Second line", { x: 20, y: 332, size: 14, font });
    page.drawText("Far paragraph", { x: 20, y: 250, size: 14, font });
    const pdf = await getDocument({ data: await doc.save(), isEvalSupported: false }).promise;
    const tc = await (await pdf.getPage(1)).getTextContent();
    expect(pageParagraphs(tc.items as TextItemLike[])).toEqual([["Hello world", "Second line"], ["Far paragraph"]]);
    await pdf.loadingTask.destroy();
  });
});
