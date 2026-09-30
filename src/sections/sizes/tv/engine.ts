/**
 * TV size & viewing distance (16:9 screens).
 *  - SMPTE EG-18: the screen should fill at least ~30° of the horizontal field of view;
 *  - THX: about 40° for a cinema-like picture;
 *  - visual acuity: 20/20 vision resolves ~1 arcminute; beyond that distance single pixels merge,
 *    so a higher resolution brings no visible extra detail.
 * These are guidelines, not rules.
 */

const DEG = Math.PI / 180;
export const CM_PER_INCH = 2.54;

/** Width and height (inches) of a screen with the given diagonal and aspect ratio. */
export function screenDims(diagIn: number, rw = 16, rh = 9): [number, number] {
  const k = diagIn / Math.hypot(rw, rh);
  return [rw * k, rh * k];
}

/** Viewing distance (m) at which the screen width fills `angleDeg` of the horizontal field of view. */
export function distanceForAngle(diagIn: number, angleDeg: number): number {
  const [w] = screenDims(diagIn);
  return (w * CM_PER_INCH) / 100 / (2 * Math.tan((angleDeg / 2) * DEG));
}

/** Diagonal (inches) that fills `angleDeg` at a distance in metres. */
export function diagonalForAngle(distanceM: number, angleDeg: number): number {
  const widthIn = (distanceM * 100 * 2 * Math.tan((angleDeg / 2) * DEG)) / CM_PER_INCH;
  return widthIn * (Math.hypot(16, 9) / 16);
}

/** Distance (m) beyond which a 20/20 eye can't resolve pixels of a resolution with `rows` lines. */
export function acuityDistance(diagIn: number, rows: number): number {
  const [, h] = screenDims(diagIn);
  const pitchM = (h * CM_PER_INCH) / 100 / rows;
  return pitchM / Math.tan(DEG / 60);
}

/** Diagonal (inches) at which pixels of `rows`-line resolution stop being resolvable at a distance. */
export function diagonalForAcuity(distanceM: number, rows: number): number {
  const one = acuityDistance(1, rows);
  return distanceM / one;
}

export interface TvDistances {
  smpte: number;
  thx: number;
  hd: number;
  fhd: number;
  uhd: number;
  uhd8: number;
}

export function tvDistances(diagIn: number): TvDistances {
  return {
    smpte: distanceForAngle(diagIn, 30),
    thx: distanceForAngle(diagIn, 40),
    hd: acuityDistance(diagIn, 720),
    fhd: acuityDistance(diagIn, 1080),
    uhd: acuityDistance(diagIn, 2160),
    uhd8: acuityDistance(diagIn, 4320),
  };
}

export const TV_SIZES = [24, 32, 40, 42, 43, 48, 50, 55, 58, 65, 70, 75, 77, 83, 85, 98, 100];
