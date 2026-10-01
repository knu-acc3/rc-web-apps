/* Digest formatting, comparison and checksum-file parsing. No hashing code here, so the pages stay light. */
import { bytesToBase64, hexToBytes } from "@/sections/code/kit/bytes";
import type { AlgoId } from "./algorithms";

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
