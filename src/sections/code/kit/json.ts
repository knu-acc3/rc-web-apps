/**
 * Lossless, tolerant JSON parser and printer.
 * - numbers keep their exact source text (12345678901234567890 and 0.1000000000000000000001 survive)
 * - duplicate keys are kept in order and reported as warnings
 * - exact error positions (line / column in code points)
 * - lenient mode accepts comments, trailing commas, single-quoted strings and a BOM, reporting them
 */
import { Num, Obj, type V } from "./value";

export type JsonErrorCode =
  | "empty"
  | "unexpected-token"
  | "unexpected-end"
  | "bad-escape"
  | "bad-number"
  | "control-char"
  | "trailing-data"
  | "expected-colon"
  | "expected-comma"
  | "expected-key"
  | "too-deep";

export type JsonWarningCode = "dup-key" | "comment" | "trailing-comma" | "single-quote" | "bom";

export interface Pos {
  line: number;
  col: number;
  offset: number;
}

export interface JsonWarning extends Pos {
  code: JsonWarningCode;
  key?: string;
}

export class JsonParseError extends Error {
  constructor(
    readonly code: JsonErrorCode,
    readonly line: number,
    readonly col: number,
    readonly offset: number,
    readonly found?: string,
  ) {
    super(`${code} at ${line}:${col}${found ? ` (${found})` : ""}`);
  }
}

/** Line and column (1-based, column in code points) of a UTF-16 offset. */
export function posOf(text: string, offset: number): Pos {
  let line = 1;
  let last = -1;
  for (let i = 0; i < offset && i < text.length; i++) if (text.charCodeAt(i) === 10) {
    line++;
    last = i;
  }
  let col = 1;
  for (let i = last + 1; i < offset && i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xdc00 && c <= 0xdfff && i > last + 1) {
      const p = text.charCodeAt(i - 1);
      if (p >= 0xd800 && p <= 0xdbff) continue;
    }
    col++;
  }
  return { line, col, offset };
}

/** Deeper documents get a clear "too-deep" error instead of a stack overflow. */
export const MAX_DEPTH = 1000;

export function parseJson(text: string, opts: { lenient?: boolean } = {}): { value: V; warnings: JsonWarning[] } {
  const lenient = !!opts.lenient;
  const warnings: JsonWarning[] = [];
  let i = 0;
  const n = text.length;

  const fail = (code: JsonErrorCode, at = i): never => {
    const p = posOf(text, at);
    const found = at < n ? text.slice(at, at + 1) : undefined;
    throw new JsonParseError(code, p.line, p.col, at, found);
  };
  const warn = (code: JsonWarningCode, at: number, key?: string) => warnings.push({ code, key, ...posOf(text, at) });

  if (text.charCodeAt(0) === 0xfeff) {
    if (!lenient) fail("unexpected-token", 0);
    warn("bom", 0);
    i = 1;
  }

  const ws = () => {
    for (;;) {
      const c = text.charCodeAt(i);
      if (c === 32 || c === 10 || c === 13 || c === 9) {
        i++;
        continue;
      }
      if (c === 47 /* / */ && (text[i + 1] === "/" || text[i + 1] === "*")) {
        if (!lenient) fail("unexpected-token");
        warn("comment", i);
        if (text[i + 1] === "/") {
          const e = text.indexOf("\n", i);
          i = e < 0 ? n : e;
        } else {
          const e = text.indexOf("*/", i + 2);
          if (e < 0) fail("unexpected-end", n);
          i = e + 2;
        }
        continue;
      }
      return;
    }
  };

  const str = (): string => {
    const q = text[i];
    if (q === "'") {
      if (!lenient) fail("unexpected-token");
      warn("single-quote", i);
    }
    i++;
    let out = "";
    let start = i;
    for (;;) {
      if (i >= n) fail("unexpected-end", n);
      const c = text.charCodeAt(i);
      if (c === q.charCodeAt(0)) {
        out += text.slice(start, i);
        i++;
        return out;
      }
      if (c < 0x20) fail("control-char");
      if (c === 92 /* \ */) {
        out += text.slice(start, i);
        const e = text[i + 1];
        const map: Record<string, string> = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", "'": "'" };
        if (e === "u") {
          const hex = text.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail("bad-escape");
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
        } else if (e !== undefined && e in map && (e !== "'" || lenient)) {
          out += map[e];
          i += 2;
        } else fail("bad-escape");
        start = i;
        continue;
      }
      i++;
    }
  };

  const num = (): Num => {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?/.exec(text.slice(i, i + 400));
    if (!m) fail("bad-number");
    const end = i + m![0].length;
    if (end < n && /[0-9A-Za-z.+-]/.test(text[end])) fail("bad-number", i);
    i = end;
    return new Num(m![0]);
  };

  const value = (depth: number): V => {
    if (depth > MAX_DEPTH) fail("too-deep");
    ws();
    if (i >= n) fail(depth === 0 && !text.slice(0, n).trim() ? "empty" : "unexpected-end", n);
    const c = text[i];
    if (c === "{") {
      i++;
      const obj = new Obj();
      const seen = new Set<string>();
      ws();
      if (text[i] === "}") {
        i++;
        return obj;
      }
      for (;;) {
        ws();
        if (lenient && text[i] === "}" && obj.entries.length) {
          i++;
          return obj;
        }
        if (text[i] !== '"' && !(lenient && text[i] === "'")) fail(i >= n ? "unexpected-end" : "expected-key");
        const at = i;
        const key = str();
        if (seen.has(key)) warn("dup-key", at, key);
        seen.add(key);
        ws();
        if (text[i] !== ":") fail(i >= n ? "unexpected-end" : "expected-colon");
        i++;
        obj.entries.push([key, value(depth + 1)]);
        ws();
        if (text[i] === ",") {
          const ci = i;
          i++;
          ws();
          if (text[i] === "}") {
            if (!lenient) fail("unexpected-token");
            warn("trailing-comma", ci);
            i++;
            return obj;
          }
          continue;
        }
        if (text[i] === "}") {
          i++;
          return obj;
        }
        fail(i >= n ? "unexpected-end" : "expected-comma");
      }
    }
    if (c === "[") {
      i++;
      const arr: V[] = [];
      ws();
      if (text[i] === "]") {
        i++;
        return arr;
      }
      for (;;) {
        arr.push(value(depth + 1));
        ws();
        if (text[i] === ",") {
          const ci = i;
          i++;
          ws();
          if (text[i] === "]") {
            if (!lenient) fail("unexpected-token");
            warn("trailing-comma", ci);
            i++;
            return arr;
          }
          continue;
        }
        if (text[i] === "]") {
          i++;
          return arr;
        }
        fail(i >= n ? "unexpected-end" : "expected-comma");
      }
    }
    if (c === '"' || c === "'") return str();
    if (c === "-" || (c >= "0" && c <= "9")) return num();
    for (const [lit, v] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      if (text.startsWith(lit, i)) {
        const end = i + lit.length;
        if (end < n && /[A-Za-z0-9_]/.test(text[end])) fail("unexpected-token");
        i = end;
        return v;
      }
    }
    return fail("unexpected-token");
  };

  const v = value(0);
  ws();
  if (i < n) fail("trailing-data");
  return { value: v, warnings };
}

