import { describe, expect, it } from "vitest";

import {
  buildAllSitemapEntries,
  buildKzEntries,
  buildMainEntries,
  buildToolsEntries,
} from "@/src/seo/sitemapEntries";

import { siteConfig } from "@/src/config/site.config";

describe("canonical sitemap inventory", () => {
  it("contains the exact 50 + 366 + 2 route inventory", () => {
    expect(buildMainEntries()).toHaveLength(50);
    expect(buildToolsEntries()).toHaveLength(366);
    expect(buildKzEntries()).toHaveLength(2);
    expect(buildAllSitemapEntries()).toHaveLength(418);
  });

  it("contains unique canonical HTTPS URLs without trailing slash redirects", () => {
    const entries = buildAllSitemapEntries();
    const urls = entries.map((entry) => entry.url);
    const BASE = siteConfig.baseUrl;

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith(`${BASE}/`))).toBe(true);
    expect(urls.some((url) => url === `${BASE}/ru/`)).toBe(false);
    expect(urls.some((url) => url === `${BASE}/en/`)).toBe(false);
    expect(urls).toContain(`${BASE}/ru`);
    expect(urls).toContain(`${BASE}/en`);
  });

  it("omits unverified dates and crawl hints", () => {
    for (const entry of buildAllSitemapEntries()) {
      expect(entry.lastModified).toBeUndefined();
      expect(entry.changeFrequency).toBeUndefined();
      expect(entry.priority).toBeUndefined();
    }
  });

  it("keeps reciprocal RU, EN and x-default alternates", () => {
    const escapedBase = siteConfig.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const ruRegex = new RegExp(`^${escapedBase}\\/ru(?:\\/|$)`);
    const enRegex = new RegExp(`^${escapedBase}\\/en(?:\\/|$)`);

    for (const entry of buildAllSitemapEntries()) {
      const languages = entry.alternates?.languages;
      expect(languages?.ru).toMatch(ruRegex);
      expect(languages?.en).toMatch(enRegex);
      expect(languages?.["x-default"]).toBe(languages?.ru);
    }
  });
});
