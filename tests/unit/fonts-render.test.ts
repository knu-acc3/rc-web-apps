import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FancyText, { type FancyTextProps } from "@/sections/fonts/FancyText";
import { INVISIBLE } from "@/sections/fonts/invisible";
import { SAMPLE } from "@/sections/fonts/names";
import { STYLE_IDS, stylize } from "@/sections/fonts/styles";

/** Server render: every style is in the HTML and the output is deterministic (hydration-safe). */
const html = (props: FancyTextProps) => renderToString(createElement(FancyText, props));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("FancyText server render", () => {
  for (const locale of ["ru", "en"] as const) {
    it(`renders the sample in all 32 styles (${locale})`, () => {
      const out = html({ locale });
      for (const id of STYLE_IDS) expect(out.includes(esc(stylize(id, SAMPLE[locale]))), id).toBe(true);
      expect(out).toBe(html({ locale }));
    });
  }

  it("variant and platform pages render deterministically", () => {
    for (const props of [{ locale: "ru", style: "zalgo" }, { locale: "en", style: "upside-down" }, { locale: "ru", platform: "x-twitter" }] as FancyTextProps[]) {
      expect(html(props)).toBe(html(props));
    }
    expect(html({ locale: "ru", platform: "x-twitter" })).toContain("по правилам X");
  });

  it("invisible page lists every character", () => {
    const out = html({ locale: "ru", invisible: true });
    for (const c of INVISIBLE) expect(out).toContain(`U+${c.cp.toString(16).toUpperCase().padStart(4, "0")}`);
  });
});
