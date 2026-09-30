import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
import { equationTool } from "./equation/def";
import { fractionsTool } from "./fractions/def";
import { matrixTool } from "./matrix/def";
import { statisticsTool } from "./statistics/def";

/** Algebra tools, in hub order. */
export const tools: ToolDef[] = [fractionsTool, equationTool, matrixTool, statisticsTool];

export const components: ComponentMap = {
  "calc/fractions": () => import("./fractions/Fractions"),
  "calc/equation": () => import("./equation/Equation"),
  "calc/matrix": () => import("./matrix/MatrixCalc"),
  "calc/statistics": () => import("./statistics/Statistics"),
};
