/* Minimal RFC 4180 CSV reader for batch QR generation: quotes, ; or , (auto), BOM. */

export function detectDelimiter(text: string): "," | ";" | "\t" {
  const line = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  let inQ = false;
  const count = { ",": 0, ";": 0, "\t": 0 };
  for (const c of line) {
    if (c === '"') inQ = !inQ;
    else if (!inQ && (c === "," || c === ";" || c === "\t")) count[c]++;
  }
  if (count["\t"] > count[";"] && count["\t"] > count[","]) return "\t";
  return count[";"] > count[","] ? ";" : ",";
}

export function parseCsv(text: string, delimiter?: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const d = delimiter ?? detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQ = false;
      } else cell += c;
      continue;
    }
    if (c === '"' && cell === "") inQ = true;
    else if (c === d) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Plain list (one value per line) unless the first line has a delimiter, then CSV. */
export function parseTable(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  if (!/[,;\t]/.test(first)) return src.split(/\r?\n/).filter((l) => l.trim()).map((l) => [l]);
  return parseCsv(src);
}

/** Make file names unique: "a", "a" → "a", "a-2". Case-insensitive, for zip archives. */
export function uniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((n) => {
    let candidate = n;
    for (let k = 2; used.has(candidate.toLowerCase()); k++) candidate = `${n}-${k}`;
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

/** Sanitize a user-given file name (keeps letters of any script, digits, - and _). */
export function safeName(s: string, fallback: string): string {
  const n = s
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return n || fallback;
}
