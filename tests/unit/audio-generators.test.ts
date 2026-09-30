import { describe, expect, it } from "vitest";
import { addTap, noteLengths, tempoFromTaps, tempoMarking } from "@/sections/audio/lib/bpm";
import { createNoise, NOISE_COLORS, NOISE_SLOPE, NOISE_WORKLET_SRC, type NoiseColor } from "@/sections/audio/lib/noise";
import { centsBetween, detectPitch, median, midiToFreq, noteOf, parseNote } from "@/sections/audio/lib/pitch";

function sine(freq: number, n: number, sr: number, amp = 0.5, phase = 0): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin((2 * Math.PI * freq * i) / sr + phase);
  return out;
}

describe("pitch detection", () => {
  it("finds the frequency of a synthetic sine", () => {
    for (const f of [82.41, 110, 196, 440, 659.25, 1000]) {
      const r = detectPitch(sine(f, 4096, 48000), 48000)!;
      expect(r).not.toBeNull();
      expect(Math.abs(centsBetween(r.freq, f))).toBeLessThan(2);
      expect(r.clarity).toBeGreaterThan(0.9);
    }
  });
  it("finds the fundamental of a harmonic-rich tone", () => {
    const sr = 44100;
    const n = 4096;
    const f = 146.83; // D3
    const x = new Float32Array(n);
    for (let h = 1; h <= 6; h++) {
      const s = sine(f * h, n, sr, 0.4 / h, h);
      for (let i = 0; i < n; i++) x[i] += s[i];
    }
    const r = detectPitch(x, sr)!;
    expect(Math.abs(centsBetween(r.freq, f))).toBeLessThan(3);
  });
  it("returns null for silence and white noise", () => {
    expect(detectPitch(new Float32Array(2048), 48000)).toBeNull();
    const noise = createNoise("white", 42);
    const buf = new Float32Array(2048);
    noise.fill(buf);
    expect(detectPitch(buf, 48000)).toBeNull();
  });
  it("names notes and cents", () => {
    expect(noteOf(440)).toMatchObject({ name: "A", octave: 4, midi: 69, cents: 0 });
    expect(noteOf(82.41)).toMatchObject({ name: "E", octave: 2 });
    expect(noteOf(261.63)).toMatchObject({ name: "C", octave: 4 });
    const sharp = noteOf(445);
    expect(sharp.name).toBe("A");
    expect(sharp.cents).toBeCloseTo(19.6, 0);
    expect(noteOf(432).cents).toBeCloseTo(-31.8, 0);
    expect(noteOf(440, 432).cents).toBeCloseTo(31.8, 0);
    expect(midiToFreq(parseNote("E2")!)).toBeCloseTo(82.41, 1);
    expect(parseNote("Bb3")).toBe(parseNote("A#3"));
    expect(parseNote("H2")).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
  });
});

describe("tap tempo", () => {
  it("averages steady taps", () => {
    const taps = [0, 500, 1000, 1500, 2000];
    expect(tempoFromTaps(taps)!.bpm).toBeCloseTo(120, 5);
    expect(tempoFromTaps([0])).toBeNull();
  });
  it("tolerates human jitter", () => {
    const taps = [0, 505, 996, 1502, 1999, 2507, 3001];
    const r = tempoFromTaps(taps)!;
    expect(Math.abs(r.bpm - 120)).toBeLessThan(1);
    expect(r.spread).toBeLessThan(0.02);
  });
  it("ignores a missed or double tap", () => {
    const taps = [0, 500, 1000, 2000, 2500, 3000, 3100, 3500];
    const r = tempoFromTaps(taps)!;
    expect(Math.abs(r.bpm - 120)).toBeLessThan(0.5);
    expect(r.used).toBeLessThan(taps.length - 1);
  });
  it("resets after a pause and keeps a window", () => {
    let taps: number[] = [];
    for (const t of [0, 400, 800]) taps = addTap(taps, t);
    expect(taps).toHaveLength(3);
    taps = addTap(taps, 5000);
    expect(taps).toEqual([5000]);
    for (let i = 1; i <= 30; i++) taps = addTap(taps, 5000 + i * 300);
    expect(taps).toHaveLength(16);
  });
  it("note lengths and markings", () => {
    const l = noteLengths(120);
    expect(l.quarter).toBe(500);
    expect(l.eighth).toBe(250);
    expect(l.dottedEighth).toBe(375);
    expect(l.tripletEighth).toBeCloseTo(166.667, 2);
    expect(tempoMarking(60)).toBe("Larghetto");
    expect(tempoMarking(120)).toBe("Allegro");
    expect(tempoMarking(90)).toBe("Andante");
  });
});

