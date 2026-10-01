/**
 * Scientific / engineering / E-notation with exact decimal digits
 * (no binary floating point: 0.1 stays 1 × 10⁻¹, 123456789012345678901 keeps every digit).
 */
import { parseDecimalInput } from "./parse";

/** value = ±digits × 10^exp; digits has no leading/trailing zeros ("0" for zero). */
interface ExactDecimal {
  neg: boolean;
  digits: string;
  exp: number;
}

const SUPER: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
const TO_SUPER: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };

export const superscript = (n: number) => String(n).split("").map((c) => TO_SUPER[c] ?? c).join("");

const MAX_EXP = 100_000;

function normalize(neg: boolean, digits: string, exp: number): ExactDecimal {
  let d = digits.replace(/^0+/, "");
  if (!d) return { neg: false, digits: "0", exp: 0 };
  const trailing = d.length - d.replace(/0+$/, "").length;
  d = d.slice(0, d.length - trailing);
  return { neg, digits: d, exp: exp + trailing };
}

/**
 * Parse "123.45", "1,2345e2", "1.2345E+2", "1.2345×10^2", "1.2345 · 10²", "6.022*10**23", "10^-3".
 */
export function parseScientific(input: string): ExactDecimal | null {
  let s = input.trim().replace(/[\s  ]/g, "").replace(/[−–]/g, "-");
  if (!s) return null;
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+$/, (m) => "^" + m.split("").map((c) => SUPER[c]).join(""));
  let mant = s;
  let e = 0;
  const eNotation = /^(.+?)[eE]([+-]?\d+)$/.exec(s);
  const times = /^(.+?)[×xX*·⋅]10(?:\^|\*\*)\(?([+-]?\d+)\)?$/.exec(s);
  const power = /^([+-]?)10(?:\^|\*\*)\(?([+-]?\d+)\)?$/.exec(s);
  if (eNotation) {
    mant = eNotation[1];
    e = Number(eNotation[2]);
  } else if (times) {
    mant = times[1];
    e = Number(times[2]);
  } else if (power) {
    mant = `${power[1]}1`;
    e = Number(power[2]);
  }
  if (!Number.isFinite(e) || Math.abs(e) > MAX_EXP) return null;
  if (!/^[+-]?[\d.,'’]+$/.test(mant)) return null;
  const d = parseDecimalInput(mant);
  if (!d) return null;
  return normalize(d.neg, d.int.toString() + d.frac, e - d.frac.length);
}

export function isZero(x: ExactDecimal): boolean {
  return x.digits === "0";
}

/** Decimal exponent of the leading digit: 1234 → 3, 0.05 → −2. */
export function magnitude(x: ExactDecimal): number {
  return isZero(x) ? 0 : x.exp + x.digits.length - 1;
}

/** Round to `sig` significant digits (half away from zero); returns padded digits of length `sig`. */
export function roundSig(x: ExactDecimal, sig: number): { digits: string; mag: number } {
  const mag = magnitude(x);
  if (isZero(x)) return { digits: "0".repeat(sig), mag: 0 };
  if (x.digits.length <= sig) return { digits: x.digits.padEnd(sig, "0"), mag };
  const head = x.digits.slice(0, sig);
  const up = Number(x.digits[sig]) >= 5;
  if (!up) return { digits: head, mag };
  const bumped = (BigInt(head) + 1n).toString();
  if (bumped.length > sig) return { digits: bumped.slice(0, sig), mag: mag + 1 };
  return { digits: bumped, mag };
}

export interface Notation {
  /** Mantissa as digit string with "." */
  mantissa: string;
  exponent: number;
}

/** Scientific notation; `sig` = null keeps every significant digit. */
export function toScientific(x: ExactDecimal, sig: number | null = null): Notation {
  if (isZero(x)) return { mantissa: sig && sig > 1 ? `0.${"0".repeat(sig - 1)}` : "0", exponent: 0 };
  const { digits, mag } = sig ? roundSig(x, sig) : { digits: x.digits, mag: magnitude(x) };
  const m = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
  return { mantissa: (x.neg ? "-" : "") + m, exponent: mag };
}

/** Engineering notation: exponent is a multiple of 3, mantissa in [1, 1000). */
export function toEngineering(x: ExactDecimal, sig: number | null = null): Notation {
  if (isZero(x)) return toScientific(x, sig);
  const sci = sig ? roundSig(x, sig) : { digits: x.digits, mag: magnitude(x) };
  const e3 = Math.floor(sci.mag / 3) * 3;
  const shift = sci.mag - e3; // 0, 1 or 2 extra integer digits
  const digits = sci.digits.padEnd(shift + 1, "0");
  const int = digits.slice(0, shift + 1);
  const frac = digits.slice(shift + 1);
  return { mantissa: (x.neg ? "-" : "") + int + (frac ? `.${frac}` : ""), exponent: e3 };
}

/** Plain positional decimal ("0.000123", "123000"); null if it would be longer than `maxLen`. */
export function toPlain(x: ExactDecimal, maxLen = 400): string | null {
  if (isZero(x)) return "0";
  const sign = x.neg ? "-" : "";
  if (x.exp >= 0) {
    if (x.digits.length + x.exp > maxLen) return null;
    return sign + x.digits + "0".repeat(x.exp);
  }
  const point = x.digits.length + x.exp; // digits before the decimal point
  if (point > 0) return `${sign}${x.digits.slice(0, point)}.${x.digits.slice(point)}`;
  if (-point + x.digits.length + 2 > maxLen) return null;
  return `${sign}0.${"0".repeat(-point)}${x.digits}`;
}

export const SI_PREFIXES: Record<number, { sym: string; ru: string; en: string; ruSym: string }> = {
  30: { sym: "Q", ruSym: "Кв", ru: "кветта", en: "quetta" },
  27: { sym: "R", ruSym: "Р", ru: "ронна", en: "ronna" },
  24: { sym: "Y", ruSym: "И", ru: "иотта", en: "yotta" },
  21: { sym: "Z", ruSym: "З", ru: "зетта", en: "zetta" },
  18: { sym: "E", ruSym: "Э", ru: "экса", en: "exa" },
  15: { sym: "P", ruSym: "П", ru: "пета", en: "peta" },
  12: { sym: "T", ruSym: "Т", ru: "тера", en: "tera" },
  9: { sym: "G", ruSym: "Г", ru: "гига", en: "giga" },
  6: { sym: "M", ruSym: "М", ru: "мега", en: "mega" },
  3: { sym: "k", ruSym: "к", ru: "кило", en: "kilo" },
  0: { sym: "", ruSym: "", ru: "", en: "" },
  [-3]: { sym: "m", ruSym: "м", ru: "милли", en: "milli" },
  [-6]: { sym: "µ", ruSym: "мк", ru: "микро", en: "micro" },
  [-9]: { sym: "n", ruSym: "н", ru: "нано", en: "nano" },
  [-12]: { sym: "p", ruSym: "п", ru: "пико", en: "pico" },
  [-15]: { sym: "f", ruSym: "ф", ru: "фемто", en: "femto" },
  [-18]: { sym: "a", ruSym: "а", ru: "атто", en: "atto" },
  [-21]: { sym: "z", ruSym: "з", ru: "зепто", en: "zepto" },
  [-24]: { sym: "y", ruSym: "и", ru: "иокто", en: "yocto" },
  [-27]: { sym: "r", ruSym: "р", ru: "ронто", en: "ronto" },
  [-30]: { sym: "q", ruSym: "кв", ru: "квекто", en: "quecto" },
};
