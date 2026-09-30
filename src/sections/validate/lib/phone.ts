/* Phone number analysis on top of libphonenumber-js (the library is passed in so it can be loaded lazily). */
import type { CountryCode, NumberType } from "libphonenumber-js/max";
import type * as Lpn from "libphonenumber-js/max";

export type PhoneLib = Pick<typeof Lpn, "parsePhoneNumberFromString" | "validatePhoneNumberLength">;

export interface PhoneResult {
  /** Parsed at all */
  parsed: boolean;
  valid: boolean;
  possible: boolean;
  country?: CountryCode;
  callingCode?: string;
  type?: NumberType;
  e164?: string;
  international?: string;
  national?: string;
  uri?: string;
  /** Length problem reported by the library (TOO_SHORT, TOO_LONG…) */
  lengthIssue?: string;
  /** The number belongs to another country than the one expected (e.g. +7 9xx on a KZ page). */
  otherCountry?: boolean;
}

export function analyzePhone(lib: PhoneLib, input: string, defaultCountry?: CountryCode, expected?: CountryCode): PhoneResult {
  const s = input.trim();
  const p = s ? lib.parsePhoneNumberFromString(s, defaultCountry) : undefined;
  if (!p) {
    const lengthIssue = s ? lib.validatePhoneNumberLength(s, defaultCountry) : undefined;
    return { parsed: false, valid: false, possible: false, lengthIssue };
  }
  const valid = p.isValid();
  return {
    parsed: true,
    valid,
    possible: p.isPossible(),
    country: p.country,
    callingCode: p.countryCallingCode,
    type: p.getType(),
    e164: p.number,
    international: p.formatInternational(),
    national: p.formatNational(),
    uri: p.getURI(),
    lengthIssue: valid ? undefined : lib.validatePhoneNumberLength(s, defaultCountry),
    otherCountry: !!expected && !!p.country && p.country !== expected,
  };
}
