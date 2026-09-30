/**
 * YAML: lossless loading via js-yaml 5 (YAML 1.2 core schema, anchors, merge keys, block
 * scalars, ordered maps, numbers kept as source digits) and our own emitter that quotes every
 * string YAML 1.1 parsers would misread (yes/no/on/off, dates, 012, 12:30, 1e3, ~ …).
 */
import { normalizeNumber, Num, Obj, type V } from "@/sections/code/kit/value";

export async function loadYaml(text: string): Promise<{ value: V; warnings: string[] }> {
  const Y = await import("js-yaml");
  const warnings: string[] = [];
  const num = (tag: string, re: RegExp) =>
    Y.defineScalarTag(tag, {
      implicit: true,
      implicitFirstChars: null,
      resolve: (s: string) => {
        if (!re.test(s)) return Y.NOT_RESOLVED;
        if (/^[-+]?\.(inf|nan)$/i.test(s)) {
          warnings.push("yaml-inf");
          return s;
        }
        const n = normalizeNumber(s);
        return n === null ? Y.NOT_RESOLVED : new Num(n);
      },
      identify: (d: unknown) => d instanceof Num,
      represent: (d: Num) => d.raw,
    });
  const intTag = num("tag:yaml.org,2002:int", /^(?:[-+]?[0-9]+|0o[0-7]+|0x[0-9a-fA-F]+)$/);
  const floatTag = num("tag:yaml.org,2002:float", /^(?:[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$/);
  const schema = Y.CORE_SCHEMA.withTags(intTag, floatTag, Y.mergeTag, Y.realMapTag);
  const docs = Y.loadAll(text, { schema });
  const conv = (x: unknown): V => {
    if (x === null || x === undefined) return null;
    if (x instanceof Num) return x;
    if (typeof x === "boolean" || typeof x === "string") return x;
    if (typeof x === "number") return Number.isFinite(x) ? new Num(String(x)) : String(x);
    if (Array.isArray(x)) return x.map(conv);
    if (x instanceof Map) {
      const o = new Obj();
      for (const [k, v] of x) o.entries.push([k instanceof Num ? k.raw : k === null ? "null" : typeof k === "object" ? JSON.stringify(conv(k)) : String(k), conv(v)]);
      return o;
    }
    if (x instanceof Uint8Array) return new TextDecoder().decode(x);
    if (x instanceof Date) return x.toISOString();
    if (typeof x === "object") {
      const o = new Obj();
      for (const [k, v] of Object.entries(x)) o.entries.push([k, conv(v)]);
      return o;
    }
    return String(x);
  };
  if (docs.length === 0) return { value: null, warnings };
  if (docs.length > 1) warnings.push("yaml-multi");
  return { value: docs.length === 1 ? conv(docs[0]) : docs.map(conv), warnings };
}

/* ───────────── emitter ───────────── */

const AMBIGUOUS = [
  /^(?:y|Y|yes|Yes|YES|n|N|no|No|NO|true|True|TRUE|false|False|FALSE|on|On|ON|off|Off|OFF)$/, // YAML 1.1 booleans
  /^(?:null|Null|NULL|~)$/,
  /^[-+]?(?:0|[1-9][0-9_]*)$/, // ints
  /^[-+]?0[0-7_]+$/, // YAML 1.1 octal (012)
  /^[-+]?0x[0-9a-fA-F_]+$/,
  /^[-+]?0o[0-7_]+$/,
  /^[-+]?0b[01_]+$/,
  /^[-+]?(?:\.[0-9]+|[0-9][0-9_]*(?:\.[0-9_]*)?)(?:[eE][-+]?[0-9]+)?$/, // floats
  /^[-+]?\.(?:inf|Inf|INF)$|^\.(?:nan|NaN|NAN)$/,
  /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+(?:\.[0-9_]*)?$/, // YAML 1.1 sexagesimal (12:30)
  /^\d{4}-\d\d?-\d\d?(?:(?:[Tt]|[ \t]+)\d\d?:\d\d:\d\d(?:\.\d*)?(?:[ \t]*(?:Z|[-+]\d\d?(?::\d\d)?))?)?$/, // timestamps
  /^<<$/, // merge key
  /^=$/, // YAML 1.1 value key
];

export function needsQuotes(s: string): boolean {
  if (s === "") return true;
  if (AMBIGUOUS.some((re) => re.test(s))) return true;
  if (/^[\s]|[\s]$/.test(s)) return true;
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(s)) return true;
  if (/: |:$| #|\t/.test(s)) return true;
  if (/[\x00-\x1f\x7f\u0085\u2028\u2029\ufeff]/.test(s)) return true;
  return false;
}

function quote(s: string): string {
  if (/[\x00-\x1f\x7f\u0085\u2028\u2029\ufeff]/.test(s)) return JSON.stringify(s);
  return `'${s.replace(/'/g, "''")}'`;
}

function scalar(v: V): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return String(v);
  if (v instanceof Num) return v.raw;
  if (typeof v === "string") return needsQuotes(v) ? quote(v) : v;
  return "";
}

const key = (k: string) => (needsQuotes(k) ? quote(k) : k);

function blockString(s: string, ind: string): string | null {
  if (!s.includes("\n") || /[\x00-\x08\x0b-\x1f\x7f]/.test(s) || /[ \t]\n|[ \t]$/.test(s) || /^[ \t]/.test(s)) return null;
  const chomp = s.endsWith("\n\n") ? "+" : s.endsWith("\n") ? "" : "-";
  const body = (chomp === "+" ? s : s.replace(/\n$/, "")).split("\n");
  if (chomp === "+") body.pop();
  return `|${chomp}\n${body.map((l) => (l ? ind + l : "")).join("\n")}`;
}

export function dumpYaml(v: V, indent = 2): string {
  const unit = " ".repeat(indent);
  const lines: string[] = [];
  const isColl = (x: V): x is V[] | Obj => (Array.isArray(x) && x.length > 0) || (x instanceof Obj && x.entries.length > 0);
  const inline = (x: V, ind: string): string => {
    if (Array.isArray(x)) return "[]";
    if (x instanceof Obj) return "{}";
    if (typeof x === "string") return blockString(x, ind) ?? scalar(x);
    return scalar(x);
  };
  const emit = (x: V, ind: string) => {
    if (Array.isArray(x)) {
      for (const e of x) {
        if (Array.isArray(e) && e.length) {
          lines.push(`${ind}-`);
          emit(e, ind + unit);
        } else if (e instanceof Obj && e.entries.length) {
          const sub: string[] = [];
          const save = lines.length;
          emit(e, ind + unit);
          sub.push(...lines.splice(save));
          sub[0] = `${ind}- ${sub[0].slice(ind.length + unit.length)}`;
          lines.push(...sub);
        } else lines.push(`${ind}- ${inline(e, ind + unit)}`);
      }
    } else if (x instanceof Obj) {
      for (const [k, e] of x.entries) {
        if (isColl(e)) {
          lines.push(`${ind}${key(k)}:`);
          emit(e, ind + unit);
        } else lines.push(`${ind}${key(k)}: ${inline(e, ind + unit)}`);
      }
    } else lines.push(ind + inline(x, ind + unit));
  };
  emit(v, "");
  return lines.join("\n") + "\n";
}
