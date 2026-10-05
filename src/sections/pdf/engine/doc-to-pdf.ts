import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "@cantoo/pdf-lib";
import { mmToPt, PAPER, type PaperId } from "./geometry";
import { textFont } from "./pdf-ops";

export type DocBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string; bold?: boolean; italic?: boolean }
  | { type: "list-item"; ordered?: boolean; index?: number; text: string }
  | { type: "table"; rows: string[][] }
  | { type: "code"; text: string }
  | { type: "hr" }
  | { type: "image"; bytes: Uint8Array; format: "png" | "jpeg" };

export interface DocPdfOptions {
  title?: string;
  paper?: PaperId;
  orientation?: "portrait" | "landscape";
  marginMm?: number;
  fontSize?: number;
  lineSpacing?: number;
  showPageNumbers?: boolean;
  locale?: "ru" | "en";
  fontBytes?: Uint8Array | ArrayBuffer | null;
}

/* ───────────── Parsers for different document types ───────────── */

/** Unescape XML entities */
function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/** Parse Word .docx via JSZip */
export async function parseDocx(buffer: ArrayBuffer | Uint8Array): Promise<DocBlock[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("text");
  if (!docXml) throw new Error("Invalid .docx file: word/document.xml not found");

  const blocks: DocBlock[] = [];

  // Match paragraphs and tables in sequence
  const bodyMatches = docXml.match(/<(w:p|w:tbl)[\s>][\s\S]*?<\/\1>/g) || [];

  for (const blockXml of bodyMatches) {
    if (blockXml.startsWith("<w:tbl")) {
      // Table
      const rows: string[][] = [];
      const trMatches = blockXml.match(/<w:tr[\s>][\s\S]*?<\/w:tr>/g) || [];
      for (const trXml of trMatches) {
        const cells: string[] = [];
        const tcMatches = trXml.match(/<w:tc[\s>][\s\S]*?<\/w:tc>/g) || [];
        for (const tcXml of tcMatches) {
          const textMatches = tcXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          const cellText = textMatches
            .map((t) => unescapeXml(t.replace(/<[^>]+>/g, "")))
            .join("")
            .trim();
          cells.push(cellText);
        }
        if (cells.length > 0) rows.push(cells);
      }
      if (rows.length > 0) {
        blocks.push({ type: "table", rows });
      }
    } else {
      // Paragraph
      const isHeading1 = /<w:pStyle\s+[^>]*w:val="Heading1"/i.test(blockXml) || /<w:pStyle\s+[^>]*w:val="1"/i.test(blockXml);
      const isHeading2 = /<w:pStyle\s+[^>]*w:val="Heading2"/i.test(blockXml) || /<w:pStyle\s+[^>]*w:val="2"/i.test(blockXml);
      const isHeading3 = /<w:pStyle\s+[^>]*w:val="Heading3"/i.test(blockXml) || /<w:pStyle\s+[^>]*w:val="3"/i.test(blockXml);
      const isListItem = /<w:numPr[\s>]/i.test(blockXml);

      // Extract text inside runs
      const tMatches = blockXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const text = tMatches
        .map((t) => unescapeXml(t.replace(/<[^>]+>/g, "")))
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim();

      if (!text) continue;

      if (isHeading1) {
        blocks.push({ type: "heading", level: 1, text });
      } else if (isHeading2) {
        blocks.push({ type: "heading", level: 2, text });
      } else if (isHeading3) {
        blocks.push({ type: "heading", level: 3, text });
      } else if (isListItem) {
        blocks.push({ type: "list-item", text });
      } else {
        blocks.push({ type: "paragraph", text });
      }
    }
  }

  return blocks;
}

/** Parse OpenDocument .odt via JSZip */
export async function parseOdt(buffer: ArrayBuffer | Uint8Array): Promise<DocBlock[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const contentXml = await zip.file("content.xml")?.async("text");
  if (!contentXml) throw new Error("Invalid .odt file: content.xml not found");

  const blocks: DocBlock[] = [];
  const matches = contentXml.match(/<(text:h|text:p|table:table)[\s>][\s\S]*?<\/\1>/g) || [];

  for (const xml of matches) {
    if (xml.startsWith("<text:h")) {
      const levelMatch = xml.match(/text:outline-level="(\d)"/);
      const level = (levelMatch ? Math.min(3, Math.max(1, Number(levelMatch[1]))) : 1) as 1 | 2 | 3;
      const text = unescapeXml(xml.replace(/<[^>]+>/g, "")).trim();
      if (text) blocks.push({ type: "heading", level, text });
    } else if (xml.startsWith("<table:table")) {
      const rows: string[][] = [];
      const trMatches = xml.match(/<table:table-row[\s>][\s\S]*?<\/table:table-row>/g) || [];
      for (const tr of trMatches) {
        const cells: string[] = [];
        const tcMatches = tr.match(/<table:table-cell[\s>][\s\S]*?<\/table:table-cell>/g) || [];
        for (const tc of tcMatches) {
          cells.push(unescapeXml(tc.replace(/<[^>]+>/g, "")).trim());
        }
        if (cells.length > 0) rows.push(cells);
      }
      if (rows.length > 0) blocks.push({ type: "table", rows });
    } else {
      const text = unescapeXml(xml.replace(/<[^>]+>/g, "")).trim();
      if (text) blocks.push({ type: "paragraph", text });
    }
  }

  return blocks;
}

