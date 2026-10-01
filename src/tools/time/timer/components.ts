import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "timer/countdown": () => import("./Timer"),
  "timer/stopwatch": () => import("./Stopwatch"),
  "timer/pomodoro": () => import("./Pomodoro"),
  "timer/alarm": () => import("./Alarm"),
  "timer/interval": () => import("./Interval"),
  "timer/chess": () => import("./ChessClock"),
};
