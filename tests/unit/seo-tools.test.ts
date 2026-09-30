import { describe, expect, it } from "vitest";
import { analyze, stem, tokenize } from "@/sections/seo/lib/keywords";
import { buildSchema, faqPairs, isoDuration, missing, openingHours, scriptTag } from "@/sections/seo/lib/jsonld";
import { breadcrumbUrl, truncateToWidth } from "@/sections/seo/lib/serp";
import { buildSitemaps, collectUrls, xmlEscape } from "@/sections/seo/lib/sitemap";
import { buildUtm, parseUtm, utmWarnings } from "@/sections/seo/lib/utm";
import { checkCode, hreflangHtml, hreflangIssues, normalizeCode } from "@/sections/seo/lib/hreflang";
import { htaccess, nextjs, nginx, parsePairs, redirectIssues } from "@/sections/seo/lib/redirects";
import { buildLlmsTxt, extractHeadings, outlineIssues } from "@/sections/seo/lib/outline";

const mono = (s: string) => s.length * 10;

describe("SERP truncation (mock width: 10 px per character)", () => {
  it("keeps text that fits", () => {
    expect(truncateToWidth("Short title", 600, mono)).toEqual({ text: "Short title", truncated: false, width: 110 });
  });
  it("cuts at a word boundary and appends an ellipsis within the limit", () => {
    const r = truncateToWidth("The quick brown fox jumps over the lazy dog", 200, mono);
    expect(r.truncated).toBe(true);
    expect(r.text).toBe("The quick brown ...");
    expect(r.width).toBeLessThanOrEqual(200);
  });
  it("cuts inside a very long word when needed", () => {
    const r = truncateToWidth("Supercalifragilisticexpialidocious", 150, mono);
    expect(r.text).toBe("Supercalifr ...");
    expect(r.width).toBeLessThanOrEqual(150);
  });
  it("respects variable widths", () => {
    const wide = (s: string) => [...s].reduce((a, c) => a + (c === "W" ? 20 : 5), 0);
    const r = truncateToWidth("WWWW iiii WWWW iiii", 100, wide);
    expect(r.width).toBeLessThanOrEqual(100);
  });
  it("formats the breadcrumb URL", () => {
    expect(breadcrumbUrl("https://www.example.com/blog/%D0%BF%D0%BE%D1%81%D1%82")).toEqual({ site: "example.com", path: " › blog › пост" });
  });
});

describe("sitemap.xml", () => {
  it("escapes XML and normalises URLs", () => {
    expect(xmlEscape(`a&b<c>'d"`)).toBe("a&amp;b&lt;c&gt;&apos;d&quot;");
    const c = collectUrls(["https://пример.рф/каталог?a=1&b=2", "https://пример.рф/каталог?a=1&b=2", "ftp://x", "not a url", "/rel"], "https://example.com");
    expect(c.urls[0]).toBe("https://xn--e1afmkfd.xn--p1ai/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3?a=1&b=2");
    expect(c.urls[1]).toBe("https://example.com/rel");
    expect(c.duplicates).toBe(1);
    expect(c.invalid).toEqual(["ftp://x", "not a url"]);
    const { files } = buildSitemaps([c.urls[0]], { lastmod: "2026-09-30" });
    expect(files[0].xml).toContain("<loc>https://xn--e1afmkfd.xn--p1ai/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3?a=1&amp;b=2</loc>");
    expect(files[0].xml).toContain("<lastmod>2026-09-30</lastmod>");
  });
  it("splits by URL count and builds an index", () => {
    const urls = Array.from({ length: 5 }, (_, i) => `https://example.com/p${i}`);
    const { files, index } = buildSitemaps(urls, {}, "https://example.com", 2);
    expect(files.map((f) => [f.name, f.count])).toEqual([
      ["sitemap-1.xml", 2],
      ["sitemap-2.xml", 2],
      ["sitemap-3.xml", 1],
    ]);
    expect(index).toContain("<loc>https://example.com/sitemap-3.xml</loc>");
    expect(buildSitemaps(urls, {}).files).toHaveLength(1);
  });
  it("splits by size", () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://example.com/${"x".repeat(100)}${i}`);
    const { files } = buildSitemaps(urls, {}, "", 50_000, 600);
    expect(files.length).toBeGreaterThan(1);
    for (const f of files) expect(new TextEncoder().encode(f.xml).length).toBeLessThanOrEqual(600);
  });
  it("auto priority by depth", () => {
    const { files } = buildSitemaps(["https://e.com/", "https://e.com/a/b"], { priority: "auto" });
    expect(files[0].xml).toContain("<priority>1.0</priority>");
    expect(files[0].xml).toContain("<priority>0.6</priority>");
  });
});

