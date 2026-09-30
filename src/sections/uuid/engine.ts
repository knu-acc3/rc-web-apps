/**
 * UUID / ULID / NanoID / ObjectId engine (RFC 9562, ulid/spec, nanoid, MongoDB ObjectId).
 * Pure TS: randomness and time are injected so everything is testable.
 */
import { md5, sha1 } from "@noble/hashes/legacy.js";
import { bytesToHex, hexToBytes, utf8Encode } from "@/sections/code/kit/bytes";
import { cryptoRng, type Rng } from "@/sections/code/kit/random";

export type { Rng };
export { cryptoRng };

/* ───────────── UUID basics ───────────── */

export const NIL_UUID = "00000000-0000-0000-0000-000000000000";
export const MAX_UUID = "ffffffff-ffff-ffff-ffff-ffffffffffff";

export const NAMESPACES = {
  dns: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  url: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  oid: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
  x500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
} as const;
export type NamespaceId = keyof typeof NAMESPACES;

/** 100-ns intervals between 1582-10-15 (Gregorian epoch) and 1970-01-01. */
export const GREGORIAN_OFFSET = 0x01b21dd213814000n;

export function bytesToUuid(b: Uint8Array): string {
  const h = bytesToHex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const UUID_RE = /^(?:urn:uuid:)?\{?([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})\}?$/i;

/** Parse any common UUID spelling (braces, URN, no dashes, any case) to 16 bytes, or null. */
export function parseUuid(input: string): Uint8Array | null {
  const m = UUID_RE.exec(input.trim());
  if (!m) return null;
  const s = input.trim();
  // braces must be balanced
  if (s.includes("{") !== s.includes("}")) return null;
  return hexToBytes(m.slice(1).join(""));
}

function stamp(b: Uint8Array, version: number): Uint8Array {
  b[6] = (b[6] & 0x0f) | (version << 4);
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 9562 variant 10xx
  return b;
}

export function uuidV4(rng: Rng = cryptoRng): string {
  return bytesToUuid(stamp(rng(16).slice(0, 16), 4));
}

export function uuidNameBased(version: 3 | 5, namespace: string, name: string): string {
  const ns = parseUuid(namespace);
  if (!ns) throw new Error("Invalid namespace UUID");
  const data = new Uint8Array(16 + utf8Encode(name).length);
  data.set(ns, 0);
  data.set(utf8Encode(name), 16);
  const digest = version === 3 ? md5(data) : sha1(data);
  return bytesToUuid(stamp(digest.slice(0, 16), version));
}

/** Gregorian 100-ns timestamp for v1/v6 from Unix ms plus a sub-millisecond counter (0…9999). */
function gregorian(ms: number, sub: number): bigint {
  return BigInt(ms) * 10000n + BigInt(sub) + GREGORIAN_OFFSET;
}

/**
 * Stateful generator for time-based UUIDs. Keeps v1/v6/v7 unique and ordered when many IDs
 * are generated within the same millisecond (bulk generation).
 */
export class TimeUuidGenerator {
  private lastMs = -1;
  private sub = 0;
  private v7Ms = -1;
  private v7Counter = 0;
  private clockSeq: number;
  private node: Uint8Array;
  private readonly rng: Rng;

  constructor(rng: Rng = cryptoRng) {
    this.rng = rng;
    const cs = rng(2);
    this.clockSeq = ((cs[0] << 8) | cs[1]) & 0x3fff;
    // Random node with the multicast bit set (RFC 9562 §6.10) — never a real MAC address.
    this.node = rng(6).slice(0, 6);
    this.node[0] |= 0x01;
  }

  private tick(ms: number): bigint {
    if (ms === this.lastMs) {
      this.sub++;
      if (this.sub > 9999) {
        // more than 10 000 IDs in one ms: bump the clock sequence to stay unique
        this.sub = 0;
        this.clockSeq = (this.clockSeq + 1) & 0x3fff;
      }
    } else {
      if (ms < this.lastMs) this.clockSeq = (this.clockSeq + 1) & 0x3fff; // clock went backwards
      this.lastMs = ms;
      this.sub = 0;
    }
    return gregorian(ms, this.sub);
  }

  private tail(b: Uint8Array) {
    b[8] = 0x80 | ((this.clockSeq >> 8) & 0x3f);
    b[9] = this.clockSeq & 0xff;
    b.set(this.node, 10);
  }

  v1(ms: number): string {
    const ts = this.tick(ms);
    const b = new Uint8Array(16);
    const low = Number(ts & 0xffffffffn);
    const mid = Number((ts >> 32n) & 0xffffn);
    const hi = Number((ts >> 48n) & 0x0fffn);
    b[0] = low >>> 24;
    b[1] = (low >>> 16) & 0xff;
    b[2] = (low >>> 8) & 0xff;
    b[3] = low & 0xff;
    b[4] = mid >> 8;
    b[5] = mid & 0xff;
    b[6] = 0x10 | (hi >> 8);
    b[7] = hi & 0xff;
    this.tail(b);
    return bytesToUuid(b);
  }

  v6(ms: number): string {
    const ts = this.tick(ms);
    const b = new Uint8Array(16);
    const high = Number((ts >> 28n) & 0xffffffffn);
    const mid = Number((ts >> 12n) & 0xffffn);
    const low = Number(ts & 0xfffn);
    b[0] = high >>> 24;
    b[1] = (high >>> 16) & 0xff;
    b[2] = (high >>> 8) & 0xff;
    b[3] = high & 0xff;
    b[4] = mid >> 8;
    b[5] = mid & 0xff;
    b[6] = 0x60 | (low >> 8);
    b[7] = low & 0xff;
    this.tail(b);
    return bytesToUuid(b);
  }

  /**
   * UUIDv7, RFC 9562 §6.2 Method 1: the 12-bit rand_a field is a counter seeded with
   * random bits (top bit 0) at every new millisecond and incremented within the same one;
   * on overflow the timestamp is advanced by 1 ms, so the output is strictly increasing.
   */
  v7(ms: number): string {
    if (ms > this.v7Ms) {
      this.v7Ms = ms;
      this.v7Counter = ((this.rng(2)[0] << 3) | (this.rng(1)[0] & 7)) & 0x7ff;
    } else {
      this.v7Counter++;
      if (this.v7Counter > 0xfff) {
        this.v7Ms++;
        this.v7Counter = ((this.rng(2)[0] << 3) | (this.rng(1)[0] & 7)) & 0x7ff;
      }
    }
    const b = this.rng(16).slice(0, 16);
    const t = this.v7Ms;
    const hi = Math.floor(t / 2 ** 16);
    b[0] = Math.floor(hi / 2 ** 24) & 0xff;
    b[1] = Math.floor(hi / 2 ** 16) & 0xff;
    b[2] = Math.floor(hi / 2 ** 8) & 0xff;
    b[3] = hi & 0xff;
    b[4] = Math.floor(t / 2 ** 8) & 0xff;
    b[5] = t & 0xff;
    b[6] = 0x70 | (this.v7Counter >> 8);
    b[7] = this.v7Counter & 0xff;
    b[8] = (b[8] & 0x3f) | 0x80;
    return bytesToUuid(b);
  }
}

/* ───────────── output formats ───────────── */

export interface UuidFormat {
  upper?: boolean;
  braces?: boolean;
  dashes?: boolean;
  urn?: boolean;
}

export function formatUuid(uuid: string, f: UuidFormat): string {
  let s = f.dashes === false ? uuid.replace(/-/g, "") : uuid;
  s = f.upper ? s.toUpperCase() : s.toLowerCase();
  if (f.urn) return `urn:uuid:${s}`;
  if (f.braces) return `{${s}}`;
  return s;
}

/* ───────────── ULID ───────────── */

export const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ULID_RE = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i;

export function isUlid(s: string): boolean {
  return ULID_RE.test(s.trim());
}

function encodeTime(ms: number): string {
  let s = "";
  let t = ms;
  for (let i = 0; i < 10; i++) {
    s = CROCKFORD[t % 32] + s;
    t = Math.floor(t / 32);
  }
  return s;
}

export function ulidTime(ulid: string): number {
  const s = ulid.trim().toUpperCase();
  let t = 0;
  for (let i = 0; i < 10; i++) t = t * 32 + CROCKFORD.indexOf(s[i]);
  return t;
}

export class UlidGenerator {
  private lastMs = -1;
  private last: number[] = []; // 16 base32 digits of randomness
  private readonly rng: Rng;
  constructor(rng: Rng = cryptoRng) {
    this.rng = rng;
  }
  next(ms: number, monotonic = true): string {
    if (ms < 0 || ms > 2 ** 48 - 1) throw new RangeError("Timestamp out of ULID range");
    if (monotonic && ms <= this.lastMs && this.last.length) {
      // increment the 80-bit random part (base-32 digits) by one
      let i = 15;
      while (i >= 0 && this.last[i] === 31) {
        this.last[i] = 0;
        i--;
      }
      if (i < 0) throw new Error("ULID randomness overflow within one millisecond");
      this.last[i]++;
      return encodeTime(this.lastMs) + this.last.map((d) => CROCKFORD[d]).join("");
    }
    const r = this.rng(10);
    const digits: number[] = [];
    // 80 bits → 16 base-32 digits
    let acc = 0;
    let bits = 0;
    for (const byte of r) {
      acc = (acc << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        digits.push((acc >> bits) & 31);
      }
      acc &= (1 << bits) - 1;
    }
    this.lastMs = ms;
    this.last = digits;
    return encodeTime(ms) + digits.map((d) => CROCKFORD[d]).join("");
  }
}

/* ───────────── NanoID ───────────── */

export const NANOID_ALPHABETS = {
  default: "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",
  alphanumeric: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  lowercase: "0123456789abcdefghijklmnopqrstuvwxyz",
  hex: "0123456789abcdef",
  nolookalikes: "346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz",
} as const;

/** NanoID with an arbitrary alphabet (2–256 symbols): bit-mask + rejection sampling, no modulo bias. */
export function nanoid(alphabet: string, size: number, rng: Rng = cryptoRng): string {
  const chars = [...alphabet];
  const n = chars.length;
  if (n < 2 || n > 256) throw new RangeError("Alphabet must have 2–256 symbols");
  if (new Set(chars).size !== n) throw new RangeError("Alphabet has duplicate symbols");
  const mask = (2 << (31 - Math.clz32((n - 1) | 1))) - 1;
  const step = Math.ceil((1.6 * mask * size) / n);
  let id = "";
  let count = 0;
  while (count < size) {
    const bytes = rng(step);
    for (let i = 0; i < step && count < size; i++) {
      const v = bytes[i] & mask;
      if (v < n) {
        id += chars[v];
        count++;
      }
    }
  }
  return id;
}

/**
 * Birthday-bound estimate: how many IDs until the probability of at least one collision
 * reaches `p`. Returns log10 of that count (numbers can exceed double range).
 */
export function log10IdsForCollision(alphabetSize: number, length: number, p = 0.01): number {
  // n ≈ sqrt(2 · N · ln(1 / (1 − p))), N = alphabet^length
  const log10N = length * Math.log10(alphabetSize);
  return 0.5 * (Math.log10(2) + log10N + Math.log10(-Math.log(1 - p)));
}

/** Bits of entropy of a random ID. */
export function entropyBits(alphabetSize: number, length: number): number {
  return length * Math.log2(alphabetSize);
}

/* ───────────── MongoDB ObjectId ───────────── */

export class ObjectIdGenerator {
  private readonly random5: Uint8Array;
  private counter: number;
  constructor(rng: Rng = cryptoRng) {
    this.random5 = rng(5).slice(0, 5);
    const c = rng(3);
    this.counter = (c[0] << 16) | (c[1] << 8) | c[2];
  }
  next(ms: number): string {
    const secs = Math.floor(ms / 1000);
    const b = new Uint8Array(12);
    b[0] = (secs >>> 24) & 0xff;
    b[1] = (secs >>> 16) & 0xff;
    b[2] = (secs >>> 8) & 0xff;
    b[3] = secs & 0xff;
    b.set(this.random5, 4);
    this.counter = (this.counter + 1) & 0xffffff;
    b[9] = this.counter >> 16;
    b[10] = (this.counter >> 8) & 0xff;
    b[11] = this.counter & 0xff;
    return bytesToHex(b);
  }
}

export function objectIdSeconds(id: string): number {
  return parseInt(id.trim().slice(0, 8), 16);
}

/* ───────────── decoder ───────────── */

export type IdInfo =
  | {
      type: "uuid";
      canonical: string;
      version: number;
      variant: "ncs" | "rfc" | "microsoft" | "future";
      special?: "nil" | "max";
      /** Unix ms for v1/v6/v7 */
      ms?: number;
      /** v1/v6 100-ns fraction beyond ms (0…9999) */
      subMs?: number;
      clockSeq?: number;
      node?: string;
      randomNode?: boolean;
    }
  | { type: "ulid"; canonical: string; ms: number }
  | { type: "objectid"; canonical: string; ms: number; counter: number }
  | { type: "nanoid"; canonical: string; length: number }
  | { type: "invalid"; reason: "empty" | "format" | "ulid-overflow" };

export function uuidVersionOf(b: Uint8Array): number {
  return b[6] >> 4;
}

export function decodeId(raw: string): IdInfo {
  const s = raw.trim();
  if (!s) return { type: "invalid", reason: "empty" };
  const b = parseUuid(s);
  if (b) {
    const canonical = bytesToUuid(b);
    if (canonical === NIL_UUID) return { type: "uuid", canonical, version: 0, variant: "ncs", special: "nil" };
    if (canonical === MAX_UUID) return { type: "uuid", canonical, version: 15, variant: "future", special: "max" };
    const version = uuidVersionOf(b);
    const v = b[8] >> 4;
    const variant = v < 8 ? "ncs" : v < 12 ? "rfc" : v < 14 ? "microsoft" : "future";
    const info: IdInfo = { type: "uuid", canonical, version, variant };
    if (variant === "rfc" && (version === 1 || version === 6)) {
      let ts: bigint;
      const x = (i: number) => BigInt(b[i]);
      if (version === 1) {
        const low = (x(0) << 24n) | (x(1) << 16n) | (x(2) << 8n) | x(3);
        const mid = (x(4) << 8n) | x(5);
        const hi = ((x(6) & 0x0fn) << 8n) | x(7);
        ts = (hi << 48n) | (mid << 32n) | low;
      } else {
        const high = (x(0) << 24n) | (x(1) << 16n) | (x(2) << 8n) | x(3);
        const mid = (x(4) << 8n) | x(5);
        const low = ((x(6) & 0x0fn) << 8n) | x(7);
        ts = (high << 28n) | (mid << 12n) | low;
      }
      const unix100ns = ts - GREGORIAN_OFFSET;
      info.ms = Number(unix100ns / 10000n);
      info.subMs = Number(((unix100ns % 10000n) + 10000n) % 10000n);
      if (unix100ns < 0n) info.ms = Math.floor(Number(unix100ns) / 10000);
      info.clockSeq = ((b[8] & 0x3f) << 8) | b[9];
      info.node = bytesToHex(b.slice(10))
        .match(/../g)!
        .join(":");
      info.randomNode = (b[10] & 1) === 1;
    }
    if (variant === "rfc" && version === 7) {
      let ms = 0;
      for (let i = 0; i < 6; i++) ms = ms * 256 + b[i];
      info.ms = ms;
    }
    return info;
  }
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(s)) {
    if (!isUlid(s)) return { type: "invalid", reason: "ulid-overflow" };
    return { type: "ulid", canonical: s.toUpperCase(), ms: ulidTime(s) };
  }
  if (/^[0-9a-f]{24}$/i.test(s)) {
    return { type: "objectid", canonical: s.toLowerCase(), ms: objectIdSeconds(s) * 1000, counter: parseInt(s.slice(18), 16) };
  }
  if (/^[A-Za-z0-9_-]{21}$/.test(s)) return { type: "nanoid", canonical: s, length: 21 };
  return { type: "invalid", reason: "format" };
}
