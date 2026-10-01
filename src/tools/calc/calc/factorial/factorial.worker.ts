import { doubleFactorial, factorial } from "../bigint/nt";

const ctx = self as unknown as { onmessage: ((e: MessageEvent<{ n: number; double: boolean }>) => void) | null; postMessage: (m: unknown) => void };

ctx.onmessage = (e) => {
  const { n, double } = e.data;
  const v = double ? doubleFactorial(n) : factorial(n);
  ctx.postMessage({ n, double, text: v.toString() });
};
