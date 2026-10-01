/**
 * Bra sizes. EU/RU band = underbust girth rounded to 5 cm; cup = bust − underbust in 2 cm steps
 * (AA 10–11, A 12–13, B 14–15, C 16–17, D 18–19, E 20–21 …).
 * FR band = EU + 15; UK/US band in inches (EU 75 = 34). Cup letters diverge after D:
 * EU E = UK DD = US DD(E), EU F = UK E = US DDD(F), EU G = UK F = US G …
 */

export const BANDS = [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110] as const;
export const EU_CUPS = ["AA", "A", "B", "C", "D", "E", "F", "G", "H"] as const;
export type EuCup = (typeof EU_CUPS)[number];

const UK_CUPS: Record<EuCup, string> = { AA: "AA", A: "A", B: "B", C: "C", D: "D", E: "DD", F: "E", G: "F", H: "FF" };
const US_CUPS: Record<EuCup, string> = { AA: "AA", A: "A", B: "B", C: "C", D: "D", E: "DD (E)", F: "DDD (F)", G: "G", H: "H" };

/** Bust − underbust difference (cm) for each EU cup: [from, to]. */
export function cupDiff(cup: EuCup): [number, number] {
  const i = EU_CUPS.indexOf(cup);
  const lo = 10 + i * 2;
  return [lo, lo + 1];
}

export const ukBand = (eu: number) => 28 + ((eu - 60) / 5) * 2;
export const frBand = (eu: number) => eu + 15;
const underbustRange = (eu: number): [number, number] => [eu - 2, eu + 2];

interface BraSize {
  band: number;
  cup: EuCup;
  eu: string;
  ru: string;
  fr: string;
  uk: string;
  us: string;
  underbust: [number, number];
  bust: [number, number];
}

export function braSize(band: number, cup: EuCup): BraSize {
  const [dLo, dHi] = cupDiff(cup);
  const [uLo, uHi] = underbustRange(band);
  const ukB = ukBand(band);
  return {
    band,
    cup,
    eu: `${band}${cup}`,
    ru: `${band}${cup}`,
    fr: `${frBand(band)}${cup}`,
    uk: `${ukB}${UK_CUPS[cup]}`,
    us: `${ukB}${US_CUPS[cup]}`,
    underbust: [uLo, uHi],
    bust: [uLo + dLo, uHi + dHi],
  };
}

/** Size from measurements (cm). Returns null outside the supported range. */
export function braFromMeasure(underbust: number, bust: number): { band: number; cup: EuCup } | null {
  if (!(underbust > 0) || !(bust > underbust)) return null;
  const band = Math.round(underbust / 5) * 5;
  if (band < BANDS[0] || band > BANDS[BANDS.length - 1]) return null;
  const diff = Math.round(bust - underbust);
  const i = Math.floor((diff - 10) / 2);
  if (i < 0 || i >= EU_CUPS.length) return null;
  return { band, cup: EU_CUPS[i] };
}

/** Sister sizes: same cup volume on a band 5 cm smaller/larger (cup one step up/down). */
export function sisterSizes(band: number, cup: EuCup): { band: number; cup: EuCup }[] {
  const i = EU_CUPS.indexOf(cup);
  const out: { band: number; cup: EuCup }[] = [];
  if (i + 1 < EU_CUPS.length && band - 5 >= BANDS[0]) out.push({ band: band - 5, cup: EU_CUPS[i + 1] });
  if (i - 1 >= 0 && band + 5 <= BANDS[BANDS.length - 1]) out.push({ band: band + 5, cup: EU_CUPS[i - 1] });
  return out;
}
