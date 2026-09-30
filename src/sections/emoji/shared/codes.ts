/** Character code helpers shared by the emoji and symbols sections (server and client safe). */

export const hex = (cp: number, pad = 4) => cp.toString(16).toUpperCase().padStart(pad, "0");

export function codePoints(s: string): number[] {
  const out: number[] = [];
  for (const c of s) out.push(c.codePointAt(0)!);
  return out;
}

/** "U+2764 U+FE0F" */
export const uPlus = (s: string) => codePoints(s).map((c) => `U+${hex(c)}`).join(" ");
/** "&#x2764;&#xFE0F;" */
export const htmlHex = (s: string) => codePoints(s).map((c) => `&#x${hex(c, 1)};`).join("");
/** "&#10084;&#65039;" */
export const htmlDec = (s: string) => codePoints(s).map((c) => `&#${c};`).join("");
/** CSS `content` escape: "\2764\FE0F" */
export const cssEscape = (s: string) => codePoints(s).map((c) => `\\${hex(c, 1)}`).join("");
/** JavaScript string escape: "❤️", astral as "\u{1F600}" */
export const jsEscape = (s: string) => codePoints(s).map((c) => (c > 0xffff ? `\\u{${hex(c, 1)}}` : `\\u${hex(c)}`)).join("");
/** Python string escape: "❤️", astral as "\U0001f600" */
export const pyEscape = (s: string) =>
  codePoints(s)
    .map((c) => (c > 0xffff ? `\\U${hex(c, 8).toLowerCase()}` : `\\u${hex(c).toLowerCase()}`))
    .join("");
/** UTF-16 code units: "D83D DE00" */
export const utf16 = (s: string) => Array.from({ length: s.length }, (_, i) => hex(s.charCodeAt(i))).join(" ");
/** UTF-8 bytes: "E2 9D A4" */
export const utf8 = (s: string) => Array.from(new TextEncoder().encode(s), (b) => hex(b, 2)).join(" ");
/** Percent-encoding for URLs. */
export const urlEncode = (s: string) => encodeURIComponent(s);
