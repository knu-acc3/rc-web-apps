/**
 * Engines of the code section, run inside code.worker.ts (also importable from tests).
 * Heavy libraries (prettier, sql-formatter, js-yaml) are loaded on demand with import().
 */
import { JsonParseError, jsonStats, parseJson, stringifyJson, type JsonWarning } from "./kit/json";
import { Num, Obj, type V } from "./kit/value";
import { gzipSize, minifyCss } from "./cssmin";
import { JsMinError, minifyJs } from "./jsmin";
import { formatXml, minifyHtml, minifySql } from "./markup";
import { parseXml, XmlError } from "@/sections/data/xml";
import type { CodeFail, FormatLang, FormatOptions, MinifyLang, PrettierLang, ValidateLang } from "./langs";

export class CodeError extends Error {
  constructor(readonly fail: CodeFail) {
    super(fail.code);
  }
}

const bytes = (s: string) => new TextEncoder().encode(s).length;

const jsonFail = (e: JsonParseError): CodeError => new CodeError({ code: `json-${e.code}`, line: e.line, col: e.col, detail: e.found });

/* ───────────── prettier ───────────── */

const PARSER: Record<PrettierLang, string> = {
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  javascript: "babel",
  typescript: "typescript",
  markdown: "markdown",
  yaml: "yaml",
  graphql: "graphql",
};

async function pluginsFor(lang: PrettierLang): Promise<unknown[]> {
  switch (lang) {
    case "html":
      return Promise.all([import("prettier/plugins/html"), import("prettier/plugins/postcss"), import("prettier/plugins/babel"), import("prettier/plugins/estree")]);
    case "css":
    case "scss":
    case "less":
      return [await import("prettier/plugins/postcss")];
    case "javascript":
      return Promise.all([import("prettier/plugins/babel"), import("prettier/plugins/estree")]);
    case "typescript":
      return Promise.all([import("prettier/plugins/typescript"), import("prettier/plugins/estree")]);
    case "markdown":
      return [await import("prettier/plugins/markdown")];
    case "yaml":
      return [await import("prettier/plugins/yaml")];
    case "graphql":
      return [await import("prettier/plugins/graphql")];
  }
}

function prettierFail(e: unknown): CodeError {
  const x = e as { loc?: { start?: { line: number; column: number } }; message?: string };
  const first = String(x.message ?? e)
    .split("\n")[0]
    .replace(/\s*\(\d+:\d+\)\s*$/, "");
  // prettier reports 1-based columns
  return new CodeError({ code: "syntax", line: x.loc?.start?.line, col: x.loc?.start?.column, detail: first.replace(/^CssSyntaxError:\s*/, "") });
}

const indentOf = (o: FormatOptions) => (o.indent === "tab" ? { useTabs: true, tabWidth: 4 } : { useTabs: false, tabWidth: Number(o.indent) || 2 });

export async function formatCode(lang: FormatLang, text: string, o: FormatOptions): Promise<{ output: string; warnings: string[] }> {
  if (lang === "xml") return formatXmlChecked(text, o);
  if (lang === "sql") {
    const { format } = await import("sql-formatter");
    const ind = indentOf(o);
    try {
      const output = format(text, {
        language: (o.dialect ?? "sql") as "sql",
        keywordCase: o.keywordCase ?? "upper",
        tabWidth: ind.tabWidth,
        useTabs: ind.useTabs,
        linesBetweenQueries: 1,
      });
      return { output: `${output}\n`, warnings: [] };
    } catch (e) {
      const msg = String((e as Error).message ?? e);
      const m = /line (\d+) column (\d+)/i.exec(msg);
      const detail = msg
        .split("\n")[0]
        .replace(/\s*at line \d+ column \d+\s*$/i, "")
        .replace(/^Parse error:?\s*(?:at token:\s*)?/i, "");
      throw new CodeError({ code: "sql-parse", line: m ? Number(m[1]) : undefined, col: m ? Number(m[2]) : undefined, detail });
    }
  }
  const prettier = await import("prettier/standalone");
  const plugins = await pluginsFor(lang);
  try {
    const output = await prettier.format(text, {
      parser: PARSER[lang],
      plugins: plugins as never,
      ...indentOf(o),
      printWidth: o.printWidth ?? 80,
      singleQuote: !!o.singleQuote,
      semi: o.semi !== false,
    });
    return { output, warnings: [] };
  } catch (e) {
    throw prettierFail(e);
  }
}

