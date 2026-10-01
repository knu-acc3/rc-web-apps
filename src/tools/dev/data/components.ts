import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "data/convert": () => import("./DataConvert"),
};
