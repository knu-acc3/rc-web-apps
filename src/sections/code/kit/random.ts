/** Cryptographically secure randomness helpers (crypto.getRandomValues only). */

export type Rng = (n: number) => Uint8Array;

export const cryptoRng: Rng = (n) => {
  const out = new Uint8Array(n);
  // getRandomValues is limited to 65 536 bytes per call
  for (let i = 0; i < n; i += 65536) crypto.getRandomValues(out.subarray(i, Math.min(n, i + 65536)));
  return out;
};

/** Uniform integer in [0, max) without modulo bias (rejection sampling on 32-bit words). */
export function randomInt(max: number, rng: Rng = cryptoRng): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError("max out of range");
  const limit = Math.floor(2 ** 32 / max) * max;
  for (;;) {
    const b = rng(4);
    const v = ((b[0] << 24) >>> 0) + (b[1] << 16) + (b[2] << 8) + b[3];
    if (v < limit) return v % max;
  }
}
