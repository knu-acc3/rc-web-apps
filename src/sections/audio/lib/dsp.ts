/**
 * Offline audio processing on planar Float32 channels (pure functions, no Web Audio).
 * Runs inside the media worker; unit-tested in Node.
 */

export type Channels = Float32Array[];

export function frames(ch: Channels): number {
  return ch[0]?.length ?? 0;
}

/** Copy a range of samples [from, to). */
export function sliceChannels(ch: Channels, from: number, to: number): Channels {
  const a = Math.max(0, Math.min(from, frames(ch)));
  const b = Math.max(a, Math.min(to, frames(ch)));
  return ch.map((c) => c.slice(a, b));
}

/** Absolute peak over all channels. */
export function peak(ch: Channels): number {
  let p = 0;
  for (const c of ch) for (let i = 0; i < c.length; i++) {
    const v = Math.abs(c[i]);
    if (v > p) p = v;
  }
  return p;
}

/** RMS over all channels. */
export function rmsOf(ch: Channels): number {
  let sum = 0;
  let n = 0;
  for (const c of ch) {
    for (let i = 0; i < c.length; i++) sum += c[i] * c[i];
    n += c.length;
  }
  return n ? Math.sqrt(sum / n) : 0;
}

export const dbToGain = (db: number) => Math.pow(10, db / 20);
export const gainToDb = (g: number) => (g > 0 ? 20 * Math.log10(g) : -Infinity);

/** Multiply in place; returns the number of samples that had to be clipped to ±1. */
export function applyGain(ch: Channels, gain: number, limit = true): number {
  let clipped = 0;
  for (const c of ch) for (let i = 0; i < c.length; i++) {
    let v = c[i] * gain;
    if (limit && (v > 1 || v < -1)) {
      clipped++;
      v = v > 1 ? 1 : -1;
    }
    c[i] = v;
  }
  return clipped;
}

/** Gain that brings the peak to `targetDb` dBFS (e.g. −1). Returns 1 for silence. */
export function normalizeGain(ch: Channels, targetDb: number): number {
  const p = peak(ch);
  return p > 0 ? dbToGain(targetDb) / p : 1;
}

/** Gain that brings the RMS level to `targetDb` dBFS. */
export function rmsNormalizeGain(ch: Channels, targetDb: number): number {
  const r = rmsOf(ch);
  return r > 0 ? dbToGain(targetDb) / r : 1;
}

export type FadeCurve = "linear" | "exp" | "equal-power";

function curve(x: number, kind: FadeCurve): number {
  if (kind === "linear") return x;
  if (kind === "equal-power") return Math.sin((x * Math.PI) / 2);
  return x * x; // perceptually smoother "exponential-like" fade
}

/** Fade in/out in place (seconds). */
export function applyFades(ch: Channels, sampleRate: number, fadeIn: number, fadeOut: number, kind: FadeCurve = "equal-power"): void {
  const n = frames(ch);
  const fi = Math.min(n, Math.round(fadeIn * sampleRate));
  const fo = Math.min(n, Math.round(fadeOut * sampleRate));
  for (const c of ch) {
    for (let i = 0; i < fi; i++) c[i] *= curve(i / fi, kind);
    for (let i = 0; i < fo; i++) c[n - 1 - i] *= curve(i / fo, kind);
  }
}

/** Reverse in place. */
export function reverseChannels(ch: Channels): void {
  for (const c of ch) c.reverse();
}

/** Mix down/up to `count` channels (1 or 2). */
export function remix(ch: Channels, count: number): Channels {
  if (ch.length === count || ch.length === 0) return ch;
  const n = frames(ch);
  if (count === 1) {
    const m = new Float32Array(n);
    for (const c of ch) for (let i = 0; i < n; i++) m[i] += c[i] / ch.length;
    return [m];
  }
  if (ch.length === 1) return Array.from({ length: count }, () => ch[0].slice());
  // more channels → stereo: keep first two
  return ch.slice(0, count).map((c) => c.slice());
}

/**
 * Concatenate clips (same sample rate and channel count) with an optional
 * equal-power crossfade of `crossfade` samples between neighbours.
 */
