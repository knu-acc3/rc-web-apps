import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "about/clear-data": () => import("./ClearData"),
};
