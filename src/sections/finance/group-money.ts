import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
import { breakEvenTool } from "./break-even/def";
import { budgetTool } from "./budget/def";
import { discountTool } from "./discount/def";
import { markupMarginTool } from "./markup-margin/def";
import { cagrTool, roiTool } from "./roi/def";
import { salaryKzTool } from "./salary-kz/def";
import { tipTool } from "./tip/def";
import { unitPriceTool } from "./unit-price/def";
import { vatTool } from "./vat/def";

/** Salary, taxes and everyday money tools, in hub order. */
export const tools: ToolDef[] = [salaryKzTool, vatTool, discountTool, tipTool, markupMarginTool, breakEvenTool, roiTool, cagrTool, unitPriceTool, budgetTool];

export const components: ComponentMap = {
  "finance/salary-kz": () => import("./salary-kz/SalaryKz"),
  "finance/vat": () => import("./vat/Vat"),
  "finance/discount": () => import("./discount/Discount"),
  "finance/tip": () => import("./tip/Tip"),
  "finance/markup-margin": () => import("./markup-margin/MarkupMargin"),
  "finance/break-even": () => import("./break-even/BreakEven"),
  "finance/roi": () => import("./roi/RoiCagr"),
  "finance/unit-price": () => import("./unit-price/UnitPrice"),
  "finance/budget": () => import("./budget/Budget"),
};