/** Decode RTF text with hex escapes (e.g. \'xx for Cyrillic / CP1251) */
export function parseRtf(rtf: string): DocBlock[] {
  // Extract text and paragraphs
  // Replace RTF escapes
  const clean = rtf
    // Convert hex escapes \'c0..\'ff (Windows-1251 Cyrillic)
    .replace(/\\\'([0-9a-fA-F]{2})/g, (_, hex) => {
      const code = parseInt(hex, 16);
      if (code >= 0xc0 && code <= 0xff) {
        // CP1251 Cyrillic mapping to Unicode
        return String.fromCharCode(0x0410 + (code - 0xc0));
      }
      if (code === 0xa8) return "Ё";
      if (code === 0xb8) return "ё";
      if (code === 0xa5) return "Ґ";
      if (code === 0xb4) return "ґ";
      if (code === 0xaa) return "Є";
      if (code === 0xba) return "є";
      if (code === 0xaf) return "Ї";
      if (code === 0xbf) return "ї";
      if (code === 0xb2) return "І";
      if (code === 0xb3) return "і";
      return String.fromCharCode(code);
    })
    // Convert \uN unicode escapes
    .replace(/\\u(-?\d+)\??/g, (_, dec) => {
      let code = Number(dec);
      if (code < 0) code += 65536;
      return String.fromCharCode(code);
    })
    // Translate \par and \line to newlines
    .replace(/\\par\b/g, "\n\n")
    .replace(/\\line\b/g, "\n")
    // Remove group font/color definitions
    .replace(/\{\\(?:fonttbl|colortbl|stylesheet|info)[\s\S]*?\}/g, "")
    // Remove other control words
    .replace(/\\[a-zA-Z]+-?\d* ?/g, "")
    .replace(/[{}]/g, "")
    .trim();

  return parsePlainText(clean);
}

