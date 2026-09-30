import { afterEach, describe, expect, it } from "vitest";
import {
  pickWeighted,
  randomBigInt,
  randomFloat,
  randomInt,
  randomIntBetween,
  randomUint32,
  rejectionLimit32,
  sample,
  sampleIndices,
  setRandomSource,
  shuffle,
} from "@/sections/random/lib/rng";

/** Pearson chi-square statistic against a uniform expectation. */
function chiSquare(counts: number[], total: number): number {
  const e = total / counts.length;
  return counts.reduce((s, c) => s + ((c - e) * (c - e)) / e, 0);
}

/** Byte source that serves the given 32-bit words (big-endian) and records how many were used. */
function wordSource(words: number[]) {
  const state = { used: 0 };
  setRandomSource((buf) => {
    for (let i = 0; i < buf.length; i += 4) {
      if (state.used >= words.length) throw new Error("source exhausted");
      const w = words[state.used++] >>> 0;
      buf[i] = (w >>> 24) & 255;
      if (i + 1 < buf.length) buf[i + 1] = (w >>> 16) & 255;
      if (i + 2 < buf.length) buf[i + 2] = (w >>> 8) & 255;
      if (i + 3 < buf.length) buf[i + 3] = w & 255;
    }
  });
  return state;
}

/** Byte source serving raw bytes. */
function byteSource(bytes: number[]) {
  const state = { used: 0 };
  setRandomSource((buf) => {
    for (let i = 0; i < buf.length; i++) {
      if (state.used >= bytes.length) throw new Error("source exhausted");
      buf[i] = bytes[state.used++];
    }
  });
  return state;
}

afterEach(() => setRandomSource(null));

// Critical values with a false-failure probability of ~1e-7 (df = 5: 40, df = 9: 50).
const CHI_DF5 = 40;
const CHI_DF9 = 50;

describe("rng: distribution sanity (real crypto)", () => {
  it("randomInt(6) is uniform over 60 000 draws", () => {
    const counts = new Array(6).fill(0);
    for (let i = 0; i < 60000; i++) counts[randomInt(6)]++;
    expect(chiSquare(counts, 60000)).toBeLessThan(CHI_DF5);
  });

  it("randomInt(10) is uniform over 60 000 draws", () => {
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 60000; i++) counts[randomInt(10)]++;
    expect(chiSquare(counts, 60000)).toBeLessThan(CHI_DF9);
  });

  it("randomIntBetween stays in range, including negatives", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = randomIntBetween(-3, 3);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    expect(seen.size).toBe(7);
    expect(() => randomIntBetween(5, 4)).toThrow(RangeError);
  });

  it("rejects invalid ranges instead of silently misbehaving", () => {
    expect(() => randomInt(0)).toThrow(RangeError);
    expect(() => randomInt(1.5)).toThrow(RangeError);
    expect(() => randomInt(2 ** 53 + 2)).toThrow(RangeError);
    expect(randomInt(1)).toBe(0);
  });
});

describe("rng: no modulo bias (injected bytes)", () => {
  it("computes the 32-bit rejection threshold as the largest multiple of m", () => {
    expect(rejectionLimit32(6)).toBe(4294967292); // 2^32 mod 6 = 4
    expect(rejectionLimit32(10)).toBe(4294967290); // 2^32 mod 10 = 6
    expect(rejectionLimit32(2 ** 32)).toBe(2 ** 32);
    expect(rejectionLimit32(3 * 2 ** 30)).toBe(3 * 2 ** 30);
  });

  it("rejects draws at and above the threshold and uses the next word", () => {
    // 0xFFFFFFFF and 4294967292 (= threshold) are rejected; 4294967291 is accepted.
    const st = wordSource([0xffffffff, 4294967292, 4294967291]);
    expect(randomInt(6)).toBe(4294967291 % 6);
    expect(st.used).toBe(3);
  });

  it("accepts the largest value below the threshold on the first try", () => {
    const st = wordSource([4294967289]); // threshold for 10 is 4294967290
    expect(randomInt(10)).toBe(9);
    expect(st.used).toBe(1);
  });

  it("maps accepted words by plain modulo (every residue has equal pre-images)", () => {
    wordSource([0, 1, 5, 6, 11]);
    expect([randomInt(6), randomInt(6), randomInt(6), randomInt(6), randomInt(6)]).toEqual([0, 1, 5, 0, 5]);
  });

  it("randomUint32 reads bytes big-endian", () => {
    byteSource([0x12, 0x34, 0x56, 0x78]);
    expect(randomUint32()).toBe(0x12345678);
  });
});

