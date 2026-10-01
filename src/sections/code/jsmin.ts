/**
 * JavaScript whitespace and comment remover (no renaming, no rewriting) built on a real
 * tokenizer: strings, template literals with nested ${…}, regex literals vs division, and
 * /*! license comments. A line break is dropped only where that is provably safe, so
 * automatic semicolon insertion and restricted productions (return, ++, --) keep working.
 */

type Kind = "word" | "num" | "str" | "tpl" | "re" | "punct" | "comment";

interface Tok {
  k: Kind;
  v: string;
  /** whitespace before this token contained a line break */
  nl: boolean;
  /** there was whitespace or a comment before this token */
  sp: boolean;
}

const REGEX_KEYWORDS = new Set(["return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await"]);
const PUNCTS = [">>>=", "...", "===", "!==", "**=", "<<=", ">>=", ">>>", "&&=", "||=", "??=", "=>", "==", "!=", "<=", ">=", "&&", "||", "??", "?.", "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<", ">>", "**"];

export class JsMinError extends Error {
  constructor(
    readonly code: "unterminated-string" | "unterminated-template" | "unterminated-comment" | "unterminated-regex",
    readonly offset: number,
  ) {
    super(code);
  }
}

function skipString(s: string, i: number): number {
  const q = s[i];
  let j = i + 1;
  while (j < s.length && s[j] !== q) {
    if (s[j] === "\\") j += s[j + 1] === "\r" && s[j + 2] === "\n" ? 2 : 1;
    else if (s[j] === "\n") throw new JsMinError("unterminated-string", i);
    j++;
  }
  if (j >= s.length) throw new JsMinError("unterminated-string", i);
  return j + 1;
}

/** End index of a template literal starting at i (handles nested ${ … } with strings/templates/comments). */
function skipTemplate(s: string, i: number): number {
  let j = i + 1;
  while (j < s.length) {
    const c = s[j];
    if (c === "\\") {
      j += 2;
      continue;
    }
    if (c === "`") return j + 1;
    if (c === "$" && s[j + 1] === "{") {
      j += 2;
      let depth = 0;
      while (j < s.length) {
        const d = s[j];
        if (d === "'" || d === '"') j = skipString(s, j);
        else if (d === "`") j = skipTemplate(s, j);
        else if (d === "/" && s[j + 1] === "*") {
          const e = s.indexOf("*/", j + 2);
          if (e < 0) throw new JsMinError("unterminated-comment", j);
          j = e + 2;
        } else if (d === "/" && s[j + 1] === "/") {
          const e = s.indexOf("\n", j);
          j = e < 0 ? s.length : e;
        } else if (d === "{") {
          depth++;
          j++;
        } else if (d === "}") {
          if (depth === 0) {
            j++;
            break;
          }
          depth--;
          j++;
        } else j++;
      }
      continue;
    }
    j++;
  }
  throw new JsMinError("unterminated-template", i);
}

function regexAllowed(prev: Tok | undefined): boolean {
  if (!prev) return true;
  if (prev.k === "word") return REGEX_KEYWORDS.has(prev.v);
  if (prev.k === "punct") return !/^[)\]]$/.test(prev.v) && prev.v !== "++" && prev.v !== "--";
  return false;
}

