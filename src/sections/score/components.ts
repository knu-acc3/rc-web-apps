import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "score/board": () => import("./Scoreboard"),
  "score/counter": () => import("./Counter"),
};
