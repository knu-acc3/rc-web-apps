/**
 * HTML → JSX converter with its own tolerant HTML tokenizer (no DOM needed).
 * class→className, for→htmlFor, style strings → objects, camelCase attributes (incl. SVG),
 * void elements self-closed, comments → {/* *\/}, braces in text escaped, fragments for
 * multiple roots, inline event handlers turned into arrow functions (with a warning).
 */

type Node =
  | { t: "el"; name: string; attrs: [string, string | null][]; kids: Node[] }
  | { t: "text"; v: string }
  | { t: "comment"; v: string };

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "pre"]);

function parseHtml(html: string): Node[] {
  const root: Node & { t: "el" } = { t: "el", name: "#root", attrs: [], kids: [] };
  const stack: (Node & { t: "el" })[] = [root];
  const top = () => stack[stack.length - 1];
  let i = 0;
  while (i < html.length) {
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      const stop = end < 0 ? html.length : end;
      top().kids.push({ t: "comment", v: html.slice(i + 4, stop) });
      i = stop + 3;
      continue;
    }
    if (html.startsWith("<!", i) || html.startsWith("<?", i)) {
      const end = html.indexOf(">", i);
      i = end < 0 ? html.length : end + 1;
      continue;
    }
    if (html[i] === "<" && html[i + 1] === "/") {
      const m = /^<\/\s*([A-Za-z][\w:.-]*)\s*>/.exec(html.slice(i));
      if (m) {
        const name = m[1].toLowerCase();
        const idx = stack.map((e) => e.name.toLowerCase()).lastIndexOf(name);
        if (idx > 0) stack.length = idx;
        i += m[0].length;
        continue;
      }
    }
    if (html[i] === "<" && /[A-Za-z]/.test(html[i + 1] ?? "")) {
      const m = /^<([A-Za-z][\w:.-]*)/.exec(html.slice(i))!;
      const name = m[1];
      let j = i + m[0].length;
      const attrs: [string, string | null][] = [];
      let selfClose = false;
      for (;;) {
        while (/\s/.test(html[j] ?? "")) j++;
        if (j >= html.length) break;
        if (html[j] === ">") {
          j++;
          break;
        }
        if (html[j] === "/" && html[j + 1] === ">") {
          selfClose = true;
          j += 2;
          break;
        }
        const am = /^[^\s"'>/=]+/.exec(html.slice(j));
        if (!am) {
          j++;
          continue;
        }
        const an = am[0];
        j += an.length;
        while (/\s/.test(html[j] ?? "")) j++;
        if (html[j] === "=") {
          j++;
          while (/\s/.test(html[j] ?? "")) j++;
          const qc = html[j];
          if (qc === '"' || qc === "'") {
            const end = html.indexOf(qc, j + 1);
            const stop = end < 0 ? html.length : end;
            attrs.push([an, html.slice(j + 1, stop)]);
            j = stop + 1;
          } else {
            const vm = /^[^\s>]*/.exec(html.slice(j))!;
            attrs.push([an, vm[0]]);
            j += vm[0].length;
          }
        } else attrs.push([an, null]);
      }
      const el: Node & { t: "el" } = { t: "el", name, attrs, kids: [] };
      top().kids.push(el);
      i = j;
      const low = name.toLowerCase();
      if (selfClose || VOID.has(low)) continue;
      if (RAW.has(low)) {
        const close = html.toLowerCase().indexOf(`</${low}`, i);
        const stop = close < 0 ? html.length : close;
        if (stop > i) el.kids.push({ t: "text", v: html.slice(i, stop) });
        const gt = html.indexOf(">", stop);
        i = close < 0 ? html.length : gt < 0 ? html.length : gt + 1;
        continue;
      }
      stack.push(el);
      continue;
    }
    const next = html.indexOf("<", i + 1);
    const stop = next < 0 ? html.length : next;
    top().kids.push({ t: "text", v: html.slice(i, stop) });
    i = stop;
  }
  return root.kids;
}

