/**
 * Chunked Base64 for files: encoding reads the Blob in slices whose size is a multiple of 3
 * (so the pieces concatenate to exactly the one-shot result) and returns a Blob made of string
 * parts — no giant string in memory. Decoding consumes the text in 4-character-aligned slices.
 */
import { base64ToBytes, bytesToBase64 } from "@/sections/code/kit/bytes";

export const ENCODE_CHUNK = 3 * 1024 * 1024; // multiple of 3
export const DECODE_CHUNK = 4 * 1024 * 1024; // multiple of 4

export async function encodeBlob(
  blob: Blob,
  opts: { urlSafe?: boolean; dataUri?: boolean; mime?: string } = {},
  onProgress?: (done: number) => void,
  chunk = ENCODE_CHUNK,
): Promise<Blob> {
  if (chunk % 3) throw new Error("chunk must be a multiple of 3");
  const parts: string[] = [];
  if (opts.dataUri) parts.push(`data:${opts.mime || blob.type || "application/octet-stream"};base64,`);
  for (let off = 0; off < blob.size; off += chunk) {
    const bytes = new Uint8Array(await blob.slice(off, Math.min(blob.size, off + chunk)).arrayBuffer());
    parts.push(bytesToBase64(bytes, { urlSafe: opts.urlSafe, pad: !opts.urlSafe }));
    onProgress?.(Math.min(blob.size, off + chunk));
  }
  return new Blob(parts, { type: "text/plain" });
}

/** Parse "data:image/png;base64,…" → mime + payload offset. */
export function parseDataUri(text: string): { mime?: string; offset: number } {
  const m = /^\s*data:([^;,]*)(?:;[^,]*)?;base64,/i.exec(text.slice(0, 256));
  return m ? { mime: m[1] || undefined, offset: m[0].length } : { offset: 0 };
}

export function decodeToBlob(text: string, onProgress?: (done: number) => void, chunk = DECODE_CHUNK): { blob: Blob; mime?: string } {
  const { mime, offset } = parseDataUri(text);
  const parts: Uint8Array[] = [];
  let carry = "";
  for (let off = offset; off < text.length; off += chunk) {
    const clean = carry + text.slice(off, off + chunk).replace(/[\s]/g, "");
    const usable = off + chunk >= text.length ? clean.length : clean.length - (clean.length % 4);
    parts.push(base64ToBytes(clean.slice(0, usable)));
    carry = clean.slice(usable);
    onProgress?.(Math.min(text.length, off + chunk));
  }
  if (carry) parts.push(base64ToBytes(carry));
  const type = mime || sniffMime(parts[0] ?? new Uint8Array());
  return { blob: new Blob(parts as BlobPart[], { type }), mime: type };
}

/** Detect common file types by magic bytes. */
export function sniffMime(b: Uint8Array): string {
  const hex = Array.from(b.slice(0, 12), (x) => x.toString(16).padStart(2, "0")).join("");
  const ascii = String.fromCharCode(...b.slice(0, 12));
  if (hex.startsWith("89504e47")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (ascii.startsWith("GIF8")) return "image/gif";
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  if (ascii.slice(4, 12) === "ftypavif") return "image/avif";
  if (ascii.startsWith("%PDF")) return "application/pdf";
  if (hex.startsWith("504b0304")) return "application/zip";
  if (ascii.startsWith("<svg") || ascii.startsWith("<?xml")) return "image/svg+xml";
  if (hex.startsWith("494433") || hex.startsWith("fffb")) return "audio/mpeg";
  if (ascii.startsWith("OggS")) return "audio/ogg";
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WAVE") return "audio/wav";
  if (hex.startsWith("00000100")) return "image/x-icon";
  return "application/octet-stream";
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "text/plain": "txt",
};
export const extFor = (mime?: string) => (mime && EXT[mime]) || "bin";