describe("rng: BigInt path for ranges above 2^32", () => {
  it("randomBigInt masks to the minimal bit length and rejects out-of-range values", () => {
    // max = 5 → values 0..4, 3 bits, 1 byte. 0xFF → masked to 7 (reject), 0x05 → 5 (reject), 0x03 → 3.
    const st = byteSource([0xff, 0x05, 0x03]);
    expect(randomBigInt(5n)).toBe(3n);
    expect(st.used).toBe(3);
  });

  it("randomBigInt uses exactly ceil(bits/8) bytes per attempt", () => {
    // 2^40 + 1 values → max index 2^40 needs 41 bits → 6 bytes; top byte masked to 1 bit.
    // Attempt 1: 0xff → 1 → 2^40 + 7 (rejected). Attempt 2: 0xfe → 0 → 9 (accepted).
    const st = byteSource([0xff, 0, 0, 0, 0, 7, 0xfe, 0, 0, 0, 0, 9]);
    expect(randomBigInt(2n ** 40n + 1n)).toBe(9n);
    expect(st.used).toBe(12);
  });

  it("randomInt switches to the BigInt path just above 2^32", () => {
    // 2^32 + 1 values → 33 bits → 5 bytes. 2^32 + 1 is rejected, 2^32 accepted.
    const st = byteSource([1, 0, 0, 0, 1, 1, 0, 0, 0, 0]);
    expect(randomInt(2 ** 32 + 1)).toBe(2 ** 32);
    expect(st.used).toBe(10);
  });

  it("randomInt above 2^32 stays in range and is roughly uniform", () => {
    const m = 3 * 2 ** 40; // > 2^32
    const buckets = new Array(6).fill(0);
    for (let i = 0; i < 12000; i++) {
      const v = randomInt(m);
      expect(Number.isSafeInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(m);
      buckets[Math.floor(v / (m / 6))]++;
    }
    expect(chiSquare(buckets, 12000)).toBeLessThan(CHI_DF5);
  });

  it("supports the full 2^53 range", () => {
    for (let i = 0; i < 200; i++) {
      const v = randomInt(2 ** 53);
      expect(Number.isSafeInteger(v)).toBe(true);
    }
  });

  it("randomIntBetween covers ranges wider than 2^32", () => {
    const lo = -(2 ** 40);
    const hi = 2 ** 40;
    let neg = 0;
    for (let i = 0; i < 2000; i++) {
      const v = randomIntBetween(lo, hi);
      expect(v >= lo && v <= hi).toBe(true);
      if (v < 0) neg++;
    }
    expect(neg).toBeGreaterThan(800);
    expect(neg).toBeLessThan(1200);
  });
});

describe("rng: randomFloat", () => {
  it("is in [0, 1) with 53-bit granularity", () => {
    let odd = 0;
    for (let i = 0; i < 5000; i++) {
      const x = randomFloat();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      const k = x * 2 ** 53;
      expect(Number.isInteger(k)).toBe(true);
      if (k % 2 === 1) odd++;
    }
    // The lowest of the 53 bits is random too (a 32-bit float would always be even here).
    expect(odd).toBeGreaterThan(2000);
    expect(odd).toBeLessThan(3000);
  });

  it("maps all-ones bits to the largest double below 1 and zeros to 0", () => {
    wordSource([0xffffffff, 0xffffffff]);
    expect(randomFloat()).toBe((2 ** 53 - 1) / 2 ** 53);
    wordSource([0, 0]);
    expect(randomFloat()).toBe(0);
  });
});

describe("rng: shuffle, sample, weighted pick", () => {
  it("shuffle of 3 items gives all 6 permutations uniformly", () => {
    const counts = new Map<string, number>();
    const N = 60000;
    for (let i = 0; i < N; i++) {
      const k = shuffle(["a", "b", "c"]).join("");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    expect(chiSquare([...counts.values()], N)).toBeLessThan(CHI_DF5);
  });

  it("shuffle returns a copy and keeps the multiset", () => {
    const a = [1, 2, 3, 4, 5, 5];
    const s = shuffle(a);
    expect(a).toEqual([1, 2, 3, 4, 5, 5]);
    expect([...s].sort()).toEqual([...a].sort());
  });

  it("sample returns distinct elements without replacement", () => {
    const src = Array.from({ length: 50 }, (_, i) => i);
    for (let t = 0; t < 200; t++) {
      const s = sample(src, 20);
      expect(new Set(s).size).toBe(20);
      for (const v of s) expect(src).toContain(v);
    }
    expect(sample(src, 50).sort((x, y) => x - y)).toEqual(src);
    expect(() => sample(src, 51)).toThrow(RangeError);
  });

  it("sampleIndices works on huge ranges and each index is equally likely", () => {
    const big = sampleIndices(2 ** 50, 5);
    expect(new Set(big).size).toBe(5);
    const counts = new Array(10).fill(0);
    for (let t = 0; t < 20000; t++) for (const i of sampleIndices(10, 3)) counts[i]++;
    expect(chiSquare(counts, 60000)).toBeLessThan(CHI_DF9);
  });

  it("pickWeighted matches integer weight proportions", () => {
    const w = [1, 2, 3, 0, 4];
    const counts = new Array(5).fill(0);
    const N = 60000;
    for (let i = 0; i < N; i++) counts[pickWeighted(w)]++;
    expect(counts[3]).toBe(0);
    const expected = [0.1, 0.2, 0.3, 0.4].map((p) => p * N);
    const observed = [counts[0], counts[1], counts[2], counts[4]];
    const chi = observed.reduce((s, o, i) => s + (o - expected[i]) ** 2 / expected[i], 0);
    expect(chi).toBeLessThan(35); // df = 3, p ≈ 1e-7
  });

  it("pickWeighted is exact for integer weights (maps units via randomInt(sum))", () => {
    // sum = 6 → randomInt(6) reads one word; word 3 → unit 3 → weights [1,2,3]: units 0 | 1-2 | 3-5 → index 2
    wordSource([3]);
    expect(pickWeighted([1, 2, 3])).toBe(2);
    wordSource([0]);
    expect(pickWeighted([0, 2, 3])).toBe(1);
  });

  it("pickWeighted handles fractional weights and rejects bad input", () => {
    const counts = [0, 0];
    for (let i = 0; i < 20000; i++) counts[pickWeighted([0.25, 0.75])]++;
    expect(counts[0] / 20000).toBeGreaterThan(0.23);
    expect(counts[0] / 20000).toBeLessThan(0.27);
    expect(() => pickWeighted([0, 0])).toThrow(RangeError);
    expect(() => pickWeighted([1, -1])).toThrow(RangeError);
    expect(() => pickWeighted([])).toThrow(RangeError);
  });
});

describe("rng: no silent fallback", () => {
  it("throws when the byte source is unavailable instead of using Math.random", () => {
    setRandomSource(() => {
      throw new Error("crypto.getRandomValues is not available");
    });
    expect(() => randomInt(6)).toThrow(/not available/);
  });
});
