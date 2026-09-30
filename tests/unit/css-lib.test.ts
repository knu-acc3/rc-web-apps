import { describe, expect, it } from "vitest";
import { animationCss, ANIM_PRESETS, presetBySlug, settingsFor } from "@/sections/css/lib/animation";
import { bezierAt, bezierCss, parseBezier } from "@/sections/css/lib/bezier";
import { DEFAULT_FLEX, DEFAULT_GRID, flexCss, flexHtml, flexItem, gridCss, gridItem, validateAreas } from "@/sections/css/lib/layout";
import { FLEX_RECIPES, GRID_RECIPES, SHADOW_PRESETS, TEXT_SHADOW_PRESETS } from "@/sections/css/lib/presets";
import { blobRadii, parseRadius, radiusValue } from "@/sections/css/lib/radius";
import { parseShadow, shadowCss, shadowValue } from "@/sections/css/lib/shadow";
import { glassCss, polygonCss, triangleBorderCss, DEFAULT_GLASS } from "@/sections/css/lib/shapes";
import { analyze, specificity } from "@/sections/css/lib/specificity";
import { parseLength, splitTop } from "@/sections/css/lib/tokens";
import { clampAt, convertUnit, fluidClamp } from "@/sections/css/lib/units";

describe("tokens", () => {
  it("splits on top-level separators only", () => {
    expect(splitTop("0 1px rgba(0, 0, 0, .5), inset 0 0 2px red", ",")).toEqual(["0 1px rgba(0, 0, 0, .5)", "inset 0 0 2px red"]);
    expect(splitTop("0  1px   hsl(0 0% 0% / 50%)", " ")).toEqual(["0", "1px", "hsl(0 0% 0% / 50%)"]);
  });
  it("parses lengths in any unit", () => {
    expect(parseLength("-0.5em")).toEqual({ value: -0.5, unit: "em" });
    expect(parseLength("2REM")).toEqual({ value: 2, unit: "rem" });
    expect(parseLength("10%")).toEqual({ value: 10, unit: "%" });
    expect(parseLength(".25vw")).toEqual({ value: 0.25, unit: "vw" });
    expect(parseLength("0")).toEqual({ value: 0, unit: "" });
    expect(parseLength("4")).toEqual({ value: 4, unit: "px" });
    expect(parseLength("1ch")).toEqual({ value: 1, unit: "ch" });
    expect(parseLength("red")).toBeNull();
    expect(parseLength("1xyz")).toBeNull();
  });
});

describe("box-shadow parser", () => {
  it("parses units, negatives, inset and multiple layers with commas inside colors", () => {
    const r = parseShadow("box-shadow: 0 1px 2px -1px rgba(0, 0, 0, 0.5), inset 0.5em 1rem 2vw hsl(0 0% 0% / 50%);", "box");
    expect(r.error).toBeNull();
    expect(r.layers).toHaveLength(2);
    expect(r.layers[0]).toMatchObject({ inset: false, x: { value: 0 }, y: { value: 1, unit: "px" }, blur: { value: 2 }, spread: { value: -1 }, color: "rgba(0, 0, 0, 0.5)" });
    expect(r.layers[1]).toMatchObject({ inset: true, x: { value: 0.5, unit: "em" }, y: { value: 1, unit: "rem" }, blur: { value: 2, unit: "vw" }, color: "hsl(0 0% 0% / 50%)" });
  });
  it("accepts the color first, inset last and a missing color", () => {
    expect(parseShadow("red 2px 2px", "box").layers[0]).toMatchObject({ color: "red", x: { value: 2 } });
    expect(parseShadow("2px 2px 4px #00000080 inset", "box").layers[0]).toMatchObject({ inset: true, color: "#00000080" });
    expect(parseShadow("2px 2px", "box").layers[0].color).toBe("currentcolor");
    expect(parseShadow("0 0 8px oklch(70% 0.2 250)", "box").layers[0].color).toBe("oklch(70% 0.2 250)");
    expect(parseShadow("none", "box").layers).toEqual([]);
  });
  it("rejects invalid shadows", () => {
    expect(parseShadow("2px", "box").error).not.toBeNull();
    expect(parseShadow("1px 2px 3px 4px 5px", "box").error).not.toBeNull();
    expect(parseShadow("2px red 2px", "box").error).not.toBeNull();
    expect(parseShadow("2px 2px -3px red", "box").error).not.toBeNull();
    expect(parseShadow("inset 2px 2px red", "text").error).not.toBeNull();
    expect(parseShadow("1px 1px 1px 1px red", "text").error).not.toBeNull();
    expect(parseShadow("2px 2px bogus", "box").error).not.toBeNull();
  });
  it("round-trips through the serializer", () => {
    for (const p of SHADOW_PRESETS) {
      const a = parseShadow(p.value, "box");
      expect(a.error, p.slug).toBeNull();
      const b = parseShadow(shadowValue(a.layers, "box"), "box");
      expect(shadowValue(b.layers, "box")).toBe(shadowValue(a.layers, "box"));
    }
    for (const p of TEXT_SHADOW_PRESETS) expect(parseShadow(p.value, "text").error, p.slug).toBeNull();
    expect(shadowValue(parseShadow("0 4px 6px -1px rgb(0 0 0 / 0.1)", "box").layers, "box")).toBe("0 4px 6px -1px rgb(0 0 0 / 0.1)");
    expect(shadowCss(parseShadow("0 1px 2px red, 0 2px 4px blue", "box").layers, "box")).toBe("box-shadow:\n  0 1px 2px red,\n  0 2px 4px blue;");
  });
});

