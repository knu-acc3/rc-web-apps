import { describe, expect, it } from "vitest";
import { isAllowed, normalizePath, parseRobots, patternMatches, selectGroup, urlPath } from "@/tools/web/seo/lib/robots";

describe("robots.txt pattern matching", () => {
  it("prefix, * and $", () => {
    expect(patternMatches("/fish", "/fish.html")).toBe(true);
    expect(patternMatches("/fish", "/Fish.asp")).toBe(false);
    expect(patternMatches("/fish*.php", "/fishheads/catfish.php?parameters")).toBe(true);
    expect(patternMatches("/*.php$", "/filename.php")).toBe(true);
    expect(patternMatches("/*.php$", "/filename.php?parameters")).toBe(false);
    expect(patternMatches("/*.php$", "/filename.php5")).toBe(false);
    expect(patternMatches("/*.php", "/folder/filename.php")).toBe(true);
    expect(patternMatches("*", "/anything")).toBe(true);
  });
  it("normalises percent-encoding and non-ASCII", () => {
    expect(normalizePath("/каталог")).toBe("/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3");
    expect(patternMatches("/каталог/", "/%d0%ba%d0%b0%d1%82%d0%b0%d0%bb%d0%be%d0%b3/tv")).toBe(true);
  });
  it("extracts the path and query from URLs", () => {
    expect(urlPath("https://example.com/a/b?x=1#frag")).toBe("/a/b?x=1");
    expect(urlPath("/p?q")).toBe("/p?q");
    expect(urlPath("page")).toBe("/page");
  });
});

describe("robots.txt decisions (Google / RFC 9309)", () => {
  const robots = parseRobots(`# example
User-agent: *
Disallow: /private/
Allow: /private/public
Disallow: /*.pdf$
Disallow:

User-agent: Googlebot
Disallow: /no-google/

User-agent: googlebot-news
Disallow: /

User-agent: Googlebot
Allow: /page
Disallow: /page
Disallow: /tmp

Sitemap: https://example.com/sitemap.xml
`);

  it("longest match wins, Allow wins ties", () => {
    expect(isAllowed(robots, "Bingbot", "/private/x").allowed).toBe(false);
    expect(isAllowed(robots, "Bingbot", "/private/public/page").allowed).toBe(true);
    expect(isAllowed(robots, "Googlebot", "/page").allowed).toBe(true);
    expect(isAllowed(robots, "Googlebot", "/page").rule?.type).toBe("allow");
  });
  it("$ anchors and wildcard", () => {
    expect(isAllowed(robots, "Bingbot", "/docs/file.pdf").allowed).toBe(false);
    expect(isAllowed(robots, "Bingbot", "/docs/file.pdf?v=2").allowed).toBe(true);
  });
  it("merges groups and picks the most specific user agent", () => {
    expect(selectGroup(robots, "Googlebot")?.rules.map((r) => r.path)).toEqual(["/no-google/", "/page", "/page", "/tmp"]);
    expect(isAllowed(robots, "Googlebot", "/tmp/x").allowed).toBe(false);
    expect(isAllowed(robots, "Googlebot", "/private/x").allowed).toBe(true); // googlebot group ignores *
    expect(isAllowed(robots, "Googlebot-Image", "/no-google/a.png").allowed).toBe(false); // falls back to googlebot
    expect(isAllowed(robots, "Googlebot-News", "/anything").allowed).toBe(false);
  });
  it("always allows /robots.txt and collects sitemaps", () => {
    expect(isAllowed(parseRobots("User-agent: *\nDisallow: /"), "x", "/robots.txt").allowed).toBe(true);
    expect(robots.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
  });
  it("allows everything without a matching group", () => {
    expect(isAllowed(parseRobots("User-agent: Yandex\nDisallow: /"), "Googlebot", "/").allowed).toBe(true);
  });
});

describe("robots.txt lint", () => {
  it("flags common mistakes", () => {
    const r = parseRobots("Disallow: /x\nUser-agent: *\nDisallow: admin\nCrawl-delay: 10\nHost: example.com\nSitemap: /sitemap.xml\nNoindex: /y\nDisallow: /");
    expect(r.lint.map((l) => l.code)).toEqual(["noAgent", "badPath", "crawlDelay", "host", "relativeSitemap", "unknown", "blockAll"]);
  });
});
