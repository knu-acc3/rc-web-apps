/** Base64 helpers for images (pure, chunked — safe for multi-MB data). */

export function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(out);
}

export interface ParsedInput {
  bytes: Uint8Array;
  /** MIME declared in a data URI (may be wrong — detect from bytes). */
  declared?: string;
}

export class Base64Error extends Error {
  constructor(
    public code: "EMPTY" | "INVALID" | "BAD_LENGTH",
    public at?: number,
  ) {
    super(code);
  }
}

/**
 * Accepts a data URI (base64 or URL-encoded), raw Base64 or Base64URL, with
 * whitespace/newlines. Returns the decoded bytes.
 */
export function parseBase64Input(input: string): ParsedInput {
  let s = input.trim();
  if (!s) throw new Base64Error("EMPTY");
  // CSS url("…") / HTML src="…" wrappers
  const wrapped = /^(?:url\(\s*)?["']?(data:[^"')]+?)["']?\s*\)?;?$/i.exec(s);
  if (wrapped) s = wrapped[1];
  let declared: string | undefined;
  if (/^data:/i.test(s)) {
    const comma = s.indexOf(",");
    if (comma < 0) throw new Base64Error("INVALID", 0);
    const meta = s.slice(5, comma);
    declared = meta.split(";")[0] || undefined;
    const body = s.slice(comma + 1);
    if (!/;base64$/i.test(meta)) {
      // URL-encoded data (typical for SVG)
      const text = decodeURIComponent(body);
      return { bytes: new TextEncoder().encode(text), declared };
    }
    s = body;
  }
  s = s.replace(/\s+/g, "");
  // Base64URL → Base64
  if (/[-_]/.test(s)) s = s.replace(/-/g, "+").replace(/_/g, "/");
  const bad = s.search(/[^A-Za-z0-9+/=]/);
  if (bad >= 0) throw new Base64Error("INVALID", bad);
  s = s.replace(/=+$/, "");
  if (s.length % 4 === 1) throw new Base64Error("BAD_LENGTH");
  const padded = s + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, declared };
}

/** Size of the Base64 text for n bytes (with padding). */
export const base64Length = (n: number) => 4 * Math.ceil(n / 3);

/** Percent-encode SVG text for a compact `data:image/svg+xml,` URI. */
export function svgToDataUri(svg: string): string {
  const compact = svg.replace(/\s+/g, " ").trim().replace(/"/g, "'");
  return `data:image/svg+xml,${compact.replace(/[\r\n%#()<>?[\\\]^`{|}]/g, encodeURIComponent)}`;
}
