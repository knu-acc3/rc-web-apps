import type { ToolDef } from "@/registry/types";
import { equationTool } from "../equation/def";
import { fractionsTool } from "../fractions/def";
import { matrixTool } from "../matrix/def";
import { statisticsTool } from "../statistics/def";

/** Algebra tools, in hub order. */
export const tools: ToolDef[] = [fractionsTool, equationTool, matrixTool, statisticsTool];
