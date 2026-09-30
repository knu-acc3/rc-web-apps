import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
import { bacTool } from "./bac/def";
import { bmiTool } from "./bmi/def";
import { bodyFatTool } from "./body-fat/def";
import { caloriesTool } from "./calories/def";
import { heartRateTool } from "./heart-rate/def";
import { idealWeightTool } from "./ideal-weight/def";
import { macrosTool } from "./macros/def";
import { waistToHeightTool } from "./waist-to-height/def";
import { waterTool } from "./water/def";

/** Body metrics tools, in hub order. */
export const tools: ToolDef[] = [bmiTool, idealWeightTool, caloriesTool, macrosTool, bodyFatTool, waistToHeightTool, waterTool, heartRateTool, bacTool];

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
};
