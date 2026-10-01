import { describe, expect, it } from "vitest";
import {
  factorial,
  factorialDigits,
  factorialZeros,
  factorize,
  gcd,
  gcdMany,
  gcdSteps,
  isPrime,
  lcmMany,
  multichoose,
  multiset,
  nCr,
  nextPrime,
  nPr,
  parseIntList,
  prevPrime,
  sieve,
  withRepetition,
} from "@/tools/calc/calc/bigint/nt";

describe("GCD and LCM", () => {
  it("reference values", () => {
    expect(gcd(48n, 180n)).toBe(12n);
    expect(lcmMany([4n, 6n, 10n])).toBe(60n);
    expect(gcdMany([84n, 126n, 210n])).toBe(42n);
    expect(gcdMany([0n, 5n])).toBe(5n);
  });
  it("Euclid steps", () => {
    const r = gcdSteps(180n, 48n);
    expect(r.gcd).toBe(12n);
    expect(r.steps.map((s) => [s.a, s.b, s.q, s.r])).toEqual([
      [180n, 48n, 3n, 36n],
      [48n, 36n, 1n, 12n],
      [36n, 12n, 3n, 0n],
    ]);
  });
  it("huge integers", () => {
    const a = 2n ** 200n * 3n ** 50n;
    const b = 2n ** 150n * 5n ** 20n;
    expect(gcd(a, b)).toBe(2n ** 150n);
  });
  it("parses integer lists", () => {
    expect(parseIntList("12, 18; 24\n30").values).toEqual([12n, 18n, 24n, 30n]);
    expect(parseIntList("12 x 4").invalid).toEqual(["x"]);
  });
});

describe("Miller–Rabin", () => {
  it("primes", () => {
    for (const p of [2n, 3n, 97n, 7919n, 2147483647n, 1000000007n, 18446744073709551557n, 2305843009213693951n]) expect(isPrime(p)).toBe(true);
  });
  it("composites including strong pseudoprimes", () => {
    for (const c of [0n, 1n, 561n, 1105n, 3215031751n, 3825123056546413051n, 18446744073709551615n, 1000000007n * 998244353n]) expect(isPrime(c)).toBe(false);
  });
  it("next and previous prime", () => {
    expect(nextPrime(100n)).toBe(101n);
    expect(prevPrime(100n)).toBe(97n);
    expect(prevPrime(2n)).toBeNull();
    expect(nextPrime(1n)).toBe(2n);
  });
});

describe("factorization and sieve", () => {
  it("factorizes", () => {
    expect(factorize(600851475143n)).toEqual([
      [71n, 1],
      [839n, 1],
      [1471n, 1],
      [6857n, 1],
    ]);
    expect(factorize(360n)).toEqual([
      [2n, 3],
      [3n, 2],
      [5n, 1],
    ]);
    expect(factorize(1000000007n * 998244353n)).toEqual([
      [998244353n, 1],
      [1000000007n, 1],
    ]);
    expect(factorize(1n)).toEqual([]);
  });
  it("sieve", () => {
    expect(sieve(30)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    expect(sieve(1_000_000).length).toBe(78498);
  });
});

describe("factorials and combinatorics", () => {
  it("factorials", () => {
    expect(factorial(10)).toBe(3628800n);
    expect(factorial(20)).toBe(2432902008176640000n);
    expect(factorial(0)).toBe(1n);
    expect(factorial(100).toString().length).toBe(158);
    expect(factorialDigits(100)).toBe(158);
    expect(factorialDigits(1000)).toBe(2568);
    expect(factorial(1000).toString().length).toBe(2568);
    expect(factorialZeros(100)).toBe(24);
    expect(factorialZeros(1000)).toBe(249);
  });
  it("combinatorics", () => {
    expect(nCr(52, 5)).toBe(2598960n);
    expect(nPr(10, 3)).toBe(720n);
    expect(multichoose(5, 3)).toBe(35n);
    expect(withRepetition(10, 4)).toBe(10000n);
    expect(multiset([1, 4, 4, 2])).toBe(34650n); // MISSISSIPPI: 11! / (1!·4!·4!·2!)
    expect(nCr(5, 7)).toBe(0n);
  });
});
