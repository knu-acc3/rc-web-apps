/**
 * RFC 4180 CSV / TSV: iterative parser (no recursion, handles 100k+ rows), delimiter
 * detection by column-count consistency, quoting on output, optional BOM and an explicit,
 * opt-in CSV-injection guard that never touches numbers.
 */

interface CsvError {
  code: "unclosed-quote" | "quote-in-field";
  line: number;
}

interface CsvParsed {
  rows: string[][];
  delimiter: string;
  errors: CsvError[];
}

const CANDIDATES = [",", ";", "\t", "|"];

/** Pick the delimiter whose column count is most consistent over the first lines (quotes respected). */
export function detectDelimiter(text: string, sampleLines = 20): string {
  let best = ",";
  let bestScore = -1;
  for (const d of CANDIDATES) {
    const counts = parseCsv(text, { delimiter: d, maxRows: sampleLines }).rows.map((r) => r.length);
    if (!counts.length) continue;
    const first = counts[0];
    if (first < 2) continue;
    const same = counts.filter((c) => c === first).length;
    const score = same / counts.length + first / 1000;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

export function parseCsv(input: string, o: { delimiter?: string; maxRows?: number } = {}): CsvParsed {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const d = o.delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  const errors: CsvError[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let wasQuoted = false;
  let line = 1;
  let i = 0;
  const n = text.length;
  const max = o.maxRows ?? Infinity;
  const endRow = () => {
    row.push(field);
    rows.push(row);
    row = [];
    field = "";
    wasQuoted = false;
  };
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      if (c === "\n") line++;
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      if (field === "" && !wasQuoted) {
        inQuotes = true;
        wasQuoted = true;
      } else {
        errors.push({ code: "quote-in-field", line });
        field += c;
      }
      i++;
      continue;
    }
    if (c === d) {
      row.push(field);
      field = "";
      wasQuoted = false;
      i++;
      continue;
    }
    if (c === "\r" || c === "\n") {
      endRow();
      if (rows.length >= max) return { rows, delimiter: d, errors };
      if (c === "\r" && text[i + 1] === "\n") i++;
      i++;
      line++;
      continue;
    }
    field += c;
    i++;
  }
  if (inQuotes) errors.push({ code: "unclosed-quote", line });
  if (field !== "" || row.length || wasQuoted) endRow();
  return { rows, delimiter: d, errors };
}

const NUMERIC = /^[-+]?(?:\d+[.,]?\d*|[.,]\d+)(?:e[-+]?\d+)?$/i;

interface CsvWriteOptions {
  delimiter?: string;
  /** Quote every field */
  quoteAll?: boolean;
  /** "\r\n" (RFC 4180, Excel) or "\n" */
  eol?: string;
  /** Prepend a UTF-8 BOM so Excel detects the encoding */
  bom?: boolean;
  /** Prefix text cells starting with = + - @ tab or CR with ' (never numbers). Off by default. */
  injectionGuard?: boolean;
}

export function guardCell(s: string): string {
  if (!s || NUMERIC.test(s.trim())) return s;
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export function writeCsv(rows: string[][], o: CsvWriteOptions = {}): string {
  const d = o.delimiter ?? ",";
  const eol = o.eol ?? "\r\n";
  const needs = new RegExp(`["\\r\\n${d === "\t" ? "\\t" : d.replace(/[\\^$.*+?()[\]{}|-]/g, "\\$&")}]|^\\s|\\s$`);
  const parts: string[] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const cells = new Array<string>(row.length);
    for (let c = 0; c < row.length; c++) {
      let v = row[c] ?? "";
      if (o.injectionGuard) v = guardCell(v);
      cells[c] = o.quoteAll || needs.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    }
    parts.push(cells.join(d));
  }
  return (o.bom ? "﻿" : "") + parts.join(eol);
}

/** Markdown table (pipes and newlines escaped). */
export function toMarkdownTable(rows: string[][], align: "left" | "none" = "none"): string {
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const esc = (s: string) => (s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
  const line = (r: string[]) => `| ${Array.from({ length: width }, (_, i) => esc(r[i] ?? "")).join(" | ")} |`;
  const sep = `| ${Array.from({ length: width }, () => (align === "left" ? ":---" : "---")).join(" | ")} |`;
  return [line(rows[0]), sep, ...rows.slice(1).map(line)].join("\n");
}

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** HTML table with <thead> from the first row. */
export function toHtmlTable(rows: string[][], header = true): string {
  if (!rows.length) return "<table></table>";
  const width = Math.max(...rows.map((r) => r.length));
  const cells = (r: string[], tag: string) => Array.from({ length: width }, (_, i) => `<${tag}>${escHtml(r[i] ?? "").replace(/\r?\n/g, "<br>")}</${tag}>`).join("");
  const body = (header ? rows.slice(1) : rows).map((r) => `    <tr>${cells(r, "td")}</tr>`).join("\n");
  return ["<table>", ...(header ? ["  <thead>", `    <tr>${cells(rows[0], "th")}</tr>`, "  </thead>"] : []), "  <tbody>", body, "  </tbody>", "</table>"].filter((x) => x !== "").join("\n");
}
