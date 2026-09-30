import { describe, expect, it } from "vitest";
import { WORDS_EN } from "@/sections/password/data/words-en";
import { translit, WORDS_RU } from "@/sections/password/data/words-ru";
import {
  AMBIGUOUS,
  classesOf,
  countWithEach,
  generateMemorable,
  generatePassphrase,
  generatePassword,
  generatePin,
  log2Big,
  memorableEntropy,
  passphraseEntropy,
  passwordEntropy,
  randomInt,
  shuffle,
  toBase64,
  type PasswordOptions,
  type RandomSource,
} from "@/sections/password/engine";

/** Deterministic xorshift source for tests. */
function seeded(seed = 123456789): RandomSource {
  let x = seed >>> 0;
  return (buf) => {
    for (let i = 0; i < buf.length; i++) {
      x ^= x << 13;
      x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;
      x >>>= 0;
      buf[i] = x;
    }
    return buf;
  };
}

/** Source that replays fixed values (to exercise rejection). */
function fixed(values: number[]): RandomSource {
  let i = 0;
  return (buf) => {
    for (let k = 0; k < buf.length; k++) buf[k] = values[i++ % values.length];
    return buf;
  };
}

const ALL: PasswordOptions = { length: 16, lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false, requireEach: true };

describe("randomness", () => {
  it("rejection sampling stays in range and rejects the biased tail", () => {
    const rng = seeded();
    for (let i = 0; i < 2000; i++) {
      const v = randomInt(94, rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(94);
    }
    // 2^32 − 1 is above the largest multiple of 10 below 2^32, so it must be rejected; the next value (7) is used
    expect(randomInt(10, fixed([0xffffffff, 7]))).toBe(7);
  });

  it("is roughly uniform", () => {
    const rng = seeded(42);
    const counts = Array(6).fill(0);
    for (let i = 0; i < 60000; i++) counts[randomInt(6, rng)]++;
    for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(500);
  });

  it("shuffle keeps elements", () => {
    const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8], seeded(7));
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("passwords", () => {
  it("contains every selected class and respects length", () => {
    const rng = seeded(99);
    const classes = classesOf(ALL);
    for (let i = 0; i < 200; i++) {
      const p = generatePassword({ ...ALL, length: 8 }, rng);
      expect(p).toHaveLength(8);
      for (const cls of classes) expect([...p].some((c) => cls.includes(c))).toBe(true);
    }
  });

  it("excludes ambiguous characters", () => {
    const rng = seeded(5);
    for (let i = 0; i < 100; i++) {
      const p = generatePassword({ ...ALL, length: 32, excludeAmbiguous: true }, rng);
      for (const c of AMBIGUOUS) expect(p.includes(c)).toBe(false);
    }
  });

  it("uses custom symbols only", () => {
    const p = generatePassword({ ...ALL, lower: false, upper: false, digits: false, symbolSet: "#$", length: 20 }, seeded(3));
    expect(p).toMatch(/^[#$]+$/);
  });

  it("computes exact entropy", () => {
    // 16 chars from 94 without the class requirement: 16·log2(94) ≈ 104.87 bits
    expect(passwordEntropy({ ...ALL, requireEach: false })).toBeCloseTo(104.87, 2);
    // requiring every class removes a little: still ~104.6 bits, never more than the upper bound
    const e = passwordEntropy(ALL);
    expect(e).toBeLessThan(104.87);
    expect(e).toBeGreaterThan(104.5);
    // lower+digits, length 2, both required: 26·10·2 = 520 strings
    expect(countWithEach([26, 10], 2)).toBe(520n);
    expect(log2Big(1n << 200n)).toBeCloseTo(200, 9);
  });

  it("PIN digits", () => {
    const p = generatePin(6, seeded(1));
    expect(p).toMatch(/^\d{6}$/);
  });
});

describe("passphrases and keys", () => {
  it("word lists are large, unique and clean", () => {
    expect(WORDS_EN.length).toBeGreaterThanOrEqual(1296);
    expect(WORDS_RU.length).toBeGreaterThanOrEqual(1296);
    expect(new Set(WORDS_EN).size).toBe(WORDS_EN.length);
    expect(new Set(WORDS_RU).size).toBe(WORDS_RU.length);
    for (const w of WORDS_EN) expect(w).toMatch(/^[a-z]{2,12}$/);
    for (const w of WORDS_RU) expect(w).toMatch(/^[а-я]{2,16}$/);
    // transliteration must stay unique so Latin passphrases keep the same entropy
    expect(new Set(WORDS_RU.map(translit)).size).toBe(WORDS_RU.length);
  });

  it("passphrase entropy", () => {
    const o = { words: 5, separator: "-", capitalize: false, addDigit: false };
    expect(passphraseEntropy(7776, o)).toBeCloseTo(64.62, 2);
    const p = generatePassphrase(WORDS_EN, o, seeded(8));
    expect(p.split("-")).toHaveLength(5);
    const withDigit = generatePassphrase(WORDS_EN, { ...o, addDigit: true, capitalize: true }, seeded(8));
    expect(withDigit).toMatch(/\d/);
    expect(withDigit[0]).toMatch(/[A-Z]/);
  });

  it("memorable passwords", () => {
    const o = { words: 3, syllables: 3, digits: 2, separator: "-", capitalize: true };
    const p = generateMemorable(o, seeded(2));
    expect(p).toMatch(/^[A-Z][a-z]{5}-[A-Z][a-z]{5}-[A-Z][a-z]{5}-\d{2}$/);
    expect(memorableEntropy(o)).toBeCloseTo(9 * Math.log2(80) + 2 * Math.log2(10), 6);
  });

  it("base64 encodings", () => {
    const bytes = new Uint8Array([251, 255, 0]);
    expect(toBase64(bytes)).toBe("+/8A");
    expect(toBase64(bytes, true)).toBe("-_8A");
  });
});
