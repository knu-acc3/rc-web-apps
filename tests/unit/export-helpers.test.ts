import { describe, expect, it } from "vitest";

import {
  escapeCsvCellForSpreadsheet,
  sanitizeDownloadFileName,
} from "@/src/utils/exportHelpers";

describe("CSV export hardening", () => {
  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)", "\t=1", "  =1"])(
    "neutralizes spreadsheet formula %j",
    (value) => {
      const cell = escapeCsvCellForSpreadsheet(value);
      const unquoted = cell.startsWith('"')
        ? cell.slice(1, -1).replace(/""/g, '"')
        : cell;
      expect(unquoted.startsWith("'")).toBe(true);
    },
  );

  it("quotes delimiters, quotes and line breaks", () => {
    expect(escapeCsvCellForSpreadsheet('a,"b"\nc')).toBe('"a,""b""\nc"');
  });

  it("leaves ordinary values unchanged", () => {
    expect(escapeCsvCellForSpreadsheet("hello")).toBe("hello");
  });
});

describe("download filename safety", () => {
  it("removes path separators and control characters", () => {
    expect(sanitizeDownloadFileName("../report\u0000/quarter:1.csv")).toBe(
      "-report-quarter-1.csv",
    );
  });

  it("handles empty and reserved Windows names", () => {
    expect(sanitizeDownloadFileName("... ")).toBe("download");
    expect(sanitizeDownloadFileName("CON.txt")).toBe("_CON.txt");
  });
});
