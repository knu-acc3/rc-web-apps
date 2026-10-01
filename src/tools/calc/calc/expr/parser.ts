/**
 * Safe recursive-descent expression parser (no eval / Function), shared by the scientific
 * calculator and the graph plotter.
 *
 * Grammar (lowest → highest precedence):
 *   expr    := term (("+" | "−") term)*
 *   term    := unary (("×" | "÷" | "mod") unary | <implicit ×> unary)*
 *   unary   := ("−" | "+") unary | power
 *   power   := postfix ("^" unary)?            right-associative: 2^3^2 = 2^9, −2^2 = −4
 *   postfix := primary ("!" | "%")*
 *   primary := number | constant | x | function | "(" expr ")" | "√" postfix
 * Implicit multiplication: 2π, 2(3+4), (1+2)(3+4), 3sin(x), 2x. Two bare numbers ("2 3") are an error.
 * Functions accept "(args)" or a single following operand: sin 30 = sin(30), sin x^2 = sin(x²).
 * Decimal separator: "." always; with `decimalComma` also "," between digits ("2,5"), and then
 * ";" separates function arguments (otherwise "," or ";").
 */

export type Angle = "deg" | "rad";

type Node =
  | { t: "num"; v: number }
  | { t: "x" }
  | { t: "const"; name: "pi" | "e" }
  | { t: "neg"; a: Node }
  | { t: "bin"; op: "+" | "-" | "*" | "/" | "^" | "mod"; a: Node; b: Node }
  | { t: "post"; op: "!" | "%"; a: Node }
  | { t: "fn"; name: FnName; args: Node[] };

type ErrCode = "empty" | "unexpected" | "unclosed" | "extra-paren" | "unknown" | "operand" | "operator" | "args" | "div0" | "domain" | "x";

export class ExprError extends Error {
  constructor(
    public code: ErrCode,
    public pos: number,
    public detail = "",
  ) {
    super(`${code}${detail ? `: ${detail}` : ""} at ${pos}`);
  }
}

const FNS = {
  sin: 1,
  cos: 1,
  tan: 1,
  cot: 1,
  asin: 1,
  acos: 1,
  atan: 1,
  sinh: 1,
  cosh: 1,
  tanh: 1,
  sqrt: 1,
  cbrt: 1,
  abs: 1,
  exp: 1,
  ln: 1,
  log: -1, // log(x) = lg x, log(x; b) = log base b
  lg: 1,
  log2: 1,
  round: 1,
  floor: 1,
  ceil: 1,
  nroot: 2,
  logb: 2,
} as const;
type FnName = keyof typeof FNS;
const ALIASES: Record<string, string> = { arcsin: "asin", arccos: "acos", arctan: "atan", tg: "tan", ctg: "cot", sh: "sinh", ch: "cosh", th: "tanh", π: "pi" };
const IDENTS = [...Object.keys(FNS), ...Object.keys(ALIASES), "mod", "pi", "e", "x"].sort((a, b) => b.length - a.length);

type Tok =
  | { k: "num"; v: number; pos: number }
  | { k: "id"; v: string; pos: number }
  | { k: "op"; v: string; pos: number }
  | { k: "(" | ")" | "sep"; pos: number };

interface ParseOptions {
  decimalComma?: boolean;
  /** Allow the variable x (graph plotter). */
  allowX?: boolean;
}

