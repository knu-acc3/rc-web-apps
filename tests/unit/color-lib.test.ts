import { describe, expect, it } from "vitest";
import {
  adjustToContrast,
  apcaContrast,
  COLOR_FORMATS,
  contrastRatio,
  deltaEOK,
  formatColor,
  formatRatio,
  fromOklch,
  harmony,
  hex,
  inGamut,
  mix,
  nearestNamed,
  parseColor,
  readableTextColor,
  toGamut,
  toHex,
  toHsl,
  toLab,
  toOklch,
  wcagChecks,
  type ColorFormat,
} from "@/sections/color/lib/color";
import { NAMED_COLORS } from "@/sections/color/lib/named";

const H = (s: string) => {
  const c = parseColor(s);
  if (!c) throw new Error(`unparsed ${s}`);
  return toHex(c);
};

describe("named colors", () => {
  it("has exactly the 148 CSS named colors", () => {
    expect(NAMED_COLORS.length).toBe(148);
    expect(new Set(NAMED_COLORS.map(([n]) => n)).size).toBe(148);
  });
});

describe("parseColor", () => {
  it("parses hex 3/4/6/8 digits, with and without #", () => {
    expect(H("#f64")).toBe("#FF6644");
    expect(H("#ff6347")).toBe("#FF6347");
    expect(H("FF6347")).toBe("#FF6347");
    expect(H("#FF634780")).toBe("#FF634780");
    expect(H("#f648")).toBe("#FF664488");
    expect(parseColor("#ff634")).toBeNull();
    expect(parseColor("#gg0000")).toBeNull();
  });

  it("parses rgb() legacy and modern syntax with alpha", () => {
    expect(H("rgb(255, 99, 71)")).toBe("#FF6347");
    expect(H("rgba(255,99,71,.5)")).toBe("#FF634780");
    expect(H("rgb(255 99 71 / 50%)")).toBe("#FF634780");
    expect(H("rgb(100% 0% 0%)")).toBe("#FF0000");
    expect(H("rgb(300 -5 0)")).toBe("#FF0000");
    expect(H("rgb(none 0 0)")).toBe("#000000");
    expect(parseColor("rgb(255, 99 71)")).toBeNull();
    expect(parseColor("rgb(255 99)")).toBeNull();
  });

  it("parses hsl() with angle units", () => {
    expect(H("hsl(0, 100%, 50%)")).toBe("#FF0000");
    expect(H("hsl(120deg 100% 25%)")).toBe("#008000");
    expect(H("hsl(0.5turn 100% 50%)")).toBe("#00FFFF");
    expect(H("hsl(3.14159rad 100% 50%)")).toBe("#00FFFF");
    expect(H("hsl(200grad 100% 50%)")).toBe("#00FFFF");
    expect(H("hsla(240, 100%, 50%, 0.5)")).toBe("#0000FF80");
    expect(H("hsl(-120 100% 50%)")).toBe("#0000FF");
  });

  it("parses hwb, lab, lch, oklab, oklch and color()", () => {
    expect(H("hwb(0 0% 0%)")).toBe("#FF0000");
    expect(H("hwb(0 60% 60%)")).toBe("#808080");
    expect(H("lab(54.29 80.81 69.89)")).toBe("#FF0000");
    expect(H("lch(54.29 107.03 40.85)")).toBe("#FF0000");
    expect(H("oklab(62.8% 0.2249 0.1258)")).toBe("#FF0000");
    expect(H("oklch(62.8% 0.2577 29.23)")).toBe("#FF0000");
    expect(H("oklch(0.628 0.2577 29.23deg)")).toBe("#FF0000");
    expect(H("color(srgb 1 0 0)")).toBe("#FF0000");
    expect(H("color(srgb-linear 0.2159 0.2159 0.2159)")).toBe("#808080");
    expect(H("color(display-p3 1 0 0)")).toMatch(/^#FF[01][0-9A-F][01][0-9A-F]$/); // CSS gamut mapping: lighter than clipped red
  });

  it("parses named colors, transparent, and rejects currentcolor", () => {
    expect(H("Tomato")).toBe("#FF6347");
    expect(H(" rebeccapurple; ")).toBe("#663399");
    const t = parseColor("transparent")!;
    expect(t.alpha).toBe(0);
    expect(parseColor("currentcolor")).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor("notacolor")).toBeNull();
  });

  it("reads bare component lists with a hint", () => {
    expect(toHex(parseColor("255, 99, 71", "rgb")!)).toBe("#FF6347");
    expect(toHex(parseColor("9.1 100% 63.9%", "hsl")!)).toBe("#FF6347");
    expect(toHex(parseColor("0, 61.2, 72.2, 0", "cmyk")!)).toBe("#FF6347");
    expect(toHex(parseColor("cmyk(0%, 61.2%, 72.2%, 0%)")!)).toBe("#FF6347");
    expect(toHex(parseColor("hsv(9.1, 72.2%, 100%)")!)).toBe("#FF6347");
  });
});

