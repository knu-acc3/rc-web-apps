import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "http-status/search": () => import("./CodeSearch"),
  "http-status/code": () => import("./CodeCard"),
};
