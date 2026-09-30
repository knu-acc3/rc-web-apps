import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "countdown/countdown": () => import("./Countdown"),
};