function tokenize(src: string, o: ParseOptions): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const s = src;
  const isDigit = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === "\n" || c === " " || c === " ") {
      i++;
      continue;
    }
    if (isDigit(c) || ((c === "." || (c === "," && o.decimalComma)) && isDigit(s[i + 1]))) {
      const start = i;
      let text = "";
      let seenDot = false;
      while (i < s.length) {
        const ch = s[i];
        if (isDigit(ch)) {
          text += ch;
          i++;
        } else if ((ch === "." || (ch === "," && o.decimalComma)) && !seenDot && isDigit(s[i + 1])) {
          text += ".";
          seenDot = true;
          i++;
        } else if ((ch === " " || ch === " " || ch === " ") && !seenDot && /^\d{3}(?!\d)/.test(s.slice(i + 1, i + 5)) && /\d/.test(text)) {
          // thousands separator inside a number: "1 000 000"
          i++;
        } else break;
      }
      out.push({ k: "num", v: Number(text), pos: start });
      continue;
    }
    if (/[a-zA-Zα-ωπ]/.test(c)) {
      const start = i;
      let word = "";
      while (i < s.length && /[a-zA-Zα-ωπ]/.test(s[i])) {
        word += s[i];
        i++;
      }
      // "log2(…)" is the binary logarithm; elsewhere digits after letters start a number ("x2" = x·2)
      if (/log$/i.test(word) && s[i] === "2" && s[i + 1] === "(") {
        word += "2";
        i++;
      }
      let rest = word.toLowerCase();
      let pos = start;
      while (rest) {
        const m = IDENTS.find((id) => rest.startsWith(id));
        if (!m) throw new ExprError("unknown", pos, word);
        out.push({ k: "id", v: ALIASES[m] ?? m, pos });
        rest = rest.slice(m.length);
        pos += m.length;
      }
      continue;
    }
    if (c === "(" || c === "[") {
      out.push({ k: "(", pos: i++ });
      continue;
    }
    if (c === ")" || c === "]") {
      out.push({ k: ")", pos: i++ });
      continue;
    }
    if (c === ";" || (c === "," && !o.decimalComma)) {
      out.push({ k: "sep", pos: i++ });
      continue;
    }
    const map: Record<string, string> = { "+": "+", "-": "-", "−": "-", "–": "-", "*": "*", "×": "*", "·": "*", "/": "/", "÷": "/", ":": "/", "^": "^", "!": "!", "%": "%", "√": "√" };
    if (map[c]) {
      out.push({ k: "op", v: map[c], pos: i++ });
      continue;
    }
    if (c === "²" || c === "³") {
      out.push({ k: "op", v: "^", pos: i });
      out.push({ k: "num", v: c === "²" ? 2 : 3, pos: i++ });
      continue;
    }
    throw new ExprError("unexpected", i, c);
  }
  return out;
}

class Parser {
  private i = 0;
  constructor(
    private toks: Tok[],
    private o: ParseOptions,
    private len: number,
  ) {}

  private peek(): Tok | undefined {
    return this.toks[this.i];
  }
  private endPos(): number {
    return this.len;
  }
  private isOp(t: Tok | undefined, v: string): boolean {
    return !!t && t.k === "op" && t.v === v;
  }

  parse(): Node {
    if (this.toks.length === 0) throw new ExprError("empty", 0);
    const n = this.expr();
    const t = this.peek();
    if (t) {
      if (t.k === ")") throw new ExprError("extra-paren", t.pos);
      throw new ExprError("operator", t.pos);
    }
    return n;
  }

  private expr(): Node {
    let a = this.term();
    for (;;) {
      const t = this.peek();
      if (this.isOp(t, "+") || this.isOp(t, "-")) {
        this.i++;
        const b = this.term();
        a = { t: "bin", op: (t as { v: string }).v as "+" | "-", a, b };
      } else return a;
    }
  }

  private startsOperand(t: Tok | undefined): boolean {
    return !!t && (t.k === "num" || t.k === "id" || t.k === "(" || this.isOp(t, "√"));
  }

  private term(): Node {
    let a = this.unary();
    for (;;) {
      const t = this.peek();
      if (this.isOp(t, "*") || this.isOp(t, "/")) {
        this.i++;
        const b = this.unary();
        a = { t: "bin", op: (t as { v: string }).v as "*" | "/", a, b };
      } else if (t && t.k === "id" && t.v === "mod") {
        this.i++;
        a = { t: "bin", op: "mod", a, b: this.unary() };
      } else if (this.startsOperand(t)) {
        // implicit multiplication, but never between two bare numbers
        const prev = this.toks[this.i - 1];
        if (t!.k === "num" && prev && prev.k === "num") throw new ExprError("operator", t!.pos);
        a = { t: "bin", op: "*", a, b: this.power() };
      } else return a;
    }
  }

  private unary(): Node {
    const t = this.peek();
    if (this.isOp(t, "-")) {
      this.i++;
      return { t: "neg", a: this.unary() };
    }
    if (this.isOp(t, "+")) {
      this.i++;
      return this.unary();
    }
    return this.power();
  }

  private power(): Node {
    const base = this.postfix();
    if (this.isOp(this.peek(), "^")) {
      this.i++;
      return { t: "bin", op: "^", a: base, b: this.unary() };
    }
    return base;
  }

  private postfix(): Node {
    let a = this.primary();
    for (;;) {
      const t = this.peek();
      if (this.isOp(t, "!")) {
        this.i++;
        a = { t: "post", op: "!", a };
      } else if (this.isOp(t, "%")) {
        this.i++;
        a = { t: "post", op: "%", a };
      } else return a;
    }
  }

