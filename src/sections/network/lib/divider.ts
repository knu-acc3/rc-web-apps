/* Split an IPv4 network into equal subnets or by host requirements (VLSM). */
import { rangeToCidrs } from "./cidr";
import { maskOf, type Cidr4 } from "./ipv4";

export type DivideError = "too-many" | "no-fit" | "bad-count" | "bad-hosts";

export interface EqualSplit {
  newPrefix: number;
  subnets: Cidr4[];
  /** 2^k blocks created (≥ requested) */
  created: number;
}

export function splitEqual(net: Cidr4, count: number, limit = 1024): { ok: true; value: EqualSplit } | { ok: false; error: DivideError } {
  if (!Number.isInteger(count) || count < 1) return { ok: false, error: "bad-count" };
  let k = 0;
  while (2 ** k < count) k++;
  const newPrefix = net.prefix + k;
  if (newPrefix > 32) return { ok: false, error: "too-many" };
  const size = 2 ** (32 - newPrefix);
  const base = (net.network & maskOf(net.prefix)) >>> 0;
  const created = 2 ** k;
  const subnets: Cidr4[] = [];
  for (let i = 0; i < Math.min(created, limit); i++) subnets.push({ network: (base + i * size) >>> 0, prefix: newPrefix });
  return { ok: true, value: { newPrefix, subnets, created } };
}

/** Block prefix that fits `hosts` usable addresses (network + broadcast reserved; 1 host → /32, 2 hosts → /30 unless p2p). */
export function prefixForHosts(hosts: number, pointToPoint = false): number | null {
  if (!Number.isInteger(hosts) || hosts < 1) return null;
  if (hosts === 1) return 32;
  if (hosts === 2 && pointToPoint) return 31;
  const need = hosts + 2;
  let k = 0;
  while (2 ** k < need) k++;
  return k > 32 ? null : 32 - k;
}

export interface VlsmItem {
  name: string;
  hosts: number;
  block: Cidr4;
  usable: number;
}

export interface VlsmResult {
  items: VlsmItem[];
  free: Cidr4[];
  used: number;
}

export function vlsm(net: Cidr4, reqs: { name: string; hosts: number }[], pointToPoint = false): { ok: true; value: VlsmResult } | { ok: false; error: DivideError; name?: string } {
  const base = (net.network & maskOf(net.prefix)) >>> 0;
  const end = base + 2 ** (32 - net.prefix); // exclusive
  const sorted = reqs
    .map((r, i) => ({ ...r, i, prefix: prefixForHosts(r.hosts, pointToPoint) }))
    .sort((a, b) => (a.prefix ?? 99) - (b.prefix ?? 99) || a.i - b.i);
  let cur = base;
  const items: VlsmItem[] = [];
  for (const r of sorted) {
    if (r.prefix === null) return { ok: false, error: "bad-hosts", name: r.name };
    const size = 2 ** (32 - r.prefix);
    // largest-first allocation keeps every block aligned; align defensively anyway
    cur = Math.ceil(cur / size) * size;
    if (cur + size > end || r.prefix < net.prefix) return { ok: false, error: "no-fit", name: r.name };
    const usable = r.prefix === 32 ? 1 : r.prefix === 31 ? 2 : size - 2;
    items.push({ name: r.name, hosts: r.hosts, block: { network: cur >>> 0, prefix: r.prefix }, usable });
    cur += size;
  }
  const free =
    cur < end
      ? rangeToCidrs(BigInt(cur), BigInt(end - 1), 32).map((b) => ({ network: Number(b.start), prefix: b.prefix }))
      : [];
  return { ok: true, value: { items, free, used: cur - base } };
}
