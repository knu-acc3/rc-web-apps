/**
 * Screen calibration shared by every /actual-size page (and read by what-is-my/dpi).
 *
 * STORAGE CONTRACT — do not change:
 *   key   "actual-size:calibration"
 *   value {"v":1,"pxPerMm":<CSS px per millimetre>,"method":"card"|"diagonal","at":<epoch ms>}
 *
 * The device pixel ratio at calibration time is kept under a separate key so the
 * contract above stays byte-exact; it is only used to notice later zoom changes.
 */

export const STORAGE_KEY = "actual-size:calibration";
export const DPR_KEY = "actual-size:calibration-dpr";
const CHANGE_EVENT = "actual-size:calibration-change";

export const MM_PER_INCH = 25.4;
/** ISO/IEC 7810 ID-1 (bank card): 85.60 × 53.98 mm, corner radius 3.18 mm. */
export const CARD = { w: 85.6, h: 53.98, r: 3.18 } as const;
/** CSS reference pixel: 96 px per inch → 3.7795 px per mm. */
export const DEFAULT_PX_PER_MM = 96 / MM_PER_INCH;
/** Plausible range of CSS px per mm (very low-density TVs … high-zoom phones). */
export const MIN_PX_PER_MM = 1.5;
export const MAX_PX_PER_MM = 15;

export type CalibrationMethod = "card" | "diagonal";

export interface Calibration {
  v: 1;
  pxPerMm: number;
  method: CalibrationMethod;
  at: number;
}

/* ───────────── pure math ───────────── */

/** Card matched on screen: its long side in CSS px → CSS px per mm. */
export function pxPerMmFromCard(cardWidthPx: number, cardWidthMm: number = CARD.w): number {
  return cardWidthPx / cardWidthMm;
}

/**
 * Screen diagonal method. `screenW`/`screenH` are `screen.width/height` (CSS px),
 * `dpr` is `devicePixelRatio`. Physical pixels are rounded, then converted back to CSS px.
 * Only valid when the browser is not zoomed and `screen.*` reports the real panel resolution.
 */
export function pxPerMmFromDiagonal(screenW: number, screenH: number, dpr: number, diagonalInches: number): number {
  const pw = Math.round(screenW * dpr);
  const ph = Math.round(screenH * dpr);
  return Math.sqrt(pw * pw + ph * ph) / (diagonalInches * MM_PER_INCH) / dpr;
}

export const mmToPx = (mm: number, pxPerMm: number): number => mm * pxPerMm;
export const pxToMm = (px: number, pxPerMm: number): number => px / pxPerMm;
/** CSS pixels per inch. */
export const cssPpi = (pxPerMm: number): number => pxPerMm * MM_PER_INCH;
/** Physical (device) pixels per inch. */
export const devicePpi = (pxPerMm: number, dpr: number): number => pxPerMm * MM_PER_INCH * dpr;
/** Screen diagonal in inches implied by a calibration (screen size in CSS px). */
export const screenDiagonalInches = (screenW: number, screenH: number, pxPerMm: number): number =>
  Math.sqrt(screenW * screenW + screenH * screenH) / pxPerMm / MM_PER_INCH;

export function isPlausiblePxPerMm(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= MIN_PX_PER_MM && n <= MAX_PX_PER_MM;
}

/** Calibration taken at `dprAtCalibration` re-expressed for the current device pixel ratio (browser zoom). */
export function adjustForZoom(pxPerMm: number, dprAtCalibration: number, dprNow: number): number {
  if (!(dprAtCalibration > 0) || !(dprNow > 0)) return pxPerMm;
  return (pxPerMm * dprAtCalibration) / dprNow;
}

/** True when the device pixel ratio moved by more than 1 % since calibration. */
export function zoomChanged(dprAtCalibration: number | null, dprNow: number): boolean {
  if (!dprAtCalibration || !(dprNow > 0)) return false;
  return Math.abs(dprAtCalibration - dprNow) / dprNow > 0.01;
}

export function parseCalibration(raw: string | null | undefined): Calibration | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<Calibration>;
    if (!o || o.v !== 1 || !isPlausiblePxPerMm(o.pxPerMm)) return null;
    if (o.method !== "card" && o.method !== "diagonal") return null;
    const at = typeof o.at === "number" && Number.isFinite(o.at) ? o.at : 0;
    return { v: 1, pxPerMm: o.pxPerMm, method: o.method, at };
  } catch {
    return null;
  }
}

export function serializeCalibration(c: Calibration): string {
  return JSON.stringify({ v: 1, pxPerMm: c.pxPerMm, method: c.method, at: c.at });
}

export function parseDprRecord(raw: string | null | undefined, at: number): number | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { at?: unknown; dpr?: unknown };
    return o && o.at === at && typeof o.dpr === "number" && o.dpr > 0 ? o.dpr : null;
  } catch {
    return null;
  }
}

/* ───────────── browser storage (client only) ───────────── */

export function readRaw(): { cal: string | null; dpr: string | null } {
  try {
    return { cal: localStorage.getItem(STORAGE_KEY), dpr: localStorage.getItem(DPR_KEY) };
  } catch {
    return { cal: null, dpr: null };
  }
}

export function readCalibration(): Calibration | null {
  return parseCalibration(readRaw().cal);
}

function notify() {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

/** Save a calibration. Returns the stored record or null if storage is unavailable. */
export function saveCalibration(pxPerMm: number, method: CalibrationMethod): Calibration | null {
  if (!isPlausiblePxPerMm(pxPerMm)) return null;
  const c: Calibration = { v: 1, pxPerMm, method, at: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, serializeCalibration(c));
    localStorage.setItem(DPR_KEY, JSON.stringify({ at: c.at, dpr: window.devicePixelRatio || 1 }));
  } catch {
    return null;
  } finally {
    notify();
  }
  return c;
}

export function clearCalibration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DPR_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

/**
 * Subscribe to calibration changes: this tab (custom event), other tabs (storage event)
 * and zoom / display changes (resize → devicePixelRatio may change).
 */
export function subscribeCalibration(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY || e.key === DPR_KEY) cb();
  };
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", onStorage);
  window.addEventListener("resize", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("resize", cb);
  };
}