const ATTR: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  minlength: "minLength",
  colspan: "colSpan",
  rowspan: "rowSpan",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  enctype: "encType",
  frameborder: "frameBorder",
  allowfullscreen: "allowFullScreen",
  srcset: "srcSet",
  srcdoc: "srcDoc",
  usemap: "useMap",
  novalidate: "noValidate",
  accesskey: "accessKey",
  spellcheck: "spellCheck",
  datetime: "dateTime",
  charset: "charSet",
  "http-equiv": "httpEquiv",
  "accept-charset": "acceptCharset",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  playsinline: "playsInline",
  formaction: "formAction",
  formmethod: "formMethod",
  formnovalidate: "formNoValidate",
  formtarget: "formTarget",
  inputmode: "inputMode",
  referrerpolicy: "referrerPolicy",
  enterkeyhint: "enterKeyHint",
  itemprop: "itemProp",
  itemscope: "itemScope",
  itemtype: "itemType",
  marginwidth: "marginWidth",
  marginheight: "marginHeight",
  hreflang: "hrefLang",
  "xlink:href": "xlinkHref",
  "xml:lang": "xmlLang",
  "xml:space": "xmlSpace",
  "xmlns:xlink": "xmlnsXlink",
  viewbox: "viewBox",
  preserveaspectratio: "preserveAspectRatio",
  gradientunits: "gradientUnits",
  gradienttransform: "gradientTransform",
  patternunits: "patternUnits",
  maskunits: "maskUnits",
  stddeviation: "stdDeviation",
  markerwidth: "markerWidth",
  markerheight: "markerHeight",
  refx: "refX",
  refy: "refY",
};

const camel = (s: string) => s.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());

export function jsxAttrName(name: string): string {
  const low = name.toLowerCase();
  if (ATTR[low]) return ATTR[low];
  if (low.startsWith("data-") || low.startsWith("aria-")) return low;
  if (/^on[a-z]+$/.test(low)) {
    if (low === "ondblclick") return "onDoubleClick";
    const words = ["context", "menu", "key", "mouse", "pointer", "touch", "drag", "down", "up", "move", "press", "enter", "leave", "over", "out", "start", "end", "cancel", "change", "animation", "transition", "iteration", "focus", "in", "before", "after", "input", "load", "data", "metadata", "time", "update", "can", "play", "through", "volume", "rate", "duration", "loaded", "click", "wheel", "scroll", "submit", "reset", "select", "error", "blur", "copy", "cut", "paste", "drop", "invalid", "toggle", "ended", "pause", "playing", "seeked", "seeking", "stalled", "suspend", "waiting", "abort", "emptied", "progress", "resize", "composition", "lost", "got", "capture"];
    let rest = low.slice(2);
    let name = "on";
    while (rest) {
      const w = words.filter((x) => rest.startsWith(x)).sort((a, b) => b.length - a.length)[0];
      if (!w) {
        name += rest[0].toUpperCase() + rest.slice(1);
        break;
      }
      name += w[0].toUpperCase() + w.slice(1);
      rest = rest.slice(w.length);
    }
    return name;
  }
  if (name.includes("-") || name.includes(":")) return camel(low);
  return name;
}

export function styleToObject(css: string): string {
  const entries: string[] = [];
  for (const decl of css.split(";")) {
    const c = decl.indexOf(":");
    if (c < 0) continue;
    const prop = decl.slice(0, c).trim();
    const value = decl.slice(c + 1).trim();
    if (!prop) continue;
    let key: string;
    if (prop.startsWith("--")) key = JSON.stringify(prop);
    else {
      key = prop.toLowerCase().replace(/^-ms-/, "ms-").replace(/^-(webkit|moz|o)-/, (_, v: string) => `${v[0].toUpperCase()}${v.slice(1)}-`);
      key = camel(key);
      if (!/^[A-Za-z_$][\w$]*$/.test(key)) key = JSON.stringify(key);
    }
    // plain numbers stay numbers (React adds px where the property needs a unit)
    entries.push(`${key}: ${/^-?\d+(\.\d+)?$/.test(value) ? value : JSON.stringify(value)}`);
  }
  return `{{ ${entries.join(", ")} }}`;
}

