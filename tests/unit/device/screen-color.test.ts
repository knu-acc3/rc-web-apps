import { describe, expect, it } from "vitest";
import { dim, hexToRgb, kelvinToRgb, luminance, rgbToHex, SCREEN_COLORS, whiteAt } from "@/tools/device/screen/lib/color";
import { flashColor, flashesPerSecond, SOS_SECONDS } from "@/tools/device/screen/lib/flash";

describe("screen colours", () => {
  it("hex round-trips", () => {
    for (const c of SCREEN_COLORS) expect(rgbToHex(hexToRgb(c.hex))).toBe(c.hex);
  });
  it("6500 K is pure white, warm is orange, cold is bluish", () => {
    expect(whiteAt(6500)).toEqual([255, 255, 255]);
    const warm = whiteAt(2700);
    expect(warm[0]).toBe(255);
    expect(warm[2]).toBeLessThan(warm[1]);
    const cold = whiteAt(9000);
    expect(cold[2]).toBe(255);
    expect(cold[0]).toBeLessThan(255);
    expect(kelvinToRgb(1900)[2]).toBe(0);
  });
  it("brightness scales and luminance orders colours", () => {
    expect(dim([255, 128, 0], 0.5)).toEqual([128, 64, 0]);
    expect(luminance([255, 255, 255])).toBeCloseTo(1);
    expect(luminance([0, 0, 0])).toBe(0);
    expect(luminance(hexToRgb("#ffff00"))).toBeGreaterThan(luminance(hexToRgb("#0000ff")));
  });
});

describe("flashing light", () => {
  it("blink is on for the first half of each period", () => {
    expect(flashColor("blink", 0.1, 2)).toBe("#ffffff");
    expect(flashColor("blink", 0.3, 2)).toBe("#000000");
  });
  it("police alternates two red and two blue flashes", () => {
    const seq = [0, 1, 2, 3].map((k) => flashColor("police", (k + 0.1) / 4, 4));
    expect(seq).toEqual(["#ff1a1a", "#ff1a1a", "#1a3dff", "#1a3dff"]);
  });
  it("SOS is ··· — — — ··· with Morse timing", () => {
    expect(SOS_SECONDS).toBeCloseTo((3 + 2 + 3 + 9 + 2 + 3 + 3 + 2 + 7) * 0.2);
    expect(flashColor("sos", 0.1, 1)).toBe("#ffffff"); // first dot
    expect(flashColor("sos", 0.3, 1)).toBe("#000000"); // gap
    expect(flashesPerSecond("sos", 99)).toBeLessThanOrEqual(3);
  });
  it("party never repeats a colour twice in a row", () => {
    for (let k = 1; k < 500; k++) expect(flashColor("party", k + 0.5, 1)).not.toBe(flashColor("party", k - 0.5, 1));
  });
});
