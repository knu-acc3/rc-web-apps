import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { components } from "@/sections/what-is-my/components";

/**
 * SSR smoke test: every tool must render on the server without touching
 * browser APIs, showing the neutral "detecting…" state (values are filled in effects).
 */
describe("what-is-my SSR", () => {
  for (const [id, load] of Object.entries(components)) {
    for (const locale of LOCALES) {
      it(`${id} renders on the server (${locale})`, async () => {
        const { default: Tool } = await load();
        const html = renderToString(createElement(Tool, { locale }));
        expect(html.length).toBeGreaterThan(100);
        expect(html).toContain(locale === "ru" ? "Определяем…" : "Detecting…");
        expect(html).toContain("<noscript>");
      });
    }
  }
});