describe("conversions: known values", () => {
  it("red in OKLCH and Lab", () => {
    const o = toOklch(hex("#ff0000"));
    expect(o.l).toBeCloseTo(0.62796, 4);
    expect(o.c).toBeCloseTo(0.25768, 4);
    expect(o.h).toBeCloseTo(29.2339, 2);
    const l = toLab(hex("#ff0000"));
    expect(l.l).toBeCloseTo(54.29, 1);
    expect(l.a).toBeCloseTo(80.81, 1);
    expect(l.b).toBeCloseTo(69.89, 1);
  });

  it("formats tomato in every format", () => {
    const c = hex("#ff6347");
    expect(formatColor(c, "hex")).toBe("#FF6347");
    expect(formatColor(c, "rgb")).toBe("rgb(255, 99, 71)");
    expect(formatColor(c, "rgb", { legacy: false })).toBe("rgb(255 99 71)");
    expect(formatColor(c, "hsl")).toBe("hsl(9.1, 100%, 63.9%)");
    expect(formatColor(c, "hsv")).toBe("hsv(9.1, 72.2%, 100%)");
    expect(formatColor(c, "cmyk")).toBe("cmyk(0%, 61.2%, 72.2%, 0%)");
    expect(formatColor({ ...c, alpha: 0.5 }, "rgb")).toBe("rgba(255, 99, 71, 0.5)");
    expect(formatColor({ ...c, alpha: 0.5 }, "oklch")).toMatch(/^oklch\([\d.]+% [\d.]+ [\d.]+ \/ 0\.5\)$/);
  });

  it("gray has zero chroma and hue in OKLCH/HSL output", () => {
    expect(formatColor(hex("#808080"), "oklch")).toMatch(/^oklch\([\d.]+% 0 0\)$/);
    expect(formatColor(hex("#808080"), "hsl")).toBe("hsl(0, 0%, 50.2%)");
    expect(toHsl(hex("#000000")).s).toBe(0);
  });

  it("Tailwind v4 red-500 oklch maps to its sRGB hex", () => {
    const c = parseColor("oklch(63.7% 0.237 25.331)")!;
    const [r, g, b] = [c.r, c.g, c.b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255));
    expect(Math.abs(r - 0xfb)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - 0x2c)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - 0x36)).toBeLessThanOrEqual(1);
  });
});