describe("border-radius", () => {
  it("expands 1–4 values and the slash syntax", () => {
    const r = parseRadius("10px 20px")!;
    expect(r.h.map((l) => l.value)).toEqual([10, 20, 10, 20]);
    expect(r.v.map((l) => l.value)).toEqual([10, 20, 10, 20]);
    const b = parseRadius("30% 70% 70% 30% / 30% 30% 70% 70%")!;
    expect(b.v.map((l) => l.value)).toEqual([30, 30, 70, 70]);
    expect(radiusValue(b)).toBe("30% 70% 70% 30% / 30% 30% 70% 70%");
    expect(radiusValue(parseRadius("8px 8px 8px 8px")!)).toBe("8px");
    expect(radiusValue(parseRadius("1px 2px 3px")!)).toBe("1px 2px 3px");
    expect(parseRadius("-1px")).toBeNull();
    expect(parseRadius("1px / 2px / 3px")).toBeNull();
  });
  it("builds blob shapes with the 8-value syntax", () => {
    let i = 0;
    const seq = [0.1, 0.9, 0.3, 0.7];
    const r = blobRadii(() => seq[i++ % seq.length]);
    const v = radiusValue(r, true);
    expect(v).toMatch(/^\d+% \d+% \d+% \d+% \/ \d+% \d+% \d+% \d+%$/);
    expect(r.h[0].value + r.h[1].value).toBe(100);
  });
});

describe("specificity", () => {
  const cases: [string, [number, number, number]][] = [
    ["#id .a > b:hover::before", [1, 2, 2]],
    [":is(#a, .b)", [1, 0, 0]],
    [":where(#a)", [0, 0, 0]],
    [":not(.a, #b)", [1, 0, 0]],
    ["*", [0, 0, 0]],
    ["a[href]", [0, 1, 1]],
    ["li:nth-child(2n of .a)", [0, 2, 1]],
    ["li:nth-child(2n+1)", [0, 1, 1]],
    [":has(> img)", [0, 0, 1]],
    ["p:before", [0, 0, 2]],
    ["ul li a.active", [0, 1, 3]],
    ["svg|circle", [0, 0, 1]],
    ["*|*", [0, 0, 0]],
    ['input[type="text" i]:focus-visible', [0, 2, 1]],
    [".a\\:b", [0, 1, 0]],
    ["::slotted(span.x)", [0, 1, 2]],
    ["div::first-line", [0, 0, 2]],
    ["html body #main .card:not(:first-child)", [1, 2, 2]],
  ];
  for (const [sel, spec] of cases) it(sel, () => expect(specificity(sel)).toEqual(spec));
  it("reports errors and analyzes lists", () => {
    const r = analyze("a, #b\n.c {color: red}");
    expect(r.map((x) => x.selector)).toEqual(["a", "#b", ".c"]);
    expect(analyze("a[href")[0].error).not.toBeNull();
  });
});

describe("cubic-bezier", () => {
  it("samples curves", () => {
    expect(bezierAt([0, 0, 1, 1], 0.3)).toBeCloseTo(0.3, 5);
    expect(bezierAt([0.25, 0.1, 0.25, 1], 0.5)).toBeCloseTo(0.8024, 3); // CSS "ease" at 50 %
    expect(bezierAt([0.42, 0, 0.58, 1], 0.5)).toBeCloseTo(0.5, 5);
    expect(bezierAt([0.68, -0.6, 0.32, 1.6], 0.2)).toBeLessThan(0);
  });
  it("parses and formats", () => {
    expect(parseBezier("ease-in")).toEqual([0.42, 0, 1, 1]);
    expect(parseBezier("cubic-bezier(0.1, 0.7, 1.0, 0.1)")).toEqual([0.1, 0.7, 1, 0.1]);
    expect(parseBezier("cubic-bezier(1.2, 0, 0, 1)")).toBeNull();
    expect(bezierCss([0.1234, -0.5, 1, 1.25])).toBe("cubic-bezier(0.123, -0.5, 1, 1.25)");
  });
});

