import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
import { loanTool } from "./loan/def";

/** Loans and savings growth tools, in hub order. */
export const tools: ToolDef[] = [loanTool];

export const components: ComponentMap = {
  "finance/loan": () => import("./loan/Loan"),
};
