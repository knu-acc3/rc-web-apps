/**
 * Text codecs: Base64, URL, binary/octal/decimal/hex, Base32, Base58, Base85,
 * Unicode escapes, JSON escape, quoted-printable, ROT13/ROT47, Caesar, Atbash.
 * Pure functions (no DOM) — used on the server (SSR of presets), in the browser and in the worker.
 */
import { Base64Error, base64ToBytes, bytesToBase64, utf8Encode } from "@/sections/code/kit/bytes";
import { fail, ok, type Codec, type CodecResult, type Opts } from "./types";

/** Decode bytes as UTF-8; invalid sequences → keep bytes for a hex view / download. */
function bytesResult(b: Uint8Array, charset = "utf-8"): CodecResult {
  try {
    return ok(new TextDecoder(charset, { fatal: charset === "utf-8" }).decode(b));
  } catch {
    return { text: "", bytes: b, error: { code: "notUtf8" } };
  }
}

/* ───────────── Base64 ───────────── */

function wrapLines(s: string, width: number): string {
  if (!width) return s;
  const out: string[] = [];
  for (let i = 0; i < s.length; i += width) out.push(s.slice(i, i + width));
  return out.join("\n");
}

export const base64: Codec = {
  encode(input, o) {
    const urlSafe = !!o.urlSafe;
    const s = bytesToBase64(utf8Encode(input), { urlSafe, pad: o.pad === undefined ? !urlSafe : !!o.pad });
    return ok(wrapLines(s, o.wrap ? 76 : 0));
  },
  decode(input) {
    try {
      return bytesResult(base64ToBytes(input.replace(/^data:[^,]*;base64,/i, "")));
    } catch (e) {
      if (e instanceof Base64Error) return fail(e.message.startsWith("Invalid character") ? "b64.char" : e.message === "Invalid length" ? "b64.length" : "b64.padding", e.index, e.index !== undefined ? input[e.index] : undefined);
      return fail("b64.length");
    }
  },
};

/* ───────────── URL ───────────── */

/** Index of the first unpaired UTF-16 surrogate, or -1. */
function loneSurrogate(s: string): number {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = s.charCodeAt(i + 1);
      if (n >= 0xdc00 && n <= 0xdfff) i++;
      else return i;
    } else if (c >= 0xdc00 && c <= 0xdfff) return i;
  }
  return -1;
}

const FORM_SAFE = /[A-Za-z0-9*\-._]/;

