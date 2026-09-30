import type { ComponentMap } from "../types";
import * as growth from "./group-growth";
import * as money from "./group-money";

export const components: ComponentMap = {
  ...growth.components,
  ...money.components,
};
