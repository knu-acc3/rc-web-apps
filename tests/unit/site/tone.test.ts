import { describe, expect, it } from "vitest";
import { allSections } from "@/registry";
import { toneVars } from "@/lib/tone";

function lum(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Every section accent must stay readable (WCAG AA) in both themes. */
describe("section tones", () => {
  const hues = [...new Set([225, ...allSections().map((s) => s.hue)])];
  for (const hue of hues) {
    it(`hue ${hue} passes AA`, () => {
      const t = toneVars(hue);
      expect(contrast("#ffffff", t["--t-acc"]), "white on accent").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--t-acc"], t["--t-stage"]), "accent on stage").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--t-acc"], t["--t-soft"]), "accent on soft").toBeGreaterThanOrEqual(4.5);
      expect(contrast("#0f1012", t["--t-acc-d"]), "dark text on dark accent").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--t-acc-d"], t["--t-stage-d"]), "dark accent on dark stage").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--t-acc-d"], t["--t-soft-d"]), "dark accent on dark soft").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--t-on-cont"], t["--t-cont"]), "text on tonal container").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--t-on-cont-d"], t["--t-cont-d"]), "dark text on dark tonal container").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--t-cont"], "#ffffff"), "tonal container visible on white").toBeGreaterThanOrEqual(1.2);
    });
  }
});