describe("round trips", () => {
  const formats = COLOR_FORMATS.filter((f) => f !== "p3") as ColorFormat[];
  it("every named color survives format → parse in every format", () => {
    const bad: string[] = [];
    for (const [name, h] of NAMED_COLORS) {
      const c = hex(h);
      for (const f of [...formats, "p3" as const]) {
        const s = formatColor(c, f);
        const back = parseColor(s);
        if (!back || toHex(back) !== h.toUpperCase()) bad.push(`${name} ${f} ${s} → ${back ? toHex(back) : "null"}`);
      }
      const modern = formatColor(c, "hsl", { legacy: false });
      if (toHex(parseColor(modern)!) !== h.toUpperCase()) bad.push(`${name} modern hsl`);
    }
    expect(bad).toEqual([]);
  });

  it("random-ish grid of colors round-trips through oklch/lab/hsl", () => {
    const bad: string[] = [];
    for (let r = 0; r < 256; r += 17)
      for (let g = 0; g < 256; g += 51)
        for (let b = 0; b < 256; b += 15) {
          const h = "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
          for (const f of ["oklch", "lab", "hsl", "hwb", "lch", "oklab"] as const) {
            const back = parseColor(formatColor(hex(h), f));
            if (!back || toHex(back) !== h.toUpperCase()) bad.push(`${h} ${f}`);
          }
        }
    expect(bad.slice(0, 10)).toEqual([]);
  });
});

describe("gamut mapping", () => {
  it("maps out-of-gamut OKLCH into sRGB keeping lightness close", () => {
    const wide = fromOklch(0.9, 0.4, 150);
    expect(inGamut(wide)).toBe(false);
    const g = toGamut(wide);
    expect(inGamut(g, 0)).toBe(true);
    expect(Math.abs(toOklch(g).l - 0.9)).toBeLessThan(0.03);
  });
  it("leaves in-gamut colors unchanged", () => {
    expect(toHex(toGamut(hex("#123456")))).toBe("#123456");
  });
});

describe("WCAG contrast", () => {
  it("#6363F8 on white is 4.49… and fails AA — display and verdict agree", () => {
    const r = contrastRatio(hex("#6363F8"), hex("#ffffff"));
    expect(r).toBeGreaterThan(4.49);
    expect(r).toBeLessThan(4.5);
    expect(formatRatio(r)).toBe("4.49");
    expect(wcagChecks(r).aaNormal).toBe(false);
    expect(wcagChecks(r).aaLarge).toBe(true);
  });
  it("known ratios", () => {
    expect(formatRatio(contrastRatio(hex("#000"), hex("#fff")))).toBe("21.00");
    expect(formatRatio(contrastRatio(hex("#767676"), hex("#fff")))).toBe("4.54");
    expect(contrastRatio(hex("#777"), hex("#777"))).toBe(1);
    expect(wcagChecks(contrastRatio(hex("#595959"), hex("#fff"))).aaaNormal).toBe(true);
  });
  it("composites alpha instead of dropping it; transparent is not black", () => {
    const halfBlack = parseColor("rgba(0,0,0,0.5)")!;
    const r = contrastRatio(halfBlack, hex("#fff"));
    expect(r).toBeGreaterThan(3.9);
    expect(r).toBeLessThan(4.1); // #808080-ish on white ≈ 3.95
    expect(contrastRatio(parseColor("transparent")!, hex("#fff"))).toBe(1);
    // translucent background over the default white backdrop
    expect(contrastRatio(hex("#000"), parseColor("rgb(0 0 0 / 0)")!)).toBeCloseTo(21, 5);
  });
  it("readable text color is decided by contrast, not a luminance cutoff", () => {
    expect(readableTextColor(hex("#ffff00"))).toBe("#000000");
    expect(readableTextColor(hex("#000080"))).toBe("#FFFFFF");
    // mid orange: black gives more contrast than white
    expect(readableTextColor(hex("#ff8c00"))).toBe("#000000");
    for (const [, h] of NAMED_COLORS) {
      const bg = hex(h);
      const pick = readableTextColor(bg);
      const other = pick === "#000000" ? "#ffffff" : "#000000";
      expect(contrastRatio(hex(pick), bg)).toBeGreaterThanOrEqual(contrastRatio(hex(other), bg));
    }
  });
  it("adjustToContrast finds a close passing color", () => {
    const fixed = adjustToContrast(hex("#6363F8"), hex("#fff"), 4.5)!;
    expect(contrastRatio(fixed, hex("#fff"))).toBeGreaterThanOrEqual(4.5);
    expect(deltaEOK(fixed, hex("#6363F8"))).toBeLessThan(0.05);
    expect(adjustToContrast(hex("#777"), hex("#777"), 22)).toBeNull();
  });
});

