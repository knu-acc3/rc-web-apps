/** Cryptographically secure randomness helpers (crypto.getRandomValues only). */

export type Rng = (n: number) => Uint8Array;

export const cryptoRng: Rng = (n) => {
  const out = new Uint8Array(n);
  // getRandomValues is limited to 65 536 bytes per call
  for (let i = 0; i < n; i += 65536) crypto.getRandomValues(out.subarray(i, Math.min(n, i + 65536)));
  return out;
};

