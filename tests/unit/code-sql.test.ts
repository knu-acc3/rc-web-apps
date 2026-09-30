import { describe, expect, it } from "vitest";
import { DIALECT_PAGES } from "@/sections/code/dialects";
import { SQL_DIALECTS } from "@/sections/code/langs";
import { formatCode } from "@/sections/code/run";

describe("SQL dialect pages", () => {
  it("every page maps to a known dialect", () => {
    const ids = new Set(SQL_DIALECTS.map((d) => d.id));
    for (const d of DIALECT_PAGES) expect(ids.has(d.id), d.slug).toBe(true);
  });
  for (const d of DIALECT_PAGES) {
    it(`${d.label}: example formats and keeps the parameter style`, async () => {
      const sample = d.params && !d.example.includes(d.params) ? `${d.example} and x = ${d.params}` : d.example;
      const r = await formatCode("sql", sample, { indent: "2", dialect: d.id, keywordCase: "upper" });
      expect(r.output).toMatch(/SELECT|INSERT|DELETE|CREATE/);
      if (d.params) expect(r.output).toContain(d.params);
    });
  }
});
