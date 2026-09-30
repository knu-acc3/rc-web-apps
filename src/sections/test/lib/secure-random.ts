/** Fills the array with random 32-bit values (crypto.getRandomValues by default). */
export type RandomFill = (buf: Uint32Array) => Uint32Array;

const cryptoFill: RandomFill = (buf) => crypto.getRandomValues(buf);

/**
 * Uniform random integer in [min, max] (both inclusive) from a CSPRNG,
 * using rejection sampling so no value is favoured by modulo bias.
 */
export function randomInt(min: number, max: number, fill: RandomFill = cryptoFill): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) throw new RangeError(`Invalid range ${min}..${max}`);
  const range = max - min + 1;
  if (range > 2 ** 32) throw new RangeError("Range too large");
  const limit = Math.floor(2 ** 32 / range) * range;
  const buf = new Uint32Array(1);
  for (;;) {
    fill(buf);
    if (buf[0] < limit) return min + (buf[0] % range);
  }
}

/** Random index into an array of `length` items. */
export function randomIndex(length: number, fill?: RandomFill): number {
  return randomInt(0, Math.max(0, length - 1), fill);
}
