import type { Locale } from "@/i18n/config";

/** Adjective names of common numeral systems (feminine: «система»). */
const RU: Record<number, string> = {
  2: "двоичная",
  3: "троичная",
  4: "четверичная",
  5: "пятеричная",
  6: "шестеричная",
  7: "семеричная",
  8: "восьмеричная",
  9: "девятеричная",
  10: "десятичная",
  12: "двенадцатеричная",
  16: "шестнадцатеричная",
  20: "двадцатеричная",
  36: "тридцатишестеричная",
};
const EN: Record<number, string> = {
  2: "binary",
  3: "ternary",
  4: "quaternary",
  5: "quinary",
  6: "senary",
  7: "septenary",
  8: "octal",
  9: "nonary",
  10: "decimal",
  12: "duodecimal",
  16: "hexadecimal",
  20: "vigesimal",
  36: "base 36",
};
/** Neuter form for «число … как шестнадцатеричное». */
const RU_NEUT: Record<number, string> = { 2: "двоичное", 8: "восьмеричное", 10: "десятичное", 16: "шестнадцатеричное" };

/** "двоичная система" / "система с основанием 7" / "binary" / "base 7" */
export function baseName(b: number, locale: Locale): string {
  if (locale === "ru") return RU[b] ? `${RU[b]} система` : `система с основанием ${b}`;
  return EN[b] ?? `base ${b}`;
}

/** Select label: "16 — шестнадцатеричная" / "16 — hexadecimal" / "7" */
export function baseTitle(b: number, locale: Locale): string {
  const n = locale === "ru" ? RU[b] : EN[b];
  return n && !n.startsWith("base") ? `${b} — ${n}` : String(b);
}

const SHORT: Record<string, Record<number, string>> = {
  ru: { 2: "двоич.", 8: "восьм.", 10: "десят.", 16: "шестн." },
  en: { 2: "bin", 8: "oct", 10: "dec", 16: "hex" },
};

/** Compact select label: "16 · hex" / "16 · шестн." / "7" */
export function baseShort(b: number, locale: Locale): string {
  const s = SHORT[locale][b];
  return s ? `${b} · ${s}` : String(b);
}

/** "как шестнадцатеричное" / "as hexadecimal" */
export function readAs(b: number, locale: Locale): string {
  return locale === "ru" ? `как ${RU_NEUT[b] ?? `число с основанием ${b}`}` : `as ${EN[b] ?? `base ${b}`}`;
}

/** Allowed digits: "0–1", "0–9, A–F". */
export function digitRange(base: number): string {
  if (base <= 10) return `0–${base - 1}`;
  const last = String.fromCharCode(64 + base - 10);
  return base === 11 ? "0–9, A" : `0–9, A–${last}`;
}
