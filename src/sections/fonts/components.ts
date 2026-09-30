import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "fonts/generator": () => import("./FancyText"),
};
