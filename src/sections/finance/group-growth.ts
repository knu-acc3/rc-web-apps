import type { ToolDef } from "@/registry/types";
import { compoundInterestTool } from "./compound-interest/def";
import { depositTool } from "./deposit/def";
import { inflationTool } from "./inflation/def";
import { investmentTool } from "./investment/def";
import { loanTool } from "./loan/def";
import { mortgageTool } from "./mortgage/def";
import { retirementTool } from "./retirement/def";
import { savingsGoalTool } from "./savings-goal/def";

/** Loans and savings growth tools, in hub order. */
export const tools: ToolDef[] = [loanTool, mortgageTool, depositTool, compoundInterestTool, investmentTool, retirementTool, savingsGoalTool, inflationTool];
