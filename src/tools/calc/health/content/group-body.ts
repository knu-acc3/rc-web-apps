import type { ToolDef } from "@/registry/types";
import { bacTool } from "../bac/def";
import { bmiTool } from "../bmi/def";
import { bodyFatTool } from "../body-fat/def";
import { caloriesTool } from "../calories/def";
import { heartRateTool } from "../heart-rate/def";
import { idealWeightTool } from "../ideal-weight/def";
import { macrosTool } from "../macros/def";
import { waistToHeightTool } from "../waist-to-height/def";
import { waterTool } from "../water/def";

/** Body metrics tools, in hub order. */
export const tools: ToolDef[] = [bmiTool, idealWeightTool, caloriesTool, macrosTool, bodyFatTool, waistToHeightTool, waterTool, heartRateTool, bacTool];
