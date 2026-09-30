/* IPv6 parsing/formatting with BigInt (RFC 4291 text forms, RFC 5952 canonical output). */
import { parseIPv4, toDotted } from "./ipv4";

export type V6Error = "empty" | "format" | "group" | "double-colon" | "ipv4" | "prefix";
export type Result6<T> = { ok: true; value: T } | { ok: false; error: V6Error };

const ALL = (1n << 128n) - 1n;

export function parseIPv6(input: string): Result6<{ value: bigint; zone?: string }> {
  let s = input.trim();
  if (!s) return { ok: false, error: "empty" };
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  let zone: string | undefined;
  const pct = s.indexOf("%");
  if (pct >= 0) {
    zone = s.slice(pct + 1);
    s = s.slice(0, pct);
    if (!zone) return { ok: false, error: "format" };
  }
  if (!/^[0-9a-fA-F:.]+$/.test(s)) return { ok: false, error: "format" };
  const dbl = s.split("::");
  if (dbl.length > 2) return { ok: false, error: "double-colon" };

  const parseSide = (side: string): number[] | V6Error => {
    if (side === "") return [];
    const parts = side.split(":");
    const out: number[] = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.includes(".")) {
        if (i !== parts.length - 1) return "ipv4";
        const v4 = parseIPv4(p);
        if (!v4.ok) return "ipv4";
        out.push(v4.value >>> 16, v4.value & 0xffff);
        continue;
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(p)) return "group";
      out.push(parseInt(p, 16));
    }
    return out;
  };

  let groups: number[];
  if (dbl.length === 2) {
    const l = parseSide(dbl[0]);
    const r = parseSide(dbl[1]);
    if (typeof l === "string") return { ok: false, error: l };
    if (typeof r === "string") return { ok: false, error: r };
    // the IPv4 tail is only allowed at the very end
    if (dbl[0].includes(".")) return { ok: false, error: "ipv4" };
    const missing = 8 - l.length - r.length;
    if (missing < 1) return { ok: false, error: "double-colon" };
    groups = [...l, ...Array(missing).fill(0), ...r];
  } else {
    const g = parseSide(s);
    if (typeof g === "string") return { ok: false, error: g };
    if (g.length !== 8) return { ok: false, error: "format" };
    groups = g;
  }
  let v = 0n;
  for (const g of groups) v = (v << 16n) | BigInt(g);
  return { ok: true, value: { value: v, zone } };
}

export function groupsOf(v: bigint): number[] {
  const out: number[] = [];
  for (let i = 7; i >= 0; i--) out.push(Number((v >> BigInt(i * 16)) & 0xffffn));
  return out;
}

/** Full form: 2001:0db8:0000:…  */
export function expand(v: bigint): string {
  return groupsOf(v)
    .map((g) => g.toString(16).padStart(4, "0"))
    .join(":");
}

const MAPPED_PREFIX = 0xffffn << 32n;

export function isV4Mapped(v: bigint): boolean {
  return v >> 32n === 0xffffn;
}

/** RFC 5952 canonical text: lowercase, no leading zeros, longest ≥2-group zero run → "::" (leftmost on tie). */
export function compress(v: bigint, mixedMapped = true): string {
  if (mixedMapped && isV4Mapped(v)) return `::ffff:${toDotted(Number(v & 0xffffffffn))}`;
  const g = groupsOf(v);
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; ) {
    if (g[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && g[j] === 0) j++;
    if (j - i > bestLen) {
      bestLen = j - i;
      bestStart = i;
    }
    i = j;
  }
  const hex = g.map((x) => x.toString(16));
  if (bestLen < 2) return hex.join(":");
  const left = hex.slice(0, bestStart).join(":");
  const right = hex.slice(bestStart + bestLen).join(":");
  return `${left}::${right}`;
}

export function mask6(prefix: number): bigint {
  if (prefix <= 0) return 0n;
  if (prefix >= 128) return ALL;
  return (ALL << BigInt(128 - prefix)) & ALL;
}

export interface V6Input {
  value: bigint;
  prefix: number;
  explicit: boolean;
  zone?: string;
}

export function parseV6Input(input: string, defaultPrefix = 128): Result6<V6Input> {
  const s = input.trim();
  const slash = s.lastIndexOf("/");
  let addr = s;
  let prefix = defaultPrefix;
  let explicit = false;
  if (slash >= 0) {
    addr = s.slice(0, slash);
    const p = s.slice(slash + 1).trim();
    if (!/^\d{1,3}$/.test(p) || Number(p) > 128) return { ok: false, error: "prefix" };
    prefix = Number(p);
    explicit = true;
  }
  const r = parseIPv6(addr);
  if (!r.ok) return r;
  return { ok: true, value: { value: r.value.value, zone: r.value.zone, prefix, explicit } };
}

export interface V6Info {
  value: bigint;
  prefix: number;
  network: bigint;
  last: bigint;
  /** 2^(128 − prefix) as BigInt */
  total: bigint;
}

export function v6Info(value: bigint, prefix: number): V6Info {
  const m = mask6(prefix);
  const network = value & m;
  const last = network | (~m & ALL);
  return { value, prefix, network, last, total: 1n << BigInt(128 - prefix) };
}

/** Reverse DNS name in nibble format (ip6.arpa). */
export function reverse6(v: bigint): string {
  const hex = v.toString(16).padStart(32, "0");
  return hex.split("").reverse().join(".") + ".ip6.arpa";
}

export function reverse4(n: number): string {
  return toDotted(n).split(".").reverse().join(".") + ".in-addr.arpa";
}

/** ::ffff:a.b.c.d for an IPv4 number */
export function mapV4(n: number): bigint {
  return MAPPED_PREFIX | BigInt(n >>> 0);
}

/** Human form of 2^k: exact below 2^53, otherwise "2^k ≈ 3.4×10^38". */
export function pow2Text(k: number): string {
  return `2^${k}`;
}