export function concatChannels(clips: Channels[], crossfade = 0): Channels {
  const count = Math.max(...clips.map((c) => c.length));
  const norm = clips.map((c) => remix(c, count));
  let total = 0;
  norm.forEach((c, i) => {
    total += frames(c);
    if (i > 0) total -= Math.min(crossfade, frames(c), frames(norm[i - 1]));
  });
  const out = Array.from({ length: count }, () => new Float32Array(Math.max(0, total)));
  let pos = 0;
  norm.forEach((clip, idx) => {
    const n = frames(clip);
    const x = idx > 0 ? Math.min(crossfade, n, frames(norm[idx - 1])) : 0;
    const start = pos - x;
    for (let c = 0; c < count; c++) {
      const src = clip[c];
      const dst = out[c];
      for (let i = 0; i < n; i++) {
        if (i < x) {
          const t = (i + 0.5) / x;
          // previous clip was written at full level; bend it down and add this one.
          dst[start + i] = dst[start + i] * Math.cos((t * Math.PI) / 2) + src[i] * Math.sin((t * Math.PI) / 2);
        } else {
          dst[start + i] = src[i];
        }
      }
    }
    pos = start + n;
  });
  return out;
}

/* ───────────── resampling (windowed sinc) ───────────── */

const TAPS = 16; // half-width in input samples at cutoff 1
const TABLE_RES = 256;
let sincTable: Float32Array | null = null;

function kernelTable(): Float32Array {
  if (sincTable) return sincTable;
  const n = TAPS * TABLE_RES + 1;
  const t = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / TABLE_RES;
    const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
    // Blackman window over [-TAPS, TAPS]
    const w = 0.42 + 0.5 * Math.cos((Math.PI * x) / TAPS) + 0.08 * Math.cos((2 * Math.PI * x) / TAPS);
    t[i] = sinc * w;
  }
  sincTable = t;
  return t;
}

/**
 * Resample one channel so that `ratio` output samples are produced per input sample
 * (ratio = outRate / inRate). Band-limited: when downsampling the cut-off is lowered.
 */
export function resampleChannel(input: Float32Array, ratio: number): Float32Array {
  if (ratio === 1) return input.slice();
  const table = kernelTable();
  const outLen = Math.max(0, Math.round(input.length * ratio));
  const out = new Float32Array(outLen);
  const cutoff = Math.min(1, ratio);
  const half = TAPS / cutoff;
  const step = cutoff * TABLE_RES;
  const last = input.length - 1;
  for (let i = 0; i < outLen; i++) {
    const x = i / ratio;
    const j0 = Math.ceil(x - half);
    const j1 = Math.floor(x + half);
    let acc = 0;
    let wsum = 0;
    for (let j = j0; j <= j1; j++) {
      const d = Math.abs(x - j) * step;
      const k = d | 0;
      if (k >= table.length - 1) continue;
      const w = table[k] + (table[k + 1] - table[k]) * (d - k);
      const s = j < 0 ? 0 : j > last ? 0 : input[j];
      acc += s * w;
      wsum += w;
    }
    out[i] = wsum !== 0 ? acc / wsum : 0;
  }
  return out;
}

export function resample(ch: Channels, fromRate: number, toRate: number): Channels {
  if (fromRate === toRate) return ch;
  return ch.map((c) => resampleChannel(c, toRate / fromRate));
}

/* ───────────── time stretching (WSOLA) ───────────── */

/**
 * Change tempo without changing pitch (WSOLA). `tempo` > 1 makes the audio faster
 * (shorter), < 1 slower. Channels share the same alignment so stereo stays coherent.
 */