  private primary(): Node {
    const t = this.peek();
    if (!t) throw new ExprError("operand", this.endPos());
    if (t.k === "num") {
      this.i++;
      return { t: "num", v: t.v };
    }
    if (this.isOp(t, "√")) {
      this.i++;
      return { t: "fn", name: "sqrt", args: [this.postfix()] };
    }
    if (t.k === "(") {
      this.i++;
      const n = this.expr();
      const c = this.peek();
      if (!c || c.k !== ")") throw new ExprError("unclosed", t.pos);
      this.i++;
      return n;
    }
    if (t.k === "id") {
      this.i++;
      if (t.v === "pi" || t.v === "e") return { t: "const", name: t.v };
      if (t.v === "x") {
        if (!this.o.allowX) throw new ExprError("x", t.pos);
        return { t: "x" };
      }
      if (t.v === "mod") throw new ExprError("operand", t.pos);
      const name = t.v as FnName;
      const arity = FNS[name];
      let args: Node[];
      if (this.peek()?.k === "(") {
        const open = this.peek()!;
        this.i++;
        args = [this.expr()];
        while (this.peek()?.k === "sep") {
          this.i++;
          args.push(this.expr());
        }
        const c = this.peek();
        if (!c || c.k !== ")") throw new ExprError("unclosed", open.pos);
        this.i++;
      } else {
        args = [this.power()];
      }
      const ok = arity === -1 ? args.length === 1 || args.length === 2 : args.length === arity;
      if (!ok) throw new ExprError("args", t.pos, name);
      return { t: "fn", name, args };
    }
    if (t.k === ")") throw new ExprError("operand", t.pos);
    throw new ExprError("operand", t.pos);
  }
}

export function parse(src: string, o: ParseOptions = {}): Node {
  const toks = tokenize(src, o);
  return new Parser(toks, o, src.length).parse();
}

/* ───────────── Evaluation ───────────── */

interface Env {
  x?: number;
  angle?: Angle;
  /** Throw ExprError on domain errors / division by zero (calculator) instead of returning NaN (plotter). */
  strict?: boolean;
}

const DEG = Math.PI / 180;

/** Exact values for multiples of 30° / 45° so that sin 180° = 0, cos 60° = 0.5, tan 45° = 1. */
function trigDeg(fn: "sin" | "cos" | "tan", deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  const exact: Record<number, [number, number]> = { 0: [0, 1], 30: [0.5, NaN], 90: [1, 0], 150: [0.5, NaN], 180: [0, -1], 210: [-0.5, NaN], 270: [-1, 0], 330: [-0.5, NaN], 60: [NaN, 0.5], 120: [NaN, -0.5], 240: [NaN, -0.5], 300: [NaN, 0.5] };
  if (Number.isInteger(d) && exact[d]) {
    const [s, c] = exact[d];
    if (fn === "sin" && !Number.isNaN(s)) return s;
    if (fn === "cos" && !Number.isNaN(c)) return c;
  }
  if (fn === "tan" && Number.isInteger(d)) {
    if (d % 180 === 0) return 0;
    if (d % 180 === 45) return 1;
    if (d % 180 === 135) return -1;
    if (d % 180 === 90) return NaN;
  }
  const r = deg * DEG;
  return fn === "sin" ? Math.sin(r) : fn === "cos" ? Math.cos(r) : Math.tan(r);
}

