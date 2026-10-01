/*
 * Password encryption of files and text with the browser's Web Crypto: AES-256-GCM, key from the password with
 * PBKDF2-SHA-256. Large files are encrypted in 1 MiB chunks (each with its own nonce and authentication tag), so
 * memory use stays flat and any change to the file — even one bit — is detected on decryption.
 *
 * Format (all integers big-endian):
 *   magic "RCENC" (5 bytes) · version 1 (1) · iterations (4) · salt (16) · nonce prefix (8) · chunk size (4)
 *   then chunks: [ciphertext + 16-byte tag] — chunk i uses nonce = prefix ‖ uint32(i), and the last chunk is
 *   marked by authenticating "last" as additional data (truncation is detected).
 *   Chunk 0 starts with a small JSON header {name, type, size} padded into the plaintext.
 */

const MAGIC = [0x52, 0x43, 0x45, 0x4e, 0x43]; // "RCENC"
const VERSION = 1;
const ITERATIONS = 600_000; // OWASP 2023 recommendation for PBKDF2-HMAC-SHA256
export const CHUNK = 1024 * 1024;
const HEADER_LEN = 5 + 1 + 4 + 16 + 8 + 4;
const TAG = 16;

export class CryptError extends Error {
  constructor(public code: "not-encrypted" | "bad-password" | "corrupt" | "unsupported") {
    super(code);
  }
}