export function timeStretch(ch: Channels, sampleRate: number, tempo: number): Channels {
  if (tempo === 1 || frames(ch) === 0) return ch.map((c) => c.slice());
  const n = frames(ch);
  const N = Math.max(256, Math.round(sampleRate * 0.04) & ~1); // 40 ms frames
  const Hs = N / 2;
  const Ha = Hs * tempo;
  const tol = Math.round(sampleRate * 0.012); // ±12 ms search
  const outLen = Math.max(1, Math.round(n / tempo));
  const out = ch.map(() => new Float32Array(outLen + N));
  const norm = new Float32Array(outLen + N);

  // Mono guide signal, decimated for a cheap coarse search.
  const D = 8;
  const mono = new Float32Array(n);
  for (const c of ch) for (let i = 0; i < n; i++) mono[i] += c[i];
  const dec = new Float32Array(Math.ceil(n / D));
  for (let i = 0; i < dec.length; i++) {
    let s = 0;
    const b = i * D;
    for (let k = 0; k < D && b + k < n; k++) s += mono[b + k];
    dec[i] = s;
  }

  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);

  const corr = (sig: Float32Array, a: number, b: number, len: number, stride: number) => {
    let s = 0;
    for (let i = 0; i < len; i += stride) {
      const x = a + i;
      const y = b + i;
      if (x < 0 || y < 0 || x >= sig.length || y >= sig.length) continue;
      s += sig[x] * sig[y];
    }
    return s;
  };

  let prev = 0; // input position of the previously used frame
  for (let k = 0; ; k++) {
    const outPos = k * Hs;
    if (outPos >= outLen) break;
    const nominal = Math.round(k * Ha);
    let best = nominal;
    if (k > 0) {
      const natural = prev + Hs;
      // coarse search on decimated signal
      const lo = Math.max(0, nominal - tol);
      const hi = Math.min(n - N, nominal + tol);
      let bestScore = -Infinity;
      const nd = Math.floor(N / D);
      for (let p = lo; p <= hi; p += D) {
        const sc = corr(dec, Math.floor(natural / D), Math.floor(p / D), nd, 1);
        if (sc > bestScore) {
          bestScore = sc;
          best = p;
        }
      }
      // refine around the coarse optimum on full resolution (every 2nd sample)
      const rlo = Math.max(0, best - D);
      const rhi = Math.min(n - N, best + D);
      bestScore = -Infinity;
      for (let p = rlo; p <= rhi; p++) {
        const sc = corr(mono, natural, p, N, 2);
        if (sc > bestScore) {
          bestScore = sc;
          best = p;
        }
      }
      if (hi < lo) best = Math.min(Math.max(0, nominal), Math.max(0, n - 1));
    }
    for (let c = 0; c < ch.length; c++) {
      const src = ch[c];
      const dst = out[c];
      for (let i = 0; i < N; i++) {
        const si = best + i;
        const v = si < n ? src[si] : 0;
        dst[outPos + i] += v * win[i];
      }
    }
    for (let i = 0; i < N; i++) norm[outPos + i] += win[i];
    prev = best;
  }
  return out.map((c) => {
    const r = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) r[i] = norm[i] > 1e-3 ? c[i] / norm[i] : c[i];
    return r;
  });
}

/**
 * Change speed. keepPitch → WSOLA time-stretch; otherwise resample like a tape
 * (pitch moves with speed).
 */
export function changeSpeed(ch: Channels, sampleRate: number, factor: number, keepPitch: boolean): Channels {
  if (factor === 1) return ch;
  return keepPitch ? timeStretch(ch, sampleRate, factor) : ch.map((c) => resampleChannel(c, 1 / factor));
}

/** Shift pitch by `semitones` keeping the duration (stretch + resample). */
export function pitchShift(ch: Channels, sampleRate: number, semitones: number): Channels {
  if (semitones === 0) return ch;
  const r = Math.pow(2, semitones / 12);
  const stretched = timeStretch(ch, sampleRate, 1 / r); // longer by r
  return stretched.map((c) => resampleChannel(c, 1 / r)); // back to original length, pitch × r
}

/* ───────────── waveform ───────────── */

/**
 * Min/max pairs for `buckets` columns over the whole signal (all channels merged).
 * Result length = buckets × 2: [min0, max0, min1, max1, …].
 */
export function waveformPeaks(ch: Channels, buckets: number, from = 0, to = frames(ch)): Float32Array {
  const out = new Float32Array(buckets * 2);
  const len = Math.max(0, to - from);
  if (!len || !buckets) return out;
  const per = len / buckets;
  for (let b = 0; b < buckets; b++) {
    const a = from + Math.floor(b * per);
    const e = Math.min(to, from + Math.max(Math.floor((b + 1) * per), Math.floor(b * per) + 1));
    let mn = 0;
    let mx = 0;
    // For long buckets sample at most ~2000 points (fast, visually identical).
    const stride = Math.max(1, Math.floor((e - a) / 2000));
    for (const c of ch) for (let i = a; i < e; i += stride) {
      const v = c[i];
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    out[b * 2] = mn;
    out[b * 2 + 1] = mx;
  }
  return out;
}
