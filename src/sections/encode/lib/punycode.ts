/**
 * Punycode (RFC 3492) and IDNA-style domain conversion per label.
 * Note: full UTS #46 mapping (case folding of every script, width mapping, validity rules)
 * is not performed — labels are lowercased with toLowerCase() and dot variants are normalized.
 */

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

function adapt(delta: number, numPoints: number, first: boolean): number {
  let d = first ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > ((BASE - TMIN) * TMAX) >> 1) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}

const digit = (d: number) => String.fromCharCode(d + 22 + 75 * (d < 26 ? 1 : 0));
function basic(cp: number): number {
  if (cp >= 48 && cp < 58) return cp - 22;
  if (cp >= 65 && cp < 91) return cp - 65;
  if (cp >= 97 && cp < 123) return cp - 97;
  return BASE;
}

export function punyEncode(input: string): string {
  const cps = Array.from(input, (c) => c.codePointAt(0)!);
  let out = cps.filter((c) => c < 0x80).map((c) => String.fromCharCode(c)).join("");
  const b = out.length;
  let h = b;
  if (b > 0) out += "-";
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  while (h < cps.length) {
    const m = Math.min(...cps.filter((c) => c >= n));
    delta += (m - n) * (h + 1);
    n = m;
    for (const c of cps) {
      if (c < n) delta++;
      if (c === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          out += digit(t + ((q - t) % (BASE - t)));
          q = Math.floor((q - t) / (BASE - t));
        }
        out += digit(q);
        bias = adapt(delta, h + 1, h === b);
        delta = 0;
        h++;
      }
    }
    delta++;
    n++;
  }
  return out;
}

export function punyDecode(input: string): string {
  const out: number[] = [];
  const lastDash = input.lastIndexOf("-");
  const b = lastDash < 0 ? 0 : lastDash;
  for (let j = 0; j < b; j++) {
    const c = input.charCodeAt(j);
    if (c >= 0x80) throw new Error("non-basic");
    out.push(c);
  }
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  for (let idx = b > 0 ? b + 1 : 0; idx < input.length; ) {
    const oldi = i;
    for (let w = 1, k = BASE; ; k += BASE) {
      if (idx >= input.length) throw new Error("bad-input");
      const d = basic(input.charCodeAt(idx++));
      if (d >= BASE) throw new Error("bad-input");
      i += d * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (d < t) break;
      w *= BASE - t;
    }
    bias = adapt(i - oldi, out.length + 1, oldi === 0);
    n += Math.floor(i / (out.length + 1));
    i %= out.length + 1;
    if (n > 0x10ffff) throw new Error("overflow");
    out.splice(i++, 0, n);
  }
  return String.fromCodePoint(...out);
}

const DOTS = /[.。．｡]/;

function mapDomain(s: string, f: (label: string) => string): string {
  const at = s.lastIndexOf("@");
  const local = at >= 0 ? s.slice(0, at + 1) : "";
  const domain = at >= 0 ? s.slice(at + 1) : s;
  return local + domain.split(DOTS).map(f).join(".");
}

/** "пример.рф" → "xn--e1afmkfd.xn--p1ai" (also handles e-mail addresses). */
export function domainToAscii(s: string): string {
  return mapDomain(s.trim(), (label) => (/[^\0-\x7f]/.test(label) ? `xn--${punyEncode(label.toLowerCase())}` : label));
}

/** "xn--e1afmkfd.xn--p1ai" → "пример.рф" */
export function domainToUnicode(s: string): string {
  return mapDomain(s.trim(), (label) => (/^xn--/i.test(label) ? punyDecode(label.slice(4).toLowerCase()) : label));
}
