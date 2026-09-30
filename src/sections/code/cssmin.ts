/**
 * Tokenizer-based CSS minifier. Safe by construction:
 * - strings, url(...) and custom-property values are copied verbatim
 * - inside parentheses (calc, min, max, clamp, var …) spaces are kept as single spaces
 * - descendant combinators and "a :hover" in selectors keep their meaning
 * - nothing is renamed, reordered, lower-cased or vendor-prefixed
 */

export interface CssMinOptions {
  /** keep /*! … *\/ comments (licenses); default true */
  keepImportant?: boolean;
}

type Ctx = "rules" | "decls";

const BLOCK_RULES = /^@(?:media|supports|document|-moz-document|layer|container|scope|starting-style)\b/i;

export function minifyCss(css: string, o: CssMinOptions = {}): string {
  const out: string[] = [];
  const stack: Ctx[] = ["rules"];
  const n = css.length;
  let i = 0;
  let space = false; // whitespace seen since the last token
  let depth = 0; // parentheses depth
  let prelude = ""; // selector / at-rule prelude / property name
  let inValue = false;
  let custom = false;

  const ctx = () => stack[stack.length - 1];
  const prev = () => {
    const l = out[out.length - 1] ?? "";
    return l[l.length - 1] ?? "";
  };
  const atRule = () => prelude.trimStart().startsWith("@");

  const keepSpace = (a: string, b: string): boolean => {
    if (!a || "{};,".includes(a) || "{};,".includes(b)) return false;
    if (depth > 0) {
      if (a === "(" || b === ")") return false;
      if ((a === ":" || b === ":") && atRule()) return false;
      return true;
    }
    if (inValue) return a !== ":" && b !== "!" && a !== "!";
    // selectors, preludes, property names
    if (">~+".includes(a) || ">~+".includes(b)) return atRule();
    if (b === "(") return atRule();
    if (a === ":") return false;
    return true;
  };

  const emit = (s: string) => {
    if (space && keepSpace(prev(), s[0])) out.push(" ");
    space = false;
    out.push(s);
    if (!inValue) prelude += s;
  };

  const reset = () => {
    prelude = "";
    inValue = false;
    custom = false;
    depth = 0;
    space = false;
  };

  while (i < n) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      if (o.keepImportant !== false && css[i + 2] === "!") {
        out.push(css.slice(i, stop));
        space = false;
        i = stop;
        while (i < n && /\s/.test(css[i])) i++;
        continue;
      }
      space = true;
      i = stop;
      continue;
    }
    if (c === " " || c === "\n" || c === "\t" || c === "\r" || c === "\f") {
      space = true;
      i++;
      continue;
    }
    if (custom && inValue && depth === 0 && c !== ";" && c !== "}") {
      // custom property value: verbatim up to ; or } at nesting depth 0
      let j = i;
      let d = 0;
      for (; j < n; j++) {
        const ch = css[j];
        if (ch === '"' || ch === "'") {
          j++;
          while (j < n && css[j] !== ch) {
            if (css[j] === "\\") j++;
            j++;
          }
        } else if ("([{".includes(ch)) d++;
        else if (")]}".includes(ch)) {
          if (d === 0) break;
          d--;
        } else if (ch === ";" && d === 0) break;
      }
      space = false;
      out.push(css.slice(i, j).trim());
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c && css[j] !== "\n") {
        if (css[j] === "\\") j++;
        j++;
      }
      emit(css.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if ((c === "u" || c === "U") && /^url\(/i.test(css.slice(i, i + 4)) && !/[\w-]/.test(css[i - 1] ?? "")) {
      let j = i + 4;
      while (j < n && /\s/.test(css[j])) j++;
      if (css[j] !== '"' && css[j] !== "'") {
        const end = css.indexOf(")", j);
        const stop = end < 0 ? n : end + 1;
        emit(`${css.slice(i, i + 4)}${css.slice(j, stop - 1).trim()})`);
        i = stop;
        continue;
      }
    }
    if (c === "{") {
      const pre = prelude.trim();
      if (prev() === " ") out.pop();
      out.push("{");
      stack.push(ctx() === "rules" && BLOCK_RULES.test(pre) ? "rules" : "decls");
      reset();
      i++;
      continue;
    }
    if (c === "}") {
      if (prev() === ";") out.pop();
      out.push("}");
      if (stack.length > 1) stack.pop();
      reset();
      i++;
      continue;
    }
    if (c === ";") {
      if (prev() !== ";" && prev() !== "{" && out.length) out.push(";");
      reset();
      i++;
      continue;
    }
    if (c === ":" && ctx() === "decls" && !inValue && depth === 0) {
      // a property colon unless a "{" comes before the next ";" / "}" (nested selector like &:hover)
      let j = i + 1;
      while (j < n && !";{}".includes(css[j])) j++;
      if (css[j] !== "{" || prelude.trim().startsWith("--")) {
        custom = prelude.trim().startsWith("--");
        space = false;
        out.push(":");
        inValue = true;
        i++;
        continue;
      }
    }
    if (c === "(") {
      emit("(");
      depth++;
      i++;
      continue;
    }
    if (c === ")") {
      space = false;
      out.push(")");
      if (!inValue) prelude += ")";
      depth = Math.max(0, depth - 1);
      i++;
      continue;
    }
    if (",:>~+!".includes(c) && !(c === "+" && inValue)) {
      emit(c);
      i++;
      continue;
    }
    let j = i + 1;
    while (j < n && !/[\s{}();:,"'!>~]/.test(css[j]) && !(css[j] === "/" && css[j + 1] === "*") && !(css[j] === "+" && !inValue)) j++;
    emit(css.slice(i, j));
    i = j;
  }
  return out.join("").trim();
}

/** gzip size in bytes via CompressionStream (browsers, Node 18+); null when unavailable. */
export async function gzipSize(text: string): Promise<number | null> {
  if (typeof CompressionStream === "undefined") return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return (await new Response(stream).arrayBuffer()).byteLength;
}
