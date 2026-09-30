import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "css/shadow": () => import("./ShadowEditor"),
  "css/radius": () => import("./BorderRadius"),
  "css/animation": () => import("./Animation"),
  "css/flexbox": () => import("./Flexbox"),
  "css/grid": () => import("./Grid"),
  "css/bezier": () => import("./CubicBezier"),
  "css/clip": () => import("./ClipPath"),
  "css/pxrem": () => import("./PxRem"),
  "css/clamp": () => import("./Clamp"),
  "css/triangle": () => import("./Triangle"),
  "css/glass": () => import("./Glass"),
  "css/specificity": () => import("./Specificity"),
};