export const url: Codec = {
  encode(input, o) {
    const mode = (o.mode as string) ?? "component";
    // lone surrogates can't be encoded
    const bad = loneSurrogate(input);
    if (bad >= 0) return fail("url.surrogate", bad);
    if (mode === "uri") return ok(encodeURI(input));
    if (mode === "form") {
      let out = "";
      for (const b of utf8Encode(input)) {
        const c = String.fromCharCode(b);
        out += b === 0x20 ? "+" : b < 0x80 && FORM_SAFE.test(c) ? c : `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
      }
      return ok(out);
    }
    return ok(encodeURIComponent(input));
  },
  decode(input, o) {
    const s = o.plus ? input.replace(/\+/g, " ") : input;
    let out = "";
    let i = 0;
    while (i < s.length) {
      if (s[i] !== "%") {
        out += s[i++];
        continue;
      }
      const start = i;
      const bytes: number[] = [];
      while (i < s.length && s[i] === "%") {
        const hex = s.slice(i + 1, i + 3);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) return fail("url.percent", i, s.slice(i, i + 3));
        bytes.push(parseInt(hex, 16));
        i += 3;
      }
      try {
        out += new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
      } catch {
        return fail("url.utf8", start, s.slice(start, i));
      }
    }
    return ok(out);
  },
};

/* ───────────── binary / octal / decimal / hex text ───────────── */

const WIDTH: Record<number, number> = { 2: 8, 8: 3, 10: 3, 16: 2 };
const PREFIX: Record<number, string> = { 2: "0b", 8: "0o", 10: "", 16: "0x" };

/** Text → UTF-8 bytes → numbers in `base`, grouped by `group` bytes (0 = no separator). */
export function textToBase(input: string, base: 2 | 8 | 10 | 16, o: Opts = {}): string {
  const bytes = utf8Encode(input);
  const sep = o.sep === undefined ? " " : String(o.sep);
  const group = o.group === undefined ? 1 : Number(o.group);
  const pad = o.pad !== false;
  const prefix = o.prefix ? PREFIX[base] : "";
  const parts: string[] = [];
  let cur = "";
  for (let i = 0; i < bytes.length; i++) {
    let d = bytes[i].toString(base);
    if (pad || group !== 1 || !sep) d = d.padStart(WIDTH[base], "0");
    if (base === 16 && o.upper) d = d.toUpperCase();
    cur += d;
    if (group > 0 && (i + 1) % group === 0) {
      parts.push(prefix + cur);
      cur = "";
    }
  }
  if (cur) parts.push(prefix + cur);
  return group > 0 ? parts.join(sep || "") : prefix + parts.join("");
}

/** Numbers → bytes → UTF-8 text. Tolerates prefixes (0x, 0b, \x), any separators, missing zeros. */
export function baseToText(input: string, base: 2 | 8 | 10 | 16, charset = "utf-8"): CodecResult {
  if (!input.trim()) return ok("");
  // prefixes are blanked with spaces of the same length so error positions stay exact
  const prefix = base === 16 ? /0x|\\x|%/gi : base === 2 ? /0b/gi : base === 8 ? /0o/gi : null;
  const s = prefix ? input.replace(prefix, (m) => " ".repeat(m.length)) : input;
  const digit = base === 16 ? /[0-9a-f]/i : base === 2 ? /[01]/ : base === 8 ? /[0-7]/ : /[0-9]/;
  const sep = /[\s,;:.|_-]/;
  for (let i = 0; i < s.length; i++) if (!digit.test(s[i]) && !sep.test(s[i])) return fail("num.char", i, s[i]);
  const w = WIDTH[base];
  const bytes: number[] = [];
  for (const tok of s.split(/[\s,;:.|_-]+/).filter(Boolean)) {
    if (tok.length > w) {
      // packed digits without separators: split into fixed-width bytes
      if (base === 10) return fail("num.decimalSep");
      if (tok.length % w !== 0) return fail("num.width", undefined, String(w));
      for (let i = 0; i < tok.length; i += w) bytes.push(parseInt(tok.slice(i, i + w), base));
    } else bytes.push(parseInt(tok, base));
  }
  for (const b of bytes) if (b > 255) return fail("num.range", undefined, b.toString(base));
  return bytesResult(new Uint8Array(bytes), charset);
}

export const numberCodec = (base: 2 | 8 | 10 | 16): Codec => ({
  encode: (input, o) => ok(textToBase(input, base, o)),
  decode: (input, o) => baseToText(input, base, (o.charset as string) || "utf-8"),
});

/* ───────────── Base32 ───────────── */

const B32 = {
  rfc4648: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  hex: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
  crockford: "0123456789ABCDEFGHJKMNPQRSTVWXYZ",
} as const;
type Base32Variant = keyof typeof B32;

export function base32Encode(bytes: Uint8Array, variant: Base32Variant = "rfc4648", pad = variant !== "crockford"): string {
  const alpha = B32[variant];
  let out = "";
  let acc = 0;
  let bits = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alpha[(acc >> bits) & 31];
    }
    acc &= (1 << bits) - 1;
  }
  if (bits > 0) out += alpha[(acc << (5 - bits)) & 31];
  if (pad) while (out.length % 8) out += "=";
  return out;
}

export function base32Decode(input: string, variant: Base32Variant = "rfc4648"): Uint8Array {
  let s = input.replace(/[\s=]/g, "").toUpperCase();
  if (variant === "crockford") s = s.replace(/-/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  const alpha = B32[variant];
  const out: number[] = [];
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < s.length; i++) {
    const v = alpha.indexOf(s[i]);
    if (v < 0) throw Object.assign(new Error("char"), { index: i, char: s[i] });
    acc = (acc << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
    acc &= (1 << bits) - 1;
  }
  return new Uint8Array(out);
}

export const base32: Codec = {
  encode: (input, o) => ok(base32Encode(utf8Encode(input), ((o.variant as Base32Variant) || "rfc4648"), o.pad !== false && o.variant !== "crockford")),
  decode(input, o) {
    try {
      return bytesResult(base32Decode(input, (o.variant as Base32Variant) || "rfc4648"));
    } catch (e) {
      const x = e as { index?: number; char?: string };
      return fail("b32.char", x.index, x.char);
    }
  },
};

/* ───────────── Base58 (Bitcoin alphabet) ───────────── */

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_MAX = 20000;

export function base58Encode(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]];
  return out;
}

export function base58Decode(input: string): Uint8Array {
  const s = input.trim();
  let zeros = 0;
  while (zeros < s.length && s[zeros] === "1") zeros++;
  const bytes: number[] = [];
  for (let i = zeros; i < s.length; i++) {
    const v = B58.indexOf(s[i]);
    if (v < 0) throw Object.assign(new Error("char"), { index: i, char: s[i] });
    let carry = v;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  const out = new Uint8Array(zeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) out[zeros + i] = bytes[bytes.length - 1 - i];
  return out;
}

export const base58: Codec = {
  encode(input) {
    const b = utf8Encode(input);
    if (b.length > BASE58_MAX) return fail("tooLong", undefined, String(BASE58_MAX));
    return ok(base58Encode(b));
  },
  decode(input) {
    if (input.length > BASE58_MAX * 1.4) return fail("tooLong", undefined, String(BASE58_MAX));
    try {
      return bytesResult(base58Decode(input));
    } catch (e) {
      const x = e as { index?: number; char?: string };
      return fail("b58.char", x.index, x.char);
    }
  },
};

/* ───────────── Base85: Ascii85 (Adobe) and Z85 (ZeroMQ) ───────────── */

const Z85 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#";

export function ascii85Encode(bytes: Uint8Array, delimiters = true): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 4) {
    const n = Math.min(4, bytes.length - i);
    let v = 0;
    for (let j = 0; j < 4; j++) v = v * 256 + (j < n ? bytes[i + j] : 0);
    if (v === 0 && n === 4) {
      out += "z";
      continue;
    }
    const chunk: string[] = [];
    for (let j = 0; j < 5; j++) {
      chunk.unshift(String.fromCharCode((v % 85) + 33));
      v = Math.floor(v / 85);
    }
    out += chunk.slice(0, n + 1).join("");
  }
  return delimiters ? `<~${out}~>` : out;
}

export function ascii85Decode(input: string): Uint8Array {
  let s = input.replace(/\s/g, "");
  if (s.startsWith("<~")) s = s.slice(2);
  if (s.endsWith("~>")) s = s.slice(0, -2);
  const out: number[] = [];
  let group: number[] = [];
  const flush = (len: number) => {
    let v = 0;
    for (let j = 0; j < 5; j++) v = v * 85 + (j < group.length ? group[j] : 84);
    if (v > 0xffffffff) throw Object.assign(new Error("overflow"), { index: -1 });
    const b = [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
    out.push(...b.slice(0, len));
    group = [];
  };
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (s[i] === "z" && group.length === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    if (c < 33 || c > 117) throw Object.assign(new Error("char"), { index: i, char: s[i] });
    group.push(c - 33);
    if (group.length === 5) flush(4);
  }
  if (group.length === 1) throw Object.assign(new Error("length"), { index: s.length - 1 });
  if (group.length) flush(group.length - 1);
  return new Uint8Array(out);
}

export function z85Encode(bytes: Uint8Array): string {
  if (bytes.length % 4) throw new Error("length");
  let out = "";
  for (let i = 0; i < bytes.length; i += 4) {
    let v = ((bytes[i] << 24) >>> 0) + (bytes[i + 1] << 16) + (bytes[i + 2] << 8) + bytes[i + 3];
    const chunk: string[] = [];
    for (let j = 0; j < 5; j++) {
      chunk.unshift(Z85[v % 85]);
      v = Math.floor(v / 85);
    }
    out += chunk.join("");
  }
  return out;
}

export function z85Decode(input: string): Uint8Array {
  const s = input.replace(/\s/g, "");
  if (s.length % 5) throw Object.assign(new Error("length"), { index: s.length });
  const out = new Uint8Array((s.length / 5) * 4);
  for (let i = 0, o = 0; i < s.length; i += 5, o += 4) {
    let v = 0;
    for (let j = 0; j < 5; j++) {
      const d = Z85.indexOf(s[i + j]);
      if (d < 0) throw Object.assign(new Error("char"), { index: i + j, char: s[i + j] });
      v = v * 85 + d;
    }
    if (v > 0xffffffff) throw Object.assign(new Error("overflow"), { index: i });
    out[o] = (v >>> 24) & 0xff;
    out[o + 1] = (v >>> 16) & 0xff;
    out[o + 2] = (v >>> 8) & 0xff;
    out[o + 3] = v & 0xff;
  }
  return out;
}

export const base85: Codec = {
  encode(input, o) {
    const b = utf8Encode(input);
    if (o.variant === "z85") {
      if (b.length % 4) return fail("z85.length", undefined, String(b.length));
      return ok(z85Encode(b));
    }
    return ok(ascii85Encode(b, o.delimiters !== false));
  },
  decode(input, o) {
    try {
      return bytesResult(o.variant === "z85" ? z85Decode(input) : ascii85Decode(input));
    } catch (e) {
      const x = e as Error & { index?: number; char?: string };
      return fail(x.message === "char" ? "b85.char" : x.message === "overflow" ? "b85.overflow" : "b85.length", x.index !== undefined && x.index >= 0 ? x.index : undefined, x.char);
    }
  },
};

/* ───────────── Unicode escapes ───────────── */

type EscapeStyle = "js" | "es6" | "html" | "css" | "python" | "uplus";

function escapeCp(cp: number, style: EscapeStyle): string {
  const hex = cp.toString(16).toUpperCase();
  switch (style) {
    case "es6":
      return `\\u{${hex}}`;
    case "html":
      return `&#x${hex};`;
    case "css":
      return `\\${hex} `;
    case "python":
      return cp > 0xffff ? `\\U${hex.padStart(8, "0")}` : `\\u${hex.padStart(4, "0")}`;
    case "uplus":
      return `U+${hex.padStart(4, "0")}`;
    default:
      if (cp > 0xffff) {
        const v = cp - 0x10000;
        return `\\u${(0xd800 + (v >> 10)).toString(16).toUpperCase()}\\u${(0xdc00 + (v & 0x3ff)).toString(16).toUpperCase()}`;
      }
      return `\\u${hex.padStart(4, "0")}`;
  }
}

export const unicode: Codec = {
  encode(input, o) {
    const style = ((o.style as EscapeStyle) || "js") as EscapeStyle;
    const all = !!o.all;
    const parts: string[] = [];
    for (const ch of input) {
      const cp = ch.codePointAt(0)!;
      parts.push(all || style === "uplus" || cp > 0x7e ? escapeCp(cp, style) : ch);
    }
    return ok(style === "uplus" ? parts.join(" ") : parts.join(""));
  },
  decode(input) {
    const re = /\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{8})|\\x([0-9a-fA-F]{2})|&#[xX]([0-9a-fA-F]+);?|&#(\d+);?|U\+([0-9a-fA-F]{4,6})\s?/g;
    const cps: number[] = [];
    let out = "";
    let last = 0;
    let m: RegExpExecArray | null;
    const flushSurrogates = () => {
      if (cps.length) {
        out += String.fromCharCode(...cps);
        cps.length = 0;
      }
    };
    while ((m = re.exec(input))) {
      if (m.index > last) {
        flushSurrogates();
        out += input.slice(last, m.index);
      }
      last = re.lastIndex;
      const hex = m[1] ?? m[3] ?? m[4] ?? m[5] ?? m[7];
      const cp = m[2] ? parseInt(m[2], 16) : m[6] ? parseInt(m[6], 10) : parseInt(hex!, 16);
      if (m[2]) {
        cps.push(cp); // may be half of a surrogate pair
        continue;
      }
      flushSurrogates();
      if (cp > 0x10ffff) return fail("uni.range", m.index, m[0]);
      out += String.fromCodePoint(cp);
    }
    flushSurrogates();
    out += input.slice(last);
    return ok(out);
  },
};

/* ───────────── JSON string escape ───────────── */

export const json: Codec = {
  encode(input, o) {
    let s = JSON.stringify(input);
    if (o.ascii) s = s.replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
    return ok(o.quotes === false ? s.slice(1, -1) : s);
  },
  decode(input) {
    let s = input.trim();
    const quoted = s.length >= 2 && s.startsWith('"') && s.endsWith('"');
    if (quoted) s = s.slice(1, -1);
    const off = quoted ? input.indexOf('"') + 1 : input.indexOf(s[0] ?? "");
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '"' && !quoted) {
        out += c;
        continue;
      }
      if (c === '"') return fail("json.quote", off + i);
      if (c !== "\\") {
        out += c;
        continue;
      }
      const n = s[++i];
      const map: Record<string, string> = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
      if (n in map) out += map[n];
      else if (n === "u") {
        const hex = s.slice(i + 1, i + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) return fail("json.u", off + i - 1, `\\u${hex}`);
        out += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else return fail("json.escape", off + i - 1, `\\${n ?? ""}`);
    }
    return ok(out);
  },
};

