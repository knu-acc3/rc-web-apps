/* Drawing lots: what is written on the hidden cards. Pure; shuffling is done by the caller (crypto rng). */

export type LotsMode = "custom" | "straws" | "numbers" | "mafia";
export const LOTS_MODES: LotsMode[] = ["custom", "straws", "numbers", "mafia"];

export const LOTS_MAX = 100;

interface LotsOptions {
  /** Custom: one lot per line. */
  lines: string[];
  /** Straws / numbers / mafia: how many players (cards). */
  count: number;
  /** Straws: how many short ones. Mafia: how many mafia. */
  marked: number;
  /** Mafia: add a detective and a doctor. */
  detective: boolean;
  doctor: boolean;
}

/** A lot: `kind` drives the picture (a short or long straw, a role colour), `text` is what the card says. */
export interface Lot {
  text: string;
  kind: "short" | "long" | "mafia" | "detective" | "doctor" | "civilian" | "plain";
}

const L = {
  ru: { short: "Короткая", long: "Длинная", mafia: "Мафия", detective: "Комиссар", doctor: "Доктор", civilian: "Мирный житель" },
  en: { short: "Short", long: "Long", mafia: "Mafia", detective: "Detective", doctor: "Doctor", civilian: "Civilian" },
} as const;

export const clampCount = (n: number, min = 2) => Math.max(min, Math.min(LOTS_MAX, Math.round(Number.isFinite(n) ? n : min)));

/** Default number of mafia for `n` players: about 30 % (3 of 10), at least one. */
export const defaultMafia = (n: number) => Math.max(1, Math.round(n * 0.3));

/** Cards before shuffling. */
export function buildLots(mode: LotsMode, o: LotsOptions, locale: "ru" | "en"): Lot[] {
  const t = L[locale];
  if (mode === "custom") return o.lines.slice(0, LOTS_MAX).map((text) => ({ text, kind: "plain" }));
  const n = clampCount(o.count, mode === "mafia" ? 3 : 2);
  if (mode === "numbers") return Array.from({ length: n }, (_, i) => ({ text: String(i + 1), kind: "plain" }));
  if (mode === "straws") {
    const short = Math.max(1, Math.min(n - 1, Math.round(o.marked)));
    return Array.from({ length: n }, (_, i) => (i < short ? { text: t.short, kind: "short" } : { text: t.long, kind: "long" }));
  }
  const special = (o.detective ? 1 : 0) + (o.doctor ? 1 : 0);
  // Mafia must stay a minority and leave room for at least one civilian.
  const mafia = Math.max(1, Math.min(Math.ceil(n / 2) - 1 || 1, n - special - 1, Math.round(o.marked)));
  const out: Lot[] = Array.from({ length: mafia }, () => ({ text: t.mafia, kind: "mafia" }));
  if (o.detective) out.push({ text: t.detective, kind: "detective" });
  if (o.doctor) out.push({ text: t.doctor, kind: "doctor" });
  while (out.length < n) out.push({ text: t.civilian, kind: "civilian" });
  return out;
}