/** Lanczos approximation of Γ(z). */
function gamma(z: number): number {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export function factorial(n: number): number {
  if (Number.isInteger(n)) {
    if (n < 0) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  return gamma(n + 1);
}

function snap(v: number): number {
  return Math.abs(v) < 1e-12 ? 0 : v;
}

function evaluate(n: Node, env: Env = {}): number {
  const deg = env.angle === "deg";
  const fail = (code: ErrCode) => {
    if (env.strict) throw new ExprError(code, 0);
    return NaN;
  };
  const ev = (m: Node): number => {
    switch (m.t) {
      case "num":
        return m.v;
      case "x":
        return env.x ?? NaN;
      case "const":
        return m.name === "pi" ? Math.PI : Math.E;
      case "neg":
        return -ev(m.a);
      case "post": {
        const a = ev(m.a);
        if (m.op === "%") return a / 100;
        const f = factorial(a);
        return Number.isNaN(f) ? fail("domain") : f;
      }
      case "bin": {
        const a = ev(m.a);
        const b = ev(m.b);
        switch (m.op) {
          case "+":
            return a + b;
          case "-":
            return a - b;
          case "*":
            return a * b;
          case "/":
            return b === 0 ? fail("div0") : a / b;
          case "mod":
            return b === 0 ? fail("div0") : ((a % b) + b) % b;
          case "^": {
            const r = Math.pow(a, b);
            if (Number.isNaN(r) && a < 0) {
              // odd roots of negatives: (−8)^(1/3) = −2
              const inv = 1 / b;
              if (Number.isInteger(Math.round(inv)) && Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2 !== 0) return -Math.pow(-a, b);
              return fail("domain");
            }
            return r;
          }
        }
        return NaN;
      }
      case "fn": {
        const x = ev(m.args[0]);
        const y = m.args[1] ? ev(m.args[1]) : undefined;
        switch (m.name) {
          case "sin":
            return deg ? trigDeg("sin", x) : snap(Math.sin(x));
          case "cos":
            return deg ? trigDeg("cos", x) : snap(Math.cos(x));
          case "tan": {
            const r = deg ? trigDeg("tan", x) : Math.tan(x);
            return Number.isNaN(r) ? fail("domain") : snap(r);
          }
          case "cot": {
            const tn = deg ? trigDeg("tan", x) : Math.tan(x);
            return tn === 0 ? fail("domain") : snap(1 / tn);
          }
          case "asin":
            return x < -1 || x > 1 ? fail("domain") : deg ? Math.asin(x) / DEG : Math.asin(x);
          case "acos":
            return x < -1 || x > 1 ? fail("domain") : deg ? Math.acos(x) / DEG : Math.acos(x);
          case "atan":
            return deg ? Math.atan(x) / DEG : Math.atan(x);
          case "sinh":
            return Math.sinh(x);
          case "cosh":
            return Math.cosh(x);
          case "tanh":
            return Math.tanh(x);
          case "sqrt":
            return x < 0 ? fail("domain") : Math.sqrt(x);
          case "cbrt":
            return Math.cbrt(x);
          case "abs":
            return Math.abs(x);
          case "exp":
            return Math.exp(x);
          case "ln":
            return x <= 0 ? fail("domain") : Math.log(x);
          case "lg":
            return x <= 0 ? fail("domain") : Math.log10(x);
          case "log2":
            return x <= 0 ? fail("domain") : Math.log2(x);
          case "log":
          case "logb":
            if (x <= 0) return fail("domain");
            if (y === undefined) return Math.log10(x);
            return y <= 0 || y === 1 ? fail("domain") : Math.log(x) / Math.log(y);
          case "round":
            return Math.round(x);
          case "floor":
            return Math.floor(x);
          case "ceil":
            return Math.ceil(x);
          case "nroot": {
            const k = y ?? 2;
            if (k === 0) return fail("domain");
            if (x < 0) return Number.isInteger(k) && k % 2 !== 0 ? -Math.pow(-x, 1 / k) : fail("domain");
            return Math.pow(x, 1 / k);
          }
        }
        return NaN;
      }
    }
  };
  return ev(n);
}

/** Parse and evaluate in one go (calculator). Throws ExprError. */
export function calculate(src: string, o: ParseOptions & Env = {}): number {
  return evaluate(parse(src, o), { ...o, strict: true });
}

/** Compile an expression of x into a fast function (plotter). Throws ExprError on syntax errors. */
export function compile(src: string, o: ParseOptions & { angle?: Angle } = {}): (x: number) => number {
  const node = parse(src, { ...o, allowX: true });
  return (x: number) => evaluate(node, { x, angle: o.angle ?? "rad" });
}

/** Human-readable error message. */
export function errorText(locale: "ru" | "en", e: unknown, src = ""): string {
  if (!(e instanceof ExprError)) return locale === "ru" ? "Ошибка в выражении" : "Invalid expression";
  const near = e.pos < src.length ? src.slice(e.pos, e.pos + 6) : "";
  const at = near ? (locale === "ru" ? ` около «${near}»` : ` near “${near}”`) : "";
  const ru: Record<ErrCode, string> = {
    empty: "Введите выражение",
    unexpected: `Непонятный символ «${e.detail}»`,
    unclosed: "Незакрытая скобка",
    "extra-paren": "Лишняя закрывающая скобка",
    unknown: `Неизвестная функция «${e.detail}»`,
    operand: `Не хватает числа${at}`,
    operator: `Пропущен оператор${at}`,
    args: `Неверное число аргументов у «${e.detail}»`,
    div0: "Деление на ноль",
    domain: "Значение вне области определения функции",
    x: "Переменная x доступна только в построителе графиков",
  };
  const en: Record<ErrCode, string> = {
    empty: "Enter an expression",
    unexpected: `Unexpected character “${e.detail}”`,
    unclosed: "Unclosed parenthesis",
    "extra-paren": "Extra closing parenthesis",
    unknown: `Unknown function “${e.detail}”`,
    operand: `Missing number${at}`,
    operator: `Missing operator${at}`,
    args: `Wrong number of arguments for “${e.detail}”`,
    div0: "Division by zero",
    domain: "Value outside the function's domain",
    x: "The variable x is only available in the graph plotter",
  };
  return (locale === "ru" ? ru : en)[e.code];
}