function xmlFailOf(e: XmlError): CodeError {
  return new CodeError({ code: `xml-${e.code}`, line: e.line, col: e.col, detail: e.detail });
}

function formatXmlChecked(text: string, o: FormatOptions, minify = false): { output: string; warnings: string[] } {
  const warnings: string[] = [];
  try {
    const r = parseXml(text);
    if (r.unknownEntities.length) warnings.push("xml-entities");
  } catch (e) {
    if (!(e instanceof XmlError)) throw e;
    // fragments with several top-level elements are fine to format
    if (e.code !== "multiple-roots" && e.code !== "text-outside-root" && e.code !== "no-root") throw xmlFailOf(e);
    warnings.push("xml-fragment");
  }
  const output = formatXml(text, { indent: o.indent === "tab" ? "\t" : " ".repeat(Number(o.indent) || 2), minify });
  return { output, warnings };
}

/* ───────────── JSON ───────────── */

export interface JsonNode {
  /** o object, a array, s string, n number, b boolean, z null */
  t: "o" | "a" | "s" | "n" | "b" | "z";
  k?: string;
  v?: string;
  c?: JsonNode[];
  /** number of children (objects/arrays) */
  size?: number;
}

/** Plain, cloneable tree for the tree view; children beyond `cap` per node are cut (count kept). */
export function toTree(v: V, cap = 500, key?: string): JsonNode {
  if (v === null) return { t: "z", k: key, v: "null" };
  if (typeof v === "string") return { t: "s", k: key, v };
  if (typeof v === "boolean") return { t: "b", k: key, v: String(v) };
  if (v instanceof Num) return { t: "n", k: key, v: v.raw };
  if (Array.isArray(v)) return { t: "a", k: key, size: v.length, c: v.slice(0, cap).map((x, i) => toTree(x, cap, String(i))) };
  const o = v as Obj;
  return { t: "o", k: key, size: o.entries.length, c: o.entries.slice(0, cap).map(([k, x]) => toTree(x, cap, k)) };
}

export interface JsonFormatResult {
  output: string;
  warnings: JsonWarning[];
  nodes: number;
  depth: number;
  bytes: number;
  tree?: JsonNode;
}

export function formatJsonText(text: string, o: { indent: number | "\t"; sortKeys?: boolean; ascii?: boolean; tree?: boolean }): JsonFormatResult {
  let parsed: ReturnType<typeof parseJson>;
  try {
    parsed = parseJson(text, { lenient: true });
  } catch (e) {
    if (e instanceof JsonParseError) throw jsonFail(e);
    throw e;
  }
  const output = stringifyJson(parsed.value, { indent: o.indent, sortKeys: o.sortKeys, ascii: o.ascii });
  const st = jsonStats(parsed.value);
  const out = o.indent === 0 ? output : `${output}\n`;
  return { output: out, warnings: parsed.warnings, nodes: st.nodes, depth: st.depth, bytes: bytes(out), tree: o.tree ? toTree(parsed.value) : undefined };
}

/* ───────────── minify ───────────── */

export interface MinifyResult {
  output: string;
  before: number;
  after: number;
  gzBefore: number | null;
  gzAfter: number | null;
}

export async function minifyCode(lang: MinifyLang, text: string, o: { keepComments?: boolean } = {}): Promise<MinifyResult> {
  let output: string;
  switch (lang) {
    case "json":
      try {
        output = stringifyJson(parseJson(text, { lenient: true }).value, { indent: 0 });
      } catch (e) {
        if (e instanceof JsonParseError) throw jsonFail(e);
        throw e;
      }
      break;
    case "css":
      output = minifyCss(text, { keepImportant: o.keepComments !== false });
      break;
    case "javascript":
      try {
        output = minifyJs(text, { keepLicense: o.keepComments !== false });
      } catch (e) {
        if (e instanceof JsMinError) {
          const p = lineCol(text, e.offset);
          throw new CodeError({ code: `js-${e.code}`, line: p.line, col: p.col });
        }
        throw e;
      }
      break;
    case "html":
      output = minifyHtml(text, { keepComments: !!o.keepComments });
      break;
    case "xml":
      output = formatXmlChecked(text, { indent: "2" }, true).output;
      break;
    case "sql":
      output = minifySql(text);
      break;
  }
  const [gzBefore, gzAfter] = await Promise.all([gzipSize(text), gzipSize(output)]);
  return { output, before: bytes(text), after: bytes(output), gzBefore, gzAfter };
}

