/* IPv4 math on unsigned 32-bit numbers (stored in JS numbers, always normalised with >>> 0). */

export type V4Error = "empty" | "format" | "octet" | "leading-zero" | "prefix" | "mask";
type Result<T, E = V4Error> = { ok: true; value: T } | { ok: false; error: E };

const OCTET = /^\d{1,3}$/;

/** Strict dotted-quad parser. Leading zeros ("010") are rejected: some systems read them as octal. */
export function parseIPv4(input: string): Result<number> {
  const s = input.trim();
  if (!s) return { ok: false, error: "empty" };
  const parts = s.split(".");
  if (parts.length !== 4) return { ok: false, error: "format" };
  let n = 0;
  for (const p of parts) {
    if (!OCTET.test(p)) return { ok: false, error: "format" };
    if (p.length > 1 && p[0] === "0") return { ok: false, error: "leading-zero" };
    const v = Number(p);
    if (v > 255) return { ok: false, error: "octet" };
    n = n * 256 + v;
  }
  return { ok: true, value: n >>> 0 };
}

export function toDotted(n: number): string {
  n = n >>> 0;
  return `${n >>> 24}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;
}

export function maskOf(prefix: number): number {
  return prefix <= 0 ? 0 : prefix >= 32 ? 0xffffffff : (0xffffffff << (32 - prefix)) >>> 0;
}

/** Prefix length of a contiguous netmask, or null for masks like 255.0.255.0. */
export function prefixOfMask(mask: number): number | null {
  mask = mask >>> 0;
  const inv = ~mask >>> 0;
  // contiguous ⇔ inverse is 2^k − 1
  if ((inv & (inv + 1)) !== 0) return null;
  let p = 0;
  for (let i = 31; i >= 0; i--) if ((mask >>> i) & 1) p++;
  return p;
}

interface V4Input {
  ip: number;
  prefix: number;
  /** True when the text contained "/n" or a mask. */
  explicit: boolean;
}

/**
 * Accepts "192.168.1.10", "192.168.1.10/24", "192.168.1.10/255.255.255.0",
 * "192.168.1.10 255.255.255.0".
 */
export function parseV4Input(input: string, defaultPrefix = 32): Result<V4Input> {
  const s = input.trim().replace(/\s*\/\s*/, "/");
  if (!s) return { ok: false, error: "empty" };
  let addr = s;
  let rest: string | null = null;
  const slash = s.indexOf("/");
  if (slash >= 0) {
    addr = s.slice(0, slash);
    rest = s.slice(slash + 1);
  } else {
    const sp = s.split(/\s+/);
    if (sp.length === 2) [addr, rest] = sp;
    else if (sp.length > 2) return { ok: false, error: "format" };
  }
  const ip = parseIPv4(addr);
  if (!ip.ok) return ip;
  if (rest === null) return { ok: true, value: { ip: ip.value, prefix: defaultPrefix, explicit: false } };
  if (/^\d{1,2}$/.test(rest)) {
    const p = Number(rest);
    if (p > 32) return { ok: false, error: "prefix" };
    return { ok: true, value: { ip: ip.value, prefix: p, explicit: true } };
  }
  const m = parseIPv4(rest);
  if (!m.ok) return { ok: false, error: "prefix" };
  const p = prefixOfMask(m.value);
  if (p === null) return { ok: false, error: "mask" };
  return { ok: true, value: { ip: ip.value, prefix: p, explicit: true } };
}

type V4Class = "A" | "B" | "C" | "D" | "E";
function classOf(ip: number): V4Class {
  const o = ip >>> 24;
  if (o < 128) return "A";
  if (o < 192) return "B";
  if (o < 224) return "C";
  if (o < 240) return "D";
  return "E";
}

interface V4Info {
  ip: number;
  prefix: number;
  mask: number;
  wildcard: number;
  network: number;
  broadcast: number;
  first: number;
  last: number;
  /** Addresses in the block: 2^(32 − prefix). */
  total: number;
  /** Usable host addresses (/31 → 2 per RFC 3021, /32 → 1). */
  usable: number;
  cls: V4Class;
}

export function usableHosts(prefix: number): number {
  if (prefix >= 32) return 1;
  if (prefix === 31) return 2;
  return 2 ** (32 - prefix) - 2;
}

export function v4Info(ip: number, prefix: number): V4Info {
  const mask = maskOf(prefix);
  const wildcard = ~mask >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  let first = network;
  let last = broadcast;
  if (prefix <= 30) {
    first = network + 1;
    last = broadcast - 1;
  }
  return { ip: ip >>> 0, prefix, mask, wildcard, network, broadcast, first, last, total, usable: usableHosts(prefix), cls: classOf(ip) };
}

export interface Cidr4 {
  network: number;
  prefix: number;
}

export const cidr4 = (c: Cidr4) => `${toDotted(c.network)}/${c.prefix}`;

/** Enclosing networks: /(p−1), /(p−2)… down to /min. */
export function supernets(ip: number, prefix: number, count = 4): Cidr4[] {
  const out: Cidr4[] = [];
  for (let p = prefix - 1; p >= 0 && out.length < count; p--) out.push({ network: (ip & maskOf(p)) >>> 0, prefix: p });
  for (const p of [16, 8]) if (p < prefix - count) out.push({ network: (ip & maskOf(p)) >>> 0, prefix: p });
  return out;
}

/** Neighbouring block of the same size (null at the edges of the address space). */
export function adjacent(network: number, prefix: number, dir: 1 | -1): Cidr4 | null {
  const size = 2 ** (32 - prefix);
  const n = network + dir * size;
  if (n < 0 || n > 0xffffffff) return null;
  return { network: n >>> 0, prefix };
}

export function toBinary(n: number, dotted = true): string {
  const b = (n >>> 0).toString(2).padStart(32, "0");
  return dotted ? b.match(/.{8}/g)!.join(".") : b;
}

export function toHex(n: number): string {
  return "0x" + (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/** List the subnets of size /sub inside parent (capped). */
export function subnetsOf(parent: Cidr4, sub: number, limit = 64): { items: Cidr4[]; total: number } {
  const total = 2 ** (sub - parent.prefix);
  const size = 2 ** (32 - sub);
  const items: Cidr4[] = [];
  for (let i = 0; i < Math.min(total, limit); i++) items.push({ network: (parent.network + i * size) >>> 0, prefix: sub });
  return { items, total };
}
