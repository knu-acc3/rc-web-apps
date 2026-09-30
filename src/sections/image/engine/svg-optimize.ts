/**
 * Safe SVG optimiser. Works on the parsed DOM (never regex-minifies markup):
 * the XML declaration and DOCTYPE are kept verbatim, <use>, <animate>,
 * <style>, <title>/<desc> and text content are never touched.
 */

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/** Round every number in path data / point lists to `precision` decimals. */
export function roundNumbers(value: string, precision: number): string {
  const f = 10 ** precision;
  return value.replace(NUM, (m) => {
    const n = Number(m);
    if (!Number.isFinite(n)) return m;
    const r = Math.round(n * f) / f;
    let s = String(Object.is(r, -0) ? 0 : r);
    if (s.includes("e")) s = r.toFixed(precision).replace(/\.?0+$/, "");
    return s;
  });
}

export interface SvgReport {
  comments: number;
  metadata: number;
  editorNodes: number;
  editorAttrs: number;
  whitespace: number;
  rounded: number;
}

const EDITOR_NS = ["http://www.inkscape.org/namespaces/inkscape", "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd", "http://ns.adobe.com/AdobeIllustrator/10.0/", "http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/", "http://ns.adobe.com/Extensibility/1.0/", "http://ns.adobe.com/Graphs/1.0/", "http://ns.adobe.com/SaveForWeb/1.0/", "http://ns.adobe.com/Variables/1.0/", "http://ns.adobe.com/ImageReplacement/1.0/", "http://ns.adobe.com/GenericCustomNamespace/1.0/", "http://ns.adobe.com/XPath/1.0/", "http://www.bohemiancoding.com/sketch/ns"];
const EDITOR_PREFIX = /^(inkscape|sodipodi|sketch|i|x|graph|a):/;
const KEEP_WS = new Set(["text", "tspan", "textPath", "style", "script", "title", "desc", "pre"]);
const ROUND_ATTRS = new Set(["d", "points"]);

/** Split off the XML declaration / DOCTYPE / leading comments exactly as written. */
export function splitProlog(src: string): { prolog: string; body: string } {
  const m = /^﻿?\s*(<\?xml[^>]*\?>)?\s*(<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>)?/i.exec(src);
  const decl = m?.[1] ?? "";
  const doctype = m?.[2] ?? "";
  const prolog = [decl, doctype].filter(Boolean).join("\n");
  return { prolog, body: src };
}

export function optimizeSvg(src: string, opts: { precision: number | null }): { output: string; report: SvgReport } {
  const { prolog } = splitProlog(src);
  const doc = new DOMParser().parseFromString(src, "image/svg+xml");
  if (doc.getElementsByTagName("parsererror").length || doc.documentElement.localName !== "svg") throw new Error("SVG_INVALID");
  const report: SvgReport = { comments: 0, metadata: 0, editorNodes: 0, editorAttrs: 0, whitespace: 0, rounded: 0 };

  const walk = (node: Node, keepWs: boolean) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child);
        report.comments++;
        continue;
      }
      if (child.nodeType === Node.TEXT_NODE) {
        if (!keepWs && !child.nodeValue?.trim()) {
          node.removeChild(child);
          report.whitespace++;
        }
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as Element;
      if (el.localName === "metadata" && el.namespaceURI === "http://www.w3.org/2000/svg") {
        node.removeChild(el);
        report.metadata++;
        continue;
      }
      if (el.namespaceURI && EDITOR_NS.includes(el.namespaceURI)) {
        node.removeChild(el);
        report.editorNodes++;
        continue;
      }
      for (const attr of Array.from(el.attributes)) {
        const isEditorNs = attr.namespaceURI && EDITOR_NS.includes(attr.namespaceURI);
        const isEditorDecl = attr.prefix === "xmlns" && EDITOR_NS.includes(attr.value);
        if (isEditorNs || isEditorDecl || (!attr.namespaceURI && EDITOR_PREFIX.test(attr.name) && attr.name !== "xml:space")) {
          el.removeAttributeNode(attr);
          report.editorAttrs++;
          continue;
        }
        if (opts.precision !== null && ROUND_ATTRS.has(attr.name)) {
          const next = roundNumbers(attr.value, opts.precision);
          if (next !== attr.value) {
            attr.value = next;
            report.rounded++;
          }
        }
      }
      const preserve = keepWs || KEEP_WS.has(el.localName) || el.getAttribute("xml:space") === "preserve";
      walk(el, preserve);
    }
  };
  walk(doc.documentElement, doc.documentElement.getAttribute("xml:space") === "preserve");
  const body = new XMLSerializer().serializeToString(doc.documentElement);
  return { output: prolog ? `${prolog}\n${body}` : body, report };
}
