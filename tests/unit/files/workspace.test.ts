import { describe, expect, it } from "vitest";
import { expired, fitCap, planSync, wsPendingCount, WS_MAX_BYTES, WS_MAX_FILES, WS_TTL } from "@/tools/files/shared/workspace";

describe("workspace: planSync", () => {
  it("adds new ids, removes missing ones and keeps the rest", () => {
    expect(planSync(["a", "b", "c"], ["b", "c", "d"])).toEqual({ add: ["d"], remove: ["a"], same: false });
  });
  it("reports an unchanged set", () => {
    expect(planSync(["a", "b"], ["a", "b"])).toEqual({ add: [], remove: [], same: true });
    expect(planSync([], [])).toEqual({ add: [], remove: [], same: true });
  });
  it("a new order is a change but needs no writes", () => {
    expect(planSync(["a", "b"], ["b", "a"])).toEqual({ add: [], remove: [], same: false });
  });
  it("clearing removes everything; duplicates are written once", () => {
    expect(planSync(["a", "b"], [])).toEqual({ add: [], remove: ["a", "b"], same: false });
    expect(planSync([], ["x", "x"]).add).toEqual(["x"]);
  });
});

describe("workspace: expired", () => {
  const now = 1_800_000_000_000;
  it("keeps records touched within 6 hours", () => {
    expect(expired(now - WS_TTL + 1000, now)).toBe(false);
    expect(expired(now, now)).toBe(false);
  });
  it("drops records older than 6 hours, broken dates and dates far in the future", () => {
    expect(expired(now - WS_TTL - 1, now)).toBe(true);
    expect(expired(0, now)).toBe(true);
    expect(expired(Number.NaN, now)).toBe(true);
    expect(expired(now + WS_TTL + 1, now)).toBe(true);
  });
});

describe("workspace: fitCap", () => {
  it("keeps every file under the cap", () => {
    expect(fitCap([1, 2, 3])).toBe(3);
    expect(fitCap([])).toBe(0);
  });
  it("stops at 60 files", () => {
    expect(fitCap(Array.from({ length: 80 }, () => 1000))).toBe(WS_MAX_FILES);
  });
  it("stops before 300 MB: the files after the cap are not stored", () => {
    const mb = 1024 * 1024;
    expect(fitCap([200 * mb, 90 * mb, 20 * mb, 1 * mb])).toBe(2);
    expect(fitCap([WS_MAX_BYTES + 1, 1])).toBe(0);
    expect(fitCap([5, 5, 5], 10, 12)).toBe(2);
  });
});

describe("workspace: without a browser", () => {
  it("has nothing pending and does not throw", () => {
    expect(wsPendingCount()).toBe(0);
  });
});
