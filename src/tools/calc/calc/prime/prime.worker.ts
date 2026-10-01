import { factorize, sieve } from "../bigint/nt";

type Msg = { id: number; type: "factor"; n: string } | { id: number; type: "sieve"; limit: number; full: boolean };

const ctx = self as unknown as { onmessage: ((e: MessageEvent<Msg>) => void) | null; postMessage: (m: unknown) => void };

ctx.onmessage = (e) => {
  const m = e.data;
  if (m.type === "factor") {
    const f = factorize(BigInt(m.n)).map(([p, k]) => [p.toString(), k] as [string, number]);
    ctx.postMessage({ id: m.id, type: "factor", n: m.n, factors: f });
  } else {
    const ps = sieve(m.limit);
    ctx.postMessage({ id: m.id, type: "sieve", limit: m.limit, count: ps.length, head: ps.slice(0, 1000), last: ps[ps.length - 1] ?? null, text: m.full ? ps.join("\n") : null });
  }
};
