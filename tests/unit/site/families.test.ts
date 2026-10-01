import { describe, expect, it } from "vitest";
import { resolvePage } from "@/registry";
import { FAMILIES, familyOf } from "@/registry/families";

describe("tool families", () => {
  it("every tab is a real tool page", () => {
    const missing = FAMILIES.flat().filter((slug) => {
      const p = resolvePage("ru", [slug]);
      return !p || !p.tool;
    });
    expect(missing).toEqual([]);
  });
  it("families are short navigation rows", () => {
    for (const f of FAMILIES) {
      expect(f.length).toBeGreaterThanOrEqual(2);
      expect(f.length).toBeLessThanOrEqual(8);
      expect(new Set(f).size).toBe(f.length);
    }
  });
  it("finds a tool's family", () => {
    expect(familyOf("stopwatch")).toContain("timer");
    expect(familyOf("no-such-tool")).toBeUndefined();
  });
});
