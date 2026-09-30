import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMPONENTS } from "@/sections/components";

describe("generated tool component map", () => {
  it("is up to date with the section component maps", () => {
    expect(() => execFileSync(process.execPath, ["scripts/gen-tool-components.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });

  it("has exactly the ids of COMPONENTS", () => {
    const src = readFileSync("src/sections/tool-components.ts", "utf8");
    const ids = [...src.matchAll(/^ {2}"([^"]+)": dynamic\(/gm)].map((m) => m[1]).sort();
    expect(ids).toEqual(Object.keys(COMPONENTS).sort());
  });
});
