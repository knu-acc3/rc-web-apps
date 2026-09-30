import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "code/json": () => import("./JsonFormatter"),
  "code/format": () => import("./FormatterTool"),
  "code/minify": () => import("./Minifier"),
  "code/validate": () => import("./Validator"),
};