interface JsxOptions {
  /** value/checked/selected → defaultValue/defaultChecked/defaultSelected (uncontrolled) */
  uncontrolled?: boolean;
  /** Wrap in a function component */
  component?: string;
  indent?: number;
}

interface JsxResult {
  code: string;
  warnings: string[];
}

function escapeText(s: string): string {
  return s.replace(/[{}<>]/g, (c) => `{"${c}"}`);
}

export function htmlToJsx(html: string, o: JsxOptions = {}): JsxResult {
  const warnings = new Set<string>();
  const ind = " ".repeat(o.indent ?? 2);
  const nodes = parseHtml(html);

  const attrsOf = (el: Node & { t: "el" }): string[] => {
    const out: string[] = [];
    const tag = el.name.toLowerCase();
    for (const [raw, v] of el.attrs) {
      let name = jsxAttrName(raw);
      if (o.uncontrolled !== false) {
        if (name === "value" && (tag === "input" || tag === "textarea" || tag === "select")) name = "defaultValue";
        if (name === "checked" && tag === "input") name = "defaultChecked";
        if (name === "selected" && tag === "option") name = "defaultSelected";
      }
      if (v === null) {
        out.push(name);
        continue;
      }
      if (name === "style") {
        out.push(`style=${styleToObject(v)}`);
        continue;
      }
      if (/^on[A-Z]/.test(name)) {
        warnings.add("events");
        out.push(`${name}={() => { ${v.replace(/;?\s*$/, "")} }}`);
        continue;
      }
      out.push(v.includes('"') ? `${name}={${JSON.stringify(v)}}` : `${name}="${v}"`);
    }
    return out;
  };

  const print = (n: Node, depth: number): string[] => {
    const pad = ind.repeat(depth);
    if (n.t === "comment") return [`${pad}{/*${n.v.replace(/\*\//g, "* /")}*/}`];
    if (n.t === "text") {
      const collapsed = n.v.replace(/\s+/g, " ");
      if (!collapsed.trim()) return [];
      return [pad + escapeText(collapsed.trim())];
    }
    const tag = n.name;
    const low = tag.toLowerCase();
    const attrs = attrsOf(n);
    const open = `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}`;
    if (VOID.has(low) || n.kids.length === 0) return [`${pad}${open} />`];
    if (low === "script" || low === "style") {
      const text = n.kids.map((k) => (k.t === "text" ? k.v : "")).join("");
      warnings.add(low);
      return [`${pad}${open}>`, `${pad}${ind}{\`${text.replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\`}`, `${pad}</${tag}>`];
    }
    if (low === "textarea") {
      const text = n.kids.map((k) => (k.t === "text" ? k.v : "")).join("");
      return [`${pad}<${tag}${attrs.length ? " " + attrs.join(" ") : ""} defaultValue={${JSON.stringify(text)}} />`];
    }
    if (low === "pre") {
      const text = n.kids.map((k) => (k.t === "text" ? k.v : "")).join("");
      return [`${pad}${open}>{${JSON.stringify(text)}}</${tag}>`];
    }
    const inner = n.kids.flatMap((k) => print(k, depth + 1));
    if (inner.length === 1 && inner[0].length - pad.length < 60 && n.kids.every((k) => k.t === "text")) return [`${pad}${open}>${inner[0].trim()}</${tag}>`];
    return [`${pad}${open}>`, ...inner, `${pad}</${tag}>`];
  };

  const roots = nodes.filter((n) => !(n.t === "text" && !n.v.trim()));
  const base = o.component ? 2 : 0;
  let lines: string[];
  if (roots.length > 1) lines = [`${ind.repeat(base)}<>`, ...roots.flatMap((n) => print(n, base + 1)), `${ind.repeat(base)}</>`];
  else lines = roots.flatMap((n) => print(n, base));
  let code = lines.join("\n");
  if (o.component) code = `export default function ${o.component}() {\n${ind}return (\n${code}\n${ind});\n}`;
  return { code, warnings: [...warnings] };
}
