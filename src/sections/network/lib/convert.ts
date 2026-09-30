/* Parse an IPv4 address written in any common notation. */
import { parseIPv4 } from "./ipv4";
import { isV4Mapped, parseIPv6 } from "./ipv6";

export type Notation = "dotted" | "integer" | "hex" | "binary" | "mapped";
export type ConvError = "empty" | "unknown" | "range" | "not-mapped";

export function parseAnyV4(input: string): { ok: true; value: number; from: Notation } | { ok: false; error: ConvError } {
  const s = input.trim().replace(/\s+/g, "");
  if (!s) return { ok: false, error: "empty" };
  if (s.includes(":")) {
    const r = parseIPv6(s);
    if (!r.ok) return { ok: false, error: "unknown" };
    if (!isV4Mapped(r.value.value)) return { ok: false, error: "not-mapped" };
    return { ok: true, value: Number(r.value.value & 0xffffffffn), from: "mapped" };
  }
  if (/^[01]{8}(\.[01]{8}){3}$/.test(s) || /^[01]{32}$/.test(s)) return { ok: true, value: parseInt(s.replace(/\./g, ""), 2) >>> 0, from: "binary" };
  if (/^0x[0-9a-f]{1,8}$/i.test(s)) return { ok: true, value: parseInt(s.slice(2), 16) >>> 0, from: "hex" };
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isSafeInteger(n) || n > 0xffffffff) return { ok: false, error: "range" };
    return { ok: true, value: n >>> 0, from: "integer" };
  }
  if (/^[0-9a-f]{8}$/i.test(s)) return { ok: true, value: parseInt(s, 16) >>> 0, from: "hex" };
  const d = parseIPv4(s);
  if (d.ok) return { ok: true, value: d.value, from: "dotted" };
  return { ok: false, error: "unknown" };
}
