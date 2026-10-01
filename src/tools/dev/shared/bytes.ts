/**
 * Byte helpers shared by the developer sections. Pure functions, safe on the
 * server, in workers and in tests. No reliance on btoa/atob or crypto.subtle.
 */

const enc = new TextEncoder();

export function utf8Encode(s: string): Uint8Array {
  return enc.encode(s);
}

/** Decode UTF-8. With `fatal`, invalid sequences throw instead of becoming U+FFFD. */
export function utf8Decode(bytes: Uint8Array, fatal = false): string {
  return new TextDecoder("utf-8", { fatal, ignoreBOM: true }).decode(bytes);
}

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

export function bytesToHex(bytes: Uint8Array, upper = false): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += HEX[bytes[i]];
  return upper ? s.toUpperCase() : s;
}

/** Parse hex, ignoring whitespace, ":" / "-" separators and an optional 0x prefix. */
export function hexToBytes(input: string): Uint8Array {
  const s = input.replace(/^0x/i, "").replace(/[\s:-]/g, "");
  if (s.length % 2 !== 0) throw new Error("Hex string has an odd number of digits");
  if (/[^0-9a-f]/i.test(s)) throw new Error("Invalid hex digit");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
  return out;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const B64_REV = (() => {
  const r = new Int16Array(128).fill(-1);
  for (let i = 0; i < 64; i++) r[B64.charCodeAt(i)] = i;
  r["-".charCodeAt(0)] = 62;
  r["_".charCodeAt(0)] = 63;
  return r;
})();

export function bytesToBase64(bytes: Uint8Array, opts: { urlSafe?: boolean; pad?: boolean } = {}): string {
  const alphabet = opts.urlSafe ? B64URL : B64;
  const pad = opts.pad ?? !opts.urlSafe;
  let out = "";
  const n = bytes.length;
  let i = 0;
  for (; i + 2 < n; i += 3) {
    const v = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += alphabet[(v >> 18) & 63] + alphabet[(v >> 12) & 63] + alphabet[(v >> 6) & 63] + alphabet[v & 63];
  }
  if (i < n) {
    const v = (bytes[i] << 16) | ((i + 1 < n ? bytes[i + 1] : 0) << 8);
    out += alphabet[(v >> 18) & 63] + alphabet[(v >> 12) & 63];
    if (i + 1 < n) out += alphabet[(v >> 6) & 63];
    if (pad) out += i + 1 < n ? "=" : "==";
  }
  return out;
}

export class Base64Error extends Error {
  /** Index of the offending character in the input, when known. */
  readonly index?: number;
  constructor(message: string, index?: number) {
    super(message);
    this.name = "Base64Error";
    this.index = index;
  }
}

/**
 * Tolerant Base64 decoder: accepts standard and URL-safe alphabets (even mixed),
 * missing padding and whitespace / line breaks. Throws Base64Error on anything else.
 */
export function base64ToBytes(input: string): Uint8Array {
  const out = new Uint8Array(Math.floor((input.length * 3) / 4) + 3);
  let o = 0;
  let acc = 0;
  let bits = 0;
  let seen = 0;
  let padding = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c === 32 || c === 9 || c === 10 || c === 13 || c === 12) continue;
    if (c === 61 /* = */) {
      padding++;
      continue;
    }
    if (padding > 0) throw new Base64Error("Data after padding", i);
    const v = c < 128 ? B64_REV[c] : -1;
    if (v < 0) throw new Base64Error(`Invalid character “${input[i]}”`, i);
    acc = (acc << 6) | v;
    bits += 6;
    seen++;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 0xff;
    }
    acc &= 0xff;
  }
  if (seen % 4 === 1) throw new Base64Error("Invalid length");
  if (padding > 2) throw new Base64Error("Too much padding");
  return out.slice(0, o);
}
