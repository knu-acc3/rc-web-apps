/** Line operations: prefix/suffix, numbering, join/split, filtering, wrapping. */
import { graphemeCount, graphemes, normalizeNewlines, splitLines } from "./textOps";

export type LineOp = "prefix" | "number" | "join" | "split" | "remove-empty" | "wrap" | "filter";
export const LINE_OPS: LineOp[] = ["prefix", "number", "join", "split", "remove-empty", "wrap", "filter"];

export function addPrefixSuffix(s: string, prefix: string, suffix: string, skipEmpty = true): string {
  return splitLines(s)
    .map((l) => (skipEmpty && l.trim() === "" ? l : prefix + l + suffix))
    .join("\n");
}

interface NumberOptions {
  start?: number;
  step?: number;
  /** Template: {n} is replaced by the number, e.g. "{n}. ", "{n}) ", "[{n}] " */
  format?: string;
  /** Pad numbers with zeros to the same width. */
  pad?: boolean;
  skipEmpty?: boolean;
}

export function numberLines(s: string, o: NumberOptions = {}): string {
  const { start = 1, step = 1, format = "{n}. ", pad = false, skipEmpty = true } = o;
  const lines = splitLines(s);
  const count = skipEmpty ? lines.filter((l) => l.trim() !== "").length : lines.length;
  const last = start + step * Math.max(0, count - 1);
  const width = pad ? String(Math.max(Math.abs(start), Math.abs(last))).length : 0;
  let k = 0;
  return lines
    .map((l) => {
      if (skipEmpty && l.trim() === "") return l;
      const n = start + step * k++;
      const num = pad ? String(Math.abs(n)).padStart(width, "0") : String(Math.abs(n));
      return format.replace(/\{n\}/g, (n < 0 ? "-" : "") + num) + l;
    })
    .join("\n");
}

export function joinLines(s: string, separator: string, skipEmpty = true, trim = true): string {
  let lines = splitLines(s);
  if (trim) lines = lines.map((l) => l.trim());
  if (skipEmpty) lines = lines.filter((l) => l !== "");
  return lines.join(separator);
}

export function splitToLines(s: string, delimiter: string, trim = true, skipEmpty = true): string {
  if (!delimiter) return s;
  let parts = normalizeNewlines(s).split(delimiter);
  if (trim) parts = parts.map((p) => p.trim());
  if (skipEmpty) parts = parts.filter((p) => p !== "");
  return parts.join("\n");
}

export function removeEmptyLines(s: string, whitespaceOnly = true): string {
  return splitLines(s)
    .filter((l) => (whitespaceOnly ? l.trim() !== "" : l !== ""))
    .join("\n");
}

/**
 * Word-wrap each paragraph to at most `width` characters (graphemes).
 * Long words are broken only if `breakWords` is set.
 */
export function wrapText(s: string, width: number, breakWords = false): string {
  const w = Math.max(1, Math.floor(width));
  return splitLines(s)
    .map((line) => {
      if (graphemeCount(line) <= w) return line;
      const indent = /^\s*/.exec(line)![0];
      const out: string[] = [];
      let cur = "";
      let curLen = 0;
      for (const word of line.trim().split(/\s+/)) {
        let wl = graphemeCount(word);
        let rest = word;
        if (breakWords && wl > w) {
          const gs = graphemes(word);
          if (cur) {
            out.push(cur);
            cur = "";
            curLen = 0;
          }
          while (gs.length > w) out.push(gs.splice(0, w).join(""));
          rest = gs.join("");
          wl = gs.length;
        }
        if (!cur) {
          cur = rest;
          curLen = wl;
        } else if (curLen + 1 + wl <= w) {
          cur += " " + rest;
          curLen += 1 + wl;
        } else {
          out.push(cur);
          cur = rest;
          curLen = wl;
        }
      }
      if (cur) out.push(cur);
      return out.map((l, i) => (i === 0 ? indent + l : l)).join("\n");
    })
    .join("\n");
}

interface FilterOptions {
  query: string;
  /** keep lines that contain the query, or remove them */
  mode: "keep" | "remove";
  ignoreCase?: boolean;
}

export function filterLines(s: string, o: FilterOptions): string {
  if (!o.query) return s;
  const q = o.ignoreCase ? o.query.toLocaleLowerCase() : o.query;
  const test = (l: string) => (o.ignoreCase ? l.toLocaleLowerCase() : l).includes(q);
  return splitLines(s)
    .filter((l) => (o.mode === "keep" ? test(l) : !test(l)))
    .join("\n");
}

export function repeatText(s: string, times: number, separator: string): string {
  const n = Math.max(0, Math.min(10000, Math.floor(times)));
  return Array.from({ length: n }, () => s).join(separator);
}
