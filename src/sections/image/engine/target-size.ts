/**
 * "Compress to N KB": binary search over encoder quality, then gradual
 * downscaling when even the lowest quality is too big. Pure — the encoder is
 * injected, so the search is unit-testable.
 */

export interface Encoded<T> {
  size: number;
  value: T;
}

export interface QualitySearch<T> {
  /** Best (highest) quality that fits, or the minimum quality when nothing fits. */
  quality: number;
  result: Encoded<T>;
  fits: boolean;
  tries: number;
}

export interface SearchOptions {
  min?: number;
  max?: number;
  signal?: AbortSignal;
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

/**
 * Find the highest integer quality in [min, max] whose encoded size is ≤ target.
 * Assumes size grows (weakly) with quality. Uses ≤ log2(max − min) + 2 encodes.
 */
export async function searchQuality<T>(
  encode: (quality: number) => Promise<Encoded<T>>,
  targetBytes: number,
  { min = 5, max = 92, signal }: SearchOptions = {},
): Promise<QualitySearch<T>> {
  let tries = 0;
  const run = async (q: number) => {
    checkAbort(signal);
    tries++;
    return encode(q);
  };
  const top = await run(max);
  if (top.size <= targetBytes) return { quality: max, result: top, fits: true, tries };
  const bottom = await run(min);
  if (bottom.size > targetBytes) return { quality: min, result: bottom, fits: false, tries };
  let lo = min; // fits
  let loRes = bottom;
  let hi = max; // does not fit
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const res = await run(mid);
    if (res.size <= targetBytes) {
      lo = mid;
      loRes = res;
    } else hi = mid;
  }
  return { quality: lo, result: loRes, fits: true, tries };
}

/**
 * Next scale factor when the image doesn't fit even at minimum quality.
 * Encoded size is roughly proportional to the pixel count, so the linear
 * scale shrinks by √(target/size) with a safety margin.
 */
export function nextScale(scale: number, size: number, targetBytes: number): number {
  const ratio = Math.sqrt(targetBytes / Math.max(1, size));
  return scale * Math.min(0.9, Math.max(0.3, ratio * 0.92));
}

export interface FitResult<T> extends QualitySearch<T> {
  scale: number;
}

/**
 * Fit an image under `targetBytes`: quality search at scale 1; if nothing fits,
 * shrink and search again (up to `maxRounds`). `encodeAt(scale, q)` encodes the
 * image downscaled by `scale` at quality `q`.
 */
export async function fitToSize<T>(
  encodeAt: (scale: number, quality: number) => Promise<Encoded<T>>,
  targetBytes: number,
  opts: SearchOptions & { maxRounds?: number; minQuality?: number; allowDownscale?: boolean; minPixels?: number; srcPixels?: number } = {},
): Promise<FitResult<T>> {
  const { maxRounds = 8, allowDownscale = true } = opts;
  // Below this quality JPEG artefacts get ugly; prefer shrinking instead.
  const floor = opts.minQuality ?? 40;
  let scale = 1;
  let tries = 0;
  let res = await searchQuality((q) => encodeAt(scale, q), targetBytes, { ...opts, min: floor });
  tries += res.tries;
  if (res.fits || !allowDownscale) {
    if (!res.fits) {
      // last resort without downscaling: the lowest quality
      const low = await searchQuality((q) => encodeAt(scale, q), targetBytes, { ...opts, min: opts.min ?? 5, max: floor });
      tries += low.tries;
      return { ...low, tries, scale };
    }
    return { ...res, tries, scale };
  }
  for (let round = 0; round < maxRounds && !res.fits; round++) {
    scale = nextScale(scale, res.result.size, targetBytes);
    if (opts.srcPixels && opts.srcPixels * scale * scale < (opts.minPixels ?? 64 * 64)) break;
    res = await searchQuality((q) => encodeAt(scale, q), targetBytes, { ...opts, min: floor });
    tries += res.tries;
  }
  return { ...res, tries, scale };
}
