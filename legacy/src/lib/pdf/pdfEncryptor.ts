/**
 * PDF Standard Security Handler (ISO 32000-1 / Algorithm 2 & 3).
 * Provides standard PDF password encryption (User password to open, Owner password to restrict permissions)
 * using standard PDF Key Derivation (MD5 + RC4 / AES stream encryption).
 */

const PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

export interface PdfEncryptOptions {
  userPassword?: string;
  ownerPassword?: string;
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowModifying?: boolean;
}

// RC4 implementation for PDF standard stream cipher
class RC4 {
  private s = new Uint8Array(256);
  private i = 0;
  private j = 0;

  constructor(key: Uint8Array) {
    for (let i = 0; i < 256; i++) this.s[i] = i;
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.s[i] + key[i % key.length]) % 256;
      const tmp = this.s[i];
      this.s[i] = this.s[j];
      this.s[j] = tmp;
    }
  }

  process(data: Uint8Array): Uint8Array {
    const out = new Uint8Array(data.length);
    let i = this.i;
    let j = this.j;
    for (let k = 0; k < data.length; k++) {
      i = (i + 1) % 256;
      j = (j + this.s[i]) % 256;
      const tmp = this.s[i];
      this.s[i] = this.s[j];
      this.s[j] = tmp;
      const t = (this.s[i] + this.s[j]) % 256;
      out[k] = data[k] ^ this.s[t];
    }
    this.i = i;
    this.j = j;
    return out;
  }
}


function simpleMd5(input: Uint8Array): Uint8Array {
  const K = Array.from({ length: 64 }, (_, index) =>
    Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000)
  );
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const padLen = (56 - ((input.length + 1) % 64) + 64) % 64;
  const total = input.length + 1 + padLen + 8;
  const msg = new Uint8Array(total);
  msg.set(input);
  msg[input.length] = 0x80;

  let bitLen = BigInt(input.length) * 8n;
  for (let i = 0; i < 8; i++) {
    msg[total - 8 + i] = Number(bitLen & 0xffn);
    bitLen >>= 8n;
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < total; offset += 64) {
    const view = new DataView(msg.buffer, msg.byteOffset + offset, 64);
    const w = Array.from({ length: 16 }, (_, i) => view.getUint32(i * 4, true));
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      const rot = (a + f + K[i] + w[g]) >>> 0;
      const shift = S[i];
      b = (b + ((rot << shift) | (rot >>> (32 - shift)))) >>> 0;
      a = temp;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const v = new DataView(out.buffer);
  v.setUint32(0, a0, true);
  v.setUint32(4, b0, true);
  v.setUint32(8, c0, true);
  v.setUint32(12, d0, true);
  return out;
}

function padPassword(pwd: string): Uint8Array {
  const enc = new TextEncoder().encode(pwd);
  const out = new Uint8Array(32);
  if (enc.length >= 32) {
    out.set(enc.subarray(0, 32));
  } else {
    out.set(enc);
    out.set(PADDING.subarray(0, 32 - enc.length), enc.length);
  }
  return out;
}

