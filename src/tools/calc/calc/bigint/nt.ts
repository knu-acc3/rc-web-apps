/** Number theory on BigInt: GCD/LCM with steps, Miller–Rabin, Pollard rho, factorials, combinatorics. */

export const babs = (a: bigint) => (a < 0n ? -a : a);

interface EuclidStep {
  a: bigint;
  b: bigint;
  q: bigint;
  r: bigint;
}

/** Euclid's algorithm with every division step: a = b·q + r. */
export function gcdSteps(a0: bigint, b0: bigint): { gcd: bigint; steps: EuclidStep[] } {
  let a = babs(a0);
  let b = babs(b0);
  if (a < b) [a, b] = [b, a];
  const steps: EuclidStep[] = [];
  while (b !== 0n) {
    const q = a / b;
    const r = a % b;
    steps.push({ a, b, q, r });
    [a, b] = [b, r];
  }
  return { gcd: a, steps };
}

export function gcd(a: bigint, b: bigint): bigint {
  a = babs(a);
  b = babs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export const lcm = (a: bigint, b: bigint) => (a === 0n || b === 0n ? 0n : babs((a / gcd(a, b)) * b));
export const gcdMany = (xs: bigint[]) => xs.reduce((g, x) => gcd(g, x), 0n);
export const lcmMany = (xs: bigint[]) => (xs.length ? xs.reduce((l, x) => lcm(l, x), 1n) : 0n);

/** Parse a list of integers separated by spaces, new lines, commas or semicolons (integers have no decimal comma). */
export function parseIntList(text: string): { values: bigint[]; invalid: string[] } {
  const values: bigint[] = [];
  const invalid: string[] = [];
  for (const tok of text.split(/[\s,;]+/).filter(Boolean)) {
    const t = tok.replace(/[−–]/g, "-");
    if (/^[-+]?\d{1,4000}$/.test(t)) values.push(BigInt(t));
    else invalid.push(tok);
  }
  return { values, invalid };
}

/* ───────────── primality ───────────── */

function modpow(base: bigint, exp: bigint, mod: bigint): bigint {
  let r = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return r;
}

const SMALL_PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n, 73n, 79n, 83n, 89n, 97n];
/** These 12 bases make Miller–Rabin deterministic for every n < 3.3·10²⁴ (in particular all 64-bit numbers). */
const DETERMINISTIC_BASES = SMALL_PRIMES.slice(0, 12);
export const DETERMINISTIC_LIMIT = 3317044064679887385961981n;

function mrWitness(n: bigint, a: bigint, d: bigint, s: number): boolean {
  let x = modpow(a, d, n);
  if (x === 1n || x === n - 1n) return false;
  for (let i = 1; i < s; i++) {
    x = (x * x) % n;
    if (x === n - 1n) return false;
  }
  return true; // a proves n composite
}

/** Miller–Rabin. Deterministic below DETERMINISTIC_LIMIT; above it uses 25 prime bases (error < 4⁻²⁵). */
export function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  const bases = n < DETERMINISTIC_LIMIT ? DETERMINISTIC_BASES : SMALL_PRIMES;
  for (const a of bases) if (mrWitness(n, a, d, s)) return false;
  return true;
}

export function nextPrime(n: bigint): bigint {
  let x = n < 2n ? 2n : n + 1n;
  if (x > 2n && x % 2n === 0n) x++;
  while (!isPrime(x)) x += x === 2n ? 1n : 2n;
  return x;
}

export function prevPrime(n: bigint): bigint | null {
  if (n <= 2n) return null;
  let x = n - 1n;
  if (x > 2n && x % 2n === 0n) x--;
  while (x >= 2n && !isPrime(x)) x -= x === 3n ? 1n : 2n;
  return x >= 2n ? x : null;
}

/* ───────────── factorization ───────────── */