/* ───────────── Quoted-printable (RFC 2045) ───────────── */

export function qpEncode(input: string, lineBreak = "\n"): string {
  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const bytes = utf8Encode(line);
    let cur = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      const last = i === bytes.length - 1;
      let tok: string;
      if ((b >= 33 && b <= 126 && b !== 61) || ((b === 32 || b === 9) && !last)) tok = String.fromCharCode(b);
      else tok = `=${b.toString(16).toUpperCase().padStart(2, "0")}`;
      if (cur.length + tok.length > 75) {
        out.push(`${cur}=`);
        cur = "";
      }
      cur += tok;
    }
    out.push(cur);
  }
  // soft breaks are pushed as separate entries ending in "=", hard breaks between original lines
  return out.join(lineBreak);
}

export function qpDecode(input: string, charset = "utf-8"): CodecResult {
  const s = input.replace(/=[ \t]*\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "=" && /^[0-9A-Fa-f]{2}$/.test(s.slice(i + 1, i + 3))) {
      bytes.push(parseInt(s.slice(i + 1, i + 3), 16));
      i += 2;
    } else if (c === "\n" || c === "\r") bytes.push(c.charCodeAt(0));
    else {
      const enc = utf8Encode(c);
      for (const b of enc) bytes.push(b);
    }
  }
  return bytesResult(new Uint8Array(bytes), charset);
}

