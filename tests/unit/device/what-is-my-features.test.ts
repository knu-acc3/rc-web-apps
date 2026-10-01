import { describe, expect, it } from "vitest";
import { detectEs, detectFeatures, ES_FEATURES, esLevel, FEATURE_GROUPS, FEATURES } from "@/tools/device/what-is-my/lib/features";

describe("feature table", () => {
  it("has a valid shape", () => {
    const ids = FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FEATURES.length).toBeGreaterThanOrEqual(50);
    const groups = new Set(FEATURE_GROUPS.map((g) => g.id));
    for (const f of FEATURES) {
      expect(groups.has(f.group), f.id).toBe(true);
      expect(f.id).toMatch(/^[a-z0-9-]+$/);
      expect(f.name.ru.trim().length, f.id).toBeGreaterThan(2);
      expect(f.name.en.trim().length, f.id).toBeGreaterThan(2);
      expect(typeof f.test).toBe("function");
    }
    for (const g of FEATURE_GROUPS) expect(FEATURES.some((f) => f.group === g.id), g.id).toBe(true);
  });

  it("detectors never throw outside a browser and return booleans", () => {
    const r = detectFeatures();
    expect(Object.keys(r)).toHaveLength(FEATURES.length);
    for (const v of Object.values(r)) expect(typeof v).toBe("boolean");
    // Node has WebAssembly (incl. SIMD and threads) and Intl.
    expect(r.wasm).toBe(true);
    expect(r["wasm-simd"]).toBe(true);
    expect(r["wasm-threads"]).toBe(true);
    expect(r["intl-segmenter"]).toBe(true);
    // No DOM in node.
    expect(r.webgl).toBe(false);
    expect(r["css-has"]).toBe(false);
  });
});

describe("ECMAScript level", () => {
  it("has unique ids and editions in order", () => {
    const ids = ES_FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    const years = ES_FEATURES.filter((f) => f.year > 0).map((f) => f.year);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });

  it("computes the highest fully supported edition", () => {
    const all = Object.fromEntries(ES_FEATURES.map((f) => [f.id, true]));
    expect(esLevel(ES_FEATURES, all)).toBe(2025);
    expect(esLevel(ES_FEATURES, { ...all, "promise-try": false })).toBe(2024);
    expect(esLevel(ES_FEATURES, { ...all, "find-last": false, "promise-try": true })).toBe(2022);
    expect(esLevel(ES_FEATURES, { ...all, "array-includes": false })).toBeNull();
    // Newer-than-2025 features don't affect the level.
    expect(esLevel(ES_FEATURES, { ...all, temporal: false })).toBe(2025);
  });

  it("runs in node", () => {
    const r = detectEs();
    expect(r["array-at"]).toBe(true);
    expect(esLevel(ES_FEATURES, r)).toBeGreaterThanOrEqual(2023);
  });
});
