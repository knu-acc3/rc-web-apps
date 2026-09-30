import { describe, expect, it } from "vitest";

import {
  sanitizeHtmlForSvgExport,
  sanitizeSvg,
} from "@/src/utils/htmlSanitization";

describe("export sanitization", () => {
  it("removes executable HTML while preserving layout classes", () => {
    const clean = sanitizeHtmlForSvgExport(
      '<section class="card" onclick="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">x</a></section>',
    );

    expect(clean).toContain('class="card"');
    expect(clean).not.toMatch(/script|onclick|javascript:/i);
  });

  it("removes scripts and event handlers from downloaded SVG", () => {
    const clean = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect onload="alert(1)" width="10" height="10"/></svg>',
    );

    expect(clean).toContain("<svg");
    expect(clean).not.toMatch(/script|onload/i);
  });
});
