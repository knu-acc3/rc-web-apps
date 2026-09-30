import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { resolvePage } from "@/registry";
import Calibrate from "@/sections/actual-size/Calibrate";
import ObjectViewer from "@/sections/actual-size/ObjectViewer";
import Protractor from "@/sections/actual-size/Protractor";
import Ruler from "@/sections/actual-size/Ruler";
import { OBJECTS } from "@/sections/actual-size/objects";

/** Server render (SSR) of every tool: must not touch window/localStorage and must draw at the 96 ppi estimate. */
describe("actual-size SSR", () => {
  it("renders every object page tool with the default scale", () => {
    for (const locale of LOCALES)
      for (const o of OBJECTS) {
        const page = resolvePage(locale, ["actual-size", o.slug])!;
        const html = renderToString(createElement(ObjectViewer, { locale, ...(page.tool!.props as object) } as never));
        expect(html, o.slug).toContain("<svg");
        expect(html, o.slug).toContain(`viewBox="0 0 `);
        // not calibrated on the server: neutral notice, no localStorage access
        expect(html, o.slug).toContain(locale === "ru" ? "96 ppi" : "96 ppi");
      }
  });

  it("draws a bank card 85.6 mm wide at 3.7795 px/mm on the server", () => {
    const page = resolvePage("en", ["actual-size", "bank-card"])!;
    const html = renderToString(createElement(ObjectViewer, { locale: "en", ...(page.tool!.props as object) } as never));
    // viewBox is in millimetres; width is in CSS px → the ratio is px per mm
    const m = html.match(/<svg[^>]*viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*width="([\d.]+)"/);
    expect(m).not.toBeNull();
    expect(Number(m![3]) / Number(m![1])).toBeCloseTo(96 / 25.4, 6);
    // the scene holds a whole-millimetre scale (86 mm) under the 85.6 mm card plus 2.5 mm margins
    expect(Number(m![1])).toBe(91);
  });

  it("renders the root catalogue, rulers, protractor and calibration", () => {
    for (const locale of LOCALES) {
      const root = resolvePage(locale, ["actual-size"])!;
      expect(renderToString(createElement(ObjectViewer, { locale, ...(root.tool!.props as object) } as never))).toContain("<optgroup");
      expect(renderToString(createElement(Ruler, { locale, unit: "cm" }))).toContain("<svg");
      expect(renderToString(createElement(Ruler, { locale, unit: "in" }))).toContain("<svg");
      expect(renderToString(createElement(Protractor, { locale }))).toContain("60°");
      expect(renderToString(createElement(Calibrate, { locale }))).toContain("<svg");
    }
  });
});