describe("APCA", () => {
  it("matches the APCA-W3 0.0.98G reference values", () => {
    expect(apcaContrast(hex("#888888"), hex("#ffffff"))).toBeCloseTo(63.056, 2);
    expect(apcaContrast(hex("#ffffff"), hex("#888888"))).toBeCloseTo(-68.541, 2);
    expect(apcaContrast(hex("#000000"), hex("#ffffff"))).toBeCloseTo(106.04, 1);
    expect(apcaContrast(hex("#ffffff"), hex("#000000"))).toBeCloseTo(-107.88, 1);
    expect(apcaContrast(hex("#777777"), hex("#777777"))).toBe(0);
  });
});

describe("harmonies", () => {
  it("first swatch is exactly the input color", () => {
    for (const h of ["#3b82f6", "#ff6347", "#808080", "#123456"]) {
      for (const k of ["complementary", "analogous", "triadic", "split-complementary", "tetradic", "square", "monochromatic"] as const) {
        const out = harmony(hex(h), k);
        expect(toHex(out[0])).toBe(h.toUpperCase());
      }
    }
  });
  it("rotates the OKLCH hue and keeps swatches in gamut", () => {
    const base = hex("#3b82f6");
    const [, comp] = harmony(base, "complementary");
    const dh = Math.abs(toOklch(comp).h - toOklch(base).h);
    expect(Math.min(dh, 360 - dh)).toBeGreaterThan(150);
    expect(harmony(base, "triadic")).toHaveLength(3);
    expect(harmony(base, "square")).toHaveLength(4);
    for (const c of harmony(base, "tetradic")) expect(inGamut(c, 1e-9)).toBe(true);
  });
});

describe("mixing", () => {
  it("gray → blue does not pass through other hues in oklab/oklch", () => {
    const gray = hex("#808080");
    const blue = hex("#0000ff");
    const blueHue = toOklch(blue).h;
    for (const space of ["oklab", "oklch"] as const) {
      for (const t of [0.25, 0.5, 0.75]) {
        const m = toOklch(toGamut(mix(gray, blue, t, space)));
        const d = Math.abs(m.h - blueHue);
        expect(Math.min(d, 360 - d)).toBeLessThan(3);
      }
    }
  });
  it("endpoints are preserved in every space", () => {
    for (const space of ["srgb", "srgb-linear", "oklab", "oklch"] as const) {
      expect(toHex(mix(hex("#ff0000"), hex("#0000ff"), 0, space))).toBe("#FF0000");
      expect(toHex(mix(hex("#ff0000"), hex("#0000ff"), 1, space))).toBe("#0000FF");
    }
    expect(toHex(mix(hex("#000"), hex("#fff"), 0.5, "srgb"))).toBe("#808080");
    expect(toHex(mix(hex("#000"), hex("#fff"), 0.5, "srgb-linear"))).toBe("#BCBCBC");
  });
});

describe("nearest named color", () => {
  it("finds exact and near matches, skipping aliases", () => {
    expect(nearestNamed(hex("#ff6347"))[0]).toMatchObject({ name: "tomato", distance: 0 });
    expect(nearestNamed(hex("#ff6348"))[0].name).toBe("tomato");
    expect(nearestNamed(hex("#808081"))[0].name).toBe("gray");
    expect(nearestNamed(hex("#00ffff"))[0].name).toBe("aqua");
    const three = nearestNamed(hex("#3b82f6"), 3);
    expect(three).toHaveLength(3);
    expect(three[0].distance).toBeLessThanOrEqual(three[1].distance);
    expect(nearestNamed(hex("#ff6347"), 1, "tomato")[0].name).not.toBe("tomato");
  });
});
