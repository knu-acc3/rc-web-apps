// Crypto-secure random helpers using window.crypto.getRandomValues.
// Falls back to Math.random in SSR (no DOM access there, user can't see output).

const hasCrypto = (): boolean =>
  typeof globalThis !== 'undefined' && !!(globalThis as { crypto?: { getRandomValues?: unknown } }).crypto?.getRandomValues;

export function cryptoFloat(): number {
  if (!hasCrypto()) return Math.random();
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x1_0000_0000;
}

// Unbiased integer in [0, max). Uses rejection sampling.
export function cryptoRandomInt(max: number): number {
  if (max <= 0) return 0;
  if (!hasCrypto()) return Math.floor(Math.random() * max);
  if (max > 0xffffffff) return Math.floor(cryptoFloat() * max);
  const range = 0x1_0000_0000 - (0x1_0000_0000 % max);
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= range);
  return buf[0] % max;
}

// Inclusive integer in [min, max].
export function cryptoIntBetween(min: number, max: number): number {
  return min + cryptoRandomInt(max - min + 1);
}

export function cryptoBool(): boolean {
  if (!hasCrypto()) return Math.random() < 0.5;
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] & 1) === 1;
}

export function cryptoPick<T>(arr: readonly T[]): T {
  return arr[cryptoRandomInt(arr.length)];
}

// Fisher–Yates with crypto.
export function cryptoShuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
