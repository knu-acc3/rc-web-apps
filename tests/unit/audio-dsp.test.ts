import { describe, expect, it } from "vitest";
import {
  applyFades,
  applyGain,
  changeSpeed,
  concatChannels,
  normalizeGain,
  peak,
  pitchShift,
  remix,
  resampleChannel,
  reverseChannels,
  timeStretch,
  waveformPeaks,
} from "@/sections/audio/lib/dsp";
import { decodeWav, encodeWav } from "@/sections/audio/lib/wav";

const SR = 16000;
function sine(freq: number, seconds: number, sr = SR, amp = 0.5): Float32Array {
  const n = Math.round(seconds * sr);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin((2 * Math.PI * freq * i) / sr);
  return out;
}

/** Frequency estimate from positive-going zero crossings in the middle part of a signal. */
function zeroCrossFreq(x: Float32Array, sr: number): number {
  const a = Math.floor(x.length * 0.2);
  const b = Math.floor(x.length * 0.8);
  let first = -1;
  let last = -1;
  let count = 0;
  for (let i = a + 1; i < b; i++) {
    if (x[i - 1] < 0 && x[i] >= 0) {
      if (first < 0) first = i;
      last = i;
      count++;
    }
  }
  return ((count - 1) * sr) / (last - first);
}

describe("dsp basics", () => {
  it("gain, peak and normalisation", () => {
    const ch = [sine(440, 0.1)];
    expect(peak(ch)).toBeCloseTo(0.5, 2);
    const g = normalizeGain(ch, -1);
    applyGain(ch, g);
    expect(20 * Math.log10(peak(ch))).toBeCloseTo(-1, 1);
    const clipped = applyGain(ch, 4);
    expect(clipped).toBeGreaterThan(0);
    expect(peak(ch)).toBeLessThanOrEqual(1);
  });
  it("fades start and end at silence", () => {
    const ch = [new Float32Array(1000).fill(1)];
    applyFades(ch, 1000, 0.1, 0.2);
    expect(ch[0][0]).toBe(0);
    expect(ch[0][999]).toBe(0);
    expect(ch[0][500]).toBe(1);
    expect(ch[0][50]).toBeGreaterThan(0);
    expect(ch[0][50]).toBeLessThan(1);
  });
  it("reverses and remixes", () => {
    const ch = [new Float32Array([1, 2, 3]), new Float32Array([3, 2, 1])];
    reverseChannels(ch);
    expect(Array.from(ch[0])).toEqual([3, 2, 1]);
    expect(Array.from(remix(ch, 1)[0])).toEqual([2, 2, 2]);
    expect(remix([new Float32Array([1])], 2)).toHaveLength(2);
  });
  it("concatenates with an equal-power crossfade", () => {
    const a = [new Float32Array(100).fill(0.5)];
    const b = [new Float32Array(100).fill(0.5)];
    expect(concatChannels([a, b], 0)[0]).toHaveLength(200);
    const x = concatChannels([a, b], 20)[0];
    expect(x).toHaveLength(180);
    // equal-power crossfade of identical (correlated) signals rises to ~0.5·√2 in the middle
    expect(x[90]).toBeGreaterThan(0.5);
    expect(x[90]).toBeLessThan(0.75);
    expect(x[0]).toBeCloseTo(0.5);
    expect(x[179]).toBeCloseTo(0.5);
  });
  it("computes waveform peaks", () => {
    const p = waveformPeaks([sine(100, 1)], 10);
    expect(p).toHaveLength(20);
    expect(p[1]).toBeGreaterThan(0.45);
    expect(p[0]).toBeLessThan(-0.45);
  });
});

describe("resampling", () => {
  it("keeps the frequency when changing the sample rate", () => {
    const x = sine(1000, 0.5, 44100);
    const y = resampleChannel(x, 48000 / 44100);
    expect(y.length).toBe(Math.round(x.length * (48000 / 44100)));
    expect(zeroCrossFreq(y, 48000)).toBeCloseTo(1000, -1);
  });
  it("tape-style speed change moves the pitch", () => {
    const x = sine(400, 1);
    const y = changeSpeed([x], SR, 2, false)[0];
    expect(y.length).toBe(x.length / 2);
    expect(zeroCrossFreq(y, SR)).toBeCloseTo(800, -1);
  });
});

describe("time stretching (WSOLA)", () => {
  it("changes duration but keeps pitch", () => {
    const x = sine(440, 1);
    const fast = timeStretch([x], SR, 1.5)[0];
    expect(fast.length).toBe(Math.round(x.length / 1.5));
    expect(Math.abs(zeroCrossFreq(fast, SR) - 440)).toBeLessThan(10);
    const slow = timeStretch([x], SR, 0.5)[0];
    expect(slow.length).toBe(x.length * 2);
    expect(Math.abs(zeroCrossFreq(slow, SR) - 440)).toBeLessThan(10);
  });
  it("pitch shift keeps duration and moves the pitch by semitones", () => {
    const x = sine(440, 1);
    const up = pitchShift([x], SR, 12)[0];
    expect(Math.abs(up.length - x.length)).toBeLessThanOrEqual(2);
    expect(Math.abs(zeroCrossFreq(up, SR) - 880)).toBeLessThan(20);
  });
});

describe("wav", () => {
  it("round-trips 16-bit PCM", () => {
    const ch = [sine(440, 0.05, 8000), sine(220, 0.05, 8000)];
    const file = encodeWav(ch, 8000, 16);
    expect(String.fromCharCode(...file.slice(0, 4))).toBe("RIFF");
    const back = decodeWav(file);
    expect(back.sampleRate).toBe(8000);
    expect(back.channels).toHaveLength(2);
    for (let i = 0; i < ch[0].length; i += 37) expect(back.channels[1][i]).toBeCloseTo(ch[1][i], 3);
  });
  it("round-trips float WAV", () => {
    const ch = [sine(1000, 0.01, 48000)];
    const back = decodeWav(encodeWav(ch, 48000, 32));
    expect(back.channels[0][10]).toBeCloseTo(ch[0][10], 6);
  });
});
