import { describe, expect, it } from "vitest";
import { hex, inGamut, parseColor, toHex, toOklch } from "@/tools/design/color/lib/color";
import { MATERIAL } from "@/tools/design/color/design/data/material";
import { TAILWIND_V3 } from "@/tools/design/color/design/data/tailwind-v3";
import { TAILWIND_V4 } from "@/tools/design/color/design/data/tailwind-v4";
import { cvdMatrix, MACHADO, simulate } from "@/tools/design/color/design/lib/cvd";
import { DEFAULT_GRADIENT, gradientCss, gradientValue } from "@/tools/design/color/design/lib/gradient";
import { exportCss, exportJson, exportTailwind4, harmonyPalette, randomPalette, regenerate } from "@/tools/design/color/design/lib/palette";
import { anchorStep, generateShades, SHADE_STEPS, twOklch } from "@/tools/design/color/design/lib/shades";

describe("shades generator", () => {
  for (const input of ["#3B82F6", "#FF6347", "#2E8B57", "#FFD700", "#1E1B4B", "#FDF2F8", "#808080"]) {
    it(`builds a monotonic in-gamut 50–950 scale for ${input}`, () => {
      const c = hex(input);
      const s = generateShades(c);
      expect(s.map((x) => x.step)).toEqual([...SHADE_STEPS]);
      const L = s.map((x) => toOklch(x.color).l);
      for (let i = 1; i < L.length; i++) expect(L[i]).toBeLessThan(L[i - 1]);
      for (const x of s) expect(inGamut(x.color, 1e-9)).toBe(true);
      const k = anchorStep(c);
      expect(s[k].hex).toBe(input.toUpperCase());
      // hue kept: the chord between hues in the a/b plane stays below a just-noticeable difference
      const o = toOklch(c);
      for (const x of s) {
        const q = toOklch(x.color);
        const dh = (Math.abs(q.h - o.h) * Math.PI) / 180;
        expect(2 * Math.min(q.c, o.c) * Math.sin(dh / 2)).toBeLessThan(0.02);
      }
    });
  }
  it("places Tailwind's own blue-500 on step 500", () => {
    const blue500 = parseColor(TAILWIND_V4.blue[5])!;
    expect(SHADE_STEPS[anchorStep(blue500)]).toBe(500);
    expect(SHADE_STEPS[anchorStep(parseColor(TAILWIND_V4.yellow[5])!)]).toBe(500);
    expect(SHADE_STEPS[anchorStep(hex("#3B82F6"))]).toBe(500);
  });
  it("formats OKLCH like Tailwind", () => {
    expect(twOklch(parseColor("oklch(63.7% 0.237 25.331)")!)).toBe("oklch(63.7% 0.237 25.331)");
  });
});

