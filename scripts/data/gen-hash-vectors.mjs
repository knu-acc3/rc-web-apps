// Generates src/tools/dev/hash/data/vectors.json — digests of reference strings for every
// algorithm, shown as test-vector tables on the algorithm pages (server-rendered).
// Verified against the runtime engine by tests/unit/hash-engine.test.ts.
// Run: node scripts/data/gen-hash-vectors.mjs
import { writeFileSync } from "node:fs";
import * as W from "hash-wasm";
import { sha512_256 } from "@noble/hashes/sha2.js";

const INPUTS = ["", "abc", "The quick brown fox jumps over the lazy dog"];
const hex = (b) => Buffer.from(b).toString("hex");

const algos = {
  md5: (d) => W.md5(d),
  sha1: (d) => W.sha1(d),
  sha224: (d) => W.sha224(d),
  sha256: (d) => W.sha256(d),
  sha384: (d) => W.sha384(d),
  sha512: (d) => W.sha512(d),
  "sha512-256": async (d) => hex(sha512_256(new TextEncoder().encode(d))),
  "sha3-224": (d) => W.sha3(d, 224),
  "sha3-256": (d) => W.sha3(d, 256),
  "sha3-384": (d) => W.sha3(d, 384),
  "sha3-512": (d) => W.sha3(d, 512),
  "keccak-256": (d) => W.keccak(d, 256),
  blake2b: (d) => W.blake2b(d, 512),
  blake2s: (d) => W.blake2s(d, 256),
  blake3: (d) => W.blake3(d, 256),
  ripemd160: (d) => W.ripemd160(d),
  crc32: (d) => W.crc32(d),
  crc32c: (d) => W.crc32(d, 0x82f63b78),
  adler32: (d) => W.adler32(d),
  xxhash32: (d) => W.xxhash32(d),
  xxhash64: (d) => W.xxhash64(d),
  xxh3: (d) => W.xxhash3(d),
};

const out = {};
for (const [id, fn] of Object.entries(algos)) {
  out[id] = [];
  for (const s of INPUTS) out[id].push(await fn(s));
}
const file = new URL("../../src/tools/dev/hash/data/vectors.json", import.meta.url);
writeFileSync(file, JSON.stringify({ inputs: INPUTS, digests: out }, null, 1) + "\n");
console.log("wrote", file.pathname);
