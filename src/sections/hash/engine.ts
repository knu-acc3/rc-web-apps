/**
 * Hashing engine on hash-wasm (WebAssembly, embedded — no network) and @noble/hashes.
 * Never uses crypto.subtle, so it works over plain http. Runs in the worker and in tests.
 */
import {
  createAdler32,
  createBLAKE2b,
  createBLAKE2s,
  createBLAKE3,
  createCRC32,
  createHMAC,
  createKeccak,
  createMD5,
  createRIPEMD160,
  createSHA1,
  createSHA224,
  createSHA256,
  createSHA3,
  createSHA384,
  createSHA512,
  createXXHash3,
  createXXHash32,
  createXXHash64,
  type IHasher,
} from "hash-wasm";
import { hmac } from "@noble/hashes/hmac.js";
import { sha512_256 } from "@noble/hashes/sha2.js";
import { bytesToBase64, bytesToHex, hexToBytes } from "@/sections/code/kit/bytes";
import { ALGO_BY_ID, type AlgoId } from "./algorithms";

export interface StreamHasher {
  update(data: Uint8Array): void;
  /** Lowercase hex digest */
  digest(): string;
}

function wrap(h: IHasher): StreamHasher {
  h.init();
  return {
    update: (d) => void h.update(d),
    digest: () => h.digest("hex"),
  };
}

function baseFactory(algo: AlgoId, bits?: number): Promise<IHasher> | null {
  switch (algo) {
    case "md5":
      return createMD5();
    case "sha1":
      return createSHA1();
    case "sha224":
      return createSHA224();
    case "sha256":
      return createSHA256();
    case "sha384":
      return createSHA384();
    case "sha512":
      return createSHA512();
    case "sha3-224":
      return createSHA3(224);
    case "sha3-256":
      return createSHA3(256);
    case "sha3-384":
      return createSHA3(384);
    case "sha3-512":
      return createSHA3(512);
    case "keccak-256":
      return createKeccak(256);
    case "blake2b":
      return createBLAKE2b(bits ?? 512);
    case "blake2s":
      return createBLAKE2s(bits ?? 256);
    case "blake3":
      return createBLAKE3(bits ?? 256);
    case "ripemd160":
      return createRIPEMD160();
    case "crc32":
      return createCRC32();
    case "crc32c":
      return createCRC32(0x82f63b78);
    case "adler32":
      return createAdler32();
    case "xxhash32":
      return createXXHash32();
    case "xxhash64":
      return createXXHash64();
    case "xxh3":
      return createXXHash3();
    default:
      return null;
  }
}

export async function createHasher(algo: AlgoId, opts: { bits?: number; key?: Uint8Array } = {}): Promise<StreamHasher> {
  if (!ALGO_BY_ID.has(algo)) throw new Error(`Unknown algorithm ${algo}`);
  if (algo === "sha512-256") {
    if (opts.key) {
      const h = hmac.create(sha512_256, opts.key);
      return { update: (d) => void h.update(d), digest: () => bytesToHex(h.digest()) };
    }
    const h = sha512_256.create();
    return { update: (d) => void h.update(d), digest: () => bytesToHex(h.digest()) };
  }
  const base = baseFactory(algo, opts.bits);
  if (!base) throw new Error(`Unknown algorithm ${algo}`);
  if (opts.key) return wrap(await createHMAC(base, opts.key));
  return wrap(await base);
}

export async function hashBytes(algo: AlgoId, data: Uint8Array, opts: { bits?: number; key?: Uint8Array } = {}): Promise<string> {
  const h = await createHasher(algo, opts);
  h.update(data);
  return h.digest();
}

/* ───────────── streaming over Blob / File ───────────── */

export const CHUNK = 8 * 1024 * 1024;

/**
 * Hash a Blob chunk by chunk (never loads the whole file). `onProgress(doneBytes)` is
 * called after every chunk.
 */
