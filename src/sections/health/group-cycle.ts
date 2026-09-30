import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
import { ovulationTool } from "./ovulation/def";
import { pregnancyTool } from "./pregnancy/def";
import { sleepTool } from "./sleep/def";

/** Pregnancy, cycle and sleep tools, in hub order. */
export const tools: ToolDef[] = [pregnancyTool, ovulationTool, sleepTool];

export const components: ComponentMap = {
  "health/pregnancy": () => import("./pregnancy/Pregnancy"),
  "health/ovulation": () => import("./ovulation/Ovulation"),
  "health/sleep": () => import("./sleep/Sleep"),
};
