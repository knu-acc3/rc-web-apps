import type { ComponentMap } from "../types";
import * as body from "./group-body";
import * as cycle from "./group-cycle";

export const components: ComponentMap = {
  ...body.components,
  ...cycle.components,
};
