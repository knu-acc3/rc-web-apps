/**
 * Coloured-noise generators. The same plain-JS source runs inside the AudioWorklet
 * (continuous generation — no looping buffer, so no periodic click) and in unit tests.
 *
 * Spectral slopes (power per octave): white 0 dB, pink −3 dB, brown −6 dB,
 * blue +3 dB, violet +6 dB.
 */

export type NoiseColor = "white" | "pink" | "brown" | "blue" | "violet";
export const NOISE_COLORS: readonly NoiseColor[] = ["white", "pink", "brown", "blue", "violet"];

/**
 * The generator. Plain code with no imports or closures: the AudioWorklet module gets its source text
 * (`NoiseCore.toString()`), so the same class runs in the worklet, on the main thread and in tests — and no
 * `eval`/`new Function` is needed (the Content Security Policy forbids them).
 */
class NoiseCore {
  // `declare`: no class-field code is emitted, so the compiled class needs no helpers outside its own text.
  declare s: number;
  declare color: NoiseColor;
  declare b0: number;
  declare b1: number;
  declare b2: number;
  declare b3: number;
  declare b4: number;
  declare b5: number;
  declare b6: number;
  declare brown: number;
  declare prevW: number;
  declare prevP: number;

  constructor(color: NoiseColor, seed: number) {
    this.s = (seed >>> 0) || 0x9e3779b9;
    this.setColor(color);
  }
  setColor(color: NoiseColor) {
    this.color = color;
    this.b0 = this.b1 = this.b2 = this.b3 = this.b4 = this.b5 = this.b6 = 0;
    this.brown = 0;
    this.prevW = 0;
    this.prevP = 0;
  }
  rand() {
    // xorshift32 → uniform in [-1, 1)
    let x = this.s;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.s = x >>> 0;
    return this.s / 2147483648 - 1;
  }
  pink(w: number): number {
    // Paul Kellet's refined pink filter (accurate to ±0.05 dB above 9.2 Hz at 44.1 kHz)
    this.b0 = 0.99886 * this.b0 + w * 0.0555179;
    this.b1 = 0.99332 * this.b1 + w * 0.0750759;
    this.b2 = 0.969 * this.b2 + w * 0.153852;
    this.b3 = 0.8665 * this.b3 + w * 0.3104856;
    this.b4 = 0.55 * this.b4 + w * 0.5329522;
    this.b5 = -0.7616 * this.b5 - w * 0.016898;
    const out = this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + w * 0.5362;
    this.b6 = w * 0.115926;
    return out * 0.11;
  }
  next(): number {
    const w = this.rand();
    switch (this.color) {
      case "pink":
        return this.pink(w);
      case "brown": {
        // Leaky integrator: −6 dB/octave above ~15 Hz, no DC drift.
        this.brown = 0.998 * this.brown + 0.002 * w;
        return this.brown * 10;
      }
      case "blue": {
        // Differentiated pink noise: +3 dB/octave.
        const p = this.pink(w);
        const out = p - this.prevP;
        this.prevP = p;
        return out * 1.4;
      }
      case "violet": {
        // Differentiated white noise: +6 dB/octave.
        const out = w - this.prevW;
        this.prevW = w;
        return out * 0.25;
      }
      default:
        return w * 0.35;
    }
  }
  fill(arr: Float32Array) {
    for (let i = 0; i < arr.length; i++) arr[i] = this.next();
  }
}

/** AudioWorklet module source: stereo noise with independent channels. */
// A class expression bound to the name: the minifier may rename the class itself.
export const NOISE_WORKLET_SRC = `const NoiseCore = (${NoiseCore.toString()});
class NoiseProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    const seed = (o.seed >>> 0) || 1;
    this.l = new NoiseCore(o.color || "white", seed);
    this.r = new NoiseCore(o.color || "white", (Math.imul(seed, 2654435761) ^ 0x5bd1e995) >>> 0);
    this.port.onmessage = (e) => {
      if (e.data && e.data.color) {
        this.l.setColor(e.data.color);
        this.r.setColor(e.data.color);
      }
    };
  }
  process(inputs, outputs) {
    const out = outputs[0];
    if (out[0]) this.l.fill(out[0]);
    if (out[1]) this.r.fill(out[1]);
    return true;
  }
}
registerProcessor("noise-generator", NoiseProcessor);
`;

/** Instantiate the generator on the main thread (tests, ScriptProcessor fallback). */
export function createNoise(color: NoiseColor, seed: number): NoiseCore {
  return new NoiseCore(color, seed);
}

/** Spectral slope of each colour in dB per octave. */
export const NOISE_SLOPE: Record<NoiseColor, number> = { white: 0, pink: -3, brown: -6, blue: 3, violet: 6 };
