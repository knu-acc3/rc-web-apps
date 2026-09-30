/**
 * JWT (RFC 7519 / JWS RFC 7515): parsing, HMAC verification and signing with @noble/hashes
 * (works over plain http), RSA / RSA-PSS / ECDSA via WebCrypto (needs a secure context).
 */
import { hmac } from "@noble/hashes/hmac.js";
import { sha256, sha384, sha512 } from "@noble/hashes/sha2.js";
import { base64ToBytes, bytesToBase64, utf8Decode, utf8Encode } from "@/sections/code/kit/bytes";

export type Alg = "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512" | "PS256" | "PS384" | "PS512" | "ES256" | "ES384" | "ES512" | "none";
export const HMAC_ALGS = ["HS256", "HS384", "HS512"] as const;
export const ASYM_ALGS = ["RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"] as const;

export const b64url = (b: Uint8Array) => bytesToBase64(b, { urlSafe: true });

export type ParseError = "empty" | "parts" | "jwe" | "header-b64" | "header-json" | "payload-b64" | "payload-json";

export interface ParsedJwt {
  raw: string;
  header: Record<string, unknown>;
  payload: unknown;
  headerJson: string;
  payloadJson: string;
  signature: string;
  signingInput: string;
  alg: string;
}

/** Remove "Bearer ", quotes, whitespace and a trailing "." left from copy-paste. */
export function cleanToken(s: string): string {
  return s
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim()
    .replace(/^authorization:\s*/i, "")
    .replace(/^bearer\s+/i, "")
    .replace(/\s+/g, "");
}

export function parseJwt(input: string): { ok: true; jwt: ParsedJwt } | { ok: false; error: ParseError } {
  const raw = cleanToken(input);
  if (!raw) return { ok: false, error: "empty" };
  const parts = raw.split(".");
  if (parts.length === 5) return { ok: false, error: "jwe" };
  if (parts.length !== 3) return { ok: false, error: "parts" };
  const dec = (p: string, which: "header" | "payload"): { text: string } | { error: ParseError } => {
    try {
      return { text: utf8Decode(base64ToBytes(p), true) };
    } catch {
      return { error: `${which}-b64` as ParseError };
    }
  };
  const h = dec(parts[0], "header");
  if ("error" in h) return { ok: false, error: h.error };
  const p = dec(parts[1], "payload");
  if ("error" in p) return { ok: false, error: p.error };
  let header: Record<string, unknown>;
  let payload: unknown;
  try {
    header = JSON.parse(h.text);
    if (!header || typeof header !== "object" || Array.isArray(header)) throw new Error();
  } catch {
    return { ok: false, error: "header-json" };
  }
  try {
    payload = JSON.parse(p.text);
  } catch {
    return { ok: false, error: "payload-json" };
  }
  return {
    ok: true,
    jwt: {
      raw,
      header,
      payload,
      headerJson: JSON.stringify(header, null, 2),
      payloadJson: JSON.stringify(payload, null, 2),
      signature: parts[2],
      signingInput: `${parts[0]}.${parts[1]}`,
      alg: typeof header.alg === "string" ? header.alg : "",
    },
  };
}

/* ───────────── HMAC (noble) ───────────── */

const HASH = { HS256: sha256, HS384: sha384, HS512: sha512 };

export function hmacSign(alg: (typeof HMAC_ALGS)[number], signingInput: string, key: Uint8Array): string {
  return b64url(hmac(HASH[alg], key, utf8Encode(signingInput)));
}

export function hmacVerify(alg: (typeof HMAC_ALGS)[number], signingInput: string, signature: string, key: Uint8Array): boolean {
  let sig: Uint8Array;
  try {
    sig = base64ToBytes(signature);
  } catch {
    return false;
  }
  const mac = hmac(HASH[alg], key, utf8Encode(signingInput));
  if (mac.length !== sig.length) return false;
  let d = 0;
  for (let i = 0; i < mac.length; i++) d |= mac[i] ^ sig[i];
  return d === 0;
}

/* ───────────── keys: PEM / DER / JWK ───────────── */

interface Tlv {
  tag: number;
  start: number; // start of the TLV
  body: number; // start of the value
  end: number; // end of the value
}