/* ───────────── noise spectrum ───────────── */

/** In-place radix-2 FFT, returns power spectrum of the first half. */
function powerSpectrum(x: Float32Array): Float64Array {
  const n = x.length;
  const re = Float64Array.from(x);
  const im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const ar = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const ai = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k + len / 2] = re[i + k] - ar;
        im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar;
        im[i + k] += ai;
      }
    }
  }
  const p = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) p[i] = re[i] * re[i] + im[i] * im[i];
  return p;
}

/** Average power per octave band → slope in dB/octave between 250 Hz and 8 kHz (least squares). */
function octaveSlope(color: NoiseColor, sr = 48000): number {
  const gen = createNoise(color, 12345);
  const warm = new Float32Array(sr);
  gen.fill(warm); // let the filters settle
  const N = 8192;
  const frames = 24;
  const acc = new Float64Array(N / 2);
  const win = new Float32Array(N);
  for (let f = 0; f < frames; f++) {
    gen.fill(win);
    for (let i = 0; i < N; i++) win[i] *= 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N); // Hann
    const p = powerSpectrum(win);
    for (let i = 0; i < p.length; i++) acc[i] += p[i];
  }
  const xs: number[] = [];
  const ys: number[] = [];
  for (let oct = 0; oct < 6; oct++) {
    const lo = 250 * 2 ** oct;
    const hi = lo * 2;
    let sum = 0;
    let cnt = 0;
    for (let i = Math.ceil((lo * N) / sr); i < (hi * N) / sr; i++) {
      sum += acc[i];
      cnt++;
    }
    // power per octave = density × bandwidth (∝ lo), so add 10·log10(lo)
    xs.push(oct);
    ys.push(10 * Math.log10((sum / cnt) * lo));
  }
  const mx = xs.reduce((a, b) => a + b) / xs.length;
  const my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return num / den;
}

describe("noise generators", () => {
  for (const color of NOISE_COLORS) {
    it(`${color} noise has a ${NOISE_SLOPE[color]} dB/octave slope`, () => {
      // Per-octave power slope = density slope + 3 dB (octaves double in width).
      const expected = NOISE_SLOPE[color] + 3;
      expect(octaveSlope(color)).toBeCloseTo(expected, 0);
    });
  }
  it("keeps colours at comparable loudness without clipping", () => {
    for (const color of NOISE_COLORS) {
      const g = createNoise(color, 7);
      const b = new Float32Array(48000 * 4);
      g.fill(b);
      let sum = 0;
      let peak = 0;
      for (const v of b) {
        sum += v * v;
        peak = Math.max(peak, Math.abs(v));
      }
      const rms = Math.sqrt(sum / b.length);
      expect(rms, color).toBeGreaterThan(0.1);
      expect(rms, color).toBeLessThan(0.3);
      expect(peak, color).toBeLessThan(1);
    }
  });
  it("is deterministic per seed and differs between seeds", () => {
    const a = new Float32Array(16);
    const b = new Float32Array(16);
    const c = new Float32Array(16);
    createNoise("white", 1).fill(a);
    createNoise("white", 1).fill(b);
    createNoise("white", 2).fill(c);
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
  });
  it("worklet source registers the processor", () => {
    expect(NOISE_WORKLET_SRC).toContain('registerProcessor("noise-generator"');
    expect(NOISE_WORKLET_SRC).toContain("class NoiseCore");
  });
});
