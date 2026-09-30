/* IBAN validation (ISO 13616): country format + mod-97 checksum. */
import { IBAN_BY_CODE, type IbanCountry } from "../data/iban-countries";

export type IbanError = "empty" | "chars" | "country" | "length" | "structure" | "checksum";

export interface IbanResult {
  /** Upper-case, no spaces */
  iban: string;
  valid: boolean;
  errors: IbanError[];
  country?: IbanCountry;
  /** Printed format: groups of four */
  formatted: string;
  bank?: string;
  branch?: string;
  /** The rest of the BBAN after bank/branch */
  account?: string;
  /** Check digits that would make the IBAN valid (when only the checksum is wrong). */
  expectedCheck?: string;
}

export function normalize(input: string): string {
  return input.replace(/^IBAN[:\s]*/i, "").replace(/[\s\-.]/g, "").toUpperCase();
}

export function formatIban(iban: string): string {
  return iban.replace(/(.{4})(?=.)/g, "$1 ");
}

/** Remainder of the IBAN (rearranged, letters → numbers) modulo 97. Valid IBANs give 1. */
export function mod97(iban: string): number {
  const s = iban.slice(4) + iban.slice(0, 4);
  let r = 0;
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    const v = code >= 65 && code <= 90 ? code - 55 : code - 48;
    r = v >= 10 ? (r * 100 + v) % 97 : (r * 10 + v) % 97;
  }
  return r;
}

/** Compute the two check digits for a country code and BBAN. */
export function checkDigits(country: string, bban: string): string {
  const r = mod97(`${country}00${bban}`);
  return String(98 - r).padStart(2, "0");
}

/** Regex for a registry BBAN structure such as "4!a6!n8!n". */
export function structureRegex(bban: string): RegExp {
  const parts = [...bban.matchAll(/(\d+)!([nac])/g)].map(([, n, t]) => `${t === "n" ? "\\d" : t === "a" ? "[A-Z]" : "[A-Z0-9]"}{${n}}`);
  return new RegExp(`^${parts.join("")}$`);
}

export function validateIban(input: string): IbanResult {
  const iban = normalize(input);
  const base: IbanResult = { iban, valid: false, errors: [], formatted: formatIban(iban) };
  if (!iban) return { ...base, errors: ["empty"] };
  if (!/^[A-Z0-9]+$/.test(iban)) return { ...base, errors: ["chars"] };
  const cc = iban.slice(0, 2);
  const country = IBAN_BY_CODE.get(cc);
  if (!/^[A-Z]{2}\d{2}/.test(iban) || !country) return { ...base, errors: ["country"] };
  const out: IbanResult = { ...base, country };
  const bban = iban.slice(4);
  if (iban.length !== country.length) out.errors.push("length");
  else if (!structureRegex(country.bban).test(bban)) out.errors.push("structure");
  if (iban.length === country.length) {
    if (mod97(iban) !== 1) {
      out.errors.push("checksum");
      out.expectedCheck = checkDigits(cc, bban);
    }
    out.bank = bban.slice(country.bank[0] - 1, country.bank[1]);
    if (country.branch) out.branch = bban.slice(country.branch[0] - 1, country.branch[1]);
    out.account = bban.slice(Math.max(country.bank[1], country.branch?.[1] ?? 0));
  }
  out.valid = out.errors.length === 0;
  return out;
}

/** Human-readable breakdown of a registry structure: [length, kind] segments. */
export function structureParts(bban: string): { len: number; kind: "n" | "a" | "c" }[] {
  return [...bban.matchAll(/(\d+)!([nac])/g)].map(([, n, t]) => ({ len: Number(n), kind: t as "n" | "a" | "c" }));
}
