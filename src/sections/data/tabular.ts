/** Value (V) ↔ table conversions: flattening with dot paths and typed cell parsing. */
import { stringifyJson } from "@/sections/code/kit/json";
import { isObj, Num, Obj, type V } from "@/sections/code/kit/value";

export type ArrayMode = "index" | "join" | "json";

export interface FlattenOptions {
  separator?: string;
  arrays?: ArrayMode;
}

function cell(v: V): string {
  if (v === null) return "";
  if (typeof v === "boolean") return String(v);
  if (typeof v === "string") return v;
  if (v instanceof Num) return v.raw;
  return stringifyJson(v, { indent: 0 });
}

/** Flatten one record into [path, cell] pairs (iterative, no recursion over rows). */
export function flatten(v: V, o: FlattenOptions = {}): [string, string][] {
  const sep = o.separator ?? ".";
  const mode = o.arrays ?? "index";
  const out: [string, string][] = [];
  const stack: [string, V][] = [["", v]];
  while (stack.length) {
    const [path, x] = stack.pop()!;
    if (isObj(x) && x.entries.length) {
      for (let i = x.entries.length - 1; i >= 0; i--) stack.push([path ? `${path}${sep}${x.entries[i][0]}` : x.entries[i][0], x.entries[i][1]]);
    } else if (Array.isArray(x) && x.length) {
      const primitives = x.every((e) => e === null || typeof e !== "object" || e instanceof Num);
      if (mode === "json") out.push([path || "value", stringifyJson(x, { indent: 0 })]);
      else if (mode === "join" && primitives) out.push([path || "value", x.map(cell).join("; ")]);
      else for (let i = x.length - 1; i >= 0; i--) stack.push([path ? `${path}${sep}${i}` : String(i), x[i]]);
    } else out.push([path || "value", cell(x)]);
  }
  return out;
}

/** Records → header + rows. Columns are the union of keys in first-seen order. */
export function recordsToRows(value: V, o: FlattenOptions = {}): string[][] {
  const records: V[] = Array.isArray(value) ? value : isObj(value) ? [value] : [value];
  const cols = new Map<string, number>();
  const flat = records.map((r) => {
    const f = flatten(r, o);
    for (const [k] of f) if (!cols.has(k)) cols.set(k, cols.size);
    return f;
  });
  const header = [...cols.keys()];
  const rows: string[][] = [header];
  for (const f of flat) {
    const row = new Array<string>(header.length).fill("");
    for (const [k, c] of f) row[cols.get(k)!] = c;
    rows.push(row);
  }
  return rows;
}

const JSON_NUM = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/;

export interface TypedOptions {
  /** Convert numbers, true/false and empty cells */
  typed?: boolean;
  /** Treat empty cells as null (else "") */
  emptyAsNull?: boolean;
  /** Build nested objects from "a.b" headers */
  nested?: boolean;
  separator?: string;
}

export function typedCell(s: string, o: TypedOptions): V {
  if (!o.typed) return s;
  if (s === "") return o.emptyAsNull ? null : "";
  if (JSON_NUM.test(s)) return new Num(s); // lossless: big integers keep their digits
  if (s === "true" || s === "false") return s === "true";
  if (s === "null") return null;
  return s;
}

function setPath(obj: Obj, path: string[], value: V) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    let next = cur.get(path[i]);
    if (!isObj(next)) {
      next = new Obj();
      cur.entries.push([path[i], next]);
    }
    cur = next;
  }
  cur.entries.push([path[path.length - 1], value]);
}

/** Header + rows → array of objects (or array of arrays without a header). */
export function rowsToRecords(rows: string[][], header: boolean, o: TypedOptions = {}): V {
  if (!header) return rows.map((r) => r.map((c) => typedCell(c, o)));
  const [head, ...body] = rows;
  const sep = o.separator ?? ".";
  return body
    .filter((r) => !(r.length === 1 && r[0] === ""))
    .map((r) => {
      const obj = new Obj();
      head.forEach((h, i) => {
        const v = typedCell(r[i] ?? "", o);
        if (o.nested && h.includes(sep)) setPath(obj, h.split(sep), v);
        else obj.entries.push([h, v]);
      });
      return obj;
    });
}
