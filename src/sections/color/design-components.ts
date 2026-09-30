import type { ComponentMap } from "../types";

/** Component loaders of the design tools (merged in components.ts). */
export const designComponents: ComponentMap = {
  "color/palette": () => import("./design/Palette"),
  "color/shades": () => import("./design/Shades"),
  "color/gradient": () => import("./design/Gradient"),
  "color/mixer": () => import("./design/Mixer"),
  "color/family": () => import("./design/FamilyPalette"),
  "color/blindness": () => import("./design/Blindness"),
};
