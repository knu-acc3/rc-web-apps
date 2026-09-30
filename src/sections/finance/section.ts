import { defineToolSection } from "@/registry/tool-section";
import { guardSection } from "../calc/kit/section-guard";
import * as growth from "./group-growth";
import * as money from "./group-money";

const tools = [...growth.tools, ...money.tools];

export const financeSection = guardSection(
  defineToolSection({
    id: "finance",
    name: { ru: "Финансы", en: "Finance" },
    title: {
      ru: "Финансовые калькуляторы онлайн — кредит, ипотека, вклад, НДС",
      en: "Financial calculators — loan, mortgage, deposit, VAT, salary",
    },
    h1: { ru: "Финансовые калькуляторы", en: "Financial calculators" },
    description: {
      ru: "Финансовые калькуляторы онлайн: кредит и ипотека с графиком платежей, вклад с капитализацией, НДС, зарплата в Казахстане, инфляция, скидки и бюджет.",
      en: "Online finance calculators: loan and mortgage with a payment schedule, deposit with capitalization, VAT, Kazakhstan salary, inflation, discounts and budget.",
    },
    icon: "Wallet",
    hue: 150,
    category: "calc",
    order: 2,
    tools,
    hubBlocks: (locale) => [
      {
        type: "text",
        title:
          locale === "ru"
            ? "О финансовых калькуляторах"
            : "About these calculators",
        paragraphs:
          locale === "ru"
            ? [
                "Калькуляторы показывают не только итог, но и то, как он получен: график платежей по месяцам, начисление процентов по периодам, каждый налог и взнос отдельной строкой. Суммы округляются до тиынов и копеек так же, как в банковских графиках.",
                "Ставки, налоги и курсы меняются, поэтому все константы (МРП, МЗП, ставки НДС и взносов) показаны на странице — сверяйте их с актуальными условиями банка и законодательством. Валюта в калькуляторах — только подпись, курсы не подгружаются.",
              ]
            : [
                "These calculators show how each figure is derived: a month-by-month payment schedule, interest per period, every tax and contribution on its own line. Amounts are rounded to cents the way bank schedules are.",
                "Rates and taxes change, so every constant (Kazakhstan MRP and minimum wage, VAT and contribution rates) is shown on the page — check them against your bank's terms and current law. The currency selector is only a label; no exchange rates are loaded.",
              ],
      },
    ],
  }),
  tools,
);
