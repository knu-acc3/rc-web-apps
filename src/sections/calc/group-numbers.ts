import type { ToolDef } from "@/registry/types";
import { averageTool } from "./average/def";
import { combinatoricsTool } from "./combinatorics/def";
import { factorialTool } from "./factorial/def";
import { gcdLcmTool } from "./gcd-lcm/def";
import { multiplicationTool } from "./multiplication/def";
import { primeTool } from "./prime/def";
import { proportionTool } from "./proportion/def";
import { ratioTool } from "./ratio/def";
import { roundingTool } from "./rounding/def";
import { exponentTool, logarithmTool, rootTool } from "./rpl/def";

/** Number tools, in hub order. */
export const tools: ToolDef[] = [
  multiplicationTool,
  gcdLcmTool,
  primeTool,
  proportionTool,
  averageTool,
  roundingTool,
  ratioTool,
  rootTool,
  exponentTool,
  logarithmTool,
  factorialTool,
  combinatoricsTool,
];
