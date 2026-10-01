import { describe, expect, it } from "vitest";
import { mmToPx, PHOTO_FORMATS, SHEETS, sheetLayout } from "@/sections/image/engine/passport";

describe("document photos", () => {
  it("converts millimetres to pixels", () => {
    expect(mmToPx(35, 300)).toBe(413);
    expect(mmToPx(45, 300)).toBe(531);
    expect(mmToPx(50.8, 600)).toBe(1200);
  });
  it("fits 6 photos 35×45 on a 10×15 sheet and 30 on A4", () => {
    const f = PHOTO_FORMATS.find((x) => x.id === "35x45")!;
    expect(sheetLayout(SHEETS["10x15"], f).cells).toHaveLength(6);
    expect(sheetLayout(SHEETS.a4, f).cells).toHaveLength(30);
  });
  it("centres the grid and keeps it on the sheet", () => {
    const f = PHOTO_FORMATS.find((x) => x.id === "30x40")!;
    const { cells } = sheetLayout(SHEETS["10x15"], f);
    for (const c of cells) {
      expect(c.x).toBeGreaterThanOrEqual(4);
      expect(c.x + f.w).toBeLessThanOrEqual(102 - 4 + 1e-9);
      expect(c.y + f.h).toBeLessThanOrEqual(152 - 4 + 1e-9);
    }
    const left = Math.min(...cells.map((c) => c.x));
    const right = 102 - Math.max(...cells.map((c) => c.x + f.w));
    expect(left).toBeCloseTo(right, 6);
  });
});

import { stampText } from "@/sections/image/tools/AddText";
describe("date stamp", () => {
  it("formats like a film camera and as plain dates", () => {
    const d = new Date(2024, 9, 1, 14, 35);
    expect(stampText(d, "camera")).toBe("’24 10 01");
    expect(stampText(d, "dmy")).toBe("01.10.2024");
    expect(stampText(d, "dmyhm")).toBe("01.10.2024 14:35");
  });
});
