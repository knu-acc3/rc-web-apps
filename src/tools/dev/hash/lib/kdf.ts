/**
 * Password hashing (bcrypt, Argon2id, scrypt, PBKDF2) on hash-wasm. Runs in the worker.
 *
 * Encoded formats:
 *   bcrypt  — modular crypt "$2b$<cost>$<22-char salt><31-char hash>"
 *   argon2  — PHC string "$argon2id$v=19$m=<KiB>,t=<iterations>,p=<parallelism>$<salt>$<hash>"
 *   scrypt  — "$scrypt$ln=<log2 N>,r=<r>,p=<p>$<salt>$<hash>" (passlib/PHC style)
 *   pbkdf2  — "$pbkdf2-<sha1|sha256|sha512>$i=<iterations>,l=<bytes>$<salt>$<hash>" (PHC style)
 * Salts and hashes in PHC strings are Base64 without padding.
 */
import { argon2id, argon2Verify, bcrypt, bcryptVerify, createSHA1, createSHA256, createSHA512, pbkdf2, scrypt } from "hash-wasm";
import { base64ToBytes, bytesToBase64, utf8Encode } from "@/tools/dev/shared/bytes";

const b64 = (b: Uint8Array) => bytesToBase64(b, { pad: false });

/* ───────────── bcrypt ───────────── */

export async function bcryptHash(password: string, cost: number, salt: Uint8Array): Promise<string> {
  if (cost < 4 || cost > 31) throw new RangeError("bcrypt cost must be 4–31");
  const out = await bcrypt({ password: utf8Encode(password), salt, costFactor: cost, outputType: "encoded" });
  // hash-wasm emits $2a$; $2b$ is the current identifier with identical output for inputs < 256 bytes
  return out.replace(/^\$2a\$/, "$2b$");
}

export async function bcryptCheck(password: string, hash: string): Promise<boolean> {
  const h = hash.trim();
  if (!/^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(h)) throw new Error("Not a bcrypt hash");
  return bcryptVerify({ password: utf8Encode(password), hash: h.replace(/^\$2[bxy]\$/, "$2a$") });
}

/* ───────────── Argon2id ───────────── */

export interface Argon2Params {
  /** memory in KiB */
  memory: number;
  iterations: number;
  parallelism: number;
  length: number;
}

export async function argon2Hash(password: string, salt: Uint8Array, p: Argon2Params): Promise<string> {
  return argon2id({ password: utf8Encode(password), salt, memorySize: p.memory, iterations: p.iterations, parallelism: p.parallelism, hashLength: p.length, outputType: "encoded" });
}

export async function argon2Check(password: string, encoded: string): Promise<boolean> {
  const h = encoded.trim();
  if (!/^\$argon2(id|i|d)\$/.test(h)) throw new Error("Not an Argon2 PHC string");
  return argon2Verify({ password: utf8Encode(password), hash: h });
}

/* ───────────── scrypt ───────────── */

export interface ScryptParams {
  /** N = 2^ln */
  ln: number;
  r: number;
  p: number;
  length: number;
}

export async function scryptRaw(password: Uint8Array, salt: Uint8Array, p: ScryptParams): Promise<Uint8Array> {
  return scrypt({ password, salt, costFactor: 2 ** p.ln, blockSize: p.r, parallelism: p.p, hashLength: p.length, outputType: "binary" });
}

export async function scryptHash(password: string, salt: Uint8Array, p: ScryptParams): Promise<string> {
  const h = await scryptRaw(utf8Encode(password), salt, p);
  return `$scrypt$ln=${p.ln},r=${p.r},p=${p.p}$${b64(salt)}$${b64(h)}`;
}

export function parseScrypt(s: string): { params: ScryptParams; salt: Uint8Array; hash: Uint8Array } {
  const m = /^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([A-Za-z0-9+/._-]+)\$([A-Za-z0-9+/._-]+)$/.exec(s.trim());
  if (!m) throw new Error("Not a $scrypt$ string");
  const hash = base64ToBytes(m[5].replace(/\./g, "+"));
  return { params: { ln: +m[1], r: +m[2], p: +m[3], length: hash.length }, salt: base64ToBytes(m[4].replace(/\./g, "+")), hash };
}

export async function scryptCheck(password: string, encoded: string): Promise<boolean> {
  const { params, salt, hash } = parseScrypt(encoded);
  return equal(await scryptRaw(utf8Encode(password), salt, params), hash);
}

/* ───────────── PBKDF2 ───────────── */

export type PbkdfHash = "sha1" | "sha256" | "sha512";

export interface Pbkdf2Params {
  hash: PbkdfHash;
  iterations: number;
  length: number;
}

function hashFn(h: PbkdfHash) {
  return h === "sha1" ? createSHA1() : h === "sha512" ? createSHA512() : createSHA256();
}

export async function pbkdf2Raw(password: Uint8Array, salt: Uint8Array, p: Pbkdf2Params): Promise<Uint8Array> {
  return pbkdf2({ password, salt, iterations: p.iterations, hashLength: p.length, hashFunction: hashFn(p.hash), outputType: "binary" });
}

export async function pbkdf2Hash(password: string, salt: Uint8Array, p: Pbkdf2Params): Promise<string> {
  const h = await pbkdf2Raw(utf8Encode(password), salt, p);
  return `$pbkdf2-${p.hash}$i=${p.iterations},l=${p.length}$${b64(salt)}$${b64(h)}`;
}

export function parsePbkdf2(s: string): { params: Pbkdf2Params; salt: Uint8Array; hash: Uint8Array } {
  const m = /^\$pbkdf2-(sha1|sha256|sha512)\$i=(\d+)(?:,l=(\d+))?\$([A-Za-z0-9+/._-]+)\$([A-Za-z0-9+/._-]+)$/.exec(s.trim());
  if (!m) throw new Error("Not a $pbkdf2-…$ string");
  const hash = base64ToBytes(m[5].replace(/\./g, "+"));
  return { params: { hash: m[1] as PbkdfHash, iterations: +m[2], length: hash.length }, salt: base64ToBytes(m[4].replace(/\./g, "+")), hash };
}

export async function pbkdf2Check(password: string, encoded: string): Promise<boolean> {
  const { params, salt, hash } = parsePbkdf2(encoded);
  return equal(await pbkdf2Raw(utf8Encode(password), salt, params), hash);
}

/** Constant-time comparison. */
function equal(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}