const subtle = () => {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new CryptError("unsupported");
  return s;
};

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const base = await subtle().importKey("raw", new TextEncoder().encode(password.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

function nonce(prefix: Uint8Array<ArrayBuffer>, i: number): Uint8Array<ArrayBuffer> {
  const n = new Uint8Array(12);
  n.set(prefix, 0);
  new DataView(n.buffer).setUint32(8, i);
  return n;
}

const AAD_MID = new Uint8Array([0]);
const AAD_LAST = new Uint8Array([1]);

interface Meta {
  name: string;
  type: string;
  size: number;
}

/** Is this the start of a file made by `encrypt`? */
export function isEncrypted(head: Uint8Array): boolean {
  return head.length >= HEADER_LEN && MAGIC.every((b, i) => head[i] === b);
}

/** Encrypt a file (or any bytes). `onProgress` gets 0–1. Returns the encrypted blob parts. */
export async function encrypt(data: Blob, password: string, meta: Meta, onProgress?: (p: number) => void, iterations = ITERATIONS): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prefix = crypto.getRandomValues(new Uint8Array(8));
  const key = await deriveKey(password, salt, iterations);
  const header = new Uint8Array(HEADER_LEN);
  header.set(MAGIC, 0);
  header[5] = VERSION;
  const dv = new DataView(header.buffer);
  dv.setUint32(6, iterations);
  header.set(salt, 10);
  header.set(prefix, 26);
  dv.setUint32(34, CHUNK);

  // Chunk 0 carries the metadata: uint16 length + JSON, then the start of the file.
  const metaBytes = new TextEncoder().encode(JSON.stringify(meta));
  const lead = new Uint8Array(2 + metaBytes.length);
  new DataView(lead.buffer).setUint16(0, metaBytes.length);
  lead.set(metaBytes, 2);

  const parts: BlobPart[] = [header];
  const total = lead.length + data.size;
  const chunks = Math.max(1, Math.ceil(total / CHUNK));
  let fileOffset = 0;
  for (let i = 0; i < chunks; i++) {
    let plain: Uint8Array<ArrayBuffer>;
    if (i === 0) {
      const take = Math.min(CHUNK - lead.length, data.size);
      plain = new Uint8Array(lead.length + take);
      plain.set(lead, 0);
      plain.set(new Uint8Array(await data.slice(0, take).arrayBuffer()), lead.length);
      fileOffset = take;
    } else {
      plain = new Uint8Array(await data.slice(fileOffset, fileOffset + CHUNK).arrayBuffer());
      fileOffset += plain.length;
    }
    const sealed = await subtle().encrypt({ name: "AES-GCM", iv: nonce(prefix, i), additionalData: i === chunks - 1 ? AAD_LAST : AAD_MID }, key, plain);
    parts.push(new Uint8Array(sealed));
    onProgress?.((i + 1) / chunks);
  }
  return new Blob(parts, { type: "application/octet-stream" });
}

/** Decrypt a blob made by `encrypt`. Wrong password and any tampering both fail authentication. */
export async function decrypt(data: Blob, password: string, onProgress?: (p: number) => void): Promise<{ blob: Blob; meta: Meta }> {
  const header = new Uint8Array(await data.slice(0, HEADER_LEN).arrayBuffer());
  if (!isEncrypted(header)) throw new CryptError("not-encrypted");
  if (header[5] !== VERSION) throw new CryptError("unsupported");
  const dv = new DataView(header.buffer);
  const iterations = dv.getUint32(6);
  const salt = header.slice(10, 26);
  const prefix = header.slice(26, 34);
  const chunk = dv.getUint32(34);
  if (iterations < 1000 || iterations > 10_000_000 || chunk < 1024 || chunk > 64 * 1024 * 1024) throw new CryptError("corrupt");
  const key = await deriveKey(password, salt, iterations);

  const body = data.size - HEADER_LEN;
  const chunks = Math.ceil(body / (chunk + TAG));
  if (chunks < 1) throw new CryptError("corrupt");
  const parts: BlobPart[] = [];
  let meta: Meta | null = null;
  for (let i = 0; i < chunks; i++) {
    const start = HEADER_LEN + i * (chunk + TAG);
    const sealed = new Uint8Array(await data.slice(start, start + chunk + TAG).arrayBuffer());
    let plain: Uint8Array<ArrayBuffer>;
    try {
      plain = new Uint8Array(await subtle().decrypt({ name: "AES-GCM", iv: nonce(prefix, i), additionalData: i === chunks - 1 ? AAD_LAST : AAD_MID }, key, sealed));
    } catch {
      // A later chunk failing means the file was changed or cut. For the first one, check whether only the
      // "last chunk" mark is off (the file was cut or appended to); otherwise the password is wrong.
      if (i > 0) throw new CryptError("corrupt");
      const other = await subtle()
        .decrypt({ name: "AES-GCM", iv: nonce(prefix, 0), additionalData: chunks === 1 ? AAD_MID : AAD_LAST }, key, sealed)
        .then(() => true, () => false);
      throw new CryptError(other ? "corrupt" : "bad-password");
    }
    if (i === 0) {
      const len = new DataView(plain.buffer, plain.byteOffset).getUint16(0);
      try {
        meta = JSON.parse(new TextDecoder().decode(plain.subarray(2, 2 + len))) as Meta;
      } catch {
        throw new CryptError("corrupt");
      }
      plain = plain.subarray(2 + len);
    }
    parts.push(plain);
    onProgress?.((i + 1) / chunks);
  }
  return { blob: new Blob(parts, { type: meta?.type || "application/octet-stream" }), meta: meta! };
}

/* ───────────── text ───────────── */

const b64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/\s+/g, "")), (c) => c.charCodeAt(0));

/** Encrypt a message into a Base64 string that can be pasted anywhere. */
export async function encryptText(text: string, password: string, iterations = ITERATIONS): Promise<string> {
  const blob = await encrypt(new Blob([text]), password, { name: "", type: "text/plain", size: text.length }, undefined, iterations);
  return b64(new Uint8Array(await blob.arrayBuffer()));
}

export async function decryptText(cipher: string, password: string): Promise<string> {
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = unb64(cipher.trim());
  } catch {
    throw new CryptError("not-encrypted");
  }
  const { blob } = await decrypt(new Blob([bytes]), password);
  return blob.text();
}

/** Rough password strength for the hint under the field: bits of entropy from length and character classes. */
export function passwordBits(p: string): number {
  if (!p) return 0;
  let pool = 0;
  if (/[a-z]/.test(p)) pool += 26;
  if (/[A-Z]/.test(p)) pool += 26;
  if (/[0-9]/.test(p)) pool += 10;
  if (/[а-яё]/.test(p)) pool += 33;
  if (/[А-ЯЁ]/.test(p)) pool += 33;
  if (/[^a-zA-Z0-9а-яёА-ЯЁ]/.test(p)) pool += 33;
  return Math.round([...p].length * Math.log2(Math.max(pool, 2)));
}
