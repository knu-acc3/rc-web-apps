/**
 * Pitch detection (McLeod pitch method: normalised square difference function,
 * a normalised autocorrelation) and note/cents helpers. Pure, unit-tested.
 */

export interface PitchResult {
  /** Fundamental frequency in Hz. */
  freq: number;
  /** 0…1 — how periodic the signal is (NSDF peak height). */
  clarity: number;
}

/**
 * Detect the fundamental frequency of a mono buffer.
 * Returns null for silence or noise.
 */
export function detectPitch(buf: Float32Array, sampleRate: number, minFreq = 30, maxFreq = 4200, threshold = 0.9): PitchResult | null {
  const n = buf.length;
  let energy = 0;
  for (let i = 0; i < n; i++) energy += buf[i] * buf[i];
  if (Math.sqrt(energy / n) < 0.005) return null;

  const maxTau = Math.min(n - 2, Math.floor(sampleRate / minFreq));
  const minTau = Math.max(2, Math.floor(sampleRate / maxFreq));
  const nsdf = new Float32Array(maxTau + 1);
  for (let tau = 0; tau <= maxTau; tau++) {
    let acf = 0;
    let m = 0;
    for (let j = 0; j < n - tau; j++) {
      const a = buf[j];
      const b = buf[j + tau];
      acf += a * b;
      m += a * a + b * b;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Key maxima: the highest point between each positive-going and negative-going zero crossing.
  const peaks: number[] = [];
  let tau = 1;
  while (tau < maxTau && nsdf[tau] > 0) tau++; // skip the lobe around lag 0
  let best = -1;
  for (; tau < maxTau; tau++) {
    if (nsdf[tau] > 0) {
      if (best < 0 || nsdf[tau] > nsdf[best]) best = tau;
    } else if (best >= 0) {
      peaks.push(best);
      best = -1;
    }
  }
  if (best >= 0) peaks.push(best);
  const valid = peaks.filter((p) => p >= minTau);
  if (!valid.length) return null;
  const top = Math.max(...valid.map((p) => nsdf[p]));
  const pick = valid.find((p) => nsdf[p] >= threshold * top) ?? valid[0];

  // Parabolic interpolation for sub-sample accuracy.
  const y0 = nsdf[pick - 1];
  const y1 = nsdf[pick];
  const y2 = nsdf[pick + 1] ?? y1;
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
  const period = pick + Math.max(-1, Math.min(1, shift));
  const clarity = y1 - 0.25 * (y0 - y2) * shift;
  if (clarity < 0.5) return null;
  return { freq: sampleRate / period, clarity: Math.min(1, clarity) };
}

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const NOTE_NAMES_RU = ["До", "До♯", "Ре", "Ре♯", "Ми", "Фа", "Фа♯", "Соль", "Соль♯", "Ля", "Ля♯", "Си"] as const;

export interface NoteInfo {
  midi: number;
  name: string;
  octave: number;
  /** Deviation from the nearest equal-tempered note, −50…+50. */
  cents: number;
  /** Frequency of the nearest note. */
  target: number;
}

export function midiToFreq(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number, a4 = 440): number {
  return 69 + 12 * Math.log2(freq / a4);
}

/** Nearest note and cents deviation for a frequency. */
export function noteOf(freq: number, a4 = 440): NoteInfo {
  const exact = freqToMidi(freq, a4);
  const midi = Math.round(exact);
  const idx = ((midi % 12) + 12) % 12;
  return { midi, name: NOTE_NAMES[idx], octave: Math.floor(midi / 12) - 1, cents: Math.round((exact - midi) * 100 * 10) / 10, target: midiToFreq(midi, a4) };
}

/** Cents between two frequencies. */
export function centsBetween(freq: number, ref: number): number {
  return 1200 * Math.log2(freq / ref);
}

/** Parse scientific pitch notation "E2", "A#4", "Bb3" → MIDI number. */
export function parseNote(s: string): number | null {
  const m = /^([A-Ga-g])([#♯b♭]?)(-?\d)$/.exec(s.trim());
  if (!m) return null;
  const base: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  let n = base[m[1].toLowerCase()];
  if (m[2] === "#" || m[2] === "♯") n++;
  if (m[2] === "b" || m[2] === "♭") n--;
  return (Number(m[3]) + 1) * 12 + n;
}

/** Median of the last readings: steadies the tuner display. */
export function median(values: number[]): number {
  if (!values.length) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
