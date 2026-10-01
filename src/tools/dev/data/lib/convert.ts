/** Conversion matrix: parse(from) → value → serialize(to). Runs in the worker and in tests. */
import { JsonParseError, parseJson, stringifyJson } from "@/tools/dev/shared/json";
import { fromJs, isObj, Obj, toJs, type V } from "@/tools/dev/shared/value";
import { parseCsv, toHtmlTable, toMarkdownTable, writeCsv } from "./csv";
import { parseEnv, writeEnv } from "./env";
import { recordsToRows, rowsToRecords, type ArrayMode } from "./tabular";
import { toTypeScript, toZod } from "./typegen";
import { parseXml, valueToXml, XmlError, xmlToValue } from "./xml";
import { dumpYaml, loadYaml } from "./yaml";

export type Fmt = "json" | "csv" | "tsv" | "yaml" | "xml" | "toml" | "jsonl" | "env" | "markdown" | "html" | "typescript" | "zod";

export interface ConvertOptions {
  indent?: number;
  delimiter?: string; // "auto" | "," | ";" | "\t" | "|"
  header?: boolean;
  typed?: boolean;
  emptyAsNull?: boolean;
  nested?: boolean;
  arrays?: ArrayMode;
  separator?: string;
  bom?: boolean;
  quoteAll?: boolean;
  injectionGuard?: boolean;
  crlf?: boolean;
  root?: string;
  item?: string;
  envUpper?: boolean;
  envSeparator?: string;
  tsStyle?: "interface" | "type";
}

export interface Warn {
  code: string;
  detail?: string;
}

export class ConvertError extends Error {
  constructor(
    readonly code: string,
    readonly line?: number,
    readonly col?: number,
    readonly detail?: string,
  ) {
    super(`${code}${line ? ` at ${line}:${col ?? 0}` : ""}${detail ? `: ${detail}` : ""}`);
  }
}

interface Parsed {
  value: V;
  rows?: string[][];
}

async function parse(fmt: Fmt, text: string, o: ConvertOptions, warn: (w: Warn) => void): Promise<Parsed> {
  switch (fmt) {
    case "json": {
      try {
        const { value, warnings } = parseJson(text, { lenient: true });
        for (const w of warnings) warn({ code: `json-${w.code}`, detail: w.code === "dup-key" ? `${w.key} (${w.line}:${w.col})` : `${w.line}:${w.col}` });
        return { value };
      } catch (e) {
        if (e instanceof JsonParseError) throw new ConvertError(`json-${e.code}`, e.line, e.col, e.found);
        throw e;
      }
    }
    case "csv":
    case "tsv": {
      const delimiter = fmt === "tsv" ? "\t" : !o.delimiter || o.delimiter === "auto" ? undefined : o.delimiter;
      const { rows, errors, delimiter: used } = parseCsv(text, { delimiter });
      if (errors.some((e) => e.code === "unclosed-quote")) throw new ConvertError("csv-unclosed-quote", errors[0].line);
      if (errors.length) warn({ code: "csv-quote-in-field", detail: String(errors[0].line) });
      if (fmt === "csv" && !o.delimiter) warn({ code: "csv-delimiter", detail: used === "\t" ? "TAB" : used });
      const header = o.header !== false;
      return { rows, value: rowsToRecords(rows, header, { typed: o.typed, emptyAsNull: o.emptyAsNull, nested: o.nested, separator: o.separator }) };
    }
    case "yaml": {
      try {
        const { value, warnings } = await loadYaml(text);
        for (const w of warnings) warn({ code: w });
        return { value };
      } catch (e) {
        const m = e as { mark?: { line: number; column: number }; reason?: string; message?: string };
        throw new ConvertError("yaml-syntax", m.mark ? m.mark.line + 1 : undefined, m.mark ? m.mark.column + 1 : undefined, m.reason ?? m.message);
      }
    }
    case "xml": {
      try {
        const { root, unknownEntities } = parseXml(text);
        if (unknownEntities.length) warn({ code: "xml-entities", detail: unknownEntities.join(", ") });
        return { value: new Obj([[root.name, xmlToValue(root)]]) };
      } catch (e) {
        if (e instanceof XmlError) throw new ConvertError(`xml-${e.code}`, e.line, e.col, e.detail);
        throw e;
      }
    }
    case "toml": {
      const T = await import("smol-toml");
      try {
        const js = T.parse(text, { integersAsBigInt: "asNeeded" } as Parameters<typeof T.parse>[1]);
        return { value: fromJs(js) };
      } catch (e) {
        const m = e as { line?: number; column?: number; message?: string };
        throw new ConvertError("toml-syntax", m.line, m.column, (m.message ?? "").split("\n")[0]);
      }
    }
    case "jsonl": {
      const out: V[] = [];
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        try {
          out.push(parseJson(lines[i]).value);
        } catch (e) {
          if (e instanceof JsonParseError) throw new ConvertError(`json-${e.code}`, i + 1, e.col, e.found);
          throw e;
        }
      }
      return { value: out };
    }
    case "env": {
      const { value, errors } = parseEnv(text);
      for (const e of errors) warn({ code: `env-${e.code}`, detail: String(e.line) });
      return { value };
    }
    default:
      throw new ConvertError("unsupported-input", undefined, undefined, fmt);
  }
}

