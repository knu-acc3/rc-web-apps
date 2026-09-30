/* Barcode symbologies: input normalisation and validation before rendering with JsBarcode. */

import { gs1Check, msiMod10, upcEToA } from "./checkdigits";

export type Symbology = "ean13" | "ean8" | "upca" | "upce" | "code128" | "code39" | "itf14" | "codabar" | "msi";

export const SYMBOLOGIES: Symbology[] = ["ean13", "ean8", "upca", "upce", "code128", "code39", "itf14", "codabar", "msi"];

/** JsBarcode format names. */
export const JS_FORMAT: Record<Symbology, string> = {
  ean13: "EAN13",
  ean8: "EAN8",
  upca: "UPC",
  upce: "UPCE",
  code128: "CODE128",
  code39: "CODE39",
  itf14: "ITF14",
  codabar: "codabar",
  msi: "MSI10",
};

export const LABEL: Record<Symbology, string> = {
  ean13: "EAN-13",
  ean8: "EAN-8",
  upca: "UPC-A",
  upce: "UPC-E",
  code128: "Code 128",
  code39: "Code 39",
  itf14: "ITF-14",
  codabar: "Codabar",
  msi: "MSI",
};

export const SAMPLE: Record<Symbology, string> = {
  ean13: "4006381333931",
  ean8: "96385074",
  upca: "036000291452",
  upce: "04252614",
  code128: "SKU-2026-0042",
  code39: "PART-00125",
  itf14: "10012345678902",
  codabar: "A40156B",
  msi: "1234567",
};

export type BarcodeError = "empty" | "digits" | "length" | "check" | "ascii" | "code39" | "codabar" | "upceNs" | "tooLong";

export type BarcodeResult =
  | { ok: true; value: string; check?: string; added?: boolean }
  | { ok: false; error: BarcodeError; expected?: string };

const DIGITS: Partial<Record<Symbology, [number, number]>> = {
  ean13: [12, 13],
  ean8: [7, 8],
  upca: [11, 12],
  itf14: [13, 14],
};

/** Normalise user input for a symbology; computes or verifies the check digit where there is one. */
export function prepareBarcode(sym: Symbology, raw: string): BarcodeResult {
  const input = raw.trim();
  if (!input) return { ok: false, error: "empty" };
  const range = DIGITS[sym];
  if (range) {
    const d = input.replace(/[\s-]/g, "");
    if (!/^\d+$/.test(d)) return { ok: false, error: "digits" };
    const [short, full] = range;
    if (d.length === short) {
      const c = String(gs1Check(d));
      return { ok: true, value: d + c, check: c, added: true };
    }
    if (d.length !== full) return { ok: false, error: "length" };
    const c = String(gs1Check(d.slice(0, -1)));
    if (c !== d[d.length - 1]) return { ok: false, error: "check", expected: d.slice(0, -1) + c };
    return { ok: true, value: d, check: c };
  }
  switch (sym) {
    case "upce": {
      const d = input.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(d)) return { ok: false, error: "digits" };
      const [ns, six, given] = d.length === 6 ? ["0", d, ""] : d.length === 7 ? [d[0], d.slice(1), ""] : d.length === 8 ? [d[0], d.slice(1, 7), d[7]] : ["", "", ""];
      if (!six) return { ok: false, error: "length" };
      const a = upcEToA(ns, six);
      if (!a) return { ok: false, error: "upceNs" };
      const c = String(gs1Check(a));
      if (given && given !== c) return { ok: false, error: "check", expected: ns + six + c };
      return { ok: true, value: ns + six + c, check: c, added: !given };
    }
    case "code128":
      if (!/^[\x20-\x7e]+$/.test(input)) return { ok: false, error: "ascii" };
      if (input.length > 80) return { ok: false, error: "tooLong" };
      return { ok: true, value: input };
    case "code39": {
      const v = input.toUpperCase();
      if (!/^[0-9A-Z \-.$/+%]+$/.test(v)) return { ok: false, error: "code39" };
      if (v.length > 43) return { ok: false, error: "tooLong" };
      return { ok: true, value: v };
    }
    case "codabar": {
      let v = input.toUpperCase();
      if (!/^[A-D]/.test(v)) v = `A${v}`;
      if (!/[A-D]$/.test(v)) v = `${v}A`;
      if (!/^[A-D][0-9\-$:/.+]+[A-D]$/.test(v)) return { ok: false, error: "codabar" };
      return { ok: true, value: v };
    }
    case "msi": {
      const d = input.replace(/\s/g, "");
      if (!/^\d+$/.test(d)) return { ok: false, error: "digits" };
      if (d.length > 30) return { ok: false, error: "tooLong" };
      return { ok: true, value: d, check: String(msiMod10(d)), added: true };
    }
    default:
      return { ok: false, error: "empty" };
  }
}