export interface StringifyOptions {
  /** 0 = minified; a number of spaces; or "\t" */
  indent?: number | "\t";
  sortKeys?: boolean;
  /** Escape non-ASCII characters as \uXXXX */
  ascii?: boolean;
}

export function stringifyJson(v: V, o: StringifyOptions = {}): string {
  const unit = o.indent === "\t" ? "\t" : " ".repeat(o.indent ?? 2);
  const pretty = unit.length > 0;
  const q = (s: string) => {
    const j = JSON.stringify(s);
    return o.ascii ? j.replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`) : j;
  };
  const out: string[] = [];
  const walk = (x: V, ind: string) => {
    if (x === null) out.push("null");
    else if (typeof x === "boolean") out.push(String(x));
    else if (typeof x === "string") out.push(q(x));
    else if (x instanceof Num) out.push(x.raw);
    else if (Array.isArray(x)) {
      if (!x.length) return void out.push("[]");
      const inner = ind + unit;
      out.push("[");
      x.forEach((e, k) => {
        if (pretty) out.push("\n", inner);
        walk(e, inner);
        if (k < x.length - 1) out.push(",");
      });
      out.push(pretty ? `\n${ind}]` : "]");
    } else {
      const entries = o.sortKeys ? [...x.entries].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)) : x.entries;
      if (!entries.length) return void out.push("{}");
      const inner = ind + unit;
      out.push("{");
      entries.forEach(([k, e], idx) => {
        if (pretty) out.push("\n", inner);
        out.push(q(k), pretty ? ": " : ":");
        walk(e, inner);
        if (idx < entries.length - 1) out.push(",");
      });
      out.push(pretty ? `\n${ind}}` : "}");
    }
  };
  walk(v, "");
  return out.join("");
}

/** Count of nodes and max depth (for stats and tree limits). */
export function jsonStats(v: V): { nodes: number; depth: number } {
  let nodes = 0;
  let depth = 0;
  const stack: [V, number][] = [[v, 1]];
  while (stack.length) {
    const [x, d] = stack.pop()!;
    nodes++;
    if (d > depth) depth = d;
    if (Array.isArray(x)) for (const e of x) stack.push([e, d + 1]);
    else if (x instanceof Obj) for (const [, e] of x.entries) stack.push([e, d + 1]);
  }
  return { nodes, depth };
}
