/**
 * Turning pdf.js text items into readable text, Markdown and a simple DOCX.
 * Items are joined by their positions (same baseline → same line, a space only
 * where there is a visible gap), so words split into several fragments by the
 * PDF generator are not torn apart.
 */

export interface TextItemLike {
  str: string;
  /** [a, b, c, d, e, f] text matrix in page units. */
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

/** Remove characters that are invalid in XML/Word and other control codes (keeps \n and \t). */
export function sanitizeText(s: string): string {
  const cleaned = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F­￾￿]/g, "");
  if (!/[\uD800-\uDFFF]/.test(cleaned)) return cleaned;
  // Drop unpaired surrogates (invalid in XML).
  let out = "";
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = cleaned.charCodeAt(i + 1);
      if (n >= 0xdc00 && n <= 0xdfff) {
        out += cleaned[i] + cleaned[i + 1];
        i++;
      }
    } else if (c < 0xdc00 || c > 0xdfff) {
      out += cleaned[i];
    }
  }
  return out;
}

interface Line {
  text: string;
  x0: number;
  x1: number;
  y: number;
  size: number;
}

/**
 * Group the text items of ONE page into paragraphs (arrays of lines).
 * Reading order follows the content stream, which keeps multi-column layouts
 * column by column.
 */
export function pageParagraphs(items: readonly (TextItemLike | { type: string })[]): string[][] {
  const lines: Line[] = [];
  let cur: Line | null = null;
  const flush = () => {
    if (cur && cur.text.trim()) lines.push({ ...cur, text: cur.text.replace(/[ \t]+/g, " ").trim() });
    cur = null;
  };
  for (const raw of items) {
    if (!("str" in raw)) continue;
    const it = raw as TextItemLike;
    const [a, b, c, d, e, f] = it.transform;
    const size = Math.hypot(c, d) || Math.hypot(a, b) || it.height || 10;
    const str = sanitizeText(it.str);
    const horizontal = Math.abs(b) < 1e-3 && Math.abs(c) < 1e-3;
    if (str) {
      if (cur && horizontal && Math.abs(f - cur.y) < size * 0.5 && e > cur.x0 - size) {
        const gap = e - cur.x1;
        if (gap < -size * 2) {
          flush();
        } else {
          const needSpace = gap > size * 0.12 && !/\s$/.test(cur.text) && !/^\s/.test(str);
          cur.text += (needSpace ? " " : "") + str;
          cur.x1 = Math.max(cur.x1, e + it.width);
          cur.size = Math.max(cur.size, size);
        }
      } else if (cur && !horizontal) {
        cur.text += str;
      } else {
        flush();
      }
      if (!cur) cur = { text: str, x0: e, x1: e + it.width, y: f, size };
    }
    if (it.hasEOL) flush();
  }
  flush();

  const paragraphs: string[][] = [];
  let para: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const prev = lines[i - 1];
    if (prev) {
      const dy = prev.y - l.y;
      const lineGap = Math.max(prev.size, l.size);
      if (dy > lineGap * 1.9 || dy < -lineGap * 0.5) {
        if (para.length) paragraphs.push(para);
        para = [];
      }
    }
    para.push(l.text);
  }
  if (para.length) paragraphs.push(para);
  return paragraphs;
}

export type PageText = string[][];

/** Paragraphs separated by a blank line, pages by two. */
export function toPlainText(pages: readonly PageText[]): string {
  return pages
    .map((p) => p.map((para) => para.join("\n")).join("\n\n"))
    .filter(Boolean)
    .join("\n\n\n")
    .trim();
}

function escapeMdLine(line: string): string {
  return line
    .replace(/^(\s*)([#>*+\-=|])(?=\s|$)/, "$1\\$2")
    .replace(/^(\s*)(\d+)([.)])(?=\s|$)/, "$1$2\\$3")
    .replace(/^(\s*)```/, "$1\\`\\`\\`");
}

export function toMarkdown(pages: readonly PageText[], pageLabel: (n: number) => string): string {
  return pages
    .map((p, i) => {
      const body = p.map((para) => para.map(escapeMdLine).join("  \n")).join("\n\n");
      return `## ${pageLabel(i + 1)}\n\n${body}`.trim();
    })
    .join("\n\n")
    .trim();
}

const xml = (s: string) => sanitizeText(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** WordprocessingML body: one paragraph per text paragraph, line breaks inside, page breaks between pages. */
export function docxDocumentXml(pages: readonly PageText[]): string {
  const body: string[] = [];
  pages.forEach((p, pi) => {
    const paras = p.length ? p : [[""]];
    paras.forEach((para, i) => {
      const runs = para.map((line, li) => `${li ? "<w:br/>" : ""}<w:t xml:space="preserve">${xml(line)}</w:t>`).join("");
      const pageBreak = pi > 0 && i === 0 ? '<w:r><w:br w:type="page"/></w:r>' : "";
      body.push(`<w:p>${pageBreak}<w:r>${runs}</w:r></w:p>`);
    });
  });
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    body.join("") +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>' +
    "</w:body></w:document>"
  );
}

interface ZipLike {
  file(name: string, data: string): unknown;
  generateAsync(opts: { type: "blob" | "uint8array"; mimeType?: string; compression?: "DEFLATE" | "STORE" }): Promise<Blob | Uint8Array>;
}

/** Build a minimal but valid .docx with JSZip (passed in so this module stays dependency-free). */
export async function buildDocx<T extends Blob | Uint8Array>(zip: ZipLike, pages: readonly PageText[], type: T extends Blob ? "blob" : "uint8array"): Promise<T> {
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/_rels/document.xml.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
  );
  zip.file(
    "word/styles.xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="22"/><w:lang w:val="ru-RU"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>',
  );
  zip.file("word/document.xml", docxDocumentXml(pages));
  return (await zip.generateAsync({
    type,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  })) as T;
}
