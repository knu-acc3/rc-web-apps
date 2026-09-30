import { describe, expect, it } from "vitest";

import { normalizeSubmitUrl } from "@/app/api/indexnow/submit/route";

const host = "ulti-tools.com";
const canonical = "https://ulti-tools.com/en/tools/json-formatter";
const allowed = new Set([canonical]);

describe("IndexNow changed URL validation", () => {
  it("accepts an exact HTTPS canonical inventory URL", () => {
    expect(normalizeSubmitUrl(canonical, host, allowed)).toBe(canonical);
  });

  it.each([
    "http://ulti-tools.com/en/tools/json-formatter",
    "https://www.ulti-tools.com/en/tools/json-formatter",
    "https://ulti-tools.com/en/tools/json-formatter?preview=1",
    "https://ulti-tools.com/en/tools/not-in-inventory",
    "https://user:pass@ulti-tools.com/en/tools/json-formatter",
  ])("rejects non-canonical URL %s", (url) => {
    expect(normalizeSubmitUrl(url, host, allowed)).toBeNull();
  });
});