describe("palette generator", () => {
  it("starts with the exact base color and has the requested size", () => {
    for (const n of [3, 5, 10]) {
      const p = harmonyPalette(hex("#3B82F6"), "triadic", n);
      expect(p).toHaveLength(n);
      expect(toHex(p[0])).toBe("#3B82F6");
    }
  });
  it("random palettes are deterministic for a given source and in gamut", () => {
    let i = 0;
    const seq = [0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6];
    const rand = () => seq[i++ % seq.length];
    const p = randomPalette(6, rand);
    expect(p).toHaveLength(6);
    for (const c of p) expect(inGamut(c, 1e-9)).toBe(true);
  });
  it("regenerate keeps locked swatches", () => {
    const cur = [hex("#111111"), hex("#222222"), hex("#333333")];
    const fresh = [hex("#AAAAAA"), hex("#BBBBBB"), hex("#CCCCCC")];
    expect(regenerate(cur, [false, true, false], fresh).map((c) => toHex(c))).toEqual(["#AAAAAA", "#222222", "#CCCCCC"]);
  });
  it("exports well-formed code", () => {
    const p = [hex("#FF0000"), hex("#00FF00")];
    expect(exportCss(p)).toBe(":root {\n  --color-1: #FF0000;\n  --color-2: #00FF00;\n}");
    expect(exportTailwind4(p)).toMatch(/^@theme \{\n {2}--color-palette-1: oklch\(/);
    expect(JSON.parse(exportJson(p))[1].hex).toBe("#00FF00");
  });
});

describe("Tailwind and Material data", () => {
  it("Tailwind v4 has 22+ complete families that parse", () => {
    expect(Object.keys(TAILWIND_V4).length).toBeGreaterThanOrEqual(22);
    for (const [f, arr] of Object.entries(TAILWIND_V4)) {
      expect(arr, f).toHaveLength(11);
      for (const v of arr) expect(parseColor(v), v).not.toBeNull();
    }
    expect(TAILWIND_V4.red[5]).toBe("oklch(63.7% 0.237 25.331)");
  });
  it("Tailwind v3 has the 22 families with known values", () => {
    expect(Object.keys(TAILWIND_V3)).toHaveLength(22);
    for (const arr of Object.values(TAILWIND_V3)) for (const v of arr) expect(v).toMatch(/^#[0-9a-f]{6}$/);
    expect(TAILWIND_V3.red[5]).toBe("#ef4444");
    expect(TAILWIND_V3.blue[5]).toBe("#3b82f6");
    expect(TAILWIND_V3.slate[9]).toBe("#0f172a");
    for (const f of Object.keys(TAILWIND_V3)) expect(TAILWIND_V4[f], f).toBeDefined();
  });
  it("Material has 19 families, accents only on chromatic ones", () => {
    expect(MATERIAL).toHaveLength(19);
    const red = MATERIAL.find((f) => f.slug === "red")!;
    expect(red.shades["500"]).toBe("#f44336");
    expect(red.shades.A200).toBe("#ff5252");
    for (const s of ["brown", "grey", "blue-grey"]) expect(Object.keys(MATERIAL.find((f) => f.slug === s)!.shades)).toHaveLength(10);
    expect(MATERIAL.reduce((n, f) => n + Object.keys(f.shades).length, 0)).toBe(254);
    expect(MATERIAL.find((f) => f.slug === "blue")!.shades["500"]).toBe("#2196f3");
  });
});

describe("color-blindness simulation", () => {
  it("Machado matrices preserve white (rows sum to 1)", () => {
    for (const m of Object.values(MACHADO)) for (const row of m) expect(row[0] + row[1] + row[2]).toBeCloseTo(1, 4);
  });
  it("keeps white, black and grays unchanged", () => {
    for (const type of ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as const)
      for (const h of ["#FFFFFF", "#000000", "#808080"]) expect(toHex(simulate(hex(h), type))).toBe(h);
  });
  it("achromatopsia yields grays; protanopia makes red and green closer", () => {
    const g = simulate(hex("#3B82F6"), "achromatopsia");
    expect(Math.abs(g.r - g.g)).toBeLessThan(1e-9);
    const r = simulate(hex("#E53935"), "protanopia");
    const gr = simulate(hex("#43A047"), "protanopia");
    const d = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
    expect(d(r, gr)).toBeLessThan(d(hex("#E53935"), hex("#43A047")));
  });
  it("severity 0 is identity, severity 1 is the full matrix", () => {
    expect(cvdMatrix("protanopia", 0)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    expect(cvdMatrix("deuteranopia", 1)[0]).toBeCloseTo(0.367322, 6);
  });
});

describe("gradient builder", () => {
  const stops = (...c: string[]) => c.map((color, i) => ({ id: i + 1, color, pos: Math.round((i / (c.length - 1)) * 100) }));
  it("supports any number of stops, angles and keywords", () => {
    expect(gradientValue({ ...DEFAULT_GRADIENT, stops: stops("#f00", "#0f0", "#00f", "#fff", "rgb(0 0 0 / 50%)") })).toBe(
      "linear-gradient(90deg, #FF0000 0%, #00FF00 25%, #0000FF 50%, #FFFFFF 75%, #00000080 100%)",
    );
    expect(gradientValue({ ...DEFAULT_GRADIENT, direction: "to bottom left", stops: stops("red", "blue") })).toBe("linear-gradient(to bottom left, #FF0000 0%, #0000FF 100%)");
    expect(gradientValue({ ...DEFAULT_GRADIENT, stops: [{ id: 1, color: "red", pos: null }, { id: 2, color: "nope", pos: 50 }, { id: 3, color: "blue", pos: null }] })).toBe(
      "linear-gradient(90deg, #FF0000, #0000FF)",
    );
  });
  it("builds radial and conic syntax", () => {
    expect(gradientValue({ ...DEFAULT_GRADIENT, type: "radial", stops: stops("red", "blue") })).toBe("radial-gradient(circle, #FF0000 0%, #0000FF 100%)");
    expect(gradientValue({ ...DEFAULT_GRADIENT, type: "radial", shape: "ellipse", x: 20, y: 30, stops: stops("red", "blue") })).toBe("radial-gradient(at 20% 30%, #FF0000 0%, #0000FF 100%)");
    expect(gradientValue({ ...DEFAULT_GRADIENT, type: "conic", from: 45, stops: stops("red", "blue") })).toBe("conic-gradient(from 45deg, #FF0000 0%, #0000FF 100%)");
    expect(gradientValue({ ...DEFAULT_GRADIENT, type: "linear", repeating: true, stops: stops("red", "blue") })).toBe("repeating-linear-gradient(90deg, #FF0000 0%, #0000FF 100%)");
  });
  it("adds a fallback line before an interpolation space", () => {
    expect(gradientCss({ ...DEFAULT_GRADIENT, space: "oklch", stops: stops("red", "blue") })).toBe(
      "background: linear-gradient(90deg, #FF0000 0%, #0000FF 100%); /* fallback */\nbackground: linear-gradient(90deg in oklch, #FF0000 0%, #0000FF 100%);",
    );
  });
});
