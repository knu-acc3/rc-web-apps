/** Base64 helpers for files (chunked, tolerant decoding). Pure, unit-tested. */

const CHUNK = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface ParsedBase64 {
  /** Clean standard Base64 with padding. */
  data: string;
  /** MIME type from a data: URI, if any. */
  mime: string | null;
}

/**
 * Accept Base64 or a data: URI; tolerate whitespace/newlines, the URL-safe
 * alphabet (-_) and missing padding. Returns null for invalid input.
 */
export function parseBase64(input: string): ParsedBase64 | null {
  let s = input.trim();
  let mime: string | null = null;
  const m = /^data:([^;,]*)?((?:;[^;,]*)*?);base64,/i.exec(s);
  if (m) {
    mime = m[1] || null;
    s = s.slice(m[0].length);
  } else if (/^data:/i.test(s)) {
    return null; // data URI that isn't Base64 encoded
  }
  s = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!s || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return null;
  s = s.replace(/=+$/, "");
  if (s.length % 4 === 1) return null;
  s += "=".repeat((4 - (s.length % 4)) % 4);
  return { data: s, mime };
}

/** Wrap long Base64 lines (76 chars = MIME, RFC 2045). */
export function wrapLines(s: string, width = 76): string {
  if (width <= 0) return s;
  const out: string[] = [];
  for (let i = 0; i < s.length; i += width) out.push(s.slice(i, i + width));
  return out.join("\n");
}

/** Size of the decoded data for a padded Base64 string. */
export function decodedSize(b64: string): number {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return (b64.length / 4) * 3 - pad;
}
