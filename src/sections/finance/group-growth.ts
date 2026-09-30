import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
import { loanTool } from "./loan/def";
import { mortgageTool } from "./mortgage/def";

/** Loans and savings growth tools, in hub order. */
export const tools: ToolDef[] = [loanTool, mortgageTool];

export const components: ComponentMap = {
  "finance/loan": () => import("./loan/Loan"),
  "finance/mortgage": () => import("./mortgage/Mortgage"),
};