function lineCol(text: string, offset: number): { line: number; col: number } {
  let line = 1;
  let last = -1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      last = i;
    }
  }
  return { line, col: offset - last };
}

/* ───────────── validate ───────────── */

export interface ValidateResult {
  /** e.g. { kind: "object", nodes: 12, depth: 3 } or { root: "catalog", elements: 9 } */
  summary: Record<string, string | number>;
  warnings: { code: string; line?: number; col?: number; detail?: string }[];
}

export async function validateCode(lang: ValidateLang, text: string): Promise<ValidateResult> {
  if (lang === "json") {
    try {
      const { value, warnings } = parseJson(text);
      const st = jsonStats(value);
      const kind = value === null ? "null" : Array.isArray(value) ? "array" : value instanceof Obj ? "object" : value instanceof Num ? "number" : typeof value;
      const unsafe = countUnsafeNumbers(value);
      return {
        summary: { kind, nodes: st.nodes, depth: st.depth },
        warnings: [...warnings.map((w) => ({ code: `json-${w.code}`, line: w.line, col: w.col, detail: w.key })), ...(unsafe ? [{ code: "json-big-number", detail: String(unsafe) }] : [])],
      };
    } catch (e) {
      if (!(e instanceof JsonParseError)) throw e;
      let lenientOk = false;
      try {
        parseJson(text, { lenient: true });
        lenientOk = true;
      } catch {
        /* really broken */
      }
      throw new CodeError({ code: `json-${e.code}`, line: e.line, col: e.col, detail: lenientOk ? "jsonc" : e.found });
    }
  }
  if (lang === "xml") {
    try {
      const { root, unknownEntities } = parseXml(text);
      let elements = 0;
      const stack = [root];
      while (stack.length) {
        const el = stack.pop()!;
        elements++;
        for (const c of el.children) if (typeof c !== "string") stack.push(c);
      }
      return { summary: { root: root.name, elements }, warnings: unknownEntities.length ? [{ code: "xml-entities", detail: unknownEntities.slice(0, 5).map((x) => `&${x};`).join(" ") }] : [] };
    } catch (e) {
      if (e instanceof XmlError) throw xmlFailOf(e);
      throw e;
    }
  }
  const Y = await import("js-yaml");
  try {
    const warnings: ValidateResult["warnings"] = [];
    const docs = Y.loadAll(text, { schema: Y.CORE_SCHEMA, onWarning: (w: { mark?: { line: number; column: number }; reason?: string }) => warnings.push({ code: "yaml-warning", line: w.mark ? w.mark.line + 1 : undefined, col: w.mark ? w.mark.column + 1 : undefined, detail: w.reason }) } as never);
    // YAML 1.1 readers (PyYAML, older tools) would read these plain scalars differently
    const legacy = /^\s*(?:-\s+|[^#\n:]+:\s+)(yes|no|on|off|y|n|Yes|No|On|Off|YES|NO|ON|OFF)\s*(?:#.*)?$/gm;
    let m: RegExpExecArray | null;
    while ((m = legacy.exec(text)) && warnings.length < 20) {
      const line = text.slice(0, m.index).split("\n").length;
      warnings.push({ code: "yaml-legacy-bool", line, detail: m[1] });
    }
    return { summary: { docs: docs.length }, warnings };
  } catch (e) {
    const x = e as { mark?: { line: number; column: number }; reason?: string; message?: string };
    throw new CodeError({ code: "yaml-syntax", line: x.mark ? x.mark.line + 1 : undefined, col: x.mark ? x.mark.column + 1 : undefined, detail: x.reason ?? String(x.message ?? e).split("\n")[0] });
  }
}

function countUnsafeNumbers(v: V): number {
  let n = 0;
  const stack: V[] = [v];
  while (stack.length) {
    const x = stack.pop()!;
    if (x instanceof Num) {
      if (/^-?\d+$/.test(x.raw) && !Number.isSafeInteger(Number(x.raw))) n++;
    } else if (Array.isArray(x)) for (const e of x) stack.push(e);
    else if (x instanceof Obj) for (const [, e] of x.entries) stack.push(e);
  }
  return n;
}