/** Parse Markdown text */
export function parseMarkdown(text: string): DocBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: DocBlock[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      const rows = tableBuffer.map((line) =>
        line
          .split("|")
          .map((c) => c.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1),
      );
      // Remove separator row (---)
      const validRows = rows.filter((r) => !r.every((c) => /^[-:]+$/.test(c)));
      if (validRows.length > 0) blocks.push({ type: "table", rows: validRows });
      tableBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        blocks.push({ type: "code", text: codeBuffer.join("\n") });
        codeBuffer = [];
        inCode = false;
      } else {
        flushTable();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      tableBuffer.push(line.trim());
      continue;
    } else {
      flushTable();
    }

    // Headings
    if (/^###\s+/.test(line)) {
      blocks.push({ type: "heading", level: 3, text: line.replace(/^###\s+/, "").trim() });
    } else if (/^##\s+/.test(line)) {
      blocks.push({ type: "heading", level: 2, text: line.replace(/^##\s+/, "").trim() });
    } else if (/^#\s+/.test(line)) {
      blocks.push({ type: "heading", level: 1, text: line.replace(/^#\s+/, "").trim() });
    } else if (/^[-*]\s+/.test(line)) {
      blocks.push({ type: "list-item", text: line.replace(/^[-*]\s+/, "").trim() });
    } else if (/^\d+\.\s+/.test(line)) {
      blocks.push({ type: "list-item", ordered: true, text: line.replace(/^\d+\.\s+/, "").trim() });
    } else if (/^---+$/.test(line.trim()) || /^===+$/.test(line.trim())) {
      blocks.push({ type: "hr" });
    } else if (line.trim().length > 0) {
      blocks.push({ type: "paragraph", text: line.trim() });
    }
  }

  flushTable();
  return blocks;
}

/** Parse HTML document */
export function parseHtml(html: string): DocBlock[] {
  // Strip head, scripts, styles
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "");

  const blocks: DocBlock[] = [];
  const tagRegex = /<(h[1-3]|p|li|tr|pre|hr)(?: [^>]*)?>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(clean)) !== null) {
    const tag = (match[1] || "hr").toLowerCase();
    const content = match[2] ? unescapeXml(match[2].replace(/<[^>]+>/g, "")).trim() : "";

    if (tag === "h1") blocks.push({ type: "heading", level: 1, text: content });
    else if (tag === "h2") blocks.push({ type: "heading", level: 2, text: content });
    else if (tag === "h3") blocks.push({ type: "heading", level: 3, text: content });
    else if (tag === "li") blocks.push({ type: "list-item", text: content });
    else if (tag === "pre") blocks.push({ type: "code", text: content });
    else if (tag === "hr") blocks.push({ type: "hr" });
    else if (content) blocks.push({ type: "paragraph", text: content });
  }

  return blocks.length > 0 ? blocks : parsePlainText(clean.replace(/<[^>]+>/g, " "));
}

/** Parse Plain text / CSV / JSON / Logs */
export function parsePlainText(text: string, filename?: string): DocBlock[] {
  const isCsv = filename && /\.(csv|tsv)$/i.test(filename);
  if (isCsv) {
    const sep = filename.endsWith(".tsv") ? "\t" : ",";
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.map((l) => l.split(sep).map((c) => c.replace(/^["']|["']$/g, "").trim()));
    if (rows.length > 0) return [{ type: "table", rows }];
  }

  const isJson = filename && /\.json$/i.test(filename);
  if (isJson) {
    try {
      const parsed = JSON.parse(text);
      return [{ type: "code", text: JSON.stringify(parsed, null, 2) }];
    } catch {
      /* fallback */
    }
  }

  const paragraphs = text.split(/\r?\n\s*\r?\n/);
  const blocks: DocBlock[] = [];

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    // Check if bullet list
    if (trimmed.split("\n").every((l) => /^[-*•]\s+/.test(l.trim()))) {
      for (const line of trimmed.split("\n")) {
        blocks.push({ type: "list-item", text: line.replace(/^[-*•]\s+/, "").trim() });
      }
    } else {
      blocks.push({ type: "paragraph", text: trimmed.replace(/\r?\n/g, " ") });
    }
  }

  return blocks;
}

/** Legacy Word 97-2003 binary .doc parser (plain string extraction) */
export function parseBinaryDoc(buffer: ArrayBuffer | Uint8Array): DocBlock[] {
  const bytes = new Uint8Array(buffer);
  let str = "";
  // Check for UTF-16LE characters or ASCII
  for (let i = 0; i < bytes.length - 1; i += 2) {
    const charCode = bytes[i] | (bytes[i + 1] << 8);
    if ((charCode >= 32 && charCode <= 126) || (charCode >= 0x0400 && charCode <= 0x04ff)) {
      str += String.fromCharCode(charCode);
    } else if (charCode === 10 || charCode === 13) {
      str += "\n";
    }
  }
  // If UTF-16 didn't find much, try ASCII/CP1251
  if (str.length < 50) {
    str = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b >= 192) {
        str += String.fromCharCode(b);
      } else if (b === 10 || b === 13) {
        str += "\n";
      }
    }
  }
  return parsePlainText(str);
}

/** Master file dispatcher */
export async function parseDocument(file: { name: string; bytes: ArrayBuffer | Uint8Array }): Promise<{ title: string; blocks: DocBlock[] }> {
  const name = file.name;
  const ext = name.toLowerCase().split(".").pop() || "";
  let blocks: DocBlock[] = [];

  if (ext === "docx") {
    blocks = await parseDocx(file.bytes);
  } else if (ext === "odt") {
    blocks = await parseOdt(file.bytes);
  } else if (ext === "rtf") {
    const text = new TextDecoder("utf-8").decode(file.bytes);
    blocks = parseRtf(text);
  } else if (ext === "doc") {
    blocks = parseBinaryDoc(file.bytes);
  } else if (ext === "md" || ext === "markdown") {
    const text = new TextDecoder("utf-8").decode(file.bytes);
    blocks = parseMarkdown(text);
  } else if (ext === "html" || ext === "htm") {
    const text = new TextDecoder("utf-8").decode(file.bytes);
    blocks = parseHtml(text);
  } else if (/^(jpg|jpeg|png|webp|avif|gif|bmp)$/i.test(ext)) {
    blocks = [{ type: "image", bytes: new Uint8Array(file.bytes), format: ext.toLowerCase().includes("png") ? "png" : "jpeg" }];
  } else {
    // Default: text/csv/tsv/json/code
    const text = new TextDecoder("utf-8").decode(file.bytes);
    blocks = parsePlainText(text, name);
  }

  const baseTitle = name.replace(/\.[^/.]+$/, "");
  return { title: baseTitle, blocks };
}

/* ───────────── PDF Layout & Rendering Engine ───────────── */

/** Split string into wrapped lines that fit maxWidth */
function wrapLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let width = 0;
    try {
      width = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      width = testLine.length * (fontSize * 0.55);
    }

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      // Check if word itself exceeds maxWidth
      let wordWidth = 0;
      try {
        wordWidth = font.widthOfTextAtSize(word, fontSize);
      } catch {
        wordWidth = word.length * (fontSize * 0.55);
      }

      if (wordWidth > maxWidth) {
        // Break long word by character
        let chunk = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(chunk + char, fontSize) <= maxWidth) {
            chunk += char;
          } else {
            if (chunk) lines.push(chunk);
            chunk = char;
          }
        }
        currentLine = chunk;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Render blocks to PDF bytes */
export async function renderDocToPdf(blocks: DocBlock[], options: DocPdfOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Load unicode font (NotoSans) if provided, otherwise fallback to StandardFonts
  let font: PDFFont;
  if (options.fontBytes) {
    font = await textFont(doc, "\u0410", options.fontBytes);
  } else {
    font = await doc.embedFont(StandardFonts.Helvetica);
  }

  const paperKey = options.paper ?? "a4";
  const baseDim = PAPER[paperKey] ?? PAPER.a4;
  const isLandscape = options.orientation === "landscape";
  const pageW = isLandscape ? baseDim[1] : baseDim[0];
  const pageH = isLandscape ? baseDim[0] : baseDim[1];

  const margin = mmToPt(options.marginMm ?? 15);
  const contentW = pageW - 2 * margin;
  const fontSize = options.fontSize ?? 11;
  const lineSpacing = options.lineSpacing ?? 1.35;
  const lineHeight = fontSize * lineSpacing;
  const footerMargin = mmToPt(10);

  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  const checkPageBreak = (neededPt: number) => {
    if (y - neededPt < margin + footerMargin) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
  };

  // Safe draw text helper
  const drawTextSafe = (p: PDFPage, txt: string, xPos: number, yPos: number, size: number, color = rgb(0.1, 0.1, 0.1)) => {
    try {
      p.drawText(txt, { x: xPos, y: yPos, size, font, color });
    } catch {
      // If characters cannot be encoded, sanitizeWinAnsi
      const sanitized = txt.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
      try {
        p.drawText(sanitized, { x: xPos, y: yPos, size, font, color });
      } catch {
        /* ignore */
      }
    }
  };

  for (const block of blocks) {
    if (block.type === "heading") {
      const hSize = block.level === 1 ? fontSize * 1.6 : block.level === 2 ? fontSize * 1.3 : fontSize * 1.15;
      const hLineH = hSize * 1.25;
      const topGap = hSize * 0.8;
      const bottomGap = hSize * 0.4;

      const lines = wrapLines(block.text, font, hSize, contentW);
      checkPageBreak(topGap + lines.length * hLineH + bottomGap);
      y -= topGap;

      for (const line of lines) {
        drawTextSafe(page, line, margin, y, hSize, rgb(0.05, 0.05, 0.05));
        y -= hLineH;
      }
      y -= bottomGap;
    } else if (block.type === "paragraph") {
      const lines = wrapLines(block.text, font, fontSize, contentW);
      checkPageBreak(lineHeight);

      for (const line of lines) {
        checkPageBreak(lineHeight);
        drawTextSafe(page, line, margin, y, fontSize, rgb(0.15, 0.15, 0.15));
        y -= lineHeight;
      }
      y -= lineHeight * 0.5; // paragraph spacing
    } else if (block.type === "list-item") {
      const bullet = block.ordered ? `${(block.index ?? 1)}. ` : "• ";
      const bulletW = font.widthOfTextAtSize(bullet, fontSize) + 4;
      const lines = wrapLines(block.text, font, fontSize, contentW - bulletW);

      checkPageBreak(lines.length * lineHeight);
      drawTextSafe(page, bullet, margin, y, fontSize, rgb(0.2, 0.2, 0.2));

      for (let i = 0; i < lines.length; i++) {
        drawTextSafe(page, lines[i], margin + bulletW, y, fontSize, rgb(0.15, 0.15, 0.15));
        y -= lineHeight;
        if (i < lines.length - 1) checkPageBreak(lineHeight);
      }
      y -= lineHeight * 0.25;
    } else if (block.type === "table") {
      const colCount = Math.max(...block.rows.map((r) => r.length), 1);
      const colW = contentW / colCount;
      const cellPad = 4;
      const cellLineH = fontSize * 1.2;

      for (let rIdx = 0; rIdx < block.rows.length; rIdx++) {
        const row = block.rows[rIdx];
        const isHeader = rIdx === 0;

        // Calculate max lines in this row
        let maxLines = 1;
        const cellLinesArr: string[][] = [];
        for (let cIdx = 0; cIdx < colCount; cIdx++) {
          const text = row[cIdx] || "";
          const lines = wrapLines(text, font, fontSize * 0.95, colW - cellPad * 2);
          cellLinesArr.push(lines);
          if (lines.length > maxLines) maxLines = lines.length;
        }

        const rowH = maxLines * cellLineH + cellPad * 2;
        checkPageBreak(rowH);

        // Draw row background for header
        if (isHeader) {
          page.drawRectangle({
            x: margin,
            y: y - rowH + cellPad,
            width: contentW,
            height: rowH,
            color: rgb(0.93, 0.93, 0.95),
          });
        }

        // Draw cells and borders
        for (let cIdx = 0; cIdx < colCount; cIdx++) {
          const cx = margin + cIdx * colW;
          const lines = cellLinesArr[cIdx];

          // Text inside cell
          let textY = y - cellPad - fontSize * 0.8;
          for (const line of lines) {
            drawTextSafe(page, line, cx + cellPad, textY, fontSize * 0.95, isHeader ? rgb(0, 0, 0) : rgb(0.15, 0.15, 0.15));
            textY -= cellLineH;
          }

          // Cell border
          page.drawRectangle({
            x: cx,
            y: y - rowH + cellPad,
            width: colW,
            height: rowH,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
          });
        }

        y -= rowH;
      }
      y -= lineHeight * 0.5;
    } else if (block.type === "code") {
      const lines = block.text.split("\n");
      const codeFontSize = fontSize * 0.85;
      const codeLineH = codeFontSize * 1.35;
      const boxH = lines.length * codeLineH + 8;

      checkPageBreak(Math.min(boxH, 100));

      page.drawRectangle({
        x: margin,
        y: y - boxH + 8,
        width: contentW,
        height: boxH,
        color: rgb(0.96, 0.96, 0.97),
        borderColor: rgb(0.88, 0.88, 0.9),
        borderWidth: 0.5,
      });

      y -= 4;
      for (const line of lines) {
        checkPageBreak(codeLineH);
        drawTextSafe(page, line, margin + 6, y - codeFontSize * 0.8, codeFontSize, rgb(0.2, 0.2, 0.25));
        y -= codeLineH;
      }
      y -= lineHeight * 0.5;
    } else if (block.type === "hr") {
      checkPageBreak(lineHeight);
      y -= lineHeight * 0.3;
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageW - margin, y },
        color: rgb(0.8, 0.8, 0.8),
        thickness: 0.75,
      });
      y -= lineHeight * 0.5;
    } else if (block.type === "image") {
      try {
        let pdfImage;
        if (block.format === "png") {
          pdfImage = await doc.embedPng(block.bytes);
        } else {
          pdfImage = await doc.embedJpg(block.bytes);
        }
        const imgRatio = pdfImage.width / pdfImage.height;
        let drawW = contentW;
        let drawH = drawW / imgRatio;

        const maxAvailableH = pageH - 2 * margin - footerMargin;
        if (drawH > maxAvailableH) {
          drawH = maxAvailableH;
          drawW = drawH * imgRatio;
        }

        checkPageBreak(drawH + lineHeight);
        const imgX = margin + (contentW - drawW) / 2;
        page.drawImage(pdfImage, { x: imgX, y: y - drawH, width: drawW, height: drawH });
        y -= drawH + lineHeight * 0.5;
      } catch {
        /* ignore invalid image bytes */
      }
    }
  }

  // Second pass: Draw page numbers (if enabled)
  if (options.showPageNumbers !== false) {
    const pages = doc.getPages();
    const total = pages.length;
    const isRu = options.locale !== "en";

    for (let i = 0; i < total; i++) {
      const p = pages[i];
      const pageNumText = isRu ? `Страница ${i + 1} из ${total}` : `Page ${i + 1} of ${total}`;
      const numSize = 9;
      let textW = 0;
      try {
        textW = font.widthOfTextAtSize(pageNumText, numSize);
      } catch {
        textW = pageNumText.length * 5;
      }
      const numX = (pageW - textW) / 2;
      drawTextSafe(p, pageNumText, numX, footerMargin * 0.8, numSize, rgb(0.5, 0.5, 0.5));
    }
  }

  return doc.save();
}
