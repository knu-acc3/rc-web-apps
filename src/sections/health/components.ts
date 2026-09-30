import type { ComponentMap } from "../types";

// Only dynamic imports here: this map is part of the client bundle of every page.
export const components: ComponentMap = {
  "health/bmi": () => import("./bmi/Bmi"),
  "health/ideal-weight": () => import("./ideal-weight/IdealWeight"),
  "health/calories": () => import("./calories/Calories"),
  "health/macros": () => import("./macros/Macros"),
  "health/body-fat": () => import("./body-fat/BodyFat"),
  "health/waist-to-height": () => import("./waist-to-height/WaistToHeight"),
  "health/water": () => import("./water/Water"),
  "health/heart-rate": () => import("./heart-rate/HeartRate"),
  "health/bac": () => import("./bac/Bac"),
  "health/pregnancy": () => import("./pregnancy/Pregnancy"),
  "health/ovulation": () => import("./ovulation/Ovulation"),
  "health/sleep": () => import("./sleep/Sleep"),
};
