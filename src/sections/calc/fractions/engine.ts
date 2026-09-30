import { add, bgcd, blcm, div, isInt, mul, q, sub, toText, type Q } from "../algebra/rational";

export type FracOp = "+" | "-" | "*" | "/";
export const FRAC_OPS: readonly FracOp[] = ["+", "-", "*", "/"];
const SYM: Record<FracOp, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export type StepKind = "lcm" | "expand" | "combine" | "multiply" | "flip" | "simplify" | "done";
export interface Step {
  kind: StepKind;
  math: string;
  /** Extra number for the text (e.g. the GCD used to simplify). */
  n?: string;
}

const f = (n: bigint, d: bigint) => (d === 1n ? `${n < 0n ? "−" : ""}${n < 0n ? -n : n}` : `${n < 0n ? "−" : ""}${n < 0n ? -n : n}/${d}`);
const par = (x: Q) => (x.n < 0n ? `(${toText(x)})` : toText(x));

/** a op b with human-readable steps (numbers are exact BigInt rationals). */
export function operate(a: Q, op: FracOp, b: Q): { result: Q; steps: Step[] } {
  const steps: Step[] = [];
  if (op === "+" || op === "-") {
    const L = blcm(a.d, b.d);
    const A = a.n * (L / a.d);
    const B = b.n * (L / b.d);
    const N = op === "+" ? A + B : A - B;
    if (a.d !== b.d) {
      steps.push({ kind: "lcm", math: `${a.d}, ${b.d} → ${L}`, n: String(L) });
      steps.push({ kind: "expand", math: `${toText(a)} = ${f(A, L)},  ${toText(b)} = ${f(B, L)}` });
    }
    steps.push({ kind: "combine", math: `${f(A, L)} ${SYM[op]} ${B < 0n ? `(${f(B, L)})` : f(B, L)} = ${f(N, L)}` });
    const result = q(N, L);
    const g = bgcd(N, L);
    if (g > 1n && N !== 0n) steps.push({ kind: "simplify", math: `${f(N, L)} = ${toText(result)}`, n: String(g) });
    return { result, steps };
  }
  let right = b;
  if (op === "/") {
    right = q(b.d, b.n);
    steps.push({ kind: "flip", math: `${par(a)} ÷ ${par(b)} = ${par(a)} × ${par(right)}` });
  }
  const N = a.n * right.n;
  const D = a.d * right.d;
  steps.push({ kind: "multiply", math: `${par(a)} × ${par(right)} = ${f(N, D)}` });
  const result = op === "*" ? mul(a, b) : div(a, b);
  const g = bgcd(N, D);
  if (g > 1n) steps.push({ kind: "simplify", math: `${f(N, D)} = ${toText(result)}`, n: String(g) });
  return { result, steps };
}

/** Simplification steps for a/b. */
export function simplifySteps(n: bigint, d: bigint): { result: Q; gcd: bigint } {
  const result = q(n, d);
  return { result, gcd: bgcd(n, d) };
}

export const evaluateOp = (a: Q, op: FracOp, b: Q): Q => (op === "+" ? add(a, b) : op === "-" ? sub(a, b) : op === "*" ? mul(a, b) : div(a, b));
export { isInt };
