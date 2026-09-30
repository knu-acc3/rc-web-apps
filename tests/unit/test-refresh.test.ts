import { describe, expect, it } from "vitest";
import { frameStats, snapRate, stability, statsFromTimestamps } from "@/sections/test/lib/refresh";

const repeat = (ms: number, n: number) => Array.from({ length: n }, () => ms);

describe("refresh-rate stats", () => {
  it("steady 60 Hz", () => {
    const s = frameStats(repeat(1000 / 60, 300))!;
    expect(s.medianHz).toBeCloseTo(60, 6);
    expect(s.meanHz).toBeCloseTo(60, 6);
    expect(s.stdDevMs).toBeCloseTo(0, 6);
    expect(s.dropped).toBe(0);
    expect(snapRate(s.medianHz)).toMatchObject({ rate: 60, close: true });
    expect(stability(s)).toBe("stable");
  });

  it("144 Hz with small jitter", () => {
    const xs = Array.from({ length: 600 }, (_, i) => 1000 / 144 + (i % 2 ? 0.2 : -0.2));
    const s = frameStats(xs)!;
    expect(s.meanHz).toBeCloseTo(144, 1);
    expect(s.stdDevMs).toBeCloseTo(0.2, 6);
    expect(snapRate(s.meanHz)?.rate).toBe(144);
  });

  it("median ignores dropped frames, which are counted", () => {
    // 120 Hz with 5 hitches: two of one missed frame, three of two missed frames
    const xs = [...repeat(1000 / 120, 295), ...repeat((2 * 1000) / 120, 2), ...repeat((3 * 1000) / 120, 3)];
    const s = frameStats(xs)!;
    expect(s.medianHz).toBeCloseTo(120, 6);
    expect(s.meanHz).toBeLessThan(120);
    expect(s.dropped).toBe(2 * 1 + 3 * 2);
    expect(snapRate(s.medianHz)?.rate).toBe(120);
  });

  it("works from raw timestamps", () => {
    const ts = Array.from({ length: 101 }, (_, i) => 1000 + i * (1000 / 75));
    const s = statsFromTimestamps(ts)!;
    expect(s.frames).toBe(100);
    expect(s.medianHz).toBeCloseTo(75, 6);
  });

  it("snaps to common rates", () => {
    expect(snapRate(59.94)?.rate).toBe(60);
    expect(snapRate(164.8)?.rate).toBe(165);
    expect(snapRate(239)?.rate).toBe(240);
    expect(snapRate(89.6)?.rate).toBe(90);
    expect(snapRate(143.5)?.rate).toBe(144);
    expect(snapRate(30.1)?.rate).toBe(30);
    // far from anything → not close
    expect(snapRate(66)?.close).toBe(false);
    expect(snapRate(0)).toBeNull();
    expect(snapRate(NaN)).toBeNull();
  });

  it("flags unstable timing", () => {
    const xs = Array.from({ length: 200 }, (_, i) => (i % 3 === 0 ? 30 : 10));
    expect(stability(frameStats(xs)!)).toBe("unstable");
  });

  it("needs at least two intervals", () => {
    expect(frameStats([16])).toBeNull();
    expect(frameStats([])).toBeNull();
  });
});
