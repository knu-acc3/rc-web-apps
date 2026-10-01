import { createElement, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getSection, resolvePage, sectionPaths } from "@/registry";
import { components } from "@/tools/device/test/components";

/**
 * Server-render every device-test page's tool in both locales. The test runs in
 * Node (no window/navigator/document), so any browser access during render throws.
 */
describe("device tests render on the server", () => {
  const paths = sectionPaths(getSection("test")!);

  for (const locale of LOCALES) {
    it(`all tools and variants render (${locale})`, async () => {
      for (const p of paths) {
        const page = resolvePage(locale, p)!;
        const load = components[page.tool!.id];
        expect(load, page.tool!.id).toBeDefined();
        const { default: Tool } = (await load()) as { default: ComponentType<Record<string, unknown>> };
        const html = renderToString(createElement(Tool, { locale, ...(page.tool!.props ?? {}) }));
        expect(html.length, p.join("/")).toBeGreaterThan(200);
      }
    });
  }

  it("typing test shows a real text in the server HTML", async () => {
    const { default: Tool } = (await components["test/typing"]()) as { default: ComponentType<Record<string, unknown>> };
    const html = renderToString(createElement(Tool, { locale: "ru", seconds: 60 }));
    expect(html).toMatch(/[а-яё]{4,} [а-яё]{4,}/i);
  });
});
