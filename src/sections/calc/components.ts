import type { ComponentMap } from "../types";
import * as algebra from "./group-algebra";
import * as expr from "./group-expr";
import * as numbers from "./group-numbers";

export const components: ComponentMap = {
  "calc/percent": () => import("./percent/Percent"),
  ...expr.components,
  ...algebra.components,
  ...numbers.components,
};