export const qp: Codec = {
  encode: (input) => ok(qpEncode(input)),
  decode: (input, o) => qpDecode(input, (o.charset as string) || "utf-8"),
};

/* ───────────── ROT13 / ROT47, Caesar, Atbash ───────────── */

export function rot13(s: string): string {
  return s.replace(/[A-Za-z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function rot47(s: string): string {
  return s.replace(/[!-~]/g, (c) => String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94)));
}

export const rot: Codec = {
  encode: (input, o) => ok(o.variant === "rot47" ? rot47(input) : rot13(input)),
  decode: (input, o) => ok(o.variant === "rot47" ? rot47(input) : rot13(input)),
};

export const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const CYRILLIC = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

function mapAlphabets(s: string, alphabets: string[], f: (index: number, size: number) => number): string {
  let out = "";
  for (const ch of s) {
    const up = ch.toUpperCase();
    let done = false;
    for (const a of alphabets) {
      const i = a.indexOf(up);
      if (i >= 0) {
        const r = a[f(i, a.length)];
        out += ch === up ? r : r.toLowerCase();
        done = true;
        break;
      }
    }
    if (!done) out += ch;
  }
  return out;
}

const alphabetsFor = (o: Opts) => (o.alphabet === "latin" ? [LATIN] : o.alphabet === "cyrillic" ? [CYRILLIC] : [LATIN, CYRILLIC]);

export function caesar(s: string, shift: number, alphabets: string[] = [LATIN, CYRILLIC]): string {
  return mapAlphabets(s, alphabets, (i, n) => (((i + shift) % n) + n) % n);
}

export function atbash(s: string, alphabets: string[] = [LATIN, CYRILLIC]): string {
  return mapAlphabets(s, alphabets, (i, n) => n - 1 - i);
}

export const caesarCodec: Codec = {
  encode: (input, o) => ok(caesar(input, Number(o.shift ?? 3), alphabetsFor(o))),
  decode: (input, o) => ok(caesar(input, -Number(o.shift ?? 3), alphabetsFor(o))),
};

export const atbashCodec: Codec = {
  encode: (input, o) => ok(atbash(input, alphabetsFor(o))),
  decode: (input, o) => ok(atbash(input, alphabetsFor(o))),
};
