import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "screen/color": () => import("./ScreenColor"),
  "screen/flash": () => import("./FlashingLight"),
  "screen/mirror": () => import("./Mirror"),
  "screen/stuck-pixel": () => import("./StuckPixelFixer"),
  "screen/burn-in": () => import("./BurnInTest"),
  "screen/monitor": () => import("./MonitorTest"),
};
