import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LEGACY_REDIRECTS, LEGACY_ROOTS } from "@/config/redirects";
import { resolvePage } from "@/registry";

describe("legacy redirects", () => {
  it("every destination is an existing page", () => {
    const bad = Object.entries(LEGACY_REDIRECTS)
      .filter(([, to]) => to !== "" && !resolvePage("ru", to.split("/")))
      .map(([from, to]) => `${from} → ${to}`);
    expect(bad).toEqual([]);
  });

  it("no legacy path shadows a page of the new site", () => {
    const shadowed = Object.keys(LEGACY_REDIRECTS).filter((from) => resolvePage("ru", from.split("/")));
    expect(shadowed).toEqual([]);
  });

  it("the proxy matcher covers every legacy root", () => {
    const proxy = readFileSync("proxy.ts", "utf8");
    const matcher = proxy.match(/\/\(([a-z|-]+)\)\/:path\*"/)?.[1].split("|") ?? [];
    expect(LEGACY_ROOTS.filter((r) => !matcher.includes(r))).toEqual([]);
  });
});
