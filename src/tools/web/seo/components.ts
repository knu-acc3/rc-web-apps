import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "seo/meta": () => import("./MetaTagGenerator"),
  "seo/og": () => import("./OpenGraphGenerator"),
  "seo/robots": () => import("./RobotsGenerator"),
  "seo/robots-tester": () => import("./RobotsTester"),
  "seo/sitemap": () => import("./SitemapGenerator"),
  "seo/hreflang": () => import("./HreflangGenerator"),
  "seo/utm": () => import("./UtmBuilder"),
  "seo/schema": () => import("./SchemaGenerator"),
  "seo/keywords": () => import("./KeywordDensity"),
  "seo/redirects": () => import("./RedirectGenerator"),
  "seo/llms": () => import("./LlmsTxtGenerator"),
  "seo/headings": () => import("./HeadingChecker"),
};
