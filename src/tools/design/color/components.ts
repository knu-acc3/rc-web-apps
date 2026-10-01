import type { ComponentMap } from "../../types";
import { designComponents } from "./design-components";

export const components: ComponentMap = {
  "color/picker": () => import("./Picker"),
  "color/convert": () => import("./Converter"),
  "color/named": () => import("./NamedColor"),
  "color/contrast": () => import("./Contrast"),
  "color/name": () => import("./NameFinder"),
  "color/named-grid": () => import("./NamedGrid"),
  ...designComponents,
};
