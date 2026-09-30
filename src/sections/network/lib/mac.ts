/* MAC-48 / EUI-48 parsing and formatting. No vendor (OUI) lookup on purpose. */

export type MacError = "empty" | "chars" | "length";

export function parseMac(input: string): { ok: true; bytes: number[] } | { ok: false; error: MacError } {
  const s = input.trim();
  if (!s) return { ok: false, error: "empty" };
  if (!/^[0-9a-fA-F:\-.\s]+$/.test(s)) return { ok: false, error: "chars" };
  const hex = s.replace(/[:\-.\s]/g, "");
  if (hex.length !== 12) return { ok: false, error: "length" };
  // separators must be consistent with a known layout
  const ok =
    /^[0-9a-f]{12}$/i.test(s) ||
    /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(s) ||
    /^([0-9a-f]{4}\.){2}[0-9a-f]{4}$/i.test(s) ||
    /^([0-9a-f]{2}\s){5}[0-9a-f]{2}$/i.test(s) ||
    /^[0-9a-f]{6}-[0-9a-f]{6}$/i.test(s);
  if (!ok) return { ok: false, error: "length" };
  const bytes: number[] = [];
  for (let i = 0; i < 12; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  return { ok: true, bytes };
}

const h2 = (b: number) => b.toString(16).padStart(2, "0");

export interface MacFormats {
  colon: string;
  hyphen: string;
  cisco: string;
  bare: string;
}

export function macFormats(bytes: number[], upper = false): MacFormats {
  const hs = bytes.map(h2);
  const f = (s: string) => (upper ? s.toUpperCase() : s);
  const bare = hs.join("");
  return {
    colon: f(hs.join(":")),
    hyphen: f(hs.join("-")),
    cisco: f(`${bare.slice(0, 4)}.${bare.slice(4, 8)}.${bare.slice(8)}`),
    bare: f(bare),
  };
}

export interface MacBits {
  /** I/G bit: 1 = group (multicast) address */
  multicast: boolean;
  /** U/L bit: 1 = locally administered */
  local: boolean;
  broadcast: boolean;
  zero: boolean;
  oui: string;
}

export function macBits(bytes: number[]): MacBits {
  return {
    multicast: (bytes[0] & 1) === 1,
    local: (bytes[0] & 2) === 2,
    broadcast: bytes.every((b) => b === 255),
    zero: bytes.every((b) => b === 0),
    oui: bytes.slice(0, 3).map(h2).join(":").toUpperCase(),
  };
}

/** Modified EUI-64 interface identifier (RFC 4291 App. A): insert FFFE and flip the U/L bit. */
export function eui64(bytes: number[]): string {
  const b = [bytes[0] ^ 2, bytes[1], bytes[2], 0xff, 0xfe, bytes[3], bytes[4], bytes[5]];
  const groups: string[] = [];
  for (let i = 0; i < 8; i += 2) groups.push(((b[i] << 8) | b[i + 1]).toString(16));
  return groups.join(":");
}

export function linkLocalFromMac(bytes: number[]): string {
  return `fe80::${eui64(bytes)}`;
}
