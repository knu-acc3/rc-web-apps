import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { getSection, resolvePage, sectionPaths } from "@/registry";
import { components } from "@/tools/convert/sizes/components";

/** Every sizes page's tool renders on the server with its preset props (SSR answer in HTML, no crash). */
const section = getSection("sizes")!;
const paths = sectionPaths(section);

describe("sizes tools render on the server", () => {
  for (const locale of LOCALES) {
    it(`all pages (${locale})`, async () => {
      const failures: string[] = [];
      for (const p of paths) {
        const page = resolvePage(locale, p)!;
        if (!page.tool) continue;
        const load = components[page.tool.id];
        try {
          const { default: C } = await load();
          const html = renderToString(createElement(C, { locale, ...(page.tool.props ?? {}) }));
          if (!html.includes('aria-live="polite"')) failures.push(`${p.join("/")}: no live result`);
        } catch (e) {
          failures.push(`${p.join("/")}: ${(e as Error).message}`);
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }

  it("variant presets show the variant's answer", async () => {
    const html = async (path: string) => {
      const page = resolvePage("ru", path.split("/"))!;
      const { default: C } = await components[page.tool!.id]();
      return renderToString(createElement(C, { locale: "ru", ...(page.tool!.props ?? {}) }));
    };
    expect(await html("paper-sizes/a4")).toContain("2480 × 3508");
    expect(await html("shoe-size-chart/eu-42")).toMatch(/UK[^]*?>8</);
    expect(await html("clothing-size-chart/women-44")).toContain(">S<");
    expect(await html("ring-size-chart/us-7")).toContain("17,32");
    expect(await html("bra-size-calculator/80e")).toContain("36DD");
    expect(await html("screen-resolutions/3840x2160")).toContain("4K UHD");
    expect(await html("aspect-ratio-calculator/21-9")).toContain("64:27");
    expect(await html("ppi-calculator")).toContain("91,79");
    expect(await html("tv-size-calculator/55-inch")).toContain("1,7–2,3");
  });
});
