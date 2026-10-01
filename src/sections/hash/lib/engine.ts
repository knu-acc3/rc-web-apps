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
import { bytesToHex } from "@/sections/code/kit/bytes";
import { ALGO_BY_ID, type AlgoId } from "./algorithms";

interface StreamHasher {
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

async function createHasher(algo: AlgoId, opts: { bits?: number; key?: Uint8Array } = {}): Promise<StreamHasher> {
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

const CHUNK = 8 * 1024 * 1024;

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