function rho(n: bigint, c: bigint): bigint {
  // Brent's variant of Pollard's rho with batched gcds
  if (n % 2n === 0n) return 2n;
  let y = 2n;
  let r = 1;
  let q = 1n;
  let g = 1n;
  let x = 0n;
  let ys = 0n;
  const f = (v: bigint) => (v * v + c) % n;
  const m = 128;
  do {
    x = y;
    for (let i = 0; i < r; i++) y = f(y);
    let k = 0;
    do {
      ys = y;
      for (let i = 0; i < Math.min(m, r - k); i++) {
        y = f(y);
        q = (q * babs(x - y)) % n;
      }
      g = gcd(q, n);
      k += m;
    } while (k < r && g === 1n);
    r *= 2;
    if (r > 1 << 26) return n;
  } while (g === 1n);
  if (g === n) {
    do {
      ys = f(ys);
      g = gcd(babs(x - ys), n);
    } while (g === 1n);
  }
  return g;
}

/** Prime factorization as [prime, exponent] pairs in increasing order. */
export function factorize(n0: bigint): [bigint, number][] {
  let n = babs(n0);
  const out = new Map<bigint, number>();
  const push = (p: bigint) => out.set(p, (out.get(p) ?? 0) + 1);
  if (n < 2n) return [];
  for (let p = 2n; p < 1000n && p * p <= n; p += p === 2n ? 1n : 2n) {
    while (n % p === 0n) {
      push(p);
      n /= p;
    }
  }
  const stack = n > 1n ? [n] : [];
  while (stack.length) {
    const m = stack.pop()!;
    if (m === 1n) continue;
    if (isPrime(m)) {
      push(m);
      continue;
    }
    let d = m;
    for (let c = 1n; d === m; c++) d = rho(m, c);
    stack.push(d, m / d);
  }
  return [...out.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/** Sieve of Eratosthenes: all primes ≤ limit. */
export function sieve(limit: number): number[] {
  const n = Math.max(0, Math.floor(limit));
  const composite = new Uint8Array(n + 1);
  const out: number[] = [];
  for (let i = 2; i <= n; i++) {
    if (composite[i]) continue;
    out.push(i);
    for (let j = i * i; j <= n; j += i) composite[j] = 1;
  }
  return out;
}

/* ───────────── factorials & combinatorics ───────────── */

function prodRange(a: bigint, b: bigint): bigint {
  // product of integers in [a, b] by binary splitting (fast for large n)
  if (a > b) return 1n;
  if (a === b) return a;
  if (b - a < 16n) {
    let r = 1n;
    for (let i = a; i <= b; i++) r *= i;
    return r;
  }
  const mid = (a + b) / 2n;
  return prodRange(a, mid) * prodRange(mid + 1n, b);
}

export const factorial = (n: number) => prodRange(1n, BigInt(Math.max(0, Math.floor(n))));

/** n!! = n·(n−2)·(n−4)… */
export function doubleFactorial(n: number): bigint {
  let r = 1n;
  for (let i = BigInt(n); i > 1n; i -= 2n) r *= i;
  return r;
}

/** Number of decimal digits of n! (exact for n ≤ 1, otherwise via ln Γ — accurate to the digit). */
export function factorialDigits(n: number): number {
  if (n < 2) return 1;
  // Kamenetsky's formula
  const x = n * Math.log10(n / Math.E) + Math.log10(2 * Math.PI * n) / 2;
  return Math.floor(x) + 1;
}

/** Trailing zeros of n! = Σ floor(n / 5ᵏ). */
export function factorialZeros(n: number): number {
  let z = 0;
  for (let p = 5; p <= n; p *= 5) z += Math.floor(n / p);
  return z;
}

export function nPr(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  return prodRange(BigInt(n - r + 1), BigInt(n));
}

export function nCr(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  const k = Math.min(r, n - r);
  let res = 1n;
  for (let i = 1; i <= k; i++) res = (res * BigInt(n - k + i)) / BigInt(i);
  return res;
}

/** Permutations with repetition: n^r. */
export const withRepetition = (n: number, r: number) => BigInt(n) ** BigInt(r);
/** Combinations with repetition: C(n + r − 1, r). */
export const multichoose = (n: number, r: number) => (n === 0 && r === 0 ? 1n : nCr(n + r - 1, r));
/** Permutations of a multiset: n! / (k₁!·k₂!·…). */
export function multiset(counts: number[]): bigint {
  const n = counts.reduce((a, b) => a + b, 0);
  return counts.reduce((acc, k) => acc / factorial(k), factorial(n));
}
