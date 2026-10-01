import type { ToolDef } from "@/registry/types";
import { ovulationTool } from "../ovulation/def";
import { pregnancyTool } from "../pregnancy/def";
import { sleepTool } from "../sleep/def";

/** Pregnancy, cycle and sleep tools, in hub order. */
export const tools: ToolDef[] = [pregnancyTool, ovulationTool, sleepTool];
