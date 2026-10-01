import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  adjustForZoom,
  CARD,
  clearCalibration,
  cssPpi,
  DEFAULT_PX_PER_MM,
  devicePpi,
  DPR_KEY,
  isPlausiblePxPerMm,
  mmToPx,
  parseCalibration,
  parseDprRecord,
  pxPerMmFromCard,
  pxPerMmFromDiagonal,
  pxToMm,
  readCalibration,
  saveCalibration,
  screenDiagonalInches,
  serializeCalibration,
  STORAGE_KEY,
  subscribeCalibration,
  zoomChanged,
} from "@/sections/actual-size/lib/calibration";

describe("calibration math", () => {
  it("uses the ISO/IEC 7810 ID-1 card and the 96 dpi CSS reference", () => {
    expect(CARD).toEqual({ w: 85.6, h: 53.98, r: 3.18 });
    expect(DEFAULT_PX_PER_MM).toBeCloseTo(3.7795, 4);
    expect(cssPpi(DEFAULT_PX_PER_MM)).toBeCloseTo(96, 10);
    expect(devicePpi(DEFAULT_PX_PER_MM, 2)).toBeCloseTo(192, 10);
  });

  it("card width in px → px per mm", () => {
    expect(pxPerMmFromCard(323.5)).toBeCloseTo(3.7792, 4);
    expect(pxPerMmFromCard(428)).toBeCloseTo(5, 10);
    expect(pxPerMmFromCard(270, CARD.h)).toBeCloseTo(270 / 53.98, 10);
  });

  it("screen diagonal → CSS px per mm", () => {
    // 13.3″ 2560×1600 panel at devicePixelRatio 2 (screen reports 1280×800 CSS px)
    expect(pxPerMmFromDiagonal(1280, 800, 2, 13.3)).toBeCloseTo(4.4682, 4);
    // 24″ Full HD monitor at 100 %
    expect(pxPerMmFromDiagonal(1920, 1080, 1, 24)).toBeCloseTo(3.6137, 4);
    // 15.6″ 1920×1080 laptop at 125 % scaling reports 1536×864 CSS px
    expect(pxPerMmFromDiagonal(1536, 864, 1.25, 15.6)).toBeCloseTo(4.4476, 4);
    // the calibration implies the same diagonal back
    expect(screenDiagonalInches(1280, 800, pxPerMmFromDiagonal(1280, 800, 2, 13.3))).toBeCloseTo(13.3, 6);
  });

  it("converts between millimetres and pixels", () => {
    expect(mmToPx(85.6, DEFAULT_PX_PER_MM)).toBeCloseTo(323.53, 2);
    expect(mmToPx(10, 5)).toBe(50);
    expect(pxToMm(378, 3.78)).toBeCloseTo(100, 10);
    expect(pxToMm(mmToPx(42.67, 4.2), 4.2)).toBeCloseTo(42.67, 10);
  });

  it("re-expresses a calibration for a new zoom level", () => {
    expect(adjustForZoom(4, 1, 1.25)).toBeCloseTo(3.2, 10);
    expect(adjustForZoom(4, 2, 2)).toBe(4);
    expect(zoomChanged(1, 1.25)).toBe(true);
    expect(zoomChanged(2, 2.01)).toBe(false);
    expect(zoomChanged(null, 2)).toBe(false);
  });

  it("rejects implausible values", () => {
    expect(isPlausiblePxPerMm(3.78)).toBe(true);
    expect(isPlausiblePxPerMm(0.5)).toBe(false);
    expect(isPlausiblePxPerMm(40)).toBe(false);
    expect(isPlausiblePxPerMm(Number.NaN)).toBe(false);
    expect(isPlausiblePxPerMm("3.78")).toBe(false);
  });
});

describe("storage contract", () => {
  it("keeps the shared key and JSON shape", () => {
    expect(STORAGE_KEY).toBe("actual-size:calibration");
    expect(serializeCalibration({ v: 1, pxPerMm: 3.78, method: "card", at: 123 })).toBe('{"v":1,"pxPerMm":3.78,"method":"card","at":123}');
  });

  it("parses valid records and rejects broken ones", () => {
    expect(parseCalibration('{"v":1,"pxPerMm":4.2,"method":"diagonal","at":5}')).toEqual({ v: 1, pxPerMm: 4.2, method: "diagonal", at: 5 });
    expect(parseCalibration(null)).toBeNull();
    expect(parseCalibration("{")).toBeNull();
    expect(parseCalibration('{"v":2,"pxPerMm":4.2,"method":"card","at":5}')).toBeNull();
    expect(parseCalibration('{"v":1,"pxPerMm":99,"method":"card","at":5}')).toBeNull();
    expect(parseCalibration('{"v":1,"pxPerMm":4,"method":"ruler","at":5}')).toBeNull();
  });

  it("links the devicePixelRatio record to its calibration", () => {
    expect(parseDprRecord('{"at":5,"dpr":1.5}', 5)).toBe(1.5);
    expect(parseDprRecord('{"at":4,"dpr":1.5}', 5)).toBeNull();
    expect(parseDprRecord("oops", 5)).toBeNull();
  });
});

describe("storage helpers", () => {
  const store = new Map<string, string>();
  const listeners = new Map<string, Set<() => void>>();
  const g = globalThis as unknown as Record<string, unknown>;

  beforeEach(() => {
    store.clear();
    listeners.clear();
    g.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    g.window = {
      devicePixelRatio: 2,
      addEventListener: (t: string, cb: () => void) => listeners.set(t, (listeners.get(t) ?? new Set()).add(cb)),
      removeEventListener: (t: string, cb: () => void) => listeners.get(t)?.delete(cb),
      dispatchEvent: (e: Event) => {
        for (const cb of listeners.get(e.type) ?? []) cb();
        return true;
      },
    };
  });

  afterEach(() => {
    delete g.localStorage;
    delete g.window;
  });

  it("saves, reads, notifies and clears", () => {
    let calls = 0;
    const off = subscribeCalibration(() => calls++);
    const saved = saveCalibration(4.5, "card");
    expect(saved?.pxPerMm).toBe(4.5);
    expect(JSON.parse(store.get(STORAGE_KEY)!)).toEqual({ v: 1, pxPerMm: 4.5, method: "card", at: saved!.at });
    expect(JSON.parse(store.get(DPR_KEY)!)).toEqual({ at: saved!.at, dpr: 2 });
    expect(readCalibration()).toEqual(saved);
    expect(calls).toBe(1);
    clearCalibration();
    expect(readCalibration()).toBeNull();
    expect(calls).toBe(2);
    off();
    saveCalibration(4, "diagonal");
    expect(calls).toBe(2);
  });

  it("refuses implausible values and survives broken storage", () => {
    expect(saveCalibration(0.1, "card")).toBeNull();
    g.localStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(readCalibration()).toBeNull();
    expect(saveCalibration(4, "card")).toBeNull();
    expect(() => clearCalibration()).not.toThrow();
  });
});
