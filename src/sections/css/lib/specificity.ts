import { splitTop } from "./tokens";

/** (a, b, c): ids, classes/attributes/pseudo-classes, types/pseudo-elements. */
export type Spec = [number, number, number];

export type PartKind = "id" | "class" | "attribute" | "pseudo-class" | "pseudo-element" | "type" | "universal" | "nesting" | "functional";

export interface Part {
  text: string;
  kind: PartKind;
  spec: Spec;
}

export interface SelectorResult {
  selector: string;
  spec: Spec;
  parts: Part[];
  error: string | null;
}

const ZERO: Spec = [0, 0, 0];
const add = (a: Spec, b: Spec): Spec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const compareSpec = (a: Spec, b: Spec) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const maxSpec = (xs: Spec[]) => xs.reduce((m, x) => (compareSpec(x, m) > 0 ? x : m), ZERO);

const LEGACY_PSEUDO_ELEMENTS = new Set(["before", "after", "first-line", "first-letter"]);
const MAX_ARG = new Set(["is", "not", "has", "matches", "-webkit-any", "-moz-any"]);

class Cursor {
  i = 0;
  constructor(public s: string) {}
  cur(): string {
    return this.s[this.i];
  }
  ident(): string {
    let out = "";
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === "\\") {
        out += this.s.slice(this.i, this.i + 2);
        this.i += 2;
      } else if (/[-_a-zA-Z0-9]/.test(c) || c.charCodeAt(0) >= 0x80) {
        out += c;
        this.i++;
      } else break;
    }
    return out;
  }
  /** Balanced "( … )" starting at the current "(", returns the inner text. */
  parens(): string {
    let depth = 0;
    const start = this.i;
    let quote: string | null = null;
    for (; this.i < this.s.length; this.i++) {
      const c = this.s[this.i];
      if (quote) {
        if (c === "\\") this.i++;
        else if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'") quote = c;
      else if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0) {
          this.i++;
          return this.s.slice(start + 1, this.i - 1);
        }
      }
    }
    throw new Error("unclosed (");
  }
  brackets(): string {
    const start = this.i;
    let quote: string | null = null;
    for (this.i++; this.i < this.s.length; this.i++) {
      const c = this.s[this.i];
      if (quote) {
        if (c === "\\") this.i++;
        else if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'") quote = c;
      else if (c === "]") {
        this.i++;
        return this.s.slice(start, this.i);
      }
    }
    throw new Error("unclosed [");
  }
}

/** Highest specificity in a selector list (used by :is(), :not(), :has(), nth-child "of S"). */
function listSpec(list: string): Spec {
  const specs: Spec[] = [];
  for (const item of splitTop(list, ",")) {
    if (!item.trim()) continue;
    try {
      specs.push(complex(item).spec);
    } catch {
      // forgiving selector lists ignore invalid items
    }
  }
  return maxSpec(specs);
}

function complex(sel: string): { spec: Spec; parts: Part[] } {
  const c = new Cursor(sel.trim());
  const parts: Part[] = [];
  const push = (text: string, kind: PartKind, spec: Spec) => parts.push({ text, kind, spec });
  while (c.i < c.s.length) {
    const ch = c.cur();
    if (/\s/.test(ch) || ch === ">" || ch === "+" || ch === "~") {
      c.i++;
      continue;
    }
    if (ch === "|" && c.s[c.i + 1] === "|") {
      c.i += 2;
      continue;
    }
    const start = c.i;
    if (ch === "#") {
      c.i++;
      if (!c.ident()) throw new Error("#");
      push(c.s.slice(start, c.i), "id", [1, 0, 0]);
    } else if (ch === ".") {
      c.i++;
      if (!c.ident()) throw new Error(".");
      push(c.s.slice(start, c.i), "class", [0, 1, 0]);
    } else if (ch === "[") {
      c.brackets();
      push(c.s.slice(start, c.i), "attribute", [0, 1, 0]);
    } else if (ch === ":") {
      if (c.s[c.i + 1] === ":") {
        c.i += 2;
        const name = c.ident().toLowerCase();
        if (!name) throw new Error("::");
        let spec: Spec = [0, 0, 1];
        if (c.cur() === "(") {
          const arg = c.parens();
          if (name === "slotted") spec = add(spec, listSpec(arg));
        }
        push(c.s.slice(start, c.i), "pseudo-element", spec);
      } else {
        c.i++;
        const name = c.ident().toLowerCase();
        if (!name) throw new Error(":");
        const arg = c.cur() === "(" ? c.parens() : null;
        const text = c.s.slice(start, c.i);
        if (LEGACY_PSEUDO_ELEMENTS.has(name) && arg === null) push(text, "pseudo-element", [0, 0, 1]);
        else if (name === "where") push(text, "functional", ZERO);
        else if (MAX_ARG.has(name)) push(text, "functional", arg ? listSpec(arg) : ZERO);
        else if ((name === "nth-child" || name === "nth-last-child") && arg && /\sof\s/i.test(arg)) {
          push(text, "pseudo-class", add([0, 1, 0], listSpec(arg.split(/\sof\s/i)[1])));
        } else if ((name === "host" || name === "host-context") && arg) push(text, "pseudo-class", add([0, 1, 0], listSpec(arg)));
        else push(text, "pseudo-class", [0, 1, 0]);
      }
    } else if (ch === "*") {
      c.i++;
      if (c.cur() === "|" && c.s[c.i + 1] !== "|") {
        c.i++;
        if (c.cur() === "*") {
          c.i++;
          push(c.s.slice(start, c.i), "universal", ZERO);
        } else {
          if (!c.ident()) throw new Error("|");
          push(c.s.slice(start, c.i), "type", [0, 0, 1]);
        }
      } else push("*", "universal", ZERO);
    } else if (ch === "&") {
      c.i++;
      push("&", "nesting", ZERO);
    } else if (ch === "|" || /[-_a-zA-Z\\]/.test(ch) || ch.charCodeAt(0) >= 0x80) {
      if (ch !== "|") c.ident();
      if (c.cur() === "|" && c.s[c.i + 1] !== "|") {
        c.i++;
        if (c.cur() === "*") {
          c.i++;
          push(c.s.slice(start, c.i), "universal", ZERO);
          continue;
        }
        if (!c.ident()) throw new Error("|");
      }
      push(c.s.slice(start, c.i), "type", [0, 0, 1]);
    } else {
      throw new Error(ch);
    }
  }
  return { spec: parts.reduce((s, p) => add(s, p.spec), ZERO), parts };
}

/** Specificity of one complex selector (or the highest one of a comma-separated list). */
export function specificity(selector: string): Spec {
  const items = splitTop(selector, ",").filter((s) => s.trim());
  return maxSpec(items.map((s) => complex(s).spec));
}

/** Analyze each selector of a list separately (for the calculator UI). */
export function analyze(input: string): SelectorResult[] {
  return splitTop(input.replace(/\{[^}]*\}?/g, ","), ",")
    .flatMap((s) => s.split(/\n/))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((selector) => {
      try {
        const r = complex(selector);
        return { selector, spec: r.spec, parts: r.parts, error: null };
      } catch (e) {
        return { selector, spec: ZERO, parts: [], error: e instanceof Error ? e.message : "?" };
      }
    });
}

export const specText = (s: Spec) => `${s[0]}, ${s[1]}, ${s[2]}`;
