import { describe, expect, it } from "vitest";
import { hex, parseColor, toHex, toOklch } from "@/sections/color/lib/color";
import { formatAs, PAIRS, parseAs, pairSlug } from "@/sections/color/lib/convert";
import { NAMED_COLORS } from "@/sections/color/lib/named";
import { colorFromHsva, hsvaFromColor, nudgeSV } from "@/sections/color/lib/picker-state";
import { shades, tints } from "@/sections/color/lib/variations";
import { NAMED_INFO } from "@/sections/color/data/named-info";
import { aliasesOf, namedPage } from "@/sections/color/pages/named";

describe("picker state", () => {
  it("round-trips colors exactly", () => {
    for (const [, h] of NAMED_COLORS) expect(toHex(colorFromHsva(hsvaFromColor(hex(h))))).toBe(h.toUpperCase());
  });
  it("keeps the hue when the color becomes gray, black or white", () => {
    const blue = hsvaFromColor(hex("#3B82F6"));
    expect(hsvaFromColor(hex("#808080"), blue).h).toBeCloseTo(blue.h, 6);
    expect(hsvaFromColor(hex("#FFFFFF"), blue).h).toBeCloseTo(blue.h, 6);
    const black = hsvaFromColor(hex("#000000"), blue);
    expect(black.h).toBeCloseTo(blue.h, 6);
    expect(black.s).toBeCloseTo(blue.s, 6); // saturation is undefined for black too
    // dragging to the left edge (s = 0) and back restores the hue
    const gray = nudgeSV(blue, -1, 0);
    expect(gray.s).toBe(0);
    expect(gray.h).toBe(blue.h);
    expect(toHex(colorFromHsva({ ...gray, s: blue.s }))).toBe("#3B82F6");
  });
  it("keeps alpha from 4/8-digit hex", () => {
    expect(hsvaFromColor(parseColor("#3B82F680")!).a).toBeCloseTo(128 / 255, 6);
  });
});

describe("converter pairs", () => {
  it("has unique slugs", () => {
    const slugs = PAIRS.map(([a, b]) => pairSlug(a, b));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("every pair converts named colors both ways without loss", () => {
    const bad: string[] = [];
    for (const [a, b] of PAIRS)
      for (const [name, h] of NAMED_COLORS) {
        const c = hex(h);
        const back = parseAs(formatAs(c, b), b);
        const src = parseAs(formatAs(c, a), a);
        if (!back || toHex(back) !== h.toUpperCase() || !src || toHex(src) !== h.toUpperCase()) bad.push(`${a}-to-${b} ${name}`);
      }
    expect(bad).toEqual([]);
  });
  it("reads bare component lists in the source format", () => {
    expect(toHex(parseAs("255, 99, 71", "rgb")!)).toBe("#FF6347");
    expect(toHex(parseAs("255, 99, 71, 0.5", "rgba")!)).toBe("#FF634780");
    expect(toHex(parseAs("9.1, 100%, 63.9%", "hsl")!)).toBe("#FF6347");
    expect(toHex(parseAs("0%, 61.2%, 72.2%, 0%", "cmyk")!)).toBe("#FF6347");
    expect(toHex(parseAs("ff6347", "hex")!)).toBe("#FF6347");
  });
  it("formats rgba with explicit alpha", () => {
    expect(formatAs(hex("#FF6347"), "rgba")).toBe("rgba(255, 99, 71, 1)");
    expect(formatAs(parseColor("#FF634780")!, "rgba")).toBe("rgba(255, 99, 71, 0.502)");
  });
});

describe("named color data and pages", () => {
  it("covers all 148 names with Russian names and groups", () => {
    for (const [n] of NAMED_COLORS) {
      const info = NAMED_INFO[n];
      expect(info, n).toBeDefined();
      expect(info.camel.toLowerCase()).toBe(n);
      expect(info.ru).toMatch(/[а-яё]/);
    }
    expect(Object.keys(NAMED_INFO)).toHaveLength(148);
  });
  it("links spelling aliases both ways", () => {
    expect(aliasesOf("gray")).toContain("grey");
    expect(aliasesOf("grey")).toContain("gray");
    expect(aliasesOf("cyan")).toEqual(["aqua"]);
    expect(aliasesOf("tomato")).toEqual([]);
  });
  it("builds a page with facts, contrast and similar colors", () => {
    const p = namedPage("tomato", "ru")!;
    expect(p.h1).toBe("Цвет Tomato");
    expect(p.lead).toContain("#FF6347");
    const facts = p.blocks!.find((b) => b.type === "facts");
    expect(facts && facts.type === "facts" && facts.rows[0]).toEqual(["HEX", "#FF6347"]);
    const contrast = p.blocks!.find((b) => b.type === "table" && b.title?.includes("Контраст"));
    expect(contrast && contrast.type === "table" && contrast.rows[0][1]).toBe("2.94:1");
  });
});

describe("tints and shades", () => {
  it("tints get lighter and shades darker, keeping the hue", () => {
    const base = hex("#3B82F6");
    const L = toOklch(base).l;
    const ti = tints(base).map((c) => toOklch(c).l);
    const sh = shades(base).map((c) => toOklch(c).l);
    expect(ti[0]).toBeGreaterThan(L);
    expect(ti.every((x, i) => i === 0 || x > ti[i - 1])).toBe(true);
    expect(sh.every((x, i) => i === 0 || x < sh[i - 1])).toBe(true);
    expect(Math.abs(toOklch(shades(base)[4]).h - toOklch(base).h)).toBeLessThan(2);
  });
});
