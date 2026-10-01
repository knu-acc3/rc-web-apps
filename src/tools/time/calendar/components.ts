import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "calendar/year": () => import("./YearCalendar"),
  "calendar/month": () => import("./MonthCalendar"),
  "calendar/week": () => import("./WeekNumber"),
  "calendar/production": () => import("./ProductionCalendar"),
};
