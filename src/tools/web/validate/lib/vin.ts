/* VIN (ISO 3779): structure, North American check digit (position 9), region by WMI and model-year code. */

const TRANSLIT: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

function vinValue(ch: string): number {
  return /\d/.test(ch) ? Number(ch) : TRANSLIT[ch];
}

export function vinCheckDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += vinValue(vin[i]) * WEIGHTS[i];
  const r = sum % 11;
  return r === 10 ? "X" : String(r);
}

export type Region = "africa" | "asia" | "europe" | "north-america" | "oceania" | "south-america" | "unknown";

export function regionOf(first: string): Region {
  if (/[A-H]/.test(first)) return "africa";
  if (/[J-R]/.test(first)) return "asia";
  if (/[S-Z]/.test(first)) return "europe";
  if (/[1-5]/.test(first)) return "north-america";
  if (/[67]/.test(first)) return "oceania";
  if (/[89]/.test(first)) return "south-america";
  return "unknown";
}

const YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";
/** Model year code (position 10) → the two possible years in the 30-year cycle. */
export function modelYears(code: string): [number, number] | null {
  const i = YEAR_CODES.indexOf(code);
  if (i < 0) return null;
  return [1980 + i, 2010 + i];
}

export type VinError = "empty" | "length" | "chars" | "ioq" | "check";

interface VinResult {
  vin: string;
  errors: VinError[];
  /** Structure is valid (length, characters). */
  valid: boolean;
  /** Check digit matches (mandatory only for North America). */
  checkOk?: boolean;
  expectedCheck?: string;
  wmi?: string;
  vds?: string;
  vis?: string;
  region?: Region;
  years?: [number, number] | null;
  plant?: string;
  serial?: string;
}

export function validateVin(input: string): VinResult {
  const vin = input.replace(/[\s-]/g, "").toUpperCase();
  const out: VinResult = { vin, errors: [], valid: false };
  if (!vin) return { ...out, errors: ["empty"] };
  if (/[IOQ]/.test(vin)) out.errors.push("ioq");
  if (!/^[A-Z0-9]*$/.test(vin)) out.errors.push("chars");
  if (vin.length !== 17) out.errors.push("length");
  if (out.errors.length) return out;
  out.valid = true;
  out.wmi = vin.slice(0, 3);
  out.vds = vin.slice(3, 9);
  out.vis = vin.slice(9);
  out.region = regionOf(vin[0]);
  out.years = modelYears(vin[9]);
  out.plant = vin[10];
  out.serial = vin.slice(11);
  out.expectedCheck = vinCheckDigit(vin);
  out.checkOk = out.expectedCheck === vin[8];
  if (!out.checkOk) out.errors.push("check");
  return out;
}
