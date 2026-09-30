import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "dev/chmod": () => import("./ChmodTool"),
  "dev/jwt": () => import("./JwtDecoder"),
  "dev/jwt-encoder": () => import("./JwtEncoder"),
  "dev/url": () => import("./UrlParser"),
  "dev/ua": () => import("./UserAgent"),
  "dev/html-jsx": () => import("./HtmlToJsx"),
  "dev/curl": () => import("./CurlConverter"),
  "dev/escape": () => import("./StringEscape"),
};
