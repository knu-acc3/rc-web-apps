/**
 * Platform-specific length counting: SMS segments (GSM-7 / UCS-2) and the
 * weighted character count used by X (Twitter).
 */
import { graphemes, isEmojiGrapheme } from "./textOps";

/* ───────────── SMS ───────────── */

/** GSM 03.38 basic character set (7-bit default alphabet), excluding ESC. */
export const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
/** GSM 03.38 extension table: each costs 2 septets (ESC + char). */
export const GSM7_EXTENDED = "\f^{}\\[~]|€";

const BASIC = new Set(GSM7_BASIC);
const EXT = new Set(GSM7_EXTENDED);

export type SmsEncoding = "GSM-7" | "UCS-2";

export interface SmsInfo {
  encoding: SmsEncoding;
  /** Septets (GSM-7) or UTF-16 code units (UCS-2). */
  units: number;
  segments: number;
  /** Capacity per segment for the current message length. */
  perSegment: number;
  /** Units left before another segment is needed. */
  remaining: number;
  /** Characters that force UCS-2 (first few, unique), not counting Cyrillic letters. */
  nonGsm: string[];
  /** The text contains Cyrillic letters (they always force UCS-2). */
  cyrillic: boolean;
}

export function smsInfo(text: string): SmsInfo {
  const chars = [...text];
  const nonGsm: string[] = [];
  let gsm = true;
  let cyrillic = false;
  for (const c of chars) {
    if (!BASIC.has(c) && !EXT.has(c)) {
      gsm = false;
      if (/\p{Script=Cyrillic}/u.test(c)) cyrillic = true;
      else if (!nonGsm.includes(c) && nonGsm.length < 12) nonGsm.push(c);
    }
  }
  if (gsm) {
    const costs = chars.map((c) => (EXT.has(c) ? 2 : 1));
    const units = costs.reduce((a, b) => a + b, 0);
    if (units <= 160) return { encoding: "GSM-7", units, segments: units === 0 ? 0 : 1, perSegment: 160, remaining: 160 - units, nonGsm, cyrillic };
    // Multipart: 153 septets per part; an escape sequence is never split between parts.
    let segments = 1;
    let used = 0;
    for (const c of costs) {
      if (used + c > 153) {
        segments++;
        used = 0;
      }
      used += c;
    }
    return { encoding: "GSM-7", units, segments, perSegment: 153, remaining: 153 - used, nonGsm, cyrillic };
  }
  const costs = chars.map((c) => c.length); // 2 for characters outside the BMP (surrogate pair)
  const units = costs.reduce((a, b) => a + b, 0);
  if (units <= 70) return { encoding: "UCS-2", units, segments: 1, perSegment: 70, remaining: 70 - units, nonGsm, cyrillic };
  // 67 code units per part; a surrogate pair is never split.
  let segments = 1;
  let used = 0;
  for (const c of costs) {
    if (used + c > 67) {
      segments++;
      used = 0;
    }
    used += c;
  }
  return { encoding: "UCS-2", units, segments, perSegment: 67, remaining: 67 - used, nonGsm, cyrillic };
}

/* ───────────── X (Twitter) ───────────── */

/**
 * twitter-text v3 configuration: characters in these ranges weigh 1,
 * everything else 2; every emoji weighs 2; every URL counts as 23.
 * Limit: 280 weighted units.
 */
const LIGHT_RANGES: [number, number][] = [
  [0x0000, 0x10ff],
  [0x2000, 0x200d],
  [0x2010, 0x201f],
  [0x2032, 0x2037],
];
export const X_LIMIT = 280;
export const X_URL_LENGTH = 23;

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>"«»]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|ru|kz|рф|io|dev|app|me|co|info|biz|ua|by|uz|de|uk|us|tv|ai|gg|ly|to)\b(?:\/[^\s<>"«»]*)?/giu;

function cpWeight(cp: number): number {
  for (const [a, b] of LIGHT_RANGES) if (cp >= a && cp <= b) return 1;
  return 2;
}

export interface XCount {
  weighted: number;
  remaining: number;
  urls: number;
}

export function xWeightedLength(text: string): XCount {
  const t = text.normalize("NFC");
  let weighted = 0;
  let urls = 0;
  let last = 0;
  const parts: string[] = [];
  for (const m of t.matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;:!?)\]]+$/, "");
    if (!url) continue;
    parts.push(t.slice(last, m.index));
    last = m.index! + url.length;
    urls++;
    weighted += X_URL_LENGTH;
  }
  parts.push(t.slice(last));
  for (const part of parts) {
    for (const g of graphemes(part)) {
      // Emoji (incl. ZWJ sequences, flags, keycaps) weigh 2 as a whole. © and ®
      // without the emoji variation selector stay plain Latin-1 text.
      const cp0 = g.codePointAt(0)!;
      if (isEmojiGrapheme(g) && (cp0 > 0xff || /️|⃣/.test(g))) {
        weighted += 2;
        continue;
      }
      for (const ch of g) weighted += cpWeight(ch.codePointAt(0)!);
    }
  }
  return { weighted, remaining: X_LIMIT - weighted, urls };
}
