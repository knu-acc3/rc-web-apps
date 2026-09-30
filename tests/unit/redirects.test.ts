import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../../proxy";
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

  it("the proxy runs on every page URL", () => {
    const proxy = readFileSync("proxy.ts", "utf8");
    expect(proxy).toContain('matcher: ["/((?!_next/|og/|fonts/|vendor/|sitemaps/|.*\\\\.[A-Za-z0-9]+$).*)"]');
    expect(LEGACY_ROOTS.length).toBeGreaterThan(0);
  });
});

describe("proxy", () => {
  const go = (path: string) => proxy(new NextRequest(`http://localhost${path}`));
  const location = (path: string) => {
    const res = go(path);
    expect(res.status, path).toBe(301);
    return new URL(res.headers.get("location")!).pathname;
  };

  it("lets known pages through", () => {
    for (const p of ["/ru", "/en", "/ru/merge-pdf", "/en/timer/5-minutes", "/ru/all", "/ru/kilometers-to-miles"]) {
      expect(go(p).headers.get("x-middleware-next"), p).toBe("1");
    }
  });

  it("redirects old and hand-typed URLs", () => {
    expect(location("/ru/tools/merge-pdf")).toBe("/ru/merge-pdf");
    expect(location("/tools/word-counter")).toBe("/ru/word-counter");
    expect(location("/ru/convert")).toBe("/ru/unit-converter");
    expect(location("/en/convert/length")).toBe("/en/length-converter");
    expect(location("/ru/convert/kilometers-to-miles")).toBe("/ru/kilometers-to-miles");
    expect(location("/ru/km-to-miles")).toBe("/ru/kilometers-to-miles");
    expect(location("/ru/kg-to-lb")).toBe("/ru/kilograms-to-pounds");
    expect(location("/ru/Merge-PDF")).toBe("/ru/merge-pdf");
    expect(location("/merge-pdf")).toBe("/ru/merge-pdf");
    expect(location("/RU/timer")).toBe("/ru/timer");
    expect(location("/ru/catalog/22/ai")).toBe("/ru/all");
  });

  it("answers unknown URLs with the 404 page", () => {
    for (const p of ["/ru/no-such-tool", "/en/merge-pdf/nope", "/xx", "/ru/emoji/no-such-emoji", "/ru/404"]) {
      const res = go(p);
      expect(res.status, p).toBe(404);
      expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname, p).toMatch(/^\/(ru|en)\/404$/);
    }
  });
});