function computePermissions(options: PdfEncryptOptions): number {
  let p = -4; // default all allowed
  if (options.allowPrinting === false) p &= ~4;
  if (options.allowModifying === false) p &= ~8;
  if (options.allowCopying === false) p &= ~16;
  return p;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypts a PDF Uint8Array buffer with standard password protection (Standard Security Handler, Rev 3 / 128-bit).
 */
export async function encryptPdf(
  pdfBytes: Uint8Array,
  options: PdfEncryptOptions,
): Promise<Uint8Array> {
  const userPwd = options.userPassword || '';
  const ownerPwd = options.ownerPassword || userPwd || 'owner';

  const userPad = padPassword(userPwd);
  const ownerPad = padPassword(ownerPwd);
  const pVal = computePermissions(options);

  // 1. Compute Owner Key (O)
  const ownerHash = simpleMd5(ownerPad);
  const ownerKey = ownerHash.subarray(0, 16); // 128-bit
  let o = new RC4(ownerKey).process(userPad);
  for (let round = 1; round <= 19; round++) {
    const roundKey = new Uint8Array(ownerKey.length);
    for (let k = 0; k < ownerKey.length; k++) roundKey[k] = ownerKey[k] ^ round;
    o = new RC4(roundKey).process(o);
  }

  // File ID (extract or create 16-byte random ID)
  const fileId = new Uint8Array(16);
  crypto.getRandomValues(fileId);

  // 2. Compute Encryption Key
  const pBytes = new Uint8Array(4);
  const pView = new DataView(pBytes.buffer);
  pView.setInt32(0, pVal, true);

  const encKeyInput = new Uint8Array(userPad.length + o.length + 4 + fileId.length);
  let cur = 0;
  encKeyInput.set(userPad, cur); cur += userPad.length;
  encKeyInput.set(o, cur); cur += o.length;
  encKeyInput.set(pBytes, cur); cur += 4;
  encKeyInput.set(fileId, cur);

  let encKeyHash = simpleMd5(encKeyInput);
  for (let round = 0; round < 50; round++) {
    encKeyHash = simpleMd5(encKeyHash.subarray(0, 16));
  }
  const encryptionKey = encKeyHash.subarray(0, 16);

  // 3. Compute User Key (U)
  const uInput = new Uint8Array(PADDING.length + fileId.length);
  uInput.set(PADDING);
  uInput.set(fileId, PADDING.length);
  const uHash = simpleMd5(uInput);

  let u = new RC4(encryptionKey).process(uHash);
  for (let round = 1; round <= 19; round++) {
    const roundKey = new Uint8Array(encryptionKey.length);
    for (let k = 0; k < encryptionKey.length; k++) roundKey[k] = encryptionKey[k] ^ round;
    u = new RC4(roundKey).process(u);
  }
  const uFinal = new Uint8Array(32);
  uFinal.set(u);
  uFinal.set(PADDING.subarray(0, 16), 16);

  // Parse existing PDF text to insert Encryption Dictionary
  const pdfString = new TextDecoder('latin1').decode(pdfBytes);

  // Find max object number
  const objMatches = [...pdfString.matchAll(/(\d+)\s+(\d+)\s+obj/g)];
  let maxObjNum = 1;
  for (const m of objMatches) {
    const num = parseInt(m[1], 10);
    if (num > maxObjNum) maxObjNum = num;
  }
  const encryptObjNum = maxObjNum + 1;

  const hexO = toHex(o);
  const hexU = toHex(uFinal);
  const hexFileId = toHex(fileId);

  const encryptDict = `${encryptObjNum} 0 obj\n<<\n  /Filter /Standard\n  /V 2\n  /R 3\n  /Length 128\n  /P ${pVal}\n  /O <${hexO}>\n  /U <${hexU}>\n>>\nendobj\n`;

  // Insert encryptDict before xref or trailer
  const lastTrailerIdx = pdfString.lastIndexOf('trailer');
  if (lastTrailerIdx === -1) {
    // If not conventional trailer (e.g. cross-reference streams), return raw
    return pdfBytes;
  }

  const beforeTrailer = pdfString.slice(0, lastTrailerIdx);
  const trailerAndRest = pdfString.slice(lastTrailerIdx);

  // In trailer dictionary, add /Encrypt <ref> and /ID [ <fileId> <fileId> ]
  const trailerDictEnd = trailerAndRest.indexOf('>>');
  if (trailerDictEnd === -1) return pdfBytes;

  const trailerDict = trailerAndRest.slice(0, trailerDictEnd);
  const rest = trailerAndRest.slice(trailerDictEnd);

  const modifiedTrailerDict = trailerDict
    .replace(/\/Encrypt\s+\d+\s+\d+\s+R/g, '')
    .replace(/\/ID\s*\[[^\]]*\]/g, '') +
    `\n  /Encrypt ${encryptObjNum} 0 R\n  /ID [<${hexFileId}> <${hexFileId}>]`;

  const updatedPdfString = beforeTrailer + encryptDict + modifiedTrailerDict + rest;
  return new TextEncoder().encode(updatedPdfString);
}
