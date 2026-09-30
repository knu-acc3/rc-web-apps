import { describe, expect, it } from "vitest";
import { chunkPages, evenPages, formatPageRanges, oddPages, parsePageRanges, segmentPages, uniqueSorted } from "@/sections/pdf/engine/ranges";

const pages = (input: string, count = 10) => {
  const r = parsePageRanges(input, count);
  if (!r.ok) throw new Error(`${input}: ${r.error.code} "${r.error.token}"`);
  return r.pages;
};
const error = (input: string, count = 10) => {
  const r = parsePageRanges(input, count);
  return r.ok ? null : r.error;
};

describe("parsePageRanges", () => {
  it("parses single pages and ranges", () => {
    expect(pages("5")).toEqual([5]);
    expect(pages("1-3")).toEqual([1, 2, 3]);
    expect(pages("1-3, 5, 8-")).toEqual([1, 2, 3, 5, 8, 9, 10]);
  });

  it("keeps the given order and duplicates (no forced sorting)", () => {
    expect(pages("5, 1-2")).toEqual([5, 1, 2]);
    expect(pages("3, 1-2, 3")).toEqual([3, 1, 2, 3]);
  });

  it("supports descending ranges", () => {
    expect(pages("5-1")).toEqual([5, 4, 3, 2, 1]);
    expect(pages("10-8, 1")).toEqual([10, 9, 8, 1]);
  });

  it("supports open-ended ranges", () => {
    expect(pages("8-")).toEqual([8, 9, 10]);
    expect(pages("-3")).toEqual([1, 2, 3]);
    expect(pages("10-", 10)).toEqual([10]);
  });

  it("accepts spaces, semicolons, en/em dashes and minus signs", () => {
    expect(pages(" 1 - 3 ;5 ")).toEqual([1, 2, 3, 5]);
    expect(pages("1–3")).toEqual([1, 2, 3]);
    expect(pages("1—2")).toEqual([1, 2]);
    expect(pages("2−4")).toEqual([2, 3, 4]);
    expect(pages("1 3 5")).toEqual([1, 3, 5]);
    expect(pages("1,,2")).toEqual([1, 2]);
  });

  it("reports errors instead of silently dropping pages", () => {
    expect(error("")).toEqual({ code: "empty", token: "" });
    expect(error(" , ")).toEqual({ code: "empty", token: "" });
    expect(error("0")).toEqual({ code: "zero", token: "0" });
    expect(error("11")).toEqual({ code: "out-of-range", token: "11" });
    expect(error("8-12")).toEqual({ code: "out-of-range", token: "8-12" });
    expect(error("abc")?.code).toBe("syntax");
    expect(error("1--3")?.code).toBe("syntax");
    expect(error("-")?.code).toBe("syntax");
    expect(error("1.5")?.code).toBe("syntax");
  });

  it("returns segments for split-by-range", () => {
    const r = parsePageRanges("1-3, 5, 9-", 10);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.segments.map(segmentPages)).toEqual([[1, 2, 3], [5], [9, 10]]);
  });
});

describe("range helpers", () => {
  it("formats page lists compactly and round-trips", () => {
    expect(formatPageRanges([1, 2, 3, 5, 8, 9])).toBe("1-3, 5, 8-9");
    expect(formatPageRanges([4])).toBe("4");
    expect(formatPageRanges([])).toBe("");
    expect(pages(formatPageRanges([1, 2, 3, 7, 10]))).toEqual([1, 2, 3, 7, 10]);
  });

  it("dedupes and sorts for set semantics", () => {
    expect(uniqueSorted([5, 1, 5, 3])).toEqual([1, 3, 5]);
  });

  it("chunks, odd and even pages", () => {
    expect(chunkPages(7, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    expect(chunkPages(4, 2)).toEqual([[1, 2], [3, 4]]);
    expect(chunkPages(3, 1)).toEqual([[1], [2], [3]]);
    expect(oddPages(5)).toEqual([1, 3, 5]);
    expect(evenPages(5)).toEqual([2, 4]);
    expect(evenPages(1)).toEqual([]);
  });
});
