import { describe, expect, it } from "vitest";
import { MAX_DELAY_MS, MIN_DELAY_MS, randomDelayMs, reactionRating, reactionStats } from "@/tools/device/test/lib/reaction";
import { randomInt, type RandomFill } from "@/tools/device/test/lib/secure-random";

/** A fake generator that returns the given 32-bit values in order. */
function seq(values: number[]): RandomFill {
  let i = 0;
  return (buf) => {
    buf[0] = values[i++ % values.length];
    return buf;
  };
}

describe("reaction stats", () => {
  it("average, median, best and worst", () => {
    const s = reactionStats([250, 230, 310, 200, 260])!;
    expect(s.count).toBe(5);
    expect(s.average).toBe(250);
    expect(s.median).toBe(250);
    expect(s.best).toBe(200);
    expect(s.worst).toBe(310);
  });

  it("ignores invalid values", () => {
    expect(reactionStats([])).toBeNull();
    expect(reactionStats([NaN, -5, 0])).toBeNull();
    expect(reactionStats([300, NaN])!.average).toBe(300);
  });

  it("ratings", () => {
    expect(reactionRating(180)).toBe("excellent");
    expect(reactionRating(200)).toBe("good");
    expect(reactionRating(249.9)).toBe("good");
    expect(reactionRating(275)).toBe("average");
    expect(reactionRating(350)).toBe("below");
    expect(reactionRating(400)).toBe("slow");
  });
});

describe("random delay", () => {
  it("stays within 1.5–4 s with the real CSPRNG", () => {
    for (let i = 0; i < 2000; i++) {
      const d = randomDelayMs();
      expect(Number.isInteger(d)).toBe(true);
      expect(d).toBeGreaterThanOrEqual(MIN_DELAY_MS);
      expect(d).toBeLessThanOrEqual(MAX_DELAY_MS);
    }
  });

  it("maps extreme generator values to the bounds", () => {
    expect(randomDelayMs(seq([0]))).toBe(1500);
    // range = 2501; the largest accepted value is limit - 1, which maps to the top
    const range = MAX_DELAY_MS - MIN_DELAY_MS + 1;
    const limit = Math.floor(2 ** 32 / range) * range;
    expect(randomDelayMs(seq([limit - 1]))).toBe(4000);
  });

  it("rejects values from the biased tail", () => {
    const range = 2501;
    const limit = Math.floor(2 ** 32 / range) * range;
    // first draw is in the rejected zone, second one is accepted
    expect(randomDelayMs(seq([limit, 7]))).toBe(1507);
    expect(randomDelayMs(seq([2 ** 32 - 1, 2500]))).toBe(4000);
  });

  it("randomInt validates its range", () => {
    expect(() => randomInt(5, 1)).toThrow();
    expect(() => randomInt(0.5, 2)).toThrow();
    expect(randomInt(3, 3)).toBe(3);
  });
});
