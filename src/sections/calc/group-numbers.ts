import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
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

export const components: ComponentMap = {
  "calc/multiplication": () => import("./multiplication/MultiplicationTable"),
  "calc/gcd-lcm": () => import("./gcd-lcm/GcdLcm"),
  "calc/prime": () => import("./prime/Prime"),
  "calc/proportion": () => import("./proportion/Proportion"),
  "calc/average": () => import("./average/Average"),
  "calc/rounding": () => import("./rounding/Rounding"),
  "calc/ratio": () => import("./ratio/Ratio"),
  "calc/rpl": () => import("./rpl/Rpl"),
  "calc/factorial": () => import("./factorial/Factorial"),
  "calc/combinatorics": () => import("./combinatorics/Combinatorics"),
};
