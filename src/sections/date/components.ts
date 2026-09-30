import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "date/age": () => import("./Age"),
  "date/diff": () => import("./DateDiff"),
  "date/add": () => import("./AddDays"),
  "date/weekday": () => import("./Weekday"),
  "date/unix": () => import("./UnixTime"),
  "date/duration": () => import("./DurationCalc"),
  "date/workhours": () => import("./WorkHours"),
};
