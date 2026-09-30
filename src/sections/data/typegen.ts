/** Infer types from JSON samples and print TypeScript interfaces or a Zod schema. */
import { isObj, Num, type V } from "@/sections/code/kit/value";

type T =
  | { k: "string" | "number" | "boolean" | "null" | "unknown" }
  | { k: "array"; of: T }
  | { k: "object"; fields: Map<string, { t: T; optional: boolean }> }
  | { k: "union"; of: T[] };

function infer(v: V): T {
  if (v === null) return { k: "null" };
  if (typeof v === "string") return { k: "string" };
  if (typeof v === "boolean") return { k: "boolean" };
  if (v instanceof Num) return { k: "number" };
  if (Array.isArray(v)) return { k: "array", of: v.length ? v.map(infer).reduce(merge) : { k: "unknown" } };
  const fields = new Map<string, { t: T; optional: boolean }>();
  if (isObj(v)) for (const [key, x] of v.entries) fields.set(key, { t: infer(x), optional: false });
  return { k: "object", fields };
}

function merge(a: T, b: T): T {
  if (a.k === "unknown") return b;
  if (b.k === "unknown") return a;
  if (a.k === b.k && a.k !== "object" && a.k !== "array" && a.k !== "union") return a;
  if (a.k === "object" && b.k === "object") {
    const fields = new Map<string, { t: T; optional: boolean }>();
    for (const [k, f] of a.fields) {
      const g = b.fields.get(k);
      fields.set(k, g ? { t: merge(f.t, g.t), optional: f.optional || g.optional } : { t: f.t, optional: true });
    }
    for (const [k, g] of b.fields) if (!a.fields.has(k)) fields.set(k, { t: g.t, optional: true });
    return { k: "object", fields };
  }
  if (a.k === "array" && b.k === "array") return { k: "array", of: merge(a.of, b.of) };
  const members = [...(a.k === "union" ? a.of : [a]), ...(b.k === "union" ? b.of : [b])];
  const out: T[] = [];
  for (const m of members) {
    // same kind merges (objects field-wise, arrays element-wise); different kinds form a union
    const same = out.findIndex((x) => x.k === m.k);
    if (same >= 0) out[same] = merge(out[same], m);
    else out.push(m);
  }
  return out.length === 1 ? out[0] : { k: "union", of: out };
}

const pascal = (s: string) =>
  s
    .replace(/[^A-Za-z0-9]+(.)?/g, (_m, c: string | undefined) => (c ? c.toUpperCase() : ""))
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/^(\d)/, "_$1") || "Item";
const singular = (s: string) => (/ies$/i.test(s) ? s.replace(/ies$/i, "y") : /ses$/i.test(s) ? s.slice(0, -2) : /[^s]s$/i.test(s) && s.length > 3 ? s.slice(0, -1) : `${s}Item`);
const prop = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

export function toTypeScript(v: V, o: { root?: string; style?: "interface" | "type"; exported?: boolean } = {}): string {
  const style = o.style ?? "interface";
  const exp = o.exported === false ? "" : "export ";
  const decls: string[] = [];
  const used = new Set<string>();
  const nameFor = (base: string) => {
    let n = pascal(base);
    let i = 2;
    while (used.has(n)) n = `${pascal(base)}${i++}`;
    used.add(n);
    return n;
  };
  const ts = (t: T, hint: string): string => {
    switch (t.k) {
      case "array": {
        const inner = ts(t.of, singular(hint));
        return /[|&]/.test(inner) ? `(${inner})[]` : `${inner}[]`;
      }
      case "union":
        return t.of.map((x) => ts(x, hint)).join(" | ");
      case "object": {
        const name = nameFor(hint);
        const lines = [...t.fields].map(([k, f]) => `  ${prop(k)}${f.optional ? "?" : ""}: ${ts(f.t, k)};`);
        const body = lines.length ? `{\n${lines.join("\n")}\n}` : "Record<string, unknown>";
        decls.push(style === "interface" && lines.length ? `${exp}interface ${name} ${body}` : `${exp}type ${name} = ${body};`);
        return name;
      }
      default:
        return t.k;
    }
  };
  const rootT = infer(v);
  const rootName = o.root || "Root";
  const top = ts(rootT, rootName);
  if (rootT.k !== "object") decls.push(`${exp}type ${pascal(rootName)} = ${top};`);
  return decls.join("\n\n") + "\n";
}

export function toZod(v: V, o: { root?: string } = {}): string {
  const z = (t: T, ind: string): string => {
    switch (t.k) {
      case "string":
        return "z.string()";
      case "number":
        return "z.number()";
      case "boolean":
        return "z.boolean()";
      case "null":
        return "z.null()";
      case "unknown":
        return "z.unknown()";
      case "array":
        return `z.array(${z(t.of, ind)})`;
      case "union": {
        const nonNull = t.of.filter((x) => x.k !== "null");
        const hasNull = nonNull.length < t.of.length;
        const base = nonNull.length === 1 ? z(nonNull[0], ind) : `z.union([${nonNull.map((x) => z(x, ind)).join(", ")}])`;
        return hasNull ? `${base}.nullable()` : base;
      }
      case "object": {
        if (!t.fields.size) return "z.object({})";
        const inner = ind + "  ";
        return `z.object({\n${[...t.fields].map(([k, f]) => `${inner}${prop(k)}: ${z(f.t, inner)}${f.optional ? ".optional()" : ""},`).join("\n")}\n${ind}})`;
      }
    }
  };
  const name = `${(o.root || "Root").replace(/^./, (c) => c.toLowerCase())}Schema`;
  return `import { z } from "zod";\n\nexport const ${name} = ${z(infer(v), "")};\n\nexport type ${pascal(o.root || "Root")} = z.infer<typeof ${name}>;\n`;
}
