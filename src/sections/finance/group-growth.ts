import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
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

export const components: ComponentMap = {
  "finance/loan": () => import("./loan/Loan"),
  "finance/mortgage": () => import("./mortgage/Mortgage"),
  "finance/deposit": () => import("./deposit/Deposit"),
  "finance/compound-interest": () => import("./compound-interest/CompoundInterest"),
  "finance/investment": () => import("./investment/Investment"),
  "finance/retirement": () => import("./retirement/Retirement"),
  "finance/savings-goal": () => import("./savings-goal/SavingsGoal"),
  "finance/inflation": () => import("./inflation/Inflation"),
};
