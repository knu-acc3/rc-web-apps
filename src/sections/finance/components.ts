import type { ComponentMap } from "../types";

// Only dynamic imports here: this map is part of the client bundle of every page.
export const components: ComponentMap = {
  "finance/loan": () => import("./loan/Loan"),
  "finance/mortgage": () => import("./mortgage/Mortgage"),
  "finance/deposit": () => import("./deposit/Deposit"),
  "finance/compound-interest": () => import("./compound-interest/CompoundInterest"),
  "finance/investment": () => import("./investment/Investment"),
  "finance/retirement": () => import("./retirement/Retirement"),
  "finance/savings-goal": () => import("./savings-goal/SavingsGoal"),
  "finance/inflation": () => import("./inflation/Inflation"),
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