describe("units and clamp", () => {
  it("converts px, rem, em, pt, vw and %", () => {
    expect(convertUnit(24, "px", "rem")).toBe(1.5);
    expect(convertUnit(1.5, "rem", "px")).toBe(24);
    expect(convertUnit(12, "pt", "px")).toBe(16);
    expect(convertUnit(144, "px", "vw")).toBe(10);
    expect(convertUnit(20, "px", "rem", { root: 20, parent: 16, viewport: 1440 })).toBe(1);
    expect(convertUnit(150, "%", "px")).toBe(24);
  });
  it("builds fluid clamp()", () => {
    const i = { minSize: 16, maxSize: 24, minViewport: 360, maxViewport: 1280, root: 16 };
    expect(fluidClamp(i).css).toBe("clamp(1rem, 0.8043rem + 0.8696vw, 1.5rem)");
    expect(clampAt(i, 360)).toBeCloseTo(16, 6);
    expect(clampAt(i, 1280)).toBeCloseTo(24, 6);
    expect(clampAt(i, 2000)).toBe(24);
    expect(fluidClamp({ ...i, minSize: 24, maxSize: 16 }).css).toBe("clamp(1rem, 1.6957rem - 0.8696vw, 1.5rem)");
  });
});

describe("animation builder", () => {
  it("has 20 presets and always emits a reduced-motion block", () => {
    expect(ANIM_PRESETS).toHaveLength(20);
    for (const p of ANIM_PRESETS) {
      const css = animationCss(p, settingsFor(p));
      expect(css).toContain(`@keyframes ${p.slug} {`);
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
      expect(css).not.toContain("ulti-");
    }
  });
  it("keeps a custom name without prefixes and rejects invalid identifiers", () => {
    const p = presetBySlug.get("fade-in")!;
    const css = animationCss(p, { ...settingsFor(p), name: "hero-appear", duration: 0.3, timing: "steps(4, jump-end)" });
    expect(css).toContain("@keyframes hero-appear {");
    expect(css).toContain(".hero-appear {\n  animation: hero-appear 0.3s steps(4, jump-end) 0s 1 normal both;");
    expect(animationCss(p, { ...settingsFor(p), name: "1bad name" })).toContain("@keyframes fade-in {");
  });
});

describe("flexbox and grid builders", () => {
  it("never emits settings of removed items", () => {
    const s = { ...DEFAULT_FLEX, items: [flexItem(1, "a"), flexItem(2, "b", { grow: 2, order: 3 }), flexItem(3, "c")] };
    expect(flexCss(s)).toContain(".item-2 {\n  flex: 2 1 auto;\n  order: 3;\n}");
    const removed = { ...s, items: s.items.filter((x) => x.id !== 2) };
    expect(flexCss(removed)).not.toContain("order");
    expect(flexCss(removed)).not.toContain(".item-");
    expect(flexHtml(removed)).toBe('<div class="container">\n  <div class="item">a</div>\n  <div class="item">c</div>\n</div>');
  });
  it("emits only non-default container properties", () => {
    expect(flexCss(DEFAULT_FLEX)).toBe(".container {\n  display: flex;\n  gap: 12px;\n}");
    expect(flexCss(FLEX_RECIPES["center-div"])).toContain("justify-content: center;");
    expect(flexCss(FLEX_RECIPES["push-last-right"])).toContain(".item-4 {\n  margin-inline-start: auto;\n}");
  });
  it("validates grid-template-areas", () => {
    expect(validateAreas([["a", "a"], ["b", "b"]]).ok).toBe(true);
    expect(validateAreas([["a", "b"], ["b", "a"]])).toEqual({ ok: false, error: "shape", name: "a" });
    expect(validateAreas([["a", "b"], ["c"]])).toEqual({ ok: false, error: "rows" });
    expect(validateAreas([["a", "."], [".", "."]]).ok).toBe(true);
    expect(validateAreas([["1a"]])).toEqual({ ok: false, error: "name", name: "1a" });
    for (const [slug, r] of Object.entries(GRID_RECIPES)) expect(validateAreas(r.areas).ok, slug).toBe(true);
  });
  it("grid CSS uses areas and drops removed items", () => {
    const css = gridCss(GRID_RECIPES["holy-grail-areas"]);
    expect(css).toContain('grid-template-areas:\n    "header header header"\n    "nav    main   aside"\n    "footer footer footer";');
    expect(css).toContain(".item-1 {\n  grid-area: header;\n}");
    const s = { ...DEFAULT_GRID, items: [gridItem(1, "x", { column: "span 2" }), gridItem(2, "y")] };
    expect(gridCss({ ...s, items: [s.items[1]] })).not.toContain("span 2");
  });
});

describe("shapes, triangle and glass", () => {
  it("formats polygons", () => {
    expect(polygonCss([[50, 0], [100, 100], [0, 100]])).toBe("polygon(50% 0%, 100% 100%, 0% 100%)");
  });
  it("builds border triangles", () => {
    expect(triangleBorderCss("up", 100, 80, "#f00")).toBe(".triangle {\n  width: 0;\n  height: 0;\n  border-left: 50px solid transparent;\n  border-right: 50px solid transparent;\n  border-bottom: 80px solid #f00;\n}");
  });
  it("glass CSS has the prefixed line and a fallback", () => {
    const css = glassCss(DEFAULT_GLASS);
    expect(css).toContain("-webkit-backdrop-filter: blur(12px) saturate(160%);");
    expect(css).toContain("backdrop-filter: blur(12px) saturate(160%);");
    expect(css).toContain("@supports not");
  });
});