function readTlv(b: Uint8Array, off: number): Tlv {
  const tag = b[off];
  let len = b[off + 1];
  let body = off + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + b[off + 2 + i];
    body += n;
  }
  if (body + len > b.length) throw new Error("DER");
  return { tag, start: off, body, end: body + len };
}

function children(b: Uint8Array, t: Tlv): Tlv[] {
  const out: Tlv[] = [];
  for (let off = t.body; off < t.end; ) {
    const c = readTlv(b, off);
    out.push(c);
    off = c.end;
  }
  return out;
}

/** SubjectPublicKeyInfo from an X.509 certificate (DER). */
export function spkiFromCertificate(der: Uint8Array): Uint8Array {
  const cert = readTlv(der, 0);
  const tbs = children(der, cert)[0];
  const f = children(der, tbs);
  const i = f[0].tag === 0xa0 ? 1 : 0; // optional [0] version
  const spki = f[i + 5];
  return der.slice(spki.start, spki.end);
}

function derLen(n: number): number[] {
  if (n < 0x80) return [n];
  const bytes: number[] = [];
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n = Math.floor(n / 256);
  }
  return [0x80 | bytes.length, ...bytes];
}
const tlv = (tag: number, body: Uint8Array | number[]) => new Uint8Array([tag, ...derLen(body.length), ...body]);

/** Wrap a PKCS#1 RSAPublicKey ("BEGIN RSA PUBLIC KEY") into SubjectPublicKeyInfo. */
export function spkiFromPkcs1(pkcs1: Uint8Array): Uint8Array {
  const algId = new Uint8Array([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);
  const bitString = tlv(0x03, [0x00, ...pkcs1]);
  return tlv(0x30, [...algId, ...bitString]);
}

export type KeyInput = { kind: "spki" | "pkcs8"; der: Uint8Array } | { kind: "jwk"; jwk: JsonWebKey } | { kind: "error"; error: "pem" | "unsupported-pem" | "jwk" | "no-kid" };

export function parseKey(text: string, kid?: string): KeyInput {
  const t = text.trim();
  if (t.startsWith("{")) {
    try {
      const j = JSON.parse(t);
      if (Array.isArray(j.keys)) {
        const k = (kid ? j.keys.find((x: JsonWebKey & { kid?: string }) => x.kid === kid) : undefined) ?? (j.keys.length === 1 ? j.keys[0] : undefined);
        return k ? { kind: "jwk", jwk: k } : { kind: "error", error: "no-kid" };
      }
      return { kind: "jwk", jwk: j };
    } catch {
      return { kind: "error", error: "jwk" };
    }
  }
  const m = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/.exec(t);
  if (!m) return { kind: "error", error: "pem" };
  let der: Uint8Array;
  try {
    der = base64ToBytes(m[2]);
  } catch {
    return { kind: "error", error: "pem" };
  }
  try {
    switch (m[1]) {
      case "PUBLIC KEY":
        return { kind: "spki", der };
      case "RSA PUBLIC KEY":
        return { kind: "spki", der: spkiFromPkcs1(der) };
      case "CERTIFICATE":
        return { kind: "spki", der: spkiFromCertificate(der) };
      case "PRIVATE KEY":
        return { kind: "pkcs8", der };
      default:
        return { kind: "error", error: "unsupported-pem" };
    }
  } catch {
    return { kind: "error", error: "pem" };
  }
}

export function toPem(der: Uint8Array, label: string): string {
  const b = bytesToBase64(der);
  return `-----BEGIN ${label}-----\n${b.match(/.{1,64}/g)!.join("\n")}\n-----END ${label}-----`;
}

/* ───────────── WebCrypto algorithms ───────────── */

type AsymAlg = (typeof ASYM_ALGS)[number];

export function webCryptoParams(alg: AsymAlg): { import: RsaHashedImportParams | EcKeyImportParams; sign: AlgorithmIdentifier | RsaPssParams | EcdsaParams } {
  const bits = alg.slice(2) as "256" | "384" | "512";
  const hash = `SHA-${bits}`;
  if (alg.startsWith("RS")) return { import: { name: "RSASSA-PKCS1-v1_5", hash }, sign: { name: "RSASSA-PKCS1-v1_5" } };
  if (alg.startsWith("PS")) return { import: { name: "RSA-PSS", hash }, sign: { name: "RSA-PSS", saltLength: Number(bits) / 8 } };
  const curve = bits === "256" ? "P-256" : bits === "384" ? "P-384" : "P-521";
  return { import: { name: "ECDSA", namedCurve: curve }, sign: { name: "ECDSA", hash } };
}

export const hasSubtle = () => typeof crypto !== "undefined" && !!crypto.subtle;

async function importKey(key: KeyInput, alg: AsymAlg, usage: "verify" | "sign"): Promise<CryptoKey> {
  const p = webCryptoParams(alg);
  if (key.kind === "jwk") {
    const { alg: _a, key_ops: _o, use: _u, ...jwk } = key.jwk as JsonWebKey & { use?: string };
    return crypto.subtle.importKey("jwk", jwk, p.import, false, [usage]);
  }
  if (key.kind === "error") throw new Error(key.error);
  return crypto.subtle.importKey(key.kind, key.der as BufferSource, p.import, false, [usage]);
}

export async function asymVerify(alg: AsymAlg, signingInput: string, signature: string, key: KeyInput): Promise<boolean> {
  const k = await importKey(key, alg, "verify");
  // JWS ECDSA signatures are raw r||s — exactly what WebCrypto expects.
  return crypto.subtle.verify(webCryptoParams(alg).sign, k, base64ToBytes(signature) as BufferSource, utf8Encode(signingInput) as BufferSource);
}

export async function asymSign(alg: AsymAlg, signingInput: string, key: KeyInput): Promise<string> {
  const k = await importKey(key, alg, "sign");
  const sig = await crypto.subtle.sign(webCryptoParams(alg).sign, k, utf8Encode(signingInput) as BufferSource);
  return b64url(new Uint8Array(sig));
}

/** Generate a key pair and return PEM strings (public SPKI, private PKCS#8). */
export async function generateKeyPair(alg: AsymAlg): Promise<{ publicPem: string; privatePem: string }> {
  const p = webCryptoParams(alg);
  const params = alg.startsWith("ES") ? p.import : { ...(p.import as RsaHashedImportParams), modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) };
  const pair = (await crypto.subtle.generateKey(params as RsaHashedKeyGenParams | EcKeyGenParams, true, ["sign", "verify"])) as CryptoKeyPair;
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  return { publicPem: toPem(spki, "PUBLIC KEY"), privatePem: toPem(pkcs8, "PRIVATE KEY") };
}

