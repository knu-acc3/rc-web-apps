/**
 * HTML minifier, XML pretty-printer / minifier and SQL minifier (pure TS, tokenizer based).
 */
import { minifyCss } from "./cssmin";

/* ───────────── HTML ───────────── */

const RAW = new Set(["script", "style", "pre", "textarea"]);
const BLOCK = new Set(
  "html head body title meta link base script style noscript template div p ul ol li dl dt dd table caption colgroup col thead tbody tfoot tr td th section article header footer nav main aside h1 h2 h3 h4 h5 h6 form fieldset legend hr br figure figcaption blockquote address details summary dialog menu option optgroup select iframe canvas video audio source track picture svg pre".split(" "),
);

type HTok = { t: "text"; v: string } | { t: "tag"; v: string; name: string; close: boolean } | { t: "raw"; v: string } | { t: "comment"; v: string; keep: boolean };

function tokenizeHtml(html: string): HTok[] {
  const toks: HTok[] = [];
  let i = 0;
  const n = html.length;
  while (i < n) {
    if (html.startsWith("<!--", i)) {
      const e = html.indexOf("-->", i + 4);
      const stop = e < 0 ? n : e + 3;
      const v = html.slice(i, stop);
      toks.push({ t: "comment", v, keep: /^<!--\[if|^<!--<!\[endif|^<!--!/i.test(v) });
      i = stop;
      continue;
    }
    if (html[i] === "<" && /[A-Za-z!/?]/.test(html[i + 1] ?? "")) {
      let j = i + 1;
      let q = "";
      while (j < n) {
        const c = html[j];
        if (q) {
          if (c === q) q = "";
        } else if (c === '"' || c === "'") q = c;
        else if (c === ">") break;
        j++;
      }
      const v = html.slice(i, j + 1);
      const m = /^<\/?\s*([A-Za-z][\w:-]*)/.exec(v);
      const name = (m?.[1] ?? "").toLowerCase();
      const close = v.startsWith("</");
      toks.push({ t: "tag", v, name, close });
      i = j + 1;
      if (!close && RAW.has(name) && !v.endsWith("/>")) {
        const endIdx = html.toLowerCase().indexOf(`</${name}`, i);
        const stop = endIdx < 0 ? n : endIdx;
        if (stop > i) toks.push({ t: "raw", v: html.slice(i, stop) });
        i = stop;
      }
      continue;
    }
    const lt = html.indexOf("<", i + 1);
    const stop = lt < 0 ? n : lt;
    toks.push({ t: "text", v: html.slice(i, stop) });
    i = stop;
  }
  return toks;
}

function tidyTag(v: string): string {
  let out = "";
  let q = "";
  let ws = false;
  for (let i = 0; i < v.length; i++) {
    const c = v[i];
    if (q) {
      out += c;
      if (c === q) q = "";
      continue;
    }
    if (c === '"' || c === "'") {
      if (ws && !out.endsWith("=")) out += " ";
      ws = false;
      q = c;
      out += c;
      continue;
    }
    if (/\s/.test(c)) {
      ws = true;
      continue;
    }
    if (ws && !(c === ">" || c === "=" || out.endsWith("=") || (c === "/" && v[i + 1] === ">"))) out += " ";
    ws = false;
    out += c;
  }
  return out;
}

export function minifyHtml(html: string, o: { keepComments?: boolean; minifyCss?: boolean } = {}): string {
  // dropped comments are transparent: "a <!-- x --> b" must stay "a b", so merge the text around them
  const toks: HTok[] = [];
  for (const tk of tokenizeHtml(html)) {
    if (tk.t === "comment" && !tk.keep && !o.keepComments) continue;
    const last = toks[toks.length - 1];
    if (tk.t === "text" && last?.t === "text") last.v += tk.v;
    else toks.push(tk);
  }
  const out: string[] = [];
  let rawOf = "";
  toks.forEach((tk, idx) => {
    if (tk.t === "comment") {
      out.push(tk.v);
      return;
    }
    if (tk.t === "tag") {
      out.push(tidyTag(tk.v));
      rawOf = !tk.close && RAW.has(tk.name) ? tk.name : "";
      return;
    }
    if (tk.t === "raw") {
      if (rawOf === "style" && o.minifyCss !== false) {
        try {
          out.push(minifyCss(tk.v));
          return;
        } catch {
          /* keep as is */
        }
      }
      out.push(rawOf === "script" ? tk.v.trim() : tk.v);
      return;
    }
    let v = tk.v.replace(/\s+/g, " ");
    const prev = toks[idx - 1];
    const next = toks[idx + 1];
    const blockPrev = !prev || (prev.t === "tag" && BLOCK.has(prev.name)) || prev.t === "comment";
    const blockNext = !next || (next.t === "tag" && BLOCK.has(next.name)) || next.t === "comment";
    if (blockPrev) v = v.replace(/^ /, "");
    if (blockNext) v = v.replace(/ $/, "");
    if (v) out.push(v);
  });
  return out.join("").trim();
}

/* ───────────── XML ───────────── */

type XTok = { t: "open" | "close" | "self" | "decl" | "comment" | "cdata" | "doctype" | "text"; v: string; name?: string };

function tokenizeXml(xml: string): XTok[] {
  const src = xml.replace(/^\ufeff/, "");
  const toks: XTok[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    if (src.startsWith("<!--", i)) {
      const e = src.indexOf("-->", i + 4);
      const stop = e < 0 ? n : e + 3;
      toks.push({ t: "comment", v: src.slice(i, stop) });
      i = stop;
    } else if (src.startsWith("<![CDATA[", i)) {
      const e = src.indexOf("]]>", i + 9);
      const stop = e < 0 ? n : e + 3;
      toks.push({ t: "cdata", v: src.slice(i, stop) });
      i = stop;
    } else if (src.startsWith("<?", i)) {
      const e = src.indexOf("?>", i + 2);
      const stop = e < 0 ? n : e + 2;
      toks.push({ t: "decl", v: src.slice(i, stop) });
      i = stop;
    } else if (src.startsWith("<!", i)) {
      let depth = 0;
      let j = i + 2;
      for (; j < n; j++) {
        if (src[j] === "[") depth++;
        else if (src[j] === "]") depth--;
        else if (src[j] === ">" && depth <= 0) break;
      }
      toks.push({ t: "doctype", v: src.slice(i, j + 1) });
      i = j + 1;
    } else if (src[i] === "<") {
      let j = i + 1;
      let q = "";
      while (j < n) {
        const c = src[j];
        if (q) {
          if (c === q) q = "";
        } else if (c === '"' || c === "'") q = c;
        else if (c === ">") break;
        j++;
      }
      const v = src.slice(i, j + 1);
      const name = /^<\/?([^\s/>]+)/.exec(v)?.[1];
      toks.push({ t: v.startsWith("</") ? "close" : v.endsWith("/>") ? "self" : "open", v: tidyTag(v), name });
      i = j + 1;
    } else {
      const lt = src.indexOf("<", i);
      const stop = lt < 0 ? n : lt;
      toks.push({ t: "text", v: src.slice(i, stop) });
      i = stop;
    }
  }
  return toks;
}

export function formatXml(xml: string, o: { indent?: string; minify?: boolean; keepComments?: boolean } = {}): string {
  const toks = tokenizeXml(xml);
  const unit = o.indent ?? "  ";
  if (o.minify) {
    return toks
      .filter((t) => !(t.t === "text" && !t.v.trim()) && !(t.t === "comment" && !o.keepComments))
      .map((t) => t.v)
      .join("");
  }
  const lines: string[] = [];
  let depth = 0;
  let preserve = 0;
  let buf = "";
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (preserve) {
      buf += t.v;
      if (t.t === "open") preserve++;
      if (t.t === "close") preserve--;
      if (!preserve) {
        lines.push(buf);
        buf = "";
      }
      continue;
    }
    const pad = unit.repeat(depth);
    if (t.t === "text") {
      const v = t.v.trim();
      if (v) lines.push(pad + v.replace(/\s*\n\s*/g, " "));
      continue;
    }
    if (t.t === "open") {
      // <a>text</a> on one line
      const next = toks[k + 1];
      const after = toks[k + 2];
      if (next && after && (next.t === "text" || next.t === "cdata") && after.t === "close" && !next.v.includes("\n")) {
        lines.push(pad + t.v + next.v.trim() + after.v);
        k += 2;
        continue;
      }
      if (next && next.t === "close") {
        lines.push(pad + t.v + next.v);
        k += 1;
        continue;
      }
      if (/xml:space\s*=\s*["']preserve["']/.test(t.v)) {
        preserve = 1;
        buf = pad + t.v;
        continue;
      }
      lines.push(pad + t.v);
      depth++;
      continue;
    }
    if (t.t === "close") {
      depth = Math.max(0, depth - 1);
      lines.push(unit.repeat(depth) + t.v);
      continue;
    }
    lines.push(pad + t.v);
  }
  if (buf) lines.push(buf);
  return lines.join("\n") + "\n";
}

/* ───────────── SQL ───────────── */

export function minifySql(sql: string): string {
  let out = "";
  let i = 0;
  const n = sql.length;
  let space = false;
  const put = (s: string) => {
    if (space && out && !/[(,;]$/.test(out) && !/^[),;]/.test(s)) out += " ";
    space = false;
    out += s;
  };
  while (i < n) {
    const c = sql[i];
    if (/\s/.test(c)) {
      space = true;
      i++;
    } else if (c === "-" && sql[i + 1] === "-") {
      const e = sql.indexOf("\n", i);
      i = e < 0 ? n : e;
      space = true;
    } else if (c === "/" && sql[i + 1] === "*") {
      const e = sql.indexOf("*/", i + 2);
      const stop = e < 0 ? n : e + 2;
      // MySQL executable comments /*! … */ and optimizer hints /*+ … */ are code, not comments
      if (sql[i + 2] === "!" || sql[i + 2] === "+") put(sql.slice(i, stop));
      else space = true;
      i = stop;
    } else if (c === "#") {
      // MySQL line comment or PostgreSQL operator: keep the line as is and keep its line break
      const e = sql.indexOf("\n", i);
      const stop = e < 0 ? n : e;
      put(sql.slice(i, stop).trimEnd());
      if (stop < n) out += "\n";
      space = false;
      i = stop + 1;
    } else if (c === "$" && /^\$(?:[A-Za-z_]\w*)?\$/.test(sql.slice(i, i + 64))) {
      // PostgreSQL dollar-quoted body: verbatim
      const tag = /^\$(?:[A-Za-z_]\w*)?\$/.exec(sql.slice(i, i + 64))![0];
      const e = sql.indexOf(tag, i + tag.length);
      const stop = e < 0 ? n : e + tag.length;
      put(sql.slice(i, stop));
      i = stop;
    } else if (c === "'" || c === '"' || c === "`" || c === "[") {
      const close = c === "[" ? "]" : c;
      let j = i + 1;
      while (j < n) {
        if (sql[j] === close) {
          if (sql[j + 1] === close && c !== "[") {
            j += 2;
            continue;
          }
          break;
        }
        if (sql[j] === "\\" && c !== "[" && c !== '"') j++;
        j++;
      }
      put(sql.slice(i, j + 1));
      i = j + 1;
    } else if ("(),;".includes(c)) {
      if (c !== "(") space = false;
      put(c);
      i++;
    } else {
      let j = i + 1;
      while (j < n && !/[\s'"`[(),;#]/.test(sql[j]) && !(sql[j] === "-" && sql[j + 1] === "-") && !(sql[j] === "/" && sql[j + 1] === "*") && !(sql[j] === "$" && /^\$(?:[A-Za-z_]\w*)?\$/.test(sql.slice(j, j + 64)) && !/\w/.test(sql[j - 1]))) j++;
      put(sql.slice(i, j));
      i = j;
    }
  }
  return out.trim();
}
