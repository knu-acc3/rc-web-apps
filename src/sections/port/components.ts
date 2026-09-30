import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "port/search": () => import("./PortSearch"),
  "port/check": () => import("./PortCheck"),
};