function tokenizeJs(src: string, keepLicense = true): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = src.length;
  let nl = false;
  let sp = false;
  const lastSig = () => {
    for (let k = toks.length - 1; k >= 0; k--) if (toks[k].k !== "comment") return toks[k];
    return undefined;
  };
  const push = (k: Kind, v: string) => {
    toks.push({ k, v, nl, sp });
    nl = false;
    sp = false;
  };
  if (src.startsWith("#!")) {
    const e = src.indexOf("\n");
    push("comment", src.slice(0, e < 0 ? n : e) + "\n");
    i = e < 0 ? n : e;
  }
  while (i < n) {
    const c = src[i];
    if (c === "\n" || c === "\r" || c === "\u2028" || c === "\u2029") {
      nl = true;
      sp = true;
      i++;
      continue;
    }
    if (c === " " || c === "\t" || c === "\v" || c === "\f" || c === "\u00a0" || c === "\ufeff") {
      sp = true;
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      const e = src.indexOf("\n", i);
      const stop = e < 0 ? n : e;
      if (keepLicense && src[i + 2] === "!") push("comment", `${src.slice(i, stop)}\n`);
      else sp = true;
      i = stop;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const e = src.indexOf("*/", i + 2);
      if (e < 0) throw new JsMinError("unterminated-comment", i);
      const text = src.slice(i, e + 2);
      if (keepLicense && (src[i + 2] === "!" || /@license|@preserve/.test(text))) push("comment", text);
      else {
        sp = true;
        if (/[\n\r\u2028\u2029]/.test(text)) nl = true;
      }
      i = e + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const e = skipString(src, i);
      push("str", src.slice(i, e));
      i = e;
      continue;
    }
    if (c === "`") {
      const e = skipTemplate(src, i);
      push("tpl", src.slice(i, e));
      i = e;
      continue;
    }
    if (c === "/" && regexAllowed(lastSig())) {
      let j = i + 1;
      let cls = false;
      while (j < n) {
        const d = src[j];
        if (d === "\\") j++;
        else if (d === "[") cls = true;
        else if (d === "]") cls = false;
        else if (d === "/" && !cls) break;
        else if (d === "\n") throw new JsMinError("unterminated-regex", i);
        j++;
      }
      if (j >= n) throw new JsMinError("unterminated-regex", i);
      j++;
      while (j < n && /[a-z]/i.test(src[j])) j++;
      push("re", src.slice(i, j));
      i = j;
      continue;
    }
    const num = /^(?:0[xXoObB][\da-fA-F_]+n?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?n?)/.exec(src.slice(i, i + 64));
    if (num && /[\d.]/.test(c) && !(c === "." && !/\d/.test(src[i + 1] ?? ""))) {
      push("num", num[0]);
      i += num[0].length;
      continue;
    }
    const word = /^(?:#?[A-Za-z_$\u0080-\uffff][\w$\u0080-\uffff]*)/.exec(src.slice(i, i + 256));
    if (word) {
      push("word", word[0]);
      i += word[0].length;
      continue;
    }
    const p = PUNCTS.find((x) => src.startsWith(x, i)) ?? c;
    push("punct", p);
    i += p.length;
  }
  return toks;
}

const wordChar = (ch: string) => /[\w$\u0080-\uffff]/.test(ch);

/** Tokens after which a following line break can never matter. */
const SAFE_BEFORE = /^(?:[{([,;:?=*%&|^!~<>.+\-/]|[+\-*/%&|^<>=!]=|===|!==|&&|\|\||\?\?|=>|\.\.\.|\*\*|<<|>>>?|[<>]=?|\?\.|&&=|\|\|=|\?\?=|\*\*=|<<=|>>>?=)$/;
/** Tokens before which a preceding line break can never matter. */
const SAFE_AFTER = /^(?:[)\]},;:?.=*%&|^<>]|[+\-*/%&|^<>=!]=|===|!==|&&|\|\||\?\?|=>|\*\*|<<|>>>?|\?\.)$/;

export function minifyJs(src: string, o: { keepLicense?: boolean } = {}): string {
  const toks = tokenizeJs(src, o.keepLicense !== false);
  let out = "";
  let prev: Tok | undefined;
  for (const t of toks) {
    if (t.k === "comment") {
      if (out && !out.endsWith("\n")) out += t.nl ? "\n" : t.sp ? " " : "";
      out += t.v;
      continue;
    }
    if (prev && t.nl) {
      const safe = (prev.k === "punct" && SAFE_BEFORE.test(prev.v) && prev.v !== "++" && prev.v !== "--") || (t.k === "punct" && SAFE_AFTER.test(t.v));
      if (!safe) {
        if (!out.endsWith("\n")) out += "\n";
        prev = t;
        out += t.v;
        continue;
      }
    }
    if (prev && t.sp) {
      const a = out[out.length - 1] ?? "";
      const b = t.v[0];
      const need = (wordChar(a) && wordChar(b)) || (a === "+" && b === "+") || (a === "-" && b === "-") || (prev.k === "num" && b === "." && /^\d+$/.test(prev.v)) || (prev.k === "re" && wordChar(b)) || (a === "/" && b === "/");
      if (need) out += " ";
    } else if (prev && ((out.endsWith("+") && t.v[0] === "+") || (out.endsWith("-") && t.v[0] === "-"))) out += " ";
    out += t.v;
    prev = t;
  }
  return out.trim();
}
