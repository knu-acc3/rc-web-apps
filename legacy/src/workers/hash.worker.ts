/**
 * Streaming Chunked Hash Worker.
 * Processes files up to 4 GB in 2-4 MB chunks without main thread freezing.
 * Supports MD5, SHA-256, and CRC32 with live progress and throughput metrics.
 */

export interface HashTaskPayload {
  readonly taskId: string;
  readonly algorithm: 'MD5' | 'SHA-256' | 'CRC32';
  readonly streamOrBlob?: Blob | ReadableStream<Uint8Array>;
  readonly buffer?: ArrayBuffer;
  readonly chunkSize?: number;
}

// ──────────────── CRC32 Incremental ────────────────
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

class Crc32Stream {
  private crc = 0xffffffff;

  update(chunk: Uint8Array): void {
    for (let i = 0; i < chunk.length; i++) {
      this.crc = CRC32_TABLE[(this.crc ^ chunk[i]) & 0xff] ^ (this.crc >>> 8);
    }
  }

  digestHex(): string {
    return ((this.crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
  }
}

// ──────────────── MD5 Incremental ────────────────
const MD5_K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
}

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

class Md5Stream {
  private h0 = 0x67452301;
  private h1 = 0xefcdab89;
  private h2 = 0x98badcfe;
  private h3 = 0x10325476;
  private buffer = new Uint8Array(64);
  private bufferLen = 0;
  private totalBytes = 0;
  private mWords = new Uint32Array(16);

  private processBlock(block: Uint8Array, offset: number): void {
    for (let i = 0; i < 16; i++) {
      const idx = offset + i * 4;
      this.mWords[i] =
        block[idx] |
        (block[idx + 1] << 8) |
        (block[idx + 2] << 16) |
        (block[idx + 3] << 24);
    }

    let a = this.h0;
    let b = this.h1;
    let c = this.h2;
    let d = this.h3;

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
      const rot = a + f + MD5_K[i] + this.mWords[g];
      const shift = MD5_S[i];
      b = (b + ((rot << shift) | (rot >>> (32 - shift)))) >>> 0;
      a = temp;
    }

    this.h0 = (this.h0 + a) >>> 0;
    this.h1 = (this.h1 + b) >>> 0;
    this.h2 = (this.h2 + c) >>> 0;
    this.h3 = (this.h3 + d) >>> 0;
  }

  update(chunk: Uint8Array): void {
    this.totalBytes += chunk.length;
    let offset = 0;

    if (this.bufferLen > 0) {
      const needed = 64 - this.bufferLen;
      if (chunk.length >= needed) {
        this.buffer.set(chunk.subarray(0, needed), this.bufferLen);
        this.processBlock(this.buffer, 0);
        offset = needed;
        this.bufferLen = 0;
      } else {
        this.buffer.set(chunk, this.bufferLen);
        this.bufferLen += chunk.length;
        return;
      }
    }

    while (offset + 64 <= chunk.length) {
      this.processBlock(chunk, offset);
      offset += 64;
    }

    if (offset < chunk.length) {
      this.buffer.set(chunk.subarray(offset), 0);
      this.bufferLen = chunk.length - offset;
    }
  }

  digestHex(): string {
    const bitLen = BigInt(this.totalBytes) * 8n;
    // Padding
    const padLen = (this.bufferLen < 56) ? (56 - this.bufferLen) : (120 - this.bufferLen);
    const pad = new Uint8Array(padLen + 8);
    pad[0] = 0x80;
    for (let i = 0; i < 8; i++) {
      pad[padLen + i] = Number((bitLen >> BigInt(i * 8)) & 0xffn);
    }
    this.update(pad);

    const out = new Uint8Array(16);
    const view = new DataView(out.buffer);
    view.setUint32(0, this.h0, true);
    view.setUint32(4, this.h1, true);
    view.setUint32(8, this.h2, true);
    view.setUint32(12, this.h3, true);

    return Array.from(out, (b) => b.toString(16).padStart(2, '0')).join('');
  }
}

// ──────────────── SHA-256 Incremental ────────────────
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

class Sha256Stream {
  private h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  private buffer = new Uint8Array(64);
  private bufferLen = 0;
  private totalBytes = 0;
  private w = new Uint32Array(64);

