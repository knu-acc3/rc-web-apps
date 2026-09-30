import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "cron/tool": () => import("./CronTool"),
};
