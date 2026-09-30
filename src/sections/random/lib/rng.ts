/**
 * Unbiased randomness for the whole site, built on `crypto.getRandomValues`.
 *
 * - Never falls back to `Math.random`: if the Web Crypto API is missing, every
 *   function throws.
 * - Integers use rejection sampling, so there is no modulo bias for any range.
 * - The byte source is injectable (`setRandomSource`) so the rejection logic can
 *   be unit-tested deterministically.
 *
 * Call these only in event handlers / effects — never during render (SSR).
 */

/** Fills the given buffer with random bytes. */
export type RandomSource = (buf: Uint8Array) => void;

const MAX_CHUNK = 65536; // getRandomValues limit per call

const cryptoSource: RandomSource = (buf) => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("crypto.getRandomValues is not available: secure randomness is required");
  }
  for (let i = 0; i < buf.length; i += MAX_CHUNK) c.getRandomValues(buf.subarray(i, Math.min(buf.length, i + MAX_CHUNK)));
};

let source: RandomSource = cryptoSource;

/**
 * Replace the byte source (for tests). `null` restores `crypto.getRandomValues`.
 * The source is asked for exactly the bytes each call consumes (4 per 32-bit draw).
 */
export function setRandomSource(fn: RandomSource | null): void {
  source = fn ?? cryptoSource;
}

/** `n` random bytes. */
export function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  source(buf);
  return buf;
}

const u32buf = new Uint8Array(4);

/** Uniform integer in [0, 2^32). Bytes are read big-endian. */
export function randomUint32(): number {
  source(u32buf);
  return ((u32buf[0] << 24) | (u32buf[1] << 16) | (u32buf[2] << 8) | u32buf[3]) >>> 0;
}

const TWO_32 = 0x1_0000_0000;
const TWO_53 = 2 ** 53;

/**
 * Smallest value that is rejected by 32-bit rejection sampling for `m`:
 * the largest multiple of `m` that fits into 2^32. Draws `x < limit` are accepted
 * and mapped with `x % m`, so every residue has exactly `limit / m` pre-images.
 */
export function rejectionLimit32(m: number): number {
  return TWO_32 - (TWO_32 % m);
}

/**
 * Uniform integer in [0, maxExclusive) for any integer 1 ≤ maxExclusive ≤ 2^53.
 * Ranges up to 2^32 use 32-bit rejection sampling; larger ranges use `randomBigInt`.
 */
export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > TWO_53) {
    throw new RangeError(`randomInt: maxExclusive must be an integer in [1, 2^53], got ${maxExclusive}`);
  }
  if (maxExclusive === 1) return 0;
  if (maxExclusive <= TWO_32) {
    const limit = rejectionLimit32(maxExclusive);
    for (;;) {
      const x = randomUint32();
      if (x < limit) return x % maxExclusive;
    }
  }
  return Number(randomBigInt(BigInt(maxExclusive)));
}

/**
 * Uniform bigint in [0, maxExclusive). Draws exactly bitLength(maxExclusive − 1)
 * random bits (masking the top byte) and rejects values ≥ maxExclusive, so each
 * attempt succeeds with probability > 1/2.
 */
export function randomBigInt(maxExclusive: bigint): bigint {
  if (typeof maxExclusive !== "bigint" || maxExclusive < 1n) throw new RangeError("randomBigInt: maxExclusive must be a bigint ≥ 1");
  if (maxExclusive === 1n) return 0n;
  const bits = (maxExclusive - 1n).toString(2).length;
  const bytes = Math.ceil(bits / 8);
  const topMask = 0xff >>> (bytes * 8 - bits);
  const buf = new Uint8Array(bytes);
  for (;;) {
    source(buf);
    buf[0] &= topMask;
    let x = 0n;
    for (let i = 0; i < bytes; i++) x = (x << 8n) | BigInt(buf[i]);
    if (x < maxExclusive) return x;
  }
}

/** Uniform integer in [min, max] (both inclusive, safe integers, span ≤ 2^53). */
export function randomIntBetween(min: number, max: number): number {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min) {
    throw new RangeError(`randomIntBetween: invalid range [${min}, ${max}]`);
  }
  const span = BigInt(max) - BigInt(min) + 1n;
  if (span > BigInt(TWO_53)) throw new RangeError("randomIntBetween: range is wider than 2^53");
  return min + randomInt(Number(span));
}

/** Uniform float in [0, 1) with 53 random bits (every multiple of 2^-53 is equally likely). */
export function randomFloat(): number {
  const hi = randomUint32() >>> 11; // 21 bits
  const lo = randomUint32(); // 32 bits
  return (hi * TWO_32 + lo) / TWO_53;
}

/** Fair coin. */
export function randomBool(): boolean {
  return randomInt(2) === 1;
}

/** Uniformly random element. Throws on an empty array. */
export function pick<T>(a: readonly T[]): T {
  if (a.length === 0) throw new RangeError("pick: empty array");
  return a[randomInt(a.length)];
}

/** Fisher–Yates shuffle; returns a new array, the input is not modified. */
export function shuffle<T>(a: readonly T[]): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * `k` distinct indices from [0, n), uniformly (order is random too).
 * Sparse Fisher–Yates: O(k) time and memory, so n may be huge (up to 2^53).
 */
export function sampleIndices(n: number, k: number): number[] {
  if (!Number.isInteger(n) || n < 0 || n > TWO_53) throw new RangeError("sampleIndices: bad n");
  if (!Number.isInteger(k) || k < 0 || k > n) throw new RangeError("sampleIndices: k must be in [0, n]");
  const swapped = new Map<number, number>();
  const out: number[] = new Array(k);
  for (let i = 0; i < k; i++) {
    const j = i + randomInt(n - i);
    const vi = swapped.get(i) ?? i;
    const vj = swapped.get(j) ?? j;
    swapped.set(j, vi);
    out[i] = vj;
  }
  return out;
}

/** `k` elements without replacement (uniform; the result order is random). */
export function sample<T>(a: readonly T[], k: number): T[] {
  return sampleIndices(a.length, k).map((i) => a[i]);
}

/**
 * Index chosen with probability weights[i] / sum(weights).
 *
 * - Integer weights (sum ≤ 2^53): exact — `randomInt(sum)` picks a unit and the
 *   cumulative sums map it to an index.
 * - Non-integer weights: `randomFloat() × sum`, i.e. exact up to floating-point
 *   rounding of the cumulative sums (relative error ≈ 2^-53). Scale decimal
 *   weights to integers first if you need exactness.
 * Zero weights are never returned. Throws if a weight is negative/non-finite or
 * all weights are zero.
 */
export function pickWeighted(weights: readonly number[]): number {
  let total = 0;
  let integers = true;
  let lastPositive = -1;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (!Number.isFinite(w) || w < 0) throw new RangeError(`pickWeighted: invalid weight ${w}`);
    if (!Number.isInteger(w)) integers = false;
    if (w > 0) lastPositive = i;
    total += w;
  }
  if (lastPositive < 0 || !(total > 0)) throw new RangeError("pickWeighted: all weights are zero");
  if (integers && total <= TWO_53) {
    let r = randomInt(total);
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) return i;
      r -= weights[i];
    }
    return lastPositive; // unreachable
  }
  const r = randomFloat() * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] === 0) continue;
    acc += weights[i];
    if (r < acc) return i;
  }
  return lastPositive; // rounding at the very top end
}
