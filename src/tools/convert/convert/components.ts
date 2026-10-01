import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "convert/units": () => import("./UnitConverter"),
};
