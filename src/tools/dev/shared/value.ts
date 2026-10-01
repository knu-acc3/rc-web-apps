/**
 * Lossless, order-preserving value model shared by the JSON tools and the data converters.
 * Numbers keep their source text (no precision loss beyond 2^53), objects keep key order
 * (including integer-like keys and duplicates).
 */

export class Num {
  constructor(readonly raw: string) {}
  /** JSON-canonical text (leading zeros / + sign / hex from YAML normalized). */
  toJSON(): string {
    return this.raw;
  }
}

export class Obj {
  constructor(readonly entries: [string, V][] = []) {}
  get(key: string): V | undefined {
    for (let i = this.entries.length - 1; i >= 0; i--) if (this.entries[i][0] === key) return this.entries[i][1];
    return undefined;
  }
  keys(): string[] {
    return this.entries.map((e) => e[0]);
  }
}

export type V = null | boolean | string | Num | V[] | Obj;

export const isObj = (v: V | undefined): v is Obj => v instanceof Obj;

/** Plain JS value → V (numbers via String()). */
export function fromJs(x: unknown): V {
  if (x === null || x === undefined) return null;
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return Number.isFinite(x) ? new Num(String(x)) : null;
  if (typeof x === "bigint") return new Num(x.toString());
  if (typeof x === "string") return x;
  if (x instanceof Num || x instanceof Obj) return x;
  if (x instanceof Date) return Number.isNaN(x.getTime()) ? null : x.toISOString();
  if (Array.isArray(x)) return x.map(fromJs);
  if (typeof x === "object") return new Obj(Object.entries(x as Record<string, unknown>).map(([k, v]) => [k, fromJs(v)]));
  return String(x);
}

/** V → plain JS value. Integers beyond 2^53 become BigInt when `bigint` is true, else strings. */
export function toJs(v: V, bigint = false): unknown {
  if (v instanceof Num) {
    const n = Number(v.raw);
    if (/^-?\d+$/.test(v.raw) && !Number.isSafeInteger(n)) return bigint ? BigInt(v.raw) : v.raw;
    return n;
  }
  if (Array.isArray(v)) return v.map((x) => toJs(x, bigint));
  if (v instanceof Obj) {
    const o: Record<string, unknown> = {};
    for (const [k, x] of v.entries) o[k] = toJs(x, bigint);
    return o;
  }
  return v;
}

/** Normalize a YAML/TOML integer or float literal to JSON number text (lossless for decimals). */
export function normalizeNumber(raw: string): string | null {
  let s = raw.replace(/_/g, "");
  if (/^[-+]?0x[0-9a-f]+$/i.test(s) || /^[-+]?0o[0-7]+$/i.test(s) || /^[-+]?0b[01]+$/i.test(s)) {
    const neg = s.startsWith("-");
    const body = s.replace(/^[-+]/, "");
    return (neg ? "-" : "") + BigInt(body).toString();
  }
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(s)) return null;
  s = s.replace(/^\+/, "");
  const neg = s.startsWith("-");
  let body = neg ? s.slice(1) : s;
  if (body.startsWith(".")) body = `0${body}`;
  body = body.replace(/^0+(?=\d)/, "");
  body = body.replace(/\.(?=e|$)/i, "");
  return (neg ? "-" : "") + body;
}