describe("UTM", () => {
  it("keeps other params and the fragment, replaces old utm", () => {
    expect(buildUtm("https://example.com/p?id=5&utm_source=old#top", { utm_source: "newsletter", utm_medium: "email", utm_campaign: "осень 2026" })).toBe(
      "https://example.com/p?id=5&utm_source=newsletter&utm_medium=email&utm_campaign=%D0%BE%D1%81%D0%B5%D0%BD%D1%8C%202026#top",
    );
  });
  it("leaves ad macros unencoded", () => {
    expect(buildUtm("https://example.com", { utm_source: "yandex", utm_term: "{keyword}", utm_content: "{{banner_id}}" })).toBe("https://example.com?utm_source=yandex&utm_term={keyword}&utm_content={{banner_id}}");
  });
  it("parses and warns", () => {
    expect(parseUtm("https://x.kz/?utm_source=vk&utm_campaign=a%20b")).toEqual({ utm_source: "vk", utm_campaign: "a b" });
    expect(utmWarnings("example.com", { utm_source: "Google", utm_campaign: "a b" })).toEqual(["upper", "spaces", "noScheme"]);
    expect(utmWarnings("https://x.com", { utm_term: "{keyword}" })).toEqual([]);
  });
});

describe("hreflang", () => {
  it("validates codes", () => {
    expect(checkCode("ru")).toBeNull();
    expect(checkCode("en-GB")).toBeNull();
    expect(checkCode("zh-Hant-TW")).toBeNull();
    expect(checkCode("x-default")).toBeNull();
    expect(checkCode("en-UK")).toBe("uk");
    expect(checkCode("en_US")).toBe("format");
    expect(checkCode("RU")).toBeNull();
    expect(checkCode("us")).toBe("language");
    expect(checkCode("es-419")).toBe("region");
    expect(normalizeCode("EN-gb")).toBe("en-GB");
  });
  it("outputs link tags and reports a missing x-default", () => {
    const rows = [
      { code: "ru", url: "https://example.com/ru/" },
      { code: "en", url: "https://example.com/en/" },
    ];
    expect(hreflangHtml(rows)).toBe('<link rel="alternate" hreflang="ru" href="https://example.com/ru/" />\n<link rel="alternate" hreflang="en" href="https://example.com/en/" />');
    expect(hreflangIssues(rows).map((i) => i.issue)).toEqual(["noDefault"]);
  });
});

describe("redirects", () => {
  const { pairs, bad } = parsePairs("/old-page /new-page\nhttps://site.kz/catalog.php?id=5 → /catalog/item-5\n/каталог/ /catalog/\n\nbroken line with three parts");
  it("parses pairs", () => {
    expect(pairs).toHaveLength(3);
    expect(bad).toEqual([5]);
  });
  it("htaccess with escaped patterns and query conditions", () => {
    const h = htaccess(pairs, 301);
    expect(h).toContain("RewriteRule ^old-page/?$ /new-page [R=301,L]");
    expect(h).toContain("RewriteCond %{QUERY_STRING} ^id=5$\nRewriteRule ^catalog\\.php/?$ /catalog/item-5? [R=301,L]");
    expect(h).toContain("RewriteRule ^каталог/?$ /catalog/ [R=301,L]");
  });
  it("nginx map on $request_uri", () => {
    const n = nginx(pairs, 301);
    expect(n).toContain('"/catalog.php?id=5" "/catalog/item-5";');
    expect(n).toContain('"/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3/" "/catalog/";');
    expect(n).toContain("return 301 $redirect_target;");
  });
  it("Next.js redirects with has-query", () => {
    const x = nextjs(pairs, 308);
    expect(x).toContain('source: "/catalog.php"');
    expect(x).toContain('has: [{ type: "query", key: "id", value: "5" }]');
    expect(x).toContain("statusCode: 308");
    expect(nextjs(parsePairs("/a(b) /c").pairs, 301)).toContain('source: "/a\\\\(b\\\\)"');
  });
  it("finds chains and loops", () => {
    expect(redirectIssues(parsePairs("/a /b\n/b /c").pairs)).toEqual([{ kind: "chain", line: 1 }]);
    expect(redirectIssues(parsePairs("/a /b\n/b /a").pairs).map((i) => i.kind)).toEqual(["loop", "loop"]);
    expect(redirectIssues(parsePairs("/a /a").pairs).map((i) => i.kind)).toEqual(["self"]);
  });
});

