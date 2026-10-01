/**
 * Small XML parser (pure TS — works in workers and tests; DOCTYPE is skipped and external
 * entities are never fetched) and a JSON ↔ XML mapping:
 *   attributes → "@name", text → "#text", repeated elements → arrays,
 *   a text-only element without attributes → a plain string.
 */
import { posOf } from "@/sections/code/kit/json";
import { isObj, Num, Obj, type V } from "@/sections/code/kit/value";

interface XmlElement {
  name: string;
  attrs: [string, string][];
  children: (XmlElement | string)[];
}

export class XmlError extends Error {
  constructor(
    readonly code: string,
    readonly line: number,
    readonly col: number,
    readonly detail?: string,
  ) {
    super(`${code} at ${line}:${col}${detail ? ` (${detail})` : ""}`);
  }
}

const ENT: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

function decodeXmlEntities(s: string, unknown?: Set<string>): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[A-Za-z_][\w.-]*);/g, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    }
    if (ENT[e]) return ENT[e];
    unknown?.add(e);
    return m;
  });
}

export function parseXml(input: string): { root: XmlElement; unknownEntities: string[] } {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  let i = 0;
  const n = text.length;
  const unknown = new Set<string>();
  const fail = (code: string, at = i, detail?: string): never => {
    const p = posOf(text, at);
    throw new XmlError(code, p.line, p.col, detail);
  };
  const stack: XmlElement[] = [];
  let root: XmlElement | null = null;
  const pushText = (t: string) => {
    if (!stack.length) {
      if (t.trim()) fail("text-outside-root");
      return;
    }
    stack[stack.length - 1].children.push(t);
  };
  while (i < n) {
    const lt = text.indexOf("<", i);
    if (lt < 0) {
      pushText(decodeXmlEntities(text.slice(i), unknown));
      break;
    }
    if (lt > i) pushText(decodeXmlEntities(text.slice(i, lt), unknown));
    i = lt;
    if (text.startsWith("<!--", i)) {
      const e = text.indexOf("-->", i + 4);
      if (e < 0) fail("unclosed-comment");
      i = e + 3;
    } else if (text.startsWith("<![CDATA[", i)) {
      const e = text.indexOf("]]>", i + 9);
      if (e < 0) fail("unclosed-cdata");
      pushText(text.slice(i + 9, e));
      i = e + 3;
    } else if (text.startsWith("<?", i)) {
      const e = text.indexOf("?>", i + 2);
      if (e < 0) fail("unclosed-pi");
      i = e + 2;
    } else if (text.startsWith("<!DOCTYPE", i) || text.startsWith("<!doctype", i)) {
      let depth = 0;
      let j = i + 9;
      for (; j < n; j++) {
        if (text[j] === "[") depth++;
        else if (text[j] === "]") depth--;
        else if (text[j] === ">" && depth <= 0) break;
      }
      if (j >= n) fail("unclosed-doctype");
      i = j + 1;
    } else if (text[i + 1] === "/") {
      const m = /^<\/([^\s>]+)\s*>/.exec(text.slice(i, i + 300));
      if (!m) fail("bad-close-tag");
      const top = stack.pop();
      if (!top) fail("unexpected-close", i, m![1]);
      if (top!.name !== m![1]) fail("mismatched-tag", i, `${top!.name} ≠ ${m![1]}`);
      i += m![0].length;
    } else {
      const m = /^<([A-Za-z_:][\w:.-]*)/.exec(text.slice(i, i + 300));
      if (!m) fail("bad-tag");
      const el: XmlElement = { name: m![1], attrs: [], children: [] };
      i += m![0].length;
      let self = false;
      for (;;) {
        while (/\s/.test(text[i] ?? "")) i++;
        if (i >= n) fail("unclosed-tag");
        if (text[i] === ">") {
          i++;
          break;
        }
        if (text[i] === "/" && text[i + 1] === ">") {
          self = true;
          i += 2;
          break;
        }
        const am = /^([A-Za-z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/.exec(text.slice(i, i + 10000));
        if (!am) fail("bad-attribute");
        const name = am![1];
        if (el.attrs.some(([k]) => k === name)) fail("duplicate-attribute", i, name);
        el.attrs.push([name, decodeXmlEntities(am![3] ?? am![4] ?? "", unknown)]);
        i += am![0].length;
      }
      if (stack.length) stack[stack.length - 1].children.push(el);
      else if (root) fail("multiple-roots", i);
      else root = el;
      if (!self) stack.push(el);
    }
  }
  if (stack.length) fail("unclosed-element", n, stack[stack.length - 1].name);
  if (!root) fail("no-root", 0);
  return { root: root!, unknownEntities: [...unknown] };
}

/** XML element → V using the documented mapping. */
export function xmlToValue(el: XmlElement, o: { trim?: boolean } = {}): V {
  const trim = o.trim !== false;
  const elems = el.children.filter((c): c is XmlElement => typeof c !== "string");
  const text = el.children.filter((c): c is string => typeof c === "string").join("");
  const t = trim ? text.trim() : text;
  if (!el.attrs.length && !elems.length) return t;
  const obj = new Obj();
  for (const [k, v] of el.attrs) obj.entries.push([`@${k}`, v]);
  const groups = new Map<string, V[]>();
  for (const c of elems) {
    const list = groups.get(c.name) ?? [];
    list.push(xmlToValue(c, o));
    groups.set(c.name, list);
  }
  for (const [k, list] of groups) obj.entries.push([k, list.length === 1 ? list[0] : list]);
  if (t) obj.entries.push(["#text", t]);
  return obj;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

function xmlName(k: string, warnings?: Set<string>): string {
  let s = k.replace(/[^\w:.-]/g, "_");
  if (!/^[A-Za-z_:]/.test(s)) s = `_${s}`;
  if (/^xml/i.test(s) && s !== k) s = `_${s}`;
  if (s !== k) warnings?.add(k);
  return s;
}

const scalarText = (v: V) => (v === null ? "" : v instanceof Num ? v.raw : typeof v === "object" ? "" : String(v));

export function valueToXml(v: V, o: { root?: string; item?: string; indent?: number; declaration?: boolean } = {}): { xml: string; renamed: string[] } {
  const unit = " ".repeat(o.indent ?? 2);
  const item = o.item ?? "item";
  const renamed = new Set<string>();
  const lines: string[] = [];
  const element = (name: string, x: V, ind: string) => {
    const tag = xmlName(name, renamed);
    if (Array.isArray(x)) {
      for (const e of x) element(name, e, ind);
      return;
    }
    if (isObj(x)) {
      const attrs = x.entries.filter(([k]) => k.startsWith("@")).map(([k, a]) => ` ${xmlName(k.slice(1), renamed)}="${escAttr(scalarText(a))}"`);
      const text = x.get("#text");
      const kids = x.entries.filter(([k]) => !k.startsWith("@") && k !== "#text");
      if (!kids.length) {
        const t = text === undefined ? "" : esc(scalarText(text));
        lines.push(`${ind}<${tag}${attrs.join("")}${t ? `>${t}</${tag}>` : " />"}`);
        return;
      }
      lines.push(`${ind}<${tag}${attrs.join("")}>`);
      if (text !== undefined) lines.push(ind + unit + esc(scalarText(text)));
      for (const [k, e] of kids) element(k, e, ind + unit);
      lines.push(`${ind}</${tag}>`);
      return;
    }
    const t = esc(scalarText(x));
    lines.push(t === "" && x === null ? `${ind}<${tag} />` : `${ind}<${tag}>${t}</${tag}>`);
  };
  let rootName = o.root ?? "root";
  let body: V = v;
  if (!o.root && isObj(v) && v.entries.length === 1 && !v.entries[0][0].startsWith("@") && !Array.isArray(v.entries[0][1])) {
    rootName = v.entries[0][0];
    body = v.entries[0][1];
  }
  if (Array.isArray(body)) element(rootName, new Obj([[item, body]]), "");
  else element(rootName, body, "");
  return { xml: (o.declaration !== false ? '<?xml version="1.0" encoding="UTF-8"?>\n' : "") + lines.join("\n") + "\n", renamed: [...renamed] };
}
