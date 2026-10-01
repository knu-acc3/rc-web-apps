/**
 * Tap-tempo maths. Pure, unit-tested.
 */

/** A pause longer than this starts a new measurement. */
const TAP_RESET_MS = 2000;
/** Only the most recent taps are used, so tempo changes are followed. */
const TAP_WINDOW = 16;

/** Add a tap time (ms); returns the new list (reset after a long pause). */
export function addTap(taps: number[], now: number, resetMs = TAP_RESET_MS, window = TAP_WINDOW): number[] {
  const last = taps[taps.length - 1];
  if (last !== undefined && (now - last > resetMs || now <= last)) return [now];
  return [...taps, now].slice(-window);
}

interface TapTempo {
  bpm: number;
  /** Mean interval between taps, ms. */
  interval: number;
  /** Number of intervals used after removing outliers. */
  used: number;
  /** Relative spread of the intervals (standard deviation / mean). */
  spread: number;
}

/**
 * Tempo from tap times: intervals that differ from the median by more than
 * `tolerance` (default 15 %) are treated as mistakes (missed or double taps) and ignored.
 */
export function tempoFromTaps(taps: number[], tolerance = 0.15): TapTempo | null {
  if (taps.length < 2) return null;
  const iv: number[] = [];
  for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
  const sorted = [...iv].sort((a, b) => a - b);
  const med = sorted.length % 2 ? sorted[sorted.length >> 1] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const good = iv.filter((x) => Math.abs(x - med) <= med * tolerance);
  const use = good.length ? good : iv;
  const mean = use.reduce((a, b) => a + b, 0) / use.length;
  const variance = use.reduce((a, b) => a + (b - mean) ** 2, 0) / use.length;
  return { bpm: 60000 / mean, interval: mean, used: use.length, spread: Math.sqrt(variance) / mean };
}

/** Note lengths in ms at a tempo (quarter note = one beat). */
export function noteLengths(bpm: number): { whole: number; half: number; quarter: number; eighth: number; sixteenth: number; tripletEighth: number; dottedEighth: number } {
  const q = 60000 / bpm;
  return { whole: q * 4, half: q * 2, quarter: q, eighth: q / 2, sixteenth: q / 4, tripletEighth: q / 3, dottedEighth: q * 0.75 };
}

/** Italian tempo marking for a BPM (common modern ranges; sources differ slightly). */
export function tempoMarking(bpm: number): string {
  if (bpm < 40) return "Grave";
  if (bpm < 60) return "Largo";
  if (bpm < 66) return "Larghetto";
  if (bpm < 76) return "Adagio";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 156) return "Allegro";
  if (bpm < 176) return "Vivace";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
}