describe("JSON-LD", () => {
  it("Article uses headline, not name", () => {
    const a = buildSchema("article", { headline: "Как выбрать ноутбук", author: "Анна", published: "2026-09-01T10:00", image: "https://e.com/a.jpg" }, "+05:00");
    expect(a).toMatchObject({ "@context": "https://schema.org", "@type": "Article", headline: "Как выбрать ноутбук", datePublished: "2026-09-01T10:00:00+05:00", image: ["https://e.com/a.jpg"] });
    expect(a).not.toHaveProperty("name");
    expect(a).not.toHaveProperty("publisher");
  });
  it("Product carries a full Offer", () => {
    const p = buildSchema("product", { name: "Чайник", price: "4 990,50", currency: "KZT", availability: "InStock", condition: "NewCondition" });
    expect(p.offers).toEqual({ "@type": "Offer", price: "4990.50", priceCurrency: "KZT", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" });
    expect(missing("product", { name: "x" })).toEqual([["price", "rating"]]);
  });
  it("FAQ, breadcrumbs, hours and durations", () => {
    expect(faqPairs("Q1?\nA1\n\nQ2?\nA2 line 1\nline 2")).toEqual([
      ["Q1?", "A1"],
      ["Q2?", "A2 line 1 line 2"],
    ]);
    const b = buildSchema("breadcrumbs", { items: "Главная | https://e.com/\nБлог | https://e.com/blog/" });
    expect(b.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://e.com/" },
      { "@type": "ListItem", position: 2, name: "Блог", item: "https://e.com/blog/" },
    ]);
    expect(openingHours("Пн-Пт 9:00-18:00\nSa,Su 10.00–16:00")).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday", "Sunday"], opens: "10:00", closes: "16:00" },
    ]);
    expect(isoDuration("90")).toBe("PT1H30M");
    expect(isoDuration("4:05", "ms")).toBe("PT4M5S");
    expect(isoDuration("0")).toBe("PT0M");
  });
  it("escapes </script> inside values", () => {
    expect(scriptTag({ a: "</script><b>" })).toContain('"a": "<\\/script><b>"');
  });
});

describe("keyword density", () => {
  it("normalises ё and drops stop words", () => {
    expect(tokenize("Ёлка и ёж. Ещё")).toEqual([["елка", "и", "еж"], ["еще"]]);
    const a = analyze("Купить ёлку. Купить ёлку недорого! Ёлки и игрушки для ёлки.");
    expect(a.grams[1][0]).toMatchObject({ phrase: "елки", count: 4 });
    expect(a.grams[2][0]).toMatchObject({ phrase: "купить елку", count: 2 });
    expect(a.grams[1].some((g) => g.phrase === "и" || g.phrase === "для")).toBe(false);
    expect(a.words).toBe(10);
    expect(a.nausea).toBe(2);
  });
  it("stems light English and Russian forms", () => {
    expect(stem("tools")).toBe(stem("tool"));
    expect(stem("boxes")).toBe("box");
    expect(stem("книги")).toBe(stem("книга"));
  });
  it("n-grams don't cross sentences", () => {
    const a = analyze("red apple. green apple. red apple. green apple.");
    expect(a.grams[2].map((g) => g.phrase).sort()).toEqual(["green apple", "red apple"]);
  });
});

describe("headings and llms.txt", () => {
  it("extracts headings and flags issues", () => {
    const hs = extractHeadings(`<h2>Intro</h2><script>"<h1>no</h1>"</script><h1 class="t">Main &amp; <b>bold</b></h1><h3><img alt="Logo"></h3><h4></h4><h1>Second</h1>`);
    expect(hs).toEqual([
      { level: 2, text: "Intro" },
      { level: 1, text: "Main & bold" },
      { level: 3, text: "Logo" },
      { level: 4, text: "" },
      { level: 1, text: "Second" },
    ]);
    expect(outlineIssues(hs).map((i) => i.kind).sort()).toEqual(["empty", "firstNotH1", "manyH1", "skip"].sort());
  });
  it("builds llms.txt", () => {
    const r = buildLlmsTxt({ name: "Acme", summary: "Tools for X.", details: "", links: "## Docs\nQuickstart | https://acme.dev/start | Install in 2 minutes\nbad line\n## Optional\nhttps://acme.dev/changelog" });
    expect(r.text).toBe("# Acme\n\n> Tools for X.\n\n## Docs\n\n- [Quickstart](https://acme.dev/start): Install in 2 minutes\n\n## Optional\n\n- [acme.dev/changelog](https://acme.dev/changelog)\n");
    expect(r.bad).toEqual([3]);
  });
});
