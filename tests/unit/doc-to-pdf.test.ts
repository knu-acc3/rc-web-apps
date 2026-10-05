import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseMarkdown, parsePlainText, parseRtf, renderDocToPdf } from "@/sections/pdf/engine/doc-to-pdf";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const FONT = readFileSync(join(process.cwd(), "src/sections/pdf/assets/NotoSans-Regular.ttf"));
const STD_FONTS = join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/").replace(/\\/g, "/");

async function pdfText(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocument({ data: bytes.slice(), standardFontDataUrl: STD_FONTS }).promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    out.push(tc.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  await doc.loadingTask.destroy();
  return out;
}

describe("doc-to-pdf engine", () => {
  it("parses plain text and generates a valid PDF with Russian unicode text", async () => {
    const text = "Заголовок документа\n\nЭто первый абзац с русским текстом.\n\nВторой абзац с проверкой.";
    const blocks = parsePlainText(text);
    expect(blocks.length).toBe(3);

    const pdfBytes = await renderDocToPdf(blocks, {
      fontBytes: FONT,
      paper: "a4",
      locale: "ru",
    });

    expect(pdfBytes.length).toBeGreaterThan(1000);
    const extracted = await pdfText(pdfBytes);
    expect(extracted.length).toBe(1);
    expect(extracted[0]).toContain("Заголовок");
    expect(extracted[0]).toContain("русским");
    expect(extracted[0]).toContain("Страница 1 из 1");
  });

  it("parses markdown with headings, lists, tables and generates multi-page PDF if needed", async () => {
    const md = `
# Главный заголовок
## Подзаголовок документа

Это обычный текст абзаца в markdown документе.

- Первый пункт списка
- Второй пункт списка
- Третий пункт списка

| Параметр | Значение |
| --- | --- |
| Формат | PDF |
| Качество | Высокое |
`;

    const blocks = parseMarkdown(md);
    expect(blocks.some((b) => b.type === "heading" && b.level === 1)).toBe(true);
    expect(blocks.some((b) => b.type === "list-item")).toBe(true);
    expect(blocks.some((b) => b.type === "table")).toBe(true);

    const pdfBytes = await renderDocToPdf(blocks, {
      fontBytes: FONT,
      paper: "a4",
      locale: "ru",
    });

    expect(pdfBytes.length).toBeGreaterThan(1000);
    const extracted = await pdfText(pdfBytes);
    expect(extracted[0]).toContain("Главный заголовок");
    expect(extracted[0]).toContain("Первый пункт списка");
  });

  it("parses RTF with Russian Cyrillic hex escapes", () => {
    // RTF for "Привет мир"
    const rtf = "{\\rtf1\\ansi\\ansicpg1251\\deff0{\\fonttbl{\\f0\\fnil\\fcharset204 Arial;}}\\viewkind4\\uc1\\pard\\lang1049\\f0\\fs20 \\'cf\\'f0\\'e8\\'e2\\'e5\\'f2 \\'ec\\'e8\\'f0\\par}";
    const blocks = parseRtf(rtf);
    expect(blocks.length).toBeGreaterThan(0);
    const combined = blocks.map((b) => ("text" in b ? b.text : "")).join(" ");
    expect(combined).toContain("Привет");
    expect(combined).toContain("мир");
  });

  it("parses DOCX mock zip with headings and paragraphs", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Договор оказания услуг</w:t></w:r></w:p>
    <w:p><w:r><w:t>Заказчик и Исполнитель заключили настоящий договор.</w:t></w:r></w:p>
  </w:body>
</w:document>`;
    zip.file("word/document.xml", docXml);
    const docxBuf = await zip.generateAsync({ type: "nodebuffer" });

    const { parseDocx } = await import("@/sections/pdf/engine/doc-to-pdf");
    const blocks = await parseDocx(docxBuf);
    expect(blocks.length).toBe(2);
    expect(blocks[0].type).toBe("heading");
    expect((blocks[0] as { type: string; text: string }).text).toBe("Договор оказания услуг");
    expect(blocks[1].type).toBe("paragraph");
    expect((blocks[1] as { type: string; text: string }).text).toContain("Заказчик");
  });
});
