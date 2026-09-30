import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "actual-size/object": () => import("./ObjectViewer"),
  "actual-size/calibrate": () => import("./Calibrate"),
  "actual-size/ruler": () => import("./Ruler"),
  "actual-size/protractor": () => import("./Protractor"),
};
