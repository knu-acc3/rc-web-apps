/**
 * GIF maths: output size, frame timing (GIF delays are in 1/100 s), palette sampling.
 * Pure functions, unit-tested.
 */

/** Browsers clamp GIF frame delays below 2 cs (20 ms) to 10 cs, so 50 fps is the real maximum. */
const GIF_MAX_FPS = 50;
export const GIF_MIN_DELAY_CS = 2;

/** Output size for a GIF: keep aspect ratio, never upscale, at least 16 px. */
export function gifSize(srcWidth: number, srcHeight: number, maxWidth: number): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0) return { width: 0, height: 0 };
  const width = Math.max(16, Math.min(Math.round(maxWidth), Math.round(srcWidth)));
  const height = Math.max(1, Math.round((srcHeight * width) / srcWidth));
  return { width, height };
}

/** Number of frames sampled from [start, end) at `fps`. */
export function gifFrameCount(duration: number, fps: number): number {
  if (!(duration > 0) || !(fps > 0)) return 0;
  return Math.max(1, Math.ceil(duration * fps - 1e-9));
}

/** Sample timestamps (seconds) for a range at `fps`, frame centres snapped to the grid. */
export function gifTimestamps(start: number, end: number, fps: number): number[] {
  const n = gifFrameCount(end - start, fps);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(start + i / fps);
  return out;
}

/**
 * Per-frame delays in centiseconds for `count` frames at `fps`.
 * Uses accumulated rounding so the total length stays exact (30 fps → 3,3,4,3,3,4 …)
 * and never goes below the 2 cs browser minimum.
 */
export function gifDelays(fps: number, count: number): number[] {
  const f = Math.min(Math.max(fps, 0.1), GIF_MAX_FPS);
  const delays: number[] = [];
  let prev = 0;
  for (let i = 1; i <= count; i++) {
    const t = Math.round((i * 100) / f);
    delays.push(Math.max(GIF_MIN_DELAY_CS, t - prev));
    prev = t;
  }
  return delays;
}

/** Indices of up to `samples` frames spread evenly over `count` frames (for a global palette). */
export function paletteSampleIndices(count: number, samples: number): number[] {
  if (count <= 0 || samples <= 0) return [];
  if (count <= samples) return Array.from({ length: count }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < samples; i++) out.push(Math.min(count - 1, Math.round(((i + 0.5) * count) / samples - 0.5)));
  return [...new Set(out)];
}

/**
 * Take every `step`-th pixel of an RGBA buffer (for fast palette quantisation of
 * several frames combined). Returns a new RGBA buffer.
 */
export function subsampleRgba(data: Uint8Array | Uint8ClampedArray, step: number): Uint8Array {
  const s = Math.max(1, Math.floor(step));
  const pixels = Math.floor(data.length / 4);
  const n = Math.ceil(pixels / s);
  const out = new Uint8Array(n * 4);
  for (let i = 0, j = 0; i < pixels; i += s, j += 4) {
    const k = i * 4;
    out[j] = data[k];
    out[j + 1] = data[k + 1];
    out[j + 2] = data[k + 2];
    out[j + 3] = data[k + 3];
  }
  return out;
}

/** Total pixels that will be quantised and encoded (for memory/time warnings). */
export function gifWorkload(width: number, height: number, frames: number): number {
  return width * height * frames;
}

/** Above this many pixels in total a GIF gets very large and slow; suggest MP4/WebM. */
export const GIF_HEAVY_PIXELS = 150e6;