function dropNulls(x: unknown, warn: (w: Warn) => void, path = ""): unknown {
  if (x === null) {
    warn({ code: "toml-null", detail: path || "(root)" });
    return undefined;
  }
  if (Array.isArray(x)) return x.map((e, i) => dropNulls(e, warn, `${path}[${i}]`)).filter((e) => e !== undefined);
  if (x && typeof x === "object" && !(x instanceof Date)) {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x)) {
      const r = dropNulls(v, warn, path ? `${path}.${k}` : k);
      if (r !== undefined) o[k] = r;
    }
    return o;
  }
  return x;
}

/** First array of objects found breadth-first (e.g. <book> elements, or {"data": [...]}) — the table rows. */
function findRecords(v: V): V[] | null {
  const queue: V[] = [v];
  while (queue.length) {
    const x = queue.shift()!;
    if (Array.isArray(x) && x.length && x.every(isObj)) return x;
    if (isObj(x)) for (const [, e] of x.entries) queue.push(e);
  }
  return null;
}

async function serialize(fmt: Fmt, p: Parsed, o: ConvertOptions, warn: (w: Warn) => void): Promise<string> {
  const v = p.value;
  const rows = () => p.rows ?? recordsToRows(Array.isArray(v) ? v : (findRecords(v) ?? v), { separator: o.separator, arrays: o.arrays });
  switch (fmt) {
    case "json":
      return stringifyJson(v, { indent: o.indent ?? 2 }) + "\n";
    case "csv":
    case "tsv":
      return writeCsv(rows(), { delimiter: fmt === "tsv" ? "\t" : o.delimiter && o.delimiter !== "auto" ? o.delimiter : ",", quoteAll: o.quoteAll, bom: o.bom, injectionGuard: o.injectionGuard, eol: o.crlf === false ? "\n" : "\r\n" });
    case "yaml":
      return dumpYaml(v, o.indent ?? 2);
    case "xml": {
      const { xml, renamed } = valueToXml(v, { root: o.root || undefined, item: o.item || "item", indent: o.indent ?? 2 });
      if (renamed.length) warn({ code: "xml-renamed", detail: renamed.slice(0, 10).join(", ") });
      return xml;
    }
    case "toml": {
      const T = await import("smol-toml");
      let js = dropNulls(toJs(v, true), warn);
      if (!js || typeof js !== "object" || Array.isArray(js)) {
        warn({ code: "toml-wrapped" });
        js = { [o.root || "items"]: js };
      }
      try {
        return T.stringify(js as Record<string, unknown>) + "\n";
      } catch (e) {
        throw new ConvertError("toml-stringify", undefined, undefined, (e as Error).message);
      }
    }
    case "jsonl":
      return (Array.isArray(v) ? v : [v]).map((e) => stringifyJson(e, { indent: 0 })).join("\n") + "\n";
    case "env":
      return writeEnv(v, { separator: o.envSeparator ?? "__", upper: o.envUpper !== false });
    case "markdown":
      return toMarkdownTable(rows()) + "\n";
    case "html":
      return toHtmlTable(rows(), o.header !== false) + "\n";
    case "typescript":
      return toTypeScript(v, { root: o.root || "Root", style: o.tsStyle });
    case "zod":
      return toZod(v, { root: o.root || "Root" });
  }
}

export async function convert(from: Fmt, to: Fmt, text: string, o: ConvertOptions = {}): Promise<{ output: string; warnings: Warn[] }> {
  const warnings: Warn[] = [];
  const warn = (w: Warn) => {
    if (warnings.length < 50) warnings.push(w);
  };
  if (!text.trim()) return { output: "", warnings };
  const parsed = await parse(from, text, o, warn);
  if ((to === "csv" || to === "tsv" || to === "markdown" || to === "html") && !parsed.rows && !Array.isArray(parsed.value) && !isObj(parsed.value)) warn({ code: "not-records" });
  const output = await serialize(to, parsed, o, warn);
  return { output, warnings };
}
