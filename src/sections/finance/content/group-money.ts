import type { ToolDef } from "@/registry/types";
import { breakEvenTool } from "../break-even/def";
import { budgetTool } from "../budget/def";
import { discountTool } from "../discount/def";
import { markupMarginTool } from "../markup-margin/def";
import { cagrTool, roiTool } from "../roi/def";
import { salaryKzTool } from "../salary-kz/def";
import { tipTool } from "../tip/def";
import { unitPriceTool } from "../unit-price/def";
import { vatTool } from "../vat/def";

/** Salary, taxes and everyday money tools, in hub order. */
export const tools: ToolDef[] = [salaryKzTool, vatTool, discountTool, tipTool, markupMarginTool, breakEvenTool, roiTool, cagrTool, unitPriceTool, budgetTool];