export async function hashBlob(
  algo: AlgoId,
  blob: Blob,
  opts: { bits?: number; key?: Uint8Array } = {},
  onProgress?: (done: number) => void,
  chunk = CHUNK,
): Promise<string> {
  const h = await createHasher(algo, opts);
  for (let off = 0; off < blob.size; off += chunk) {
    const buf = new Uint8Array(await blob.slice(off, Math.min(blob.size, off + chunk)).arrayBuffer());
    h.update(buf);
    onProgress?.(Math.min(blob.size, off + chunk));
  }
  return h.digest();
}

/* ───────────── output formats ───────────── */

export type OutFormat = "hex" | "HEX" | "base64" | "base64url";

export function formatDigest(hex: string, fmt: OutFormat): string {
  if (!hex) return "";
  if (fmt === "hex") return hex;
  if (fmt === "HEX") return hex.toUpperCase();
  return bytesToBase64(hexToBytes(hex), { urlSafe: fmt === "base64url" });
}

/** Normalize an expected digest for comparison: drops whitespace, a "sha256:"-style label and "0x". */
export function normalizeExpected(s: string): string {
  let t = s.replace(/\s+/g, "");
  const m = /^[a-z][a-z0-9-]*[:=](.+)$/i.exec(t);
  if (m) t = m[1];
  return t.replace(/^0x/i, "");
}

/**
 * Compare a computed hex digest with a user-supplied expected value given as hex
 * (any case) or Base64 / Base64url (padding optional).
 */
export function digestMatches(hex: string, expected: string): boolean {
  const e = normalizeExpected(expected);
  if (!e || !hex) return false;
  if (/^[0-9a-f]+$/i.test(e) && e.length === hex.length) return e.toLowerCase() === hex;
  const b = hexToBytes(hex);
  const unpad = (x: string) => x.replace(/=+$/, "");
  return unpad(e) === unpad(bytesToBase64(b)) || unpad(e) === bytesToBase64(b, { urlSafe: true });
}

/* ───────────── checksum files (SHA256SUMS, MD5SUMS, BSD style) ───────────── */

export interface SumEntry {
  hash: string;
  file: string;
  algo?: string;
}

/**
 * Parse checksum lists:
 *   GNU:  "<hex>  file", "<hex> *file" (binary mode), with "\" escapes for special names
 *   BSD:  "SHA256 (file) = <hex>"
 */
export function parseSums(text: string): SumEntry[] {
  const out: SumEntry[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const bsd = /^([A-Za-z0-9-]+)\s*\((.+)\)\s*=\s*([0-9a-fA-F]+)$/.exec(line);
    if (bsd) {
      out.push({ algo: bsd[1].toLowerCase().replace(/-/g, ""), file: bsd[2], hash: bsd[3].toLowerCase() });
      continue;
    }
    const gnu = /^\\?([0-9a-fA-F]{8,128})\s[ *](.+)$/.exec(line);
    if (gnu) {
      let file = gnu[2];
      if (raw.trimStart().startsWith("\\")) file = file.replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
      out.push({ hash: gnu[1].toLowerCase(), file });
      continue;
    }
    const single = /^([0-9a-fA-F]{8,128})$/.exec(line);
    if (single) out.push({ hash: single[1].toLowerCase(), file: "" });
  }
  return out;
}

/** Map BSD tag names (SHA256, SHA3-256, MD5, BLAKE2b…) to our ids. */
export function algoFromTag(tag: string | undefined): AlgoId | undefined {
  if (!tag) return undefined;
  const t = tag.toLowerCase().replace(/[-_]/g, "");
  const map: Record<string, AlgoId> = {
    md5: "md5",
    sha1: "sha1",
    sha224: "sha224",
    sha256: "sha256",
    sha384: "sha384",
    sha512: "sha512",
    sha512256: "sha512-256",
    sha3224: "sha3-224",
    sha3256: "sha3-256",
    sha3384: "sha3-384",
    sha3512: "sha3-512",
    blake2b: "blake2b",
    blake2b512: "blake2b",
    blake2s: "blake2s",
    blake2s256: "blake2s",
    blake3: "blake3",
    ripemd160: "ripemd160",
    rmd160: "ripemd160",
    crc32: "crc32",
    crc32c: "crc32c",
  };
  return map[t];
}
