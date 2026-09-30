import { describe, expect, it } from "vitest";
import { isClipping, meterFraction, noiseFloor, noiseRating, rmsPeak, toDbfs } from "@/sections/test/lib/audio-level";
import { CHATTER_MS, driftVerdict, estimatePollingRate, isChatter, nearestPollingRate, stickMagnitude } from "@/sections/test/lib/input-stats";
import { KEYBOARD, KEYBOARD_HEIGHT, KEYBOARD_WIDTH } from "@/sections/test/lib/keyboard-layout";
import { median, percentile, stdDev } from "@/sections/test/lib/stats";

describe("audio levels", () => {
  it("full-scale sine: RMS −3.01 dBFS, peak 0 dBFS", () => {
    const n = 4800;
    const s = Float32Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * i * 10) / n));
    const { rms, peak } = rmsPeak(s);
    expect(toDbfs(rms)).toBeCloseTo(-3.0103, 3);
    expect(toDbfs(peak)).toBeCloseTo(0, 3);
    expect(isClipping(peak)).toBe(true);
  });

  it("converts amplitudes to dBFS", () => {
    expect(toDbfs(0.1)).toBeCloseTo(-20, 10);
    expect(toDbfs(0.01)).toBeCloseTo(-40, 10);
    expect(toDbfs(0)).toBe(-100);
    expect(isClipping(0.5)).toBe(false);
  });

  it("meter position", () => {
    expect(meterFraction(-60)).toBe(0);
    expect(meterFraction(-30)).toBe(0.5);
    expect(meterFraction(3)).toBe(1);
  });

  it("noise floor is the 10th percentile of recent RMS", () => {
    const hist = [...Array(90).fill(-20), ...Array(10).fill(-65)];
    expect(noiseFloor(hist)).toBeCloseTo(-20 - 45 * 0.1, 6);
    expect(noiseFloor(Array(100).fill(-58))).toBe(-58);
    expect(noiseFloor([-50])).toBeNull();
    expect(noiseRating(-65)).toBe("excellent");
    expect(noiseRating(-55)).toBe("good");
    expect(noiseRating(-45)).toBe("fair");
    expect(noiseRating(-30)).toBe("noisy");
  });
});

describe("mouse", () => {
  it("estimates polling rate from timestamps", () => {
    const ts1000 = Array.from({ length: 200 }, (_, i) => i * 1);
    expect(estimatePollingRate(ts1000)).toBeCloseTo(1000, 6);
    const ts125 = Array.from({ length: 60 }, (_, i) => i * 8);
    expect(estimatePollingRate(ts125)).toBeCloseTo(125, 6);
    expect(estimatePollingRate([0, 1, 2])).toBeNull();
  });

  it("ignores duplicate timestamps and snaps to standard rates", () => {
    const ts = Array.from({ length: 100 }, (_, i) => Math.floor(i / 2) * 2); // pairs with equal stamps
    expect(estimatePollingRate(ts)).toBeCloseTo(500, 6);
    expect(nearestPollingRate(950)).toBe(1000);
    expect(nearestPollingRate(480)).toBe(500);
    expect(nearestPollingRate(140)).toBe(125);
  });

  it("flags switch chatter", () => {
    expect(isChatter(12)).toBe(true);
    expect(isChatter(CHATTER_MS)).toBe(false);
    expect(isChatter(150)).toBe(false);
  });
});

describe("gamepad", () => {
  it("stick magnitude and drift verdict", () => {
    expect(stickMagnitude(0.03, 0.04)).toBeCloseTo(0.05, 10);
    expect(stickMagnitude(1, 1)).toBe(1);
    expect(driftVerdict(0.02)).toBe("none");
    expect(driftVerdict(0.08)).toBe("minor");
    expect(driftVerdict(0.3)).toBe("drift");
  });
});

describe("stats helpers", () => {
  it("median, percentile, std-dev", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([0, 10], 10)).toBe(1);
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });
});

describe("keyboard layout", () => {
  it("has unique codes and ~104 keys", () => {
    const codes = KEYBOARD.map((k) => k.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBeGreaterThanOrEqual(104);
    for (const c of ["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "NumpadEnter", "Enter", "Space"])
      expect(codes).toContain(c);
  });

  it("keys fit the frame and do not overlap", () => {
    for (const k of KEYBOARD) {
      expect(k.x + k.w).toBeLessThanOrEqual(KEYBOARD_WIDTH + 1e-9);
      expect(k.y + k.h).toBeLessThanOrEqual(KEYBOARD_HEIGHT + 1e-9);
    }
    for (let i = 0; i < KEYBOARD.length; i++)
      for (let j = i + 1; j < KEYBOARD.length; j++) {
        const a = KEYBOARD[i];
        const b = KEYBOARD[j];
        const overlap = a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;
        expect(overlap, `${a.code} overlaps ${b.code}`).toBe(false);
      }
  });

  it("main block rows are 15 units wide", () => {
    const right = (code: string) => {
      const k = KEYBOARD.find((x) => x.code === code)!;
      return k.x + k.w;
    };
    for (const c of ["F12", "Backspace", "Backslash", "Enter", "ShiftRight", "ControlRight"]) expect(right(c), c).toBeCloseTo(15, 9);
  });

  it("has Russian labels for all 33 letters", () => {
    const ru = KEYBOARD.map((k) => k.ru).filter((x): x is string => !!x && /[А-ЯЁ]/.test(x));
    expect(new Set(ru).size).toBe(33);
  });
});