  private processBlock(block: Uint8Array, offset: number): void {
    for (let i = 0; i < 16; i++) {
      const idx = offset + i * 4;
      this.w[i] = (block[idx] << 24) | (block[idx + 1] << 16) | (block[idx + 2] << 8) | block[idx + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(this.w[i - 15], 7) ^ rotr(this.w[i - 15], 18) ^ (this.w[i - 15] >>> 3);
      const s1 = rotr(this.w[i - 2], 17) ^ rotr(this.w[i - 2], 19) ^ (this.w[i - 2] >>> 10);
      this.w[i] = (this.w[i - 16] + s0 + this.w[i - 7] + s1) >>> 0;
    }

    let a = this.h[0];
    let b = this.h[1];
    let c = this.h[2];
    let d = this.h[3];
    let e = this.h[4];
    let f = this.h[5];
    let g = this.h[6];
    let hVal = this.h[7];

    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hVal + s1 + ch + SHA256_K[i] + this.w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      hVal = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    this.h[0] = (this.h[0] + a) >>> 0;
    this.h[1] = (this.h[1] + b) >>> 0;
    this.h[2] = (this.h[2] + c) >>> 0;
    this.h[3] = (this.h[3] + d) >>> 0;
    this.h[4] = (this.h[4] + e) >>> 0;
    this.h[5] = (this.h[5] + f) >>> 0;
    this.h[6] = (this.h[6] + g) >>> 0;
    this.h[7] = (this.h[7] + hVal) >>> 0;
  }

  update(chunk: Uint8Array): void {
    this.totalBytes += chunk.length;
    let offset = 0;

    if (this.bufferLen > 0) {
      const needed = 64 - this.bufferLen;
      if (chunk.length >= needed) {
        this.buffer.set(chunk.subarray(0, needed), this.bufferLen);
        this.processBlock(this.buffer, 0);
        offset = needed;
        this.bufferLen = 0;
      } else {
        this.buffer.set(chunk, this.bufferLen);
        this.bufferLen += chunk.length;
        return;
      }
    }

    while (offset + 64 <= chunk.length) {
      this.processBlock(chunk, offset);
      offset += 64;
    }

    if (offset < chunk.length) {
      this.buffer.set(chunk.subarray(offset), 0);
      this.bufferLen = chunk.length - offset;
    }
  }

  digestHex(): string {
    const bitLen = BigInt(this.totalBytes) * 8n;
    const padLen = (this.bufferLen < 56) ? (56 - this.bufferLen) : (120 - this.bufferLen);
    const pad = new Uint8Array(padLen + 8);
    pad[0] = 0x80;
    for (let i = 0; i < 8; i++) {
      pad[padLen + (7 - i)] = Number((bitLen >> BigInt(i * 8)) & 0xffn);
    }
    this.update(pad);

    const out = new Uint8Array(32);
    const view = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) {
      view.setUint32(i * 4, this.h[i], false);
    }
    return Array.from(out, (b) => b.toString(16).padStart(2, '0')).join('');
  }
}

// ──────────────── Message Handler ────────────────
self.onmessage = async (event: MessageEvent<HashTaskPayload>) => {
  const { taskId, algorithm, streamOrBlob, buffer, chunkSize = 2 * 1024 * 1024 } = event.data;

  const hasher =
    algorithm === 'MD5'
      ? new Md5Stream()
      : algorithm === 'CRC32'
        ? new Crc32Stream()
        : new Sha256Stream();

  const startTime = Date.now();
  let processedBytes = 0;

  try {
    if (buffer) {
      const u8 = new Uint8Array(buffer);
      hasher.update(u8);
      processedBytes = u8.byteLength;
    } else if (streamOrBlob) {
      const totalSize = (streamOrBlob instanceof Blob) ? streamOrBlob.size : 0;

      if (streamOrBlob instanceof Blob) {
        let offset = 0;
        while (offset < totalSize) {
          const slice = streamOrBlob.slice(offset, offset + chunkSize);
          const chunkBuffer = await slice.arrayBuffer();
          const chunk = new Uint8Array(chunkBuffer);
          hasher.update(chunk);

          offset += chunk.byteLength;
          processedBytes = offset;

          const elapsedSec = Math.max(0.001, (Date.now() - startTime) / 1000);
          const throughputMBs = (processedBytes / (1024 * 1024)) / elapsedSec;
          const progress = totalSize > 0 ? Math.min(100, Math.round((processedBytes / totalSize) * 100)) : 50;

          self.postMessage({
            type: 'HASH_PROGRESS',
            taskId,
            progress,
            processedBytes,
            totalBytes: totalSize,
            throughputMBs: Number(throughputMBs.toFixed(1)),
          });
        }
      } else {
        const reader = streamOrBlob.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            hasher.update(value);
            processedBytes += value.byteLength;

            const elapsedSec = Math.max(0.001, (Date.now() - startTime) / 1000);
            const throughputMBs = (processedBytes / (1024 * 1024)) / elapsedSec;

            self.postMessage({
              type: 'HASH_PROGRESS',
              taskId,
              progress: 50,
              processedBytes,
              throughputMBs: Number(throughputMBs.toFixed(1)),
            });
          }
        }
      }
    }

    const elapsedMs = Date.now() - startTime;
    const finalHash = hasher.digestHex();
    const throughputMBs = processedBytes > 0 ? (processedBytes / (1024 * 1024)) / Math.max(0.001, elapsedMs / 1000) : 0;

    self.postMessage({
      taskId,
      success: true,
      result: {
        hash: finalHash,
        algorithm,
        processedBytes,
        elapsedMs,
        throughputMBs: Number(throughputMBs.toFixed(1)),
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Hash calculation failed';
    self.postMessage({ taskId, success: false, error });
  }
};
