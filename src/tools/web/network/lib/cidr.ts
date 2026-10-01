/* Range ↔ CIDR conversion for IPv4 (bits = 32) and IPv6 (bits = 128) using BigInt. */

interface Block {
  start: bigint;
  prefix: number;
}

/** Minimal list of CIDR blocks that exactly covers [start, end]. */
export function rangeToCidrs(start: bigint, end: bigint, bits: 32 | 128, limit = 4096): Block[] {
  if (end < start) [start, end] = [end, start];
  const out: Block[] = [];
  const B = BigInt(bits);
  let cur = start;
  while (cur <= end && out.length < limit) {
    // largest block aligned at `cur`
    let size = cur === 0n ? 1n << B : cur & -cur;
    while (cur + size - 1n > end) size >>= 1n;
    let k = 0;
    while (1n << BigInt(k) < size) k++;
    out.push({ start: cur, prefix: bits - k });
    cur += size;
  }
  return out;
}

export function cidrRange(start: bigint, prefix: number, bits: 32 | 128): { first: bigint; last: bigint; count: bigint } {
  const hostBits = BigInt(bits - prefix);
  const all = (1n << BigInt(bits)) - 1n;
  const mask = (all >> hostBits) << hostBits;
  const first = start & mask;
  const count = 1n << hostBits;
  return { first, last: first + count - 1n, count };
}