/** Build and sign a token. */
export async function signJwt(header: Record<string, unknown>, payloadJson: string, secretOrKey: { secret?: Uint8Array; key?: KeyInput }): Promise<string> {
  const alg = String(header.alg) as Alg;
  const h = b64url(utf8Encode(JSON.stringify(header)));
  const p = b64url(utf8Encode(JSON.stringify(JSON.parse(payloadJson))));
  const input = `${h}.${p}`;
  if (alg === "none") return `${input}.`;
  if ((HMAC_ALGS as readonly string[]).includes(alg)) return `${input}.${hmacSign(alg as (typeof HMAC_ALGS)[number], input, secretOrKey.secret ?? new Uint8Array())}`;
  return `${input}.${await asymSign(alg as AsymAlg, input, secretOrKey.key!)}`;
}

/* ───────────── claims ───────────── */

export const TIME_CLAIMS = ["exp", "nbf", "iat", "auth_time", "updated_at"];

export type TimeStatus = { exp?: "expired" | "valid"; nbf?: "future" | "ok"; iat?: "future" | "ok" };

/** Time checks relative to `nowSec`, with a clock-skew tolerance in seconds. */
export function timeStatus(payload: unknown, nowSec: number, skew = 0): TimeStatus {
  const out: TimeStatus = {};
  if (!payload || typeof payload !== "object") return out;
  const p = payload as Record<string, unknown>;
  if (typeof p.exp === "number") out.exp = nowSec - skew >= p.exp ? "expired" : "valid";
  if (typeof p.nbf === "number") out.nbf = nowSec + skew < p.nbf ? "future" : "ok";
  if (typeof p.iat === "number") out.iat = p.iat > nowSec + skew ? "future" : "ok";
  return out;
}
